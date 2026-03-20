"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

async function adminFetch(url: string, options?: RequestInit) {
  const token = await getToken();
  return fetch(url, { ...options, headers: { ...options?.headers, "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
}

interface CustomOrder {
  id: string;
  name: string;
  email: string;
  garment: string;
  description: string;
  budget: string;
  status: string;
  created_at: string;
}

const STATUSES = ["new", "reviewed", "in_progress", "done"];
const STATUS_LABELS: Record<string, string> = { new: "New", reviewed: "Reviewed", in_progress: "In Progress", done: "Done" };

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/api/admin?table=custom_orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await adminFetch("/api/admin", {
      method: "PATCH",
      body: JSON.stringify({ table: "custom_orders", id, data: { status } }),
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Loading...</div></div>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Custom Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-16 text-center"><p className="text-white/30 text-sm">No custom order requests yet</p></div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const isNew = order.status === "new";
            return (
              <div key={order.id} className={`bg-white/[0.02] border rounded-xl overflow-hidden ${isNew ? "border-pink-500/20" : "border-white/5"}`}>
                <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors">
                  {isNew && <div className="w-2 h-2 rounded-full bg-pink-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70">{order.name}</p>
                    <p className="text-xs text-white/30 mt-0.5">{order.email} · {order.garment}{order.budget && ` · ${order.budget}`}</p>
                  </div>
                  <p className="text-xs text-white/30">{new Date(order.created_at).toLocaleDateString()}</p>
                  <select value={order.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateStatus(order.id, e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/60 outline-none">
                    {STATUSES.map((s) => (<option key={s} value={s} className="bg-[#1a1a1a]">{STATUS_LABELS[s]}</option>))}
                  </select>
                  <span className="text-white/20 text-xs">{expandedId === order.id ? "▼" : "▶"}</span>
                </button>
                {expandedId === order.id && (
                  <div className="px-5 pb-4 border-t border-white/5 pt-3">
                    <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{order.description}</p>
                    <div className="mt-3">
                      <a href={`mailto:${order.email}?subject=Your Custom Order Request - Lexxbrush`} className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors">Reply via Email</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
