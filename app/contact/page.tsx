"use client";

import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Locale } from "@/lib/translations";

export default function ContactPage() {
  const { locale, t } = useLanguage();
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  useGSAP(() => {
    if (!formRef.current) return;
    gsap.from(formRef.current.querySelectorAll(".form-reveal"), {
      y: 30, opacity: 0, stagger: 0.08, duration: 0.6, ease: "power3.out", delay: 0.2,
    });
  }, { scope: formRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const inputClasses =
    "w-full bg-transparent border-b border-steel focus:border-cyan outline-none py-3 text-text placeholder:text-text-dim font-[family-name:var(--font-body)] text-sm transition-colors duration-300";

  const companyInfo: Record<string, { label: string; value: string }[]> = {
    en: [
      { label: "Company", value: "Lexxbrush, s. r. o." },
      { label: "Address", value: "Stará ulica 38/27, 094 02 Slovenská Kajňa" },
      { label: "ID (IČO)", value: "57 354 634" },
      { label: "Tax ID (DIČ)", value: "2122713032" },
      { label: "VAT ID (IČ DPH)", value: "SK2122713032" },
      { label: "Registered", value: "District Court Prešov, Sro 51456/P" },
    ],
    sk: [
      { label: "Spoločnosť", value: "Lexxbrush, s. r. o." },
      { label: "Sídlo", value: "Stará ulica 38/27, 094 02 Slovenská Kajňa" },
      { label: "IČO", value: "57 354 634" },
      { label: "DIČ", value: "2122713032" },
      { label: "IČ DPH", value: "SK2122713032" },
      { label: "Zápis", value: "Okresný súd Prešov, oddiel Sro, vložka 51456/P" },
    ],
  };

  return (
    <div className="page-enter relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 z-0" style={{
        background: "linear-gradient(180deg, var(--color-void) 0%, rgba(10,10,10,0.97) 50%, var(--color-void) 100%)",
      }} />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-3xl mx-auto" ref={formRef}>
          {/* Title */}
          <div className="form-reveal text-center md:text-left mb-16">
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-extrabold tracking-tight uppercase chrome-text">
              {t("contact.title")}
            </h1>
            <div className="w-10 h-[1px] bg-white/10 mt-4 mb-6 mx-auto md:mx-0" />
            <p className="text-chrome leading-relaxed max-w-md mx-auto md:mx-0">
              {t("contact.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="on" className="space-y-8">
              <div className="form-reveal">
                <label htmlFor="contact-name" className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                  {t("contact.name")}
                </label>
                <input id="contact-name" name="name" type="text" autoComplete="name" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
              </div>

              <div className="form-reveal">
                <label htmlFor="contact-email" className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                  {t("contact.email")}
                </label>
                <input id="contact-email" name="email" type="email" autoComplete="email" inputMode="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClasses} />
              </div>

              <div className="form-reveal">
                <label htmlFor="contact-subject" className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                  {t("contact.subject")}
                </label>
                <input id="contact-subject" name="subject" type="text" value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClasses} />
              </div>

              <div className="form-reveal">
                <label htmlFor="contact-message" className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                  {t("contact.message")}
                </label>
                <textarea id="contact-message" name="message" required rows={5} value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-transparent border border-steel focus:border-cyan outline-none rounded-lg p-4 text-text placeholder:text-text-dim font-[family-name:var(--font-body)] text-sm transition-colors duration-300 resize-none" />
              </div>

              <div className="form-reveal pt-2">
                <button type="submit" disabled={status === "sending"}
                  className="w-full md:w-auto px-10 py-4 btn-brand text-sm font-bold rounded-full disabled:opacity-50">
                  {status === "sending" ? "..." : t("contact.send")}
                </button>
              </div>

              {status === "success" && (
                <div className="form-reveal">
                  <p className="text-cyan text-sm">{t("contact.success")}</p>
                </div>
              )}
              {status === "error" && (
                <div className="form-reveal">
                  <p className="text-pink text-sm">{t("contact.error")}</p>
                </div>
              )}
            </form>

            {/* Company Info */}
            <div className="form-reveal space-y-10">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] uppercase text-chrome-bright mb-6">
                  {t("contact.companyInfo")}
                </h2>
                <div className="space-y-3">
                  {companyInfo[locale as Locale]?.map((item, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[10px] font-[family-name:var(--font-display)] tracking-[0.15em] uppercase text-text-dim">{item.label}</span>
                      <span className="text-sm text-chrome-light">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] uppercase text-chrome-bright mb-4">
                  {t("contact.followUs")}
                </h2>
                <a href="https://www.instagram.com/lexxbrush" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-chrome hover:text-cyan transition-colors duration-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                  @lexxbrush
                </a>
              </div>

              <div>
                <h2 className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] uppercase text-chrome-bright mb-4">
                  Email
                </h2>
                <a href="mailto:info@lexxbrush.eu" className="text-sm text-chrome hover:text-cyan transition-colors duration-300">
                  info@lexxbrush.eu
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
