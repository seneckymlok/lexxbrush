// ─── Shipping rates - Packeta SK pricelist (valid 14.5.2026) ─────────────────
//
// All customer-facing amounts are returned in CENTS (Stripe convention).
//
// The price the customer pays is computed dynamically per cart, matching what
// Packeta charges Lexxbrush so the shop breaks even on shipping rather than
// eating the difference. Formula per parcel, ex-VAT then VAT'd:
//
//   exVat = base(weightTier)
//         + base × FUEL_SURCHARGE                  (Slovak fuel surcharge)
//         + ceil(kg) × TOLL_PER_KG                 (Packeta toll surcharge)
//   total = round(exVat × (1 + VAT_RATE_SK))
//
// Per-category weight defaults are used because we do not (yet) store a
// per-product weight in the DB. If actual shipments diverge significantly
// from these, tune the numbers - or add a `weight_g` column to `products`
// and replace the lookup.

export type DeliveryType = "pickup" | "home_delivery";

// ── Per-category weight assumptions (kg per single item) ─────────────────────
// Conservative - better to slightly over-quote than to ship at a loss.
const CATEGORY_WEIGHT_KG: Record<string, number> = {
  hoodies:     0.70,
  tees:        0.25,
  pants:       0.60,
  bags:        0.55,
  accessories: 0.15,
};
const FALLBACK_WEIGHT_KG = 0.50; // unknown category

// ── Packeta SK pricelist, ex-VAT (source: client.packeta.com pricelist PDF) ──
// Z-Point PP (pickup point) and Z-Box share the same rate table → "pickup".
const PICKUP_TIERS: Array<{ maxKg: number; baseEur: number }> = [
  { maxKg:  5, baseEur: 2.30 },
  { maxKg: 10, baseEur: 3.80 },
  { maxKg: 15, baseEur: 4.30 },
];

// SK Packeta Home HD - home delivery by courier.
const HOME_TIERS: Array<{ maxKg: number; baseEur: number }> = [
  { maxKg:  1, baseEur:  3.60 },
  { maxKg:  2, baseEur:  4.15 },
  { maxKg:  5, baseEur:  4.35 },
  { maxKg: 10, baseEur:  5.72 },
  { maxKg: 15, baseEur:  6.85 },
  { maxKg: 30, baseEur: 10.29 },
];

const FUEL_SURCHARGE  = 0.185; // 18.5%
const TOLL_PER_KG_EUR = 0.04;  // €0.04 per started kg
const VAT_RATE_SK     = 0.23;  // SK VAT 23%

// ── Free shipping threshold (env-overridable) ────────────────────────────────
const envNum = (key: string, fallback: number) => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const FREE_SHIPPING_THRESHOLD_CENTS = envNum(
  "FREE_SHIPPING_THRESHOLD_CENTS",
  10_000, // €100
);

// ── Cart-weight helper ───────────────────────────────────────────────────────

export interface ShippingItem {
  /** Product category from `products.category` - drives the weight default. */
  category?: string | null;
  quantity?: number | null;
}

/** Sum the cart weight in kg using per-category defaults. */
export function cartWeightKg(items: ShippingItem[]): number {
  return items.reduce<number>((sum, it) => {
    const fromCategory = it.category ? CATEGORY_WEIGHT_KG[it.category] : undefined;
    const w = fromCategory ?? FALLBACK_WEIGHT_KG;
    const q = it.quantity ?? 1;
    return sum + w * q;
  }, 0);
}

// ── Core price computation ───────────────────────────────────────────────────

function pickTier(
  weightKg: number,
  tiers: Array<{ maxKg: number; baseEur: number }>,
) {
  // Walk lightest → heaviest and pick the first tier whose ceiling covers it.
  // Falls back to the heaviest tier for over-weight carts (Packeta will
  // re-classify the parcel as oversize at their end).
  return tiers.find((t) => weightKg <= t.maxKg) ?? tiers[tiers.length - 1];
}

/**
 * Per-parcel shipping cost in cents.
 * (Base tier + fuel surcharge + toll, then SK VAT.)
 */
export function computeShippingCents(
  deliveryType: DeliveryType,
  weightKg: number,
): number {
  const tiers = deliveryType === "pickup" ? PICKUP_TIERS : HOME_TIERS;
  const safeKg = Math.max(weightKg, 0.01);
  const tier   = pickTier(safeKg, tiers);
  const toll   = Math.ceil(safeKg) * TOLL_PER_KG_EUR;
  const exVat  = tier.baseEur + tier.baseEur * FUEL_SURCHARGE + toll;
  return Math.round(exVat * (1 + VAT_RATE_SK) * 100);
}

// ── Public API ───────────────────────────────────────────────────────────────

interface ShippingRate {
  /** Stripe display name shown to the customer on the payment page. */
  label: string;
  /** Amount in cents. */
  amount: number;
  estimateMinDays: number;
  estimateMaxDays: number;
}

const LABELS: Record<DeliveryType, string> = {
  pickup:        "Packeta - Pickup Point",
  home_delivery: "Packeta - Home Delivery",
};

/**
 * Resolve the rate the customer pays, applying the free-shipping threshold
 * against the cart subtotal.
 */
export function resolveShippingRate(
  deliveryType: DeliveryType,
  subtotalCents: number,
  weightKg: number,
): ShippingRate {
  const isFree = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  return {
    label:           isFree ? `${LABELS[deliveryType]} - Free` : LABELS[deliveryType],
    amount:          isFree ? 0 : computeShippingCents(deliveryType, weightKg),
    estimateMinDays: 1,
    estimateMaxDays: 3,
  };
}

/**
 * Build the `shipping_options` array for a Stripe Checkout Session.
 * Returns a single-rate array (delivery type was selected pre-checkout).
 */
export function stripeShippingOptions(
  deliveryType: DeliveryType,
  subtotalCents: number,
  weightKg: number,
) {
  const rate = resolveShippingRate(deliveryType, subtotalCents, weightKg);
  return [
    {
      shipping_rate_data: {
        type: "fixed_amount" as const,
        fixed_amount: {
          amount:   rate.amount,
          currency: "eur",
        },
        display_name: rate.label,
        delivery_estimate: {
          minimum: { unit: "business_day" as const, value: rate.estimateMinDays },
          maximum: { unit: "business_day" as const, value: rate.estimateMaxDays },
        },
      },
    },
  ];
}
