"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";

// ─── Transient, Instagram-story-style zoom ───────────────────────────────────
//
// Touch:  pinch with two fingers to zoom the IMAGE (not the page); the pinch
//         midpoint stays anchored and two-finger drag pans. Lift one finger and
//         the remaining finger keeps panning. Release both → springs back to 1×.
// Mouse:  press and hold to zoom into the cursor, move to pan, release → springs
//         back. A quick click (no hold) closes via onTap, same as a quick tap.
//
// All state is kept in refs and written straight to `style.transform` (rAF
// batched) so dragging tracks the finger/cursor 1:1 without React re-renders.

const MAX_SCALE = 4;
const HOLD_SCALE = 2.5;     // desktop press-and-hold target
const HOLD_DELAY = 140;     // ms a mouse must stay down before it counts as a hold
const TAP_MS = 220;         // max duration of a tap/click
const TAP_MOVE = 10;        // max movement (px) for a tap/click
const RETURN = "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)";

interface Props {
  src: string;
  alt: string;
  /** Called on a clean tap/click (no zoom) - used to close the lightbox. */
  onTap?: () => void;
}

type Pt = { x: number; y: number };
type Gesture =
  | { mode: "none" }
  | { mode: "pinch"; base: { scale: number; tx: number; ty: number }; startDist: number; startMid: Pt; center: Pt }
  | { mode: "pan" | "hold"; last: Pt };

export function ZoomableImage({ src, alt, onTap }: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const pointers = useRef(new Map<number, Pt>());
  const st = useRef({ scale: 1, tx: 0, ty: 0 });        // current applied transform
  const g = useRef<Gesture>({ mode: "none" });
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const press = useRef({ t: 0, x: 0, y: 0, moved: false });
  const raf = useRef(0);

  const apply = useCallback((withTransition: boolean) => {
    const el = layerRef.current;
    if (!el) return;
    el.style.transition = withTransition ? RETURN : "none";
    el.style.transform = `translate(${st.current.tx}px, ${st.current.ty}px) scale(${st.current.scale})`;
  }, []);

  const scheduleApply = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => apply(false));
  }, [apply]);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(1, s));

  const clampTranslate = (tx: number, ty: number, s: number) => {
    const r = surfaceRef.current?.getBoundingClientRect();
    if (!r) return { tx, ty };
    const mx = (r.width * (s - 1)) / 2;
    const my = (r.height * (s - 1)) / 2;
    return {
      tx: Math.max(-mx, Math.min(mx, tx)),
      ty: Math.max(-my, Math.min(my, ty)),
    };
  };

  const reset = useCallback(() => {
    st.current = { scale: 1, tx: 0, ty: 0 };
    g.current = { mode: "none" };
    apply(true);
  }, [apply]);

  const beginHoldZoom = useCallback((cx: number, cy: number) => {
    const r = surfaceRef.current?.getBoundingClientRect();
    if (!r) return;
    const focalX = cx - (r.left + r.width / 2);
    const focalY = cy - (r.top + r.height / 2);
    // Zoom about the cursor from 1x (t=0): t = focal * (1 - s).
    const s = HOLD_SCALE;
    const c = clampTranslate(focalX * (1 - s), focalY * (1 - s), s);
    st.current = { scale: s, tx: c.tx, ty: c.ty };
    g.current = { mode: "hold", last: { x: cx, y: cy } };
    apply(true); // animate the zoom-in
  }, [apply]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Keep receiving moves even if the finger/cursor leaves the surface.
      // Guarded: setPointerCapture can throw (e.g. a non-active pointer), and a
      // throw here must not abort the gesture setup below.
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        /* capture unavailable - moves still arrive while the pointer is down */
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      press.current = { t: Date.now(), x: e.clientX, y: e.clientY, moved: false };

      if (e.pointerType === "mouse") {
        // Press-and-hold: a deliberate hold zooms; a quick click falls through
        // to onTap (close). The delay keeps a click from flashing a zoom.
        if (holdTimer.current) clearTimeout(holdTimer.current);
        holdTimer.current = setTimeout(() => beginHoldZoom(e.clientX, e.clientY), HOLD_DELAY);
      } else if (pointers.current.size === 2) {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        const [a, b] = [...pointers.current.values()];
        const r = surfaceRef.current!.getBoundingClientRect();
        g.current = {
          mode: "pinch",
          base: { ...st.current },
          startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          center: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
        };
      }
    },
    [beginHoldZoom],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const p = pointers.current.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX;
      p.y = e.clientY;

      if (
        !press.current.moved &&
        Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > TAP_MOVE
      ) {
        press.current.moved = true;
      }

      const gg = g.current;

      if (gg.mode === "pinch" && pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const s = clampScale(gg.base.scale * (dist / gg.startDist));
        const fx = gg.startMid.x - gg.center.x;
        const fy = gg.startMid.y - gg.center.y;
        // Keep the start midpoint anchored, then add two-finger pan delta.
        const tx = fx - (s / gg.base.scale) * (fx - gg.base.tx) + (mid.x - gg.startMid.x);
        const ty = fy - (s / gg.base.scale) * (fy - gg.base.ty) + (mid.y - gg.startMid.y);
        const c = clampTranslate(tx, ty, s);
        st.current = { scale: s, tx: c.tx, ty: c.ty };
        scheduleApply();
      } else if ((gg.mode === "pan" || gg.mode === "hold") && gg.last) {
        const c = clampTranslate(
          st.current.tx + (e.clientX - gg.last.x),
          st.current.ty + (e.clientY - gg.last.y),
          st.current.scale,
        );
        gg.last = { x: e.clientX, y: e.clientY };
        st.current = { ...st.current, tx: c.tx, ty: c.ty };
        scheduleApply();
      }
    },
    [scheduleApply],
  );

  const endPointer = useCallback(
    (e: React.PointerEvent) => {
      pointers.current.delete(e.pointerId);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        /* pointer already released */
      }
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }

      const quick = Date.now() - press.current.t < TAP_MS && !press.current.moved;

      if (pointers.current.size === 0) {
        if (g.current.mode === "none" && quick) {
          onTap?.();
          return;
        }
        if (st.current.scale !== 1 || st.current.tx !== 0 || st.current.ty !== 0) {
          reset();
        } else {
          g.current = { mode: "none" };
        }
      } else if (pointers.current.size === 1 && g.current.mode === "pinch") {
        // One finger lifted mid-pinch → keep zoomed, pan with the survivor.
        const [rem] = [...pointers.current.values()];
        g.current = { mode: "pan", last: { x: rem.x, y: rem.y } };
      }
    },
    [onTap, reset],
  );

  return (
    <div
      ref={surfaceRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 overflow-hidden select-none cursor-zoom-in"
      style={{ touchAction: "none" }}
    >
      <div ref={layerRef} className="absolute inset-0 will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="100vw"
          draggable={false}
          priority
        />
      </div>
    </div>
  );
}
