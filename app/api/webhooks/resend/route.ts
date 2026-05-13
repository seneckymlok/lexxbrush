import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase";

// ─── Resend webhook ─────────────────────────────────────────────────────────
//
// Receives delivery events from Resend so the suppression list stays clean
// (bounces, complaints) and campaign stats stay current (delivered/opened/
// clicked/unsubscribed).
//
// Configure in Resend dashboard → Webhooks → endpoint URL:
//   https://lexxbrush.eu/api/webhooks/resend
// Enable: email.sent, email.delivered, email.bounced, email.complained,
//         email.opened, email.clicked, email.unsubscribed (if available).
//
// Resend signs requests via Svix-compatible headers:
//   svix-id, svix-timestamp, svix-signature
// The secret comes from the dashboard ("Signing secret"), set as
// RESEND_WEBHOOK_SECRET.
//
// We fall back to a plain-HMAC verification path for older webhook
// configurations that don't use Svix.

const SECRET = process.env.RESEND_WEBHOOK_SECRET || "";

// Hardens against accidental misconfiguration — if no secret is set at all,
// refuse every request. We never want unsigned webhook bodies in prod.
function requireSecret() {
  if (!SECRET || SECRET === "whsec_placeholder") {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET not set");
    return false;
  }
  return true;
}

/** Verify with Svix (Resend's standard). Returns parsed payload or null. */
function verifySvix(req: NextRequest, body: string): any | null {
  const svixId   = req.headers.get("svix-id");
  const svixTs   = req.headers.get("svix-timestamp");
  const svixSig  = req.headers.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) return null;
  try {
    const wh = new Webhook(SECRET);
    return wh.verify(body, {
      "svix-id":        svixId,
      "svix-timestamp": svixTs,
      "svix-signature": svixSig,
    });
  } catch (err) {
    console.error("[resend-webhook] svix verify failed:", (err as Error).message);
    return null;
  }
}

/** Fallback HMAC-SHA256 verification (timing-safe). */
function verifyHmac(req: NextRequest, body: string): any | null {
  const sig = req.headers.get("resend-signature") || req.headers.get("x-resend-signature");
  if (!sig) return null;
  const mac = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(sig.replace(/^sha256=/, ""));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!requireSecret()) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const raw = await req.text();
  const evt = verifySvix(req, raw) || verifyHmac(req, raw);
  if (!evt) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const type:  string         = evt.type || "";
  const data:  any            = evt.data || {};
  const to:    string | string[] | undefined = data.to;
  const recipient = Array.isArray(to) ? to[0] : to;
  const campaignId: string | undefined =
    data.headers?.["X-Campaign-ID"] || data.headers?.["x-campaign-id"];

  if (!recipient) {
    // Nothing actionable; ack so Resend doesn't retry.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = createAdminClient();
  const email = recipient.toLowerCase();
  const now   = new Date().toISOString();

  // ── Hard suppression events. ──────────────────────────────────────────────
  if (type === "email.bounced" || type === "email.complained") {
    const newStatus = type === "email.bounced" ? "bounced" : "complained";
    await supabase
      .from("newsletter_subscribers")
      .update({
        status:           newStatus,
        last_event_at:    now,
        last_event_note:  `${type}: ${data.bounce?.type || data.reason || ""}`.slice(0, 200),
        unsubscribed_at:  type === "email.complained" ? now : undefined,
      })
      .eq("email", email);

    if (campaignId) {
      const column = type === "email.bounced" ? "bounced_count" : "complained_count";
      await incrementCampaignCounter(supabase, campaignId, column);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Soft unsubscribe (List-Unsubscribe). ───────────────────────────────────
  if (type === "email.unsubscribed") {
    await supabase
      .from("newsletter_subscribers")
      .update({
        status:          "unsubscribed",
        unsubscribed_at: now,
        last_event_at:   now,
        last_event_note: "resend:unsubscribed",
      })
      .eq("email", email);

    if (campaignId) {
      await incrementCampaignCounter(supabase, campaignId, "unsubscribed_count");
    }
    return NextResponse.json({ ok: true });
  }

  // ── Campaign counters (delivered, opened, clicked). ────────────────────────
  if (campaignId) {
    const map: Record<string, string> = {
      "email.delivered": "delivered_count",
      "email.opened":    "opened_count",
      "email.clicked":   "clicked_count",
    };
    const column = map[type];
    if (column) {
      await incrementCampaignCounter(supabase, campaignId, column);
    }
  }

  return NextResponse.json({ ok: true });
}

async function incrementCampaignCounter(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string,
  column: string,
) {
  // Read-then-write — fine at our scale; webhook events arrive serially per
  // campaign and the counter is informational, not transactional.
  const { data } = await supabase
    .from("newsletter_campaigns")
    .select(column)
    .eq("id", campaignId)
    .maybeSingle();
  if (!data) return;
  const current = ((data as unknown) as Record<string, number>)[column] || 0;
  await supabase
    .from("newsletter_campaigns")
    .update({ [column]: current + 1 })
    .eq("id", campaignId);
}
