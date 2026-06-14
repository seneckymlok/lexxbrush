"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/providers/LanguageProvider";

// useSearchParams needs a Suspense boundary during prerender (Next 16).
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

type Phase = "verifying" | "ready" | "saving" | "done" | "error";

function ResetPasswordInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();

  const [phase, setPhase] = useState<Phase>("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const verifiedRef = useRef(false);

  // Establish the recovery session in the BROWSER (not the server) - that's the
  // only place updateUser() can find the authenticated user. The recovery link
  // carries a token_hash; we exchange it here. Falls back to an
  // already-present session (covers React StrictMode's double-invoke in dev and
  // the legacy hash-fragment flow).
  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const token_hash = params.get("token_hash");

    (async () => {
      if (token_hash) {
        const { error: vErr } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash,
        });
        if (!vErr) {
          setPhase("ready");
          return;
        }
      }
      // No token (or it was already consumed) - do we already hold a session?
      const { data } = await supabase.auth.getSession();
      setPhase(data.session ? "ready" : "error");
    })();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.reset.mismatch"));
      return;
    }

    setPhase("saving");
    const { error: uErr } = await supabase.auth.updateUser({ password });
    if (uErr) {
      setError(uErr.message);
      setPhase("ready");
      return;
    }

    setPhase("done");
    setTimeout(() => router.push("/account"), 1600);
  };

  // ── Verifying ──────────────────────────────────────────────────────────────
  if (phase === "verifying") {
    return (
      <Centered>
        <div className="w-6 h-6 border-t border-white/30 rounded-full animate-spin" />
      </Centered>
    );
  }

  // ── Invalid / expired link ──────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <Centered>
        <div className="w-full max-w-[420px] text-center">
          <div
            className="relative w-16 h-16 mx-auto mb-8 opacity-80"
            style={{ filter: "drop-shadow(0 0 24px rgba(50,100,255,0.5))" }}
          >
            <Image src="/suits/spade.webp" alt="" fill className="object-contain" sizes="64px" />
          </div>
          <p className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">
            {t("auth.confirmed.errorEyebrow")}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,7vw,2.25rem)] md:text-3xl font-extrabold tracking-tight uppercase chrome-text mb-4">
            {t("auth.reset.expiredTitle")}
          </h1>
          <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-6" />
          <p className="text-chrome text-sm leading-relaxed mb-10">{t("auth.reset.expiredBody")}</p>
          <div className="flex flex-col items-center gap-5">
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center justify-center min-w-[220px] px-10 py-4 btn-brand font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] uppercase rounded-full"
            >
              {t("auth.confirmed.errorCta")}
            </Link>
            <Link
              href="/login"
              className="text-sm text-white/50 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300 font-[family-name:var(--font-display)] tracking-[0.1em] uppercase"
            >
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </Centered>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <Centered>
        <div className="w-full max-w-[420px] text-center">
          <div
            className="relative w-16 h-16 mx-auto mb-8"
            style={{ filter: "drop-shadow(0 0 24px rgba(136,0,204,0.6))" }}
          >
            <Image src="/suits/heart.webp" alt="" fill className="object-contain" sizes="64px" />
          </div>
          <p className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">
            {t("auth.reset.doneEyebrow")}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,7vw,2.25rem)] md:text-3xl font-extrabold tracking-tight uppercase chrome-text mb-4">
            {t("auth.reset.doneTitle")}
          </h1>
          <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-6" />
          <p className="text-chrome text-sm leading-relaxed mb-8">{t("auth.reset.doneBody")}</p>
          <Link
            href="/account"
            className="text-sm text-white/50 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300 font-[family-name:var(--font-display)] tracking-[0.1em] uppercase"
          >
            {t("auth.confirmed.toAccount")}
          </Link>
        </div>
      </Centered>
    );
  }

  // ── Set-new-password form (ready / saving) ──────────────────────────────────
  const saving = phase === "saving";
  return (
    <Centered>
      <div className="w-full max-w-[420px]">
        <div className="mb-4 text-center md:text-left">
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text">
            {t("auth.reset.title")}
          </h1>
          <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-3 mx-auto md:mx-0" />
        </div>

        <p className="text-white/30 text-sm leading-relaxed mb-10 text-center md:text-left">
          {t("auth.reset.body")}
        </p>

        {error && <p className="text-red-400/80 text-sm mb-8">{error}</p>}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* New password */}
          <div className="relative">
            <label
              className={`absolute left-0 transition-all duration-300 pointer-events-none font-[family-name:var(--font-display)] tracking-[0.15em] uppercase ${
                focused === "pw" || password ? "text-[10px] -top-5 text-chrome" : "text-xs top-3 text-white/25"
              }`}
            >
              {t("auth.reset.newPassword")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("pw")}
              onBlur={() => setFocused(null)}
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

          {/* Confirm password */}
          <div className="relative">
            <label
              className={`absolute left-0 transition-all duration-300 pointer-events-none font-[family-name:var(--font-display)] tracking-[0.15em] uppercase ${
                focused === "confirm" || confirm ? "text-[10px] -top-5 text-chrome" : "text-xs top-3 text-white/25"
              }`}
            >
              {t("auth.reset.confirmPassword")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={() => setFocused("confirm")}
              onBlur={() => setFocused(null)}
              className="w-full bg-transparent border-b border-white/10 focus:border-white/40 px-0 py-3 text-white text-sm focus:outline-none transition-all duration-300"
            />
            <p className="text-white/15 text-[11px] mt-2 font-[family-name:var(--font-display)] tracking-wider uppercase">
              {t("auth.passwordHint")}
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 py-4 btn-brand font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] uppercase rounded-full disabled:opacity-50"
          >
            {saving ? t("auth.reset.saving") : t("auth.reset.cta")}
          </button>
        </form>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="relative z-10 w-full flex items-center justify-center">{children}</div>
    </div>
  );
}
