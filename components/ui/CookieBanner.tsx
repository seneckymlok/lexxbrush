"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

const STORAGE_KEY = "lexxbrush:cookies-ack";

export function CookieBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Defer one frame so the page paints before the banner slides in.
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
      }
    } catch {
      // localStorage blocked (private mode etc.) - skip the banner.
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookies.aria")}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[100] rounded-2xl bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-5 text-sm text-white/80"
      style={{ animation: "fadeIn 0.4s ease-out" }}
    >
      <p className="leading-relaxed">
        {t("cookies.body")}{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-2 text-white hover:text-sage transition-colors"
        >
          {t("cookies.learnMore")}
        </Link>
      </p>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={dismiss}
          className="px-5 py-2 rounded-full bg-white text-black text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase hover:bg-white/90 transition-colors cursor-pointer"
        >
          {t("cookies.ok")}
        </button>
      </div>
    </div>
  );
}
