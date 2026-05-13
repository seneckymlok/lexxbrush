"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Locale } from "@/lib/translations";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { PACKETA_COUNTRIES } from "@/lib/packeta";
import PacketaWidget from "@/components/checkout/PacketaWidget";

// Default export is a thin Suspense wrapper. `useSearchParams` (used inside
// CheckoutPageInner) requires a Suspense boundary above it during prerender
// in Next.js 16 — without one, `next build` fails on this route.
export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageInner />
    </Suspense>
  );
}

function CheckoutPageInner() {
  const { locale, t } = useLanguage();
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  // Test-mode token from URL (?test=<secret>). Forwarded verbatim to the
  // checkout API, which validates it against CHECKOUT_TEST_TOKEN env.
  // Never displayed in UI — admin-only feature.
  const testToken = searchParams?.get("test") || null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("SK");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "home_delivery">("pickup");
  // Newsletter opt-in — unchecked by default per GDPR. Forwarded through to
  // the Stripe webhook; we only subscribe AFTER a successful payment so
  // abandoned-checkout emails don't end up on the list.
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PacketaPoint | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<(PacketaHDAddress & { carrierId: number }) | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("country").eq("id", user.id).single();
      if (data?.country) setCountry(data.country);
    };
    fetchProfile();
  }, [user]);

  // Reset selection when switching delivery type or country
  useEffect(() => {
    setSelectedPoint(null);
    setSelectedAddress(null);
  }, [deliveryType, country]);

  const handlePointSelect = useCallback((point: PacketaPoint | null) => {
    setSelectedPoint(point);
  }, []);

  const handleAddressSelect = useCallback((address: (PacketaHDAddress & { carrierId: number }) | null) => {
    setSelectedAddress(address);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) return;

    // Validate contact fields
    if (!email || !name) {
      setError(t("auth.fillAllFields") || "Please fill out all required fields.");
      return;
    }

    // Validate delivery selection
    if (deliveryType === "pickup" && !selectedPoint) {
      setError(t("checkout.noDeliverySelected"));
      return;
    }
    if (deliveryType === "home_delivery" && !selectedAddress) {
      setError(t("checkout.noDeliverySelected"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const delivery: PacketaDelivery = {
        type: deliveryType,
        country,
      };

      if (deliveryType === "pickup" && selectedPoint) {
        delivery.point = {
          id: selectedPoint.id,
          name: selectedPoint.name,
          street: selectedPoint.street,
          city: selectedPoint.city,
          zip: selectedPoint.zip,
          country: selectedPoint.country,
          carrierId: selectedPoint.carrierId,
          carrierPickupPointId: selectedPoint.carrierPickupPointId,
          gps: selectedPoint.gps,
        };
      } else if (deliveryType === "home_delivery" && selectedAddress) {
        delivery.address = selectedAddress;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.size,
          })),
          customer: {
            email,
            name,
            phone: phone || undefined,
          },
          delivery,
          newsletterOptIn,
          // Only sent when present; validated server-side against the
          // CHECKOUT_TEST_TOKEN env var. Silently ignored otherwise.
          ...(testToken ? { testToken } : {}),
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Connection error. Please try again.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="page-enter min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-chrome text-lg mb-6">{t("cart.empty")}</p>
          <Link href="/" className="btn-outline inline-block px-8 py-3 text-sm font-bold rounded-full">
            {t("cart.continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300";
  const labelClass =
    "block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1.5";

  return (
    <div className="page-enter max-w-[1440px] mx-auto px-6 md:px-10 pt-18 pb-12 md:pt-24 md:pb-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-extrabold tracking-tight uppercase chrome-text">
          {t("checkout.title")}
        </h1>
        <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 mb-12" />

        <form onSubmit={handleSubmit} autoComplete="on" noValidate>
          <div className="grid md:grid-cols-[1fr_340px] gap-12 md:gap-16">
            {/* Left — Form */}
            <div className="space-y-10">
              {/* Contact */}
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-bright mb-6">
                  {t("checkout.contact")}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className={labelClass}>{t("checkout.email")}</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder={t("checkout.emailPlaceholder")}
                    />
                  </div>
                  <div>
                    <label htmlFor="name" className={labelClass}>{t("checkout.name")}</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      placeholder={t("checkout.namePlaceholder")}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>{t("checkout.phone")}</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                      placeholder={t("checkout.phonePlaceholder")}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-bright mb-6">
                  {t("checkout.shipping")}
                </h2>
                <div className="space-y-5">
                  {/* Country selector */}
                  <div>
                    <label htmlFor="country" className={labelClass}>{t("checkout.country")}</label>
                    <select
                      id="country"
                      name="country"
                      autoComplete="country"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={inputClass}
                    >
                      {PACKETA_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {locale === "sk" ? c.nameSk : c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery type toggle */}
                  <div>
                    <label className={labelClass}>{t("checkout.deliveryMethod")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType("pickup")}
                        className={`py-3 px-4 rounded-lg text-sm font-[family-name:var(--font-display)] font-bold tracking-wide uppercase border transition-all duration-300 ${
                          deliveryType === "pickup"
                            ? "bg-white/10 border-white/30 text-white"
                            : "bg-white/5 border-white/10 text-chrome hover:border-white/20 hover:text-white/80"
                        }`}
                      >
                        {t("checkout.pickupPoint")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType("home_delivery")}
                        className={`py-3 px-4 rounded-lg text-sm font-[family-name:var(--font-display)] font-bold tracking-wide uppercase border transition-all duration-300 ${
                          deliveryType === "home_delivery"
                            ? "bg-white/10 border-white/30 text-white"
                            : "bg-white/5 border-white/10 text-chrome hover:border-white/20 hover:text-white/80"
                        }`}
                      >
                        {t("checkout.homeDelivery")}
                      </button>
                    </div>
                  </div>

                  {/* Packeta widget */}
                  <PacketaWidget
                    country={country}
                    language={locale}
                    deliveryType={deliveryType}
                    selectedPoint={selectedPoint}
                    selectedAddress={selectedAddress}
                    onPointSelect={handlePointSelect}
                    onAddressSelect={handleAddressSelect}
                  />
                </div>
              </div>

              {/* Newsletter opt-in */}
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(e) => setNewsletterOptIn(e.target.checked)}
                  className="mt-[2px] w-4 h-4 accent-white/80 bg-white/5 border border-white/15 rounded cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-chrome-light leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                  {t("newsletter.checkout.label")}
                </span>
              </label>

              {/* Error */}
              {error && (
                <p className="text-red-400/80 text-sm mt-8">{error}</p>
              )}

              {/* Submit — visible on desktop */}
              <div className="hidden md:block">
              <div className="flex justify-center">
              <MagneticButton>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center min-w-[260px] px-10 py-4 btn-brand text-sm font-bold rounded-full disabled:opacity-50"
                >
                  {submitting ? t("checkout.processing") : t("checkout.pay")}
                </button>
              </MagneticButton>
              </div>
                <Link
                  href="/cart"
                  className="block text-center mt-4 text-sm text-chrome hover:text-sage transition-colors duration-300"
                >
                  {t("checkout.backToCart")}
                </Link>
              </div>
            </div>

            {/* Right — Order Summary */}
            <div>
              <div className="sticky top-24">
                <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-bright mb-6">
                  {t("checkout.orderSummary")}
                </h2>

                <div className="space-y-0">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}`}
                      className="flex items-center gap-3 py-4 border-b border-white/5"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/[0.03] border border-white/5 flex-shrink-0 relative">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name[locale as Locale]}
                          fill
                          sizes="56px"
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-[family-name:var(--font-display)] tracking-wide uppercase text-chrome-bright truncate">
                          {item.product.name[locale as Locale]}
                        </p>
                        {item.size && (
                          <p className="text-[10px] text-chrome mt-0.5">{item.size}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white flex-shrink-0">
                        &euro;{item.product.price}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.15em] uppercase text-chrome">
                    {t("cart.total")}
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-white">
                    &euro;{totalPrice}
                  </span>
                </div>

                {/* Submit — visible on mobile only */}
                <div className="md:hidden mt-8 flex justify-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center min-w-[260px] px-10 py-4 btn-brand text-sm font-bold rounded-full disabled:opacity-50"
                  >
                    {submitting ? t("checkout.processing") : t("checkout.pay")}
                  </button>
                  <Link
                    href="/cart"
                    className="block text-center mt-4 text-sm text-chrome hover:text-sage transition-colors duration-300"
                  >
                    {t("checkout.backToCart")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
