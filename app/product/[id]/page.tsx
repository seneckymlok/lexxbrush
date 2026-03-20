"use client";

import { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import { getProduct } from "@/lib/products";
import type { Product } from "@/lib/products";
import type { Locale } from "@/lib/translations";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const imageRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProduct(params.id as string).then((p) => {
      setProduct(p);
      if (p?.sizes?.[0]) setSelectedSize(p.sizes[0]);
      setLoading(false);
    });
  }, [params.id]);

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
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t("product.backToShop")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image section */}
        <div>
          {/* Main image */}
          <div ref={imageRef} className="aspect-square rounded-xl overflow-hidden bg-concrete-light" style={{ clipPath: "inset(0 0 0 0)" }}>
            <img
              src={product.images[activeImage]}
              alt={product.name[locale as Locale]}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>

          {/* Thumbnail strip */}
          {hasMultipleImages && (
            <div className="flex gap-2 mt-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-300 ${
                    activeImage === i
                      ? "border-pink opacity-100 shadow-[0_0_10px_rgba(255,105,180,0.2)]"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
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
            <div className="mt-8">
              <label className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-3">{t("product.size")}</label>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
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
            </div>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.isSold}
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

          {/* Details */}
          <div className="mt-10 pt-6 border-t border-white/5">
            <h3 className="text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-4">{t("product.details")}</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 text-sm text-chrome-light">
                <span className="w-1.5 h-1.5 rounded-full bg-pink" />{t("product.handPainted")}
              </li>
              <li className="flex items-center gap-3 text-sm text-chrome-light">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan" />{t("product.unique")}
              </li>
              <li className="flex items-center gap-3 text-sm text-chrome-light">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-hot" />{t("product.madeInPrague")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
