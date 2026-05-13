import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// ─── One-click unsubscribe ──────────────────────────────────────────────────
//
// Supports two entry points so it works with every mail client:
//
//   • GET  /api/newsletter/unsubscribe?token=...
//       Triggered when the user clicks the visible "Unsubscribe" link in
//       the email body. Flips the row, then 302s to /newsletter/unsubscribed.
//
//   • POST /api/newsletter/unsubscribe?token=...
//       Triggered by mail clients that honor the List-Unsubscribe-Post
//       header (Gmail, Apple Mail, Yahoo). Same DB effect, returns 200 JSON.
//
// No login, no "are you sure," no survey. Apple and Gmail penalize senders
// who add friction here. Just unsub.

async function unsubscribeByToken(token: string | null) {
  if (!token) return { ok: false, status: 400 } as const;
  const supabase = createAdminClient();
  const { data: row, error: selectErr } = await supabase
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("unsub_token", token)
    .maybeSingle();

  if (selectErr) {
    console.error("[newsletter/unsubscribe] select failed:", selectErr);
    return { ok: false, status: 500 } as const;
  }
  if (!row) {
    return { ok: false, status: 404 } as const;
  }

  // Idempotent — already unsubscribed is still success.
  if (row.status === "unsubscribed") {
    return { ok: true, status: 200 } as const;
  }

  const { error: updateErr } = await supabase
    .from("newsletter_subscribers")
    .update({
      status:           "unsubscribed",
      unsubscribed_at:  new Date().toISOString(),
    })
    .eq("id", row.id);

  if (updateErr) {
    console.error("[newsletter/unsubscribe] update failed:", updateErr);
    return { ok: false, status: 500 } as const;
  }

  return { ok: true, status: 200 } as const;
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  const result = await unsubscribeByToken(token);

  // Even on bad token, redirect to the unsubscribed page so we don't
  // leak which tokens are valid. The page is friendly either way.
  if (!result.ok && result.status === 500) {
    return NextResponse.redirect(new URL("/newsletter/invalid", req.url));
  }
  return NextResponse.redirect(new URL("/newsletter/unsubscribed", req.url));
}

export async function POST(req: NextRequest) {
  // List-Unsubscribe-Post=One-Click — Gmail sends an empty body.
  const token = new URL(req.url).searchParams.get("token");
  const result = await unsubscribeByToken(token);
  return NextResponse.json({ ok: result.ok }, { status: result.status });
}
