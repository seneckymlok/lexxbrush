"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function NewsletterConfirmedPage() {
  const { t } = useLanguage();
  return (
    <div className="page-enter min-h-screen flex items-center justify-center px-6 pt-24 pb-24">
      <div className="max-w-md w-full text-center">
        <div className="relative w-16 h-16 mx-auto mb-8 drop-shadow-[0_0_24px_rgba(50,100,255,0.55)]">
          <Image src="/suits/spade.webp" alt="" fill className="object-contain" sizes="64px" />
        </div>

        <p className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">
          {t("newsletter.confirmed.eyebrow")}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text mb-4">
          {t("newsletter.confirmed.title")}
        </h1>
        <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-6" />
        <p className="text-chrome text-sm leading-relaxed mb-10">
          {t("newsletter.confirmed.body")}
        </p>

        <button
          onClick={() => {
            sessionStorage.setItem("lexxbrush:intro-seen", "1");
            window.location.href = "/";
          }}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300 font-[family-name:var(--font-display)] tracking-[0.1em] uppercase cursor-pointer"
        >
          {t("newsletter.confirmed.cta")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
