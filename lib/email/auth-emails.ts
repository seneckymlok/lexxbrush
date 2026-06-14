// ─── Auth emails (Supabase Send Email Hook) ──────────────────────────────────
//
// Every authentication email Supabase would normally send through its built-in
// SMTP is intercepted by our Send Email Hook (see
// `app/api/auth/hooks/send-email/route.ts`) and re-rendered here in the
// Lexxbrush cinematic frame, then dispatched via Resend.
//
// Why this exists:
//   1. URL ownership - the action link points at OUR domain
//      (`/api/auth/confirm`), never at Supabase's Site URL. This is what kills
//      the "localhost:3000 refused to connect" dead-end: the link no longer
//      depends on whatever the project's Site URL / redirect allow-list happens
//      to be set to.
//   2. Design - the confirmation email now matches (and exceeds) the order
//      confirmation: same cinematic frame, same suit-color identity system.
//
// Signup confirmation is the showpiece (heart-purple, the brand primary). The
// other auth flows get a tighter, single-screen branded treatment in their own
// suit color so the whole system stays coherent.

import { Resend } from "resend";
import { ADMIN_EMAIL } from "@/lib/email/admin-recipients";
import {
  cinematicFrame,
  label,
  headline,
  paragraph,
  divider,
  thinRule,
  button,
  suitRow,
  row,
  esc,
  FONTS,
  ACCENTS,
  type AccentKey,
} from "./_design";

// ─── Types ───────────────────────────────────────────────────────────────────

/** The verifyOtp-compatible action types we render emails for. */
export type AuthEmailType =
  | "signup"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "invite"
  | "reauthentication";

export interface AuthEmailInput {
  type: AuthEmailType;
  /** Full action URL on our own domain. Omit only for `reauthentication`. */
  actionUrl?: string;
  /** 6-digit code - used for `reauthentication` (and shown as a fallback). */
  otp?: string;
  /** Recipient address (shown in the security footnote). */
  toEmail: string;
  /** For `email_change`: the new address being confirmed. */
  newEmail?: string;
  /** Canonical public site URL. */
  siteUrl: string;
}

export interface RenderedAuthEmail {
  subject: string;
  html: string;
  text: string;
}

// ─── Per-type configuration ──────────────────────────────────────────────────

interface TypeConfig {
  accent: AccentKey;
  subject: string;
  /** Tiny caps label above the headline. */
  eyebrow: string;
  /** Serif "scene title". */
  headline: string;
  /** Lead paragraph. */
  lead: string;
  /** CTA button label. */
  cta: string;
}

const CONFIG: Record<Exclude<AuthEmailType, "reauthentication">, TypeConfig> = {
  signup: {
    accent: "heart",
    subject: "Confirm your email · Lexxbrush",
    eyebrow: "Welcome · Lexxbrush",
    headline: "Welcome to the table.",
    lead: "You're one tap from your Lexxbrush account. Confirm your email and the deck is yours — hand-airbrushed, one-of-one wearable art, and a front-row seat to every drop.",
    cta: "Confirm my email",
  },
  magiclink: {
    accent: "diamond",
    subject: "Your sign-in link · Lexxbrush",
    eyebrow: "Sign in · Lexxbrush",
    headline: "Your way in.",
    lead: "Tap the button below to sign in to Lexxbrush. No password needed — this link does the work.",
    cta: "Sign in to Lexxbrush",
  },
  recovery: {
    accent: "spade",
    subject: "Reset your password · Lexxbrush",
    eyebrow: "Password reset · Lexxbrush",
    headline: "Let's get you back in.",
    lead: "We received a request to reset your Lexxbrush password. Tap below to choose a new one. If it wasn't you, nothing has changed — just ignore this email.",
    cta: "Choose a new password",
  },
  email_change: {
    accent: "diamond",
    subject: "Confirm your new email · Lexxbrush",
    eyebrow: "Email change · Lexxbrush",
    headline: "Confirm your new email.",
    lead: "Confirm this is the address you'd like on your Lexxbrush account. The change takes effect the moment you tap below.",
    cta: "Confirm new email",
  },
  invite: {
    accent: "club",
    subject: "You're invited · Lexxbrush",
    eyebrow: "Invitation · Lexxbrush",
    headline: "You're invited.",
    lead: "You've been invited to Lexxbrush. Accept below to set up your account and step into the collection.",
    cta: "Accept invitation",
  },
};

// ─── Shared body blocks ──────────────────────────────────────────────────────

/** Link-expiry note + raw URL fallback (good practice: button + plain link). */
function fallbackBlock(actionUrl: string, accent: AccentKey): string {
  return `
    ${row(`<div style="font-family:${FONTS.SANS};font-size:12px;line-height:1.6;color:#6a6a6a;text-align:center;">
      This link expires in 24 hours and can be used once.
    </div>`, "20px 0 0 0")}
    ${row(`<div style="font-family:${FONTS.SANS};font-size:11px;line-height:1.6;color:#5a5a5a;text-align:center;">
      Button not working? Paste this into your browser:
    </div>`, "14px 0 6px 0")}
    ${row(`<div style="font-family:${FONTS.MONO};font-size:11px;line-height:1.6;color:#8a8a8a;text-align:center;word-break:break-all;">
      <a href="${esc(actionUrl)}" style="color:${ACCENTS[accent].hex};text-decoration:none;">${esc(actionUrl)}</a>
    </div>`, "0")}
  `;
}

