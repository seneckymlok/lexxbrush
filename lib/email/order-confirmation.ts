// ─── Order confirmation email ────────────────────────────────────────────────
//
// Two emails are sent per successful order:
//
//   • CUSTOMER  → cinematic, heart-purple lit. "Thank you. Your piece is being
//                 prepared by hand." Full order summary, delivery, invoice PDF
//                 attached when available.
//
//   • ADMIN     → cinematic, diamond-cyan lit. "New order - €X." Compact,
//                 urgent, functional - designed for a glance from a phone.
//
// Both share the same Lexxbrush cinematic frame (see `_design.ts`) so the
// brand voice is identical even though the moods differ.

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
  itemRow,
  row,
  esc,
  eur,
  FONTS,
} from "./_design";

// ─── Types (PUBLIC API - do not break callers) ──────────────────────────────

export interface OrderEmailItem {
  /** Display name (English, since email needs a stable canonical form) */
  name: string;
  quantity: number;
  size?: string | null;
  /** Per-unit price in cents */
  priceCents: number;
  /** Optional product image URL - absolute, https */
  imageUrl?: string | null;
  /** Optional link to the product page */
  productUrl?: string | null;
}

export interface OrderEmailDelivery {
  type: "pickup" | "home_delivery";
  /** Human-readable summary line, e.g. "Z-Box, Hlavná 12, 821 04 Bratislava" */
  summary: string;
}

export interface OrderEmailPayload {
  orderId:           string;
  /** Short reference shown to the customer - typically order id slice */
  reference:         string;
  customerEmail:     string;
  customerName?:     string;
  customerPhone?:    string;
  items:             OrderEmailItem[];
  subtotalCents:     number;
  shippingCents:     number;
  totalCents:        number;
  delivery:          OrderEmailDelivery | null;
  /** Base site URL - used for "manage your order" link */
  siteUrl:           string;
  /** Stripe invoice PDF buffer - attached when available */
  invoicePdf?:       Buffer;
  invoiceNumber?:    string;
}

// ─── Customer email ──────────────────────────────────────────────────────────

