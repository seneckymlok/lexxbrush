"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export default function AdminLockPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/admin/lock", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.settings) setEnabled(!!json.settings.lock_enabled);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const toggle = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/lock", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lock_enabled: !enabled }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.settings) setEnabled(!!json.settings.lock_enabled);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
    setSaving(false);
  };

  const setPreviewCookie = () => {
    // 1-hour preview cookie - middleware honors it to let the admin walk the
    // unlocked site while the gate stays live for everyone else.
    document.cookie = `lexx-preview=1; path=/; max-age=3600; samesite=lax`;
    window.open("/", "_blank");
  };

  const clearPreviewCookie = () => {
    document.cookie = `lexx-preview=; path=/; max-age=0; samesite=lax`;
  };

  if (loading) {
    return (
      <div className="p-8 text-white/50 text-sm">Načítavam…</div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <header className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">Lock screen</h1>
        <p className="text-sm text-white/40">
          Skry web pred verejnosťou. Admin a API stále fungujú.
        </p>
      </header>

      {/* Master toggle */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              {enabled ? "Web je uzamknutý" : "Web je verejne dostupný"}
            </h2>
            <p className="text-xs text-white/45 leading-relaxed">
              {enabled
                ? "Návštevníci uvidia \"Coming Soon\" obrazovku. Admin je dostupný cez prihlásenie."
                : "Bežný režim. Návštevníci uvidia obchod."}
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={toggle}
            className={`relative h-9 w-16 rounded-full transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0 ${
              enabled ? "bg-white/30" : "bg-white/15"
            }`}
            aria-pressed={enabled}
            aria-label="Toggle site lock"
          >
            <span
              className="absolute top-1 left-1 h-7 w-7 rounded-full bg-white transition-transform duration-200"
              style={{ transform: enabled ? "translateX(28px)" : "translateX(0)" }}
            />
          </button>
        </div>

        {status === "saved" && (
          <p className="text-xs text-sage/80 mt-4">Uložené.</p>
        )}
        {status === "error" && (
          <p className="text-xs text-red-400/80 mt-4">Niečo sa pokazilo.</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={setPreviewCookie}
            className="px-4 py-2 rounded-full bg-white text-black text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase hover:bg-white/90 transition-colors cursor-pointer"
          >
            Pozrieť web (1 h)
          </button>
          <button
            type="button"
            onClick={clearPreviewCookie}
            className="px-4 py-2 rounded-full border border-white/15 text-white/60 text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            Zrušiť náhľad
          </button>
          <a
            href="/lock"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full border border-white/10 text-white/45 text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase hover:text-white hover:border-white/25 transition-colors"
          >
            Ukážka lock screen
          </a>
        </div>
      </section>
    </div>
  );
}
