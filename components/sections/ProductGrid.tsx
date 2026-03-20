"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Image from "next/image";
import { ProductCard } from "@/components/ui/ProductCard";
import { getProducts, getProductsByCategory, categories } from "@/lib/products";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/translations";

gsap.registerPlugin(ScrollTrigger);

export function ProductGrid() {
  const { locale, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const filteredProducts = getProductsByCategory(products, activeCategory);

  // Title animation — runs ONCE on scroll into view, never re-runs
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!titleRef.current) return;

      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  // Animate cards when they appear (after loading or category switch)
  const animateCards = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll(".card-perspective");
    if (cards.length === 0) return;

    gsap.fromTo(
      cards,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: "power3.out",
      }
    );
  }, []);

  // Trigger card animation after products load or category changes
  useEffect(() => {
    if (!loading && filteredProducts.length > 0) {
      // Small delay to let React render the new cards
      const timer = requestAnimationFrame(() => animateCards());
      return () => cancelAnimationFrame(timer);
    }
  }, [loading, activeCategory, animateCards, filteredProducts.length]);

  return (
    <section ref={sectionRef} className="concrete-bg max-w-[1440px] mx-auto px-6 md:px-10 py-16 md:py-24 relative overflow-hidden">
      {/* Character art — left edge */}
      <Image
        src="/characters/typecek1(png).webp"
        alt=""
        aria-hidden="true"
        width={640}
        height={854}
        loading="lazy"
        sizes="(max-width: 767px) 90px, (max-width: 1023px) 160px, 280px"
        className="overflow-art overflow-art-left select-none"
      />
      {/* Character art — right edge */}
      <Image
        src="/characters/typecek2(png).webp"
        alt=""
        aria-hidden="true"
        width={640}
        height={854}
        loading="lazy"
        sizes="(max-width: 767px) 100px, (max-width: 1023px) 180px, 320px"
        className="overflow-art overflow-art-right select-none"
      />
      {/* Section Header */}
      <div ref={titleRef} className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text">
            {t("shop.title")}
          </h2>
          <div className="w-10 h-[1px] bg-white/10 mt-3" />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs font-[family-name:var(--font-display)] font-medium tracking-[0.12em] uppercase rounded-full border transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-pink-hot to-pink text-white border-pink/30 shadow-[0_0_15px_rgba(255,20,147,0.2)]"
                  : "bg-transparent text-chrome border-steel hover:border-pink/40 hover:text-chrome-bright"
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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-white/[0.02] animate-pulse" />
          ))
        ) : (
          filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))
        )}
      </div>

      {/* Empty state */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-chrome font-[family-name:var(--font-body)]">
            No products in this category yet.
          </p>
        </div>
      )}
    </section>
  );
}
