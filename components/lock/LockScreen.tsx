"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

const SUITS = [
  { src: "/suits/heart.webp",   label: "Heart",   glow: "rgba(136,0,204,0.7)",   rot: -8,  delay: 0 },
  { src: "/suits/diamond.webp", label: "Diamond", glow: "rgba(0,220,255,0.7)",   rot: -3,  delay: 0.06 },
  { src: "/suits/club.webp",    label: "Club",    glow: "rgba(238,255,0,0.6)",   rot: 3,   delay: 0.12 },
  { src: "/suits/spade.webp",   label: "Spade",   glow: "rgba(30,80,255,0.7)",   rot: 8,   delay: 0.18 },
];

export function LockScreen() {
  const { locale, setLocale } = useLanguage();
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const subtitle =
    locale === "sk"
      ? "Niečo nové sa chystá."
      : "Something new is on the way.";

  // Suppress the intro animation — when the lock page is active the URL is
  // still "/" (middleware rewrite), so the Intro component might try to mount.
  // Belt-and-suspenders: mark it as seen and clear the pending class.
  useEffect(() => {
    try {
      sessionStorage.setItem("lexxbrush:intro-seen", "1");
      document.documentElement.classList.remove("intro-pending");
    } catch {}
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

      {/* ── Header — logo + language ── */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-6 md:px-10 md:py-7">
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(-8px)" }}
        >
          <Image
            src="/logo.png"
            alt="Lexxbrush"
            width={120}
            height={28}
            className="h-6 w-auto opacity-70"
            priority
          />
        </div>
        <div
          className="flex items-center gap-3 text-[10px] font-[family-name:var(--font-display)] tracking-[0.25em] uppercase transition-all duration-700 delay-100"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(-8px)" }}
        >
          <button
            type="button"
            onClick={() => setLocale("sk")}
            className={`transition-colors cursor-pointer ${locale === "sk" ? "text-white" : "text-white/35 hover:text-white/70"}`}
          >
            SK
          </button>
          <span className="text-white/15">/</span>
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`transition-colors cursor-pointer ${locale === "en" ? "text-white" : "text-white/35 hover:text-white/70"}`}
          >
            EN
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">
        {/* Eyebrow */}
        <div
          className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.5em] uppercase mb-8 md:mb-10"
          style={{
            color: "rgba(255,255,255,0.35)",
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(8px)",
            transition: "opacity 0.7s ease-out 0.15s, transform 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s",
          }}
        >
          <span className="inline-flex items-center gap-3">
            <span className="block w-8 h-px bg-white/20" />
            LEXXBRUSH
            <span className="block w-8 h-px bg-white/20" />
          </span>
        </div>

        {/* Headline — "COMING SOON" character-staggered */}
        <h1
          className="font-[family-name:var(--font-display)] font-extrabold tracking-tight uppercase chrome-text leading-[0.88]"
          style={{
            fontSize: "clamp(2.8rem, 12vw, 9rem)",
            letterSpacing: "-0.02em",
          }}
        >
          {["COMING", "SOON"].map((word, wi) => (
            <span key={wi} className="block">
              {[...word].map((ch, ci) => {
                const totalDelay = wi * 6 + ci;
                return (
                  <span
                    key={`${wi}-${ci}`}
                    className="inline-block will-change-transform"
                    style={{
                      transform: visible ? "translateY(0) rotateX(0deg)" : "translateY(48px) rotateX(-40deg)",
                      opacity: visible ? 1 : 0,
                      transition: `transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + totalDelay * 0.04}s, opacity 0.7s ease-out ${0.3 + totalDelay * 0.04}s`,
                      transformOrigin: "50% 100%",
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>

        {/* Hairline divider */}
        <div
          className="lock-hairline mt-8 md:mt-10 mb-8 md:mb-10 mx-auto"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.8s ease-out 1s",
          }}
        />

        {/* Subtitle */}
        <p
          className="max-w-md text-sm md:text-base leading-relaxed text-white/45 font-[family-name:var(--font-body)]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(10px)",
            transition: "opacity 0.9s ease-out 1.1s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 1.1s",
          }}
        >
          {subtitle}
        </p>

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

      {/* ── Footer ── */}
      <footer
        className="absolute bottom-0 left-0 right-0 z-10 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 px-6 py-6 md:px-10 md:py-7 text-[10px] font-[family-name:var(--font-display)] tracking-[0.25em] uppercase text-white/30 transition-all duration-700 delay-[1.5s]"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(8px)" }}
      >
        <span className="text-white/20 hidden md:inline">© Lexxbrush, s.r.o.</span>
        <div className="flex items-center gap-5">
          <a
            href="https://www.instagram.com/lexxbrush"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors flex items-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            @lexxbrush
          </a>
          <span className="text-white/10">·</span>
          <a href="mailto:info@lexxbrush.eu" className="hover:text-white/70 transition-colors">
            info@lexxbrush.eu
          </a>
        </div>
        <span className="text-white/20 md:hidden">© Lexxbrush, s.r.o.</span>
      </footer>

      {/* Scoped styles */}
      <style jsx>{`
        .lock-hairline {
          width: 200px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: lock-hairline-shimmer 3.4s ease-in-out infinite;
        }
        .lock-suit {
          animation-name: lock-breathe, lock-glow-pulse;
          animation-duration: 4.5s, 6s;
          animation-iteration-count: infinite, infinite;
          animation-timing-function: ease-in-out, ease-in-out;
        }
        @keyframes lock-hairline-shimmer {
          0%, 100% { background-position: 100% 0; }
          50% { background-position: -100% 0; }
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
          .lock-hairline, .lock-suit {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
