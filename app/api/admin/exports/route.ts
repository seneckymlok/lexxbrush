import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { monthRange, buildMonthlyExportBuffer } from "@/lib/exports";

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
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  if (!monthParam) {
    return NextResponse.json({ error: "Missing ?month=YYYY-MM" }, { status: 400 });
  }

  const range = monthRange(monthParam);
  if (!range) {
    return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
  }

  try {
    const buffer = await buildMonthlyExportBuffer(range);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type":        "application/zip",
        "Content-Disposition": `attachment; filename="lexxbrush-export-${range.label}.zip"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
