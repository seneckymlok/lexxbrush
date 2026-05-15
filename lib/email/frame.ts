// ─── Newsletter email frame ──────────────────────────────────────────────────
//
// The dark, suit-themed shell that wraps every newsletter-class email.
// Pure string-template - no env access, no React, no DB - so it can run
// on both the server (real sends) and inside the admin composer's preview
// pane. Identical bytes either way, guaranteed by sharing this module.

export type Locale = "en" | "sk";

const COPY = {
  en: {
    unsub:     "Unsubscribe",
    questions: "Questions? Write to",
    tagline:   "Hand-airbrushed wearable art. Every piece is unique.",
  },
  sk: {
    unsub:     "Odhlásiť sa",
    questions: "Otázky? Píš na",
    tagline:   "Ručne airbrushované nositeľné umenie. Každý kus je unikát.",
  },
} as const;

const esc = (s: string | undefined | null) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export interface WrapInFrameOpts {
  /** Preheader (hidden inbox preview snippet). */
  preheader:   string;
  /** Body content. May be either raw HTML (default) or one-or-more <tr> rows. */
  bodyHtml:    string;
  /** Whether `bodyHtml` is already a sequence of <tr> rows. Default false. */
  bodyIsRows?: boolean;
  locale:      Locale;
  /** Public unsubscribe URL. Falsy → unsub link is omitted. */
  unsubUrl?:   string | null;
  /** Public site URL - `https://lexxbrush.eu` by default in callers. */
  siteUrl:     string;
  /** Reply-to / contact address shown in the footer. */
  contactEmail:string;
}

export function wrapInFrame(opts: WrapInFrameOpts): string {
  const c = COPY[opts.locale];
  const bodyTr = opts.bodyIsRows
    ? opts.bodyHtml
    : `<tr><td style="padding:0;">${opts.bodyHtml}</td></tr>`;

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

          ${bodyTr}

          <tr>
            <td align="center" style="padding:48px 0 0 0;">
              <div style="border-top:1px solid #1a1a1a;padding-top:32px;">
                <div style="color:#6a6a6a;font-size:11px;line-height:1.6;">
                  ${esc(c.questions)}
                  <a href="mailto:${esc(opts.contactEmail)}" style="color:#dcdcdc;text-decoration:none;">${esc(opts.contactEmail)}</a>.
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
