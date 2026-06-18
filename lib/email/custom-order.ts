// ─── Custom-order request → admin notification ───────────────────────────────
//
// Fired when someone submits the "custom request" form. The request is already
// persisted to the custom_orders table (the source of truth); this is the
// branded heads-up so the admin sees it in their inbox too, not only in the
// panel. Diamond-cyan lit, matching the new-order admin alert. replyTo is set
// to the customer so a reply goes straight back to them.

import { Resend } from "resend";
import { ADMIN_EMAIL, ADMIN_EMAILS } from "@/lib/email/admin-recipients";
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

export interface CustomOrderPayload {
  name: string;
  email: string;
  garment: string;
  description: string;
  budget?: string;
  siteUrl: string;
}

function renderHtml(p: CustomOrderPayload): string {
  const firstName = p.name.trim().split(/\s+/)[0];

  const header = `
    ${row(label("Custom request · Incoming", "diamond"), "0 0 18px 0")}
    ${row(headline(firstName ? `New request from ${firstName}.` : "New custom request."), "0 0 18px 0")}
    ${row(paragraph("Someone wants a one-of-one. The brief is below; reply straight to this email and it reaches them."), "0 0 32px 0")}
    ${row(divider("diamond"), "0 0 28px 0")}
  `;

  const who = `
    ${row(label("Who", "diamond"), "0 0 8px 0")}
    ${row(infoRow("Name", p.name), "0")}
    ${row(thinRule(), "0")}
    ${row(infoRow("Email", p.email), "0")}
    ${row(divider("diamond"), "20px 0 28px 0")}
  `;

  const brief = `
    ${row(label("Brief", "diamond"), "0 0 8px 0")}
    ${row(infoRow("Garment", p.garment), "0")}
    ${p.budget ? `${row(thinRule(), "0")}${row(infoRow("Budget", p.budget), "0")}` : ""}
    ${row(divider("diamond"), "20px 0 28px 0")}
  `;

  const vision = `
    ${row(label("Their vision", "diamond"), "0 0 12px 0")}
    ${row(
      `<div style="font-family:${FONTS.SANS};font-size:14px;line-height:1.65;color:#dcdcdc;white-space:pre-wrap;">${esc(p.description)}</div>`,
      "0 0 32px 0",
    )}
    ${row(divider("diamond"), "0 0 36px 0")}
  `;

  const cta = `
    <tr><td align="center" style="padding:0;">
      ${button("Open in admin", `${p.siteUrl.replace(/\/$/, "")}/admin/custom-orders`, "diamond")}
    </td></tr>
  `;

  return cinematicFrame({
    accent: "diamond",
    preheader: `New custom request from ${p.name}: ${p.garment}`,
    bodyHtml: `${header}${who}${brief}${vision}${cta}`,
    locale: "en",
    siteUrl: p.siteUrl,
    contactEmail: ADMIN_EMAIL,
  });
}

function renderText(p: CustomOrderPayload): string {
  const L: string[] = [];
  L.push("LEXXBRUSH · CUSTOM REQUEST · INCOMING");
  L.push("");
  L.push(p.name ? `New request from ${p.name}.` : "New custom request.");
  L.push("");
  L.push("WHO");
  L.push(`Name:     ${p.name}`);
  L.push(`Email:    ${p.email}`);
  L.push("");
  L.push("BRIEF");
  L.push(`Garment:  ${p.garment}`);
  if (p.budget) L.push(`Budget:   ${p.budget}`);
  L.push("");
  L.push("THEIR VISION");
  L.push(p.description);
  L.push("");
  L.push(`Open in admin: ${p.siteUrl.replace(/\/$/, "")}/admin/custom-orders`);
  L.push("Reply to this email to reach the customer directly.");
  return L.join("\n");
}

// Lazy so importing this module never throws when RESEND_API_KEY is absent.
let _resend: Resend | null = null;
function resendClient(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Lexxbrush <onboarding@resend.dev>";

/**
 * Email the admins about a new custom request. Never throws - the request is
 * already saved, so a mail hiccup must not fail the submission.
 */
export async function sendCustomOrderNotification(p: CustomOrderPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set - skipping custom-order notification");
    return;
  }
  try {
    const { error } = await resendClient().emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAILS,
      replyTo: p.email,
      subject: `New custom request · ${p.garment} - ${p.name}`,
      html: renderHtml(p),
      text: renderText(p),
    });
    if (error) console.error("[email] custom-order notification failed:", error);
  } catch (err) {
    console.error("[email] custom-order notification threw:", err);
  }
}
