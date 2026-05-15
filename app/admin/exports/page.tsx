"use client";

// ─── Admin · Monthly accounting exports ─────────────────────────────────────
//
// Single-purpose page: pick a month, get a ZIP with everything the účtovník
// needs to close that month's books. See app/api/admin/exports/route.ts for
// the bundle contents.
//
// Designed to be boring — this page exists to save 2h/month of manual
// CSV stitching, not to be a dashboard. The "current month" prominent at
// the top + the 12 prior months as a grid is the entire UX.

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface MonthOption {
  /** "YYYY-MM" key for API */
  key:   string;
  /** Display label, localized to en-GB short form */
  label: string;
  /** True if this is the current calendar month */
  isCurrent: boolean;
}

/** Build a descending list of the current month + the prior 11. */
function buildMonths(): MonthOption[] {
  const now = new Date();
  const out: MonthOption[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year  = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    out.push({
      key:       `${year}-${month}`,
      label:     d.toLocaleString("sk-SK", { month: "long", year: "numeric", timeZone: "UTC" }),
      isCurrent: i === 0,
    });
  }
  return out;
}

export default function AdminExportsPage() {
  const months = useMemo(buildMonths, []);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadMonth(monthKey: string) {
    setError(null);
    setDownloading(monthKey);
    try {
      // Auth — same Bearer-token pattern as the rest of /admin
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("Nie si prihlásený. Obnov stránku a skús znova.");
        return;
      }

      const res = await fetch(`/api/admin/exports?month=${monthKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setError(`Export failed (${res.status}) ${msg.slice(0, 200)}`);
        return;
      }

      // Stream the ZIP into a blob and trigger a same-tab download.
      // This avoids window.open which can be popup-blocked.
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `lexxbrush-export-${monthKey}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Give the browser one frame to start the download before revoking.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setError(err?.message ?? "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  const current = months[0];
  const prior   = months.slice(1);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-2">Exporty</h1>
      <p className="text-white/40 text-sm mb-8 max-w-2xl leading-relaxed">
        Mesačný balík pre účtovníka. Obsahuje zoznam objednávok, Stripe
        poplatky pre samozdanenie DPH (§7a), a PDF faktúr vystavených
        zákazníkom. Vyber mesiac a stiahni ZIP.
      </p>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Current month — prominent */}
      <div className="mb-10 p-5 rounded-xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/30 mb-1">
              Aktuálny mesiac
            </p>
            <p className="text-lg font-medium text-white">{current.label}</p>
            <p className="text-xs text-white/40 mt-1">
              Všetky uhradené objednávky tohto mesiaca.
            </p>
          </div>
          <button
            onClick={() => downloadMonth(current.key)}
            disabled={downloading === current.key}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading === current.key ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Pripravujem...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Stiahnuť ZIP
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prior months */}
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/30 mb-3">
        Predchádzajúce mesiace
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {prior.map((m) => (
          <button
            key={m.key}
            onClick={() => downloadMonth(m.key)}
            disabled={downloading === m.key}
            className="group flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col">
              <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                {m.label}
              </span>
              <span className="text-[10px] text-white/30 mt-0.5">
                {m.key}
              </span>
            </div>
            {downloading === m.key ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 group-hover:text-white/70 transition-colors">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* What's inside */}
      <div className="mt-12 max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/30 mb-3">
          Čo obsahuje každý ZIP
        </p>
        <div className="space-y-3 text-sm text-white/50 leading-relaxed">
          <div className="flex gap-3">
            <code className="text-[11px] text-white/70 bg-white/5 px-1.5 py-0.5 rounded h-5 mt-0.5 flex-shrink-0">orders-YYYY-MM.csv</code>
            <span>Všetky uhradené objednávky — dátum, zákazník, suma, číslo faktúry, stav.</span>
          </div>
          <div className="flex gap-3">
            <code className="text-[11px] text-white/70 bg-white/5 px-1.5 py-0.5 rounded h-5 mt-0.5 flex-shrink-0">stripe-fees-YYYY-MM.csv</code>
            <span>Stripe poplatok + čistý výnos na objednávku. Podklad pre §7a samozdanenie DPH.</span>
          </div>
          <div className="flex gap-3">
            <code className="text-[11px] text-white/70 bg-white/5 px-1.5 py-0.5 rounded h-5 mt-0.5 flex-shrink-0">invoices/</code>
            <span>PDF kópie všetkých faktúr vystavených v danom mesiaci.</span>
          </div>
          <div className="flex gap-3">
            <code className="text-[11px] text-white/70 bg-white/5 px-1.5 py-0.5 rounded h-5 mt-0.5 flex-shrink-0">README.txt</code>
            <span>Zhrnutie pre účtovníka v slovenčine.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
