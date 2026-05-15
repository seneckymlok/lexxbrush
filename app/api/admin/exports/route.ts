// ─── Monthly accounting export ──────────────────────────────────────────────
//
// Bundles a calendar month's revenue + cost data into a single ZIP that the
// účtovník can drop straight into their software. Designed for the §7a s.r.o.
// case: we don't charge VAT on our side, but we DO need to hand the
// účtovník the foreign-supplier (Stripe) fees so they can self-assess
// reverse-charge VAT on those services in the monthly DPH return.
//
// Bundle contents:
//   - orders-YYYY-MM.csv     One row per paid order — date, customer, totals
//   - stripe-fees-YYYY-MM.csv  Per-order Stripe fee + net payout (reverse-charge basis)
//   - invoices/              Customer-facing invoice PDFs (one per order)
//
// All three are produced from data we already have on the orders row + a
// single Stripe API call per order to fetch the fee from the balance txn.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import JSZip from "jszip";

// ── Auth ────────────────────────────────────────────────────────────────────

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

// ── CSV helpers ─────────────────────────────────────────────────────────────

/**
 * Escape a single cell for CSV. Wraps in quotes if it contains a comma,
 * quote, or newline; doubles internal quotes per RFC 4180.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}

// ── Money helpers ───────────────────────────────────────────────────────────

/** Cents to "12.34" — Slovak/EU decimal style preferred for účtovník. */
function eur(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return "0.00";
  return (cents / 100).toFixed(2);
}

// ── Month bounds ────────────────────────────────────────────────────────────

/**
 * Parse `YYYY-MM` into [startISO, endISO) — exclusive upper bound so an order
 * at 00:00:00 of the next month is NOT included. All times are UTC; the
 * účtovník does monthly batches per calendar month and timezone-creep at
 * month boundaries would be a real cost-allocation bug.
 */
function monthRange(month: string): { startIso: string; endIso: string; label: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const mon  = parseInt(m[2], 10);
  if (mon < 1 || mon > 12) return null;

  const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0));
  const end   = new Date(Date.UTC(year, mon, 1, 0, 0, 0));
  return {
    startIso: start.toISOString(),
    endIso:   end.toISOString(),
    label:    `${m[1]}-${m[2]}`,
  };
}

// ── Row shape ───────────────────────────────────────────────────────────────
//
// Supabase's typed client widens the select() return to a union that
// includes `GenericStringError` when columns are referenced by string list.
// We narrow with an explicit interface for the columns we read.

interface OrderRow {
  id:                     string;
  created_at:             string;
  customer_name:          string | null;
  customer_email:         string | null;
  customer_phone:         string | null;
  total:                  number | null;
  status:                 string;
  delivery_type:          string | null;
  stripe_session_id:      string | null;
  stripe_payment_intent:  string | null;
  stripe_invoice_id:      string | null;
  invoice_number:         string | null;
  invoice_hosted_url:     string | null;
  invoice_pdf_url:        string | null;
}

