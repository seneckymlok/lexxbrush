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

          {/* Details — editorial strip */}
          <div className="mt-10 pt-6 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-xs font-[family-name:var(--font-display)] tracking-[0.2em] uppercase text-chrome-light">{t("product.handPainted")}</span>
              <span className="w-1 h-1 rounded-full bg-pink" aria-hidden="true" />
              <span className="text-xs font-[family-name:var(--font-display)] tracking-[0.2em] uppercase text-chrome-light">{t("product.unique")}</span>
              <span className="w-1 h-1 rounded-full bg-lime" aria-hidden="true" />
              <span className="text-xs font-[family-name:var(--font-display)] tracking-[0.2em] uppercase text-chrome-light">{t("product.madeByHand")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
