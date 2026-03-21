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
            <Link
              href="/contact"
              className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-light hover:text-cyan transition-colors duration-200"
            >
              {t("nav.contact")}
            </Link>

            <LanguageSwitcher />

            {/* Account */}
            <Link
              href={user ? "/account" : "/login"}
              className="text-chrome-light hover:text-cyan transition-colors duration-200"
              aria-label="Account"
            >
              <UserIcon />
            </Link>

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

          {/* Mobile: Account + Cart + Menu Button */}
          <div className="flex md:hidden items-center gap-5 z-10">
            <Link href={user ? "/account" : "/login"} className="text-chrome-light" onClick={closeMenu}>
              <UserIcon size={18} />
            </Link>
            
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
          FULL-SCREEN MOBILE MENU — The Ultimate Premium Experience
      ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 lg:hidden overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Foundation: solid opaque black */}
        <div className="absolute inset-0 bg-[#050505] backdrop-blur-3xl" />
        
        {/* Texture: subtle noise injected */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay" />

        {/* Ambient light orbs for depth — scale and fade in on open */}
        <div 
          className={`absolute -top-[20%] -right-[20%] w-[60%] h-[60%] bg-pink/20 blur-[120px] rounded-full mix-blend-screen transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${mobileMenuOpen ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} 
          style={{ transitionDelay: mobileMenuOpen ? "100ms" : "0ms" }}
        />
        <div 
          className={`absolute -bottom-[20%] -left-[20%] w-[60%] h-[60%] bg-cyan/20 blur-[120px] rounded-full mix-blend-screen transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${mobileMenuOpen ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} 
          style={{ transitionDelay: mobileMenuOpen ? "200ms" : "0ms" }}
        />

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
                  <span className="font-[family-name:var(--font-accent)] text-xs md:text-sm italic text-white/30 tabular-nums mt-3 md:mt-5 transition-colors duration-300 group-hover:text-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* High-impact Typographic Link */}
                  <span className="relative font-[family-name:var(--font-display)] text-[clamp(2.5rem,11.5vw,5.5rem)] leading-[0.95] font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 transition-all duration-500 group-hover:from-cyan group-hover:to-pink pb-2 pr-4 break-words">
                    {t(link.key)}
                    
                    {/* Floating Cart Indicator */}
                    {link.href === "/cart" && totalItems > 0 && (
                      <span className="absolute -top-1 -right-3 md:-right-6 text-pink text-sm md:text-lg font-bold font-sans">
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
              <span className="font-[family-name:var(--font-body)] text-sm tracking-wide text-white group-hover:text-pink transition-colors flex items-center gap-2">
                @lexxbrush
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
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
