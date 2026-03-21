import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildShippingEmailHtml(orderId: string, trackingUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Lexxbrush Order Has Shipped!</title>
  <style>
    body {
      background-color: #0a0a0a;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #0a0a0a;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #111111;
      border: 1px solid #333333;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .header {
      text-align: center;
      padding: 40px 20px 20px 20px;
    }
    .content {
      padding: 30px 40px;
      text-align: center;
    }
    .title {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #ffffff;
      letter-spacing: 0.05em;
    }
    .text {
      color: #a0a0a0;
      font-size: 15px;
      margin-bottom: 30px;
    }
    .order-number {
      font-family: monospace;
      font-size: 16px;
      color: #ffffff;
      background-color: #222222;
      padding: 6px 12px;
      border-radius: 6px;
      margin: 0 4px;
    }
    .btn {
      display: inline-block;
      background-color: #ffffff;
      color: #000000;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 16px 36px;
      border-radius: 8px;
    }
    .footer {
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #222222;
    }
    .footer-text {
      color: #666666;
      font-size: 12px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="https://lexxbrush.eu" target="_blank">
          <img src="https://lexxbrush.eu/logo.png" alt="Lexxbrush" style="height: 48px; width: auto; object-fit: contain; border: 0;" />
        </a>
      </div>
      <div class="content">
        <h2 class="title">Great News! Your Order Has Shipped</h2>
        <p class="text">We've just completely packed up tracking <span class="order-number">#${orderId.substring(0, 8)}</span> and handed it over to the shipper. Your wearable art is on its way.</p>
        <a href="${trackingUrl}" class="btn">Track Order Details</a>
      </div>
      <div class="footer">
        <p class="footer-text" style="margin-bottom: 16px;">This is an automated message, please do not reply to this email.<br>If you need help, please contact <a href="mailto:info@lexxbrush.eu" style="color: #a0a0a0; text-decoration: underline;">info@lexxbrush.eu</a>.</p>
        <p class="footer-text">© 2026 Lexxbrush. All rights reserved.<br>Hand-painted wearable art.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
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

  // If this was an order status update to "shipped", dispatch the Resend email
  if (table === "orders" && data.status === "shipped") {
    try {
      // Fetch the customer email for this order to send the notification
      const { data: orderData } = await admin.from("orders").select("customer_email").eq("id", id).single();
      
      if (orderData?.customer_email) {
        const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu"}/account`;
        const emailHtml = buildShippingEmailHtml(id, trackingUrl);

        await resend.emails.send({
          from: "Lexxbrush <noreply@lexxbrush.eu>",
          to: orderData.customer_email,
          subject: "Your Lexxbrush order has shipped! 📦",
          html: emailHtml,
        });
      }
    } catch (err) {
      console.error("Failed to send shipping email:", err);
      // We don't fail the PATCH request if the email fails, the DB already updated.
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
  return NextResponse.json({ success: true });
}
