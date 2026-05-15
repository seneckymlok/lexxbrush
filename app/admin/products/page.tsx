"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/api/admin?table=products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Načítavam...</div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-white">Produkty</h1>
        <Link href="/admin/products/new" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors">+ Pridať produkt</Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-16 text-center">
          <p className="text-white/30 text-sm mb-4">Zatiaľ žiadne produkty</p>
          <Link href="/admin/products/new" className="text-white/60 hover:text-white text-sm underline">Pridať prvý produkt</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map((product) => (
            <div key={product.id} className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4 flex items-center gap-4 hover:bg-white/[0.03] transition-colors">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10 text-xs">Bez obr.</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">{product.name_en}</p>
                <p className="text-xs text-white/30 mt-0.5">{product.category} · €{(product.price / 100).toFixed(0)}{product.is_one_of_a_kind && " · 1/1"}</p>
              </div>
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
