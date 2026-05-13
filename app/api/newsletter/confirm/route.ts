import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendNewsletterWelcome } from "@/lib/email/newsletter";

// ─── Double opt-in confirm endpoint ──────────────────────────────────────────
//
// Flow: user clicks the link in the confirm email →
//   GET /api/newsletter/confirm?token=...
//     • Look up subscriber by confirm_token.
//     • If found + status='pending' → flip to 'confirmed', send welcome.
//     • If found + status='confirmed' → no-op success (idempotent re-click).
//     • If not found / token invalid → redirect to invalid page.
//   Then 302 to /newsletter/confirmed (success) or /newsletter/invalid.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

export async function GET(req: NextRequest) {
  const url   = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/newsletter/invalid", req.url));
  }

  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, locale, status, unsub_token")
    .eq("confirm_token", token)
    .maybeSingle();

  if (!row) {
    return NextResponse.redirect(new URL("/newsletter/invalid", req.url));
  }

  // Already-confirmed re-click — succeed silently without resending welcome.
  if (row.status === "confirmed") {
    return NextResponse.redirect(new URL("/newsletter/confirmed", req.url));
  }

  // Suppressed → don't quietly re-subscribe; treat as invalid.
  if (row.status === "bounced" || row.status === "complained") {
    return NextResponse.redirect(new URL("/newsletter/invalid", req.url));
  }

  const { error: updateErr } = await supabase
    .from("newsletter_subscribers")
    .update({
      status:       "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (updateErr) {
    console.error("[newsletter/confirm] update failed:", updateErr);
    return NextResponse.redirect(new URL("/newsletter/invalid", req.url));
  }

  try {
    await sendNewsletterWelcome({
      email:      row.email,
      locale:     (row.locale === "sk" ? "sk" : "en"),
      unsubToken: row.unsub_token,
      siteUrl:    SITE_URL,
    });
  } catch (err) {
    console.error("[newsletter/confirm] welcome email failed:", err);
    // Don't fail the redirect — they're confirmed.
  }

  return NextResponse.redirect(new URL("/newsletter/confirmed", req.url));
}