// ── Handler ─────────────────────────────────────────────────────────────────

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

  const admin = createAdminClient();

  // Pull every paid order in the requested month. We exclude "pending" and
  // "test" — pending shouldn't show up in books at all, test orders are
  // smoke-test artifacts that would inflate the revenue line.
  const { data: ordersRaw, error } = await admin
    .from("orders")
    .select(
      "id, created_at, customer_name, customer_email, customer_phone, total, status, " +
      "delivery_type, stripe_session_id, stripe_payment_intent, " +
      "stripe_invoice_id, invoice_number, invoice_hosted_url, invoice_pdf_url",
    )
    .gte("created_at", range.startIso)
    .lt("created_at", range.endIso)
    .neq("status", "pending")
    .neq("status", "test")
    .order("created_at", { ascending: true });

  const orders = (ordersRaw ?? []) as unknown as OrderRow[];

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const zip = new JSZip();

  // ── orders CSV ────────────────────────────────────────────────────────────
  const ordersLines: string[] = [
    csvRow([
      "Dátum",
      "Číslo faktúry",
      "ID objednávky",
      "Meno zákazníka",
      "Email zákazníka",
      "Telefón zákazníka",
      "Suma (EUR)",
      "Doručenie",
      "Stav",
      "Stripe session",
      "Stripe payment intent",
      "URL faktúry",
    ]),
  ];
  for (const o of orders) {
    ordersLines.push(
      csvRow([
        o.created_at,
        o.invoice_number ?? "",
        o.id,
        o.customer_name ?? "",
        o.customer_email ?? "",
        o.customer_phone ?? "",
        eur(o.total),
        o.delivery_type ?? "",
        o.status,
        o.stripe_session_id ?? "",
        o.stripe_payment_intent ?? "",
        o.invoice_hosted_url ?? "",
      ]),
    );
  }
  zip.file(`orders-${range.label}.csv`, ordersLines.join("\n") + "\n");

  // ── Stripe fees CSV + invoice PDFs ────────────────────────────────────────
  //
  // For each paid order we look up the payment intent → latest charge →
  // balance transaction to read the EXACT Stripe fee charged. That fee is
  // the basis for the §7a reverse-charge VAT self-assessment.
  //
  // Done serially: monthly batch sizes are tiny (tens, not thousands), and
  // Stripe rate limits make parallel-then-recover more code than it's worth.
  const feesLines: string[] = [
    csvRow([
      "Dátum",
      "Číslo faktúry",
      "ID objednávky",
      "Hrubá suma (EUR)",
      "Stripe poplatok (EUR)",
      "Čistý príjem (EUR)",
      "Mena",
      "Charge ID",
      "Balance txn ID",
    ]),
  ];

  const invoiceFolder = zip.folder("invoices");

  for (const o of orders) {
    // ── Stripe fee lookup ───────────────────────────────────────────────────
    let gross = o.total ?? 0;       // cents
    let fee = 0;                     // cents
    let net = gross;                 // cents
    let chargeId = "";
    let balanceTxnId = "";

    if (o.stripe_payment_intent) {
      try {
        const pi = await stripe.paymentIntents.retrieve(o.stripe_payment_intent, {
          expand: ["latest_charge.balance_transaction"],
        });
        const charge = pi.latest_charge as any;
        if (charge && typeof charge === "object") {
          chargeId = charge.id ?? "";
          const bt = charge.balance_transaction;
          if (bt && typeof bt === "object") {
            balanceTxnId = bt.id ?? "";
            gross = bt.amount ?? gross;
            fee   = bt.fee ?? 0;
            net   = bt.net ?? (gross - fee);
          }
        }
      } catch (err) {
        // Don't fail the whole export for one missing fee — log and continue
        // with the on-row total only. Účtovník can spot the missing fee.
        console.error(`[exports] fee lookup failed for order ${o.id}:`, err);
      }
    }

    feesLines.push(
      csvRow([
        o.created_at,
        o.invoice_number ?? "",
        o.id,
        eur(gross),
        eur(fee),
        eur(net),
        "EUR",
        chargeId,
        balanceTxnId,
      ]),
    );

    // ── Invoice PDF ─────────────────────────────────────────────────────────
    // Stripe's invoice_pdf URL is signed and time-limited. Fetch it now
    // while the export is being built — the cached link in our DB may be
    // weeks old. Re-retrieving the invoice gives us a fresh signed URL.
    if (invoiceFolder && o.stripe_invoice_id) {
      try {
        const inv = await stripe.invoices.retrieve(o.stripe_invoice_id);
        if (inv.invoice_pdf) {
          const res = await fetch(inv.invoice_pdf);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            const name = `invoice-${inv.number || o.id.slice(0, 8)}.pdf`;
            invoiceFolder.file(name, buf);
          }
        }
      } catch (err) {
        console.error(`[exports] PDF fetch failed for order ${o.id}:`, err);
      }
    }
  }
  zip.file(`stripe-fees-${range.label}.csv`, feesLines.join("\n") + "\n");

  // ── README — explains the bundle to the účtovník ──────────────────────────
  zip.file(
    "README.txt",
    [
      `Lexxbrush, s. r. o. — Účtovný export · ${range.label}`,
      ``,
      `Obsah:`,
      `  orders-${range.label}.csv      Zoznam zaplatených objednávok za daný mesiac.`,
      `  stripe-fees-${range.label}.csv  Stripe poplatok a čistý príjem za každú objednávku.`,
      `                                 Slúži ako podklad pre samozdanenie DPH (§7a)`,
      `                                 z prijatých služieb od Stripe Payments Europe Ltd. (IE).`,
      `  invoices/                      PDF faktúr vystavených zákazníkom za daný mesiac.`,
      ``,
      `Spoločnosť Lexxbrush, s. r. o. nie je platiteľom DPH podľa §4`,
      `zákona č. 222/2004 Z. z. — IČ DPH SK2122713032 je registrované podľa §7a.`,
      ``,
      `Vygenerované: ${new Date().toISOString()}`,
    ].join("\n"),
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="lexxbrush-export-${range.label}.zip"`,
      "Cache-Control":       "no-store",
    },
  });
}
