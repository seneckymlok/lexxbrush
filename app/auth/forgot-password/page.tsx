"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

// Where the recovery link lands. Canonical origin so the reset page is always
// the production one, never the localhost the request happened to come from.
function resetRedirect(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
  return `${base}/auth/reset-password`;
}

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendReset = useCallback(async () => {
    setError(null);
    // resetPasswordForEmail always resolves without revealing whether the
    // address exists - we surface the same "check your inbox" either way so we
    // never leak which emails are registered.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirect(),
    });
  }, [email]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      setError(t("auth.fillAllFields"));
      return;
    }
    setLoading(true);
    await sendReset();
    setSent(true);
    setCooldown(60);
    setLoading(false);
  };

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    setCooldown(60);
    await sendReset();
  }, [cooldown, sendReset]);

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
        <div className="relative z-10 w-full max-w-[420px] text-center">
          <div className="w-14 h-14 mx-auto mb-8 rounded-full border border-white/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-[2rem] font-bold uppercase tracking-[0.08em] text-white mb-3">
            {t("auth.checkInbox")}
          </h1>

          <p className="text-white/30 text-sm leading-relaxed mb-1">
            {t("auth.forgot.sentTo")}
          </p>
          <p className="text-white/60 text-sm font-medium mb-8 break-all font-mono">
            {email}
          </p>

          <div className="mb-8">
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-xs text-white/40 hover:text-white/70 disabled:text-white/15 transition-colors duration-300 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? (
                <span className="font-mono text-[11px]">{t("auth.resendIn")} {cooldown}s</span>
              ) : (
                <span className="border-b border-white/20 pb-px">{t("auth.forgot.resend")}</span>
              )}
            </button>
          </div>

          <div className="w-full h-[1px] bg-white/[0.06] mb-8" />

          <Link
            href="/login"
            className="text-sm text-white/50 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300"
          >
            {t("auth.backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Subtle character art - matches the login side */}
      <div className="absolute right-0 top-20 opacity-[0.03] pointer-events-none select-none">
        <Image
          src="/characters/typecek1(png).webp"
          alt=""
          width={400}
          height={400}
          className="invert brightness-150"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-4 text-center md:text-left">
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text">
            {t("auth.forgot.title")}
          </h1>
          <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-3 mx-auto md:mx-0" />
        </div>

        <p className="text-white/30 text-sm leading-relaxed mb-10 text-center md:text-left">
          {t("auth.forgot.body")}
        </p>

        {error && <p className="text-red-400/80 text-sm mb-8">{error}</p>}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="relative">
            <label
              className={`absolute left-0 transition-all duration-300 pointer-events-none font-[family-name:var(--font-display)] tracking-[0.15em] uppercase ${
                focused || email
                  ? "text-[10px] -top-5 text-chrome"
                  : "text-xs top-3 text-white/25"
              }`}
            >
              {t("auth.email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full bg-transparent border-b border-white/10 focus:border-white/40 px-0 py-3 text-white text-sm focus:outline-none transition-all duration-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 btn-brand font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] uppercase rounded-full disabled:opacity-50"
          >
            {loading ? t("auth.forgot.sending") : t("auth.forgot.cta")}
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
          <span className="text-[10px] text-white/20 font-[family-name:var(--font-display)] tracking-[0.2em] uppercase">or</span>
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
        </div>

        <p className="text-center text-sm text-white/40">
          <Link href="/login" className="text-white/70 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
