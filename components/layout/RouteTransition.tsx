"use client";

import React, {
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
  ) return "spade";
  return "heart";
}

// ─── Phases ───────────────────────────────────────────────────────────────────
//
// idle → nothing happening
// in   → suit sweeps in to center          (~450ms)
// hold → suit breathes while new page loads (min 200ms, max 4000ms)
// out  → suit exits to bottom-right        (~500ms)

type Phase = "idle" | "in" | "hold" | "out";

const IN_DURATION        = 450;
const OUT_DURATION       = 500;
const MIN_HOLD           = 200;
const MAX_HOLD           = 4000;
const POST_RENDER_BUFFER = 100;

// ─── Context ──────────────────────────────────────────────────────────────────

type Ctx = { start: (href: string) => void; phase: Phase };
const RouteTransitionContext = createContext<Ctx | null>(null);

export function useRouteTransition() {
  const ctx = useContext(RouteTransitionContext);
  if (!ctx) throw new Error("useRouteTransition must be inside RouteTransitionProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [phase, setPhase] = useState<Phase>("idle");
  const [suit,  setSuit]  = useState<SuitKey>("heart");

  // Refs that track mutable state without causing effect deps to change.
  const inFlight   = useRef(false);
  const phaseRef   = useRef<Phase>("idle");  // mirrors phase without triggering re-renders
  const targetPath = useRef<string | null>(null);
  const holdStart  = useRef<number>(0);
  const timers     = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep phaseRef in sync with state.
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // Cleanup all timers on unmount.
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const finishTransition = useCallback(() => {
    setPhase("idle");
    inFlight.current  = false;
    targetPath.current = null;
  }, []);

  const exitNow = useCallback(() => {
    setPhase("out");
    timers.current.push(
      setTimeout(finishTransition, OUT_DURATION),
    );
  }, [finishTransition]);

  // start - stable reference: never depends on phase state directly.
  // Uses phaseRef to read current phase inside callbacks without being
  // listed as a dep (avoids re-registering the click listener every phase).
  const start = useCallback(
    (href: string) => {
      if (inFlight.current) return;
      if (typeof window === "undefined") return;

      const targetClean  = href.split("#")[0];
      const currentClean = window.location.pathname + window.location.search;
      if (targetClean === currentClean) return;

      // Reduced-motion: instant navigate, no animation.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }

      inFlight.current   = true;
      targetPath.current = href.split("?")[0].split("#")[0];

      setSuit(suitForRoute(href));
      setPhase("in");

      // After IN: enter HOLD and push the route.
      timers.current.push(
        setTimeout(() => {
          setPhase("hold");
          holdStart.current = Date.now();

          // Navigate - if it throws, reset so future transitions work.
          try {
            router.push(href);
          } catch {
            inFlight.current = false;
            targetPath.current = null;
            setPhase("idle");
          }
        }, IN_DURATION),
      );

      // Hard safety: if the page never resolves, force exit after MAX_HOLD.
      timers.current.push(
        setTimeout(() => {
          // Use phaseRef - reading state here from closure is stale.
          if (inFlight.current && phaseRef.current !== "out") {
            exitNow();
          }
        }, IN_DURATION + MAX_HOLD),
      );
    },
    // exitNow and router are stable. No phase/phaseRef in deps - phaseRef is a ref.
    [router, exitNow],
  );

  // Watch pathname - when it matches the target during HOLD, schedule exit.
  useEffect(() => {
    if (phaseRef.current !== "hold") return;
    if (!targetPath.current) return;
    if (pathname !== targetPath.current) return;

    const elapsed   = Date.now() - holdStart.current;
    const remaining = Math.max(MIN_HOLD - elapsed, 0) + POST_RENDER_BUFFER;

    timers.current.push(setTimeout(exitNow, remaining));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, exitNow]);
  // NOTE: phase intentionally omitted - phaseRef is the authority here,
  // avoids retriggering this effect on every phase change.

  // Global anchor interceptor.
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
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try { url = new URL(href, window.location.href); }
      catch { return; }

      if (url.origin !== window.location.origin) return;

      const path = url.pathname + url.search + url.hash;
      if (path === window.location.pathname + window.location.search + window.location.hash) return;

      e.preventDefault();
      e.stopPropagation();
      start(path);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  // start is now stable - won't re-register on every phase change.
  }, [start]);

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

  const FIXED_SCALE    = 1.15;
  const FIXED_ROTATION = -22;
  const SWEEP_EASE     = "cubic-bezier(0.7, 0, 0.3, 1)";

  let translateX  = "-95vw";
  let translateY  = "-95vh";
  let opacity     = 0;
  let blur        = 8;
  let tintOpacity = 0;
  let tintX       = 0;
  let tintY       = 0;
  let veilOpacity = 0;

  if (phase === "in" || phase === "hold") {
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

  // hold uses 0 transition duration so the suit doesn't move - it's already
  // at center from "in". out/in use their own durations.
  const sweepDur =
    phase === "in"   ? IN_DURATION  :
    phase === "out"  ? OUT_DURATION :
    phase === "hold" ? 0            :
    IN_DURATION;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 200, visibility: phase === "idle" ? "hidden" : "visible" }}
      aria-hidden
    >
      {/* Color wash */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 65vw 65vh at ${tintX}% ${tintY}%, ${s.tint} 0%, ${s.soft} 28%, transparent 60%)`,
          opacity: tintOpacity,
          transition: `opacity ${sweepDur}ms ${SWEEP_EASE}, background ${sweepDur}ms ${SWEEP_EASE}`,
          mixBlendMode: "screen",
        }}
      />

      {/* Dark veil */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0, 0, 0, 0.62)",
          opacity: veilOpacity,
          transition: `opacity ${sweepDur || OUT_DURATION}ms ${SWEEP_EASE}`,
        }}
      />

      {/* Suit icon */}
      <div
        className="absolute will-change-transform"
        style={{
          "--suit-glow": s.glow,
          left:      "50%",
          top:       "50%",
          width:     "min(80vw, 80vh)",
          height:    "min(80vw, 80vh)",
          transform: `translate(-50%, -50%) translate(${translateX}, ${translateY}) rotate(${FIXED_ROTATION}deg) scale(${FIXED_SCALE})`,
          opacity,
          filter:    `drop-shadow(0 0 80px ${s.glow}) drop-shadow(0 0 28px ${s.glow}) blur(${blur}px)`,
          transition: `
            transform ${sweepDur || OUT_DURATION}ms ${SWEEP_EASE},
            opacity   ${sweepDur || OUT_DURATION}ms ${SWEEP_EASE},
            filter    ${sweepDur || OUT_DURATION}ms ${SWEEP_EASE}
          `,
          animation: phase === "hold" ? "route-hold-breathe 2.4s ease-in-out infinite" : "none",
        } as React.CSSProperties & { "--suit-glow": string }}
      >
        <Image src={s.src} alt="" fill priority className="object-contain" sizes="80vw" />
      </div>

      {/* Chromatic streak */}
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
            phase === "in" || phase === "hold" ? "translate(0, 0)"      :
            phase === "out"                    ? "translate(40vw, 40vh)" :
                                                 "translate(-40vw, -40vh)",
        }}
      />
    </div>
  );
}
