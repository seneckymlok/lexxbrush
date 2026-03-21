"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsUnconfirmed(false);
    setResendSuccess(false);

    if (!e.currentTarget.checkValidity()) {
      setError(t("auth.fillAllFields") || "Please fill out all required fields correctly.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setIsUnconfirmed(true);
        setError(null);
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      router.push("/account");
    }
  };

  const handleResendConfirmation = useCallback(async () => {
    if (cooldown > 0 || !email) return;
    setCooldown(60);
    setResendSuccess(false);

    await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });

    setResendSuccess(true);
  }, [cooldown, email]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background texture */}
      <div className="absolute inset-0 concrete-bg" />

      {/* Subtle character art */}
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
        {/* Title — minimal editorial */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-[family-name:var(--font-display)] text-[2.5rem] leading-[1] font-bold uppercase tracking-[0.08em] text-white">
            {t("auth.login")}
          </h1>
        </div>

        {/* Email not confirmed */}
        {isUnconfirmed && (
          <div className="mb-8">
            <p className="text-amber-400/80 text-sm mb-1">
              {t("auth.emailNotConfirmed")}
            </p>
            <p className="text-white/25 text-xs leading-relaxed mb-3">{t("auth.checkSpam")}</p>

            {resendSuccess && (
              <p className="text-emerald-400/70 text-xs mb-2">
                {t("auth.emailResent")}
              </p>
            )}

            <button
              onClick={handleResendConfirmation}
              disabled={cooldown > 0}
              className="text-xs text-white/30 hover:text-white/50 disabled:text-white/15 transition-colors duration-300 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? (
                <span className="font-mono text-[11px]">{t("auth.resendIn")} {cooldown}s</span>
              ) : (
                <span className="border-b border-white/20 pb-px">{t("auth.resendEmail")}</span>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400/80 text-sm mb-8">{error}</p>
        )}

        <form onSubmit={handleLogin} noValidate className="space-y-6">
          {/* Email field */}
          <div className="relative">
            <label
              className={`absolute left-0 transition-all duration-300 pointer-events-none font-[family-name:var(--font-display)] tracking-[0.15em] uppercase ${
                focusedField === "email" || email
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
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="w-full bg-transparent border-b border-white/10 focus:border-white/40 px-0 py-3 text-white text-sm focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Password field */}
          <div className="relative">
            <label
              className={`absolute left-0 transition-all duration-300 pointer-events-none font-[family-name:var(--font-display)] tracking-[0.15em] uppercase ${
                focusedField === "password" || password
                  ? "text-[10px] -top-5 text-chrome"
                  : "text-xs top-3 text-white/25"
              }`}
            >
              {t("auth.password")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="w-full bg-transparent border-b border-white/10 focus:border-white/40 px-0 py-3 pr-10 text-white text-sm focus:outline-none transition-all duration-300"
            />
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-3 text-white/20 hover:text-white/50 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full mt-8 py-4 font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase overflow-hidden transition-all duration-500 disabled:opacity-40"
          >
            {/* Background fill animation */}
            <span className="absolute inset-0 bg-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-left group-hover:scale-x-100 scale-x-100" />
            <span className="absolute inset-0 bg-white/0 group-hover:bg-chrome-bright transition-colors duration-300" />
            <span className="relative z-10 text-void font-bold">
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
          <span className="text-[10px] text-white/20 font-[family-name:var(--font-display)] tracking-[0.2em] uppercase">or</span>
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
        </div>

        <p className="text-center text-sm text-white/40">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-white/70 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300">
            {t("auth.signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
