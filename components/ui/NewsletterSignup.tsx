"use client";

import { useState, useId } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

type State = "idle" | "submitting" | "success" | "error";

interface Props {
  /** Which surface this signup is on — recorded as `source` in the DB. */
  source: string;
  /** Optional className for the outer form. */
  className?: string;
  /** Visual variant. `footer` = minimal inline. */
  variant?: "footer";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterSignup({ source, className, variant = "footer" }: Props) {
  const { locale, t } = useLanguage();
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setErrorMsg(t("newsletter.form.invalid"));
      setState("error");
      return;
    }

    setState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed, locale, source }),
      });
      if (!res.ok) {
        // Hide server-side detail; same message regardless.
        setErrorMsg(t("newsletter.form.serverError"));
        setState("error");
        return;
      }
      setEmail("");
      setState("success");
    } catch {
      setErrorMsg(t("newsletter.form.networkError"));
      setState("error");
    }
  }

  if (variant === "footer") {
    return (
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm ${className || ""}`}
        noValidate
        aria-label={t("newsletter.form.ariaLabel")}
      >
        <label
          htmlFor={inputId}
          className="block font-[family-name:var(--font-display)] text-[10px] tracking-[0.28em] uppercase text-white/40 mb-3"
        >
          {t("newsletter.form.label")}
        </label>

        <div className="relative">
          <input
            id={inputId}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            required
            disabled={state === "submitting" || state === "success"}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            placeholder={t("newsletter.form.placeholder")}
            className="w-full bg-transparent border-b border-white/15 focus:border-white/40 transition-colors duration-300 pr-24 pb-2 pt-1 text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={state === "submitting" || state === "success"}
            className="absolute right-0 bottom-2 font-[family-name:var(--font-display)] text-[10px] tracking-[0.2em] uppercase text-white/60 hover:text-white transition-colors duration-300 disabled:opacity-40 disabled:cursor-default"
          >
            {state === "submitting"
              ? t("newsletter.form.submitting")
              : state === "success"
              ? t("newsletter.form.successInline")
              : t("newsletter.form.submit")}
          </button>
        </div>

        <p className="mt-3 text-[10px] text-white/30 leading-relaxed min-h-[1.4em]">
          {state === "success"
            ? t("newsletter.form.successDetail")
            : state === "error"
            ? <span className="text-red-400/70">{errorMsg}</span>
            : t("newsletter.form.helper")}
        </p>
      </form>
    );
  }

  return null;
}
