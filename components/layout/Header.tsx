"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function Header() {
  const { t } = useLanguage();
  const { totalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-void/95 backdrop-blur-md border-b border-white/5"
          : "bg-void/70 backdrop-blur-sm"
      }`}
    >
      <nav className="max-w-[1440px] mx-auto px-5 md:px-10 flex items-center justify-between h-14 md:h-16">
        {/* Logo */}
        <Link href="/" className="relative group">
          <img
            src="/logo.png"
            alt="Lexxbrush"
            className="h-7 md:h-8 w-auto object-contain transition-all duration-300 group-hover:brightness-125"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-light hover:text-white transition-colors duration-200"
          >
            {t("nav.shop")}
          </Link>
          <Link
            href="/custom-order"
            className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-light hover:text-white transition-colors duration-200"
          >
            {t("nav.custom")}
          </Link>

          <LanguageSwitcher />

          {/* Cart */}
          <Link
            href="/cart"
            className="relative text-chrome-light hover:text-white transition-colors duration-200"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-pink text-void text-[9px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile: Cart + Hamburger */}
        <div className="flex md:hidden items-center gap-5">
          <Link href="/cart" className="relative text-chrome-light">
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
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-pink text-void text-[9px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col gap-[5px] w-5"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-[1.5px] bg-chrome-light transition-all duration-200 origin-center ${
                mobileMenuOpen ? "rotate-45 translate-y-[3.25px]" : ""
              }`}
            />
            <span
              className={`block h-[1.5px] bg-chrome-light transition-all duration-200 origin-center ${
                mobileMenuOpen ? "-rotate-45 -translate-y-[3.25px]" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-6 pt-2 bg-void/95 backdrop-blur-md border-t border-white/5 flex flex-col gap-5">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="font-[family-name:var(--font-display)] text-base tracking-[0.2em] uppercase text-chrome-light hover:text-white transition-colors"
          >
            {t("nav.shop")}
          </Link>
          <Link
            href="/custom-order"
            onClick={() => setMobileMenuOpen(false)}
            className="font-[family-name:var(--font-display)] text-base tracking-[0.2em] uppercase text-chrome-light hover:text-white transition-colors"
          >
            {t("nav.custom")}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
