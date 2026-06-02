import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { monthRange, buildMonthlyExportBuffer } from "@/lib/exports";
import { ADMIN_EMAILS } from "@/lib/email/admin-recipients";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Lexxbrush <onboarding@resend.dev>";

export async function GET(req: NextRequest) {
  // Verify request is from Vercel Cron. Fail-closed: a missing CRON_SECRET
  // means anyone can trigger this endpoint, so refuse to run until it's set.
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret) {
    console.error("[cron/export] CRON_SECRET not configured - refusing to run");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine previous month
  const now = new Date();
  // If it's May 1st, getMonth() is 4. Subtract 1 -> 3 (April).
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthParam = `${year}-${month}`;

  const range = monthRange(monthParam);
  if (!range) {
    return NextResponse.json({ error: "Failed to determine month range" }, { status: 500 });
  }

  try {
    const buffer = await buildMonthlyExportBuffer(range);

    if (!process.env.RESEND_API_KEY) {
      console.warn("[cron] RESEND_API_KEY not set - cannot send email");
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAILS,
      subject: `Lexxbrush Monthly Export: ${range.label}`,
      text: `Dobrý deň,\n\nv prílohe nájdete mesačný účtovný export za obdobie ${range.label}.\n\nS pozdravom,\nLexxbrush systém`,
      attachments: [
        {
          filename: `lexxbrush-export-${range.label}.zip`,
          content: buffer,
        },
      ],
    });

    return NextResponse.json({ success: true, message: `Export for ${range.label} sent successfully.` });
  } catch (error: any) {
    console.error("[cron/export]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
