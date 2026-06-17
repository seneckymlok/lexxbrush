import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { stripeShippingOptions, cartWeightKg, type DeliveryType } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  try {
    const { items, customer, delivery, successUrl, cancelUrl, userId, testToken, newsletterOptIn } = await req.json();
    const supabase = createAdminClient();

    // ── Test mode ────────────────────────────────────────────────────────
    // When the caller passes `testToken` and it matches the server-side
    // CHECKOUT_TEST_TOKEN env var, shipping is waived (€0) so live-key
    // smoke tests don't burn real shipping fees. Cannot be brute-forced
    // (token is compared as-is, server-only env). Has no effect for normal
    // customers - they never know it exists.
    const isTestMode =
      !!testToken &&
      !!process.env.CHECKOUT_TEST_TOKEN &&
      testToken === process.env.CHECKOUT_TEST_TOKEN;

    // Validate products and prices against database
    const requestedIds = items.map((item: any) => item.productId);
    const { data: products } = await supabase
      .from("products")
      .select("id, slug, name_en, price, images, is_sold, category, stock")
      .in("id", requestedIds);

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No valid products found" }, { status: 400 });
    }

    // How many of a product we can actually sell right now: 0 if sold or out of
    // stock, otherwise the requested quantity clamped to tracked stock.
    const availableQty = (product: any, requested: number): number => {
      if (!product || product.is_sold) return 0;
      if (typeof product.stock === "number") {
        return product.stock <= 0 ? 0 : Math.min(requested, product.stock);
      }
      return requested; // untracked stock = unlimited
    };

    // One validated, clamped list drives the line items, the Stripe metadata,
    // and the shipping weight - so the charge, the stored order, and the
    // webhook's stock decrement all reference the same quantities.
    const validated = items
      .map((item: any) => {
        const product = products.find((p) => p.id === item.productId);
        return { item, product, qty: availableQty(product, item.quantity || 1) };
      })
      .filter((v: any) => v.product && v.qty > 0);

    if (validated.length === 0) {
      return NextResponse.json({ error: "No available products in cart" }, { status: 400 });
    }

    // Build line items from verified database prices (security)
    const lineItems = validated.map(({ product, qty }: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: product.name_en,
          images: product.images?.slice(0, 1) || [],
        },
        unit_amount: product.price,
      },
      quantity: qty,
    }));

    // Cart subtotal (cents) - used to evaluate the free-shipping threshold.
    const subtotalCents = (lineItems as Array<{
      price_data: { unit_amount: number };
      quantity: number;
    }>).reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity, 0);

    // Cart weight (kg) - sums per-category defaults from the Packeta pricelist
    // so the shipping rate matches the actual carrier cost.
    const weightKg = cartWeightKg(
      validated.map(({ product, qty }: any) => ({
        category: product?.category ?? null,
        quantity: qty,
      })),
    );

    // Build compact delivery data for Stripe metadata (500 char limit per value)
    const deliveryData = delivery?.type === "pickup" && delivery.point
      ? {
          type: "pickup" as const,
          country: delivery.country,
          point: {
            id: delivery.point.id,
            name: delivery.point.name,
            street: delivery.point.street,
            city: delivery.point.city,
            zip: delivery.point.zip,
            country: delivery.point.country,
            carrierId: delivery.point.carrierId,
            carrierPickupPointId: delivery.point.carrierPickupPointId,
          },
        }
      : delivery?.type === "home_delivery" && delivery.address
      ? {
          type: "home_delivery" as const,
          country: delivery.country,
          address: delivery.address,
        }
      : null;

    // Build session config.
    //
    // We deliberately do NOT set `payment_method_types`. Omitting it switches
    // Stripe Checkout into "dynamic payment methods" mode - Stripe shows
    // every method enabled in Dashboard → Settings → Payment methods that's
    // eligible for the customer's country, currency, and cart total. This is
    // how Apple Pay, Google Pay, Link, Klarna, SEPA, iDEAL etc. light up as
    // "Express Checkout" buttons above the card form. With `["card"]` set
    // we'd force the card form only and suppress every wallet.
    //
    // NO Stripe Tax / no automatic_tax / no tax_behavior - Lexxbrush is
    // registered under §7a of the Slovak VAT Act, which means we have an
    // IČ DPH for cross-border B2B reverse-charge purposes only and we are
    // NOT a VAT payer (§4) on our own sales. Invoices to customers MUST
    // NOT contain a VAT line. The "Neplatca DPH" disclaimer lives in the
    // Stripe Dashboard invoice template footer instead.
    const sessionConfig: any = {
      mode: "payment",
      invoice_creation: { enabled: true },
      allow_promotion_codes: true,
      line_items: lineItems,
      success_url: successUrl || `${req.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.nextUrl.origin}/checkout`,
      metadata: {
        // product_ids and items stay index-aligned (the webhook zips them by
        // position) and both come from `validated`, so sold-out items are gone.
        product_ids: JSON.stringify(validated.map((v: any) => v.item.productId)),
        items: JSON.stringify(
          validated.map(({ item, product, qty }: any) => ({
            id: item.productId.slice(0, 8),
            n: (product?.name_en || "").slice(0, 20),
            q: qty,
            s: item.size || "",
          }))
        ).slice(0, 500),
      },
    };

    if (userId) {
      sessionConfig.metadata.user_id = userId;
    }

    if (customer?.email) {
      sessionConfig.customer_email = customer.email;
    }

    if (customer?.name) {
      sessionConfig.metadata.customer_name = customer.name;
    }
    if (customer?.phone) {
      sessionConfig.metadata.customer_phone = customer.phone;
    }
    if (newsletterOptIn === true) {
      // Read by the Stripe webhook to subscribe the customer AFTER a
      // successful payment (so abandoned carts don't pollute the list).
      sessionConfig.metadata.newsletter_opt_in = "true";
    }
    // Persist cart weight in metadata so the Stripe webhook can pass the same
    // value to Packeta when creating the packet (instead of hardcoding 0.5 kg).
    sessionConfig.metadata.cart_weight_kg = weightKg.toFixed(2);

    if (deliveryData) {
      sessionConfig.metadata.delivery_type = deliveryData.type;
      sessionConfig.metadata.delivery_data = JSON.stringify(deliveryData).slice(0, 500);

      if (isTestMode) {
        // Test mode → expose a single free shipping rate so the order still
        // captures the delivery method but doesn't charge anything for it.
        sessionConfig.shipping_options = [
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: { amount: 0, currency: "eur" },
              display_name: "TEST - Free shipping",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 1 },
                maximum: { unit: "business_day" as const, value: 3 },
              },
            },
          },
        ];
        sessionConfig.metadata.test_mode = "true";
      } else {
        // Normal flow: weight-based Packeta pricing for the chosen method.
        sessionConfig.shipping_options = stripeShippingOptions(
          deliveryData.type as DeliveryType,
          subtotalCents,
          weightKg,
        );
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
