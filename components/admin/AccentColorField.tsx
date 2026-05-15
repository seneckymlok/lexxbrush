"use client";

import { useState } from "react";
import { extractAccentGradient } from "@/lib/colorExtraction";

interface Props {
  from: string;                          // hex or ""
  to:   string;                          // hex or ""
  onFromChange: (hex: string) => void;
  onToChange:   (hex: string) => void;
  /** First image - File for new uploads, URL for saved products. */
  source?: string | File | null;
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const DEFAULT_FROM = "#8800CC";
const DEFAULT_TO   = "#0088FF";

export function AccentColorField({ from, to, onFromChange, onToChange, source }: Props) {
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromValid = HEX_RE.test(from);
  const toValid   = HEX_RE.test(to);
  const fromSwatch = fromValid ? from : DEFAULT_FROM;
  const toSwatch   = toValid   ? to   : DEFAULT_TO;

  async function reExtract() {
    if (!source) return;
    setExtracting(true);
    setError(null);
    try {
      const { from: f, to: t } = await extractAccentGradient(source);
      onFromChange(f);
      onToChange(t);
    } catch {
      setError("Could not extract - image may be cross-origin.");
    } finally {
      setExtracting(false);
    }
  }

  function handleHex(raw: string, onChange: (v: string) => void) {
    let v = raw.trim();
    if (v && !v.startsWith("#")) v = `#${v}`;
    onChange(v.toUpperCase());
  }

  const inputCls = (valid: boolean, hasValue: boolean) =>
    `w-28 bg-white/5 border rounded-lg px-3 py-2.5 text-sm font-mono uppercase outline-none transition-colors ${
      hasValue && !valid
        ? "border-red-500/40 text-red-300 focus:border-red-500/60"
        : "border-white/10 text-white focus:border-white/25"
    }`;

  return (
    <div className="space-y-3">
      {/* Gradient preview bar */}
      <div
        className="h-8 w-48 rounded-lg border border-white/10"
        style={{ background: `linear-gradient(135deg, ${fromSwatch}, ${toSwatch})` }}
      />

      <div className="flex flex-wrap items-center gap-3">
        {/* FROM swatch + input */}
        <label
          className="relative w-10 h-10 rounded-lg border border-white/15 cursor-pointer overflow-hidden flex-shrink-0"
          style={{ background: fromSwatch }}
          title="Gradient start color"
        >
          <input
            type="color"
            value={fromSwatch}
            onChange={(e) => onFromChange(e.target.value.toUpperCase())}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <input
          type="text"
          value={from}
          onChange={(e) => handleHex(e.target.value, onFromChange)}
          placeholder="#8800CC"
          spellCheck={false}
          maxLength={7}
          className={inputCls(fromValid, !!from)}
        />

        <span className="text-white/20 text-sm">→</span>

        {/* TO swatch + input */}
        <label
          className="relative w-10 h-10 rounded-lg border border-white/15 cursor-pointer overflow-hidden flex-shrink-0"
          style={{ background: toSwatch }}
          title="Gradient end color"
        >
          <input
            type="color"
            value={toSwatch}
            onChange={(e) => onToChange(e.target.value.toUpperCase())}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <input
          type="text"
          value={to}
          onChange={(e) => handleHex(e.target.value, onToChange)}
          placeholder="#0088FF"
          spellCheck={false}
          maxLength={7}
          className={inputCls(toValid, !!to)}
        />

        {/* Extract */}
        <button
          type="button"
          onClick={reExtract}
          disabled={!source || extracting}
          className="text-[11px] font-medium tracking-wider uppercase text-white/50 hover:text-white disabled:text-white/15 disabled:cursor-not-allowed transition-colors"
          title={source ? "Extract gradient from first image" : "Upload an image first"}
        >
          {extracting ? "Extracting…" : "↻ Extract"}
        </button>

        {/* Clear both */}
        {(from || to) && (
          <button
            type="button"
            onClick={() => { onFromChange(""); onToChange(""); }}
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
