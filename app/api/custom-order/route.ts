import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendCustomOrderNotification } from "@/lib/email/custom-order";
import {
  customOrderLimiter,
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/ratelimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(customOrderLimiter, getClientIp(req));
  if (!rl.success) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  let body: {
    name?: string;
    email?: string;
    garment?: string;
    description?: string;
    budget?: string;
    website?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Silently accept so they don't retry.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const garment = (body.garment || "").trim();
  const description = (body.description || "").trim();
  const budget = (body.budget || "").trim();

  if (!name || !email || !garment || !description) {
    return NextResponse.json(
      { error: "Name, email, garment, and description are required." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  if (
    name.length > 200 ||
    garment.length > 200 ||
    description.length > 5000 ||
    budget.length > 100
  ) {
    return NextResponse.json({ error: "Input too long." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("custom_orders").insert({
    name,
    email,
    garment,
    description,
    budget,
  });

  if (error) {
    console.error("[custom-order] insert failed:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // Notify the admins by email too (the DB row already exists, so this is a
  // best-effort heads-up - it never throws and can't fail the submission).
  // Awaited so the serverless function doesn't get torn down mid-send.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";
  await sendCustomOrderNotification({ name, email, garment, description, budget, siteUrl });

  return NextResponse.json({ ok: true });
}
