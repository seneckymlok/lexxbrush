import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { sendNewsletterCampaign } from "@/lib/email/newsletter";

// ─── Admin newsletter operations ─────────────────────────────────────────────
//
// All routes here require an authenticated Supabase user (Bearer token in
// Authorization header). The /admin section restricts to admin users at the
// app layer.
//
// Endpoints:
//   GET  /api/admin/newsletter?action=stats        → list size + breakdown
//   GET  /api/admin/newsletter?action=audience     → recipient count for filter
//   GET  /api/admin/newsletter?action=history      → past campaigns
//   POST /api/admin/newsletter   { action: "test",    subject, html, text, locale }
//   POST /api/admin/newsletter   { action: "send",    subject, html, text, preheader, audience }
//   DELETE ?id=<subscriberId>                      → GDPR-style hard delete

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "info@lexxbrush.eu";

// Resend's batch API caps at 100 emails per call.
const BATCH_SIZE = 100;
// Slow the cadence a touch so we never hit rate caps on big sends.
const BATCH_INTERVAL_MS = 1100;

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id || null;
}

interface AudienceFilter {
  status?: "confirmed" | "all";
  locale?: "en" | "sk" | "all";
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const uid = await verifyAdmin(req);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "stats";
  const supabase = createAdminClient();

  if (action === "stats") {
    const [pending, confirmed, unsubscribed, suppressed] = await Promise.all([
      supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
      supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
      supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).in("status", ["bounced", "complained"]),
    ]);

    return NextResponse.json({
      pending:      pending.count || 0,
      confirmed:    confirmed.count || 0,
      unsubscribed: unsubscribed.count || 0,
      suppressed:   suppressed.count || 0,
    });
  }

  if (action === "audience") {
    const locale = (url.searchParams.get("locale") as "en"|"sk"|"all"|null) || "all";
    let q = supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed");
    if (locale !== "all") {
      q = q.eq("locale", locale);
    }
    const { count } = await q;
    return NextResponse.json({ count: count || 0 });
  }

  if (action === "history") {
    const { data } = await supabase
      .from("newsletter_campaigns")
      .select("id, subject, preheader, status, recipient_count, delivered_count, opened_count, clicked_count, bounced_count, complained_count, unsubscribed_count, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json(data || []);
  }

  if (action === "list") {
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, locale, status, source, created_at, confirmed_at, unsubscribed_at")
      .order("created_at", { ascending: false })
      .limit(500);
    return NextResponse.json(data || []);
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const uid = await verifyAdmin(req);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    action:     "test" | "send";
    subject:    string;
    preheader?: string;
    html:       string;
    text:       string;
    audience?:  AudienceFilter;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.subject || !body.html || !body.text) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (body.subject.length > 200) {
    return NextResponse.json({ error: "subject_too_long" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ── Test send: deliver only to ADMIN_EMAIL, never touch subscriber list.
  if (body.action === "test") {
    try {
      // Build a one-off "dry" send. We bypass the campaign row entirely.
      // The unsub token here is a throwaway — it won't match any real row,
      // but the link still renders for layout validation.
      const fakeUnsub = "test-token-not-real";
      await sendNewsletterCampaign({
        subscriberId: "test",
        email:        ADMIN_EMAIL,
        locale:       "en",
        subject:      `[TEST] ${body.subject}`,
        preheader:    body.preheader,
        bodyHtml:     body.html,
        bodyText:     body.text,
        unsubToken:   fakeUnsub,
        siteUrl:      SITE_URL,
      });
      return NextResponse.json({ ok: true, sentTo: ADMIN_EMAIL });
    } catch (err) {
      console.error("[admin/newsletter] test send failed:", err);
      return NextResponse.json({ error: "send_failed" }, { status: 500 });
    }
  }

  // ── Real send.
  if (body.action === "send") {
    const audience = body.audience || { status: "confirmed", locale: "all" };

    // Fetch recipient list — only confirmed, optionally locale-filtered.
    let query = supabase
      .from("newsletter_subscribers")
      .select("id, email, locale, unsub_token")
      .eq("status", "confirmed");
    if (audience.locale && audience.locale !== "all") {
      query = query.eq("locale", audience.locale);
    }
    const { data: recipients, error: fetchErr } = await query;
    if (fetchErr) {
      console.error("[admin/newsletter] recipient fetch failed:", fetchErr);
      return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
    }
    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: "no_recipients" }, { status: 400 });
    }

    // Create campaign row.
    const { data: campaign, error: campaignErr } = await supabase
      .from("newsletter_campaigns")
      .insert({
        subject:         body.subject,
        preheader:       body.preheader || null,
        html:            body.html,
        audience_filter: audience,
        sent_by:         uid,
        status:          "sending",
        recipient_count: recipients.length,
      })
      .select("id")
      .single();

    if (campaignErr || !campaign) {
      console.error("[admin/newsletter] campaign insert failed:", campaignErr);
      return NextResponse.json({ error: "campaign_create_failed" }, { status: 500 });
    }

    // Fire off sends in batches. We deliberately wait between batches so we
    // never trip Resend's rate limit (2 req/s on the lowest tier). For a
    // 1,000-person list this finishes inside ~11 seconds.
    let delivered = 0;
    let failed    = 0;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const slice = recipients.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        slice.map((r) =>
          sendNewsletterCampaign({
            subscriberId: r.id,
            campaignId:   campaign.id,
            email:        r.email,
            locale:       (r.locale === "sk" ? "sk" : "en"),
            subject:      body.subject,
            preheader:    body.preheader,
            bodyHtml:     body.html,
            bodyText:     body.text,
            unsubToken:   r.unsub_token,
            siteUrl:      SITE_URL,
          }),
        ),
      );
      for (const r of results) {
        if (r.status === "fulfilled") delivered++;
        else failed++;
      }
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((res) => setTimeout(res, BATCH_INTERVAL_MS));
      }
    }

    await supabase
      .from("newsletter_campaigns")
      .update({
        status:  failed === recipients.length ? "failed" : "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    return NextResponse.json({
      ok: true,
      campaignId: campaign.id,
      sent:       delivered,
      failed,
    });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}

// ─── DELETE — GDPR hard delete a subscriber row ──────────────────────────────

export async function DELETE(req: NextRequest) {
  const uid = await verifyAdmin(req);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
