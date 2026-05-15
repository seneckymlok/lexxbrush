import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { createPacket } from "@/lib/packeta";
import {
  sendOrderConfirmation,
  type OrderEmailItem,
  type OrderEmailDelivery,
} from "@/lib/email/order-confirmation";
import crypto from "node:crypto";
import { sendNewsletterConfirm } from "@/lib/email/newsletter";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deliverySummary(deliveryType: string | null, data: any): OrderEmailDelivery | null {
  if (!deliveryType || !data) return null;

  if (deliveryType === "pickup" && data.point) {
    const p = data.point;
    return {
      type: "pickup",
      summary: `${p.name} - ${p.street}, ${p.zip} ${p.city}`,
    };
  }
  if (deliveryType === "home_delivery" && data.address) {
    const a = data.address;
    return {
      type: "home_delivery",
      summary: `${a.street} ${a.houseNumber}, ${a.postcode} ${a.city}${a.country ? `, ${String(a.country).toUpperCase()}` : ""}`,
    };
  }
  return null;
}

// ─── Webhook handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("[stripe-webhook] received POST", {
    contentType: req.headers.get("content-type"),
    hasSig: !!req.headers.get("stripe-signature"),
  });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("[stripe-webhook] missing stripe-signature header");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret === "whsec_placeholder") {
    console.error(
      "[stripe-webhook] STRIPE_WEBHOOK_SECRET is missing or placeholder - webhook cannot verify. " +
        "Set the real value from Stripe dashboard → Developers → Webhooks → your endpoint → Signing secret.",
    );
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    console.error("[stripe-webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[stripe-webhook] verified event", { type: event.type, id: event.id });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const supabase = createAdminClient();

    try {
      const items = JSON.parse(session.metadata?.items || "[]");
      const productIds = JSON.parse(session.metadata?.product_ids || "[]");
      const deliveryType = session.metadata?.delivery_type || null;
      const deliveryData = session.metadata?.delivery_data
        ? JSON.parse(session.metadata.delivery_data)
        : null;
      const customerName = session.metadata?.customer_name || "";
      const customerPhone = session.metadata?.customer_phone || "";

      // Test-mode flag set by the checkout API when the admin test token
      // matched. Suppresses ONLY the billable Packeta packet creation.
      // The order row, the confirmation email, and the one-of-a-kind
      // "mark as sold" inventory lock still fire - those are free side
      // effects that need to be exercised end-to-end to validate the flow.
      const isTestMode = session.metadata?.test_mode === "true";

      console.log("[stripe-webhook] processing checkout.session.completed", {
        sessionId: session.id,
        email: session.customer_details?.email,
        amount: session.amount_total,
        testMode: session.metadata?.test_mode === "true",
      });

      // Fetch full product data before inserting so we can store enriched items.
      const { data: productRows } = await supabase
        .from("products")
        .select("id, name_en, images, price")
        .in("id", productIds);

      // Build enriched items - flat format readable by both account page and admin.
      const enrichedItems = items.map((item: any, i: number) => {
        const fullId  = productIds[i];
        const product = productRows?.find((p: any) => p.id === fullId);
        return {
          productId: fullId,
          name:      product?.name_en || item.n || "Product",
          price:     product?.price   ?? 0,
          quantity:  item.q  ?? item.quantity ?? 1,
          size:      item.s  || item.size     || null,
          images:    product?.images || [],
        };
      });

      // Create order in database with Packeta delivery info.
      // We still create the order row in test mode - that's how you verify
      // the pipeline works - but it's clearly tagged.
      const { data: order, error: insertError } = await supabase.from("orders").insert({
        stripe_session_id: session.id,
        user_id: session.metadata?.user_id || null,
        stripe_payment_intent: session.payment_intent,
        customer_email: session.customer_details?.email,
        customer_name: customerName || session.customer_details?.name || null,
        customer_phone: customerPhone || session.customer_details?.phone || null,
        items: enrichedItems,
        total: session.amount_total,
        status: isTestMode ? "test" : "paid",
        shipping_address: deliveryData || session.shipping_details?.address || null,
        delivery_type: deliveryType,
      }).select("id").single();

      if (insertError) {
        console.error("[stripe-webhook] orders insert FAILED:", insertError);
      } else {
        console.log("[stripe-webhook] order inserted", { orderId: order?.id });
      }

      // Mark one-of-a-kind products as sold. Runs in test mode too -
      // the inventory lock is a real business effect we want to verify,
      // and it costs nothing.
      for (const id of productIds) {
        const { data: product } = await supabase
          .from("products")
          .select("is_one_of_a_kind")
          .eq("id", id)
          .single();

        if (product?.is_one_of_a_kind) {
          await supabase
            .from("products")
            .update({ is_sold: true })
            .eq("id", id);
        }
      }

      // ── Confirmation email ──────────────────────────────────────────────
      // Fetch the full product rows for the items so the email can show
      // accurate names + the first product image. Falls back to the shorter
      // metadata if a product can't be looked up.
      if (order?.id && session.customer_details?.email) {
        try {
          const subtotalCents = (session.amount_total ?? 0) - (session.total_details?.amount_shipping ?? 0);
          const shippingCents = session.total_details?.amount_shipping ?? 0;
          const totalCents    = session.amount_total ?? 0;

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";
          const emailItems: OrderEmailItem[] = enrichedItems.map((it: any) => ({
            name:       it.name,
            quantity:   it.quantity,
            size:       it.size || null,
            priceCents: it.price,
            imageUrl:   it.images?.[0] || null,
            productUrl: it.productId ? `${siteUrl}/product/${it.productId}` : null,
          }));

          // Fetch Stripe-generated invoice + persist its URLs on the order
          // row so the admin panel can link to the hosted page and download
          // the PDF without round-tripping back to Stripe.
          let invoicePdf: Buffer | undefined;
          let invoiceNumber: string | undefined;
          if (session.invoice) {
            try {
              const invoice = await stripe.invoices.retrieve(session.invoice as string);
              invoiceNumber = invoice.number ?? undefined;

              // Persist invoice metadata. Fire-and-forget by design - a
              // failure here must not break the email flow below.
              await supabase
                .from("orders")
                .update({
                  stripe_invoice_id:  invoice.id ?? null,
                  invoice_number:     invoice.number ?? null,
                  invoice_hosted_url: invoice.hosted_invoice_url ?? null,
                  invoice_pdf_url:    invoice.invoice_pdf ?? null,
                })
                .eq("id", order.id);

              if (invoice.invoice_pdf) {
                const res = await fetch(invoice.invoice_pdf);
                if (res.ok) {
                  invoicePdf = Buffer.from(await res.arrayBuffer());
                }
              }
            } catch (invErr) {
              console.error("[stripe-webhook] invoice fetch/persist failed:", invErr);
            }
          }

          await sendOrderConfirmation({
            orderId:       order.id,
            reference:     invoiceNumber || order.id.slice(0, 8).toUpperCase(),
            customerEmail: session.customer_details.email,
            customerName:  customerName || undefined,
            customerPhone: customerPhone || session.customer_details?.phone || undefined,
            items:         emailItems,
            subtotalCents,
            shippingCents,
            totalCents,
            delivery:      deliverySummary(deliveryType, deliveryData),
            siteUrl:       process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu",
            invoicePdf,
            invoiceNumber,
          });
        } catch (emailErr) {
          // Never fail the webhook for an email issue - the order is valid.
          console.error("Order confirmation email failed:", emailErr);
        }
      }

      // ── Newsletter opt-in ──────────────────────────────────────────────
      // Customer ticked the "email me when new pieces drop" box at checkout.
      // We only act on it AFTER a successful payment so abandoned carts
      // never pollute the list. Real orders only - test mode skipped.
      if (!isTestMode && session.metadata?.newsletter_opt_in === "true") {
        const optInEmail = session.customer_details?.email?.toLowerCase().trim();
        if (optInEmail) {
          try {
            const supa = supabase;
            const { data: existing } = await supa
              .from("newsletter_subscribers")
              .select("id, status")
              .eq("email", optInEmail)
              .maybeSingle();

            // Already-confirmed buyer → do nothing (don't double-subscribe).
            // Suppressed (bounced/complained) → do nothing.
            const reusable = !existing
              || existing.status === "pending"
              || existing.status === "unsubscribed";

            if (reusable) {
              const confirmToken = crypto.randomBytes(32).toString("base64url");
              const unsubToken   = crypto.randomBytes(32).toString("base64url");
              const locale = "en"; // checkout locale not currently captured in metadata
              const consentSource = "checkout";

              if (existing) {
                await supa
                  .from("newsletter_subscribers")
                  .update({
                    status:         "pending",
                    confirm_token:  confirmToken,
                    unsub_token:    unsubToken,
                    locale,
                    source:         consentSource,
                    user_id:        session.metadata?.user_id || null,
                    consent_source: consentSource,
                    created_at:     new Date().toISOString(),
                    confirmed_at:   null,
                    unsubscribed_at: null,
                  })
                  .eq("id", existing.id);
              } else {
                await supa
                  .from("newsletter_subscribers")
                  .insert({
                    email:          optInEmail,
                    locale,
                    status:         "pending",
                    source:         consentSource,
                    confirm_token:  confirmToken,
                    unsub_token:    unsubToken,
                    user_id:        session.metadata?.user_id || null,
                    consent_source: consentSource,
                  });
              }

              await sendNewsletterConfirm({
                email:        optInEmail,
                locale,
                confirmToken,
                siteUrl:      process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu",
              });
            }
          } catch (newsletterErr) {
            // Never fail the webhook for the newsletter side-effect.
            console.error("[stripe-webhook] newsletter opt-in failed:", newsletterErr);
          }
        }
      }

      // Auto-create Packeta packet after payment - REAL ORDERS ONLY.
      if (deliveryData && order?.id) {
        try {
          const rawName = customerName || session.customer_details?.name || "Customer";
          const [firstName, ...lastParts] = rawName.trim().split(/\s+/);
          const surname = lastParts.join(" ") || firstName;
          const valueEur = ((session.amount_total || 0) / 100).toFixed(2);

          // Real cart weight (kg) stored by the checkout API from the
          // per-category weight table. Falls back to 0.5 kg only for legacy
          // sessions where the metadata key didn't exist yet.
          const packetWeightKg = Number(session.metadata?.cart_weight_kg) || 0.5;

          const packetParams: Parameters<typeof createPacket>[0] = {
            number: order.id.replace(/-/g, "").substring(0, 24),
            name: firstName,
            surname,
            email: session.customer_details?.email || "",
            phone: customerPhone || undefined,
            value: valueEur,
            currency: "EUR",
            weight: packetWeightKg,
          };

          if (deliveryType === "pickup" && deliveryData.point) {
            packetParams.addressId = Number(deliveryData.point.id);
          } else if (deliveryType === "home_delivery" && deliveryData.address) {
            packetParams.carrierId = deliveryData.address.carrierId;
            packetParams.street = deliveryData.address.street;
            packetParams.houseNumber = deliveryData.address.houseNumber || undefined;
            packetParams.city = deliveryData.address.city;
            packetParams.zip = deliveryData.address.postcode;
            packetParams.country = (deliveryData.address.country || deliveryData.country || "").toUpperCase();
          }

          const { packetId } = await createPacket(packetParams);

          await supabase.from("orders").update({
            packeta_packet_id: packetId,
          }).eq("id", order.id);

          console.log(`Packeta packet created: ${packetId} for order ${order.id}`);
        } catch (packetaError) {
          // Don't fail the webhook - order is still valid, admin can retry manually
          console.error("Packeta packet creation failed:", packetaError);
        }
      }
    } catch (err) {
      console.error("Error processing webhook:", err);
    }
  }

  return NextResponse.json({ received: true });
}
