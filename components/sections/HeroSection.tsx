"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/translations";

interface HeroSectionProps {
  products: Product[];
}

export function HeroSection({ products }: HeroSectionProps) {
  const { t, locale } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const reveal = useCallback((el: HTMLElement) => {
    el.removeAttribute("data-animate");
    el.style.visibility = "visible";
  }, []);

  useEffect(() => {
    const els = [logoRef.current, taglineRef.current, rowRef.current];
    if (!containerRef.current || els.some(el => !el)) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(el => { if (el) { reveal(el); el.style.opacity = "1"; } });
      return;
    }

    let cancelled = false;
    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);

      if (cancelled) return;

      const hasAnimated = sessionStorage.getItem("hero-animated");
      if (hasAnimated) {
        els.forEach(el => { if (el) { reveal(el); el.style.opacity = "1"; } });
      } else {
        gsap.set(logoRef.current!, { opacity: 0, scale: 1.08 });
        gsap.set(taglineRef.current!, { opacity: 0, y: 12 });
        gsap.set(rowRef.current!, { opacity: 0, y: 24 });

        els.forEach(el => { if (el) reveal(el); });

        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.to(logoRef.current, { scale: 1, opacity: 1, duration: 0.9, delay: 0.1 })
          .to(taglineRef.current, { y: 0, opacity: 1, duration: 0.5 }, "-=0.4")
          .to(rowRef.current, { y: 0, opacity: 1, duration: 0.6 }, "-=0.3");

        sessionStorage.setItem("hero-animated", "1");
      }

      // Subtle parallax on logo
      gsap.fromTo(
        logoRef.current,
        { yPercent: 0 },
        {
          yPercent: 15, ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top", end: "bottom top", scrub: true,
          },
        }
      );
    })();

    return () => { cancelled = true; };
  }, [reveal]);

  // Show first 4 products in the visible row (or however many exist, max 4)
  const rowProducts = products.slice(0, 4);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden hero-art-bg flex flex-col"
      style={{ height: "100svh" }}
    >
      {/* Logo + tagline — fills remaining space above products */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6 md:px-10 pt-14 md:pt-16 pb-3">
        <Image
          ref={logoRef}
          data-animate
          src="/logo-ghost.png"
          alt="Lexxbrush — Hand-Airbrushed Wearable Art"
          width={520}
          height={370}
          priority
          fetchPriority="high"
          sizes="(max-width: 767px) 200px, (max-width: 1023px) 260px, 340px"
          className="w-[200px] md:w-[260px] lg:w-[340px] h-auto logo-glow select-none"
          style={{ maxHeight: "28vh" }}
        />

        <p
          ref={taglineRef}
          data-animate
          className="mt-3 font-[family-name:var(--font-display)] text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-chrome"
        >
          {t("hero.tagline")}
        </p>
      </div>

      {/* Product row — pinned to bottom, always visible on first load */}
      <div
        ref={rowRef}
        data-animate
        className="relative z-10 flex-shrink-0 px-4 md:px-8 pb-4 md:pb-6"
      >
        {rowProducts.length > 0 && (
          <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-[1440px] mx-auto">
            {rowProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group relative rounded-xl overflow-hidden bg-concrete-light border border-white/5"
                style={{ height: "clamp(100px, 24vh, 220px)" }}
              >
                <Image
                  src={product.images[0]}
                  alt={product.name[locale as Locale]}
                  fill
                  sizes="(max-width: 768px) 25vw, (max-width: 1024px) 22vw, 320px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  priority
                />
                {/* Hover overlay with name */}
                <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="font-[family-name:var(--font-display)] text-[10px] md:text-xs tracking-[0.12em] uppercase text-chrome-bright leading-tight">
                    {product.name[locale as Locale]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Scroll hint */}
        <div className="flex justify-center mt-2">
          <span className="font-[family-name:var(--font-display)] text-[8px] md:text-[9px] tracking-[0.3em] uppercase text-text-dim">
            scroll to see more
          </span>
        </div>
      </div>
    </section>
  );
}
