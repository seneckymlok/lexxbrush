"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useCart } from "@/components/providers/CartProvider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

/** Shopping bag with a subtle paint drip — recognizable but branded */
function BagIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Bag body — soft trapezoid shape */}
      <path d="M5 7h14l-1.5 13a1 1 0 01-1 .9H7.5a1 1 0 01-1-.9L5 7z" />
      {/* Handles */}
      <path d="M9 7V5a3 3 0 016 0v2" />
      {/* Paint drip off bottom-right corner */}
      <path d="M15.5 20.9c0 .6.3 1.4.7 1.8" strokeWidth="1.3" />
    </svg>
  );
}

/** Two-line menu icon → X */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col gap-[5px] w-5">
      <span
        className={`block h-[1.5px] bg-chrome-light transition-all duration-200 origin-center ${
          open ? "rotate-45 translate-y-[3.25px]" : ""
        }`}
      />
      <span
        className={`block h-[1.5px] bg-chrome-light transition-all duration-200 origin-center ${
          open ? "-rotate-45 -translate-y-[3.25px]" : ""
        }`}
      />
    </div>
  );
}

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
        scrolled || mobileMenuOpen
          ? "bg-void/95 backdrop-blur-md border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <nav className="relative max-w-[1440px] mx-auto px-5 md:px-10 flex items-center justify-between h-14 md:h-16">
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
            <BagIcon />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-pink text-void text-[9px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile: Centered Language Switcher */}
        <div className="md:hidden absolute left-1/2 -translate-x-1/2">
          <LanguageSwitcher />
        </div>

        {/* Mobile: Cart + Menu */}
        <div className="flex md:hidden items-center gap-5">
          <Link href="/cart" className="relative text-chrome-light">
            <BagIcon size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-pink text-void text-[9px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-0.5"
            aria-label="Toggle menu"
          >
            <MenuIcon open={mobileMenuOpen} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-6 pt-2 border-t border-white/5 flex flex-col gap-5">
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
        </div>
      </div>
    </header>
  );
}
