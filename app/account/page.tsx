"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useFavorites } from "@/components/providers/FavoritesProvider";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/products";
import { ProductCard } from "@/components/ui/ProductCard";

export default function AccountPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { favorites } = useFavorites();
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    getProducts().then(setAllProducts);
  }, []);

  const favoriteProducts = allProducts.filter((p) => favorites.includes(p.id));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoadingOrders(false);
    };

    fetchOrders();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen pt-32 pb-24 flex items-center justify-center">
        <div className="w-6 h-6 border-t border-white/30 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-5 md:px-10 w-full max-w-[1200px] mx-auto">
      {/* Account Header — editorial */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold uppercase tracking-[0.04em] text-white">
              {t("auth.account")}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <p className="text-white/30 text-sm font-mono">{user.email}</p>
            <button
              onClick={signOut}
              className="group flex items-center gap-2 text-chrome hover:text-white transition-colors duration-300"
              aria-label="Sign out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="font-[family-name:var(--font-display)] text-xs tracking-[0.15em] uppercase hidden md:inline">
                {t("auth.signOut")}
              </span>
            </button>
          </div>
        </div>

        <div className="w-full h-[1px] bg-white/[0.06] mt-6" />
      </div>

      {/* Favorites Section */}
      <section className="mb-20">
        <div className="flex items-baseline gap-4 mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[0.1em] uppercase text-white">
            {t("auth.myFavorites")}
          </h2>
          {favorites.length > 0 && (
            <span className="font-[family-name:var(--font-accent)] text-sm italic text-chrome">
              {favorites.length}
            </span>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="border border-white/[0.06] py-16 text-center">
            {/* Empty state spray can */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-white/10">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p className="text-white/25 text-sm mb-6">{t("auth.noFavorites")}</p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300 font-[family-name:var(--font-display)] tracking-[0.1em] uppercase"
            >
              {t("auth.startShopping")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {favoriteProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* Orders Section */}
      <section>
        <div className="flex items-baseline gap-4 mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[0.1em] uppercase text-white">
            {t("auth.orderHistory")}
          </h2>
          {orders.length > 0 && (
            <span className="font-[family-name:var(--font-accent)] text-sm italic text-chrome">
              {orders.length}
            </span>
          )}
        </div>

        {loadingOrders ? (
          <div className="py-12 flex justify-center">
            <div className="w-5 h-5 border-t border-white/30 rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-white/[0.06] py-16 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-white/10">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <p className="text-white/25 text-sm mb-6">{t("auth.noOrders")}</p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white border-b border-white/20 hover:border-white/50 pb-px transition-all duration-300 font-[family-name:var(--font-display)] tracking-[0.1em] uppercase"
            >
              {t("auth.startShopping")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="space-y-[1px]">
            {orders.map((order) => {
              const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
              const isExpanded = expandedOrder === order.id;

              return (
                <div key={order.id} className="border border-white/[0.06] transition-colors duration-300 hover:border-white/[0.1]">
                  {/* Order header — clickable */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-6 flex-wrap">
                      <p className="text-xs text-white/30 font-mono">
                        #{order.id.split("-")[0]}
                      </p>
                      <p className="text-sm text-white/60">
                        {new Date(order.created_at).toLocaleDateString(locale === "sk" ? "sk-SK" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <span
                        className={`text-[10px] font-[family-name:var(--font-display)] tracking-[0.15em] uppercase px-2 py-0.5 ${
                          order.status === "paid" || order.status === "shipped"
                            ? "text-emerald-400/80 bg-emerald-500/[0.06]"
                            : "text-amber-400/80 bg-amber-500/[0.06]"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-sm font-bold text-white">
                        &euro;{order.amount?.toFixed(2) || order.total?.toFixed(2)}
                      </p>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-white/20 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded order items */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/[0.04]">
                      <div className="space-y-4">
                        {items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/[0.03] overflow-hidden relative flex-shrink-0">
                              {item.product.images?.[0] ? (
                                <Image
                                  src={item.product.images[0]}
                                  alt={item.product.name?.en || "Product"}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-white/5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{item.product.name?.en || item.product.name}</p>
                              <p className="text-xs text-white/30 mt-0.5">
                                {item.size ? `${item.size}` : ""}{item.size && item.quantity > 1 ? " · " : ""}{item.quantity > 1 ? `×${item.quantity}` : ""}
                              </p>
                            </div>
                            <p className="text-sm text-white/60 font-mono">
                              &euro;{(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
