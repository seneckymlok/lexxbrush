"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["tees", "hoodies", "pants", "bags", "accessories"];

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name_en: "", name_sk: "", description_en: "", description_sk: "",
    price: "", category: "tees", sizes: "",
    is_one_of_a_kind: true, is_sold: false, images: [""],
  });

  useEffect(() => {
    fetch(`/api/admin?table=products&id=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            name_en: data.name_en, name_sk: data.name_sk,
            description_en: data.description_en || "", description_sk: data.description_sk || "",
            price: (data.price / 100).toString(), category: data.category,
            sizes: data.sizes?.join(", ") || "",
            is_one_of_a_kind: data.is_one_of_a_kind, is_sold: data.is_sold,
            images: data.images || [""],
          });
        }
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const priceInCents = Math.round(parseFloat(form.price) * 100);
      const sizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean);
      const slug = form.name_en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const token = await getToken();

      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          table: "products", id: productId,
          data: {
            slug, name_en: form.name_en, name_sk: form.name_sk,
            description_en: form.description_en, description_sk: form.description_sk,
            price: priceInCents, images: form.images.filter(Boolean),
            category: form.category, sizes: sizes.length > 0 ? sizes : null,
            is_one_of_a_kind: form.is_one_of_a_kind, is_sold: form.is_sold,
          },
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      router.push("/admin/products");
    } catch (err: any) {
      alert("Error: " + err.message);
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors";
  const labelClass = "block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Loading...</div></div>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Edit Product</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Name (English)</label><input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Name (Slovak)</label><input required value={form.name_sk} onChange={(e) => setForm({ ...form, name_sk: e.target.value })} className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Description (EN)</label><textarea rows={3} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className={`${inputClass} resize-none`} /></div>
          <div><label className={labelClass}>Description (SK)</label><textarea rows={3} value={form.description_sk} onChange={(e) => setForm({ ...form, description_sk: e.target.value })} className={`${inputClass} resize-none`} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className={labelClass}>Price (€)</label><input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>{CATEGORIES.map((c) => (<option key={c} value={c} className="bg-[#1a1a1a]">{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}</select></div>
          <div><label className={labelClass}>Sizes</label><input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className={inputClass} placeholder="S, M, L, XL" /></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm({ ...form, is_one_of_a_kind: !form.is_one_of_a_kind })} className={`w-10 h-5 rounded-full transition-colors ${form.is_one_of_a_kind ? "bg-green-500" : "bg-white/10"}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${form.is_one_of_a_kind ? "translate-x-5" : ""}`} /></button>
            <span className="text-sm text-white/50">One of a kind</span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm({ ...form, is_sold: !form.is_sold })} className={`w-10 h-5 rounded-full transition-colors ${form.is_sold ? "bg-red-500" : "bg-white/10"}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${form.is_sold ? "translate-x-5" : ""}`} /></button>
            <span className="text-sm text-white/50">Sold</span>
          </div>
        </div>
        <div>
          <label className={labelClass}>Image URL</label>
          <input value={form.images[0] || ""} onChange={(e) => setForm({ ...form, images: e.target.value ? [e.target.value] : [""] })} className={inputClass} placeholder="/products/tshirt1.png" />
        </div>
        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">{saving ? "Saving..." : "Update Product"}</button>
          <button type="button" onClick={() => router.back()} className="text-sm text-white/30 hover:text-white/50 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
