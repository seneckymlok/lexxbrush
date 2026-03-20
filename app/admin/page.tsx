"use client";

import { useEffect, useState } from "react";
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

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingCustomOrders: number;
  recentOrders: Array<{
    id: string;
    customer_email: string;
    total: number;
    status: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/api/admin?table=stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/30 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Revenue" value={`€${((stats?.totalRevenue || 0) / 100).toFixed(0)}`} sub="Total paid" />
        <StatCard label="Orders" value={String(stats?.totalOrders || 0)} sub="All time" />
        <StatCard label="Products" value={String(stats?.totalProducts || 0)} sub="In catalog" />
        <StatCard label="Custom Requests" value={String(stats?.pendingCustomOrders || 0)} sub="Pending review" highlight={stats?.pendingCustomOrders ? stats.pendingCustomOrders > 0 : false} />
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-medium text-white/70">Recent Orders</h2>
        </div>
        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-[11px] text-white/30 uppercase tracking-wider border-b border-white/5">
                <th className="text-left px-5 py-3 font-medium">Customer</th>
                <th className="text-left px-5 py-3 font-medium">Total</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-sm text-white/70">{order.customer_email || "—"}</td>
                  <td className="px-5 py-3 text-sm text-white/70">€{(order.total / 100).toFixed(2)}</td>
                  <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-5 py-3 text-sm text-white/40 text-right">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-white/20">
            No orders yet. They&apos;ll appear here once customers start buying.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-4">
      <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${highlight ? "text-pink-400" : "text-white"}`}>{value}</p>
      <p className="text-[11px] text-white/20 mt-1">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400",
    paid: "bg-green-500/10 text-green-400",
    shipped: "bg-blue-500/10 text-blue-400",
    delivered: "bg-white/5 text-white/50",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}
