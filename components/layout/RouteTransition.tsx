"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

// ─── Suit identity ────────────────────────────────────────────────────────────

type SuitKey = "heart" | "diamond" | "club" | "spade";

const SUIT_MAP: Record<
  SuitKey,
  { src: string; glow: string; soft: string; tint: string }
> = {
  heart: {
    src:  "/suits/heart.webp",
    glow: "rgba(160, 20, 220, 1)",
    soft: "rgba(160, 20, 220, 0.55)",
    tint: "rgba(120, 0, 200, 0.45)",
  },
  diamond: {
    src:  "/suits/diamond.webp",
    glow: "rgba(0, 220, 255, 1)",
    soft: "rgba(0, 220, 255, 0.55)",
    tint: "rgba(0, 200, 255, 0.45)",
  },
  club: {
    src:  "/suits/club.webp",
    glow: "rgba(220, 220, 30, 1)",
    soft: "rgba(220, 220, 30, 0.5)",
    tint: "rgba(220, 220, 30, 0.4)",
  },
  spade: {
    src:  "/suits/spade.webp",
    glow: "rgba(50, 100, 255, 1)",
    soft: "rgba(50, 100, 255, 0.55)",
    tint: "rgba(40, 80, 255, 0.45)",
  },
};

function suitForRoute(href: string): SuitKey {
  const path = href.split("?")[0].split("#")[0];
  if (path.startsWith("/custom-order")) return "diamond";
  if (path.startsWith("/cart") || path.startsWith("/account")) return "club";
  if (
    path.startsWith("/contact")  ||
    path.startsWith("/terms")    ||
    path.startsWith("/privacy")  ||
    path.startsWith("/shipping") ||
    path.startsWith("/login")    ||
    path.startsWith("/register")
  ) {
    return "spade";
  }
  return "heart";
}

// ─── Phases ───────────────────────────────────────────────────────────────────
//
// idle  → user is on a page, nothing happening
// in    → suit sweeps in from off-screen top-left to center                (~450ms)
// hold  → suit is at center, breathing/rotating slowly while the new page
//         renders. Duration is adaptive: ends when pathname matches target.
//         Min 200ms (to avoid visual stutter), max 4000ms (safety net).
// out   → suit exits to off-screen bottom-right                            (~500ms)

type Phase = "idle" | "in" | "hold" | "out";

const IN_DURATION   = 450;
const OUT_DURATION  = 500;
const MIN_HOLD      = 200;
const MAX_HOLD      = 4000;
const POST_RENDER_BUFFER = 80; // tiny wait after pathname change so layout settles

// ─── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  start: (href: string) => void;
  phase: Phase;
};

const RouteTransitionContext = createContext<Ctx | null>(null);

