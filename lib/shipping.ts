// ─── Shipping rates (single source of truth) ─────────────────────────────────
//
// All amounts are in CENTS (smallest currency unit), as Stripe expects.
// Override at the Vercel env level without touching code if rates change.
//
// SHIPPING_PICKUP_CENTS          — Packeta pickup point / Z-Box
// SHIPPING_HOME_CENTS            — Packeta home delivery (courier)
// FREE_SHIPPING_THRESHOLD_CENTS  — cart subtotal at/above which shipping is free
//                                  (set to a huge number to disable, e.g. 9999999)

export type DeliveryType = "pickup" | "home_delivery";

interface ShippingRate {
  /** Stripe display name shown to the customer on the payment page */
  label: string;
  /** Amount in cents */
  amount: number;
  /** Delivery estimate range, in business days */
  estimateMinDays: number;
  estimateMaxDays: number;
}

const env = (key: string, fallback: number) => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const SHIPPING_RATES: Record<DeliveryType, ShippingRate> = {
  pickup: {
    label:           "Packeta — Pickup Point",
    amount:          env("SHIPPING_PICKUP_CENTS", 299),
    estimateMinDays: 1,
    estimateMaxDays: 3,
  },
  home_delivery: {
    label:           "Packeta — Home Delivery",
    amount:          env("SHIPPING_HOME_CENTS", 499),
    estimateMinDays: 1,
    estimateMaxDays: 3,
  },
};

/** Free shipping kicks in at/above this subtotal (in cents). */
export const FREE_SHIPPING_THRESHOLD_CENTS = env(
  "FREE_SHIPPING_THRESHOLD_CENTS",
  10_000, // €100
);

/**
 * Compute the actual shipping rate the customer pays, applying the
 * free-shipping threshold against the cart subtotal.
 */
export function resolveShippingRate(
  deliveryType: DeliveryType,
  subtotalCents: number,
): ShippingRate {
  const base = SHIPPING_RATES[deliveryType];
  const isFree = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  return {
    ...base,
    amount: isFree ? 0 : base.amount,
    label:  isFree ? `${base.label} — Free` : base.label,
  };
}

/**
 * Build the `shipping_options` array for a Stripe Checkout Session.
 * Returns a single-rate array (delivery type was selected pre-checkout).
 */
export function stripeShippingOptions(
  deliveryType: DeliveryType,
  subtotalCents: number,
) {
  const rate = resolveShippingRate(deliveryType, subtotalCents);
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
