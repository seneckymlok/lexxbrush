"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";

// ─── Native scroll-snap image carousel ───────────────────────────────────────
//
// Smooth, momentum-y, gallery-style swiping comes from the browser's own
// scroll-snap - far smoother than a hand-rolled drag, and it natively tells a
// tap (fires the click → navigate / open lightbox) apart from a swipe (scrolls,
// no click). Controlled: the parent owns `index`, so arrows, thumbnails and
// keyboard stay in sync. A horizontal swipe updates `index`; an external `index`
// change scrolls to that slide.

interface Props {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (i: number) => void;
  sizes?: string;
  /** Eager-load every slide (use in the detail view so swipes don't flash). */
  eager?: boolean;
  priority?: boolean;
  /** Class on each <Image> (e.g. "object-contain product-float"). */
  imageClassName?: string;
  showDots?: boolean;
}

export function SwipeGallery({
  images,
  alt,
  index,
  onIndexChange,
  sizes = "100vw",
  eager,
  priority,
  imageClassName = "object-contain",
  showDots,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const programmatic = useRef(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // External index change (arrow / thumbnail / keyboard) → glide to that slide.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const left = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) < 2) return;
    programmatic.current = true;
    el.scrollTo({ left, behavior: "smooth" });
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => (programmatic.current = false), 500);
  }, [index]);

  // Swipe → report the snapped slide back up.
  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = scroller.current;
      if (!el || programmatic.current || el.clientWidth === 0) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i !== index && i >= 0 && i < images.length) onIndexChange(i);
    });
  }, [index, images.length, onIndexChange]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
  }, []);

  return (
    <div className="absolute inset-0">
      <div
        ref={scroller}
        onScroll={onScroll}
        role="group"
        aria-label={alt}
        className="flex h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar overscroll-x-contain"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="relative h-full w-full flex-shrink-0 snap-center snap-always"
          >
            <Image
              src={src}
              alt={i === 0 ? alt : ""}
              fill
              sizes={sizes}
              className={imageClassName}
              draggable={false}
              priority={priority && i === 0}
              loading={priority && i === 0 ? undefined : eager ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {showDots && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 pointer-events-none">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-4 bg-white/85" : "w-1.5 bg-white/35"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