/** "Didn't do this?" reassurance footnote. */
function securityNote(text: string): string {
  return row(
    `<div style="font-family:${FONTS.SANS};font-size:12px;line-height:1.6;color:#5a5a5a;text-align:center;">${esc(text)}</div>`,
    "0",
  );
}

// ─── Signup showpiece ────────────────────────────────────────────────────────

function renderSignupHtml(input: AuthEmailInput): string {
  const cfg = CONFIG.signup;
  const a = cfg.accent;
  const url = input.actionUrl!;

  const header = `
    ${row(suitRow(), "0 0 28px 0")}
    ${row(label(cfg.eyebrow, a), "0 0 18px 0")}
    ${row(headline(cfg.headline), "0 0 18px 0")}
    ${row(paragraph(cfg.lead), "0 0 36px 0")}
  `;

  const ctaBlock = `
    <tr><td align="center" style="padding:0 0 4px 0;">
      ${button(cfg.cta, url, a)}
    </td></tr>
    ${fallbackBlock(url, a)}
  `;

  // "What your account unlocks" - the editorial ladder, mirroring the order
  // email's "what happens next", but selling the value of confirming.
  const perks: Array<[string, string]> = [
    ["01", "Track every order — from the first brushstroke to your doorstep."],
    ["02", "Save the one-of-ones you love before someone else takes them home."],
    ["03", "First access to fresh drops. Each piece exists exactly once."],
  ];
  const perksHtml = perks
    .map(([num, text]) => `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;"><tr>
        <td width="56" valign="top" style="padding:14px 0;vertical-align:top;">
          <div style="font-family:${FONTS.SERIF};font-style:italic;font-size:22px;color:rgba(${ACCENTS[a].rgb}, 0.4);font-weight:400;line-height:1;">${num}</div>
        </td>
        <td valign="top" style="padding:14px 0;vertical-align:top;">
          <div style="font-family:${FONTS.SANS};font-size:14px;color:#bbbbbb;line-height:1.6;">${esc(text)}</div>
        </td>
      </tr></table>`)
    .join("");
  const perksBlock = `
    ${row(divider(a), "44px 0 32px 0")}
    ${row(label("What your account unlocks", a), "0 0 8px 0")}
    ${row(perksHtml, "0")}
    ${row(divider(a), "32px 0 28px 0")}
    ${securityNote("Didn't sign up for Lexxbrush? You can safely ignore this email — no account is created until it's confirmed.")}
  `;

  const body = `${header}${ctaBlock}${perksBlock}`;

  return cinematicFrame({
    accent: a,
    preheader: "Confirm your email and your Lexxbrush account is live.",
    bodyHtml: body,
    locale: "en",
    siteUrl: input.siteUrl,
    contactEmail: ADMIN_EMAIL,
  });
}

// ─── Generic single-screen template (magiclink / recovery / email_change / invite) ──

function renderGenericHtml(input: AuthEmailInput): string {
  const cfg = CONFIG[input.type as Exclude<AuthEmailType, "reauthentication">];
  const a = cfg.accent;
  const url = input.actionUrl!;

  const lead =
    input.type === "email_change" && input.newEmail
      ? `${cfg.lead}`
      : cfg.lead;

  const newEmailRow =
    input.type === "email_change" && input.newEmail
      ? row(`<div style="font-family:${FONTS.MONO};font-size:14px;color:#ffffff;text-align:center;background:rgba(${ACCENTS[a].rgb},0.08);border:1px solid rgba(${ACCENTS[a].rgb},0.25);border-radius:8px;padding:14px 18px;">${esc(input.newEmail)}</div>`, "0 0 32px 0")
      : "";

  const note =
    input.type === "recovery"
      ? "Didn't request this? Your password is unchanged — you can ignore this email."
      : input.type === "magiclink"
        ? "Didn't try to sign in? You can safely ignore this email."
        : input.type === "invite"
          ? "Not expecting an invite? You can ignore this email."
          : "Didn't request this change? You can safely ignore this email.";

  const body = `
    ${row(suitRow(), "0 0 28px 0")}
    ${row(label(cfg.eyebrow, a), "0 0 18px 0")}
    ${row(headline(cfg.headline), "0 0 18px 0")}
    ${row(paragraph(lead), "0 0 32px 0")}
    ${newEmailRow}
    <tr><td align="center" style="padding:0 0 4px 0;">
      ${button(cfg.cta, url, a)}
    </td></tr>
    ${fallbackBlock(url, a)}
    ${row(divider(a), "40px 0 28px 0")}
    ${securityNote(note)}
  `;

  return cinematicFrame({
    accent: a,
    preheader: cfg.lead,
    bodyHtml: body,
    locale: "en",
    siteUrl: input.siteUrl,
    contactEmail: ADMIN_EMAIL,
  });
}

