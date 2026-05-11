"use client";

import { useRef, useEffect, useCallback } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/lib/products";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

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
    if (products.length > 0) {
      const timer = requestAnimationFrame(() => animateCards());
      return () => cancelAnimationFrame(timer);
    }
  }, [animateCards, products.length]);

  return (
    <section className="max-w-[1440px] mx-auto px-6 md:px-10 pt-24 md:pt-28 pb-16 md:pb-24">
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8"
      >
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}
