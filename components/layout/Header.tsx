"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAuth } from "@/components/providers/AuthProvider";
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
            ? "rotate-45 bg-plum"
            : "translate-y-[-4px] bg-chrome-light"
        }`}
      />
      <span
        className={`absolute block h-[2px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "-rotate-45 w-6 bg-plum"
            : "translate-y-[4px] w-6 bg-chrome-light"
        }`}
      />
    </div>
  );
}

function UserIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/", key: "nav.shop" },
  { href: "/custom-order", key: "nav.custom" },
  { href: "/contact", key: "nav.contact" },
  { href: "/cart", key: "nav.cart" },
] as const;

export function Header() {
  const { t } = useLanguage();
  const { totalItems } = useCart();
  const { user } = useAuth();
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
          scrolled && !mobileMenuOpen
            ? "bg-void/95 backdrop-blur-md border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <nav className="relative max-w-[1440px] mx-auto px-5 md:px-10 flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="relative group z-10" onClick={closeMenu}>
            <Image
              src="/text lexxbrush.png"
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
              className="inline-flex items-center font-[family-name:var(--font-display)] text-sm tracking-[0.1em] uppercase text-chrome-light hover:text-sage transition-colors duration-200"
            >
              {t("nav.shop")}
            </Link>
            <Link
              href="/custom-order"
              className="inline-flex items-center font-[family-name:var(--font-display)] text-sm tracking-[0.1em] uppercase text-chrome-light hover:text-sage transition-colors duration-200"
            >
              {t("nav.custom")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center font-[family-name:var(--font-display)] text-sm tracking-[0.1em] uppercase text-chrome-light hover:text-sage transition-colors duration-200"
            >
              {t("nav.contact")}
            </Link>

            <LanguageSwitcher />

            {/* Account */}
            <Link
              href={user ? "/account" : "/login"}
              className="inline-flex items-center text-chrome-light hover:text-sage transition-colors duration-200"
              aria-label="Account"
            >
              <UserIcon />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative inline-flex items-center text-chrome-light hover:text-sage transition-colors duration-200"
            >
              <BagIcon />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 text-[11px] font-extrabold text-[#8800CC] drop-shadow-[0_0_5px_rgba(136,0,204,0.7)] leading-none">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile: Account + Cart + Menu Button */}
          <div className="flex md:hidden items-center gap-5 z-10">
            <Link href={user ? "/account" : "/login"} className="text-chrome-light" onClick={closeMenu}>
              <UserIcon size={18} />
            </Link>
            
            <Link href="/cart" className="relative text-chrome-light" onClick={closeMenu}>
              <BagIcon size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 text-[11px] font-extrabold text-[#8800CC] drop-shadow-[0_0_5px_rgba(136,0,204,0.7)] leading-none">
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
          FULL-SCREEN MOBILE MENU — The Ultimate Premium Experience
      ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 lg:hidden overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Foundation: deep atmospheric dark screen */}
        <div className="absolute inset-0 bg-[#060606]" />
        
        {/* Subtle radial light to anchor the brand */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent" />
        
        {/* Brand artwork backdrop */}
        <div
          className={`absolute inset-0 pointer-events-none select-none transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] z-0 ${
            mobileMenuOpen ? "opacity-[0.12]" : "opacity-0"
          }`}
          style={{ transitionDelay: mobileMenuOpen ? "200ms" : "0ms" }}
        >
          <Image
            src="/hero-bg.jpg"
            alt=""
            fill
            className="object-cover"
            aria-hidden="true"
            priority={false}
          />
        </div>

        {/* Character art — bottom right */}
        <div
          className={`absolute bottom-0 right-0 w-[220px] pointer-events-none select-none transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] z-0 ${
            mobileMenuOpen ? "opacity-[0.13]" : "opacity-0"
          }`}
          style={{ transitionDelay: mobileMenuOpen ? "300ms" : "0ms" }}
        >
          <Image
            src="/characters/typecek3(png).webp"
            alt=""
            width={220}
            height={320}
            className="w-full h-auto object-contain"
            aria-hidden="true"
          />
        </div>

        {/* Dynamic Content Container */}
        <div className="relative h-full flex flex-col justify-between px-6 md:px-12 pt-28 pb-10">

          {/* Master Navigation Links */}
          <nav className="flex flex-col flex-1 justify-center gap-2 md:gap-4 my-8 md:mt-16">
            {NAV_LINKS.map((link, i) => (
              <div key={link.href} className="overflow-hidden">
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className={`group flex items-start gap-4 md:gap-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileMenuOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-full"
                  }`}
                  style={{
                    transitionDelay: mobileMenuOpen ? `${300 + i * 80}ms` : "0ms",
                  }}
                >
                  {/* Numbering */}
                  <span className="font-[family-name:var(--font-accent)] text-xs md:text-sm italic text-white/30 tabular-nums mt-3 md:mt-5 transition-colors duration-300 group-hover:text-sage">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* High-impact Typographic Link matching Collection Title */}
                  <span className="relative font-[family-name:var(--font-display)] text-[clamp(2.5rem,11.5vw,5.5rem)] leading-[0.95] font-extrabold tracking-normal uppercase chrome-text transition-colors duration-500 group-hover:text-sage pb-2 pt-3 pr-4 break-words">
                    {t(link.key)}
                    
                    {/* Floating Cart Indicator */}
                    {link.href === "/cart" && totalItems > 0 && (
                      <span className="absolute -top-1 -right-3 md:-right-6 text-plum text-sm md:text-lg font-bold font-sans">
                        •
                      </span>
                    )}
                  </span>
                </Link>
              </div>
            ))}
          </nav>

          {/* Premium Footer Elements */}
          <div
            className={`flex items-end justify-between border-t border-white/10 pt-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              mobileMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: mobileMenuOpen ? "600ms" : "0ms" }}
          >
            {/* Social Link */}
            <a
              href="https://www.instagram.com/lexxbrush"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2"
              aria-label="Instagram"
            >
              <span className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.2em] uppercase text-white/30 group-hover:text-white/50 transition-colors">
                Follow Us
              </span>
              <span className="font-[family-name:var(--font-body)] text-sm tracking-wide text-white group-hover:text-plum transition-colors flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 transition-all group-hover:opacity-100 group-hover:text-plum">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                lexxbrush
              </span>
            </a>

            {/* Language Switch */}
            <div className="scale-90 md:scale-100 origin-bottom-right">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
