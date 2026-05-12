// ─── Order confirmation email ────────────────────────────────────────────────
//
// Builds and sends a branded order confirmation via Resend.
// Designed for email-client hostility: inline styles only, table layout,
// web-safe fonts, max-width 600px, plain-text fallback.

import { Resend } from "resend";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderEmailItem {
  /** Display name (English, since email needs a stable canonical form) */
  name: string;
  quantity: number;
  size?: string | null;
  /** Per-unit price in cents */
  priceCents: number;
  /** Optional product image URL — absolute, https */
  imageUrl?: string | null;
}

export interface OrderEmailDelivery {
  type: "pickup" | "home_delivery";
  /** Human-readable summary line, e.g. "Z-Box, Hlavná 12, 821 04 Bratislava" */
  summary: string;
}

export interface OrderEmailPayload {
  orderId:           string;
  /** Short reference shown to the customer — typically order id slice */
  reference:         string;
  customerEmail:     string;
  customerName?:     string;
  items:             OrderEmailItem[];
  subtotalCents:     number;
  shippingCents:     number;
  totalCents:        number;
  delivery:          OrderEmailDelivery | null;
  /** Base site URL — used for "manage your order" link */
  siteUrl:           string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const eur = (cents: number) =>
  `€${(cents / 100).toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const esc = (s: string | undefined | null) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ─── HTML template ───────────────────────────────────────────────────────────

function renderHtml(p: OrderEmailPayload): string {
  const itemsRows = p.items
    .map((item) => {
      const lineTotal = item.priceCents * item.quantity;
      const img = item.imageUrl
        ? `<img src="${esc(item.imageUrl)}" alt="" width="64" height="64" style="display:block;border-radius:8px;background:#111;object-fit:cover;" />`
        : `<div style="width:64px;height:64px;border-radius:8px;background:#111;"></div>`;

      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #1a1a1a;vertical-align:top;width:80px;">
            ${img}
          </td>
          <td style="padding:14px 0 14px 16px;border-bottom:1px solid #1a1a1a;vertical-align:top;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.4;">
            <div style="font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-size:13px;">${esc(item.name)}</div>
            ${item.size ? `<div style="color:#8a8a8a;font-size:11px;margin-top:4px;letter-spacing:0.1em;text-transform:uppercase;">Size · ${esc(item.size)}</div>` : ""}
            ${item.quantity > 1 ? `<div style="color:#8a8a8a;font-size:11px;margin-top:2px;">× ${item.quantity}</div>` : ""}
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #1a1a1a;vertical-align:top;text-align:right;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:500;white-space:nowrap;">
            ${eur(lineTotal)}
          </td>
        </tr>`;
    })
    .join("");

  const deliveryBlock = p.delivery
    ? `
      <tr>
        <td style="padding:24px 0 0 0;">
          <div style="color:#6a6a6a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:8px;">
            ${p.delivery.type === "pickup" ? "Pickup Point" : "Home Delivery"}
          </div>
          <div style="color:#dcdcdc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;">
            ${esc(p.delivery.summary)}
          </div>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Order confirmed</title>
</head>
<body style="margin:0;padding:0;background:#050505;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <!-- Preheader (hidden on render, shown in inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;line-height:0;font-size:0;">
    Your Lexxbrush order ${esc(p.reference)} is confirmed — ${eur(p.totalCents)}.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#050505;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#6a6a6a;">
                Lexxbrush
              </div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:0 0 32px 0;">
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#a014dc;margin-bottom:12px;">
                ♥ &nbsp; Order Confirmed
              </div>
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:36px;font-weight:800;line-height:1;color:#ffffff;letter-spacing:-0.02em;">
                Your hand is dealt.
              </div>
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#8a8a8a;margin-top:16px;">
                ${p.customerName ? `${esc(p.customerName)}, your` : "Your"} order is in. Every piece is painted entirely by hand — give us a few days to finish the work and prepare it for the courier.
              </div>
            </td>
          </tr>

          <!-- Order block -->
          <tr>
            <td style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;padding:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

                <!-- Reference + email -->
                <tr>
                  <td style="padding-bottom:20px;border-bottom:1px solid #1a1a1a;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <div style="color:#6a6a6a;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;">Order</div>
                          <div style="color:#ffffff;font-size:13px;font-family:'Menlo',monospace;margin-top:4px;">${esc(p.reference)}</div>
                        </td>
                        <td align="right">
                          <div style="color:#6a6a6a;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;">Email</div>
                          <div style="color:#dcdcdc;font-size:13px;margin-top:4px;">${esc(p.customerEmail)}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items -->
                <tr>
                  <td style="padding-top:8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${itemsRows}
                    </table>
                  </td>
                </tr>

                <!-- Totals -->
                <tr>
                  <td style="padding-top:18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="color:#8a8a8a;font-size:13px;padding:4px 0;">Subtotal</td>
                        <td align="right" style="color:#dcdcdc;font-size:13px;padding:4px 0;">${eur(p.subtotalCents)}</td>
                      </tr>
                      <tr>
                        <td style="color:#8a8a8a;font-size:13px;padding:4px 0;">Shipping</td>
                        <td align="right" style="color:#dcdcdc;font-size:13px;padding:4px 0;">${p.shippingCents === 0 ? "Free" : eur(p.shippingCents)}</td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;border-top:1px solid #1a1a1a;color:#ffffff;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:600;">
                          Total
                        </td>
                        <td align="right" style="padding-top:14px;border-top:1px solid #1a1a1a;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.01em;">
                          ${eur(p.totalCents)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${deliveryBlock}

              </table>
            </td>
          </tr>

          <!-- Next steps -->
          <tr>
            <td style="padding:40px 0 0 0;">
              <div style="color:#6a6a6a;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">
                What happens next
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:8px 0;color:#dcdcdc;font-size:13px;line-height:1.6;">
                    <span style="color:#a014dc;">♥</span> &nbsp; We confirm your order (now).
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#dcdcdc;font-size:13px;line-height:1.6;">
                    <span style="color:#00dcff;">◆</span> &nbsp; Your piece is prepared and packaged — usually 1–3 business days.
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#dcdcdc;font-size:13px;line-height:1.6;">
                    <span style="color:#dcdc1e;">♣</span> &nbsp; Packeta tracking link arrives by email when the courier picks it up.
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#dcdcdc;font-size:13px;line-height:1.6;">
                    <span style="color:#3264ff;">♠</span> &nbsp; You wear it. Tag <strong style="color:#ffffff;">@lexxbrush</strong> if you do.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:48px 0 0 0;border-top:1px solid #1a1a1a;margin-top:40px;">
              <div style="border-top:1px solid #1a1a1a;padding-top:32px;">
                <div style="color:#6a6a6a;font-size:11px;line-height:1.6;">
                  Questions? Reply to this email or write to
                  <a href="mailto:info@lexxbrush.eu" style="color:#dcdcdc;text-decoration:none;">info@lexxbrush.eu</a>.
                </div>
                <div style="color:#4a4a4a;font-size:10px;line-height:1.6;margin-top:16px;letter-spacing:0.15em;text-transform:uppercase;">
                  <a href="${esc(p.siteUrl)}" style="color:#6a6a6a;text-decoration:none;">lexxbrush.eu</a>
                  &nbsp;·&nbsp;
                  <a href="https://www.instagram.com/lexxbrush" style="color:#6a6a6a;text-decoration:none;">@lexxbrush</a>
                </div>
                <div style="color:#3a3a3a;font-size:10px;line-height:1.6;margin-top:24px;">
                  Hand-airbrushed wearable art. Every piece is unique.
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

// ─── Plain-text fallback ─────────────────────────────────────────────────────

function renderText(p: OrderEmailPayload): string {
  const lines: string[] = [];
  lines.push(`LEXXBRUSH — Order confirmed`);
  lines.push(``);
  lines.push(`${p.customerName ? `${p.customerName}, your` : "Your"} order is in.`);
  lines.push(`Every piece is painted entirely by hand — give us a few days to finish the work.`);
  lines.push(``);
  lines.push(`Order: ${p.reference}`);
  lines.push(`Email: ${p.customerEmail}`);
  lines.push(``);
  lines.push(`Items`);
  lines.push(`-----`);
  for (const item of p.items) {
    const size = item.size ? ` · Size ${item.size}` : "";
    const qty  = item.quantity > 1 ? ` × ${item.quantity}` : "";
    lines.push(`${item.name}${size}${qty}    ${eur(item.priceCents * item.quantity)}`);
  }
  lines.push(``);
  lines.push(`Subtotal:  ${eur(p.subtotalCents)}`);
  lines.push(`Shipping:  ${p.shippingCents === 0 ? "Free" : eur(p.shippingCents)}`);
  lines.push(`Total:     ${eur(p.totalCents)}`);
  if (p.delivery) {
    lines.push(``);
    lines.push(`${p.delivery.type === "pickup" ? "Pickup Point" : "Home Delivery"}`);
    lines.push(p.delivery.summary);
  }
  lines.push(``);
  lines.push(`What happens next`);
  lines.push(`-----------------`);
  lines.push(`1. We confirm your order (now).`);
  lines.push(`2. Your piece is prepared and packaged — usually 1–3 business days.`);
  lines.push(`3. Packeta tracking link arrives by email when the courier picks it up.`);
  lines.push(`4. You wear it. Tag @lexxbrush if you do.`);
  lines.push(``);
  lines.push(`Questions? Reply to this email or write to info@lexxbrush.eu`);
  lines.push(`${p.siteUrl}`);
  return lines.join("\n");
}

// ─── Sender ──────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Lexxbrush <onboarding@resend.dev>";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "info@lexxbrush.eu";

/**
 * Send the order confirmation email to the customer.
 * Returns the Resend response on success, or `null` on failure.
 * The webhook must NOT fail just because the email didn't go out.
 */
export async function sendOrderConfirmation(payload: OrderEmailPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping order confirmation");
    return null;
  }
  if (!payload.customerEmail) {
    console.warn("[email] No customer email on order — skipping confirmation");
    return null;
  }

  try {
    // ── Customer confirmation ──────────────────────────────────────────────
    const result = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      payload.customerEmail,
      replyTo: ADMIN_EMAIL,
      subject: `Order confirmed — ${payload.reference} · Lexxbrush`,
      html:    renderHtml(payload),
      text:    renderText(payload),
      headers: { "X-Entity-Ref-ID": payload.orderId },
    });

    // ── Admin notification ─────────────────────────────────────────────────
    // Fire-and-forget — never block or throw on admin notify failure.
    const itemsSummary = payload.items
      .map((i) => `${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ""}`)
      .join(", ");
    const totalEur = `€${(payload.totalCents / 100).toFixed(2)}`;

    resend.emails.send({
      from:    FROM_EMAIL,
      to:      ADMIN_EMAIL,
      subject: `New order ${payload.reference} — ${totalEur}`,
      text: [
        `New order on Lexxbrush`,
        ``,
        `Reference:  ${payload.reference}`,
        `Customer:   ${payload.customerName || "(no name)"} <${payload.customerEmail}>`,
        `Total:      ${totalEur}`,
        `Items:      ${itemsSummary}`,
        payload.delivery ? `Delivery:   ${payload.delivery.type === "pickup" ? "Pickup" : "Home delivery"} — ${payload.delivery.summary}` : "",
        ``,
        `View in admin: ${payload.siteUrl}/admin/orders`,
      ].filter(Boolean).join("\n"),
      html: `
        <p style="font-family:sans-serif;font-size:14px;color:#111;">
          <strong>New order on Lexxbrush</strong><br><br>
          <b>Reference:</b> ${payload.reference}<br>
          <b>Customer:</b> ${payload.customerName || "(no name)"} &lt;${payload.customerEmail}&gt;<br>
          <b>Total:</b> ${totalEur}<br>
          <b>Items:</b> ${itemsSummary}<br>
          ${payload.delivery ? `<b>Delivery:</b> ${payload.delivery.type === "pickup" ? "Pickup" : "Home delivery"} — ${payload.delivery.summary}<br>` : ""}
          <br>
          <a href="${payload.siteUrl}/admin/orders">View in admin →</a>
        </p>`,
    }).catch((err) => {
      console.error("[email] Admin notify failed (non-fatal):", err);
    });

    return result;
  } catch (err) {
    console.error("[email] Order confirmation send failed:", err);
    return null;
  }
}
