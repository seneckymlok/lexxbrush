// ─── Lexxbrush cinematic email design system ─────────────────────────────────
//
// Single source of truth for every transactional email. Mirrors the eshop's
// visual language: near-black canvas, accent "stage lighting" radiating from
// the top, soft halos around the graffiti logo, hairline rules in the accent
// hue, large editorial type, asymmetric content drift.
//
// Each email type gets its own accent (from the suit-symbol identity system)
// so the email's mood matches its purpose:
//
//   • Order confirmation (customer) → HEART purple    — intimate, romantic
//   • Admin new-order alert         → DIAMOND cyan    — electric, urgent
//   • Shipped notification          → SPADE blue      — settled, in motion
//   • Promotional / future          → CLUB yellow     — attention
//
// All output is pure string-template HTML — no React, no env reads, no DB.
// Renders identically server-side or in any preview pane. Inline styles only,
// table layout where alignment matters, web-safe fonts, max-width 600px.

// ── Escape helper ───────────────────────────────────────────────────────────

export const esc = (s: string | undefined | null): string =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ── Money ──────────────────────────────────────────────────────────────────

export const eur = (cents: number): string =>
  `€${(cents / 100).toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ── Accent palette per email type ───────────────────────────────────────────
//
// rgb is exposed as a separate string so we can compose rgba() values inline
// without runtime parsing — keeps the template purely string-concat.

export interface Accent {
  hex:     string;  // solid color for borders, type
  rgb:     string;  // "r, g, b" for rgba()
  glow:    string;  // pre-composed rgba glow color
  soft:    string;  // pre-composed rgba ultra-soft tint for halos
  label:   string;  // suit-symbol name shown in the masthead micro-line
}

export const ACCENTS = {
  heart: {
    hex:   "#8800CC",
    rgb:   "136, 0, 204",
    glow:  "rgba(136, 0, 204, 0.55)",
    soft:  "rgba(136, 0, 204, 0.14)",
    label: "HEART",
  },
  diamond: {
    hex:   "#00DDEE",
    rgb:   "0, 221, 238",
    glow:  "rgba(0, 221, 238, 0.55)",
    soft:  "rgba(0, 221, 238, 0.12)",
    label: "DIAMOND",
  },
  spade: {
    hex:   "#1A2EE6",
    rgb:   "26, 46, 230",
    glow:  "rgba(26, 46, 230, 0.55)",
    soft:  "rgba(26, 46, 230, 0.14)",
    label: "SPADE",
  },
  club: {
    hex:   "#EEFF00",
    rgb:   "238, 255, 0",
    glow:  "rgba(238, 255, 0, 0.45)",
    soft:  "rgba(238, 255, 0, 0.10)",
    label: "CLUB",
  },
} as const satisfies Record<string, Accent>;

export type AccentKey = keyof typeof ACCENTS;

// ── Fonts (web-safe stacks only — every email client renders these) ────────

const SERIF = `'Times New Roman', Times, Georgia, serif`;
const SANS  = `'Helvetica Neue', Helvetica, Arial, sans-serif`;
const MONO  = `'SF Mono', Menlo, Consolas, 'Courier New', monospace`;

// ── Frame ───────────────────────────────────────────────────────────────────

export interface CinematicFrameOpts {
  /** Inbox preheader (hidden snippet shown in client preview). */
  preheader:    string;
  /** Suit-color theme key. */
  accent:       AccentKey;
  /** Body HTML — content drops directly into the centered 600px column. */
  bodyHtml:     string;
  /** Locale for footer copy. */
  locale?:      "en" | "sk";
  /** Public site URL — used in footer links. */
  siteUrl:      string;
  /** Contact email shown in the footer. */
  contactEmail: string;
  /** Optional unsubscribe URL (admin/transactional emails should omit). */
  unsubUrl?:    string | null;
}

const FOOTER_COPY = {
  en: {
    questions: "Questions?",
    tagline:   "Hand-airbrushed wearable art.\nEvery piece is unique.",
    unsub:     "Unsubscribe",
  },
  sk: {
    questions: "Otázky?",
    tagline:   "Ručne airbrushované nositeľné umenie.\nKaždý kus je unikát.",
    unsub:     "Odhlásiť sa",
  },
} as const;

/**
 * Wrap any body HTML in the Lexxbrush cinematic frame.
 *
 * Renders:
 *   1. Preheader (hidden inbox preview snippet)
 *   2. Hero masthead: large graffiti logo + accent halo
 *   3. Suit-color micro-line below the logo
 *   4. Body content (caller-supplied)
 *   5. Footer: contact, social, tagline
 */
export function cinematicFrame(opts: CinematicFrameOpts): string {
  const a = ACCENTS[opts.accent];
  const c = FOOTER_COPY[opts.locale ?? "en"];
  const logoUrl = `${opts.siteUrl.replace(/\/$/, "")}/email/logo.png`;

  // The "stage lighting" is a CSS radial-gradient overlaid on near-black.
  // Modern clients (Gmail web, Apple Mail, iOS Mail) render it — Outlook
  // strips the gradient and falls back to the solid bg color. We accept
  // that gracefully.
  const bgGradient = `radial-gradient(ellipse 720px 540px at 50% -120px, ${a.soft} 0%, rgba(0,0,0,0) 70%), radial-gradient(ellipse 600px 800px at 50% 100%, rgba(${a.rgb}, 0.05) 0%, rgba(0,0,0,0) 65%), #040404`;

  return `<!DOCTYPE html>
<html lang="${opts.locale ?? "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Lexxbrush</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:#040404;color:#f0f0f0;font-family:${SANS};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

  <!-- Preheader (hidden, but read by clients for the inbox preview line) -->
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;line-height:0;font-size:0;mso-hide:all;">
    ${esc(opts.preheader)}
  </div>

  <!-- Outer canvas — solid bg color for Outlook, radial gradient overlaid for the rest -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${bgGradient};">
    <tr>
      <td align="center" style="padding:56px 16px 40px 16px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- ─── HERO MASTHEAD ─────────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding:0 0 8px 0;">
              <!-- The logo. Width 560 / displayed at 280 = retina-crisp.
                   Drop-shadow box on the table cell simulates the accent halo
                   in clients that strip box-shadow on <img>. -->
              <img
                src="${esc(logoUrl)}"
                alt="Lexxbrush"
                width="280"
                style="display:block;width:280px;max-width:75%;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;filter:drop-shadow(0 0 24px ${a.glow}) drop-shadow(0 0 48px rgba(${a.rgb}, 0.25));"
              />
            </td>
          </tr>

          <!-- Suit micro-line — sits directly under the logo, in the accent hue.
               One-line typographic signature. -->
          <tr>
            <td align="center" style="padding:24px 0 48px 0;">
              <div style="font-family:${SANS};font-size:9px;letter-spacing:0.55em;text-transform:uppercase;color:${a.hex};font-weight:700;">
                <span style="opacity:0.55;">·</span>
                &nbsp;${a.label}&nbsp;
                <span style="opacity:0.55;">·</span>
              </div>
            </td>
          </tr>

          <!-- ─── BODY (caller content) ─────────────────────────────────────── -->
          ${opts.bodyHtml}

          <!-- ─── FOOTER ────────────────────────────────────────────────────── -->
          <tr>
            <td style="padding:64px 0 0 0;">
              <!-- Accent hairline separator -->
              <div style="height:1px;background:linear-gradient(to right, rgba(${a.rgb},0) 0%, rgba(${a.rgb},0.5) 50%, rgba(${a.rgb},0) 100%);line-height:1px;font-size:1px;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:32px 0 0 0;">
              <div style="font-family:${SANS};font-size:11px;line-height:1.7;color:#6a6a6a;">
                ${esc(c.questions)}
                &nbsp;
                <a href="mailto:${esc(opts.contactEmail)}" style="color:#dcdcdc;text-decoration:none;border-bottom:1px solid rgba(${a.rgb},0.4);padding-bottom:1px;">${esc(opts.contactEmail)}</a>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 0 0 0;">
              <div style="font-family:${SANS};font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:#5a5a5a;">
                <a href="${esc(opts.siteUrl)}" style="color:#888;text-decoration:none;">lexxbrush.eu</a>
                &nbsp;<span style="color:#3a3a3a;">/</span>&nbsp;
                <a href="https://www.instagram.com/lexxbrush" style="color:#888;text-decoration:none;">@lexxbrush</a>
                ${opts.unsubUrl
                  ? `&nbsp;<span style="color:#3a3a3a;">/</span>&nbsp;<a href="${esc(opts.unsubUrl)}" style="color:#5a5a5a;text-decoration:none;">${esc(c.unsub)}</a>`
                  : ""
                }
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:32px 0 0 0;">
              <div style="font-family:${SERIF};font-style:italic;font-size:12px;line-height:1.7;color:#3a3a3a;white-space:pre-line;">${esc(c.tagline)}</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Reusable HTML primitives ────────────────────────────────────────────────
//
// Composed by individual email templates. Each returns a string of HTML that
// can be concatenated into the frame's `bodyHtml`. None of these wrap themselves
// in <tr> — callers compose them inside their own table rows.

/** Caps label — the 0.32em-spaced tiny header used throughout. */
export function label(text: string, accent: AccentKey): string {
  const a = ACCENTS[accent];
  return `<div style="font-family:${SANS};font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:${a.hex};font-weight:700;">${esc(text)}</div>`;
}

/** Large editorial serif headline — the "scene title" of the email. */
export function headline(text: string): string {
  return `<div style="font-family:${SERIF};font-style:italic;font-size:34px;line-height:1.15;color:#ffffff;font-weight:400;letter-spacing:-0.01em;">${esc(text)}</div>`;
}

/** Body paragraph — Helvetica, 15px, soft chrome color. */
export function paragraph(text: string): string {
  return `<div style="font-family:${SANS};font-size:15px;line-height:1.65;color:#bbbbbb;font-weight:400;">${esc(text)}</div>`;
}

/** Accent hairline divider (full width, accent-glow gradient). */
export function divider(accent: AccentKey, opacity = 0.35): string {
  const a = ACCENTS[accent];
  return `<div style="height:1px;background:linear-gradient(to right, rgba(${a.rgb},0) 0%, rgba(${a.rgb},${opacity}) 50%, rgba(${a.rgb},0) 100%);line-height:1px;font-size:1px;margin:0;">&nbsp;</div>`;
}

/** Solid hairline divider (no glow, for tight separations). */
export function thinRule(): string {
  return `<div style="height:1px;background:#1a1a1a;line-height:1px;font-size:1px;">&nbsp;</div>`;
}

/**
 * Glowing accent CTA button. VML branch for Outlook so the button still renders
 * (no glow there, but the link works). Modern clients get the full halo.
 */
export function button(text: string, href: string, accent: AccentKey): string {
  const a = ACCENTS[accent];
  return `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(href)}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="50%" stroke="f" fillcolor="${a.hex}">
  <w:anchorlock/>
  <center style="color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;">${esc(text)}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-- -->
