"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import type { Locale } from "@/lib/translations";

export default function CartPage() {
  const { locale, t } = useLanguage();
  const { items, removeItem, totalPrice } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const elements = containerRef.current?.querySelectorAll(".cart-item");
      if (elements && elements.length > 0) {
        gsap.from(elements, {
          x: -20, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power3.out",
        });
      }
    },
    { scope: containerRef, dependencies: [items.length] }
  );

  async function handleCheckout() {
    setCheckingOut(true);
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
        }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong. Please try again.");
        setCheckingOut(false);
      }
    } catch (err) {
      alert("Connection error. Please try again.");
      setCheckingOut(false);
    }
  }

  return (
    <div className="page-enter max-w-[1440px] mx-auto px-6 md:px-10 pt-4 pb-12 md:pt-8 md:pb-24">
      <div className="max-w-3xl mx-auto" ref={containerRef}>
        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-extrabold tracking-tight uppercase chrome-text">
          {t("cart.title")}
        </h1>
        <div className="w-10 h-[2px] bg-gradient-to-r from-pink to-transparent mt-4 mb-12" />

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-chrome text-lg mb-6">{t("cart.empty")}</p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-white text-void font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.15em] uppercase rounded-full hover:bg-chrome-bright transition-colors duration-300"
            >
              {t("cart.continueShopping")}
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-0">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="cart-item flex items-center gap-4 md:gap-6 py-6 border-b border-white/5"
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-concrete-light flex-shrink-0">
                    <img src={item.product.images[0]} alt={item.product.name[locale as Locale]} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide uppercase text-chrome-bright truncate">
                      {item.product.name[locale as Locale]}
                    </h3>
                    {item.size && (
                      <p className="mt-1 text-xs text-chrome">{t("cart.size")}: {item.size}</p>
                    )}
                    <p className="mt-1 text-sm font-medium text-white">
                      &euro;{item.product.price}
                      {item.quantity > 1 && <span className="text-chrome"> x {item.quantity}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id, item.size)}
                    className="flex-shrink-0 text-xs text-chrome hover:text-pink transition-colors duration-300 font-[family-name:var(--font-display)] tracking-wider uppercase"
                  >
                    {t("cart.remove")}
                  </button>
                </div>
              ))}
            </div>

            {/* Total & Checkout */}
            <div className="mt-10 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-8">
                <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.15em] uppercase text-chrome">
                  {t("cart.total")}
                </span>
                <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-white">
                  &euro;{totalPrice}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full py-4 bg-white text-void font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.15em] uppercase rounded-full hover:bg-chrome-bright active:scale-[0.98] transition-all duration-400 disabled:opacity-50"
              >
                {checkingOut ? "Redirecting to payment..." : t("cart.checkout")}
              </button>

              <Link
                href="/"
                className="block text-center mt-4 text-sm text-chrome hover:text-white transition-colors duration-300"
              >
                {t("cart.continueShopping")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
