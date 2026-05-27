import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import {
  getPacketTracking,
  parsePacketStatus,
  getTrackingUrl,
} from "@/lib/packeta";
import { sendOrderShipped } from "@/lib/email/order-shipped";
import { sendOrderDelivered } from "@/lib/email/order-delivered";

// Cap per run so we never exhaust Packeta rate limits or the Vercel 60s budget.
// At ~1 req/order against Packeta (~300ms each), 50 fits comfortably under 30s.
const BATCH_SIZE = 50;

// Orders this old (in days) stop being polled even if still "paid". Packets that
// never moved are usually cancelled at source — manual intervention from there.
const STALE_AFTER_DAYS = 60;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Same auth pattern as /api/cron/export — fail closed if CRON_SECRET is missing.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/packeta-sync] CRON_SECRET not configured - refusing to run");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.PACKETA_API_PASSWORD) {
    return NextResponse.json({ error: "PACKETA_API_PASSWORD not configured" }, { status: 503 });
  }

  const admin   = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

  // Pick the oldest-synced orders first so coverage is fair when batch < backlog.
  const staleCutoff = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 3600 * 1000).toISOString();
  const { data: orders, error } = await admin
    .from("orders")
    .select("id, status, customer_email, customer_name, packeta_packet_id, packeta_status_code, shipped_at, delivered_at, created_at")
    .not("packeta_packet_id", "is", null)
    .in("status", ["paid", "shipped"])
    .gte("created_at", staleCutoff)
    .order("packeta_last_synced_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[cron/packeta-sync] DB query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const summary = {
    scanned:   orders?.length || 0,
    shipped:   0,
    delivered: 0,
    unchanged: 0,
    failed:    0,
  };

  for (const order of orders || []) {
    try {
      const xml     = await getPacketTracking(order.packeta_packet_id!);
      const parsed  = parsePacketStatus(xml);
      const nowIso  = new Date().toISOString();

      // Always record what we saw, even if nothing transitioned.
      const update: Record<string, unknown> = {
        packeta_last_synced_at: nowIso,
        packeta_status_code:    parsed.latestCode,
        packeta_status_text:    parsed.latestText,
      };

      let transitioned: "shipped" | "delivered" | null = null;

      if (parsed.bucket === "delivered" && order.status !== "delivered") {
        update.status       = "delivered";
        update.delivered_at = order.delivered_at || nowIso;
        // Backfill shipped_at if we jumped straight from paid → delivered.
        if (!order.shipped_at) update.shipped_at = nowIso;
        transitioned = "delivered";
      } else if (parsed.bucket === "shipped" && order.status === "paid") {
        update.status     = "shipped";
        update.shipped_at = nowIso;
        transitioned = "shipped";
      }

      const { error: updErr } = await admin.from("orders").update(update).eq("id", order.id);
      if (updErr) {
        console.error("[cron/packeta-sync] update failed for", order.id, updErr);
        summary.failed++;
        continue;
      }

      // Fire emails AFTER the DB commit. If Resend fails the status stays correct
      // and the next run won't re-trigger (transition guard above).
      if (transitioned === "shipped") {
        summary.shipped++;
        if (order.customer_email) {
          await sendOrderShipped({
            orderId:       order.id,
            reference:     order.id.slice(0, 8).toUpperCase(),
            customerEmail: order.customer_email,
            customerName:  order.customer_name || undefined,
            trackingUrl:   getTrackingUrl(order.packeta_packet_id!),
            packetId:      order.packeta_packet_id || undefined,
            siteUrl,
          });
        }
      } else if (transitioned === "delivered") {
        summary.delivered++;
        if (order.customer_email) {
          await sendOrderDelivered({
            orderId:       order.id,
            reference:     order.id.slice(0, 8).toUpperCase(),
            customerEmail: order.customer_email,
            customerName:  order.customer_name || undefined,
            packetId:      order.packeta_packet_id || undefined,
            siteUrl,
          });
        }
      } else {
        summary.unchanged++;
      }
    } catch (err: any) {
      summary.failed++;
      console.error("[cron/packeta-sync] order", order.id, "failed:", err?.message || err);
      // Still mark synced so a permanently-broken packet doesn't block the queue.
      await admin
        .from("orders")
        .update({ packeta_last_synced_at: new Date().toISOString() })
        .eq("id", order.id);
    }
  }

  return NextResponse.json({ success: true, ...summary });
}