// ─── Reauthentication (OTP code, no link) ────────────────────────────────────

function renderOtpHtml(input: AuthEmailInput): string {
  const a: AccentKey = "spade";
  const code = input.otp ?? "";
  const spaced = code.split("").join(" ");

  const body = `
    ${row(suitRow(), "0 0 28px 0")}
    ${row(label("Verification · Lexxbrush", a), "0 0 18px 0")}
    ${row(headline("Your verification code."), "0 0 18px 0")}
    ${row(paragraph("Enter this code to confirm it's you. It expires shortly."), "0 0 32px 0")}
    ${row(`<div style="font-family:${FONTS.MONO};font-size:34px;letter-spacing:0.4em;color:#ffffff;text-align:center;font-weight:700;background:rgba(${ACCENTS[a].rgb},0.08);border:1px solid rgba(${ACCENTS[a].rgb},0.25);border-radius:10px;padding:22px 18px;">${esc(spaced)}</div>`, "0 0 28px 0")}
    ${row(divider(a), "12px 0 28px 0")}
    ${securityNote("Didn't request a code? You can safely ignore this email.")}
  `;

  return cinematicFrame({
    accent: a,
    preheader: `Your Lexxbrush verification code: ${code}`,
    bodyHtml: body,
    locale: "en",
    siteUrl: input.siteUrl,
    contactEmail: ADMIN_EMAIL,
  });
}

// ─── Plain-text bodies (deliverability + accessibility) ──────────────────────

function renderText(input: AuthEmailInput): string {
  const L: string[] = [];
  if (input.type === "reauthentication") {
    L.push("LEXXBRUSH — VERIFICATION");
    L.push("");
    L.push("Your verification code:");
    L.push(`   ${input.otp ?? ""}`);
    L.push("");
    L.push("Enter this code to confirm it's you. It expires shortly.");
    L.push("Didn't request a code? You can safely ignore this email.");
    L.push("");
    L.push("lexxbrush.eu · @lexxbrush");
    return L.join("\n");
  }

  const cfg = CONFIG[input.type as Exclude<AuthEmailType, "reauthentication">];
  // eyebrow already carries the "· Lexxbrush" tag - drop it so the text header
  // doesn't read "LEXXBRUSH — WELCOME · LEXXBRUSH".
  const tag = cfg.eyebrow.replace(/\s*·\s*Lexxbrush\s*$/i, "").toUpperCase();
  L.push(`LEXXBRUSH — ${tag}`);
  L.push("");
  L.push(cfg.headline);
  L.push("");
  L.push(cfg.lead);
  if (input.type === "email_change" && input.newEmail) {
    L.push("");
    L.push(`New email: ${input.newEmail}`);
  }
  L.push("");
  L.push(`${cfg.cta}:`);
  L.push(`   ${input.actionUrl ?? ""}`);
  L.push("");
  L.push("This link expires in 24 hours and can be used once.");
  if (input.type === "signup") {
    L.push("");
    L.push("WHAT YOUR ACCOUNT UNLOCKS");
    L.push("01  Track every order — from the first brushstroke to your doorstep.");
    L.push("02  Save the one-of-ones you love before someone else takes them home.");
    L.push("03  First access to fresh drops. Each piece exists exactly once.");
    L.push("");
    L.push("Didn't sign up for Lexxbrush? You can safely ignore this email.");
  }
  L.push("");
  L.push(`Questions?  ${ADMIN_EMAIL}`);
  L.push("lexxbrush.eu · @lexxbrush");
  return L.join("\n");
}

// ─── Public renderer ─────────────────────────────────────────────────────────

export function renderAuthEmail(input: AuthEmailInput): RenderedAuthEmail {
  let html: string;
  let subject: string;

  switch (input.type) {
    case "signup":
      html = renderSignupHtml(input);
      subject = CONFIG.signup.subject;
      break;
    case "reauthentication":
      html = renderOtpHtml(input);
      subject = "Your verification code · Lexxbrush";
      break;
    default:
      html = renderGenericHtml(input);
      subject = CONFIG[input.type].subject;
      break;
  }

  return { subject, html, text: renderText(input) };
}

// ─── Sender ──────────────────────────────────────────────────────────────────

// Lazy so merely importing this module (e.g. to render a preview) never throws
// when RESEND_API_KEY is absent - the Resend constructor errors on an empty key.
let _resend: Resend | null = null;
function resendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Lexxbrush <onboarding@resend.dev>";

/**
 * Render + send an auth email via Resend. Throws on failure so the hook can
 * surface the error back to Supabase (a failed auth email must not silently
 * succeed - the user would never receive their link).
 */
export async function sendAuthEmail(input: AuthEmailInput): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not set - cannot send auth email");
  }
  const { subject, html, text } = renderAuthEmail(input);

  const { error } = await resendClient().emails.send({
    from: FROM_EMAIL,
    to: input.toEmail,
    replyTo: ADMIN_EMAIL,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}
