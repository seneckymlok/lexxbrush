"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ProductCard } from "@/components/ui/ProductCard";
import { SuitIcon } from "@/components/ui/SuitIcon";
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
    <section ref={sectionRef} className="concrete-bg max-w-[1440px] mx-auto px-6 md:px-10 pt-6 md:pt-8 pb-16 md:pb-24 relative overflow-hidden">
      {/* Suit icons as background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[8%] -left-[3%] suit-float-2">
          <SuitIcon suit="heart" className="w-20 h-20 md:w-28 md:h-28 opacity-[0.06]" />
        </div>
        <div className="absolute bottom-[15%] -right-[5%] suit-float-3">
          <SuitIcon suit="spade" className="w-24 h-24 md:w-36 md:h-36 opacity-[0.05]" />
        </div>
        <div className="absolute top-[45%] -right-[2%] suit-float-1 hidden md:block">
          <SuitIcon suit="diamond" className="w-16 h-16 opacity-[0.04]" />
        </div>
        <div className="absolute bottom-[40%] -left-[4%] suit-float-4 hidden md:block">
          <SuitIcon suit="club" className="w-18 h-18 opacity-[0.05]" />
        </div>
      </div>

      {/* Section Header */}
      <div ref={titleRef} className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <SuitIcon suit="heart" className="w-4 h-4 opacity-60" glow={false} />
            <SuitIcon suit="diamond" className="w-4 h-4 opacity-60" glow={false} />
            <SuitIcon suit="club" className="w-4 h-4 opacity-60" glow={false} />
            <SuitIcon suit="spade" className="w-4 h-4 opacity-60" glow={false} />
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text">
            {t("shop.title")}
          </h2>
          <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-suit-heart/30 to-transparent mt-3 mx-auto md:mx-0" />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center md:justify-start gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs font-[family-name:var(--font-display)] font-medium tracking-[0.12em] uppercase rounded-full border transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-plum-hot to-plum text-white border-plum/30 shadow-[0_0_15px_rgba(106,75,150,0.2)]"
                  : "bg-transparent text-chrome border-steel hover:border-plum/40 hover:text-chrome-bright"
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
