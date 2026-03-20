"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DIVIDER_TEXT =
  "EVERY PIECE IS UNIQUE \u2022 HAND-AIRBRUSHED \u2022 MADE BY HAND \u2022 ONE OF A KIND \u2022 ";

export function SectionDivider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(lineRef.current, {
        scaleX: 0,
        transformOrigin: "center center",
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
        },
      });
    },
    { scope: containerRef }
  );

  // Repeat the text enough to fill a wide marquee strip
  const repeatedText = Array(6).fill(DIVIDER_TEXT).join("");

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden py-6 md:py-8"
      style={{ transform: "skewY(-1.5deg)" }}
    >
      {/* Animated gradient line */}
      <div
        ref={lineRef}
        className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-pink) 30%, var(--color-cyan) 70%, transparent 100%)",
          opacity: 0.3,
        }}
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

      {/* Subtle spray dots */}
      <div className="spray-dot absolute top-2 left-[20%] opacity-20" />
      <div className="spray-dot absolute bottom-3 right-[35%] opacity-15 bg-cyan w-[3px] h-[3px]" />
    </div>
  );
}
