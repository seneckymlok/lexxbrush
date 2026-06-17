"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

async function adminFetch(url: string, options?: RequestInit) {
  const token = await getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

interface Product {
  id: string;
  slug: string;
  name_en: string;
  price: number;
  images: string[];
  category: string;
  is_one_of_a_kind: boolean;
  is_sold: boolean;
  released_at: string | null;
  sort_order: number | null;
  stock: number | null;
}

/** Future release_at = the drop is scheduled and currently hidden from the site. */
function scheduledLabel(releasedAt: string | null): string | null {
  if (!releasedAt) return null;
  const d = new Date(releasedAt);
  if (isNaN(d.getTime()) || d.getTime() <= Date.now()) return null;
  return d.toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/** Same order the public shop uses: lowest sort_order first, null floats to top. */
function byOrder(a: Product, b: Product): number {
  return (a.sort_order ?? -1) - (b.sort_order ?? -1);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    adminFetch("/api/admin?table=products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? [...data].sort(byOrder) : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function toggleSold(id: string, currentlySold: boolean) {
    await adminFetch("/api/admin", {
      method: "PATCH",
      body: JSON.stringify({ table: "products", id, data: { is_sold: !currentlySold } }),
    });
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_sold: !currentlySold } : p)));
  }

  async function deleteProduct(id: string) {
    if (!confirm("Naozaj chceš vymazať tento produkt?")) return;
    await adminFetch(`/api/admin?table=products&id=${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function openPreview() {
    const token = await getToken();
    // Enable draft mode for this browser (sets the bypass cookie), then open
    // the live site in a new tab where scheduled drops are now visible.
    await fetch("/api/admin/preview?on=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    window.open("/", "_blank");
  }

  const hasScheduled = products.some(
    (p) => p.released_at && new Date(p.released_at).getTime() > Date.now(),
  );

  async function persistOrder(list: Product[]) {
    setSavingOrder(true);
    try {
      await adminFetch("/api/admin/reorder", {
        method: "POST",
        body: JSON.stringify({ ids: list.map((p) => p.id) }),
      });
    } catch (err) {
      console.error("Reorder failed:", err);
    } finally {
      setSavingOrder(false);
    }
  }

  function handleDrop(target: number) {
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === null || from === target) return;

    setProducts((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      persistOrder(next);
      return next;
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Načítavam...</div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold text-white">Produkty</h1>
        <div className="flex items-center gap-2">
          {hasScheduled && (
            <button
              onClick={openPreview}
              title="Otvoriť web s naplánovanými produktmi v novom okne"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-amber-400/40 text-amber-300 text-sm font-medium rounded-lg hover:bg-amber-400/10 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
              </svg>
              Náhľad
            </button>
          )}
          <Link href="/admin/products/new" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors">+ Pridať produkt</Link>
        </div>
      </div>

      {products.length > 1 && (
        <p className="text-xs text-white/30 mb-6 flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" />
            <circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" />
          </svg>
          Potiahni za úchyt pre zmenu poradia na webe
          {savingOrder && <span className="text-amber-400/70">· ukladám…</span>}
        </p>
      )}

      {products.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-16 text-center">
          <p className="text-white/30 text-sm mb-4">Zatiaľ žiadne produkty</p>
          <Link href="/admin/products/new" className="text-white/60 hover:text-white text-sm underline">Pridať prvý produkt</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map((product, i) => (
            <div
              key={product.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => { e.preventDefault(); if (overIndex !== i) setOverIndex(i); }}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              className={`bg-white/[0.02] border rounded-xl px-3 py-4 sm:px-5 flex items-center gap-3 sm:gap-4 transition-all ${
                dragIndex === i ? "opacity-40" : "hover:bg-white/[0.03]"
              } ${overIndex === i && dragIndex !== null && dragIndex !== i ? "border-amber-400/50" : "border-white/5"}`}
            >
              {/* Drag handle */}
              <div
                className="flex-shrink-0 text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing transition-colors"
                title="Potiahni pre zmenu poradia"
                aria-label="Presunúť"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="9" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" />
                  <circle cx="15" cy="6" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                </svg>
              </div>

              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt="" fill sizes="56px" className="object-contain" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10 text-xs">Bez obr.</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">{product.name_en}</p>
                <p className="text-xs text-white/30 mt-0.5">{product.category} · €{(product.price / 100).toFixed(0)}{product.is_one_of_a_kind && " · 1/1"}</p>
              </div>
              {scheduledLabel(product.released_at) && (
                <span
                  className="hidden sm:inline px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium bg-amber-500/10 text-amber-400 whitespace-nowrap"
                  title="Naplánovaný drop, skrytý na webe do tohto času"
                >
                  Drop · {scheduledLabel(product.released_at)}
                </span>
              )}
              {!product.is_one_of_a_kind && product.stock != null && (
                <span
                  className={`hidden sm:inline px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium whitespace-nowrap ${
                    product.stock <= 0
                      ? "bg-red-500/10 text-red-400"
                      : product.stock <= 3
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-white/5 text-white/40"
                  }`}
                  title="Počet kusov na sklade"
                >
                  {product.stock <= 0 ? "Vypredané" : `${product.stock} ks`}
                </span>
              )}
              <button onClick={() => toggleSold(product.id, product.is_sold)} className={`px-3 py-1 rounded text-[10px] uppercase tracking-wider font-medium transition-colors ${product.is_sold ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"}`}>
                {product.is_sold ? "Predané" : "Dostupné"}
              </button>
              <Link href={`/admin/products/${product.id}/edit`} className="text-xs text-white/30 hover:text-white/60 transition-colors">Upraviť</Link>
              <button onClick={() => deleteProduct(product.id)} className="text-xs text-red-400/40 hover:text-red-400 transition-colors">Vymazať</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
