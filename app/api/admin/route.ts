import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { getTrackingUrl } from "@/lib/packeta";
import { sendOrderShipped } from "@/lib/email/order-shipped";

/**
 * Invalidate Next.js cache for the public-facing surfaces that depend on
 * product data, so admin mutations are visible on the live site immediately
 * (instead of waiting for the 60s ISR window or a redeploy).
 *
 * Called on every products insert / update / delete. For updates we pass the
 * product id so its detail page is invalidated specifically; the homepage is
 * always invalidated.
 */
function revalidateProductSurfaces(productId?: string) {
  // Homepage shows the product grid.
  revalidatePath("/");
  // Every product detail page is a separate cached entry, keyed by [id].
  // Passing "page" tells Next.js to invalidate the dynamic segment.
  revalidatePath("/product/[id]", "page");
  // Belt-and-suspenders: also revalidate the specific id if known.
  if (productId) {
    revalidatePath(`/product/${productId}`);
  }
}

// Helper to verify the user is authenticated
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

// GET — list products, orders, custom_orders, or stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");
  const admin = createAdminClient();

  if (table === "stats") {
    const [products, orders, customOrders] = await Promise.all([
      admin.from("products").select("*", { count: "exact", head: true }),
      admin.from("orders").select("*").order("created_at", { ascending: false }),
      admin.from("custom_orders").select("*", { count: "exact", head: true }).in("status", ["new", "reviewed"]),
    ]);

    const allOrders = orders.data || [];
    const paidOrders = allOrders.filter((o) => o.status !== "pending");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    return NextResponse.json({
      totalRevenue,
      totalOrders: allOrders.length,
      totalProducts: products.count || 0,
      pendingCustomOrders: customOrders.count || 0,
      recentOrders: allOrders.slice(0, 8),
    });
  }

  if (!table || !["products", "orders", "custom_orders"].includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  if (id) {
    const { data, error } = await admin.from(table).select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  const { data, error } = await admin.from(table).select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST — insert a row
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { table, data } = await req.json();
  const admin = createAdminClient();

  const { data: result, error } = await admin.from(table).insert(data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (table === "products" && result?.id) {
    revalidateProductSurfaces(result.id);
  }

  return NextResponse.json(result);
}

// PATCH — update a row
export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { table, id, data } = await req.json();
  const admin = createAdminClient();

  const { error } = await admin.from(table).update(data).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (table === "products") {
    revalidateProductSurfaces(id);
  }

  // If this was an order status update to "shipped", dispatch the
  // cinematic spade-blue "your parcel is in motion" email.
  if (table === "orders" && data.status === "shipped") {
    try {
      const { data: orderData } = await admin
        .from("orders")
        .select("customer_email, customer_name, packeta_packet_id")
        .eq("id", id)
        .single();

      if (orderData?.customer_email) {
        const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";
        const trackingUrl = orderData.packeta_packet_id
          ? getTrackingUrl(orderData.packeta_packet_id)
          : `${siteUrl}/account`;

        await sendOrderShipped({
          orderId:       id,
          reference:     id.slice(0, 8).toUpperCase(),
          customerEmail: orderData.customer_email,
          customerName:  orderData.customer_name || undefined,
          trackingUrl,
          packetId:      orderData.packeta_packet_id || undefined,
          siteUrl,
        });
      }
    } catch (err) {
      // Never fail the PATCH for an email issue — the DB already updated.
      console.error("[admin] Shipped email dispatch failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE — delete a row
export async function DELETE(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");

  if (!table || !id) {
    return NextResponse.json({ error: "Missing table or id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (table === "products") {
    revalidateProductSurfaces(id);
  }

  return NextResponse.json({ success: true });
}
