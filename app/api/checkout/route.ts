import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { items, customer, successUrl, cancelUrl } = await req.json();
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

    // Build session config — pre-fill customer data if provided
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
            product_id: item.productId,
            name: products.find((p) => p.id === item.productId)?.name_en,
            price: products.find((p) => p.id === item.productId)?.price,
            qty: item.quantity || 1,
            size: item.size || null,
          }))
        ),
      },
    };

    if (customer?.email) {
      sessionConfig.customer_email = customer.email;
    }

    if (customer?.name && customer?.address) {
      // Pre-fill shipping in metadata for the webhook to use
      sessionConfig.metadata.customer_name = customer.name;
      sessionConfig.metadata.shipping_address = JSON.stringify(customer.address);

      // Let Stripe confirm the address (still collect for verification)
      sessionConfig.shipping_address_collection = {
        allowed_countries: ["SK", "CZ", "DE", "AT", "PL", "HU", "US", "GB", "FR", "IT", "ES", "NL", "BE"],
      };
    } else {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ["SK", "CZ", "DE", "AT", "PL", "HU", "US", "GB", "FR", "IT", "ES", "NL", "BE"],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
