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
//   GET  /api/admin/newsletter?action=stats                  → list size + breakdown
//   GET  /api/admin/newsletter?action=audience               → recipient count for filter
//   GET  /api/admin/newsletter?action=history                → past campaigns + attribution
//   POST /api/admin/newsletter   { action: "test",    subject, html, text }
//   POST /api/admin/newsletter   { action: "send",    subject, html, text, preheader, audience }
//   DELETE ?id=<subscriberId>                                → GDPR-style hard delete

// Admin reads MUST always reflect the live DB — subscribers unsubscribe
// asynchronously (via email link, Gmail one-click, or Resend webhook),
// and stale CDN/browser caches were causing the admin to keep showing
// people as "confirmed" until the next deploy invalidated the cache.
// Force-dynamic + explicit no-store kills both layers.
export const dynamic     = "force-dynamic";
export const revalidate  = 0;
export const fetchCache  = "force-no-store";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma":        "no-cache",
} as const;

function json(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status:  init?.status ?? 200,
    headers: NO_STORE_HEADERS,
  });
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "info@lexxbrush.eu";

// Resend's batch API caps at 100 emails per call.
const BATCH_SIZE = 100;
// Slow the cadence a touch so we never hit rate caps on big sends.
const BATCH_INTERVAL_MS = 1100;

// 7-day attribution window from `sent_at`.
const ATTRIBUTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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

type Segment = "all" | "buyers" | "non_buyers";

