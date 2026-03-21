"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Product } from "@/lib/products";
import { AirbrushStar } from "@/components/ui/AirbrushStar";

interface HeroSectionProps {
  products: Product[];
}

export function HeroSection({ products }: HeroSectionProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const reveal = useCallback((el: HTMLElement) => {
    el.removeAttribute("data-animate");
    el.style.visibility = "visible";
  }, []);

  useEffect(() => {
    const els = [logoRef.current, glowRef.current, taglineRef.current, lineRef.current, marqueeRef.current];
    if (!containerRef.current || els.some(el => !el)) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(el => { if (el) { reveal(el); el.style.opacity = "1"; } });
      return;
    }

    // Dynamic import GSAP only when needed for animation
    let cancelled = false;
    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);

      if (cancelled) return;

      // Skip intro animation on return visits (only animate on first load)
      const hasAnimated = sessionStorage.getItem("hero-animated");
      if (hasAnimated) {
        els.forEach(el => { if (el) { reveal(el); el.style.opacity = "1"; } });
      } else {
        // 1. Set GSAP initial state (opacity:0) while still hidden
        gsap.set(logoRef.current!, { opacity: 0, scale: 1.15 });
        gsap.set(glowRef.current!, { opacity: 0, scale: 0.5 });
        gsap.set(taglineRef.current!, { opacity: 0, y: 15 });
        gsap.set(lineRef.current!, { opacity: 0, scaleX: 0 });
        gsap.set(marqueeRef.current!, { opacity: 0, y: 30 });

        // 2. NOW remove data-animate — elements become visible but opacity is 0, so no flash
        els.forEach(el => { if (el) reveal(el); });

        // 3. Animate in
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        tl.to(logoRef.current, {
          scale: 1, opacity: 1, duration: 0.8, delay: 0.1,
        })
          .to(glowRef.current, { opacity: 1, scale: 1, duration: 1 }, "-=0.6")
          .to(taglineRef.current, { y: 0, opacity: 1, duration: 0.5 }, "-=0.3")
          .to(lineRef.current, { opacity: 1, scaleX: 1, transformOrigin: "center center", duration: 0.4 }, "-=0.2")
          .to(marqueeRef.current, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2");

        sessionStorage.setItem("hero-animated", "1");
      }

      // Parallax logo on scroll
      gsap.fromTo(
        logoRef.current,
        { yPercent: 0, scale: 1, opacity: 1 },
        {
          yPercent: 20, scale: 0.95, opacity: 0.4, ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top", end: "bottom top", scrub: true,
          },
        }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [reveal]);

  const marqueeItems = [...products, ...products, ...products, ...products];

  return (
    <section ref={containerRef} className="relative overflow-hidden concrete-bg">
      {/* Radial glow behind logo */}
      <div
        ref={glowRef}
        data-animate
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] md:w-[900px] md:h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(255,105,180,0.06) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)" }}
      />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[1440px] mx-auto px-6 md:px-10 pt-24 md:pt-32 pb-8 md:pb-12">
        <Image
          ref={logoRef}
          data-animate
          src="/logo.png"
          alt="Lexxbrush — Hand-Airbrushed Wearable Art"
          width={550}
          height={309}
          priority
          fetchPriority="high"
          sizes="(max-width: 767px) 280px, (max-width: 1023px) 450px, 550px"
          className="w-[280px] md:w-[450px] lg:w-[550px] h-auto logo-glow"
        />

        <p
          ref={taglineRef}
          data-animate
          className="mt-6 md:mt-8 font-[family-name:var(--font-display)] text-xs md:text-sm tracking-[0.35em] uppercase text-chrome"
        >
          {t("hero.tagline")}
        </p>

        <div
          ref={lineRef}
          data-animate
          className="w-12 h-[1px] bg-white/10 mt-5 mb-4"
        />

        <p className="text-xs md:text-sm text-text-dim max-w-xs leading-relaxed">
          {t("hero.subtitle")}
        </p>
      </div>

      {/* Marquee Strip */}
      <div ref={marqueeRef} data-animate className="relative z-10 pb-6 overflow-hidden">
        <div className="animate-marquee flex gap-3 md:gap-4 w-max">
          {marqueeItems.map((product, i) => (
            <Link
              key={`${product.id}-${i}`}
              href={`/product/${product.id}`}
              className="flex-shrink-0 w-[140px] md:w-[200px] lg:w-[240px] aspect-square rounded-lg overflow-hidden bg-concrete-light border border-white/5 relative"
            >
              <Image
                src={product.images[0]}
                alt={product.name.en}
                fill
                sizes="(max-width: 768px) 140px, (max-width: 1024px) 200px, 240px"
                className="object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-500"
                loading={i < 5 ? "eager" : "lazy"}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Hand-airbrushed star elements — subtle, neutral, organically imperfect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left cluster: framing the logo */}
        <AirbrushStar variant={2} className="absolute top-[15%] left-[12%] w-10 h-10 text-white/50 opacity-[0.15] rotate-[10deg] mix-blend-screen scale-x-110" />
        <AirbrushStar variant={3} className="absolute top-[28%] left-[6%] w-6 h-6 text-white/40 opacity-[0.1] -rotate-[15deg] mix-blend-screen" />
        
        {/* Top-right floating high */}
        <AirbrushStar variant={1} className="absolute top-[18%] right-[16%] w-12 h-12 text-white/60 opacity-[0.12] -rotate-[5deg] mix-blend-screen scale-y-110" />
        
        {/* Mid-right offset */}
        <AirbrushStar variant={3} className="absolute top-[45%] right-[8%] w-8 h-8 text-white/50 opacity-[0.15] rotate-[35deg] mix-blend-screen" />
        
        {/* Bottom-left framing near marquee */}
        <AirbrushStar variant={1} className="absolute bottom-[28%] left-[18%] w-9 h-9 text-white/40 opacity-[0.1] rotate-[20deg] mix-blend-screen" />
        
        {/* Extreme bottom-right */}
        <AirbrushStar variant={2} className="absolute bottom-[22%] right-[12%] w-7 h-7 text-white/60 opacity-[0.15] -rotate-[30deg] mix-blend-screen scale-x-125" />
      </div>
    </section>
  );
}
