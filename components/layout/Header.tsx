"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart, type CartItem } from "@/components/providers/CartProvider";
import { useFavorites } from "@/components/providers/FavoritesProvider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import type { Product } from "@/lib/products";

// ─── Cart Hand ────────────────────────────────────────────────────────────────

type SuitKey = "diamond" | "heart" | "club" | "spade";

const SUIT_SRC: Record<SuitKey, string> = {
  diamond: "/suits/diamond.webp",
  heart:   "/suits/heart.webp",
  club:    "/suits/club.webp",
  spade:   "/suits/spade.webp",
};

/** Coloured drop-shadow for each suit */
const SUIT_GLOW: Record<SuitKey, string> = {
  diamond: "drop-shadow(0 0 5px rgba(0,220,255,0.85))",
  heart:   "drop-shadow(0 0 5px rgba(136,0,204,0.85))",
  club:    "drop-shadow(0 0 5px rgba(210,210,0,0.8))",
  spade:   "drop-shadow(0 0 5px rgba(30,80,255,0.85))",
};

/** Pre-calculated fan positions — { x offset px, rotation deg } — per slot */
const FAN_POS: Record<number, Array<{ x: number; rot: number }>> = {
  1: [{ x:   0, rot:   0 }],
  2: [{ x:  -8, rot: -16 }, { x:  8, rot:  16 }],
  3: [{ x: -13, rot: -20 }, { x: 0, rot:   0 }, { x: 13, rot:  20 }],
  4: [{ x: -18, rot: -24 }, { x: -6, rot: -8 }, { x: 6, rot:   8 }, { x: 18, rot:  24 }],
};

const SUIT_PRIORITY: SuitKey[] = ["diamond", "heart", "club", "spade"];

function getSuit(product: Product, isFav: boolean): SuitKey {
  if (product.isOneOfAKind) return "diamond";
  if (isFav)                return "heart";
  if (product.isSold)       return "spade";
  return "club";
}

/**
 * Derives which suits to render for the current cart:
 * - 0 items  → ghost deck (all 4 at low opacity)
 * - 1–3      → actual product suits, deduplicated, filled to match count
 * - 4+       → full hand (all 4 suits, regardless of products)
 */
function resolveHand(
  items: CartItem[],
  isFavorite: (id: string) => boolean,
): { suits: SuitKey[]; ghost: boolean } {
  if (items.length === 0) {
    return { suits: [...SUIT_PRIORITY], ghost: true };
  }
  if (items.length >= 4) {
    return { suits: [...SUIT_PRIORITY], ghost: false };
  }

  const seen = new Set<SuitKey>();
  const suits: SuitKey[] = [];

  for (const item of items) {
    const s = getSuit(item.product, isFavorite(item.product.id));
    if (!seen.has(s)) { seen.add(s); suits.push(s); }
  }
  // Fill to items.length with any unseen suit (maintains visual card count)
  for (const s of SUIT_PRIORITY) {
    if (suits.length >= items.length) break;
    if (!seen.has(s)) { seen.add(s); suits.push(s); }
  }

  return { suits, ghost: false };
}

