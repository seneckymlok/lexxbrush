// ─── Newsletter email templates ──────────────────────────────────────────────
//
// Three shapes, one design language. All share the dark suit-themed look
// from the order confirmation email, with proper email-client armor:
//   inline styles, table layout, 600px max, plain-text fallback.
//
// Templates:
//   • confirmOptIn     — bare double-opt-in confirmation, one button
//   • welcome          — sent after the user clicks the confirm link
//   • campaign         — full drop announcement, used by /admin/newsletter
//
// Every email includes the List-Unsubscribe header (RFC 8058 one-click).

import { Resend } from "resend";

// ─── Config ──────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sender address for newsletter-class email. Should live on a SEPARATE
 * subdomain from transactional mail (orders) so a spam complaint here
 * doesn't poison the reputation of order confirmations.
 *
 * Example: `Lexxbrush <news@news.lexxbrush.eu>`
 */
const NEWSLETTER_FROM =
  process.env.NEWSLETTER_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  "Lexxbrush <onboarding@resend.dev>";

const REPLY_TO = process.env.ADMIN_NOTIFY_EMAIL || "info@lexxbrush.eu";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Locale = "en" | "sk";

interface ConfirmOptInPayload {
  email:        string;
  locale:       Locale;
  confirmToken: string;
  siteUrl:      string;
}

interface WelcomePayload {
  email:      string;
  locale:     Locale;
  unsubToken: string;
  siteUrl:    string;
}

interface CampaignPayload {
  subscriberId: string;        // for X-Entity-Ref-ID, helps dedupe in Resend
  email:        string;
  locale:       Locale;
  subject:      string;
  preheader?:   string;
  /** Body HTML (already inside the framed layout — passed through verbatim) */
  bodyHtml:     string;
  /** Body plain-text fallback */
  bodyText:     string;
  unsubToken:   string;
  siteUrl:      string;
  campaignId?:  string;
}

// ─── Copy ────────────────────────────────────────────────────────────────────

