"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";

// ─── Native scroll-snap image carousel ───────────────────────────────────────
//
// Smooth, momentum-y, gallery-style swiping comes from the browser's own
// scroll-snap. Controlled: the parent owns `index`, so arrows, thumbnails and
// keyboard stay in sync.
//
// Smoothness rule: do NOTHING in React while the finger is moving. The index is
// reported only once the scroll settles (debounced), so there are no mid-swipe
// re-renders and the programmatic `scrollTo` (for arrow/keyboard nav) never
// fights the native momentum scroll.

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
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True when the pending index change came from the user's own scroll, so the
  // effect below doesn't bounce a scrollTo back to where we already are.
  const selfScroll = useRef(false);

  // External index change (arrow / thumbnail / keyboard) → glide to that slide.
  useEffect(() => {
    if (selfScroll.current) {
      selfScroll.current = false;
      return;
    }
    const el = scroller.current;
    if (!el) return;
    const left = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) < 2) return;
    el.scrollTo({ left, behavior: "smooth" });
  }, [index]);

  // Report the snapped slide only after scrolling fully stops - never per frame.
  const onScroll = useCallback(() => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      const el = scroller.current;
      if (!el || el.clientWidth === 0) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i !== index && i >= 0 && i < images.length) {
        selfScroll.current = true;
        onIndexChange(i);
      }
    }, 90);
  }, [index, images.length, onIndexChange]);

  useEffect(
    () => () => {
      if (idle.current) clearTimeout(idle.current);
    },
    [],
  );

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