function CartHand({
  items,
  isFavorite,
  size = 20,
}: {
  items: CartItem[];
  isFavorite: (id: string) => boolean;
  size?: number;
}) {
  const { suits, ghost } = resolveHand(items, isFavorite);
  const N     = suits.length;
  const fan   = FAN_POS[Math.min(N, 4)];
  // Container wide enough for the widest spread (4 cards × 18px offset + card width)
  const W     = size + 36;
  const H     = size + 4;

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: W, height: H }}
      aria-hidden="true"
    >
      {suits.map((suit, i) => {
        const { x, rot } = fan[i] ?? { x: 0, rot: 0 };
        return (
          <div
            key={`${suit}-${i}`}
            className="absolute"
            style={{
              width:           size,
              height:          size,
              left:            "50%",
              bottom:          0,
              marginLeft:      -(size / 2),
              transform:       `translateX(${x}px) rotate(${rot}deg)`,
              transformOrigin: "bottom center",
              zIndex:          i + 1,
              opacity:         ghost ? 0.55 : 1,
              filter:          ghost
                ? "grayscale(0.5) brightness(1.15) drop-shadow(0 0 4px rgba(255,255,255,0.35))"
                : SUIT_GLOW[suit],
              transition:           "all 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
              animationName:        ghost ? "cart-ghost-breathe" : "none",
              animationDuration:    ghost ? "3.2s" : "0s",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: ghost ? "infinite" : 1,
              animationDelay:       ghost ? `${i * 200}ms` : "0ms",
            }}
          >
            <Image
              src={SUIT_SRC[suit]}
              alt=""
              fill
              className="object-contain"
              sizes={`${size}px`}
            />
          </div>
        );
      })}
    </div>
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
  const { items, totalItems } = useCart();
  const { isFavorite } = useFavorites();
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
            ? "bg-void/60 backdrop-blur-md border-b border-white/5"
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
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="py-2 px-1 font-[family-name:var(--font-display)] text-sm tracking-[0.1em] uppercase text-chrome-light hover:text-sage transition-colors duration-200"
            >
              {t("nav.shop")}
            </Link>
            <Link
              href="/custom-order"
              className="py-2 px-1 font-[family-name:var(--font-display)] text-sm tracking-[0.1em] uppercase text-chrome-light hover:text-sage transition-colors duration-200"
            >
              {t("nav.custom")}
            </Link>
            <Link
              href="/contact"
              className="py-2 px-1 font-[family-name:var(--font-display)] text-sm tracking-[0.1em] uppercase text-chrome-light hover:text-sage transition-colors duration-200"
            >
              {t("nav.contact")}
            </Link>

            <LanguageSwitcher />

            {/* Account */}
            <Link
              href={user ? "/account" : "/login"}
              className="flex items-center justify-center w-9 h-9 text-chrome-light hover:text-sage transition-colors duration-200"
              aria-label="Account"
            >
              <UserIcon />
            </Link>

            {/* Cart — hand of cards */}
            <Link
              href="/cart"
              className="flex items-center justify-center h-9 transition-opacity duration-200 hover:opacity-75"
              aria-label={`Cart · ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            >
              <CartHand items={items} isFavorite={isFavorite} size={20} />
            </Link>
          </div>

          {/* Mobile: Account + Cart + Menu Button */}
          <div className="flex md:hidden items-center gap-5 z-10">
            <Link href={user ? "/account" : "/login"} className="text-chrome-light" onClick={closeMenu}>
              <UserIcon size={18} />
            </Link>
            
            {/* Cart — hand of cards (mobile) */}
            <Link
              href="/cart"
              className="flex items-center justify-center transition-opacity duration-200 hover:opacity-75"
              onClick={closeMenu}
              aria-label={`Cart · ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            >
              <CartHand items={items} isFavorite={isFavorite} size={18} />
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

        {/* Character art — full right panel */}
        <div
          className={`absolute top-0 right-0 w-[65%] h-full pointer-events-none select-none transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] z-0 ${
            mobileMenuOpen ? "opacity-[0.18]" : "opacity-0"
          }`}
          style={{ transitionDelay: mobileMenuOpen ? "250ms" : "0ms" }}
        >
          <Image
            src="/characters/typecek3(png).webp"
            alt=""
            fill
            className="object-contain object-top"
            aria-hidden="true"
          />
        </div>

        {/* Dynamic Content Container */}
        <div className="relative h-full flex flex-col justify-between px-6 md:px-12 pt-28 pb-10 overflow-hidden">

          {/* Master Navigation Links */}
          <nav className="flex flex-col flex-1 justify-center gap-2 md:gap-4 my-8 md:mt-16">
            {NAV_LINKS.map((link, i) => (
              <div key={link.href} className="overflow-hidden">
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className={`group flex items-start gap-4 md:gap-6 min-w-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
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
                  <span className="relative font-[family-name:var(--font-display)] text-[clamp(2rem,9vw,5.5rem)] leading-[0.95] font-extrabold tracking-normal uppercase chrome-text transition-colors duration-500 group-hover:text-sage pb-2 pt-3 min-w-0 block overflow-visible">
                    {t(link.key)}

                    {/* Cart hand floats beside the CART label */}
                    {link.href === "/cart" && (
                      <span className="absolute -right-14 top-1/2 -translate-y-1/2 pointer-events-none">
                        <CartHand items={items} isFavorite={isFavorite} size={16} />
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
