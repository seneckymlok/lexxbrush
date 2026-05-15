"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const { t } = useLanguage();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="page-enter min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-chrome-light">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{t("checkout.successTitle")}</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          {t("checkout.successMessage")}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
        >
          {t("product.backToShop")}
        </Link>
        {sessionId && (
          <p className="mt-6 text-[10px] text-white/15">Ref: {sessionId.slice(0, 20)}...</p>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white/30">Loading...</div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
