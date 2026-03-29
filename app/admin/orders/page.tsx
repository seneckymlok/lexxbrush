"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getTrackingUrl } from "@/lib/packeta";

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
  delivery_type: string | null;
  packeta_packet_id: string | null;
  packeta_tracking_number: string | null;
  created_at: string;
}

const STATUSES = ["pending", "paid", "shipped", "delivered"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  async function createPacketForOrder(orderId: string) {
    setActionLoading(orderId);
    try {
      const res = await adminFetch("/api/packeta", {
        method: "POST",
        body: JSON.stringify({ action: "create", orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create packet");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, packeta_packet_id: data.packetId } : o))
      );
      showToast(`Packeta packet created: ${data.packetId}`);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  }

  function getDeliveryDisplay(order: Order) {
    const addr = order.shipping_address;
    if (!addr) return null;

    if (order.delivery_type === "pickup" && addr.point) {
      return {
        label: "Pickup Point",
        detail: `${addr.point.name} — ${addr.point.street}, ${addr.point.city} ${addr.point.zip}`,
      };
    }
    if (order.delivery_type === "home_delivery" && addr.address) {
      return {
        label: "Home Delivery",
        detail: `${addr.address.street} ${addr.address.houseNumber}, ${addr.address.city} ${addr.address.postcode}, ${addr.address.country?.toUpperCase()}`,
      };
    }
    // Legacy orders with old format
    if (addr.line1) {
      return {
        label: "Address",
        detail: `${addr.line1}${addr.city ? `, ${addr.city}` : ""}${addr.country ? `, ${addr.country}` : ""}`,
      };
    }
    return null;
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
          {orders.map((order) => {
            const delivery = getDeliveryDisplay(order);

            return (
              <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white/70">{order.customer_email || "Unknown"}</p>
                      {order.delivery_type && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          order.delivery_type === "pickup"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}>
                          {order.delivery_type === "pickup" ? "Pickup" : "HD"}
                        </span>
                      )}
                    </div>
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

                    {/* Delivery info */}
                    {delivery && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">{delivery.label}</p>
                        <p className="text-xs text-white/40">{delivery.detail}</p>
                      </div>
                    )}

                    {/* Packeta info */}
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Packeta</p>
                      {order.packeta_packet_id ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">Packet ID:</span>
                            <code className="text-xs text-white/60 bg-white/5 px-1.5 py-0.5 rounded">{order.packeta_packet_id}</code>
                            <a
                              href={getTrackingUrl(order.packeta_packet_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 hover:text-blue-300 underline underline-offset-2"
                            >
                              Track
                            </a>
                          </div>
                          {order.packeta_tracking_number && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white/40">Courier #:</span>
                              <code className="text-xs text-white/60 bg-white/5 px-1.5 py-0.5 rounded">{order.packeta_tracking_number}</code>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => createPacketForOrder(order.id)}
                          disabled={actionLoading === order.id}
                          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded px-3 py-1.5 text-white/60 hover:text-white transition-all disabled:opacity-50"
                        >
                          {actionLoading === order.id ? "Creating..." : "Create Packeta Packet"}
                        </button>
                      )}
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
