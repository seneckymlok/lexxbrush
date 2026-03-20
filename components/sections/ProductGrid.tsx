"use client";

import { useState, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "@/components/providers/LanguageProvider";
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

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const filteredProducts = getProductsByCategory(products, activeCategory);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(titleRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 85%",
        },
      });

      const cards = gridRef.current?.querySelectorAll(".reveal");
      if (cards && cards.length > 0) {
        gsap.from(cards, {
          y: 50,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 80%",
          },
        });
      }
    },
    { scope: gridRef, dependencies: [activeCategory, loading] }
  );

  return (
    <section className="concrete-bg max-w-[1440px] mx-auto px-6 md:px-10 py-16 md:py-24">
      {/* Section Header */}
      <div ref={titleRef} className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text">
            {t("shop.title")}
          </h2>
          <div className="w-10 h-[2px] bg-gradient-to-r from-pink to-transparent mt-3" />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs font-[family-name:var(--font-display)] font-medium tracking-[0.12em] uppercase rounded-full border transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-white text-void border-white"
                  : "bg-transparent text-chrome border-steel hover:border-chrome-light hover:text-chrome-bright"
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
