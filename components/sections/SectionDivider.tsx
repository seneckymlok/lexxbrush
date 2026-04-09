"use client";

import { useRef, useEffect } from "react";
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

      gsap.set(el, { opacity: 0 });
      el.removeAttribute("data-animate");
      el.style.visibility = "visible";

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
      className="relative overflow-hidden py-6 md:py-8 suit-divider"
      style={{ transform: "skewY(-1.5deg)" }}
    >
      {/* Animated line */}
      <div
        ref={lineRef}
        className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2 bg-gradient-to-r from-transparent via-suit-heart/20 to-transparent"
      />

      {/* Text marquee */}
      <div className="relative z-10 overflow-hidden" style={{ transform: "skewY(1.5deg)" }}>
        <div className="animate-divider-marquee flex w-max items-center">
          <span className="font-[family-name:var(--font-display)] text-[10px] md:text-xs tracking-[0.3em] uppercase text-chrome whitespace-nowrap">
            {repeatedText}
          </span>
          <span className="font-[family-name:var(--font-display)] text-[10px] md:text-xs tracking-[0.3em] uppercase text-chrome whitespace-nowrap">
            {repeatedText}
          </span>
        </div>
      </div>

    </div>
  );
}
