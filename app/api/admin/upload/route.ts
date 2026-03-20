import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return !!user;
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `products/${fileName}`;

  const admin = createAdminClient();

  // Ensure bucket exists
  const { data: buckets } = await admin.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === "product-images");

  if (!bucketExists) {
    await admin.storage.createBucket("product-images", { public: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from("product-images")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = admin.storage.from("product-images").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
