"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import type { Locale } from "@/lib/translations";
import { MagneticButton } from "@/components/ui/MagneticButton";

const COUNTRIES = [
  { code: "SK", name: "Slovakia" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DE", name: "Germany" },
  { code: "AT", name: "Austria" },
  { code: "PL", name: "Poland" },
  { code: "HU", name: "Hungary" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
];

export default function CheckoutPage() {
  const { locale, t } = useLanguage();
  const { items, totalPrice } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    name: "",
    address: "",
    address2: "",
    city: "",
    postalCode: "",
    country: "SK",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.size,
          })),
          customer: {
            email: form.email,
            name: form.name,
            address: {
              line1: form.address,
              line2: form.address2 || undefined,
              city: form.city,
              postal_code: form.postalCode,
              country: form.country,
            },
          },
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
    "w-full bg-concrete-light border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-white placeholder:text-text-dim focus:outline-none focus:border-white/20 transition-colors duration-200";
  const labelClass =
    "block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1.5";

  return (
    <div className="page-enter max-w-[1440px] mx-auto px-6 md:px-10 pt-18 pb-12 md:pt-24 md:pb-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-extrabold tracking-tight uppercase chrome-text">
          {t("checkout.title")}
        </h1>
        <div className="w-10 h-[1px] bg-white/10 mt-4 mb-12" />

        <form onSubmit={handleSubmit} autoComplete="on">
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
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
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
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputClass}
                      placeholder={t("checkout.namePlaceholder")}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-bright mb-6">
                  {t("checkout.shipping")}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className={labelClass}>{t("checkout.address")}</label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      autoComplete="address-line1"
                      required
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      className={inputClass}
                      placeholder={t("checkout.addressPlaceholder")}
                    />
                  </div>
                  <div>
                    <label htmlFor="address2" className={labelClass}>{t("checkout.address2")}</label>
                    <input
                      id="address2"
                      name="address2"
                      type="text"
                      autoComplete="address-line2"
                      value={form.address2}
                      onChange={(e) => update("address2", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className={labelClass}>{t("checkout.city")}</label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        autoComplete="address-level2"
                        required
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className={inputClass}
                        placeholder={t("checkout.cityPlaceholder")}
                      />
                    </div>
                    <div>
                      <label htmlFor="postalCode" className={labelClass}>{t("checkout.postalCode")}</label>
                      <input
                        id="postalCode"
                        name="postalCode"
                        type="text"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        required
                        value={form.postalCode}
                        onChange={(e) => update("postalCode", e.target.value)}
                        className={inputClass}
                        placeholder={t("checkout.postalCodePlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="country" className={labelClass}>{t("checkout.country")}</label>
                    <select
                      id="country"
                      name="country"
                      autoComplete="country"
                      required
                      value={form.country}
                      onChange={(e) => update("country", e.target.value)}
                      className={inputClass}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-pink-hot text-sm">{error}</p>
              )}

              {/* Submit — visible on desktop */}
              <div className="hidden md:block">
              <MagneticButton>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 btn-brand text-sm font-bold rounded-full disabled:opacity-50"
                >
                  {submitting ? t("checkout.processing") : t("checkout.pay")}
                </button>
              </MagneticButton>
                <Link
                  href="/cart"
                  className="block text-center mt-4 text-sm text-chrome hover:text-cyan transition-colors duration-300"
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
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-concrete-light flex-shrink-0 relative">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name[locale as Locale]}
                          fill
                          sizes="56px"
                          className="object-cover"
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
                <div className="md:hidden mt-8">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 btn-brand text-sm font-bold rounded-full disabled:opacity-50"
                  >
                    {submitting ? t("checkout.processing") : t("checkout.pay")}
                  </button>
                  <Link
                    href="/cart"
                    className="block text-center mt-4 text-sm text-chrome hover:text-cyan transition-colors duration-300"
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
