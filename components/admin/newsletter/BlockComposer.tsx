"use client";

// ─── Block composer ──────────────────────────────────────────────────────────
//
// The full editor surface for a newsletter campaign body. Holds a list of
// blocks, lets the user add / remove / reorder / edit them inline, and emits
// changes back up via onChange.
//
// Pure UI - all HTML/text rendering happens in `lib/email/newsletter-blocks`.
// The composer never assembles markup itself; it just edits the JSON shape.

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  type Block,
  type BlockType,
  type RenderProduct,
  makeDefaultBlock,
} from "@/lib/email/newsletter-blocks";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface ComposerProduct extends RenderProduct {
  /** Used by the picker UI for visual sorting / category labels. */
  category?: string;
}

interface Props {
  blocks:    Block[];
  onChange:  (next: Block[]) => void;
  products:  ComposerProduct[];
  loadingProducts?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BlockComposer({ blocks, onChange, products, loadingProducts }: Props) {
  const productMap = useMemo(() => {
    const m: Record<string, ComposerProduct> = {};
    for (const p of products) m[p.id] = p;
    return m;
  }, [products]);

  function setBlock(idx: number, updater: (b: Block) => Block) {
    const next = blocks.slice();
    next[idx] = updater(blocks[idx]);
    onChange(next);
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  function duplicate(idx: number) {
    const src = blocks[idx];
    const copy: Block = { ...src, id: Math.random().toString(36).slice(2, 10) } as Block;
    const next = blocks.slice();
    next.splice(idx + 1, 0, copy);
    onChange(next);
  }

  function remove(idx: number) {
    const next = blocks.slice();
    next.splice(idx, 1);
    onChange(next);
  }

  function insertAt(idx: number, type: BlockType) {
    const next = blocks.slice();
    next.splice(idx, 0, makeDefaultBlock(type));
    onChange(next);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (blocks.length === 0) {
    return <EmptyState onAdd={(type) => onChange([makeDefaultBlock(type)])} />;
  }

  return (
    <div className="space-y-2">
      {blocks.map((b, i) => (
        <div key={b.id}>
          <InsertSeam onPick={(type) => insertAt(i, type)} />
          <BlockShell
            block={b}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, 1)}
            onDuplicate={() => duplicate(i)}
            onRemove={() => remove(i)}
            onChange={(updated) => setBlock(i, () => updated)}
            productMap={productMap}
            products={products}
            loadingProducts={!!loadingProducts}
          />
        </div>
      ))}
      <InsertSeam onPick={(type) => insertAt(blocks.length, type)} alwaysOpen />
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: (t: BlockType) => void }) {
  return (
    <div className="border border-dashed border-white/10 rounded-2xl py-14 px-6 text-center bg-white/[0.01]">
      <div className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4">Empty canvas</div>
      <p className="text-sm text-white/60 mb-6">Pick a block to start composing.</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {BLOCK_PALETTE.map((p) => (
          <button
            key={p.type}
            onClick={() => onAdd(p.type)}
            className="px-3 py-2 text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-all flex items-center gap-2"
          >
            <span>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Insertion seam between blocks ───────────────────────────────────────────

function InsertSeam({
  onPick,
  alwaysOpen = false,
}: {
  onPick: (t: BlockType) => void;
  alwaysOpen?: boolean;
}) {
  const [open, setOpen] = useState(alwaysOpen);
  return (
    <div className="group relative py-1">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          aria-label="Insert block"
        >
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">+ Insert</span>
          <div className="flex-1 h-px bg-white/10" />
        </button>
      ) : (
        <div className="flex items-center gap-2 py-2 flex-wrap">
          {!alwaysOpen && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] uppercase tracking-wider text-white/30 hover:text-white/60"
              aria-label="Cancel insert"
            >
              ×
            </button>
          )}
          {BLOCK_PALETTE.map((p) => (
            <button
              key={p.type}
              onClick={() => { onPick(p.type); if (!alwaysOpen) setOpen(false); }}
              className="px-2.5 py-1.5 text-[11px] uppercase tracking-wider bg-white/[0.03] hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-md text-white/60 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span aria-hidden>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Block shell (header chrome + editor) ────────────────────────────────────

interface BlockShellProps {
  block:           Block;
  isFirst:         boolean;
  isLast:          boolean;
  onMoveUp:        () => void;
  onMoveDown:      () => void;
  onDuplicate:     () => void;
  onRemove:        () => void;
  onChange:        (b: Block) => void;
  productMap:      Record<string, ComposerProduct>;
  products:        ComposerProduct[];
  loadingProducts: boolean;
}

function BlockShell(p: BlockShellProps) {
  const palette = BLOCK_PALETTE.find((x) => x.type === p.block.type);
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 flex items-center gap-1.5 flex-1">
          <span aria-hidden>{palette?.icon}</span>
          {palette?.label || p.block.type}
        </span>
        <div className="flex items-center gap-1">
          <IconButton onClick={p.onMoveUp}    disabled={p.isFirst} label="Move up">↑</IconButton>
          <IconButton onClick={p.onMoveDown}  disabled={p.isLast}  label="Move down">↓</IconButton>
          <IconButton onClick={p.onDuplicate}                       label="Duplicate">⎘</IconButton>
          <IconButton onClick={p.onRemove}    danger                label="Remove">×</IconButton>
        </div>
      </div>
      <div className="p-4">
        <BlockEditor
          block={p.block}
          onChange={p.onChange}
          products={p.products}
          productMap={p.productMap}
          loadingProducts={p.loadingProducts}
        />
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  danger,
  label,
}: {
  children:   React.ReactNode;
  onClick:    () => void;
  disabled?:  boolean;
  danger?:    boolean;
  label:      string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-colors ${
        disabled
          ? "text-white/15 cursor-not-allowed"
          : danger
            ? "text-white/40 hover:text-red-400 hover:bg-red-500/10"
            : "text-white/40 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Per-type editors ────────────────────────────────────────────────────────

function BlockEditor({
  block, onChange, products, productMap, loadingProducts,
}: {
  block:           Block;
  onChange:        (b: Block) => void;
  products:        ComposerProduct[];
  productMap:      Record<string, ComposerProduct>;
  loadingProducts: boolean;
}) {
  if (block.type === "hero") {
    return (
      <div className="space-y-3">
        <SmallInput label="Eyebrow" value={block.eyebrow} onChange={(v) => onChange({ ...block, eyebrow: v })} placeholder="♥   New drop" />
        <SmallInput label="Headline" value={block.headline} onChange={(v) => onChange({ ...block, headline: v })} placeholder="Three new pieces." big />
        <SmallTextarea label="Body" value={block.body} onChange={(v) => onChange({ ...block, body: v })} rows={3} placeholder="Optional supporting paragraph." />
      </div>
    );
  }

  if (block.type === "body") {
    return (
      <SmallTextarea label="Paragraph" value={block.text} onChange={(v) => onChange({ ...block, text: v })} rows={5} placeholder="Write something." />
    );
  }

  if (block.type === "quote") {
    return (
      <div className="space-y-3">
        <SmallTextarea label="Quote" value={block.text} onChange={(v) => onChange({ ...block, text: v })} rows={3} placeholder="A line worth pulling out." />
        <SmallInput label="Attribution" value={block.attribution || ""} onChange={(v) => onChange({ ...block, attribution: v })} placeholder="Optional" />
      </div>
    );
  }

  if (block.type === "products") {
    return (
      <div className="space-y-4">
        <SmallInput label="Heading (optional)" value={block.heading || ""} onChange={(v) => onChange({ ...block, heading: v })} placeholder="Newly released" />
        <SegmentedControl
          label="Columns"
          value={String(block.columns)}
          options={[{ v: "1", l: "1" }, { v: "2", l: "2" }, { v: "3", l: "3" }]}
          onChange={(v) => onChange({ ...block, columns: Number(v) as 1 | 2 | 3 })}
        />
        <ProductPicker
          selectedIds={block.productIds}
          onChange={(ids) => onChange({ ...block, productIds: ids })}
          products={products}
          productMap={productMap}
          loading={loadingProducts}
        />
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="space-y-3">
        <SmallInput label="Image URL" value={block.url} onChange={(v) => onChange({ ...block, url: v })} placeholder="https://..." />
        {block.url && (
          <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-white/[0.02] border border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.url} alt={block.alt || "preview"} className="w-full h-full object-cover" />
          </div>
        )}
        <SmallInput label="Alt text" value={block.alt} onChange={(v) => onChange({ ...block, alt: v })} placeholder="Describe the image for accessibility" />
        <SmallInput label="Caption (optional)" value={block.caption || ""} onChange={(v) => onChange({ ...block, caption: v })} placeholder="Optional" />
        <SmallInput label="Link URL (optional)" value={block.link || ""} onChange={(v) => onChange({ ...block, link: v })} placeholder="Wrap the image in this link" />
      </div>
    );
  }

  if (block.type === "cta") {
    return (
      <div className="space-y-3">
        <SmallInput label="Label" value={block.label} onChange={(v) => onChange({ ...block, label: v })} placeholder="View the drop" />
        <SmallInput label="URL" value={block.url} onChange={(v) => onChange({ ...block, url: v })} placeholder="https://lexxbrush.eu/..." />
        <SegmentedControl
          label="Style"
          value={block.style}
          options={[{ v: "solid", l: "Solid" }, { v: "outline", l: "Outline" }]}
          onChange={(v) => onChange({ ...block, style: v as "solid" | "outline" })}
        />
      </div>
    );
  }

  if (block.type === "divider") {
    return <p className="text-xs text-white/40">A thin separator line. No options.</p>;
  }

  if (block.type === "spacer") {
    return (
      <SegmentedControl
        label="Height"
        value={block.size}
        options={[{ v: "sm", l: "Small" }, { v: "md", l: "Medium" }, { v: "lg", l: "Large" }]}
        onChange={(v) => onChange({ ...block, size: v as "sm" | "md" | "lg" })}
      />
    );
  }

  return null;
}

// ─── Product picker ──────────────────────────────────────────────────────────

function ProductPicker({
  selectedIds, onChange, products, productMap, loading,
}: {
  selectedIds: string[];
  onChange:    (ids: string[]) => void;
  products:    ComposerProduct[];
  productMap:  Record<string, ComposerProduct>;
  loading:     boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q))
      .slice(0, 60);
  }, [products, query, selectedIds]);

  function add(id: string) {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
  }
  function removeAt(idx: number) {
    const next = selectedIds.slice();
    next.splice(idx, 1);
    onChange(next);
  }
  function moveAt(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= selectedIds.length) return;
    const next = selectedIds.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-white/40">
          Selected ({selectedIds.length})
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-[10px] uppercase tracking-wider text-white/50 hover:text-white"
        >
          {open ? "Done" : "Add products"}
        </button>
      </div>

      {/* Selected chips */}
      {selectedIds.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-lg py-6 text-center text-xs text-white/30">
          No products selected
        </div>
      ) : (
        <div className="space-y-1.5">
          {selectedIds.map((id, idx) => {
            const p = productMap[id];
            return (
              <div key={id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-lg px-2 py-2">
                <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                  {p?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/85 truncate">
                    {p?.name || <span className="text-red-400/70">Missing product</span>}
                  </div>
                  <div className="text-[11px] text-white/40">
                    {p ? `€${(p.priceCents / 100).toFixed(2)}` : id}
                    {p?.isSold && <span className="ml-2 text-amber-400/80">sold</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton onClick={() => moveAt(idx, -1)} disabled={idx === 0} label="Move up">↑</IconButton>
                  <IconButton onClick={() => moveAt(idx, 1)} disabled={idx === selectedIds.length - 1} label="Move down">↓</IconButton>
                  <IconButton onClick={() => removeAt(idx)} danger label="Remove">×</IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Picker drawer */}
      {open && (
        <div className="border border-white/10 rounded-lg bg-white/[0.02] p-3 space-y-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-md px-3 py-2 text-sm text-white outline-none"
            autoFocus
          />
          {loading ? (
            <div className="py-8 text-center text-xs text-white/30">Loading products…</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/30">
              {query ? "Nothing matches" : "All products already selected"}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => add(p.id)}
                  className="text-left bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/15 rounded-md p-2 transition-all group"
                >
                  <div className="relative w-full aspect-square rounded overflow-hidden bg-white/5 mb-2">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt="" fill sizes="120px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : null}
                    {p.isSold && (
                      <span className="absolute top-1 right-1 text-[9px] uppercase tracking-wider bg-black/60 text-amber-300 px-1.5 py-0.5 rounded">Sold</span>
                    )}
                  </div>
                  <div className="text-xs text-white/85 truncate">{p.name}</div>
                  <div className="text-[10px] text-white/40">€{(p.priceCents / 100).toFixed(2)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Small editor primitives ─────────────────────────────────────────────────

function SmallInput({
  label, value, onChange, placeholder, big,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  big?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-md px-3 py-2 text-white placeholder:text-white/20 outline-none transition-colors ${big ? "text-base font-semibold" : "text-sm"}`}
      />
    </label>
  );
}

function SmallTextarea({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white/[0.02] border border-white/10 focus:border-white/30 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none resize-y transition-colors"
      />
    </label>
  );
}

function SegmentedControl({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">{label}</div>
      <div className="inline-flex rounded-md border border-white/10 overflow-hidden bg-white/[0.02]">
        {options.map((o, i) => {
          const active = o.v === value;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                active ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              } ${i > 0 ? "border-l border-white/10" : ""}`}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Block palette config ────────────────────────────────────────────────────

const BLOCK_PALETTE: { type: BlockType; label: string; icon: string }[] = [
  { type: "hero",     label: "Hero",     icon: "✦" },
  { type: "body",     label: "Body",     icon: "¶" },
  { type: "products", label: "Products", icon: "▦" },
  { type: "image",    label: "Image",    icon: "▭" },
  { type: "quote",    label: "Quote",    icon: "❝" },
  { type: "cta",      label: "Button",   icon: "▶" },
  { type: "divider",  label: "Divider",  icon: "-" },
  { type: "spacer",   label: "Spacer",   icon: "↕" },
];
