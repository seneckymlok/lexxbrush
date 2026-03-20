"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import { getProduct } from "@/lib/products";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/translations";

interface Props {
  initialProduct: Product | undefined;
  productId: string;
}

export function ProductPageClient({ initialProduct, productId }: Props) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | undefined>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    initialProduct?.sizes?.[0]
  );
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const imageRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

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

    gsap.fromTo(imageRef.current,
      { clipPath: "inset(100% 0 0 0)" },
      { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "power4.inOut" }
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

  return (
    <div className="page-enter max-w-[1440px] mx-auto px-6 md:px-10 pt-20 pb-8 md:pt-24 md:pb-16">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="inline-flex items-center gap-2 text-sm text-chrome hover:text-cyan transition-colors duration-300 font-[family-name:var(--font-display)] tracking-wider uppercase mb-8"
        aria-label="Back to shop"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t("product.backToShop")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image section */}
        <div>
          {/* Main image */}
          <div ref={imageRef} className="aspect-square rounded-xl overflow-hidden bg-concrete-light relative" style={{ clipPath: "inset(0 0 0 0)" }}>
            <Image
              src={product.images[activeImage]}
              alt={product.name[locale as Locale]}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-opacity duration-300"
              priority
            />
          </div>

          {/* Thumbnail strip */}
          {hasMultipleImages && (
            <div className="flex gap-2 mt-3" role="tablist" aria-label="Product images">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  role="tab"
                  aria-selected={activeImage === i}
                  aria-label={`View image ${i + 1}`}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-300 relative ${
                    activeImage === i
                      ? "border-pink opacity-100 shadow-[0_0_10px_rgba(255,105,180,0.2)]"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name[locale as Locale]} - view ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div ref={infoRef} className="flex flex-col justify-center py-4">
          <div className="flex gap-2 mb-4">
            {product.isOneOfAKind && (
              <span className="stencil-badge inline-block px-3 py-1 text-[10px] rounded-full">{t("product.oneOfAKind")}</span>
            )}
            {product.isSold && (
              <span className="badge-sold inline-block px-3 py-1 text-[10px] font-bold rounded-full">{t("product.sold")}</span>
            )}
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text">
            {product.name[locale as Locale]}
          </h1>

          <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-white">&euro;{product.price}</p>

          <div className="w-10 h-[1px] bg-white/10 my-6" />

          <p className="text-chrome-light leading-relaxed max-w-lg">{product.description[locale as Locale]}</p>

          {/* Size Selector */}
          {product.sizes && (
            <fieldset className="mt-8">
              <legend className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-3">{t("product.size")}</legend>
              <div className="flex gap-2" role="radiogroup" aria-label="Select size">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    role="radio"
                    aria-checked={selectedSize === size}
                    aria-label={`Size ${size}`}
                    className={`w-12 h-12 flex items-center justify-center text-sm font-[family-name:var(--font-display)] font-semibold rounded-lg border transition-all duration-300 ${
                      selectedSize === size
                        ? "bg-gradient-to-br from-pink-hot to-pink text-white border-pink/30 shadow-[0_0_12px_rgba(255,20,147,0.2)]"
                        : "bg-transparent text-chrome-light border-steel hover:border-pink/40"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.isSold}
            aria-label={product.isSold ? "Sold out" : `Add ${product.name[locale as Locale]} to cart`}
            className={`mt-8 w-full md:w-auto px-10 py-4 text-sm font-bold rounded-full transition-all duration-400 ${
              product.isSold
                ? "bg-concrete-light text-text-dim cursor-not-allowed font-[family-name:var(--font-display)] tracking-[0.15em] uppercase"
                : added
                  ? "bg-cyan text-void font-[family-name:var(--font-display)] tracking-[0.15em] uppercase shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                  : "btn-brand"
            }`}
          >
            {product.isSold ? t("product.sold") : added ? "Added!" : t("product.addToCart")}
          </button>

          {/* Details — Premium icon grid */}
          <div className="mt-10 pt-6 border-t border-white/5">
            <h3 className="text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-5">{t("product.details")}</h3>
            <div className="grid grid-cols-3 gap-3">
              {/* Hand-airbrushed */}
              <div className="group flex flex-col items-center text-center gap-2.5 p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:border-pink/20 hover:bg-white/[0.03] transition-all duration-300">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-pink/10 text-pink group-hover:bg-pink/15 transition-colors duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
                    <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
                    <path d="M14.5 17.5 4.5 15" />
                  </svg>
                </div>
                <span className="text-[10px] md:text-xs font-[family-name:var(--font-display)] tracking-[0.1em] uppercase text-chrome-light leading-tight">{t("product.handPainted")}</span>
              </div>

              {/* Unique piece */}
              <div className="group flex flex-col items-center text-center gap-2.5 p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:border-cyan/20 hover:bg-white/[0.03] transition-all duration-300">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan/10 text-cyan group-hover:bg-cyan/15 transition-colors duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                    <path d="M2 12a10 10 0 0 1 18-6" />
                    <path d="M2 16h.01" />
                    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
                  </svg>
                </div>
                <span className="text-[10px] md:text-xs font-[family-name:var(--font-display)] tracking-[0.1em] uppercase text-chrome-light leading-tight">{t("product.unique")}</span>
              </div>

              {/* Made by hand */}
              <div className="group flex flex-col items-center text-center gap-2.5 p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:border-pink-hot/20 hover:bg-white/[0.03] transition-all duration-300">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-pink-hot/10 text-pink-hot group-hover:bg-pink-hot/15 transition-colors duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
                    <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
                    <path d="m2 15 6 6" />
                    <path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z" />
                  </svg>
                </div>
                <span className="text-[10px] md:text-xs font-[family-name:var(--font-display)] tracking-[0.1em] uppercase text-chrome-light leading-tight">{t("product.madeByHand")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