export function useRouteTransition() {
  const ctx = useContext(RouteTransitionContext);
  if (!ctx) {
    throw new Error("useRouteTransition must be used inside RouteTransitionProvider");
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RouteTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [phase, setPhase] = useState<Phase>("idle");
  const [suit, setSuit] = useState<SuitKey>("heart");

  // Refs that change between phases without re-triggering effects.
  const inFlight    = useRef(false);
  const targetPath  = useRef<string | null>(null);
  const holdStart   = useRef<number>(0);
  const timers      = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const finishTransition = useCallback(() => {
    setPhase("idle");
    inFlight.current = false;
    targetPath.current = null;
  }, []);

  const exitNow = useCallback(() => {
    setPhase("out");
    timers.current.push(
      window.setTimeout(finishTransition, OUT_DURATION),
    );
  }, [finishTransition]);

  const start = useCallback(
    (href: string) => {
      if (inFlight.current) return;
      if (typeof window === "undefined") return;

      const targetClean = href.split("#")[0];
      const currentClean = window.location.pathname + window.location.search;
      if (targetClean === currentClean) return;

      // Reduced motion → instant navigate
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }

      inFlight.current = true;
      targetPath.current = href.split("?")[0].split("#")[0];

      setSuit(suitForRoute(href));
      setPhase("in");

      // After IN completes: enter HOLD and trigger the actual navigation.
      timers.current.push(
        window.setTimeout(() => {
          setPhase("hold");
          holdStart.current = Date.now();
          router.push(href);
        }, IN_DURATION),
        // Hard safety: if the page never resolves, force exit.
        window.setTimeout(() => {
          if (inFlight.current && phase !== "out") {
            exitNow();
          }
        }, IN_DURATION + MAX_HOLD),
      );
    },
    [router, exitNow, phase],
  );

  // Watch pathname — when it matches the target during HOLD, schedule exit
  // (respecting MIN_HOLD so the transition can't blink-stutter on a cached route).
  useEffect(() => {
    if (phase !== "hold") return;
    if (!targetPath.current) return;
    if (pathname !== targetPath.current) return;

    const elapsed = Date.now() - holdStart.current;
    const remaining = Math.max(MIN_HOLD - elapsed, 0) + POST_RENDER_BUFFER;

    const id = window.setTimeout(exitNow, remaining);
    timers.current.push(id);
  }, [pathname, phase, exitNow]);

  // Global anchor interceptor — captures every internal <Link>/<a> click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = (e.target as HTMLElement | null)?.closest("a");
      if (!target) return;

      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;
      if (target.dataset.noTransition === "true") return;

      const href = target.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("#")      ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const path = url.pathname + url.search + url.hash;
      if (path === window.location.pathname + window.location.search + window.location.hash) return;

      e.preventDefault();
      e.stopPropagation();
      start(path);
    };

    // Capture phase — runs before Next.js Link's own onClick handler.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <RouteTransitionContext.Provider value={{ start, phase }}>
      {children}
      <TransitionOverlay phase={phase} suit={suit} />
    </RouteTransitionContext.Provider>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