function renderCustomerHtml(p: OrderEmailPayload): string {
  // ── Greeting + intro ─────────────────────────────────────────────────────
  const firstName = p.customerName?.trim().split(/\s+/)[0];
  const greeting  = firstName ? `Thank you, ${firstName}.` : "Thank you.";

  const headerBlock = `
    ${row(label("Order · Confirmed", "heart"), "0 0 18px 0")}
    ${row(headline(greeting),                  "0 0 18px 0")}
    ${row(paragraph(
      "Your piece is now in our hands. Every Lexxbrush garment is hand-airbrushed - give us a few days while we finish the work properly. You'll hear from us again the moment it ships."
    ), "0 0 36px 0")}
    ${row(divider("heart"), "0 0 32px 0")}
  `;

  // ── Meta strip (reference + email + invoice) ─────────────────────────────
  const metaBlock = `
    ${row(infoRow("Reference",  p.reference,     { mono: true }), "0")}
    ${row(thinRule(), "0")}
    ${row(infoRow("Sent to",    p.customerEmail),                  "0")}
    ${p.invoiceNumber ? `${row(thinRule(), "0")}${row(infoRow("Invoice", p.invoiceNumber, { mono: true }), "0")}` : ""}
    ${row(divider("heart"), "20px 0 28px 0")}
  `;

  // ── In the box (line items) ─────────────────────────────────────────────
  const itemsHtml = p.items
    .map((it, i) => {
      const rowHtml = itemRow({
        name:       it.name,
        size:       it.size,
        quantity:   it.quantity,
        priceCents: it.priceCents,
        imageUrl:   it.imageUrl,
        productUrl: it.productUrl,
      }, "heart");
      const separator = i < p.items.length - 1 ? row(thinRule(), "0") : "";
      return row(rowHtml, "0") + separator;
    })
    .join("");

  const itemsBlock = `
    ${row(label("In the box", "heart"), "0 0 8px 0")}
    ${itemsHtml}
    ${row(divider("heart"), "16px 0 8px 0")}
  `;

  // ── Totals ──────────────────────────────────────────────────────────────
  const shippingValue = p.shippingCents === 0 ? "Free" : eur(p.shippingCents);
  const totalsBlock = `
    ${row(infoRow("Subtotal", eur(p.subtotalCents)),                                   "0")}
    ${row(infoRow("Shipping", shippingValue),                                          "0")}
    ${row(divider("heart", 0.25), "12px 0 0 0")}
    ${row(infoRow("Total",    eur(p.totalCents), { accent: "heart", emphasize: true }), "0")}
    ${row(divider("heart"), "16px 0 36px 0")}
  `;

  // ── Delivery details ────────────────────────────────────────────────────
  const deliveryBlock = p.delivery
    ? `
      ${row(label("Delivery", "heart"), "0 0 12px 0")}
      ${row(`<div style="font-family:${FONTS.SANS};font-size:13px;color:#dcdcdc;line-height:1.65;">
        <div style="font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-size:11px;color:#aaaaaa;margin-bottom:6px;">
          ${esc(p.delivery.type === "pickup" ? "Packeta - Pickup Point" : "Packeta - Home Delivery")}
        </div>
        <div style="font-size:14px;color:#dcdcdc;">${esc(p.delivery.summary)}</div>
      </div>`, "0 0 32px 0")}
      ${row(divider("heart"), "0 0 36px 0")}
    `
    : "";

  // ── What happens next (the editorial moment) ────────────────────────────
  // Four-step ladder. Each step has its own micro-typography. Cinematic
  // touch: the numbered marker is the accent color, ghosted to 30%.
  const steps: Array<[string, string]> = [
    ["01", "We've received your order."],
    ["02", "Your piece is prepared and packaged by hand - usually 1-3 business days."],
    ["03", "Tracking arrives the moment the courier collects it."],
    ["04", "You wear it. Tag @lexxbrush if you do - we always reshare."],
  ];

  const stepsHtml = steps
    .map(([num, text]) => `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;"><tr>
        <td width="56" valign="top" style="padding:14px 0;vertical-align:top;">
          <div style="font-family:${FONTS.SERIF};font-style:italic;font-size:22px;color:rgba(136, 0, 204, 0.4);font-weight:400;line-height:1;">${num}</div>
        </td>
        <td valign="top" style="padding:14px 0;vertical-align:top;">
          <div style="font-family:${FONTS.SANS};font-size:14px;color:#bbbbbb;line-height:1.6;">${esc(text)}</div>
        </td>
      </tr></table>`)
    .join("");

  const stepsBlock = `
    ${row(label("What happens next", "heart"), "0 0 8px 0")}
    ${row(stepsHtml, "0")}
    ${row(divider("heart"), "32px 0 40px 0")}
  `;

  // ── CTA ─────────────────────────────────────────────────────────────────
  const ctaUrl = `${p.siteUrl.replace(/\/$/, "")}/order/${p.orderId}`;
  const ctaBlock = `
    <tr><td align="center" style="padding:0 0 16px 0;">
      ${button("View your order", ctaUrl, "heart")}
    </td></tr>
    ${p.invoicePdf ? `
      <tr><td align="center" style="padding:18px 0 0 0;">
        <div style="font-family:${FONTS.SANS};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5a5a5a;">
          Invoice attached as PDF
        </div>
      </td></tr>` : ""}
  `;

  // ── Assemble ────────────────────────────────────────────────────────────
  const body = `
    ${headerBlock}
    ${metaBlock}
    ${itemsBlock}
    ${totalsBlock}
    ${deliveryBlock}
    ${stepsBlock}
    ${ctaBlock}
  `;

  return cinematicFrame({
    accent:       "heart",
    preheader:    `${firstName ? `${firstName}, your` : "Your"} Lexxbrush order ${p.reference} is confirmed - ${eur(p.totalCents)}.`,
    bodyHtml:     body,
    locale:       "en",
    siteUrl:      p.siteUrl,
    contactEmail: ADMIN_EMAIL,
  });
}

