import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// ─── Admin: persist product catalog order ────────────────────────────────────
//
// POST { ids: string[] }: the product ids in their new top-to-bottom order.
// Each product's sort_order is set to its index, so the array IS the order.
// Mirrors lib/products.ts, which sorts the public shop by sort_order.

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

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "ids must be a string array" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Small catalog: a handful of point updates is fine. Run them together.
  const results = await Promise.all(
    ids.map((id, index) =>
      admin.from("products").update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 400 });
  }

  // Reflect the new order on the live shop immediately (don't wait for ISR).
  revalidatePath("/");
  revalidatePath("/product/[id]", "page");

  return NextResponse.json({ success: true });
}
