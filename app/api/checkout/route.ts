import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { stripeShippingOptions, type DeliveryType } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  try {
    const { items, customer, delivery, successUrl, cancelUrl, userId, testToken, newsletterOptIn } = await req.json();
    const supabase = createAdminClient();

    // ── Test mode ────────────────────────────────────────────────────────
    // When the caller passes `testToken` and it matches the server-side
    // CHECKOUT_TEST_TOKEN env var, shipping is waived (€0) so live-key
    // smoke tests don't burn real shipping fees. Cannot be brute-forced
    // (token is compared as-is, server-only env). Has no effect for normal
    // customers — they never know it exists.
    const isTestMode =
      !!testToken &&
      !!process.env.CHECKOUT_TEST_TOKEN &&
      testToken === process.env.CHECKOUT_TEST_TOKEN;

    // Validate products and prices against database
    const productIds = items.map((item: any) => item.productId);
    const { data: products } = await supabase
      .from("products")
      .select("id, slug, name_en, price, images, is_sold")
      .in("id", productIds);

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No valid products found" }, { status: 400 });
    }

    // Build line items from verified database prices (security)
    const lineItems = items
      .map((item: any) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product || product.is_sold) return null;

        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: product.name_en,
              images: product.images?.slice(0, 1) || [],
            },
            unit_amount: product.price,
          },
          quantity: item.quantity || 1,
        };
      })
      .filter(Boolean);

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "No available products in cart" }, { status: 400 });
    }

    // Cart subtotal (cents) — used to evaluate the free-shipping threshold.
    const subtotalCents = (lineItems as Array<{
      price_data: { unit_amount: number };
      quantity: number;
    }>).reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity, 0);

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

    // Build session config
    const sessionConfig: any = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: successUrl || `${req.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.nextUrl.origin}/checkout`,
      metadata: {
        product_ids: JSON.stringify(productIds),
        items: JSON.stringify(
          items.map((item: any) => ({
            id: item.productId.slice(0, 8),
            n: (products.find((p) => p.id === item.productId)?.name_en || "").slice(0, 20),
            q: item.quantity || 1,
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
              display_name: "TEST — Free shipping",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 1 },
                maximum: { unit: "business_day" as const, value: 3 },
              },
            },
          },
        ];
        sessionConfig.metadata.test_mode = "true";
      } else {
        // Normal flow: real shipping rate based on the delivery method.
        sessionConfig.shipping_options = stripeShippingOptions(
          deliveryData.type as DeliveryType,
          subtotalCents,
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
