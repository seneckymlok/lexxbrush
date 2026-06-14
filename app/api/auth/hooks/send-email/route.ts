import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { sendAuthEmail, type AuthEmailType } from "@/lib/email/auth-emails";

// ─── Supabase "Send Email" auth hook ─────────────────────────────────────────
//
// Once enabled in the Supabase dashboard (Authentication → Hooks → Send Email),
// Supabase stops sending auth emails through its own SMTP and POSTs the payload
// here instead. We render the Lexxbrush-branded email and dispatch it via
// Resend, with the action link pointing at OUR domain (`/api/auth/confirm`).
//
// This is the definitive fix for the "localhost:3000 refused to connect"
// dead-link: the confirmation URL is built from NEXT_PUBLIC_SITE_URL here, so
// it no longer depends on the project's Site URL / redirect allow-list at all.
//
// ── Dashboard setup (one-time) ───────────────────────────────────────────────
//   Authentication → Hooks → "Send Email hook" → Enable, type HTTPS
//   URL:    https://lexxbrush.eu/api/auth/hooks/send-email
//   Secret: click "Generate secret" → copy the `v1,whsec_...` value into the
//           SEND_EMAIL_HOOK_SECRET env var (Vercel + .env.local).
//
// Payloads are signed with the Standard Webhooks spec (webhook-id /
// webhook-timestamp / webhook-signature headers), which the `svix` library
// already used elsewhere in this codebase verifies natively.

export const runtime = "nodejs";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu").replace(/\/$/, "");
const HOOK_SECRET = process.env.SEND_EMAIL_HOOK_SECRET || "";

// Supabase's `email_action_type` → our verifyOtp-compatible type.
const ACTION_MAP: Record<string, AuthEmailType> = {
  signup: "signup",
  email: "signup", // some Supabase versions label confirmation as "email"
  magiclink: "magiclink",
  recovery: "recovery",
  invite: "invite",
  email_change: "email_change",
  email_change_new: "email_change",
  reauthentication: "reauthentication",
};

// After verification, where to land the user. Signup/invite/email_change go to
// the celebratory on-site confirmed page; magiclink/recovery into the account.
const NEXT_DEFAULT: Record<AuthEmailType, string> = {
  signup: "/auth/confirmed",
  invite: "/auth/confirmed",
  email_change: "/auth/confirmed?flow=email_change",
  magiclink: "/account",
  recovery: "/account",
  reauthentication: "/account",
};

interface HookPayload {
  user: { email?: string; new_email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to?: string;
    email_action_type: string;
    site_url?: string;
    new_email?: string;
    token_hash_new?: string;
  };
}

/** Keep only safe, same-site relative paths. Falls back to the per-type default. */
function safeNext(redirectTo: string | undefined, fallback: string): string {
  if (!redirectTo) return fallback;
  try {
    // Accept a bare path or a full URL on our own origin.
    const u = redirectTo.startsWith("/")
      ? new URL(redirectTo, SITE_URL)
      : new URL(redirectTo);
    if (u.origin !== SITE_URL) return fallback;
    const path = `${u.pathname}${u.search}`;
    // Never bounce to the API itself; that would loop.
    if (path.startsWith("/api/")) return fallback;
    return path || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  if (!HOOK_SECRET) {
    console.error("[send-email-hook] SEND_EMAIL_HOOK_SECRET not set");
    return NextResponse.json(
      { error: { http_code: 500, message: "hook_not_configured" } },
      { status: 500 },
    );
  }

  const raw = await req.text();

  // Verify the Standard Webhooks signature. The Supabase secret is stored as
  // `v1,whsec_<base64>`; svix wants the `whsec_...` portion (it strips the
  // prefix and base64-decodes the rest).
  let payload: HookPayload;
  try {
    const wh = new Webhook(HOOK_SECRET.replace(/^v1,/, ""));
    payload = wh.verify(raw, {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
    }) as HookPayload;
  } catch (err) {
    console.error("[send-email-hook] signature verification failed:", (err as Error).message);
    return NextResponse.json(
      { error: { http_code: 401, message: "invalid_signature" } },
      { status: 401 },
    );
  }

  const { user, email_data } = payload;
  const toEmail = user?.email;
  if (!toEmail) {
    console.error("[send-email-hook] payload missing user email");
    return NextResponse.json(
      { error: { http_code: 400, message: "missing_email" } },
      { status: 400 },
    );
  }

  const type = ACTION_MAP[email_data.email_action_type] ?? "signup";

  try {
    if (type === "reauthentication") {
      // OTP-only flow: no link, just the code.
      await sendAuthEmail({ type, otp: email_data.token, toEmail, siteUrl: SITE_URL });
    } else {
      const next = safeNext(email_data.redirect_to, NEXT_DEFAULT[type]);
      const url = new URL("/api/auth/confirm", SITE_URL);
      url.searchParams.set("token_hash", email_data.token_hash);
      url.searchParams.set("type", type);
      url.searchParams.set("next", next);

      await sendAuthEmail({
        type,
        actionUrl: url.toString(),
        toEmail,
        newEmail: email_data.new_email ?? user.new_email,
        siteUrl: SITE_URL,
      });
    }
  } catch (err) {
    console.error("[send-email-hook] send failed:", (err as Error).message);
    return NextResponse.json(
      { error: { http_code: 500, message: "email_send_failed" } },
      { status: 500 },
    );
  }

  // Empty 200 tells Supabase the hook handled delivery.
  return NextResponse.json({});
}
