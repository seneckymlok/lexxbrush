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

      {/* ═══════════════════════════════════════════════════════════════
          FULL-SCREEN MOBILE MENU — Immersive Streetwear Experience
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-void/[0.97] backdrop-blur-xl" />

        {/* Ghost character art — right side */}
        <div
          className={`absolute right-[-20px] top-[15%] w-[200px] h-[280px] transition-all duration-700 delay-200 ${
            mobileMenuOpen ? "opacity-[0.04] translate-x-0" : "opacity-0 translate-x-10"
          }`}
        >
          <Image
            src="/characters/typecek2(png).webp"
            alt=""
            aria-hidden="true"
            width={200}
            height={280}
            className="w-full h-auto"
            style={{ filter: "invert(1) brightness(1.5)" }}
          />
        </div>

        {/* Content container */}
        <div className="relative h-full flex flex-col justify-center px-8">
          {/* Main navigation links — oversized */}
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`group relative block transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  mobileMenuOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDuration: "600ms",
                  transitionDelay: mobileMenuOpen ? `${150 + i * 80}ms` : "0ms",
                }}
              >
                {/* Link text */}
                <span className="font-[family-name:var(--font-display)] text-[clamp(3rem,12vw,5rem)] leading-[0.9] tracking-[0.02em] uppercase text-chrome-bright group-hover:text-white group-active:text-white transition-colors duration-300">
                  {t(link.key)}
                  {/* Cart badge inline */}
                  {link.href === "/cart" && totalItems > 0 && (
                    <span className="inline-flex items-center justify-center ml-3 w-8 h-8 bg-pink text-void text-sm font-bold rounded-full align-middle shadow-[0_0_20px_rgba(255,105,180,0.3)]">
                      {totalItems}
                    </span>
                  )}
                </span>

                {/* Spray-paint accent line */}
                <div
                  className={`mt-1 h-[3px] rounded-full transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileMenuOpen
                      ? "w-full opacity-100"
                      : "w-0 opacity-0"
                  }`}
                  style={{
                    background: i === 0
                      ? "linear-gradient(90deg, #FF69B4 0%, rgba(255,105,180,0) 70%)"
                      : i === 1
                        ? "linear-gradient(90deg, #7B2FBE 0%, rgba(123,47,190,0) 70%)"
                        : "linear-gradient(90deg, #39FF14 0%, rgba(57,255,20,0) 70%)",
                    transitionDuration: "800ms",
                    transitionDelay: mobileMenuOpen ? `${350 + i * 80}ms` : "0ms",
                  }}
                />
              </Link>
            ))}
          </nav>

          {/* Bottom section — Instagram + Language */}
          <div
            className={`mt-16 flex items-center justify-between transition-all duration-500 ${
              mobileMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: mobileMenuOpen ? "500ms" : "0ms" }}
          >
            {/* Instagram */}
            <a
              href="https://www.instagram.com/lexxbrush"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-chrome hover:text-pink transition-colors duration-300 group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform duration-300">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              <span className="font-[family-name:var(--font-display)] text-xs tracking-[0.2em] uppercase">Instagram</span>
            </a>

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>

          {/* Spray dots — atmospheric detail */}
          <div className="spray-dot absolute top-[18%] left-[15%] opacity-30" />
          <div className="spray-dot absolute bottom-[22%] right-[20%] opacity-20 bg-violet w-[3px] h-[3px]" />
          <div className="spray-dot absolute top-[45%] right-[8%] opacity-15 bg-lime w-[2px] h-[2px]" />
          <div className="spray-dot absolute bottom-[35%] left-[25%] opacity-10 bg-amber w-[3px] h-[3px]" />
        </div>
      </div>
    </>
  );
}
