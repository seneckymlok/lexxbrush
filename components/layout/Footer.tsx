"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-void border-t border-white/5 mt-24">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        {/* Main Footer */}
        <div className="py-16 md:py-20 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <img
              src="/logo.png"
              alt="Lexxbrush"
              className="h-8 w-auto object-contain mb-4 opacity-80"
            />
            <p className="text-text-dim text-sm leading-relaxed max-w-xs">
              Hand-airbrushed wearable art. Every piece is a unique creation
              painted by hand in Prague.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-1">
            <h4 className="font-[family-name:var(--font-display)] text-xs font-bold tracking-[0.2em] uppercase text-chrome mb-6">
              Navigate
            </h4>
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="text-sm text-text-dim hover:text-white transition-colors duration-300"
              >
                {t("nav.shop")}
              </Link>
              <Link
                href="/custom-order"
                className="text-sm text-text-dim hover:text-white transition-colors duration-300"
              >
                {t("nav.custom")}
              </Link>
              <Link
                href="/cart"
                className="text-sm text-text-dim hover:text-white transition-colors duration-300"
              >
                {t("nav.cart")}
              </Link>
            </div>
          </div>

          {/* Social */}
          <div className="md:col-span-1">
            <h4 className="font-[family-name:var(--font-display)] text-xs font-bold tracking-[0.2em] uppercase text-chrome mb-6">
              {t("footer.followUs")}
            </h4>
            <a
              href="https://www.instagram.com/lexxbrush"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-text-dim hover:text-pink transition-colors duration-300"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              {t("footer.instagram")}
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-dim">
            &copy; {new Date().getFullYear()} Lexxbrush. {t("footer.rights")}
          </p>
          <p className="text-xs text-text-dim">
            {t("footer.madeBy")}{" "}
            <a
              href="https://nexystech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-accent)] text-sm text-chrome hover:text-[#7C3AED] transition-colors duration-300"
            >
              NexysTech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
