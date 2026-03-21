"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CustomSelect from "@/components/ui/CustomSelect";

const CATEGORIES = ["tees", "hoodies", "pants", "bags", "accessories"];

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name_en: "",
    name_sk: "",
    description_en: "",
    description_sk: "",
    price: "",
    category: "tees",
    sizes: "",
    is_one_of_a_kind: true,
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");

  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImages(): Promise<string[]> {
    const token = await getToken();
    const urls: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setUploadProgress(`Uploading ${i + 1}/${imageFiles.length}...`);

      const formData = new FormData();
      formData.append("file", file);

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
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages();
      }

      const slug = form.name_en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const priceInCents = Math.round(parseFloat(form.price) * 100);
      const sizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean);

      const token = await getToken();
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          table: "products",
          data: {
            slug,
            name_en: form.name_en,
            name_sk: form.name_sk,
            description_en: form.description_en,
            description_sk: form.description_sk,
            price: priceInCents,
            images: imageUrls,
            category: form.category,
            sizes: sizes.length > 0 ? sizes : null,
            is_one_of_a_kind: form.is_one_of_a_kind,
          },
        }),
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);
      router.push("/admin/products");
    } catch (err: any) {
      alert("Error saving product: " + err.message);
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors";
  const labelClass = "block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2";

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Add Product</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name (English)</label>
            <input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className={inputClass} placeholder="Acid Hearts Tee" />
          </div>
          <div>
            <label className={labelClass}>Name (Slovak)</label>
            <input required value={form.name_sk} onChange={(e) => setForm({ ...form, name_sk: e.target.value })} className={inputClass} placeholder="Acid Hearts Tričko" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Description (English)</label>
            <textarea rows={3} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className={`${inputClass} resize-none`} placeholder="Hand-airbrushed one-of-a-kind piece..." />
          </div>
          <div>
            <label className={labelClass}>Description (Slovak)</label>
            <textarea rows={3} value={form.description_sk} onChange={(e) => setForm({ ...form, description_sk: e.target.value })} className={`${inputClass} resize-none`} placeholder="Ručne airbrushovaný unikátny kúsok..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Price (€)</label>
            <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} placeholder="189" />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <CustomSelect
              value={form.category}
              onChange={(val) => setForm({ ...form, category: val })}
              options={CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Sizes (comma-separated)</label>
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

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setForm({ ...form, is_one_of_a_kind: !form.is_one_of_a_kind })} className={`w-10 h-5 rounded-full transition-colors ${form.is_one_of_a_kind ? "bg-green-500" : "bg-white/10"}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${form.is_one_of_a_kind ? "translate-x-5" : "translate-x-0"}`} />
          </button>
          <span className="text-sm text-white/50">One of a kind</span>
        </div>

        {/* Image Upload */}
        <div>
          <label className={labelClass}>Images</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-500">×</button>
              </div>
            ))}
          </div>
          <label
            className="inline-flex items-center gap-2 px-4 py-3 border border-dashed border-white/10 rounded-lg text-sm text-white/30 hover:text-white/50 hover:border-white/20 cursor-pointer transition-colors"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-white/30"); }}
            onDragLeave={(e) => e.currentTarget.classList.remove("border-white/30")}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-white/30"); handleFileSelect(e.dataTransfer.files); }}
          >
            Drop images here or click to browse
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
          </label>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
            {saving ? uploadProgress || "Saving..." : "Save Product"}
          </button>
          <button type="button" onClick={() => router.back()} className="text-sm text-white/30 hover:text-white/50 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
