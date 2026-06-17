"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

// Shown on the public site only when the admin draft-mode bypass cookie is set
// (the server renders it via `draftMode().isEnabled`). Signals that scheduled
// drops are visible and offers a one-tap exit back to the real public view.
export function AdminPreviewBar() {
  const { locale } = useLanguage();
  const [exiting, setExiting] = useState(false);
  const sk = locale === "sk";

  async function exitPreview() {
    setExiting(true);
    try {
      // Disabling needs no auth - it just clears this browser's bypass cookie.
      await fetch("/api/admin/preview?on=0", { cache: "no-store" });
    } catch {
      /* fall through to reload regardless */
    }
    // Hard reload so the page re-renders statically without scheduled drops.
    window.location.reload();
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-[120] pointer-events-none flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-amber-400/40 bg-[#1a1407]/95 backdrop-blur-md pl-4 pr-2 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-[11px] sm:text-xs tracking-[0.12em] uppercase text-amber-200/90 whitespace-nowrap">
          {sk ? "Režim náhľadu · vidíš aj naplánované" : "Preview mode · scheduled drops visible"}
        </span>
        <button
          onClick={exitPreview}
          disabled={exiting}
          className="ml-1 rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {exiting ? (sk ? "Ukončujem…" : "Exiting…") : sk ? "Ukončiť" : "Exit"}
        </button>
      </div>
    </div>
  );
}
