"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Settings = {
  lock_enabled: boolean;
  lock_title_en: string;
  lock_title_sk: string;
  lock_subtitle_en: string;
  lock_subtitle_sk: string;
};

const DEFAULTS: Settings = {
  lock_enabled: false,
  lock_title_en: "BACK SOON.",
  lock_title_sk: "O CHVÍĽU.",
  lock_subtitle_en: "Putting on the finishing touches.",
  lock_subtitle_sk: "Dolaďujeme posledné detaily.",
};

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export default function AdminLockPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
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
        if (json.settings) setSettings({ ...DEFAULTS, ...json.settings });
      } catch {}
      setLoading(false);
    })();
  }, []);

  const save = async (next: Partial<Settings>) => {
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
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.settings) setSettings({ ...DEFAULTS, ...json.settings });
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

  const labelCls =
    "block text-[10px] font-[family-name:var(--font-display)] font-bold tracking-[0.2em] uppercase text-white/40 mb-2";
  const inputCls =
    "w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-colors font-[family-name:var(--font-body)]";

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
          Skry web pred verejnosťou. Admin a API stále fungujú. Vždy môžeš použiť tlačidlo náhľadu nižšie, aby si si web pozrel/a bez vypnutia zámku.
        </p>
      </header>

      {/* Master toggle */}
      <section className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              {settings.lock_enabled ? "Web je uzamknutý" : "Web je verejne dostupný"}
            </h2>
            <p className="text-xs text-white/45 leading-relaxed">
              {settings.lock_enabled
                ? "Návštevníci uvidia lock screen. Admin (/admin) je dostupný cez prihlásenie."
                : "Bežný režim. Návštevníci uvidia obchod."}
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => save({ lock_enabled: !settings.lock_enabled })}
            className={`relative h-9 w-16 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${
              settings.lock_enabled ? "bg-red-500/80" : "bg-white/15"
            }`}
            aria-pressed={settings.lock_enabled}
            aria-label="Toggle site lock"
          >
            <span
              className={`absolute top-1 h-7 w-7 rounded-full bg-white transition-transform ${
                settings.lock_enabled ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
        </div>

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

      {/* Content fields */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="text-base font-semibold text-white mb-1">Text na lock screene</h2>
        <p className="text-xs text-white/45 leading-relaxed mb-6">
          Hlavný titulok môže byť aj viacriadkový - každý nový riadok bude na samostatnom riadku.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({
              lock_title_en: settings.lock_title_en,
              lock_title_sk: settings.lock_title_sk,
              lock_subtitle_en: settings.lock_subtitle_en,
              lock_subtitle_sk: settings.lock_subtitle_sk,
            });
          }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Titulok (SK)</label>
              <textarea
                rows={2}
                className={`${inputCls} resize-none uppercase font-bold`}
                value={settings.lock_title_sk}
                onChange={(e) => setSettings({ ...settings, lock_title_sk: e.target.value })}
                maxLength={120}
              />
            </div>
            <div>
              <label className={labelCls}>Title (EN)</label>
              <textarea
                rows={2}
                className={`${inputCls} resize-none uppercase font-bold`}
                value={settings.lock_title_en}
                onChange={(e) => setSettings({ ...settings, lock_title_en: e.target.value })}
                maxLength={120}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Podnadpis (SK)</label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                value={settings.lock_subtitle_sk}
                onChange={(e) => setSettings({ ...settings, lock_subtitle_sk: e.target.value })}
                maxLength={300}
              />
            </div>
            <div>
              <label className={labelCls}>Subtitle (EN)</label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                value={settings.lock_subtitle_en}
                onChange={(e) => setSettings({ ...settings, lock_subtitle_en: e.target.value })}
                maxLength={300}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-full bg-white text-black text-xs font-[family-name:var(--font-display)] font-bold tracking-[0.15em] uppercase hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "…" : "Uložiť"}
            </button>
            {status === "saved" && (
              <span className="text-xs text-sage/80">Uložené.</span>
            )}
            {status === "error" && (
              <span className="text-xs text-red-400/80">Niečo sa pokazilo.</span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
