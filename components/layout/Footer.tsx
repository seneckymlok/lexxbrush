"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-void border-t border-white/5 overflow-hidden">
      {/* Character art bleeding from right */}
      <Image
        src="/characters/typecek1(png).webp"
        alt=""
        aria-hidden="true"
        width={640}
        height={854}
        loading="lazy"
        sizes="200px"
        className="hidden lg:block absolute right-[-40px] top-1/2 -translate-y-1/2 w-[200px] opacity-[0.06] pointer-events-none select-none"
        style={{ filter: "brightness(1.3) contrast(1.2)" }}
      />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10">
        {/* Main Footer */}
        <div className="py-12 md:py-16 flex flex-col items-center text-center md:text-left md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand + description */}
          <div className="flex-shrink-0 flex flex-col items-center md:items-start">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Lexxbrush"
                width={200}
                height={112}
                sizes="(max-width: 768px) 86px, 56px"
                className="h-16 md:h-12 w-auto object-contain mb-3 opacity-80 hover:opacity-100 transition-opacity duration-300"
              />
            </Link>
            <p className="text-text-dim text-xs leading-relaxed max-w-[240px]">
              Hand-airbrushed wearable art.<br />
              Every piece painted entirely by hand.
            </p>
          </div>

          {/* Nav + Social */}
          <div className="flex flex-col items-center md:items-end gap-6 md:gap-8">
            {/* Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <Link
                href="/"
                className="text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-text-dim hover:text-plum transition-colors duration-300"
              >
                {t("nav.shop")}
              </Link>
              <Link
                href="/custom-order"
                className="text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-text-dim hover:text-plum transition-colors duration-300"
              >
                {t("nav.custom")}
              </Link>
              <Link
                href="/contact"
                className="text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-text-dim hover:text-plum transition-colors duration-300"
              >
                {t("nav.contact")}
              </Link>
              <Link
                href="/cart"
                className="text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-text-dim hover:text-plum transition-colors duration-300"
              >
                {t("nav.cart")}
              </Link>
            </div>

            {/* Social */}
            <a
              href="https://www.instagram.com/lexxbrush"
              target="_blank"
              rel="noopener noreferrer"
              className="ig-hover inline-flex items-center gap-2 text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-text-dim transition-colors duration-300 group"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              {t("footer.instagram")}
            </a>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-white/5 py-4 flex flex-wrap justify-center gap-4 md:gap-6">
          <Link href="/terms" className="text-[10px] font-[family-name:var(--font-display)] tracking-[0.12em] uppercase text-text-dim hover:text-chrome transition-colors duration-300">
            {t("footer.terms")}
          </Link>
          <Link href="/privacy" className="text-[10px] font-[family-name:var(--font-display)] tracking-[0.12em] uppercase text-text-dim hover:text-chrome transition-colors duration-300">
            {t("footer.privacy")}
          </Link>
          <Link href="/shipping" className="text-[10px] font-[family-name:var(--font-display)] tracking-[0.12em] uppercase text-text-dim hover:text-chrome transition-colors duration-300">
            {t("footer.shipping")}
          </Link>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 py-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-3">
          <p className="text-[10px] text-text-dim tracking-wider">
            &copy; {new Date().getFullYear()} Lexxbrush. {t("footer.rights")}
          </p>
          <p className="text-[10px] text-text-dim tracking-wider">
            {t("footer.madeBy")}{" "}
            <a
              href="https://nexystech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-accent)] text-xs text-chrome hover:text-[#7C3AED] transition-colors duration-300"
            >
              NexysTech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
