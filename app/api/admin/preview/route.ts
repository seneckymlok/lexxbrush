import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// ─── Admin preview (Next.js Draft Mode) ──────────────────────────────────────
//
// Lets a signed-in admin see scheduled drops on the live site before they go
// public, to check everything looks right.
//
//   GET /api/admin/preview?on=1   → (admin only) enable draft mode
//   GET /api/admin/preview?on=0   → disable draft mode (anyone; just clears
//                                   the bypass cookie for this browser)
//
// enable() sets the `__prerender_bypass` cookie. Only requests carrying it
// render dynamically with `includeUnreleased`; everyone else keeps the cached
// static page, so the public site is untouched.

export const runtime = "nodejs";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return !!user;
}

export async function GET(req: NextRequest) {
  const on = new URL(req.url).searchParams.get("on");
  const draft = await draftMode();

  // Turning preview OFF is harmless (it only drops this browser's bypass
  // cookie), so the in-site "exit preview" button can call it without a token.
  if (on === "0") {
    draft.disable();
    return NextResponse.json({ preview: false });
  }

  // Turning preview ON is gated to admins, same bar as every other /api/admin.
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  draft.enable();
  return NextResponse.json({ preview: true });
}
