"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { Product } from "@/lib/products";

interface HeroSectionProps {
  products: Product[];
}

export function HeroSection({ products: _ }: HeroSectionProps) {
  const logoRef = useRef<HTMLImageElement>(null);

  const reveal = useCallback((el: HTMLElement) => {
    el.removeAttribute("data-animate");
    el.style.visibility = "visible";
  }, []);

  useEffect(() => {
    if (!logoRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal(logoRef.current); logoRef.current.style.opacity = "1";
      return;
    }

    let cancelled = false;
    (async () => {
      const { default: gsap } = await import("gsap");
      if (cancelled) return;

      const hasAnimated = sessionStorage.getItem("hero-animated");
      if (hasAnimated) {
        reveal(logoRef.current!); logoRef.current!.style.opacity = "1";
      } else {
        gsap.set(logoRef.current!, { opacity: 0, scale: 1.06 });
        reveal(logoRef.current!);
        gsap.to(logoRef.current, { scale: 1, opacity: 1, duration: 0.9, delay: 0.1, ease: "power4.out" });
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
        alt="Lexxbrush"
        width={520}
        height={370}
        priority
        fetchPriority="high"
        sizes="(max-width: 767px) 220px, (max-width: 1023px) 320px, 420px"
        className="w-[220px] md:w-[320px] lg:w-[420px] h-auto logo-glow select-none"
      />
    </section>
  );
}
