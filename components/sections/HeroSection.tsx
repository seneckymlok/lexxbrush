"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Product } from "@/lib/products";

interface HeroSectionProps {
  products: Product[];
}

export function HeroSection({ products: _ }: HeroSectionProps) {
  const { t } = useLanguage();
  const logoRef = useRef<HTMLImageElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  const reveal = useCallback((el: HTMLElement) => {
    el.removeAttribute("data-animate");
    el.style.visibility = "visible";
  }, []);

  useEffect(() => {
    const els = [logoRef.current, taglineRef.current];
    if (els.some(el => !el)) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(el => { if (el) { reveal(el); el.style.opacity = "1"; } });
      return;
    }

    let cancelled = false;
    (async () => {
      const { default: gsap } = await import("gsap");
      if (cancelled) return;

      const hasAnimated = sessionStorage.getItem("hero-animated");
      if (hasAnimated) {
        els.forEach(el => { if (el) { reveal(el); el.style.opacity = "1"; } });
      } else {
        gsap.set(logoRef.current!, { opacity: 0, scale: 1.06 });
        gsap.set(taglineRef.current!, { opacity: 0, y: 10 });
        els.forEach(el => { if (el) reveal(el); });

        gsap.timeline({ defaults: { ease: "power4.out" } })
          .to(logoRef.current, { scale: 1, opacity: 1, duration: 0.8, delay: 0.1 })
          .to(taglineRef.current, { y: 0, opacity: 1, duration: 0.5 }, "-=0.4");

        sessionStorage.setItem("hero-animated", "1");
      }
    })();

    return () => { cancelled = true; };
  }, [reveal]);

  return (
    <section className="relative hero-art-bg flex flex-col items-center justify-center text-center px-6 pt-24 md:pt-28 pb-8 md:pb-10">
      <Image
        ref={logoRef}
        data-animate
        src="/logo-new.png"
        alt="Lexxbrush — Hand-Airbrushed Wearable Art"
        width={520}
        height={370}
        priority
        fetchPriority="high"
        sizes="(max-width: 767px) 180px, (max-width: 1023px) 240px, 300px"
        className="w-[180px] md:w-[240px] lg:w-[300px] h-auto logo-glow select-none"
      />
      <p
        ref={taglineRef}
        data-animate
        className="mt-3 font-[family-name:var(--font-display)] text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-chrome"
      >
        {t("hero.tagline")}
      </p>
    </section>
  );
}
