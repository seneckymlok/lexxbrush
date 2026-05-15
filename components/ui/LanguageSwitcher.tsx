"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "sk" : "en")}
      className="relative flex items-center gap-1.5 px-2 py-1 text-xs font-[family-name:var(--font-display)] tracking-[0.2em] uppercase"
      aria-label="Switch language"
    >
      <span
        className={`transition-all duration-200 ${
          locale === "sk" ? "text-white" : "text-text-dim"
        }`}
      >
        SK
      </span>
      <span className="text-steel">/</span>
      <span
        className={`transition-all duration-200 ${
          locale === "en" ? "text-white" : "text-text-dim"
        }`}
      >
        EN
      </span>
    </button>
  );
}
