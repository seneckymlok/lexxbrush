"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!e.currentTarget.checkValidity()) {
      setError(t("auth.fillAllFields") || "Please fill out all required fields properly.");
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
      router.push("/account");
    }
  };

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
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300"
              placeholder="••••••••"
            />
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
