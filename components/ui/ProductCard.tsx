"use client";

import { useRef, useCallback } from "react";
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
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const isFav = isFavorite(product.id);

  const handleFavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = innerRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = innerRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
  }, []);

  return (
    <div
      ref={cardRef}
      className="group card-perspective"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Link href={`/product/${product.id}`} className="block">
        {/* Image Container */}
        <div
          ref={innerRef}
          className="relative aspect-square overflow-hidden rounded-lg bg-concrete-light card-glow card-3d isolate will-change-transform"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <Image
            src={product.images[0]}
            alt={product.name[locale as Locale]}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-void/0 group-hover:bg-void/20 transition-colors duration-500 pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
            {product.isOneOfAKind && (
              <span className="font-[family-name:var(--font-display)] text-xs tracking-[0.15em] uppercase text-[#EEFF00] drop-shadow-[0_0_6px_rgba(238,255,0,0.5)]">
                {t("shop.oneOfAKind")}
              </span>
            )}
            {product.isSold && (
              <span className="badge-sold inline-block px-2.5 py-1 bg-void/60 backdrop-blur-sm text-[10px] font-bold rounded-full">
                {t("shop.sold")}
              </span>
            )}
          </div>

          {/* Favorite button — spray tag */}
          <button
            onClick={handleFavClick}
            className={`absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${
              isFav
                ? "bg-void/40 backdrop-blur-sm text-suit-heart"
                : "bg-void/20 backdrop-blur-sm text-white/50 opacity-0 group-hover:opacity-100 hover:text-white"
            }`}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <FavoriteIcon active={isFav} />
          </button>

          {/* Quick view hint */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out pointer-events-none">
            <span className="btn-brand inline-block px-4 py-2 text-xs font-medium rounded-full">
              {t("shop.viewDetails")}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 px-1">
          <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide uppercase text-chrome-bright">
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
