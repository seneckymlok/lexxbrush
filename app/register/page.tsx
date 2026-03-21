"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function RegisterPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!e.currentTarget.checkValidity()) {
      setError(t("auth.fillAllFields") || "Please fill out all required fields properly.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordTooShort") || "Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setEmailSent(true);
      setCooldown(60);
      setLoading(false);
    }
  };

  const handleResendEmail = useCallback(async () => {
    if (cooldown > 0) return;
    setCooldown(60);
    
    await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });
  }, [cooldown, email]);

  // Success state — confirmation email sent
  if (emailSent) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-void"></div>

        <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 text-center">
          {/* Animated envelope icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-widest text-white mb-3">
            {t("auth.checkInbox")}
          </h1>
          <p className="text-white/50 text-sm mb-2 leading-relaxed">
            {t("auth.confirmationSent")}
          </p>
          <p className="text-white/70 text-sm font-medium mb-8 break-all">
            {email}
          </p>

          {/* Resend button with cooldown */}
          <div className="mb-6">
            <button
              onClick={handleResendEmail}
              disabled={cooldown > 0}
              className="text-sm text-white/50 hover:text-white disabled:hover:text-white/50 transition-colors duration-300 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  {t("auth.resendIn")} 
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-xs tabular-nums">
                    {cooldown}s
                  </span>
                </span>
              ) : (
                <span className="underline underline-offset-4">{t("auth.resendEmail")}</span>
              )}
            </button>
          </div>

          <div className="w-full h-px bg-white/10 mb-6" />

          <Link
            href="/login"
            className="text-sm text-white hover:underline underline-offset-4"
          >
            {t("auth.backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-void"></div>
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-widest text-white mb-2 text-center">
          {t("auth.register")}
        </h1>
        <p className="text-white/50 text-sm text-center mb-8">
          {t("auth.joinUs")}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm py-3 px-4 rounded-lg mb-6 text-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} noValidate className="space-y-5">
          <div>
            <label className="block text-xs font-bold tracking-widest text-white/50 uppercase mb-2">
              {t("auth.email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest text-white/50 uppercase mb-2">
              {t("auth.password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-white/20 text-xs mt-1.5">{t("auth.passwordHint")}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold uppercase tracking-[0.15em] py-4 rounded-lg hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {loading ? t("auth.signingUp") : t("auth.signUp")}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          {t("auth.yesAccount")}{" "}
          <Link href="/login" className="text-white hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
