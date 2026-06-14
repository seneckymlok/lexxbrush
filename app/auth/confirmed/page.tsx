"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useAuth } from "@/components/providers/AuthProvider";

// useSearchParams requires a Suspense boundary above it during prerender in
// Next 16 - mirror the checkout page's thin-wrapper pattern.
export default function AuthConfirmedPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmedInner />
    </Suspense>
  );
}

function AuthConfirmedInner() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const params = useSearchParams();
  const isError = params.get("status") === "error";

  if (isError) {
    return (
      <Shell>
        {/* Spade = the "settled / something went sideways" suit */}
        <Glyph src="/suits/spade.webp" glow="rgba(50,100,255,0.5)" muted />
        <Eyebrow>{t("auth.confirmed.errorEyebrow")}</Eyebrow>
        <Title>{t("auth.confirmed.errorTitle")}</Title>
        <Rule />
        <Body>{t("auth.confirmed.errorBody")}</Body>
        <Actions>
          <PrimaryLink href="/register">{t("auth.confirmed.errorCta")}</PrimaryLink>
          <GhostLink href="/login">{t("auth.backToLogin")}</GhostLink>
        </Actions>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Four-suit fan - the same motif that opens the confirmation email,
          carried onto the site so the journey feels like one continuous moment. */}
      <SuitFan />
      <Eyebrow>{t("auth.confirmed.eyebrow")}</Eyebrow>
      <Title>{t("auth.confirmed.title")}</Title>
      <Rule />
      <Body>{t("auth.confirmed.body")}</Body>
      <Actions>
        {user ? (
          <PrimaryLink href="/account">{t("auth.confirmed.toAccount")}</PrimaryLink>
        ) : (
          <PrimaryLink href="/login">{t("auth.confirmed.signIn")}</PrimaryLink>
        )}
        <GhostLink href="/">{t("auth.confirmed.browse")}</GhostLink>
      </Actions>
    </Shell>
  );
}

// ─── Presentational pieces ───────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter min-h-screen flex items-center justify-center px-6 pt-24 pb-24">
      <div className="max-w-md w-full text-center">{children}</div>
    </div>
  );
}

function SuitFan() {
  const suits = [
    { src: "/suits/heart.webp", glow: "rgba(136,0,204,0.65)", rot: "-12deg", z: 10 },
    { src: "/suits/diamond.webp", glow: "rgba(0,221,238,0.6)", rot: "-4deg", z: 20 },
    { src: "/suits/club.webp", glow: "rgba(210,210,0,0.55)", rot: "4deg", z: 20 },
    { src: "/suits/spade.webp", glow: "rgba(50,100,255,0.6)", rot: "12deg", z: 10 },
  ];
  return (
    <div className="flex items-end justify-center gap-1 mb-9 auth-suit-fan">
      {suits.map((s, i) => (
        <div
          key={i}
          className="relative w-11 h-11 md:w-12 md:h-12"
          style={{
            transform: `rotate(${s.rot})`,
            zIndex: s.z,
            filter: `drop-shadow(0 0 16px ${s.glow})`,
            animation: `auth-suit-rise 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 90}ms both`,
          }}
        >
          <Image src={s.src} alt="" fill className="object-contain" sizes="48px" />
        </div>
      ))}
      <style jsx>{`
        @keyframes auth-suit-rise {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.8) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}

function Glyph({ src, glow, muted }: { src: string; glow: string; muted?: boolean }) {
  return (
    <div
      className={`relative w-16 h-16 mx-auto mb-8 ${muted ? "opacity-80" : ""}`}
      style={{ filter: `drop-shadow(0 0 24px ${glow})` }}
    >
      <Image src={src} alt="" fill className="object-contain" sizes="64px" />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">
      {children}
    </p>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,8vw,2.5rem)] md:text-4xl font-extrabold tracking-tight uppercase chrome-text mb-4">
      {children}
    </h1>
  );
}

function Rule() {
  return <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-6" />;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="text-chrome text-sm leading-relaxed mb-10">{children}</p>;
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-5">{children}</div>;
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center min-w-[220px] px-10 py-4 btn-brand font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] uppercase rounded-full"
    >
      {children}
    </Link>
  );
}

function GhostLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300 font-[family-name:var(--font-display)] tracking-[0.1em] uppercase"
    >
      {children}
    </Link>
  );
}
