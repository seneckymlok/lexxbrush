"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

const SUITS = [
  { src: "/suits/heart.webp", label: "Heart", glow: "rgba(136,0,204,0.7)", rot: -8, delay: 0 },
  { src: "/suits/diamond.webp", label: "Diamond", glow: "rgba(0,220,255,0.7)", rot: -3, delay: 0.06 },
  { src: "/suits/club.webp", label: "Club", glow: "rgba(238,255,0,0.6)", rot: 3, delay: 0.12 },
  { src: "/suits/spade.webp", label: "Spade", glow: "rgba(30,80,255,0.7)", rot: 8, delay: 0.18 },
];

export function LockScreen() {
  const { locale, setLocale } = useLanguage();
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const words = locale === "sk" ? ["COMING", "SOON"] : ["COMING", "SOON"];

  // Suppress the intro animation — when the lock page is active the URL is
  // still "/" (middleware rewrite), so the Intro component might try to mount.
  // Belt-and-suspenders: mark it as seen and clear the pending class.
  useEffect(() => {
    try {
      sessionStorage.setItem("lexxbrush:intro-seen", "1");
      document.documentElement.classList.remove("intro-pending");
    } catch { }
  }, []);

  // Stagger entrance
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Cursor-following radial spotlight (desktop only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = rootRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={rootRef}
      className="lock-root relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden text-white px-6 py-10"
      style={{
        ["--mx" as never]: "50vw",
        ["--my" as never]: "50vh",
      }}
    >
      {/* ── Background ── */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
      >
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark overlay — matches the main site's 75% darkening */}
        <div className="absolute inset-0 bg-black/[0.78]" />
      </div>

      {/* Cursor spotlight (desktop) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
        style={{
          background:
            "radial-gradient(550px circle at var(--mx) var(--my), rgba(255,255,255,0.045), transparent 55%)",
        }}
      />

      {/* Subtle vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.8) 100%)",
        }}
      />



      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl">


        {/* Headline — "COMING SOON" character-staggered */}
        <h1
          className="font-[family-name:var(--font-display)] font-extrabold tracking-tight uppercase leading-[0.88] whitespace-nowrap flex justify-center"
          style={{
            // 10vw ensures an 11-character string fits perfectly across a mobile screen
            fontSize: "clamp(2rem, 10vw, 12rem)",
            letterSpacing: "-0.03em",
          }}
        >
          {/* Join words with a non-breaking space (\u00A0) to guarantee a single line */}
          {words.join("\u00A0").split("").map((ch, ci) => (
            <span
              key={ci}
              className="inline-block will-change-transform chrome-text"
              style={{
                transform: visible ? "translateY(0) rotateX(0deg)" : "translateY(48px) rotateX(-40deg)",
                opacity: visible ? 1 : 0,
                transition: `transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + ci * 0.04}s, opacity 0.7s ease-out ${0.3 + ci * 0.04}s`,
                transformOrigin: "50% 100%",
              }}
            >
              {ch}
            </span>
          ))}
        </h1>



        {/* Suits */}
        <div
          className="mt-16 md:mt-20 flex items-center justify-center gap-7 md:gap-12"
          aria-hidden
        >
          {SUITS.map((suit, i) => (
            <div
              key={suit.label}
              className="lock-suit relative"
              style={{
                width: 48,
                height: 48,
                opacity: visible ? 1 : 0,
                transform: visible
                  ? `translateY(0) rotate(${suit.rot}deg) scale(1)`
                  : "translateY(32px) rotate(0deg) scale(0.6)",
                filter: `drop-shadow(0 0 8px ${suit.glow.replace("0.7", "0.25").replace("0.6", "0.2")})`,
                animationDelay: `${1.6 + i * 0.18}s, ${1.6 + i * 0.18}s`,
                transition: `transform 1s cubic-bezier(0.22,1,0.36,1) ${1.3 + i * 0.08}s, opacity 0.7s ease-out ${1.3 + i * 0.08}s`,
                ["--glow" as never]: suit.glow,
              }}
            >
              <Image
                src={suit.src}
                alt=""
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
          ))}
        </div>
      </div>



      {/* Scoped styles */}
      <style jsx>{`
        .lock-suit {
          animation-name: lock-breathe, lock-glow-pulse;
          animation-duration: 4.5s, 6s;
          animation-iteration-count: infinite, infinite;
          animation-timing-function: ease-in-out, ease-in-out;
        }
        @keyframes lock-breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-5px) scale(1.03); }
        }
        @keyframes lock-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 6px var(--glow)) drop-shadow(0 0 2px var(--glow)); }
          50%      { filter: drop-shadow(0 0 18px var(--glow)) drop-shadow(0 0 5px var(--glow)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lock-suit {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
