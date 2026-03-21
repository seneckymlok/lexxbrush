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
  const [uploadProgress, setUploadProgress] = useState("");
  const [form, setForm] = useState({
    name_en: "", name_sk: "", description_en: "", description_sk: "",
    price: "", category: "tees", sizes: "",
    is_one_of_a_kind: true, is_sold: false, images: [] as string[],
  });

  // New files to upload
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

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
            images: data.images || [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, [productId]);

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files);
    setNewFiles((prev) => [...prev, ...added]);
    setNewPreviews((prev) => [...prev, ...added.map((f) => URL.createObjectURL(f))]);
  }

  function removeExistingImage(index: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  function removeNewImage(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function reorderExisting(from: number, to: number) {
    setForm((prev) => {
      const imgs = [...prev.images];
      const [moved] = imgs.splice(from, 1);
      imgs.splice(to, 0, moved);
      return { ...prev, images: imgs };
    });
  }

  async function uploadNewImages(): Promise<string[]> {
    const token = await getToken();
    const urls: string[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      setUploadProgress(`Uploading ${i + 1}/${newFiles.length}...`);
      const formData = new FormData();
      formData.append("file", newFiles[i]);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (result.url) {
        urls.push(result.url);
      } else {
        console.error("Upload failed:", result.error);
      }
    }

    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Upload any new files first
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        uploadedUrls = await uploadNewImages();
      }

      const allImages = [...form.images, ...uploadedUrls].filter(Boolean);

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
            price: priceInCents, images: allImages,
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
          <div><label className={labelClass}>Sizes</label>
            {(() => {
              const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
              const selectedSizes = form.sizes.split(",").map(s => s.trim()).filter(Boolean);
              const toggleSize = (size: string) => {
                let updated;
                if (size === "One Size") {
                  updated = selectedSizes.includes("One Size") ? [] : ["One Size"];
                } else {
                  updated = selectedSizes.includes(size)
                    ? selectedSizes.filter(s => s !== size)
                    : [...selectedSizes.filter(s => s !== "One Size"), size];
                }
                setForm({ ...form, sizes: updated.join(", ") });
              };
              return (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SIZES.map(size => (
                      <button key={size} type="button" onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          selectedSizes.includes(size)
                            ? "bg-white text-black border-white"
                            : "bg-white/5 text-white/40 border-white/10 hover:border-white/25 hover:text-white/60"
                        }`}>
                        {size}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Custom size, press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !selectedSizes.includes(val)) {
                            setForm({ ...form, sizes: [...selectedSizes, val].join(", ") });
                          }
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                  </div>
                  {selectedSizes.filter(s => !PRESET_SIZES.includes(s)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSizes.filter(s => !PRESET_SIZES.includes(s)).map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white/60 text-xs rounded-md">
                          {s}
                          <button type="button" onClick={() => toggleSize(s)} className="text-white/30 hover:text-white/60">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
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

        {/* Images section */}
        <div>
          <label className={labelClass}>Images</label>

          {/* Existing images */}
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {form.images.map((url, i) => (
                <div key={`existing-${i}`} className="relative group">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                  {/* Controls overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => reorderExisting(i, i - 1)}
                        className="w-6 h-6 bg-white/20 rounded text-white text-xs flex items-center justify-center hover:bg-white/40"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="w-6 h-6 bg-red-500/80 rounded text-white text-xs flex items-center justify-center hover:bg-red-500"
                      title="Remove"
                    >
                      ×
                    </button>
                    {i < form.images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => reorderExisting(i, i + 1)}
                        className="w-6 h-6 bg-white/20 rounded text-white text-xs flex items-center justify-center hover:bg-white/40"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                  </div>
                  {i === 0 && (
                    <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 bg-green-500 text-[9px] text-white font-bold rounded">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New images to upload */}
          {newPreviews.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/5 border border-dashed border-cyan/30">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                  <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 bg-cyan/80 text-[9px] text-white font-bold rounded">
                    New
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <label
            className="inline-flex items-center gap-2 px-4 py-3 border border-dashed border-white/10 rounded-lg text-sm text-white/30 hover:text-white/50 hover:border-white/20 cursor-pointer transition-colors"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-white/30"); }}
            onDragLeave={(e) => e.currentTarget.classList.remove("border-white/30")}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-white/30"); handleFileSelect(e.dataTransfer.files); }}
          >
            + Add more images
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
          </label>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">{saving ? uploadProgress || "Saving..." : "Update Product"}</button>
          <button type="button" onClick={() => router.back()} className="text-sm text-white/30 hover:text-white/50 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
