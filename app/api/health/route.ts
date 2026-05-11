import { NextResponse } from "next/server";

// ─── Health check ────────────────────────────────────────────────────────────
//
// Returns the configuration state of every service the payment pipeline
// depends on. Does NOT return secret values — only whether each one is
// present and not a known placeholder. Safe to expose publicly.
//
// Use this to verify in 5 seconds whether the broken payment flow is a
// config issue (most likely) vs. a code issue.

const HOST = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

function check(value: string | undefined, placeholders: string[] = []) {
  if (!value) return { set: false, placeholder: false, prefix: null };
  const isPlaceholder = placeholders.some((p) => value.startsWith(p));
  return {
    set: true,
    placeholder: isPlaceholder,
    prefix: value.slice(0, 8),
  };
}

export async function GET() {
  const stripe = {
    secret_key:    check(process.env.STRIPE_SECRET_KEY,    ["sk_test_placeholder", "sk_placeholder"]),
    publishable:   check(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, ["pk_test_placeholder", "pk_placeholder"]),
    webhook_secret: check(process.env.STRIPE_WEBHOOK_SECRET, ["whsec_placeholder"]),
  };

  const supabase = {
    url:               !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon_key:          !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_role_key:  !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const packeta = {
    api_key:    !!process.env.NEXT_PUBLIC_PACKETA_API_KEY,
    password:   !!process.env.PACKETA_API_PASSWORD,
    eshop:      !!process.env.PACKETA_ESHOP,
  };

  const email = {
    resend_api_key: check(process.env.RESEND_API_KEY, ["re_placeholder"]),
    resend_from:    process.env.RESEND_FROM_EMAIL || "(default: onboarding@resend.dev)",
  };

  const testMode = {
    token_configured: !!process.env.CHECKOUT_TEST_TOKEN,
  };

  // Flag the issues most likely to break payments.
  const issues: string[] = [];
  if (!stripe.secret_key.set || stripe.secret_key.placeholder) {
    issues.push("STRIPE_SECRET_KEY missing or placeholder — checkout sessions will fail");
  }
  if (!stripe.webhook_secret.set || stripe.webhook_secret.placeholder) {
    issues.push(
      "STRIPE_WEBHOOK_SECRET missing or placeholder — paid orders will NOT be recorded. Fix at: Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret",
    );
  }
  if (!supabase.service_role_key) {
    issues.push("SUPABASE_SERVICE_ROLE_KEY missing — admin DB writes will fail");
  }
  if (!email.resend_api_key.set || email.resend_api_key.placeholder) {
    issues.push("RESEND_API_KEY missing or placeholder — confirmation emails will NOT send");
  }

  return NextResponse.json({
    host:           HOST,
    expected_webhook_url: `${HOST}/api/webhooks/stripe`,
    healthy:        issues.length === 0,
    issues,
    services: {
      stripe,
      supabase,
      packeta,
      email,
      test_mode: testMode,
    },
  }, { status: issues.length === 0 ? 200 : 503 });
}
