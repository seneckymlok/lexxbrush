"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ProductCard } from "@/components/ui/ProductCard";
import { getProductsByCategory, categories } from "@/lib/products";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/translations";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const { locale, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const filteredProducts = getProductsByCategory(products, activeCategory);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!titleRef.current) return;

    let cancelled = false;
    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);

      if (cancelled || !titleRef.current) return;

      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: titleRef.current, start: "top 85%", once: true },
        }
      );
    })();

    return () => { cancelled = true; };
  }, []);

  const animateCards = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll(".card-perspective");
    if (cards.length === 0) return;

    import("gsap").then(({ default: gsap }) => {
      gsap.fromTo(
        cards,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" }
      );
    });
  }, []);

  useEffect(() => {
    if (filteredProducts.length > 0) {
      const timer = requestAnimationFrame(() => animateCards());
      return () => cancelAnimationFrame(timer);
    }
  }, [activeCategory, animateCards, filteredProducts.length]);

  return (
    <section ref={sectionRef} className="max-w-[1440px] mx-auto px-6 md:px-10 pt-6 md:pt-8 pb-16 md:pb-24 relative overflow-hidden">
      {/* Section Header */}
      <div ref={titleRef} className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div className="text-center md:text-left">
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text">
            {t("shop.title")}
          </h2>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center md:justify-start gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs font-[family-name:var(--font-display)] font-medium tracking-[0.12em] uppercase rounded-full border transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-[#8800CC] text-white border-[#8800CC]/50 shadow-[0_0_18px_rgba(136,0,204,0.35)]"
                  : "bg-white/10 text-white/90 border-white/35 hover:border-[#00DDEE]/50 hover:text-white hover:shadow-[0_0_12px_rgba(0,221,238,0.15)]"
              }`}
            >
              {cat.label[locale as Locale]}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div
        ref={gridRef}
        className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
      >
        {filteredProducts.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-chrome font-[family-name:var(--font-body)]">
            No products in this category yet.
          </p>
        </div>
      )}
    </section>
  );
}
