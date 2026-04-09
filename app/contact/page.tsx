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
  const [errorMsg, setErrorMsg] = useState("");

  useGSAP(() => {
    if (!formRef.current) return;
    gsap.from(formRef.current.querySelectorAll(".form-reveal"), {
      y: 30, opacity: 0, stagger: 0.08, duration: 0.6, ease: "power3.out", delay: 0.2,
    });
  }, { scope: formRef });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (!e.currentTarget.checkValidity()) {
      setStatus("error");
      setErrorMsg(t("auth.fillAllFields") || "Please fill out all required fields.");
      return;
    }

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
      setErrorMsg(t("contact.error") || "Something went wrong. Please try again.");
    }
  };

  const inputClasses =
    "w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300";

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
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-3xl mx-auto" ref={formRef}>
          {/* Title */}
          <div className="form-reveal text-center md:text-left mb-16">
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-extrabold tracking-tight uppercase chrome-text">
              {t("contact.title")}
            </h1>
            <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 mb-6 mx-auto md:mx-0" />
            <p className="text-chrome leading-relaxed max-w-md mx-auto md:mx-0">
              {t("contact.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="on" noValidate className="space-y-8">
              <div className="form-reveal">
                <label htmlFor="contact-name" className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                  {t("contact.name")}
                </label>
                <input id="contact-name" name="name" type="text" autoComplete="name" required value={form.name}
                  placeholder={t("contact.namePlaceholder")}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
              </div>

              <div className="form-reveal">
                <label htmlFor="contact-email" className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                  {t("contact.email")}
                </label>
                <input id="contact-email" name="email" type="email" autoComplete="email" inputMode="email" required value={form.email}
                  placeholder={t("contact.emailPlaceholder")}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClasses} />
              </div>

              <div className="form-reveal">
                <label htmlFor="contact-subject" className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                  {t("contact.subject")}
                </label>
                <input id="contact-subject" name="subject" type="text" value={form.subject}
                  placeholder={t("contact.subjectPlaceholder")}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClasses} />
              </div>

              <div className="form-reveal">
                <label htmlFor="contact-message" className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                  {t("contact.message")}
                </label>
                <textarea id="contact-message" name="message" required rows={5} value={form.message}
                  placeholder={t("contact.messagePlaceholder")}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${inputClasses} resize-none`} />
              </div>

              <div className="form-reveal pt-2">
                <button type="submit" disabled={status === "sending"}
                  className="w-full md:w-auto px-10 py-4 btn-brand text-sm font-bold rounded-full disabled:opacity-50">
                  {status === "sending" ? "..." : t("contact.send")}
                </button>
              </div>

              {status === "success" && (
                <p className="form-reveal text-sage/80 text-sm">{t("contact.success")}</p>
              )}
              {status === "error" && (
                <p className="form-reveal text-red-400/80 text-sm">{errorMsg}</p>
              )}
            </form>

            {/* Company Info */}
            <div className="form-reveal space-y-10 text-center md:text-left">
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
                  className="ig-hover inline-flex items-center gap-2 text-sm text-chrome transition-colors duration-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  lexxbrush
                </a>
              </div>

              <div>
                <h2 className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] uppercase text-chrome-bright mb-4">
                  Email
                </h2>
                <a href="mailto:info@lexxbrush.eu" className="text-sm text-chrome hover:text-sage transition-colors duration-300">
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
