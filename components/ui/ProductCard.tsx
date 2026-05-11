"use client";

import { useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useFavorites } from "@/components/providers/FavoritesProvider";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/translations";

interface ProductCardProps {
  product: Product;
  index: number;
}

/** Heart suit icon for favorites — matches brand identity */
function FavoriteIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className={`transition-all duration-400 ${
        active ? "scale-110" : "scale-100"
      }`}
    >
      <path
        d="M12 21 C12 21 3 14 3 8.5 C3 5.4 5.4 3 8.5 3 C10.2 3 11.6 3.8 12 5 C12.4 3.8 13.8 3 15.5 3 C18.6 3 21 5.4 21 8.5 C21 14 12 21 12 21Z"
        fill={active ? "var(--color-suit-heart)" : "none"}
        stroke={active ? "var(--color-suit-heart)" : "currentColor"}
        strokeWidth={active ? "0" : "1.5"}
        strokeLinejoin="round"
        className="transition-all duration-400"
      />
    </svg>
  );
}

export function ProductCard({ product, index }: ProductCardProps) {
  const { locale, t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();

  const cardRef      = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const infoRef      = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFav = isFavorite(product.id);

  // Cleanup on unmount — prevent RAF/timeout leaks
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleFavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  /**
   * Parallax on mouse move.
   *
   * Image wrapper drifts OPPOSITE the cursor (max ±6x / ±4y px) — feels close,
   * floating in front of the plane.
   *
   * Info block drifts WITH the cursor (max ±2x / ±1.5y px) — feels further back,
   * reinforcing the illusion of depth between layers.
   *
   * RAF-batched so it never blocks paint or layout.
   */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Capture before RAF — React may recycle the synthetic event object
    const clientX = e.clientX;
    const clientY = e.clientY;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current || !imageWrapRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      // Normalized offset from card center: -1 (left/top) → +1 (right/bottom)
      const dx = (clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
      const dy = (clientY - rect.top   - rect.height / 2) / (rect.height / 2);

      imageWrapRef.current.style.transform =
        `translate(${(-dx * 6).toFixed(2)}px, ${(-dy * 4).toFixed(2)}px)`;

      if (infoRef.current) {
        infoRef.current.style.transform =
          `translate(${(dx * 2).toFixed(2)}px, ${(dy * 1.5).toFixed(2)}px)`;
      }
    });
  }, []);

  /**
   * Spring-back on mouse leave.
   * Cubic-bezier(0.23, 1, 0.32, 1) = fast start, gradual ease-out ("elastic" feel).
   * Inline transition is removed after animation completes so CSS takes back control.
   */
  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const spring = "transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)";

    if (imageWrapRef.current) {
      imageWrapRef.current.style.transition = spring;
      imageWrapRef.current.style.transform  = "translate(0, 0)";
    }
    if (infoRef.current) {
      infoRef.current.style.transition = spring;
      infoRef.current.style.transform  = "translate(0, 0)";
    }

    // Hand transition control back to CSS once spring completes
    timeoutRef.current = setTimeout(() => {
      if (imageWrapRef.current) imageWrapRef.current.style.transition = "";
      if (infoRef.current)      infoRef.current.style.transition      = "";
    }, 650);
  }, []);

  return (
    <div
      ref={cardRef}
      className="group card-perspective"
      style={{ animationDelay: `${index * 80}ms` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/product/${product.id}`} className="block">

        {/* ── Cell — uniform square ── */}
        <div className="relative aspect-square isolate">

          {/* ── Ambient color halo ────────────────────────────────────────────
              A scaled-up, heavily blurred duplicate of the product image
              bleeds its actual color palette outward as atmospheric glow.
              Invisible at rest, fades in on hover (700ms ease-out).
              Decorative only — pointer-events disabled.                   */}
          <div
            className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            aria-hidden="true"
          >
            <Image
              src={product.images[0]}
              alt=""
              fill
              sizes="20vw"
              className="object-contain scale-[1.55] blur-[38px] brightness-[0.62] saturate-[2.4]"
            />
          </div>

          {/* ── Product image — parallax target ───────────────────────────────
              Wrapped in its own div so the JS translate (parallax)
              and the CSS translateY hover lift (product-float) live on
              separate elements and compose naturally without conflict.    */}
          <div
            ref={imageWrapRef}
            className="absolute inset-0 z-10 will-change-transform"
          >
            <Image
              src={product.images[0]}
              alt={product.name[locale as Locale]}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain product-float"
            />
          </div>

          {/* ── Badges — anchored to cell, above halo + image ── */}
          <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-2 pointer-events-none z-20">
            {product.isOneOfAKind && (
              <span className="font-[family-name:var(--font-display)] text-[9px] md:text-xs tracking-[0.08em] md:tracking-[0.15em] uppercase text-[#EEFF00] drop-shadow-[0_0_6px_rgba(238,255,0,0.5)]">
                {t("shop.oneOfAKind")}
              </span>
            )}
            {product.isSold && (
              <span className="badge-sold inline-block px-2.5 py-1 bg-void/60 backdrop-blur-sm text-[10px] font-bold rounded-full">
                {t("shop.sold")}
              </span>
            )}
          </div>

          {/* ── Favorite — top-right, no chip, legibility shadow ── */}
          <button
            onClick={handleFavClick}
            className={`absolute top-2 right-2 md:top-3 md:right-3 z-20 w-9 h-9 flex items-center justify-center transition-all duration-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] ${
              isFav
                ? "text-suit-heart"
                : "text-white/45 hover:text-white"
            }`}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <FavoriteIcon active={isFav} />
          </button>
        </div>

        {/* ── Info — counter-parallax: drifts with cursor (further plane) ── */}
        <div ref={infoRef} className="mt-4 px-1 will-change-transform">
          <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide uppercase product-name-shimmer">
            {product.name[locale as Locale]}
          </h3>
          <p className="mt-1 font-[family-name:var(--font-body)] text-sm text-chrome">
            &euro;{product.price}
          </p>
        </div>

      </Link>
    </div>
  );
}
