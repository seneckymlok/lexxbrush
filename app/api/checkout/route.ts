import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { stripeShippingOptions, type DeliveryType } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  try {
    const { items, customer, delivery, successUrl, cancelUrl, userId } = await req.json();
    const supabase = createAdminClient();

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
    if (deliveryData) {
      sessionConfig.metadata.delivery_type = deliveryData.type;
      sessionConfig.metadata.delivery_data = JSON.stringify(deliveryData).slice(0, 500);

      // Attach the single shipping rate that matches the delivery method
      // the customer already picked on the checkout page. Free-shipping
      // threshold is evaluated against the cart subtotal.
      sessionConfig.shipping_options = stripeShippingOptions(
        deliveryData.type as DeliveryType,
        subtotalCents,
      );
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