function renderCustomerText(p: OrderEmailPayload): string {
  const lines: string[] = [];
  const firstName = p.customerName?.trim().split(/\s+/)[0];

  lines.push(`LEXXBRUSH - ORDER · CONFIRMED`);
  lines.push(``);
  lines.push(firstName ? `Thank you, ${firstName}.` : `Thank you.`);
  lines.push(``);
  lines.push(`Your piece is now in our hands. Every Lexxbrush garment is`);
  lines.push(`hand-airbrushed - give us a few days while we finish the work`);
  lines.push(`properly. You'll hear from us again the moment it ships.`);
  lines.push(``);
  lines.push(`────────────────────────────────────────`);
  lines.push(`Reference:  ${p.reference}`);
  lines.push(`Sent to:    ${p.customerEmail}`);
  if (p.invoiceNumber) lines.push(`Invoice:    ${p.invoiceNumber}`);
  lines.push(`────────────────────────────────────────`);
  lines.push(``);
  lines.push(`IN THE BOX`);
  lines.push(``);
  for (const it of p.items) {
    const size = it.size ? ` · Size ${it.size}` : "";
    const qty  = it.quantity > 1 ? ` × ${it.quantity}` : "";
    lines.push(`  ${it.name}${size}${qty}`);
    lines.push(`  ${eur(it.priceCents * it.quantity)}`);
    lines.push(``);
  }
  lines.push(`────────────────────────────────────────`);
  lines.push(`Subtotal:   ${eur(p.subtotalCents)}`);
  lines.push(`Shipping:   ${p.shippingCents === 0 ? "Free" : eur(p.shippingCents)}`);
  lines.push(`Total:      ${eur(p.totalCents)}`);
  lines.push(`────────────────────────────────────────`);
  if (p.delivery) {
    lines.push(``);
    lines.push(`DELIVERY`);
    lines.push(p.delivery.type === "pickup" ? "Packeta - Pickup Point" : "Packeta - Home Delivery");
    lines.push(p.delivery.summary);
  }
  lines.push(``);
  lines.push(`WHAT HAPPENS NEXT`);
  lines.push(`01  We've received your order.`);
  lines.push(`02  Your piece is prepared and packaged by hand (1-3 business days).`);
  lines.push(`03  Tracking arrives the moment the courier collects it.`);
  lines.push(`04  You wear it. Tag @lexxbrush if you do.`);
  lines.push(``);
  lines.push(`View your order:  ${p.siteUrl.replace(/\/$/, "")}/order/${p.orderId}`);
  if (p.invoicePdf) lines.push(`Invoice attached as PDF.`);
  lines.push(``);
  lines.push(`Questions?  ${ADMIN_EMAIL}`);
  lines.push(`lexxbrush.eu · @lexxbrush`);
  return lines.join("\n");
}

// ─── Admin notification email ────────────────────────────────────────────────
//
// Same frame, different lighting (cyan = diamond = electric/urgent), different
// information hierarchy. Designed to be readable in 2 seconds on a phone.

function renderAdminHtml(p: OrderEmailPayload): string {
  // Big total - the first thing visible after the logo.
  const totalBlock = `
    ${row(label("New order · Incoming", "diamond"), "0 0 18px 0")}
    ${row(`<div style="font-family:${FONTS.SERIF};font-style:italic;font-size:54px;line-height:1;color:#ffffff;font-weight:400;letter-spacing:-0.02em;">
      ${esc(eur(p.totalCents))}
    </div>`, "0 0 12px 0")}
    ${row(`<div style="font-family:${FONTS.SANS};font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:#00DDEE;font-weight:700;">
      Order ${esc(p.reference)}
    </div>`, "0 0 36px 0")}
    ${row(divider("diamond"), "0 0 28px 0")}
  `;

  // Customer block - name, email, phone.
  const phoneRow = p.customerPhone
    ? `${row(thinRule(), "0")}${row(infoRow("Phone", p.customerPhone, { mono: true }), "0")}`
    : "";
  const customerBlock = `
    ${row(label("Customer", "diamond"), "0 0 8px 0")}
    ${row(infoRow("Name",  p.customerName || "(not provided)"), "0")}
    ${row(thinRule(), "0")}
    ${row(infoRow("Email", p.customerEmail), "0")}
    ${phoneRow}
    ${row(divider("diamond"), "20px 0 28px 0")}
  `;

  // Items - same component, cyan-themed.
  const itemsHtml = p.items
    .map((it, i) => {
      const rowHtml = itemRow({
        name:       it.name,
        size:       it.size,
        quantity:   it.quantity,
        priceCents: it.priceCents,
        imageUrl:   it.imageUrl,
        productUrl: it.productUrl,
      }, "diamond");
      const separator = i < p.items.length - 1 ? row(thinRule(), "0") : "";
      return row(rowHtml, "0") + separator;
    })
    .join("");

  const itemsBlock = `
    ${row(label("Items", "diamond"), "0 0 8px 0")}
    ${itemsHtml}
    ${row(divider("diamond"), "16px 0 28px 0")}
  `;

  // Totals breakdown - admin needs to see the split.
  const shippingValue = p.shippingCents === 0 ? "Free" : eur(p.shippingCents);
  const totalsBlock = `
    ${row(infoRow("Subtotal", eur(p.subtotalCents)),                                       "0")}
    ${row(infoRow("Shipping", shippingValue),                                              "0")}
    ${row(divider("diamond", 0.25), "12px 0 0 0")}
    ${row(infoRow("Total",    eur(p.totalCents), { accent: "diamond", emphasize: true }), "0")}
    ${row(divider("diamond"), "16px 0 28px 0")}
  `;

  // Delivery - emphasized for the admin since they need to know how to ship.
  const deliveryBlock = p.delivery
    ? `
      ${row(label("Delivery", "diamond"), "0 0 12px 0")}
      ${row(`<div style="font-family:${FONTS.SANS};font-size:13px;color:#dcdcdc;line-height:1.65;">
        <div style="font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-size:11px;color:#aaaaaa;margin-bottom:6px;">
          ${esc(p.delivery.type === "pickup" ? "Packeta - Pickup Point" : "Packeta - Home Delivery")}
        </div>
        <div style="font-size:14px;color:#dcdcdc;">${esc(p.delivery.summary)}</div>
      </div>`, "0 0 32px 0")}
      ${row(divider("diamond"), "0 0 36px 0")}
    `
    : "";

  // CTA - straight into the admin panel.
  const adminUrl = `${p.siteUrl.replace(/\/$/, "")}/admin/orders`;
  const ctaBlock = `
    <tr><td align="center" style="padding:0;">
      ${button("Open in admin", adminUrl, "diamond")}
    </td></tr>
  `;

  const body = `
    ${totalBlock}
    ${customerBlock}
    ${itemsBlock}
    ${totalsBlock}
    ${deliveryBlock}
    ${ctaBlock}
  `;

  return cinematicFrame({
    accent:       "diamond",
    preheader:    `New order ${p.reference} - ${eur(p.totalCents)} · ${p.customerName || p.customerEmail}`,
    bodyHtml:     body,
    locale:       "en",
    siteUrl:      p.siteUrl,
    contactEmail: ADMIN_EMAIL,
  });
}

