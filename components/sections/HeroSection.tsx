"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/products";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const [products, setInternalProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then(setInternalProducts);
  }, []);
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Logo scales in from slightly large with a glow burst
      tl.from(logoRef.current, {
        scale: 1.15,
        opacity: 0,
        duration: 0.8,
        delay: 0.1,
      })
        .from(
          glowRef.current,
          {
            opacity: 0,
            scale: 0.5,
            duration: 1,
          },
          "-=0.6"
        )
        .from(
          taglineRef.current,
          {
            y: 15,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.3"
        )
        .from(
          lineRef.current,
          {
            scaleX: 0,
            transformOrigin: "center center",
            duration: 0.4,
          },
          "-=0.2"
        )
        .from(
          marqueeRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.2"
        );

      // Parallax logo on scroll – use fromTo so the start values are
      // explicit and don't conflict with the intro .from() animation
      gsap.fromTo(
        logoRef.current,
        { yPercent: 0, scale: 1, opacity: 1 },
        {
          yPercent: 20,
          scale: 0.95,
          opacity: 0.4,
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  const marqueeItems = [...products, ...products, ...products, ...products];

  return (
    <section ref={containerRef} className="relative overflow-hidden concrete-bg">
      {/* Radial glow behind logo */}
      <div
        ref={glowRef}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] md:w-[900px] md:h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(255,105,180,0.06) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)",
        }}
      />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[1440px] mx-auto px-6 md:px-10 pt-12 md:pt-20 pb-8 md:pb-12">
        {/* Chrome Logo */}
        <img
          ref={logoRef}
          src="/logo.png"
          alt="Lexxbrush"
          className="w-[280px] md:w-[450px] lg:w-[550px] h-auto logo-glow will-change-transform"
        />

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="mt-6 md:mt-8 font-[family-name:var(--font-display)] text-xs md:text-sm tracking-[0.35em] uppercase text-chrome"
        >
          {t("hero.tagline")}
        </p>

        {/* Divider line */}
        <div
          ref={lineRef}
          className="w-8 h-[1px] bg-gradient-to-r from-transparent via-chrome to-transparent mt-5 mb-4"
        />

        <p className="text-xs md:text-sm text-text-dim max-w-xs leading-relaxed">
          {t("hero.subtitle")}
        </p>
      </div>

      {/* Marquee Strip */}
      <div ref={marqueeRef} className="relative z-10 pb-6 overflow-hidden">
        <div className="animate-marquee flex gap-3 md:gap-4 w-max">
          {marqueeItems.map((product, i) => (
            <div
              key={`${product.id}-${i}`}
              className="flex-shrink-0 w-[140px] md:w-[200px] lg:w-[240px] aspect-square rounded-lg overflow-hidden bg-concrete-light border border-white/5"
            >
              <img
                src={product.images[0]}
                alt={product.name.en}
                className="w-full h-full object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-500"
                loading={i < 5 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Spray dots */}
      <div className="spray-dot absolute top-[20%] right-[12%]" />
      <div className="spray-dot absolute top-[35%] right-[8%] opacity-20 w-[3px] h-[3px]" />
      <div className="spray-dot absolute bottom-[30%] left-[6%] opacity-15 w-[2px] h-[2px]" />
      <div className="spray-dot absolute top-[60%] left-[15%] opacity-10 bg-cyan w-[3px] h-[3px]" />
    </section>
  );
}
