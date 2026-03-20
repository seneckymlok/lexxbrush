"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "👕" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/custom-orders", label: "Custom Orders", icon: "🎨" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session && pathname !== "/admin/login") {
        router.push("/admin/login");
        return;
      }

      if (session) {
        setAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && pathname !== "/admin/login") {
        router.push("/admin/login");
      }
      setAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  // Login page — no layout chrome
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0f0f0f] border-r border-white/5 flex flex-col fixed h-full">
        <div className="p-5 border-b border-white/5">
          <Link href="/" target="_blank" className="block">
            <img src="/logo.png" alt="Lexxbrush" className="h-6 opacity-50 hover:opacity-80 transition-opacity" />
          </Link>
          <p className="text-[10px] text-white/25 mt-1.5 uppercase tracking-wider">Admin</p>
        </div>

        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "text-white bg-white/5"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/admin/login");
            }}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
