"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SuitIcon } from "@/components/ui/SuitIcon";
import type { Product } from "@/lib/products";

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
  const suitsRef = useRef<HTMLDivElement>(null);

  const reveal = useCallback((el: HTMLElement) => {
    el.removeAttribute("data-animate");
    el.style.visibility = "visible";
  }, []);

  useEffect(() => {
    const els = [logoRef.current, taglineRef.current, lineRef.current, marqueeRef.current, suitsRef.current];
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
        gsap.set(logoRef.current!, { opacity: 0, scale: 1.15 });
        gsap.set(suitsRef.current!, { opacity: 0 });
        gsap.set(taglineRef.current!, { opacity: 0, y: 15 });
        gsap.set(lineRef.current!, { opacity: 0, scaleX: 0 });
        gsap.set(marqueeRef.current!, { opacity: 0, y: 30 });

        els.forEach(el => { if (el) reveal(el); });

        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        tl.to(logoRef.current, {
          scale: 1, opacity: 1, duration: 0.8, delay: 0.1,
        })
          .to(suitsRef.current, { opacity: 1, duration: 1.2 }, "-=0.4")
          .to(taglineRef.current, { y: 0, opacity: 1, duration: 0.5 }, "-=0.6")
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

      // Parallax suits on scroll — move slower than logo
      gsap.fromTo(
        suitsRef.current,
        { yPercent: 0 },
        {
          yPercent: 10, ease: "none",
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
    <section ref={containerRef} className="relative overflow-hidden hero-art-bg min-h-[85vh] md:min-h-[90vh] flex flex-col">
      {/* Floating suit icons — brand identity scattered across the hero */}
      <div
        ref={suitsRef}
        data-animate
        className="absolute inset-0 pointer-events-none z-[2]"
      >
        {/* Heart — top left */}
        <div className="absolute top-[12%] left-[8%] suit-float-1">
          <SuitIcon suit="heart" className="w-14 h-14 md:w-20 md:h-20 opacity-[0.25]" />
        </div>

        {/* Diamond — top right */}
        <div className="absolute top-[18%] right-[10%] suit-float-2">
          <SuitIcon suit="diamond" className="w-10 h-10 md:w-16 md:h-16 opacity-[0.2]" />
        </div>

        {/* Club — mid left */}
        <div className="absolute top-[55%] left-[5%] suit-float-3">
          <SuitIcon suit="club" className="w-12 h-12 md:w-18 md:h-18 opacity-[0.2]" />
        </div>

        {/* Spade — mid right */}
        <div className="absolute top-[45%] right-[6%] suit-float-4">
          <SuitIcon suit="spade" className="w-16 h-16 md:w-22 md:h-22 opacity-[0.22]" />
        </div>

        {/* Small accent suits */}
        <div className="absolute top-[35%] left-[22%] suit-float-4 hidden md:block">
          <SuitIcon suit="spade" className="w-8 h-8 opacity-[0.12]" />
        </div>
        <div className="absolute top-[65%] right-[18%] suit-float-1 hidden md:block">
          <SuitIcon suit="heart" className="w-10 h-10 opacity-[0.15]" />
        </div>
        <div className="absolute bottom-[25%] left-[15%] suit-float-2 hidden lg:block">
          <SuitIcon suit="diamond" className="w-7 h-7 opacity-[0.1]" />
        </div>
        <div className="absolute top-[25%] right-[25%] suit-float-3 hidden lg:block">
          <SuitIcon suit="club" className="w-9 h-9 opacity-[0.12]" />
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[1440px] mx-auto px-6 md:px-10 pt-28 md:pt-36 pb-8 md:pb-12 flex-1 justify-center">
        <Image
          ref={logoRef}
          data-animate
          src="/logo.png"
          alt="Lexxbrush — Hand-Airbrushed Wearable Art"
          width={550}
          height={309}
          priority
          fetchPriority="high"
          sizes="(max-width: 767px) 300px, (max-width: 1023px) 480px, 600px"
          className="w-[300px] md:w-[480px] lg:w-[600px] h-auto logo-glow"
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
          className="w-16 h-[1px] bg-gradient-to-r from-transparent via-suit-heart/40 to-transparent mt-5 mb-4"
        />

        <p className="text-xs md:text-sm text-text-dim max-w-xs leading-relaxed">
          {t("hero.subtitle")}
        </p>

        {/* Suit row — small inline brand marks */}
        <div className="flex items-center gap-3 mt-6">
          <SuitIcon suit="heart" className="w-5 h-5 opacity-60" glow={false} />
          <SuitIcon suit="diamond" className="w-5 h-5 opacity-60" glow={false} />
          <SuitIcon suit="club" className="w-5 h-5 opacity-60" glow={false} />
          <SuitIcon suit="spade" className="w-5 h-5 opacity-60" glow={false} />
        </div>
      </div>

      {/* Marquee Strip */}
      <div ref={marqueeRef} data-animate className="relative z-10 pb-6 overflow-hidden mt-auto">
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
    </section>
  );
}