<a href="${esc(href)}" style="display:inline-block;padding:16px 40px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#ffffff;background:${a.hex};border-radius:999px;text-decoration:none;box-shadow:0 0 32px ${a.glow}, 0 0 64px rgba(${a.rgb}, 0.25), inset 0 1px 0 rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.08);">
  ${esc(text)}
</a>
<!--<![endif]-->`;
}

/**
 * Two-column key/value row used in the order summary stack.
 * Left: caps label · Right: value.
 * Renders as a single table row for layout stability across clients.
 */
export function infoRow(
  labelText: string,
  value: string,
  opts: { accent?: AccentKey; mono?: boolean; emphasize?: boolean } = {},
): string {
  const a = ACCENTS[opts.accent ?? "heart"];
  const labelHtml = `<div style="font-family:${SANS};font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:#777777;font-weight:700;">${esc(labelText)}</div>`;
  const valueFont = opts.mono ? MONO : SANS;
  const valueColor = opts.emphasize ? "#ffffff" : "#dcdcdc";
  const valueSize  = opts.emphasize ? "16px" : "14px";
  const valueWeight = opts.emphasize ? "600" : "400";
  // Underscore the accent character in emphasized rows (the total).
  const accentMark = opts.emphasize
    ? `<span style="color:${a.hex};">·&nbsp;</span>`
    : "";
  const valueHtml = `<div style="font-family:${valueFont};font-size:${valueSize};color:${valueColor};font-weight:${valueWeight};text-align:right;">${accentMark}${esc(value)}</div>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;"><tr>
    <td style="padding:14px 0;vertical-align:middle;" align="left">${labelHtml}</td>
    <td style="padding:14px 0;vertical-align:middle;" align="right">${valueHtml}</td>
  </tr></table>`;
}

/**
 * Item line — used in the "in the box" section. 64×64 image, name + size, price.
 * Accent border-left bar on the image cell so each item visually anchors to the
 * email's stage color.
 */
export interface LineItem {
  name:        string;
  size?:       string | null;
  quantity:    number;
  priceCents:  number;
  imageUrl?:   string | null;
  productUrl?: string | null;
}
export function itemRow(item: LineItem, accent: AccentKey): string {
  const a = ACCENTS[accent];
  const lineTotal = item.priceCents * item.quantity;

  const imgInner = item.imageUrl
    ? `<img src="${esc(item.imageUrl)}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:6px;background:#0c0c0c;object-fit:cover;border:0;" />`
    : `<div style="width:64px;height:64px;border-radius:6px;background:#0c0c0c;"></div>`;
  const img = item.productUrl
    ? `<a href="${esc(item.productUrl)}" style="display:block;text-decoration:none;">${imgInner}</a>`
    : imgInner;

  const nameInner = `<div style="font-family:${SANS};font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#ffffff;line-height:1.35;">${esc(item.name)}</div>`;
  const name = item.productUrl
    ? `<a href="${esc(item.productUrl)}" style="text-decoration:none;color:inherit;">${nameInner}</a>`
    : nameInner;

  const metaParts: string[] = [];
  if (item.size) metaParts.push(`Size ${esc(item.size)}`);
  metaParts.push(`× ${item.quantity}`);
  const meta = `<div style="font-family:${SANS};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#777777;margin-top:6px;">${metaParts.join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</div>`;

  const price = `<div style="font-family:${SANS};font-size:15px;font-weight:600;color:#ffffff;text-align:right;white-space:nowrap;">${esc(eur(lineTotal))}</div>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;"><tr>
    <td width="80" style="padding:18px 16px 18px 0;vertical-align:middle;border-left:2px solid ${a.hex};padding-left:16px;">
      ${img}
    </td>
    <td style="padding:18px 0;vertical-align:middle;">
      ${name}
      ${meta}
    </td>
    <td style="padding:18px 0 18px 16px;vertical-align:middle;" align="right">
      ${price}
    </td>
  </tr></table>`;
}

/**
 * Generic table row wrapper — converts a body fragment into a frame-compatible
 * <tr><td> with consistent vertical rhythm. Use this to slot primitives into
 * the cinematicFrame body.
 */
export function row(html: string, padding = "0"): string {
  return `<tr><td style="padding:${padding};">${html}</td></tr>`;
}

export const FONTS = { SERIF, SANS, MONO } as const;
