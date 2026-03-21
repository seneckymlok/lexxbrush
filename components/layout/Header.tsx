"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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

/** Animated hamburger icon → X with spray-paint aesthetic */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <span
        className={`absolute block h-[2px] w-6 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "rotate-45 bg-pink"
            : "translate-y-[-4px] bg-chrome-light"
        }`}
      />
      <span
        className={`absolute block h-[2px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "-rotate-45 w-6 bg-pink"
            : "translate-y-[4px] w-4 bg-chrome-light"
        }`}
      />
    </div>
  );
}

const NAV_LINKS = [
  { href: "/", key: "nav.shop" },
  { href: "/custom-order", key: "nav.custom" },
  { href: "/cart", key: "nav.cart" },
] as const;

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || mobileMenuOpen
            ? "bg-void/95 backdrop-blur-md border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <nav className="relative max-w-[1440px] mx-auto px-5 md:px-10 flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="relative group z-10" onClick={closeMenu}>
            <Image
              src="/logo.png"
              alt="Lexxbrush"
              width={200}
              height={112}
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 100px, 120px"
              className="h-9 md:h-11 w-auto object-contain transition-all duration-300 group-hover:brightness-125"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-light hover:text-cyan transition-colors duration-200"
            >
              {t("nav.shop")}
            </Link>
            <Link
              href="/custom-order"
              className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-light hover:text-cyan transition-colors duration-200"
            >
              {t("nav.custom")}
            </Link>

            <LanguageSwitcher />

            {/* Cart */}
            <Link
              href="/cart"
              className="relative text-chrome-light hover:text-cyan transition-colors duration-200"
            >
              <BagIcon />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-pink text-void text-[9px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile: Cart + Menu Button */}
          <div className="flex md:hidden items-center gap-5 z-10">
            <Link href="/cart" className="relative text-chrome-light" onClick={closeMenu}>
              <BagIcon size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-pink text-void text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>
          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          FULL-SCREEN MOBILE MENU — Editorial Catalog Style
      ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Background — pure black, no blur */}
        <div className="absolute inset-0 bg-void/[0.98]" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between px-8 pt-20 pb-10">

          {/* Tagline */}
          <div
            className={`transition-all duration-500 ${
              mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
            style={{ transitionDelay: mobileMenuOpen ? "100ms" : "0ms" }}
          >
            <p className="font-[family-name:var(--font-accent)] text-sm italic text-chrome tracking-wide">
              Hand-airbrushed wearable art
            </p>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col -my-2">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`group block transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  mobileMenuOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                }`}
                style={{
                  transitionDuration: "600ms",
                  transitionDelay: mobileMenuOpen ? `${180 + i * 70}ms` : "0ms",
                }}
              >
                {/* Top rule */}
                <div className="w-full h-[1px] bg-white/[0.06]" />

                <div className="py-5 flex items-baseline gap-4">
                  {/* Number */}
                  <span className="font-[family-name:var(--font-accent)] text-sm italic text-chrome tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Link text */}
                  <span className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,9vw,3.5rem)] leading-[1] tracking-[0.02em] uppercase text-chrome-bright group-active:text-white transition-colors duration-200">
                    {t(link.key)}
                  </span>

                  {/* Cart count */}
                  {link.href === "/cart" && totalItems > 0 && (
                    <span className="font-[family-name:var(--font-accent)] text-sm italic text-pink">
                      {totalItems}
                    </span>
                  )}
                </div>

                {/* Bottom rule on last item */}
                {i === NAV_LINKS.length - 1 && (
                  <div className="w-full h-[1px] bg-white/[0.06]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Footer — Instagram + Language */}
          <div
            className={`flex items-center justify-between transition-all duration-500 ${
              mobileMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: mobileMenuOpen ? "450ms" : "0ms" }}
          >
            <a
              href="https://www.instagram.com/lexxbrush"
              target="_blank"
              rel="noopener noreferrer"
              className="text-chrome hover:text-white transition-colors duration-300"
              aria-label="Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </a>

            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}
