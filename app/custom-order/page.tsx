"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { supabase } from "@/lib/supabase";

export default function CustomOrderPage() {
  const { t } = useLanguage();
  const formRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const [form, setForm] = useState({
    name: "",
    email: "",
    garment: "",
    description: "",
    budget: "",
  });

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const elements = formRef.current?.querySelectorAll(".form-reveal");
    if (elements) {
      gsap.from(elements, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.2,
      });
    }
  }, { scope: formRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const { error } = await supabase.from("custom_orders").insert({
        name: form.name,
        email: form.email,
        garment: form.garment,
        description: form.description,
        budget: form.budget,
      });

      if (error) throw error;
      setStatus("success");
      setForm({ name: "", email: "", garment: "", description: "", budget: "" });
    } catch {
      setStatus("error");
    }
  };

  const inputClasses =
    "w-full bg-transparent border-b border-steel focus:border-chrome-light outline-none py-3 text-text placeholder:text-text-dim font-[family-name:var(--font-body)] text-sm transition-colors duration-300";

  return (
    <div className="page-enter relative min-h-screen overflow-hidden">
      {/* Atmospheric background — faded studio photo */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/stuff/644491434_1610689800260372_6637764847606399635_n.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.04,
          filter: "grayscale(100%)",
        }}
      />

      {/* Dark gradient overlay for form readability */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, var(--color-void) 0%, rgba(10,10,10,0.95) 30%, rgba(10,10,10,0.98) 70%, var(--color-void) 100%)",
        }}
      />

      {/* Decorative character — desktop only */}
      <img
        src="/characters/typecek2(png).webp"
        alt=""
        aria-hidden="true"
        className="hidden lg:block absolute right-[-40px] top-[20%] w-[250px] opacity-[0.04] pointer-events-none"
        style={{ filter: "invert(1) brightness(1.3)" }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-6 pb-12 md:pt-10 md:pb-24">
        <div className="max-w-2xl mx-auto" ref={formRef}>
          <div className="form-reveal">
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-extrabold tracking-tight uppercase chrome-text">
              {t("custom.title")}
            </h1>
            <div className="w-10 h-[2px] bg-gradient-to-r from-pink to-transparent mt-4 mb-6" />
            <p className="text-chrome leading-relaxed max-w-md mb-12">
              {t("custom.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="form-reveal">
              <label className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                {t("custom.name")}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div className="form-reveal">
              <label className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                {t("custom.email")}
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClasses}
              />
            </div>

            <div className="form-reveal">
              <label className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                {t("custom.garment")}
              </label>
              <input
                type="text"
                required
                value={form.garment}
                onChange={(e) => setForm({ ...form, garment: e.target.value })}
                placeholder={t("custom.garmentPlaceholder")}
                className={inputClasses}
              />
            </div>

            <div className="form-reveal">
              <label className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                {t("custom.budget")}
              </label>
              <input
                type="text"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="€100 - €300"
                className={inputClasses}
              />
            </div>

            <div className="form-reveal">
              <label className="block text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase text-chrome mb-1">
                {t("custom.description")}
              </label>
              <textarea
                required
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("custom.descriptionPlaceholder")}
                className={`${inputClasses} resize-none border rounded-lg p-4 border-steel focus:border-chrome-light`}
              />
            </div>

            <div className="form-reveal pt-4">
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full md:w-auto px-10 py-4 bg-white text-void font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.15em] uppercase rounded-full hover:bg-chrome-bright active:scale-[0.98] transition-all duration-400 disabled:opacity-50"
              >
                {status === "sending" ? "..." : t("custom.submit")}
              </button>
            </div>

            {status === "success" && (
              <div className="form-reveal">
                <p className="text-cyan text-sm font-medium">
                  {t("custom.success")}
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="form-reveal">
                <p className="text-pink text-sm font-medium">
                  {t("custom.error")}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
