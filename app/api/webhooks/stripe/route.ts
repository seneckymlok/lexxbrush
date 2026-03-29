import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { createPacket } from "@/lib/packeta";

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
      const deliveryType = session.metadata?.delivery_type || null;
      const deliveryData = session.metadata?.delivery_data
        ? JSON.parse(session.metadata.delivery_data)
        : null;
      const customerName = session.metadata?.customer_name || "";
      const customerPhone = session.metadata?.customer_phone || "";

      // Create order in database with Packeta delivery info
      const { data: order } = await supabase.from("orders").insert({
        stripe_session_id: session.id,
        user_id: session.metadata?.user_id || null,
        stripe_payment_intent: session.payment_intent,
        customer_email: session.customer_details?.email,
        items,
        total: session.amount_total,
        status: "paid",
        shipping_address: deliveryData || session.shipping_details?.address || null,
        delivery_type: deliveryType,
      }).select("id").single();

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

      // Auto-create Packeta packet after payment
      if (deliveryData && order?.id) {
        try {
          const [firstName, ...lastParts] = customerName.split(" ");
          const surname = lastParts.join(" ") || firstName;
          const valueEur = ((session.amount_total || 0) / 100).toFixed(2);

          const packetParams: Parameters<typeof createPacket>[0] = {
            number: order.id.substring(0, 24),
            name: firstName,
            surname,
            email: session.customer_details?.email || "",
            phone: customerPhone || undefined,
            value: valueEur,
            currency: "EUR",
            weight: 0.5,
          };

          if (deliveryType === "pickup" && deliveryData.point) {
            packetParams.addressId = deliveryData.point.id;
          } else if (deliveryType === "home_delivery" && deliveryData.address) {
            packetParams.carrierId = deliveryData.address.carrierId;
            packetParams.street = deliveryData.address.street;
            packetParams.houseNumber = deliveryData.address.houseNumber;
            packetParams.city = deliveryData.address.city;
            packetParams.zip = deliveryData.address.postcode;
          }

          const { packetId } = await createPacket(packetParams);

          await supabase.from("orders").update({
            packeta_packet_id: packetId,
          }).eq("id", order.id);

          console.log(`Packeta packet created: ${packetId} for order ${order.id}`);
        } catch (packetaError) {
          // Don't fail the webhook — order is still valid, admin can retry manually
          console.error("Packeta packet creation failed:", packetaError);
        }
      }
    } catch (err) {
      console.error("Error processing webhook:", err);
    }
  }

  return NextResponse.json({ received: true });
}