function TransitionOverlay({ phase, suit }: { phase: Phase; suit: SuitKey }) {
  const s = SUIT_MAP[suit];

  // Idle (pre-sweep): far top-left, off-screen, invisible.
  // In  : centered.
  // Hold: centered, sustained presence — subtle rotation/glow driven by CSS keyframes.
  // Out : far bottom-right, off-screen, fading.

  // The suit keeps a fixed scale + rotation across all phases.
  // Only `transform` (translate) and `opacity` change between phases →
  // both are clean transitions with no snap.
  const FIXED_SCALE    = 1.15;
  const FIXED_ROTATION = -22;

  let translateX  = "-95vw";
  let translateY  = "-95vh";
  let opacity     = 0;
  let blur        = 8;
  let tintOpacity = 0;
  let tintX       = 0;
  let tintY       = 0;
  let veilOpacity = 0;

  if (phase === "in") {
    translateX  = "0vw";
    translateY  = "0vh";
    opacity     = 1;
    blur        = 0;
    tintOpacity = 0.85;
    tintX       = 50;
    tintY       = 50;
    veilOpacity = 1;
  } else if (phase === "hold") {
    translateX  = "0vw";
    translateY  = "0vh";
    opacity     = 1;
    blur        = 0;
    tintOpacity = 0.85;
    tintX       = 50;
    tintY       = 50;
    veilOpacity = 1;
  } else if (phase === "out") {
    translateX  = "95vw";
    translateY  = "95vh";
    opacity     = 0;
    blur        = 4;
    tintOpacity = 0;
    tintX       = 100;
    tintY       = 100;
    veilOpacity = 0;
  }

  const SWEEP_EASE = "cubic-bezier(0.7, 0, 0.3, 1)";

  // Each phase gets its own duration so the suit settles in/out smoothly and
  // never moves during HOLD (no motion = no end-of-anim cut).
  const sweepDur =
    phase === "in"  ? IN_DURATION  :
    phase === "out" ? OUT_DURATION :
    phase === "hold" ? 0           : // hold doesn't transition position
    IN_DURATION;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 200,
        visibility: phase === "idle" ? "hidden" : "visible",
      }}
      aria-hidden
    >
      {/* Color wash — paints the screen with the route's tint */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 65vw 65vh at ${tintX}% ${tintY}%, ${s.tint} 0%, ${s.soft} 28%, transparent 60%)`,
          opacity: tintOpacity,
          transition: `opacity ${sweepDur}ms ${SWEEP_EASE}, background ${sweepDur}ms ${SWEEP_EASE}`,
          mixBlendMode: "screen",
        }}
      />

      {/* Dark veil — hides the in-progress page swap underneath */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0, 0, 0, 0.62)",
          opacity: veilOpacity,
          transition: `opacity ${sweepDur || OUT_DURATION}ms ${SWEEP_EASE}`,
        }}
      />

      {/* The big suit — sweeps diagonally, glow pulses during HOLD.
          Geometry (transform + scale) is IDENTICAL across in / hold / out-start,
          changing only at the sweep transition. Breathing affects only `filter`
          intensity → zero risk of geometric snap when phase changes. */}
      <div
        className="absolute will-change-transform"
        style={{
          left:   "50%",
          top:    "50%",
          width:  "min(80vw, 80vh)",
          height: "min(80vw, 80vh)",
          transform: `translate(-50%, -50%) translate(${translateX}, ${translateY}) rotate(${FIXED_ROTATION}deg) scale(${FIXED_SCALE})`,
          opacity,
          filter: `drop-shadow(0 0 80px ${s.glow}) drop-shadow(0 0 28px ${s.glow}) blur(${blur}px)`,
          transition: `
            transform ${sweepDur || OUT_DURATION}ms ${SWEEP_EASE},
            opacity ${sweepDur || OUT_DURATION}ms ${SWEEP_EASE},
            filter ${sweepDur || OUT_DURATION}ms ${SWEEP_EASE}
          `,
          // HOLD: only glow intensity pulses (via filter). Geometry untouched.
          animation: phase === "hold" ? "route-hold-breathe 2.4s ease-in-out infinite" : "none",
        }}
      >
        <Image
          src={s.src}
          alt=""
          fill
          priority
          className="object-contain"
          sizes="80vw"
        />
      </div>

      {/* Chromatic streak — specular line trailing along the diagonal */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            135deg,
            transparent 0%,
            transparent 42%,
            ${s.soft} 49%,
            rgba(255,255,255,0.35) 50%,
            ${s.soft} 51%,
            transparent 58%,
            transparent 100%
          )`,
          opacity: phase === "in" || phase === "hold" ? 0.55 : 0,
          mixBlendMode: "screen",
          transition: `opacity ${sweepDur || 250}ms ${SWEEP_EASE}, transform ${sweepDur || 250}ms ${SWEEP_EASE}`,
          transform:
            phase === "in" || phase === "hold"
              ? "translate(0, 0)"
              : phase === "out"
              ? "translate(40vw, 40vh)"
              : "translate(-40vw, -40vh)",
        }}
      />

      <style jsx>{`
        /* HOLD breathing — pulse ONLY the glow intensity via filter.
           Never touch transform, scale, or any geometric property — those are
           reserved for the sweep transition. Keeping the suit geometrically
           identical through hold and into the exit means no snap, no jump:
           when phase flips to out, transform smoothly sweeps from center to
           off-screen with nothing else competing. */
        @keyframes route-hold-breathe {
          0%, 100% {
            filter:
              drop-shadow(0 0 65px ${s.glow})
              drop-shadow(0 0 22px ${s.glow})
              blur(0px)
              brightness(0.95);
          }
          50% {
            filter:
              drop-shadow(0 0 120px ${s.glow})
              drop-shadow(0 0 42px ${s.glow})
              blur(0px)
              brightness(1.18);
          }
        }
      `}</style>
    </div>
  );
}
