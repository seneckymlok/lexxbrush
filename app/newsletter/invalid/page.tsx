"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function NewsletterInvalidPage() {
  const { t } = useLanguage();
  return (
    <div className="page-enter min-h-screen flex items-center justify-center px-6 pt-24 pb-24">
      <div className="max-w-md w-full text-center">
        <p className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">
          {t("newsletter.invalid.eyebrow")}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text mb-4">
          {t("newsletter.invalid.title")}
        </h1>
        <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-6" />
        <p className="text-chrome text-sm leading-relaxed mb-10">
          {t("newsletter.invalid.body")}
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300 font-[family-name:var(--font-display)] tracking-[0.1em] uppercase"
        >
          {t("newsletter.invalid.cta")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
