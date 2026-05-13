import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase";
import {
  createPacket,
  getPacketTracking,
  getPacketLabel,
  getPacketCourierLabel,
  getPacketCourierNumber,
} from "@/lib/packeta";

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return !!user;
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, orderId, packetId: inputPacketId } = await req.json();
  const admin = createAdminClient();

  // ── Create packet for an order ──
  if (action === "create") {
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const { data: order } = await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.packeta_packet_id) {
      return NextResponse.json({ error: "Packet already created", packetId: order.packeta_packet_id }, { status: 409 });
    }

    const deliveryData = order.shipping_address;
    const deliveryType = order.delivery_type;

    // Prefer stored customer name; fall back to email prefix so the packet
    // always has a non-empty name/surname even for guest checkouts.
    const rawName = order.customer_name || order.customer_email?.split("@")[0] || "Customer";
    const [firstName, ...lastParts] = rawName.trim().split(/\s+/);
    const surname = lastParts.join(" ") || firstName; // Packeta requires both

    try {
      const valueEur = ((order.total || 0) / 100).toFixed(2);

      const packetParams: Parameters<typeof createPacket>[0] = {
        number: order.id.replace(/-/g, "").substring(0, 24), // strip hyphens, keep alphanumeric
        name: firstName,
        surname,
        email: order.customer_email || "",
        phone: order.customer_phone || undefined,
        value: valueEur,
        currency: "EUR",
        weight: 0.5,
      };

      if (deliveryType === "pickup" && deliveryData?.point) {
        packetParams.addressId = Number(deliveryData.point.id);
      } else if (deliveryType === "home_delivery" && deliveryData?.address) {
        packetParams.carrierId = deliveryData.address.carrierId;
        packetParams.street = deliveryData.address.street;
        packetParams.houseNumber = deliveryData.address.houseNumber || undefined;
        packetParams.city = deliveryData.address.city;
        packetParams.zip = deliveryData.address.postcode;
        packetParams.country = (deliveryData.address.country || deliveryData.country || "").toUpperCase();
      }

      const { packetId } = await createPacket(packetParams);

      await admin.from("orders").update({
        packeta_packet_id: packetId,
      }).eq("id", orderId);

      return NextResponse.json({ packetId });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Get tracking status ──
  if (action === "tracking") {
    const pid = inputPacketId || (orderId && (await admin.from("orders").select("packeta_packet_id").eq("id", orderId).single()).data?.packeta_packet_id);
    if (!pid) {
      return NextResponse.json({ error: "No packet ID" }, { status: 400 });
    }

    try {
      const tracking = await getPacketTracking(pid);
      return NextResponse.json({ tracking });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Get label PDF ──
  if (action === "label") {
    const pid = inputPacketId || (orderId && (await admin.from("orders").select("packeta_packet_id, delivery_type").eq("id", orderId).single()).data?.packeta_packet_id);
    const orderData = orderId ? (await admin.from("orders").select("delivery_type").eq("id", orderId).single()).data : null;

    if (!pid) {
      return NextResponse.json({ error: "No packet ID" }, { status: 400 });
    }

    try {
      const isExternal = orderData?.delivery_type === "home_delivery";
      const pdf = isExternal ? await getPacketCourierLabel(pid) : await getPacketLabel(pid);
      return NextResponse.json({ pdf });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Get courier tracking number (HD only) ──
  if (action === "courierNumber") {
    const pid = inputPacketId || (orderId && (await admin.from("orders").select("packeta_packet_id").eq("id", orderId).single()).data?.packeta_packet_id);
    if (!pid) {
      return NextResponse.json({ error: "No packet ID" }, { status: 400 });
    }

    try {
      const courierNumber = await getPacketCourierNumber(pid);

      if (courierNumber && orderId) {
        await admin.from("orders").update({
          packeta_tracking_number: courierNumber,
        }).eq("id", orderId);
      }

      return NextResponse.json({ courierNumber });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
