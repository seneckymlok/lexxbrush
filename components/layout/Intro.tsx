"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

type SuitKey = "heart" | "diamond" | "club" | "spade";

const SUITS: ReadonlyArray<{
  key: SuitKey;
  src: string;
  href: string;
  external?: boolean;
  glow: string;
  glowSoft: string;
}> = [
  {
    key:      "heart",
    src:      "/suits/heart.webp",
    href:     "/",
    glow:     "rgba(136,0,204,0.95)",
    glowSoft: "rgba(136,0,204,0.4)",
  },
  {
    key:      "diamond",
    src:      "/suits/diamond.webp",
    href:     "/custom-order",
    glow:     "rgba(0,220,255,0.95)",
    glowSoft: "rgba(0,220,255,0.4)",
  },
  {
    key:      "club",
    src:      "/suits/club.webp",
    href:     "https://www.instagram.com/lexxbrush",
    external: true,
    glow:     "rgba(210,210,0,0.9)",
    glowSoft: "rgba(210,210,0,0.35)",
  },
  {
    key:      "spade",
    src:      "/suits/spade.webp",
    href:     "/contact",
    glow:     "rgba(30,80,255,0.95)",
    glowSoft: "rgba(30,80,255,0.4)",
  },
];

const STORAGE_KEY = "lexxbrush:intro-seen";

type Phase = "pulse" | "hold" | "shatter" | "fan" | "exit";

const FAN_DESKTOP: Record<SuitKey, { dx: number; dy: number; rot: number }> = {
  heart:   { dx: -300, dy: 0, rot: -10 },
  diamond: { dx: -100, dy: 0, rot:  -3 },
  club:    { dx:  100, dy: 0, rot:   3 },
  spade:   { dx:  300, dy: 0, rot:  10 },
};

const FAN_MOBILE: Record<SuitKey, { dx: number; dy: number; rot: number }> = {
  heart:   { dx: 0, dy: -240, rot: -6 },
  diamond: { dx: 0, dy:  -80, rot: -2 },
  club:    { dx: 0, dy:   80, rot:  2 },
  spade:   { dx: 0, dy:  240, rot:  6 },
};

