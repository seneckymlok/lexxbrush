// ─── Order shipped notification ──────────────────────────────────────────────
//
// Sent when an admin flips an order's status to "shipped" in the admin panel.
// Cinematic frame, SPADE blue lit (settled, in motion) — distinct mood from
// the heart-purple order confirmation that arrived earlier.

import { Resend } from "resend";
import {
  cinematicFrame,
  label,
  headline,
  paragraph,
  divider,
  thinRule,
  button,
  infoRow,
  row,
  esc,
  FONTS,
} from "./_design";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderShippedPayload {
  orderId:       string;
  /** Short reference shown to the customer (typically the order id slice). */
  reference:     string;
  customerEmail: string;
  customerName?: string;
  /** Public tracking URL (Packeta). Required — the email is useless without it. */
  trackingUrl:   string;
  /** Optional Packeta packet ID, shown as a mono-typed reference line. */
  packetId?:     string;
  /** Base site URL for the footer link. */
  siteUrl:       string;
}

// ─── HTML render ────────────────────────────────────────────────────────────

function renderHtml(p: OrderShippedPayload): string {
  const firstName = p.customerName?.trim().split(/\s+/)[0];
  const greeting  = firstName ? `It's on its way, ${firstName}.` : "It's on its way.";

  // Hero block — "shipped · in motion" label, big italic headline, body copy.
  const heroBlock = `
    ${row(label("Shipped · In motion", "spade"), "0 0 18px 0")}
    ${row(headline(greeting), "0 0 18px 0")}
    ${row(paragraph(
      "Your Lexxbrush piece has just left our hands. Packeta picked it up and you can follow it from here. We always include the tracking link below — bookmark it if you like watching parcels travel."
    ), "0 0 36px 0")}
    ${row(divider("spade"), "0 0 32px 0")}
  `;

  // Reference block — order id + packet id (when present).
  const metaBlock = `
    ${row(infoRow("Order", p.reference, { mono: true }), "0")}
    ${p.packetId ? `${row(thinRule(), "0")}${row(infoRow("Packet", p.packetId, { mono: true }), "0")}` : ""}
    ${row(divider("spade"), "20px 0 40px 0")}
  `;

  // CTA — the tracking button is the whole point of this email.
  const ctaBlock = `
    <tr><td align="center" style="padding:0 0 24px 0;">
      ${button("Track your parcel", p.trackingUrl, "spade")}
    </td></tr>

    <tr><td align="center" style="padding:0 0 8px 0;">
      <div style="font-family:${FONTS.SANS};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5a5a5a;">
        Or paste this link
      </div>
    </td></tr>
    <tr><td align="center" style="padding:0 16px;">
      <div style="font-family:${FONTS.MONO};font-size:11px;color:#888888;word-break:break-all;line-height:1.5;">
        ${esc(p.trackingUrl)}
      </div>
    </td></tr>
  `;

  // Closing — small editorial note. Reinforces the brand voice.
  const closingBlock = `
    ${row(divider("spade"), "48px 0 28px 0")}
    ${row(`<div style="font-family:${FONTS.SERIF};font-style:italic;font-size:14px;line-height:1.7;color:#888888;text-align:center;">
      When it arrives, tag <a href="https://www.instagram.com/lexxbrush" style="color:#dcdcdc;text-decoration:none;border-bottom:1px solid rgba(26, 46, 230, 0.45);padding-bottom:1px;">@lexxbrush</a> — we always reshare.
    </div>`, "0")}
  `;

  return cinematicFrame({
    accent:       "spade",
    preheader:    `${firstName ? `${firstName}, your` : "Your"} Lexxbrush order ${p.reference} just shipped — tracking inside.`,
    bodyHtml:     `${heroBlock}${metaBlock}${ctaBlock}${closingBlock}`,
    locale:       "en",
    siteUrl:      p.siteUrl,
    contactEmail: ADMIN_EMAIL,
  });
}

function renderText(p: OrderShippedPayload): string {
  const firstName = p.customerName?.trim().split(/\s+/)[0];
  const lines: string[] = [];
  lines.push(`LEXXBRUSH — SHIPPED · IN MOTION`);
  lines.push(``);
  lines.push(firstName ? `It's on its way, ${firstName}.` : `It's on its way.`);
  lines.push(``);
  lines.push(`Your Lexxbrush piece has just left our hands. Packeta picked it up`);
  lines.push(`and you can follow it from here.`);
  lines.push(``);
  lines.push(`────────────────────────────────────────`);
  lines.push(`Order:   ${p.reference}`);
  if (p.packetId) lines.push(`Packet:  ${p.packetId}`);
  lines.push(`────────────────────────────────────────`);
  lines.push(``);
  lines.push(`Track your parcel:`);
  lines.push(p.trackingUrl);
  lines.push(``);
  lines.push(`When it arrives, tag @lexxbrush — we always reshare.`);
  lines.push(``);
  lines.push(`Questions?  ${ADMIN_EMAIL}`);
  lines.push(`lexxbrush.eu · @lexxbrush`);
  return lines.join("\n");
}

// ─── Sender ──────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Lexxbrush <onboarding@resend.dev>";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "info@lexxbrush.eu";

/**
 * Send the "your order has shipped" email.
 * Returns the Resend response on success, or `null` on failure.
 * Never throws — admin status flip must succeed regardless of email outcome.
 */
export async function sendOrderShipped(payload: OrderShippedPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping shipped notification");
    return null;
  }
  if (!payload.customerEmail) {
    console.warn("[email] No customer email — skipping shipped notification");
    return null;
  }
  if (!payload.trackingUrl) {
    console.warn("[email] No tracking URL — skipping shipped notification");
    return null;
  }

  try {
    const result = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      payload.customerEmail,
      replyTo: ADMIN_EMAIL,
      subject: `Shipped · ${payload.reference} — Lexxbrush`,
      html:    renderHtml(payload),
      text:    renderText(payload),
      headers: { "X-Entity-Ref-ID": payload.orderId },
    });
    return result;
  } catch (err) {
    console.error("[email] Shipped notification send failed:", err);
    return null;
  }
}