interface AudienceFilter {
  status?:  "confirmed" | "all";
  locale?:  "en" | "sk" | "all";
  segment?: Segment;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fetch the lowercase email set of every customer who has ever placed a
 * non-pending order. Used to build the "buyers" and "non_buyers" segments.
 * At our scale this is a few hundred rows at most — cheap to do per request.
 */
async function getBuyerEmails(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("orders")
    .select("customer_email")
    .neq("status", "pending")
    .neq("status", "test");
  const set = new Set<string>();
  for (const row of data || []) {
    if (row.customer_email) set.add(String(row.customer_email).toLowerCase().trim());
  }
  return set;
}

/**
 * Filter subscribers by the buyer segment in JS — there's no clean way to
 * express "email in (subselect over orders)" in PostgREST without a view.
 */
function applySegment<T extends { email: string }>(
  rows: T[],
  segment: Segment,
  buyers: Set<string>,
): T[] {
  if (segment === "all") return rows;
  if (segment === "buyers") return rows.filter((r) => buyers.has(r.email.toLowerCase()));
  return rows.filter((r) => !buyers.has(r.email.toLowerCase()));
}

/**
 * Compute attribution for a sent campaign. Joins `recipient_emails` (the
 * snapshot we took at send time) against orders placed within 7 days of
 * `sent_at`. Returns `{ revenue: cents, orders }`. Counts only paid+ orders.
 */
async function attributionFor(
  supabase: ReturnType<typeof createAdminClient>,
  campaign: { id: string; sent_at: string | null; recipient_emails: string[] | null },
): Promise<{ revenue: number; orders: number }> {
  if (!campaign.sent_at || !campaign.recipient_emails || campaign.recipient_emails.length === 0) {
    return { revenue: 0, orders: 0 };
  }
  const sentAt   = new Date(campaign.sent_at).toISOString();
  const endAt    = new Date(new Date(campaign.sent_at).getTime() + ATTRIBUTION_WINDOW_MS).toISOString();
  const emailSet = new Set(campaign.recipient_emails.map((e) => e.toLowerCase()));

  const { data: orders } = await supabase
    .from("orders")
    .select("total, customer_email")
    .gte("created_at", sentAt)
    .lt("created_at", endAt)
    .neq("status", "pending")
    .neq("status", "test");

  let revenue = 0;
  let count   = 0;
  for (const o of orders || []) {
    if (!o.customer_email) continue;
    if (emailSet.has(String(o.customer_email).toLowerCase())) {
      revenue += o.total || 0;
      count   += 1;
    }
  }
  return { revenue, orders: count };
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const uid = await verifyAdmin(req);
  if (!uid) {
    return json({ error: "Unauthorized" }, { status: 401 });
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

    return json({
      pending:      pending.count || 0,
      confirmed:    confirmed.count || 0,
      unsubscribed: unsubscribed.count || 0,
      suppressed:   suppressed.count || 0,
    });
  }

  if (action === "audience") {
    const locale  = (url.searchParams.get("locale")  as "en"|"sk"|"all"|null)        || "all";
    const segment = (url.searchParams.get("segment") as Segment | null)              || "all";

    // For segment=all + any locale we can use a fast count-only query.
    if (segment === "all") {
      let q = supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed");
      if (locale !== "all") {
        q = q.eq("locale", locale);
      }
      const { count } = await q;
      return json({ count: count || 0 });
    }

    // For buyer / non_buyer segments we need the email column to intersect
    // with the buyer set. Still fast at our scale.
    let listQuery = supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("status", "confirmed");
    if (locale !== "all") {
      listQuery = listQuery.eq("locale", locale);
    }
    const [{ data: rows }, buyers] = await Promise.all([
      listQuery,
      getBuyerEmails(supabase),
    ]);
    const filtered = applySegment(rows || [], segment, buyers);
    return json({ count: filtered.length });
  }

  if (action === "history") {
    const { data: campaigns } = await supabase
      .from("newsletter_campaigns")
      .select(
        "id, subject, preheader, status, recipient_count, delivered_count, opened_count, clicked_count, bounced_count, complained_count, unsubscribed_count, created_at, sent_at, recipient_emails, audience_filter",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (!campaigns) return json([]);

    // Compute attribution for every campaign in parallel. Each query is
    // bounded by the 7-day window and a small recipient set.
    const withAttribution = await Promise.all(
      campaigns.map(async (c: any) => {
        const att = await attributionFor(supabase, {
          id:               c.id,
          sent_at:          c.sent_at,
          recipient_emails: c.recipient_emails,
        });
        // Don't leak the raw recipient list to the client.
        const { recipient_emails, ...rest } = c;
        return {
          ...rest,
          attribution_revenue_cents: att.revenue,
          attribution_orders:        att.orders,
        };
      }),
    );

    return json(withAttribution);
  }

  if (action === "list") {
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, locale, status, source, created_at, confirmed_at, unsubscribed_at")
      .order("created_at", { ascending: false })
      .limit(500);
    return json(data || []);
  }

  return json({ error: "unknown_action" }, { status: 400 });
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const uid = await verifyAdmin(req);
  if (!uid) {
    return json({ error: "Unauthorized" }, { status: 401 });
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
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.subject || !body.html || !body.text) {
    return json({ error: "missing_fields" }, { status: 400 });
  }
  if (body.subject.length > 200) {
    return json({ error: "subject_too_long" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ── Test send: deliver only to ADMIN_EMAIL, never touch subscriber list.
  if (body.action === "test") {
    try {
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
      return json({ ok: true, sentTo: ADMIN_EMAIL });
    } catch (err) {
      console.error("[admin/newsletter] test send failed:", err);
      return json({ error: "send_failed" }, { status: 500 });
    }
  }

  // ── Real send.
  if (body.action === "send") {
    const audience: AudienceFilter = body.audience || { status: "confirmed", locale: "all", segment: "all" };
    const segment: Segment = audience.segment || "all";

    // Fetch deliverable rows — confirmed, optionally locale-filtered.
    let query = supabase
      .from("newsletter_subscribers")
      .select("id, email, locale, unsub_token")
      .eq("status", "confirmed");
    if (audience.locale && audience.locale !== "all") {
      query = query.eq("locale", audience.locale);
    }
    const { data: baseRecipients, error: fetchErr } = await query;
    if (fetchErr) {
      console.error("[admin/newsletter] recipient fetch failed:", fetchErr);
      return json({ error: "fetch_failed" }, { status: 500 });
    }
    if (!baseRecipients || baseRecipients.length === 0) {
      return json({ error: "no_recipients" }, { status: 400 });
    }

    // Apply segment in JS (buyers / non_buyers).
    const buyers = segment === "all" ? new Set<string>() : await getBuyerEmails(supabase);
    const recipients = applySegment(baseRecipients, segment, buyers);
    if (recipients.length === 0) {
      return json({ error: "no_recipients_after_segment" }, { status: 400 });
    }

    // Snapshot the recipient emails on the campaign row so attribution
    // remains correct even if the subscriber list changes later.
    const recipientEmails = recipients.map((r) => r.email.toLowerCase());

    const { data: campaign, error: campaignErr } = await supabase
      .from("newsletter_campaigns")
      .insert({
        subject:          body.subject,
        preheader:        body.preheader || null,
        html:             body.html,
        audience_filter:  audience,
        sent_by:          uid,
        status:           "sending",
        recipient_count:  recipients.length,
        recipient_emails: recipientEmails,
      })
      .select("id")
      .single();

    if (campaignErr || !campaign) {
      console.error("[admin/newsletter] campaign insert failed:", campaignErr);
      return json({ error: "campaign_create_failed" }, { status: 500 });
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

    return json({
      ok: true,
      campaignId: campaign.id,
      sent:       delivered,
      failed,
    });
  }

  return json({ error: "unknown_action" }, { status: 400 });
}

// ─── DELETE — GDPR hard delete a subscriber row ──────────────────────────────

export async function DELETE(req: NextRequest) {
  const uid = await verifyAdmin(req);
  if (!uid) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return json({ error: "missing_id" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);
  if (error) {
    return json({ error: error.message }, { status: 400 });
  }
  return json({ ok: true });
}