export function Intro() {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("pulse");
  const [clicked, setClicked] = useState<SuitKey | null>(null);
  const [exiting, setExiting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const timers = useRef<number[]>([]);

  // Decide on mount whether to show — session-scoped, homepage only.
  // Synchronizes with the inline head script that pre-hides the body via
  // `html.intro-pending`. We clear that flag once we know the outcome.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/") return;
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (seen) {
      // No intro this session → reveal the page immediately.
      document.documentElement.classList.remove("intro-pending");
      return;
    }
    setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    setMounted(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }, [pathname]);

  // When the intro begins exiting, reveal the page underneath (remove pre-hide flag).
  useEffect(() => {
    if (!mounted) return;
    if (!exiting) return;
    document.documentElement.classList.remove("intro-pending");
  }, [mounted, exiting]);

  // Safety net: if the Intro never mounts for some reason within 2s, reveal anyway.
  useEffect(() => {
    const t = window.setTimeout(() => {
      document.documentElement.classList.remove("intro-pending");
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  // Lock scroll while intro is up
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // Phase sequencing — cinematic timing
  // 0       pulse   bg breathes 2 full cycles (1.6s each) then naturally settles at rest
  // 3200    hold    bg static, logo lingers alone (~1.5s of breathing room)
  // 4700    shatter logo expands & fades, burst flashes, suits begin emerging
  // 5500    fan     suits ease out to fanned positions
  useEffect(() => {
    if (!mounted) return;
    const t1 = window.setTimeout(() => setPhase("hold"),    3200);
    const t2 = window.setTimeout(() => setPhase("shatter"), 4700);
    const t3 = window.setTimeout(() => setPhase("fan"),     5500);
    timers.current.push(t1, t2, t3);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [mounted]);

  if (!mounted) return null;

  const handleClick = (suit: typeof SUITS[number]) => {
    if (clicked) return;
    setClicked(suit.key);
    setPhase("exit");

    window.setTimeout(() => setExiting(true), 50);
    window.setTimeout(() => {
      if (suit.external) {
        window.location.href = suit.href;
      } else {
        router.push(suit.href);
      }
      window.setTimeout(() => setMounted(false), 250);
    }, 650);
  };

  const skip = () => {
    setExiting(true);
    window.setTimeout(() => setMounted(false), 450);
  };

  const fan = isMobile ? FAN_MOBILE : FAN_DESKTOP;

  return (
    <div
      data-intro
      className="intro-root fixed inset-0 z-[100] overflow-hidden select-none"
      style={{
        opacity: exiting ? 0 : 1,
        transition: "opacity 450ms ease",
        pointerEvents: exiting ? "none" : "auto",
      }}
      aria-hidden={exiting}
    >
      {/* Background — same hero image as the site.
          Pulses exactly 2 full cycles and naturally settles back at the rest state
          (no aggressive cut). animation-fill-mode: forwards keeps it at the final keyframe. */}
      <div
        className="intro-bg absolute inset-0"
      />
      {/* Vignette so suits + logo stay readable against the bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 75%)",
        }}
      />

      {/* Logo (vrana) — static during pulse + hold, then dissolves cleanly at shatter.
          Refined exit: pure opacity decay with a near-imperceptible scale lift
          (1.00 → 1.06). No blur, no aggressive growth — the logo dignifies its exit
          by simply releasing, not exploding. The glow softens in parallel so the
          decay reads as light leaving, not a special effect. */}
      <div
        className="absolute left-1/2 top-1/2 will-change-transform"
        style={{
          width: "clamp(180px, 32vw, 360px)",
          aspectRatio: "771 / 900",
          opacity: phase === "pulse" || phase === "hold" ? 1 : 0,
          transform:
            phase === "pulse" || phase === "hold"
              ? "translate(-50%, -50%) scale(1)"
              : "translate(-50%, -50%) scale(1.06)",
          filter:
            phase === "pulse" || phase === "hold"
              ? "drop-shadow(0 0 30px rgba(255,255,255,0.18))"
              : "drop-shadow(0 0 12px rgba(255,255,255,0.08))",
          transition:
            "opacity 1400ms cubic-bezier(0.33, 0, 0.2, 1), transform 1600ms cubic-bezier(0.16, 1, 0.3, 1), filter 1300ms ease-out",
        }}
      >
        <Image
          src="/intro/typecekcerny.webp"
          alt="Lexxbrush"
          fill
          priority
          className="object-contain"
          sizes="(max-width: 768px) 60vw, 360px"
        />
      </div>

      {/* Suits container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {SUITS.map((suit, i) => {
          const isClicked = clicked === suit.key;
          const isOther   = clicked && !isClicked;
          const pos = fan[suit.key];

          let transform = "translate(0px, 0px) rotate(0deg) scale(0.5)";
          let opacity = 0;

          if (phase === "shatter") {
            // Soft emergence at center — fades up while logo is dissolving
            transform = "translate(0px, 0px) rotate(0deg) scale(0.7)";
            opacity = 0.35;
          }
          if (phase === "fan" || (phase === "exit" && !isClicked)) {
            transform = `translate(${pos.dx}px, ${pos.dy}px) rotate(${pos.rot}deg) scale(1)`;
            opacity = phase === "exit" ? 0 : 1;
          }
          if (phase === "exit" && isClicked) {
            transform = `translate(42vw, -46vh) rotate(0deg) scale(0.3)`;
            opacity = 0;
          }

          // Stagger only during the fan emergence
          const fanDelay = i * 110;

          const transition =
            phase === "shatter"
              ? `transform 900ms cubic-bezier(0.22,1,0.36,1) ${fanDelay}ms, opacity 900ms ease ${fanDelay}ms`
              : phase === "fan"
              ? `transform 1100ms cubic-bezier(0.22,1,0.36,1) ${fanDelay}ms, opacity 800ms ease ${fanDelay}ms`
              : phase === "exit" && isClicked
              ? "transform 600ms cubic-bezier(0.45,0,0.55,1), opacity 600ms ease"
              : phase === "exit"
              ? "transform 500ms ease, opacity 500ms ease"
              : "transform 600ms ease, opacity 450ms ease";

          return (
            <button
              key={suit.key}
              type="button"
              onClick={() => handleClick(suit)}
              aria-label={suit.key}
              className="group absolute will-change-transform cursor-pointer focus:outline-none"
              style={{
                width: "clamp(72px, 11vw, 130px)",
                aspectRatio: "1 / 1",
                transform,
                opacity,
                transition,
                filter: `drop-shadow(0 0 14px ${suit.glowSoft})`,
              }}
            >
              <div
                className="relative w-full h-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:-translate-y-3"
                style={{
                  filter: `drop-shadow(0 0 10px ${suit.glowSoft})`,
                }}
              >
                <Image
                  src={suit.src}
                  alt=""
                  fill
                  priority
                  className="object-contain transition-all duration-400"
                  sizes="130px"
                  style={{
                    filter: `drop-shadow(0 0 0 ${suit.glow})`,
                  }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                  style={{
                    filter: `drop-shadow(0 0 26px ${suit.glow}) drop-shadow(0 0 10px ${suit.glow})`,
                  }}
                >
                  <Image src={suit.src} alt="" fill className="object-contain" sizes="130px" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Skip hint — appears only after fan settles */}
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-[family-name:var(--font-display)] text-[9px] tracking-[0.32em] uppercase text-white/15 hover:text-white/50 transition-colors duration-300"
        style={{
          opacity: phase === "fan" ? 1 : 0,
          transition: "opacity 600ms ease 600ms",
          pointerEvents: phase === "fan" ? "auto" : "none",
        }}
      >
        Skip
      </button>

      <style jsx>{`
        .intro-bg {
          background-image: url("/hero-bg.jpg");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transform-origin: center center;
          will-change: transform, filter;
          /* 2 full cycles (1.6s each) then settles naturally at the 100% keyframe (rest state) */
          animation: intro-bg-pulse 1.6s ease-in-out 2 forwards;
        }

        @media (max-width: 767px) {
          .intro-bg {
            background-image: url("/mobile-bg.jpg");
          }
        }

        /* Keyframes start and end at the SAME rest state, so the animation
           naturally fades back to baseline at the end of cycle 2 — no abrupt cut. */
        @keyframes intro-bg-pulse {
          0% {
            transform: scale(1);
            filter: brightness(1) saturate(1);
          }
          50% {
            transform: scale(1.05);
            filter: brightness(1.15) saturate(1.15);
          }
          100% {
            transform: scale(1);
            filter: brightness(1) saturate(1);
          }
        }
      `}</style>
    </div>
  );
}
