import { createAdminClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import JSZip from "jszip";

// ── CSV helpers ─────────────────────────────────────────────────────────────

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}

// ── Money helpers ───────────────────────────────────────────────────────────

export function eur(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return "0.00";
  return (cents / 100).toFixed(2);
}

// ── Month bounds ────────────────────────────────────────────────────────────

export function monthRange(month: string): { startIso: string; endIso: string; label: string } | null {
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
    label:    `${m[1]}-${String(m[2]).padStart(2, "0")}`,
  };
}

// ── Row shape ───────────────────────────────────────────────────────────────

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

export async function buildMonthlyExportBuffer(range: { startIso: string; endIso: string; label: string }): Promise<Buffer> {
  const admin = createAdminClient();

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
    throw new Error(error.message);
  }

  const zip = new JSZip();

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
    let gross = o.total ?? 0;
    let fee = 0;
    let net = gross;
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
  return buffer;
}
