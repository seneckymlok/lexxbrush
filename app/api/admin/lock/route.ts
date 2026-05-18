import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

async function verifyAdmin(req: NextRequest) {
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
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("lock_enabled, lock_title_en, lock_title_sk, lock_subtitle_en, lock_subtitle_sk")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    lock_enabled?: boolean;
    lock_title_en?: string;
    lock_title_sk?: string;
    lock_subtitle_en?: string;
    lock_subtitle_sk?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.lock_enabled === "boolean") update.lock_enabled = body.lock_enabled;
  for (const k of ["lock_title_en", "lock_title_sk", "lock_subtitle_en", "lock_subtitle_sk"] as const) {
    if (typeof body[k] === "string") {
      const v = (body[k] as string).slice(0, 500);
      update[k] = v;
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .update(update)
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}
