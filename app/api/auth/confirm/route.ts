import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ─── Auth confirmation endpoint ──────────────────────────────────────────────
//
// The action link in every Lexxbrush auth email points here (built by the Send
// Email hook). We exchange the token hash for a verified user, then redirect to
// a real, branded page on our own domain - never to Supabase's Site URL, which
// is what used to dump people on a dead `localhost:3000`.

export const runtime = "nodejs";

// All redirects are anchored to the canonical public origin so the destination
// is deterministic regardless of the host the request arrived on.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu").replace(/\/$/, "");

/** Only allow same-site relative paths; block protocol-relative & API loops. */
function safePath(next: string | null, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.startsWith("/api/")) return fallback;
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as EmailOtpType | null) ?? "signup";
  const next = safePath(searchParams.get("next"), "/auth/confirmed");

  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, SITE_URL));
    }
    console.error("[auth/confirm] verifyOtp failed:", error.message);
  }

  // Expired / already-used / malformed link → branded error state on the same
  // confirmed page, which offers a clear path to request a fresh link.
  return NextResponse.redirect(new URL("/auth/confirmed?status=error", SITE_URL));
}
