// ─── Order delivered notification ────────────────────────────────────────────
//
// Sent automatically by the Packeta sync cron when a packet's status flips to
// "handed to consignee". Club accent (green/settled) closes the loop after the
// spade-blue "in motion" email.

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
  FONTS,
} from "./_design";

export interface OrderDeliveredPayload {
  orderId:       string;
  reference:     string;
  customerEmail: string;
  customerName?: string;
  packetId?:     string;
  siteUrl:       string;
}

function renderHtml(p: OrderDeliveredPayload): string {
  const firstName = p.customerName?.trim().split(/\s+/)[0];
  const greeting  = firstName ? `It's home, ${firstName}.` : "It's home.";
  const reviewUrl = `${p.siteUrl}/account`;

  const heroBlock = `
    ${row(label("Delivered · Arrived", "club"), "0 0 18px 0")}
    ${row(headline(greeting), "0 0 18px 0")}
    ${row(paragraph(
      "Your Lexxbrush piece has landed. Unbox it slowly, the first moment matters. If anything feels off, reply to this email; we read every line."
    ), "0 0 36px 0")}
    ${row(divider("club"), "0 0 32px 0")}
  `;

  const metaBlock = `
    ${row(infoRow("Order", p.reference, { mono: true }), "0")}
    ${p.packetId ? `${row(thinRule(), "0")}${row(infoRow("Packet", p.packetId, { mono: true }), "0")}` : ""}
    ${row(divider("club"), "20px 0 40px 0")}
  `;

  const ctaBlock = `
    <tr><td align="center" style="padding:0 0 24px 0;">
      ${button("Reorder or browse", reviewUrl, "club")}
    </td></tr>
  `;

  const closingBlock = `
    ${row(divider("club"), "48px 0 28px 0")}
    ${row(`<div style="font-family:${FONTS.SERIF};font-style:italic;font-size:14px;line-height:1.7;color:#888888;text-align:center;">
      Tag <a href="https://www.instagram.com/lexxbrush" style="color:#dcdcdc;text-decoration:none;border-bottom:1px solid rgba(46, 160, 67, 0.45);padding-bottom:1px;">@lexxbrush</a> when you style it. We always reshare.
    </div>`, "0")}
  `;

  return cinematicFrame({
    accent:       "club",
    preheader:    `${firstName ? `${firstName}, your` : "Your"} Lexxbrush order ${p.reference} just arrived.`,
    bodyHtml:     `${heroBlock}${metaBlock}${ctaBlock}${closingBlock}`,
    locale:       "en",
    siteUrl:      p.siteUrl,
    contactEmail: ADMIN_EMAIL,
  });
}

function renderText(p: OrderDeliveredPayload): string {
  const firstName = p.customerName?.trim().split(/\s+/)[0];
  const lines: string[] = [];
  lines.push(`LEXXBRUSH - DELIVERED · ARRIVED`);
  lines.push(``);
  lines.push(firstName ? `It's home, ${firstName}.` : `It's home.`);
  lines.push(``);
  lines.push(`Your Lexxbrush piece has landed. Unbox it slowly - the first moment`);
  lines.push(`matters. If anything feels off, reply to this email.`);
  lines.push(``);
  lines.push(`────────────────────────────────────────`);
  lines.push(`Order:   ${p.reference}`);
  if (p.packetId) lines.push(`Packet:  ${p.packetId}`);
  lines.push(`────────────────────────────────────────`);
  lines.push(``);
  lines.push(`Tag @lexxbrush when you style it - we always reshare.`);
  lines.push(``);
  lines.push(`Questions?  ${ADMIN_EMAIL}`);
  lines.push(`lexxbrush.eu · @lexxbrush`);
  return lines.join("\n");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Lexxbrush <onboarding@resend.dev>";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "info@lexxbrush.eu";

/**
 * Send the "your order arrived" email.
 * Never throws; the cron must continue regardless of Resend failures.
 */
export async function sendOrderDelivered(payload: OrderDeliveredPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set - skipping delivered notification");
    return null;
  }
  if (!payload.customerEmail) {
    console.warn("[email] No customer email - skipping delivered notification");
    return null;
  }

  try {
    const result = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      payload.customerEmail,
      replyTo: ADMIN_EMAIL,
      subject: `Delivered · ${payload.reference} - Lexxbrush`,
      html:    renderHtml(payload),
      text:    renderText(payload),
      headers: { "X-Entity-Ref-ID": payload.orderId },
    });
    return result;
  } catch (err) {
    console.error("[email] Delivered notification send failed:", err);
    return null;
  }
}
