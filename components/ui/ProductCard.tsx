"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/translations";

interface ProductCardProps {
  product: Product;
  index: number;
}

// Preloaded audio pool for reliable, consistent playback
const POOL_SIZE = 4;
let audioPool: HTMLAudioElement[] = [];
let poolIndex = 0;

function initPool() {
  // Re-init if pool was cleared (e.g. hot reload)
  if (audioPool.length === POOL_SIZE) return;
  audioPool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const a = new Audio("/spraycan.wav");
    a.volume = 0.06;
    a.preload = "auto";
    audioPool.push(a);
  }
}

function playSpraySound() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.innerWidth < 768) return;

  initPool();

  const audio = audioPool[poolIndex % POOL_SIZE];
  poolIndex++;
  audio.currentTime = 0;
  audio.play().catch(() => {
    /* autoplay blocked — silently ignore */
  });
}

export function ProductCard({ product, index }: ProductCardProps) {
  const { locale, t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

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
      className="reveal group card-perspective"
      style={{ animationDelay: `${index * 80}ms` }}
      onMouseEnter={playSpraySound}
    >
      <Link href={`/product/${product.id}`} className="block">
        {/* Image Container */}
        <div
          ref={innerRef}
          className="relative aspect-square overflow-hidden rounded-lg bg-concrete-light card-glow card-3d"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={product.images[0]}
            alt={product.name[locale as Locale]}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />

          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-void/0 group-hover:bg-void/20 transition-colors duration-500 pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
            {product.isOneOfAKind && (
              <span className="stencil-badge inline-block px-2.5 py-1 bg-void/70 backdrop-blur-sm text-[10px] rounded-full">
                {t("shop.oneOfAKind")}
              </span>
            )}
            {product.isSold && (
              <span className="inline-block px-2.5 py-1 bg-pink-hot/80 backdrop-blur-sm text-[10px] font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-white rounded-full">
                {t("shop.sold")}
              </span>
            )}
          </div>

          {/* Quick view hint */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out pointer-events-none">
            <span className="inline-block px-4 py-2 bg-white text-void text-xs font-[family-name:var(--font-display)] font-medium tracking-wider uppercase rounded-full">
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
