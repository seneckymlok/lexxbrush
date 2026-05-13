"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import { useFavorites } from "@/components/providers/FavoritesProvider";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getProduct } from "@/lib/products";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/translations";
import { hexToRgbString } from "@/lib/colorExtraction";

interface Props {
  initialProduct: Product | undefined;
  productId: string;
}

export function ProductPageClient({ initialProduct, productId }: Props) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct]       = useState<Product | undefined>(initialProduct);
  const [loading, setLoading]       = useState(!initialProduct);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(initialProduct?.sizes?.[0]);
  const [added, setAdded]           = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // DOM targets
  const imageRef         = useRef<HTMLDivElement>(null);      // GSAP clipPath + mousemove area
  const heroImageWrapRef = useRef<HTMLDivElement>(null);      // parallax translate target
  const titleRef         = useRef<HTMLHeadingElement>(null);  // shimmer target
  const infoRef          = useRef<HTMLDivElement>(null);      // GSAP fade-up target

  // Parallax animation handles
  const rafRef     = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Title shimmer ─────────────────────────────────────────────────────────
  // Shared logic: remove the class, force a reflow so the browser registers
  // the removal, then re-add it — animation restarts from the beginning.
  const playTitleShimmer = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.remove("product-title-shimmer--animate");
    void el.offsetWidth; // trigger reflow — required to restart CSS animation
    el.classList.add("product-title-shimmer--animate");
  }, []);

  // Fire once on page load, timed so it lands after the GSAP clipPath reveal (1s)
  // and the info fade-up (0.4s delay + 0.8s duration = 1.2s total), plus a breath.
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(playTitleShimmer, 1350);
    return () => clearTimeout(timer);
  }, [loading, playTitleShimmer]);

  // Replay on mouseenter
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.addEventListener("mouseenter", playTitleShimmer);
    return () => el.removeEventListener("mouseenter", playTitleShimmer);
  }, [playTitleShimmer]);

  // ── Parallax on hero image ────────────────────────────────────────────────
  // Stronger range than product cards (±10px / ±7px) — the image is much
  // larger so the motion reads as more dramatic while staying proportional.
  const handleImageMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!imageRef.current || !heroImageWrapRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const dx = (clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
      const dy = (clientY - rect.top   - rect.height / 2) / (rect.height / 2);
      // Image drifts opposite the cursor — reads as floating in front of the plane
      heroImageWrapRef.current.style.transform =
        `translate(${(-dx * 10).toFixed(2)}px, ${(-dy * 7).toFixed(2)}px)`;
    });
  }, []);

  const handleImageMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (heroImageWrapRef.current) {
      heroImageWrapRef.current.style.transition = "transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)";
      heroImageWrapRef.current.style.transform  = "translate(0, 0)";
    }
    timeoutRef.current = setTimeout(() => {
      if (heroImageWrapRef.current) heroImageWrapRef.current.style.transition = "";
    }, 700);
  }, []);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ── Lightbox keyboard handler + scroll lock ───────────────────────────────
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
    };

    // Save position, pin body — the only approach that reliably stops
    // scroll-bleed on iOS Safari and momentum-based trackpads.
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position   = "fixed";
    body.style.top        = `-${scrollY}px`;
    body.style.width      = "100%";
    body.style.overflow   = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      body.style.position = "";
      body.style.top      = "";
      body.style.width    = "";
      body.style.overflow = "";
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [isLightboxOpen]);

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (product) setActiveImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (product) setActiveImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (initialProduct) return;
    getProduct(productId).then((p) => {
      setProduct(p);
      if (p?.sizes?.[0]) setSelectedSize(p.sizes[0]);
      setLoading(false);
    });
  }, [productId, initialProduct]);

  useGSAP(() => {
    if (loading || !product) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // clipPath on the image wrapper only — the halo (a sibling div) is never
    // clipped, so its blur bleeds freely beyond the square boundary.
    // onComplete clears the clipPath so drop-shadow renders without constraint.
    gsap.fromTo(heroImageWrapRef.current,
      { clipPath: "inset(100% 0 0 0)" },
      {
        clipPath: "inset(0% 0 0 0)",
        duration: 1,
        ease: "power4.inOut",
        onComplete: () => {
          if (heroImageWrapRef.current) {
            heroImageWrapRef.current.style.clipPath = "none";
          }
        },
      }
    );
    gsap.fromTo(infoRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.4 }
    );
  }, { dependencies: [loading] });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-white/30 text-sm">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-chrome">Product not found.</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.sizes && !selectedSize) return;
    addItem(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const hasMultipleImages = product.images.length > 1;
  const isFav = isFavorite(product.id);

  // Per-product accent. Falls back to brand purple when accent_color is null.
  // Exposed as CSS vars so any descendant can opt in via `var(--product-accent)`
  // or `rgba(var(--product-accent-rgb), 0.x)` for translucent glows.
  const accent  = product.accentColor          || "#8800CC";
  const accent2 = product.accentColorSecondary || "#0088FF";
  const accentRgb = hexToRgbString(accent);
  const accentStyle = {
    "--product-accent":     accent,
    "--product-accent-2":   accent2,
    "--product-accent-rgb": accentRgb,
  } as React.CSSProperties;

  return (
    <div className="page-enter max-w-[1440px] mx-auto px-6 md:px-10 pt-20 pb-8 md:pt-24 md:pb-16 overflow-x-hidden w-full lg:flex-1 lg:flex lg:flex-col lg:min-h-0" style={accentStyle}>

      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="inline-flex items-center gap-2 text-sm text-chrome hover:text-white transition-colors duration-300 font-[family-name:var(--font-display)] tracking-wider uppercase mb-8"
        aria-label="Back to shop"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t("product.backToShop")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 lg:flex-1 lg:min-h-0">

        {/* ── Image column ── */}
        <div className="-mx-6 lg:mx-0">
          {/* Main image cell — mousemove area for parallax, click for lightbox */}
          <div
            ref={imageRef}
            className="aspect-[4/5] lg:aspect-auto lg:h-full relative cursor-zoom-in group"
            onClick={() => setIsLightboxOpen(true)}
            onMouseMove={handleImageMouseMove}
            onMouseLeave={handleImageMouseLeave}
          >
            {/* ── Ambient color halo ──────────────────────────────────────────
                Always present at 18% (atmospheric presence even at rest).
                Blooms to 65% on hover — the shirt's palette floods the space.
                Updates with activeImage so each angle has its own aura.
                Negative scale (2×) + 80px blur = wide, soft spread.          */}
            <div
              className="absolute inset-0 z-0 pointer-events-none opacity-[0.18] group-hover:opacity-[0.65] transition-opacity duration-700"
              aria-hidden="true"
            >
              <Image
                src={product.images[activeImage]}
                alt=""
                fill
                sizes="50vw"
                className="object-contain scale-[2] blur-[80px] brightness-[0.65] saturate-[2.3]"
              />
            </div>

            {/* ── Product image — parallax target ──────────────────────────────
                Wrapped in its own div so JS translate (parallax) and the CSS
                drop-shadow (product-float-hero) live on separate elements.
                The ±10 / ±7px translate range is stronger than the grid cards
                (±6 / ±4px) — proportional to the much larger display size.   */}
            <div
              ref={heroImageWrapRef}
              className="absolute inset-0 z-10 will-change-transform"
            >
              <Image
                src={product.images[activeImage]}
                alt={product.name[locale as Locale]}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain product-float-hero"
                priority
              />
            </div>

            {/* ── Favorite — top-right, no chip, matches grid card language ──
                Same heart icon, same positioning logic, same drop-shadow
                for legibility. w-12 h-12 (vs grid's w-9 h-9) — larger target
                on a larger image. Sits above halo (z-20) and image (z-10).   */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product) toggleFavorite(product.id);
              }}
              className="absolute top-4 right-4 z-20 w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-110"
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            >
              <div className={`relative w-10 h-10 transition-all duration-400 ${isFav ? "scale-110" : "scale-100"}`}>
                <Image
                  src={isFav ? "/suits/heart.webp" : "/suits/heart-unfilled.webp"}
                  alt=""
                  fill
                  className={`object-contain transition-all duration-400 ${isFav ? "drop-shadow-[0_0_14px_rgba(136,0,204,0.9)]" : ""}`}
                  sizes="40px"
                />
              </div>
            </button>

            {/* Prev / next arrows — only when multiple images */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 z-10 hover:scale-105 active:scale-95"
                  aria-label="Previous image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 z-10 hover:scale-105 active:scale-95"
                  aria-label="Next image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}

            {/* Zoom hint — bottom-right so it never conflicts with favorite (top-right) */}
            <div className="absolute bottom-4 right-4 w-9 h-9 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
          </div>

          {/* Thumbnail strip */}
          {hasMultipleImages && (
            <div className="flex gap-2 mt-3 px-6 lg:px-0" role="tablist" aria-label="Product images">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  role="tab"
                  aria-selected={activeImage === i}
                  aria-label={`View image ${i + 1}`}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 border transition-all duration-300 relative bg-white/[0.03] ${
                    activeImage === i
                      ? "border-white/40 opacity-100"
                      : "border-white/10 opacity-55 hover:opacity-85 hover:border-white/20"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name[locale as Locale]} - view ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info column ── */}
        <div ref={infoRef} className="flex flex-col items-center lg:items-start text-center lg:text-left pt-2 pb-8 lg:py-4">

          {/* Badge row — diamond = ONE OF ONE · spade = SOLD */}
          {(product.isOneOfAKind || product.isSold) && (
            <div className="flex items-center gap-3 mb-5">
              {product.isOneOfAKind && (
                <div className="group/badge relative flex-shrink-0">
                  <div className="relative w-12 h-12 drop-shadow-[0_0_10px_rgba(0,220,255,0.7)]">
                    <Image src="/suits/diamond.webp" alt="One of a kind" fill className="object-contain" sizes="48px" />
                  </div>
                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 text-[11px] font-medium tracking-widest uppercase whitespace-nowrap bg-black/80 text-cyan-300 border border-cyan-500/40 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200 z-10">
                    One of one
                  </span>
                </div>
              )}
              {product.isSold && (
                <div className="group/badge relative flex-shrink-0">
                  <div className="relative w-12 h-12 drop-shadow-[0_0_10px_rgba(30,80,255,0.7)]">
                    <Image src="/suits/spade.webp" alt="Sold" fill className="object-contain" sizes="48px" />
                  </div>
                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 text-[11px] font-medium tracking-widest uppercase whitespace-nowrap bg-black/80 text-blue-300 border border-blue-500/40 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200 z-10">
                    Sold
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Title — clamp keeps it from overflowing on any phone width */}
          <h1
            ref={titleRef}
            className="font-[family-name:var(--font-display)] text-[clamp(1rem,7vw,3.5rem)] lg:text-4xl font-extrabold tracking-tight uppercase product-title-shimmer cursor-default leading-[0.92] mb-5 w-full break-words"
          >
            {product.name[locale as Locale]}
          </h1>

          {/* Price — split for typographic weight contrast */}
          <div className="flex items-baseline gap-0.5 mb-7">
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white/60">
              &euro;
            </span>
            <span className="font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,2.75rem)] font-extrabold text-white leading-none">
              {product.price}
            </span>
          </div>

          {/* Full-width accent divider */}
          <div
            className="w-full h-px mb-7"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(var(--product-accent-rgb), 0.6), transparent)",
            }}
          />

          {/* Description */}
          <p className="font-[family-name:var(--font-body)] text-sm text-chrome-light leading-relaxed mb-8 max-w-[30ch] lg:max-w-lg">
            {product.description[locale as Locale]}
          </p>

          {/* Size selector — div/p instead of fieldset/legend (legend ignores text-center) */}
          {product.sizes && (
            <div className="w-full mb-8" role="group" aria-label="Select size">
              <p className="font-[family-name:var(--font-display)] text-[10px] font-bold tracking-[0.25em] uppercase text-chrome mb-3">
                {t("product.size")}
              </p>
              <div className="flex gap-2.5 justify-center lg:justify-start flex-wrap">
                {product.sizes.map((size) => {
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      role="radio"
                      aria-checked={active}
                      aria-label={`Size ${size}`}
                      className={`min-w-14 h-14 px-3 flex items-center justify-center text-sm font-[family-name:var(--font-display)] font-semibold rounded-xl border transition-all duration-300 whitespace-nowrap ${
                        active
                          ? "text-white"
                          : "bg-transparent text-chrome-dim border-white/10 hover:border-white/25 hover:text-chrome"
                      }`}
                      style={
                        active
                          ? {
                              background: "rgba(var(--product-accent-rgb), 0.14)",
                              borderColor: "rgba(var(--product-accent-rgb), 0.55)",
                              boxShadow: "0 0 22px rgba(var(--product-accent-rgb), 0.32)",
                            }
                          : undefined
                      }
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to cart — full width on mobile */}
          <MagneticButton>
            <button
              onClick={handleAddToCart}
              disabled={product.isSold}
              aria-label={product.isSold ? "Sold out" : `Add ${product.name[locale as Locale]} to cart`}
              className={`w-full lg:w-auto inline-flex items-center justify-center px-10 py-[1.05rem] text-sm font-bold rounded-full transition-all duration-400 font-[family-name:var(--font-display)] tracking-[0.18em] uppercase ${
                product.isSold
                  ? "bg-concrete-light text-text-dim cursor-not-allowed"
                  : added
                    ? "bg-sage text-void shadow-[0_0_24px_rgba(138,171,158,0.35)]"
                    : "btn-accent"
              }`}
            >
              {product.isSold ? t("product.sold") : added ? "Added!" : t("product.addToCart")}
            </button>
          </MagneticButton>

          {/* Editorial strip */}
          <div className="mt-8 pt-6 border-t border-white/5 w-full">
            <div className="flex items-center justify-center lg:justify-start gap-3 flex-nowrap">
              <span className="text-[9px] font-[family-name:var(--font-display)] tracking-[0.22em] uppercase text-white/30 whitespace-nowrap">
                {t("product.handPainted")}
              </span>
              <span className="w-px h-3 bg-white/10 flex-shrink-0" aria-hidden="true" />
              <span className="text-[9px] font-[family-name:var(--font-display)] tracking-[0.22em] uppercase text-white/30 whitespace-nowrap">
                {t("product.unique")}
              </span>
              <span className="w-px h-3 bg-white/10 flex-shrink-0" aria-hidden="true" />
              <span className="text-[9px] font-[family-name:var(--font-display)] tracking-[0.22em] uppercase text-white/30 whitespace-nowrap">
                {t("product.madeByHand")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox — rendered via portal so it sits at document.body level,
           outside any ancestor with overflow constraints or transforms.       */}
      {mounted && isLightboxOpen && product.images.length > 0 && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-[#080808]/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            className="absolute top-24 right-4 md:top-16 md:right-12 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-10 hover:scale-105 active:scale-95"
            aria-label="Close lightbox"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {hasMultipleImages && (
            <button
              onClick={handlePrevImage}
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all z-10 hover:scale-105 active:scale-95"
              aria-label="Previous image"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <div className="relative w-full h-[75dvh] md:h-[90dvh] max-w-[95vw] md:max-w-[80vw]">
            <Image
              src={product.images[activeImage]}
              alt={`${product.name[locale as Locale]} - Zoomed`}
              fill
              className="object-contain"
              sizes="100vw"
              preload
            />
          </div>

          {hasMultipleImages && (
            <button
              onClick={handleNextImage}
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all z-10 hover:scale-105 active:scale-95"
              aria-label="Next image"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