function renderAdminText(p: OrderEmailPayload): string {
  const itemsSummary = p.items
    .map((i) => `${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ""}`)
    .join(", ");

  return [
    `LEXXBRUSH - NEW ORDER · INCOMING`,
    ``,
    `${eur(p.totalCents)}`,
    `Order ${p.reference}`,
    ``,
    `────────────────────────────────────────`,
    `Customer:   ${p.customerName || "(no name)"} <${p.customerEmail}>`,
    p.customerPhone ? `Phone:      ${p.customerPhone}` : "",
    `────────────────────────────────────────`,
    ``,
    `Items:      ${itemsSummary}`,
    ``,
    `Subtotal:   ${eur(p.subtotalCents)}`,
    `Shipping:   ${p.shippingCents === 0 ? "Free" : eur(p.shippingCents)}`,
    `Total:      ${eur(p.totalCents)}`,
    ``,
    p.delivery ? `Delivery:   ${p.delivery.type === "pickup" ? "Pickup" : "Home delivery"} - ${p.delivery.summary}` : "",
    ``,
    `View in admin: ${p.siteUrl.replace(/\/$/, "")}/admin/orders`,
  ].filter(Boolean).join("\n");
}

// ─── Sender ──────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Lexxbrush <onboarding@resend.dev>";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "info@lexxbrush.eu";

/**
 * Send the order confirmation email to the customer + admin notification.
 * Returns the customer-email Resend response on success, or `null` on failure.
 * The webhook must NOT fail just because the email didn't go out.
 */
export async function sendOrderConfirmation(payload: OrderEmailPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set - skipping order confirmation");
    return null;
  }
  if (!payload.customerEmail) {
    console.warn("[email] No customer email on order - skipping confirmation");
    return null;
  }

  try {
    // ── Customer confirmation ──────────────────────────────────────────────
    const result = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      payload.customerEmail,
      replyTo: ADMIN_EMAIL,
      subject: `Order confirmed · ${payload.reference} - Lexxbrush`,
      html:    renderCustomerHtml(payload),
      text:    renderCustomerText(payload),
      headers: { "X-Entity-Ref-ID": payload.orderId },
      ...(payload.invoicePdf ? {
        attachments: [{
          filename: `invoice-${payload.invoiceNumber || payload.reference}.pdf`,
          content:  payload.invoicePdf,
        }],
      } : {}),
    });

    // ── Admin notification ─────────────────────────────────────────────────
    // Fire-and-forget - never block or throw on admin notify failure.
    resend.emails.send({
      from:    FROM_EMAIL,
      to:      ADMIN_EMAIL,
      subject: `New order · ${eur(payload.totalCents)} - ${payload.reference}`,
      html:    renderAdminHtml(payload),
      text:    renderAdminText(payload),
      headers: { "X-Entity-Ref-ID": `${payload.orderId}-admin` },
    }).catch((err) => {
      console.error("[email] Admin notify failed (non-fatal):", err);
    });

    return result;
  } catch (err) {
    console.error("[email] Order confirmation send failed:", err);
    return null;
  }
}
