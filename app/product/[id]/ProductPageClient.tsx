"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import { MagneticButton } from "@/components/ui/MagneticButton";
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (product) setActiveImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (product) setActiveImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

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
          <div 
            ref={imageRef} 
            className="aspect-square rounded-xl overflow-hidden bg-[url('/noise.png')] relative cursor-zoom-in group" 
            style={{ clipPath: "inset(0 0 0 0)" }}
            onClick={() => setIsLightboxOpen(true)}
          >
            <Image
              src={product.images[activeImage]}
              alt={product.name[locale as Locale]}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              priority
            />
            
            {hasMultipleImages && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 z-10 hover:scale-105 active:scale-95"
                  aria-label="Previous image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:bg-black/50 z-10 hover:scale-105 active:scale-95"
                  aria-label="Next image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </>
            )}

            {/* Zoom Hint Icon */}
            <div className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </div>
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
                    className={`w-12 h-12 flex items-center justify-center text-sm font-[family-name:var(--font-display)] font-medium rounded-lg border transition-all duration-300 ${
                      selectedSize === size
                        ? "bg-white/15 text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                        : "bg-transparent text-chrome-dim border-white/10 hover:border-white/25 hover:text-chrome"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Add to Cart */}
          <MagneticButton>
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
          </MagneticButton>

          {/* Details — editorial strip */}
          <div className="mt-10 pt-6 border-t border-white/5">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <span className="text-xs font-[family-name:var(--font-display)] tracking-[0.2em] uppercase text-chrome-light">{t("product.handPainted")}</span>
              <span className="w-[1px] h-3 bg-white/10" aria-hidden="true" />
              <span className="text-xs font-[family-name:var(--font-display)] tracking-[0.2em] uppercase text-chrome-light">{t("product.unique")}</span>
              <span className="w-[1px] h-3 bg-white/10" aria-hidden="true" />
              <span className="text-xs font-[family-name:var(--font-display)] tracking-[0.2em] uppercase text-chrome-light">{t("product.madeByHand")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-[#080808]/95 flex items-center justify-center backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-[110]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          {hasMultipleImages && (
            <button 
              onClick={handlePrevImage}
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all z-[110] hover:scale-105 active:scale-95"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}

          <div 
            className="relative w-full h-[85vh] md:h-[90vh] max-w-[90vw] md:max-w-[80vw] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={product.images[activeImage]}
              alt={`${product.name[locale as Locale]} - Zoomed`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {hasMultipleImages && (
            <button 
              onClick={handleNextImage}
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all z-[110] hover:scale-105 active:scale-95"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
