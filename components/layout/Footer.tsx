"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
// Newsletter signup intentionally removed from the public web - the client
// doesn't want to use it. Admin tooling and the existing campaign/confirm
// API endpoints stay intact so manually managed broadcasts still work.
export function Footer() {
  const { t } = useLanguage();

  const footerBg = "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)";

  return (
    <footer className="relative border-t border-white/10 overflow-hidden" style={{ background: footerBg }}>
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10">
        {/* Main Footer */}
        <div className="py-12 md:py-16 flex flex-col items-center text-center md:text-left md:flex-row md:items-start md:justify-between gap-10 md:gap-12">
          {/* Brand + description */}
          <div className="flex-shrink-0 flex flex-col items-center md:items-start">
            <Link href="/" className="inline-block">
              <Image
                src="/text lexxbrush.png"
                alt="Lexxbrush"
                width={200}
                height={112}
                sizes="(max-width: 768px) 86px, 56px"
                className="h-16 md:h-12 w-auto object-contain mb-3 opacity-80 hover:opacity-100 transition-opacity duration-300"
              />
            </Link>
            <p className="text-chrome-light text-xs leading-relaxed max-w-[240px]">
              Hand-airbrushed wearable art.<br />
              Every piece painted entirely by hand.
            </p>
          </div>

          {/* Spacer - newsletter slot intentionally removed. Keeps the
              three-column footer rhythm without leaving a yawning empty box. */}
          <div className="flex-1 hidden md:block" aria-hidden="true" />

          {/* Nav + Social */}
          <div className="flex flex-col items-center md:items-end gap-6 md:gap-8">
            {/* Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <Link
                href="/"
                className="text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-chrome hover:text-white transition-colors duration-300"
              >
                {t("nav.shop")}
              </Link>
              <Link
                href="/custom-order"
                className="text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-chrome hover:text-white transition-colors duration-300"
              >
                {t("nav.custom")}
              </Link>
              <Link
                href="/contact"
                className="text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-chrome hover:text-white transition-colors duration-300"
              >
                {t("nav.contact")}
              </Link>
              <Link
                href="/cart"
                className="text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-chrome hover:text-white transition-colors duration-300"
              >
                {t("nav.cart")}
              </Link>
            </div>

            {/* Social - club = community */}
            <a
              href="https://www.instagram.com/lexxbrush"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 transition-all duration-300"
              aria-label="Follow Lexxbrush on Instagram"
            >
              {/* Club symbol */}
              <div
                className="relative w-9 h-9 flex-shrink-0 transition-all duration-400 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(210,210,0,0.35)] group-hover:drop-shadow-[0_0_14px_rgba(210,210,0,0.8)]"
              >
                <Image
                  src="/suits/club.webp"
                  alt=""
                  fill
                  className="object-contain"
                  sizes="36px"
                />
              </div>

              {/* Text stack */}
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-[family-name:var(--font-display)] text-[9px] tracking-[0.28em] uppercase text-white/30 group-hover:text-white/60 transition-colors duration-300">
                  Join the Club
                </span>
                <span className="font-[family-name:var(--font-display)] text-xs tracking-[0.15em] uppercase text-white/70 group-hover:text-white transition-colors duration-300">
                  @lexxbrush
                </span>
              </div>

              {/* Arrow */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/20 group-hover:text-white/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ml-0.5 flex-shrink-0"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-white/5 py-4 flex flex-wrap justify-center gap-4 md:gap-6">
          <Link href="/terms" className="text-[10px] font-[family-name:var(--font-display)] tracking-[0.12em] uppercase text-chrome hover:text-white transition-colors duration-300">
            {t("footer.terms")}
          </Link>
          <Link href="/privacy" className="text-[10px] font-[family-name:var(--font-display)] tracking-[0.12em] uppercase text-chrome hover:text-white transition-colors duration-300">
            {t("footer.privacy")}
          </Link>
          <Link href="/shipping" className="text-[10px] font-[family-name:var(--font-display)] tracking-[0.12em] uppercase text-chrome hover:text-white transition-colors duration-300">
            {t("footer.shipping")}
          </Link>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 py-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-3">
          <p className="text-[10px] text-chrome tracking-wider">
            &copy; {new Date().getFullYear()} Lexxbrush. {t("footer.rights")}
          </p>
          <p className="text-[10px] text-chrome tracking-wider">
            {t("footer.madeBy")}{" "}
            <a
              href="https://filiphegedus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-accent)] text-xs text-chrome hover:text-[#7C3AED] transition-colors duration-300"
            >
              Filip Hegedűs
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
