"use client";

import { useRef, useEffect } from "react";
import { AirbrushStar } from "@/components/ui/AirbrushStar";

const DIVIDER_TEXT =
  "EVERY PIECE IS UNIQUE \u2022 HAND-AIRBRUSHED \u2022 MADE BY HAND \u2022 ONE OF A KIND \u2022 ";

export function SectionDivider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.removeAttribute("data-animate");
      el.style.visibility = "visible";
      return;
    }

    let cancelled = false;
    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);

      if (cancelled || !el) return;

      // 1. Set opacity 0 via GSAP while element is still hidden by data-animate
      gsap.set(el, { opacity: 0 });

      // 2. Remove data-animate — element is now "visible" but opacity:0, so no flash
      el.removeAttribute("data-animate");
      el.style.visibility = "visible";

      // 3. Fade in on scroll
      gsap.to(el, {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });

      gsap.fromTo(lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "center center",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        }
      );
    })();

    return () => { cancelled = true; };
  }, []);

  const repeatedText = Array(6).fill(DIVIDER_TEXT).join("");

  return (
    <div
      ref={containerRef}
      data-animate
      className="relative overflow-hidden py-6 md:py-8"
      style={{ transform: "skewY(-1.5deg)" }}
    >
      {/* Animated line */}
      <div
        ref={lineRef}
        className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2 bg-white/10"
      />

      {/* Text marquee */}
      <div className="relative z-10 overflow-hidden" style={{ transform: "skewY(1.5deg)" }}>
        <div className="animate-divider-marquee flex w-max">
          <span className="font-[family-name:var(--font-display)] text-[10px] md:text-xs tracking-[0.3em] uppercase text-chrome whitespace-nowrap">
            {repeatedText}
          </span>
          <span className="font-[family-name:var(--font-display)] text-[10px] md:text-xs tracking-[0.3em] uppercase text-chrome whitespace-nowrap">
            {repeatedText}
          </span>
        </div>
      </div>

      {/* Subtle organic stars tracking behind the marquee */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ transform: "skewY(1.5deg)" }}>
        <AirbrushStar variant={2} className="absolute -top-[10%] left-[25%] w-10 h-10 text-white/50 opacity-[0.1] -rotate-[15deg] mix-blend-screen scale-y-125" />
        <AirbrushStar variant={3} className="absolute bottom-[0%] right-[30%] w-6 h-6 text-white/40 opacity-[0.08] rotate-[25deg] mix-blend-screen" />
        <AirbrushStar variant={1} className="absolute top-[15%] right-[10%] w-8 h-8 text-white/40 opacity-[0.12] -rotate-[5deg] mix-blend-screen" />
      </div>
    </div>
  );
}
