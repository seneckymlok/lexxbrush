"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import type { Locale } from "@/lib/translations";
import { MagneticButton } from "@/components/ui/MagneticButton";

export default function CartPage() {
  const { locale, t } = useLanguage();
  const { items, removeItem, totalPrice } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const elements = containerRef.current?.querySelectorAll(".cart-item");
      if (elements && elements.length > 0) {
        gsap.fromTo(elements,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }
        );
      }
    },
    { scope: containerRef, dependencies: [items.length] }
  );

  return (
    <div className="page-enter max-w-[1440px] mx-auto px-6 md:px-10 pt-18 pb-12 md:pt-24 md:pb-24">
      <div className="max-w-3xl mx-auto" ref={containerRef}>
        <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-extrabold tracking-tight uppercase chrome-text">
          {t("cart.title")}
        </h1>
        <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 mb-12" />

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-chrome text-lg mb-6">{t("cart.empty")}</p>
            <Link
              href="/"
              className="btn-outline inline-block px-8 py-3 text-sm font-bold rounded-full"
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
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-concrete-light flex-shrink-0 relative">
                    <Image src={item.product.images[0]} alt={item.product.name[locale as Locale]} fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide uppercase text-chrome-bright truncate">
                      {item.product.name[locale as Locale]}
                    </h3>
                    {item.size && (
                      <p className="mt-1 text-xs text-sage">{t("cart.size")}: {item.size}</p>
                    )}
                    <p className="mt-1 text-sm font-medium text-white">
                      &euro;{item.product.price}
                      {item.quantity > 1 && <span className="text-chrome"> x {item.quantity}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id, item.size)}
                    className="flex-shrink-0 text-xs text-chrome hover:text-plum-hot transition-colors duration-300 font-[family-name:var(--font-display)] tracking-wider uppercase"
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

              <MagneticButton>
                <Link
                  href="/checkout"
                  className="block w-full py-4 btn-brand text-sm font-bold rounded-full text-center"
                >
                  {t("cart.checkout")}
                </Link>
              </MagneticButton>

              <Link
                href="/"
                className="block text-center mt-4 text-sm text-chrome hover:text-sage transition-colors duration-300"
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
