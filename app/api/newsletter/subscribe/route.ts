import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase";
import { sendNewsletterConfirm } from "@/lib/email/newsletter";

// ─── Public newsletter signup endpoint ──────────────────────────────────────
//
// Accepts: { email, locale?, source?, userId? }
// Behavior:
//   • Validates email shape.
//   • Upserts a `newsletter_subscribers` row.
//   • If row already exists:
//       – status='confirmed'    → return 200 { alreadySubscribed: true }
//       – status='unsubscribed' → re-open: status='pending', new tokens, resend confirm.
//       – status='bounced'/'complained' → silently 200 (don't expose suppression list)
//       – status='pending'      → resend the confirm email (idempotent retry).
//   • Otherwise inserts a fresh pending row + sends confirm email.
//
// We never reveal whether an email is already on the list — same response
// shape for "new signup" and "existing confirmed" — to avoid leaking the
// subscriber list via signup form probing.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

function token() {
  return crypto.randomBytes(32).toString("base64url");
}

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: NextRequest) {
  let payload: {
    email?:   string;
    locale?:  string;
    source?:  string;
    userId?:  string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (payload.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const locale  = payload.locale === "sk" ? "sk" : "en";
  const source  = (payload.source || "unknown").slice(0, 64);
  const userId  = payload.userId || null;

  const supabase = createAdminClient();

  // Look up existing row first so we can branch cleanly.
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, status, confirm_token, unsub_token, locale")
    .eq("email", email)
    .maybeSingle();

  // ── Already confirmed → silently succeed.
  if (existing?.status === "confirmed") {
    return NextResponse.json({ ok: true });
  }

  // ── Suppressed (bounced/complained) → silently succeed (don't tell signup
  //    flows about the suppression list).
  if (existing && (existing.status === "bounced" || existing.status === "complained")) {
    return NextResponse.json({ ok: true });
  }

  // ── Pending or previously unsubscribed → rotate tokens and resend.
  if (existing) {
    const newConfirm = token();
    const newUnsub   = token();

    const { error: updateErr } = await supabase
      .from("newsletter_subscribers")
      .update({
        status:         "pending",
        confirm_token:  newConfirm,
        unsub_token:    newUnsub,
        locale,
        source,
        user_id:        userId,
        consent_ip:     clientIp(req),
        consent_source: source,
        created_at:     new Date().toISOString(),
        confirmed_at:   null,
        unsubscribed_at: null,
      })
      .eq("id", existing.id);

    if (updateErr) {
      console.error("[newsletter/subscribe] update failed:", updateErr);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    try {
      await sendNewsletterConfirm({
        email,
        locale,
        confirmToken: newConfirm,
        siteUrl:      SITE_URL,
      });
    } catch (err) {
      console.error("[newsletter/subscribe] confirm email failed:", err);
      // Row is updated; admin can retry. Still report ok so we don't leak.
    }

    return NextResponse.json({ ok: true });
  }

  // ── Fresh signup.
  const confirmToken = token();
  const unsubToken   = token();

  const { error: insertErr } = await supabase
    .from("newsletter_subscribers")
    .insert({
      email,
      locale,
      status:         "pending",
      source,
      confirm_token:  confirmToken,
      unsub_token:    unsubToken,
      user_id:        userId,
      consent_ip:     clientIp(req),
      consent_source: source,
    });

  if (insertErr) {
    console.error("[newsletter/subscribe] insert failed:", insertErr);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  try {
    await sendNewsletterConfirm({
      email,
      locale,
      confirmToken,
      siteUrl: SITE_URL,
    });
  } catch (err) {
    console.error("[newsletter/subscribe] confirm email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
