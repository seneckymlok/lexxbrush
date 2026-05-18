"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pt-16">
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(3rem,11vw,7rem)] font-extrabold tracking-tight uppercase chrome-text leading-[0.9]">
        {t("errorPage.title")}
      </h1>
      <p
        className="mt-6 max-w-md font-[family-name:var(--font-display)] text-[10px] tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {t("errorPage.subtitle")}
      </p>
      {error.digest && (
        <p className="mt-3 text-[10px] tracking-[0.2em] text-white/20 font-mono">
          {error.digest}
        </p>
      )}
      <div className="mt-12 flex gap-6">
        <button
          onClick={reset}
          className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.25em] uppercase text-white/40 hover:text-white transition-colors duration-300 border-b border-white/20 hover:border-white/50 pb-px cursor-pointer"
        >
          {t("errorPage.retry")}
        </button>
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.25em] uppercase text-white/40 hover:text-white transition-colors duration-300 border-b border-white/20 hover:border-white/50 pb-px"
        >
          {t("errorPage.home")}
        </Link>
      </div>
    </div>
  );
}
