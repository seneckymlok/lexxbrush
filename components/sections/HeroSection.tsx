"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Product } from "@/lib/products";

function AirbrushStar({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <filter id="blur-ring-heavy" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="blur-ring-light" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="blur-cross" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Fuzzy concentric rings background */}
      <circle cx="50" cy="50" r="16" stroke="currentColor" strokeWidth="4" opacity="0.4" filter="url(#blur-ring-heavy)" />
      <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="3" opacity="0.3" filter="url(#blur-ring-light)" />
      
      {/* Blurred cross layer */}
      <g fill="currentColor" opacity="0.6" filter="url(#blur-cross)">
        <path d="M50 10 L54 50 L50 90 L46 50 Z" />
        <path d="M10 50 L50 46 L90 50 L50 54 Z" />
      </g>
      
      {/* Sharp inner core cross */}
      <g fill="currentColor" opacity="0.9">
        <path d="M50 12 L52 50 L50 88 L48 50 Z" />
        <path d="M12 50 L50 48 L88 50 L50 52 Z" />
      </g>
      
      {/* Darker/brighter center dot */}
      <circle cx="50" cy="50" r="2" fill="currentColor" />
    </svg>
  );
}

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

      {/* Hand-airbrushed star elements — matching provided reference */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AirbrushStar className="absolute top-[20%] right-[12%] w-24 h-24 text-white opacity-[0.25] rotate-[15deg] mix-blend-screen" />
        <AirbrushStar className="absolute top-[35%] right-[8%] w-16 h-16 text-pink opacity-[0.35] -rotate-[10deg] mix-blend-screen animate-pulse" />
        <AirbrushStar className="absolute bottom-[20%] left-[4%] w-20 h-20 text-lime opacity-[0.3] rotate-[5deg] mix-blend-screen" />
        <AirbrushStar className="absolute top-[60%] left-[12%] w-14 h-14 text-cyan opacity-[0.4] rotate-[25deg] mix-blend-screen" />
        <AirbrushStar className="absolute top-[45%] right-[18%] w-12 h-12 text-amber opacity-[0.3] -rotate-[15deg] mix-blend-screen" />
        <AirbrushStar className="absolute top-[10%] left-[20%] w-10 h-10 text-violet opacity-[0.4] rotate-[45deg] mix-blend-screen" />
      </div>
    </section>
  );
}
