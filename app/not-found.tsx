"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

const SUITS = [
  {
    src:      "/suits/heart.webp",
    glow:     "rgba(136,0,204,0.9)",
    glowSoft: "rgba(136,0,204,0.35)",
    label:    "COLLECTION",
    href:     "/",
    rot:      -10,
    size:     96,
  },
  {
    src:      "/suits/diamond.webp",
    glow:     "rgba(0,220,255,0.9)",
    glowSoft: "rgba(0,220,255,0.35)",
    label:    "DROPS",
    href:     "/",
    rot:      -3,
    size:     112,
  },
  {
    src:      "/suits/club.webp",
    glow:     "rgba(210,210,0,0.85)",
    glowSoft: "rgba(210,210,0,0.3)",
    label:    "COMMUNITY",
    href:     "https://www.instagram.com/lexxbrush",
    rot:      3,
    size:     112,
    external: true,
  },
  {
    src:      "/suits/spade.webp",
    glow:     "rgba(30,80,255,0.9)",
    glowSoft: "rgba(30,80,255,0.35)",
    label:    "CONTACT",
    href:     "/contact",
    rot:      10,
    size:     96,
  },
] as const;

function SuitCard({
  suit,
  index,
  visible,
}: {
  suit: (typeof SUITS)[number];
  index: number;
  visible: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const isExternal = "external" in suit && suit.external;
  const linkProps = isExternal
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={suit.href}
      {...linkProps}
      className="flex flex-col items-center gap-3 group cursor-pointer select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card */}
      <div
        className="relative transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width:  suit.size,
          height: suit.size,
          transform: visible
            ? hovered
              ? "translateY(-18px) rotate(0deg) scale(1.08)"
              : `translateY(0px) rotate(${suit.rot}deg) scale(1)`
            : `translateY(60px) rotate(${suit.rot}deg)`,
          opacity:    visible ? 1 : 0,
          filter:     hovered
            ? `drop-shadow(0 0 22px ${suit.glow}) drop-shadow(0 0 8px ${suit.glow})`
            : `drop-shadow(0 0 10px ${suit.glowSoft})`,
          transitionDelay: visible ? `${index * 120}ms` : "0ms",
        }}
      >
        <Image
          src={suit.src}
          alt={suit.label}
          fill
          className="object-contain"
          sizes="112px"
        />
      </div>

    </Link>
  );
}

export default function NotFound() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  // Stagger-in after mount - no GSAP needed, pure CSS transitions
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pt-16">

      {/* Headline */}
      <div
        className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-24px)",
        }}
      >
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(3.5rem,14vw,9rem)] font-extrabold tracking-tight uppercase chrome-text leading-[0.88]">
          {t("notFound.titleLine1")}<br />{t("notFound.titleLine2")}
        </h1>
      </div>

      {/* Subline */}
      <p
        className="mt-6 mb-16 font-[family-name:var(--font-display)] text-[10px] tracking-[0.3em] uppercase transition-all duration-700 delay-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity:   visible ? 1 : 0,
          color:     "rgba(255,255,255,0.4)",
          transform: visible ? "translateY(0)" : "translateY(12px)",
        }}
      >
        {t("notFound.subtitle")}
      </p>

      {/* Four suits */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10 mb-20 flex-wrap md:flex-nowrap scale-90 sm:scale-100">
        {SUITS.map((suit, i) => (
          <SuitCard key={suit.label} suit={suit} index={i} visible={visible} />
        ))}
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.25em] uppercase text-white/40 hover:text-white transition-colors duration-300 border-b border-white/20 hover:border-white/50 pb-px"
        style={{
          opacity:         visible ? 1 : 0,
          transitionDelay: "600ms",
        }}
      >
        {t("notFound.back")}
      </Link>
    </div>
  );
}
