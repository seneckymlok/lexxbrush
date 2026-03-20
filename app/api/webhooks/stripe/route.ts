import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const supabase = createAdminClient();

    try {
      const items = JSON.parse(session.metadata?.items || "[]");
      const productIds = JSON.parse(session.metadata?.product_ids || "[]");

      // Create order in database
      await supabase.from("orders").insert({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        customer_email: session.customer_details?.email,
        items,
        total: session.amount_total,
        status: "paid",
        shipping_address: session.shipping_details?.address || null,
      });

      // Mark one-of-a-kind products as sold
      for (const id of productIds) {
        const { data: product } = await supabase
          .from("products")
          .select("is_one_of_a_kind")
          .eq("id", id)
          .single();

        if (product?.is_one_of_a_kind) {
          await supabase
            .from("products")
            .update({ is_sold: true })
            .eq("id", id);
        }
      }
    } catch (err) {
      console.error("Error processing webhook:", err);
    }
  }

  return NextResponse.json({ received: true });
}