const COPY = {
  en: {
    confirm: {
      preheader: "Tap to confirm your email and join the drop list.",
      eyebrow:   "♥   One last step",
      headline:  "Confirm your spot.",
      body:      "You'll only hear from us when something new drops — usually once a month, never more. Tap the button below and you're on the list.",
      cta:       "Confirm my email",
      footnote:  "Didn't sign up? Ignore this email — nothing will happen without your click.",
    },
    welcome: {
      preheader: "You're on the list. Welcome to the drop.",
      eyebrow:   "♠   You're in",
      headline:  "Welcome to the drop.",
      body:      "Every piece on Lexxbrush is hand-airbrushed — most are one-of-one. When the next drop is ready, you'll be the first to know. We promise to be worth the inbox space.",
      cta:       "Browse the collection",
    },
    common: {
      unsub:     "Unsubscribe",
      questions: "Questions? Write to",
      tagline:   "Hand-airbrushed wearable art. Every piece is unique.",
    },
  },
  sk: {
    confirm: {
      preheader: "Klikni a potvrď svoj e-mail.",
      eyebrow:   "♥   Ešte jeden krok",
      headline:  "Potvrď svoje miesto.",
      body:      "Ozveme sa len keď príde niečo nové — zvyčajne raz za mesiac, nikdy viac. Klikni nižšie a si na zozname.",
      cta:       "Potvrdiť e-mail",
      footnote:  "Neregistroval si sa? Tento e-mail môžeš ignorovať — bez tvojho kliknutia sa nič nestane.",
    },
    welcome: {
      preheader: "Si na zozname. Vitaj.",
      eyebrow:   "♠   Si na zozname",
      headline:  "Vitaj v drope.",
      body:      "Každý kus na Lexxbrush je ručne airbrushovaný — väčšina je unikát. Keď bude pripravený ďalší drop, dozvieš sa to ako prvý.",
      cta:       "Pozrieť kolekciu",
    },
    common: {
      unsub:     "Odhlásiť sa",
      questions: "Otázky? Píš na",
      tagline:   "Ručne airbrushované nositeľné umenie. Každý kus je unikát.",
    },
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const esc = (s: string | undefined | null) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function frameLayout(opts: {
  preheader:  string;
  contentHtml:string;
  locale:     Locale;
  unsubUrl?:  string | null;
  siteUrl:    string;
}): string {
  const c = COPY[opts.locale].common;
  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Lexxbrush</title>
</head>
<body style="margin:0;padding:0;background:#050505;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;line-height:0;font-size:0;">
    ${esc(opts.preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#050505;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <tr>
            <td align="center" style="padding-bottom:40px;">
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#6a6a6a;">
                Lexxbrush
              </div>
            </td>
          </tr>

          ${opts.contentHtml}

          <tr>
            <td align="center" style="padding:48px 0 0 0;">
              <div style="border-top:1px solid #1a1a1a;padding-top:32px;">
                <div style="color:#6a6a6a;font-size:11px;line-height:1.6;">
                  ${esc(c.questions)}
                  <a href="mailto:${esc(REPLY_TO)}" style="color:#dcdcdc;text-decoration:none;">${esc(REPLY_TO)}</a>.
                </div>
                <div style="color:#4a4a4a;font-size:10px;line-height:1.6;margin-top:16px;letter-spacing:0.15em;text-transform:uppercase;">
                  <a href="${esc(opts.siteUrl)}" style="color:#6a6a6a;text-decoration:none;">lexxbrush.eu</a>
                  &nbsp;·&nbsp;
                  <a href="https://www.instagram.com/lexxbrush" style="color:#6a6a6a;text-decoration:none;">@lexxbrush</a>
                  ${opts.unsubUrl ? `&nbsp;·&nbsp;<a href="${esc(opts.unsubUrl)}" style="color:#6a6a6a;text-decoration:none;">${esc(c.unsub)}</a>` : ""}
                </div>
                <div style="color:#3a3a3a;font-size:10px;line-height:1.6;margin-top:24px;">
                  ${esc(c.tagline)}
                </div>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Confirm opt-in ──────────────────────────────────────────────────────────

export async function sendNewsletterConfirm(p: ConfirmOptInPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[newsletter] RESEND_API_KEY not set — skipping confirm email");
    return null;
  }

  const c = COPY[p.locale].confirm;
  const confirmUrl = `${p.siteUrl}/api/newsletter/confirm?token=${encodeURIComponent(p.confirmToken)}`;

  const content = `
    <tr>
      <td style="padding:0 0 32px 0;">
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#a014dc;margin-bottom:12px;">
          ${c.eyebrow}
        </div>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:36px;font-weight:800;line-height:1;color:#ffffff;letter-spacing:-0.02em;">
          ${esc(c.headline)}
        </div>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#8a8a8a;margin-top:16px;">
          ${esc(c.body)}
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;padding:32px;text-align:center;">
        <a href="${esc(confirmUrl)}"
           style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:16px 36px;border-radius:999px;">
          ${esc(c.cta)}
        </a>
        <div style="color:#5a5a5a;font-size:11px;line-height:1.6;margin-top:24px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          ${esc(c.footnote)}
        </div>
      </td>
    </tr>`;

  const html = frameLayout({
    preheader:   c.preheader,
    contentHtml: content,
    locale:      p.locale,
    unsubUrl:    null,
    siteUrl:     p.siteUrl,
  });

  const text = [
    `LEXXBRUSH`,
    ``,
    c.headline,
    ``,
    c.body,
    ``,
    `Confirm:  ${confirmUrl}`,
    ``,
    c.footnote,
  ].join("\n");

  return resend.emails.send({
    from:    NEWSLETTER_FROM,
    to:      p.email,
    replyTo: REPLY_TO,
    subject: p.locale === "sk"
      ? "Potvrď svoj e-mail · Lexxbrush"
      : "Confirm your email · Lexxbrush",
    html,
    text,
  });
}

// ─── Welcome ─────────────────────────────────────────────────────────────────

export async function sendNewsletterWelcome(p: WelcomePayload) {
  if (!process.env.RESEND_API_KEY) return null;

  const c = COPY[p.locale].welcome;
  const unsubUrl = `${p.siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(p.unsubToken)}`;

  const content = `
    <tr>
      <td style="padding:0 0 32px 0;">
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#3264ff;margin-bottom:12px;">
          ${c.eyebrow}
        </div>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:36px;font-weight:800;line-height:1;color:#ffffff;letter-spacing:-0.02em;">
          ${esc(c.headline)}
        </div>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#8a8a8a;margin-top:16px;">
          ${esc(c.body)}
        </div>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:8px 0 0 0;">
        <a href="${esc(p.siteUrl)}"
           style="display:inline-block;background:transparent;color:#ffffff;border:1px solid #2a2a2a;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:16px 36px;border-radius:999px;">
          ${esc(c.cta)}
        </a>
      </td>
    </tr>`;

  const html = frameLayout({
    preheader:   c.preheader,
    contentHtml: content,
    locale:      p.locale,
    unsubUrl,
    siteUrl:     p.siteUrl,
  });

  const text = [
    `LEXXBRUSH`,
    ``,
    c.headline,
    ``,
    c.body,
    ``,
    p.siteUrl,
    ``,
    `Unsubscribe: ${unsubUrl}`,
  ].join("\n");

  return resend.emails.send({
    from:    NEWSLETTER_FROM,
    to:      p.email,
    replyTo: REPLY_TO,
    subject: p.locale === "sk"
      ? "Vitaj na zozname · Lexxbrush"
      : "Welcome to the drop · Lexxbrush",
    html,
    text,
    headers: {
      "List-Unsubscribe":      `<${unsubUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

// ─── Campaign ────────────────────────────────────────────────────────────────

export async function sendNewsletterCampaign(p: CampaignPayload) {
  if (!process.env.RESEND_API_KEY) return null;

  const unsubUrl = `${p.siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(p.unsubToken)}`;

  // The admin pastes/builds rich HTML. We slot it into the framed layout.
  const content = `
    <tr>
      <td style="padding:0;">
        ${p.bodyHtml}
      </td>
    </tr>`;

  const html = frameLayout({
    preheader:   p.preheader || p.subject,
    contentHtml: content,
    locale:      p.locale,
    unsubUrl,
    siteUrl:     p.siteUrl,
  });

  const text = `${p.bodyText}\n\n---\nUnsubscribe: ${unsubUrl}`;

  return resend.emails.send({
    from:    NEWSLETTER_FROM,
    to:      p.email,
    replyTo: REPLY_TO,
    subject: p.subject,
    html,
    text,
    headers: {
      "List-Unsubscribe":      `<${unsubUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Entity-Ref-ID":       p.subscriberId,
    },
    // Tags are the only payload Resend echoes back in webhook events
    // (custom X- headers are dropped). We rely on these in
    // /api/webhooks/resend to attribute opens/clicks to a campaign +
    // subscriber. Tag values are restricted to [A-Za-z0-9_-], which is
    // compatible with UUIDs.
    tags: [
      { name: "subscriber_id", value: p.subscriberId },
      ...(p.campaignId ? [{ name: "campaign_id", value: p.campaignId }] : []),
    ],
  });
}
