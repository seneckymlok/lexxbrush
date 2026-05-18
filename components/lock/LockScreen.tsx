"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Props = {
  titleEn: string;
  titleSk: string;
  subtitleEn: string;
  subtitleSk: string;
};

const SUITS = [
  {
    src: "/suits/heart.webp",
    label: "Heart",
    glow: "rgba(180,0,255,0.85)",
    glowSoft: "rgba(180,0,255,0.30)",
    rot: -10,
    delay: 0,
  },
  {
    src: "/suits/diamond.webp",
    label: "Diamond",
    glow: "rgba(0,220,255,0.85)",
    glowSoft: "rgba(0,220,255,0.30)",
    rot: -3,
    delay: 0.08,
  },
  {
    src: "/suits/club.webp",
    label: "Club",
    glow: "rgba(220,220,0,0.85)",
    glowSoft: "rgba(220,220,0,0.30)",
    rot: 3,
    delay: 0.16,
  },
  {
    src: "/suits/spade.webp",
    label: "Spade",
    glow: "rgba(30,80,255,0.85)",
    glowSoft: "rgba(30,80,255,0.30)",
    rot: 10,
    delay: 0.24,
  },
];

export function LockScreen({ titleEn, titleSk, subtitleEn, subtitleSk }: Props) {
  const { locale, setLocale } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const title = locale === "sk" ? titleSk : titleEn;
  const subtitle = locale === "sk" ? subtitleSk : subtitleEn;
  const eyebrow = locale === "sk" ? "ČOSKORO V PREVÁDZKE" : "ALMOST READY";

  // Stagger entrance.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Periodic scan-line sweep - re-mounts the element which restarts its
  // CSS animation cleanly.
  useEffect(() => {
    const id = setInterval(() => setScanKey((k) => k + 1), 9000);
    return () => clearInterval(id);
  }, []);

  // Cursor-following radial spotlight (desktop only). Updates CSS vars on
  // the root - no React re-render on every mouse move.
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

  // Split the headline into characters for stagger. Preserve spaces and \n.
  const lines = title.split(/\r?\n/);

  return (
    <div
      ref={rootRef}
      className="lock-root relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-black text-white px-6 py-10"
      style={{
        // initial coords for the spotlight - center
        ["--mx" as never]: "50vw",
        ["--my" as never]: "50vh",
      }}
    >
      {/* Cursor-following spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hidden md:block"
        style={{
          background:
            "radial-gradient(600px circle at var(--mx) var(--my), rgba(255,255,255,0.06), transparent 60%)",
          transition: "background-position 0.1s linear",
        }}
      />

      {/* Subtle base vignette + faint noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Drifting particles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="lock-dust"
            style={{
              left: `${(i * 4.7) % 100}%`,
              top: `${(i * 8.3) % 100}%`,
              animationDelay: `${(i * 0.7) % 12}s`,
              animationDuration: `${10 + ((i * 1.3) % 8)}s`,
              opacity: 0.15 + ((i % 5) * 0.05),
            }}
          />
        ))}
      </div>

      {/* Scan line sweep */}
      <div
        key={scanKey}
        aria-hidden
        className="lock-scan pointer-events-none absolute inset-x-0 top-0 z-0 h-px"
      />

      {/* Top bar - logo + language switcher */}
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

      {/* Main column */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">
        {/* Eyebrow */}
        <div
          className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.5em] uppercase mb-6 md:mb-8 transition-all duration-700 delay-100"
          style={{
            color: "rgba(255,255,255,0.45)",
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(8px)",
          }}
        >
          <span className="inline-flex items-center gap-3">
            <span className="block w-6 h-px bg-white/25" />
            {eyebrow}
            <span className="block w-6 h-px bg-white/25" />
          </span>
        </div>

        {/* Headline - characters staggered in */}
        <h1
          className="font-[family-name:var(--font-display)] font-extrabold tracking-tight uppercase chrome-text leading-[0.88]"
          style={{
            fontSize: "clamp(3.5rem, 14vw, 10rem)",
            letterSpacing: "-0.02em",
          }}
        >
          {lines.map((line, li) => (
            <span key={li} className="block">
              {[...line].map((ch, i) => {
                const totalDelay = li * line.length + i;
                return (
                  <span
                    key={`${li}-${i}`}
                    aria-hidden={ch === " "}
                    className="inline-block will-change-transform"
                    style={{
                      transform: visible ? "translateY(0) rotateX(0deg)" : "translateY(48px) rotateX(-40deg)",
                      opacity: visible ? 1 : 0,
                      transition: `transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${0.25 + totalDelay * 0.04}s, opacity 0.7s ease-out ${0.25 + totalDelay * 0.04}s`,
                      transformOrigin: "50% 100%",
                    }}
                  >
                    {ch === " " ? " " : ch}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>

        {/* Animated hairline */}
        <div
          className="lock-hairline mt-8 md:mt-10 mb-8 md:mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.8s ease-out 0.9s",
          }}
        />

        {/* Subtitle */}
        <p
          className="max-w-xl text-sm md:text-base leading-relaxed text-white/55 font-[family-name:var(--font-body)]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(12px)",
            transition: "opacity 0.9s ease-out 1.05s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 1.05s",
          }}
        >
          {subtitle}
        </p>

        {/* Suits */}
        <div
          className="mt-14 md:mt-20 flex items-center justify-center gap-6 md:gap-12"
          aria-hidden
        >
          {SUITS.map((suit, i) => (
            <div
              key={suit.label}
              className="lock-suit relative"
              style={{
                width: 56,
                height: 56,
                opacity: visible ? 1 : 0,
                transform: visible
                  ? `translateY(0) rotate(${suit.rot}deg) scale(1)`
                  : "translateY(40px) rotate(0deg) scale(0.6)",
                filter: `drop-shadow(0 0 10px ${suit.glowSoft})`,
                animationDelay: `${1.6 + i * 0.18}s, ${1.6 + i * 0.18}s`,
                transition: `transform 1s cubic-bezier(0.22,1,0.36,1) ${1.2 + i * 0.08}s, opacity 0.7s ease-out ${1.2 + i * 0.08}s`,
                ["--glow" as never]: suit.glow,
              }}
            >
              <Image
                src={suit.src}
                alt=""
                fill
                className="object-contain"
                sizes="56px"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer - social + contact */}
      <footer
        className="absolute bottom-0 left-0 right-0 z-10 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 px-6 py-6 md:px-10 md:py-7 text-[10px] font-[family-name:var(--font-display)] tracking-[0.25em] uppercase text-white/35 transition-all duration-700 delay-[1.5s]"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(8px)" }}
      >
        <span className="text-white/25 hidden md:inline">© Lexxbrush, s.r.o.</span>
        <div className="flex items-center gap-5">
          <a
            href="https://www.instagram.com/lexxbrush"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            @lexxbrush
          </a>
          <span className="text-white/15">·</span>
          <a href="mailto:info@lexxbrush.eu" className="hover:text-white transition-colors">
            info@lexxbrush.eu
          </a>
        </div>
        <span className="text-white/25 md:hidden">© Lexxbrush, s.r.o.</span>
      </footer>

      {/* Scoped styles */}
      <style jsx>{`
        .lock-root {
          background:
            radial-gradient(ellipse at top, rgba(20, 8, 30, 0.4), transparent 50%),
            radial-gradient(ellipse at bottom, rgba(0, 20, 40, 0.35), transparent 55%),
            #050505;
        }
        .lock-hairline {
          width: 220px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: lock-hairline-shimmer 3.4s ease-in-out infinite;
        }
        .lock-dust {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.65);
          filter: blur(0.5px);
          animation-name: lock-drift;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }
        .lock-scan {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.18),
            transparent
          );
          box-shadow: 0 0 14px rgba(255, 255, 255, 0.18);
          transform: translateY(0);
          animation: lock-scan-sweep 2.4s ease-in-out forwards;
        }
        .lock-suit {
          animation-name: lock-breathe, lock-glow-pulse;
          animation-duration: 4.2s, 5.6s;
          animation-iteration-count: infinite, infinite;
          animation-timing-function: ease-in-out, ease-in-out;
        }
        @keyframes lock-hairline-shimmer {
          0%, 100% { background-position: 100% 0; }
          50% { background-position: -100% 0; }
        }
        @keyframes lock-drift {
          0%   { transform: translate3d(0, 30px, 0); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate3d(-20px, -120px, 0); opacity: 0; }
        }
        @keyframes lock-scan-sweep {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100dvh); opacity: 0; }
        }
        @keyframes lock-breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-6px) scale(1.04); }
        }
        @keyframes lock-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px var(--glow)) drop-shadow(0 0 2px var(--glow)); }
          50%      { filter: drop-shadow(0 0 22px var(--glow)) drop-shadow(0 0 6px var(--glow)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lock-dust, .lock-scan, .lock-hairline, .lock-suit {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
