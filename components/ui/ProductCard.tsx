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

/** Heart suit — outline when idle, filled with glow when favorited. */
function FavoriteIcon({ active }: { active: boolean }) {
  return (
    <div className={`relative w-7 h-7 transition-all duration-400 ${active ? "scale-110" : "scale-100"}`}>
      <Image
        src={active ? "/suits/heart.webp" : "/suits/heart-unfilled.webp"}
        alt=""
        fill
        className={`object-contain transition-all duration-400 ${active ? "drop-shadow-[0_0_10px_rgba(136,0,204,0.85)]" : ""}`}
        sizes="28px"
      />
    </div>
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
            className="absolute inset-0 z-0 opacity-20 md:opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            aria-hidden="true"
          >
            <Image
              src={product.images[0]}
              alt=""
              fill
              sizes="20vw"
              className="object-contain scale-[1.2] blur-[28px] brightness-[0.55] saturate-[2.4]"
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

          {/* ── Badges — diamond = ONE OF ONE · spade = SOLD ── */}
          <div className="absolute top-1 left-1 md:top-2 md:left-2 flex flex-col gap-0.5 pointer-events-none z-20">
            {product.isOneOfAKind && (
              <div
                className="relative w-9 h-9 md:w-11 md:h-11 drop-shadow-[0_0_8px_rgba(0,220,255,0.65)]"
                aria-label={t("shop.oneOfAKind")}
              >
                <Image src="/suits/diamond.webp" alt="One of a kind" fill className="object-contain" sizes="44px" />
              </div>
            )}
            {product.isSold && (
              <div
                className="relative w-9 h-9 md:w-11 md:h-11 drop-shadow-[0_0_8px_rgba(30,80,255,0.65)]"
                aria-label={t("shop.sold")}
              >
                <Image src="/suits/spade.webp" alt="Sold" fill className="object-contain" sizes="44px" />
              </div>
            )}
          </div>

          {/* ── Favorite — top-right, no chip, legibility shadow ── */}
          <button
            onClick={handleFavClick}
            className="absolute top-2 right-2 md:top-3 md:right-3 z-20 w-9 h-9 flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <FavoriteIcon active={isFav} />
          </button>
        </div>

        {/* ── Info — counter-parallax: drifts with cursor (further plane) ── */}
        <div ref={infoRef} className="mt-4 px-1 will-change-transform text-center md:text-left">
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
