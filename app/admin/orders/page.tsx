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

interface Order {
  id: string;
  stripe_session_id: string;
  customer_email: string;
  items: Array<{ name: string; price: number; qty: number; size?: string }>;
  total: number;
  status: string;
  shipping_address: any;
  created_at: string;
}

const STATUSES = ["pending", "paid", "shipped", "delivered"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    adminFetch("/api/admin?table=orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    try {
      const res = await adminFetch("/api/admin", {
        method: "PATCH",
        body: JSON.stringify({ table: "orders", id, data: { status } }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

      if (status === "shipped") {
        showToast("Order marked as Shipped. Notification email sent to customer.");
      } else {
        showToast(`Order status updated to ${status}`);
      }
    } catch (err: any) {
      showToast(err.message || "Error updating status", "error");
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Loading orders...</div></div>;

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 ${
            toast.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

      <h1 className="text-xl font-semibold text-white mb-8">Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-16 text-center"><p className="text-white/30 text-sm">No orders yet</p></div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70">{order.customer_email || "Unknown"}</p>
                  <p className="text-xs text-white/30 mt-0.5">{new Date(order.created_at).toLocaleString()} · {order.items?.length || 0} item(s)</p>
                </div>
                <p className="text-sm font-medium text-white/80">€{(order.total / 100).toFixed(2)}</p>
                <select value={order.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateStatus(order.id, e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/60 outline-none">
                  {STATUSES.map((s) => (<option key={s} value={s} className="bg-[#1a1a1a]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                </select>
                <span className="text-white/20 text-xs">{expandedId === order.id ? "▼" : "▶"}</span>
              </button>
              {expandedId === order.id && (
                <div className="px-5 pb-4 border-t border-white/5 pt-3">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Items</p>
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-sm text-white/60">{item.name} {item.size && `(${item.size})`} × {item.qty}</span>
                      <span className="text-sm text-white/40">€{((item.price * item.qty) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.shipping_address && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">Shipping</p>
                      <p className="text-xs text-white/40">{order.shipping_address.line1}{order.shipping_address.city && `, ${order.shipping_address.city}`}{order.shipping_address.country && `, ${order.shipping_address.country}`}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
