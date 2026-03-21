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
        <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 w-full max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-bold uppercase tracking-widest text-white mb-2">
            {t("auth.account")}
          </h1>
          <p className="text-white/50">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors uppercase tracking-widest text-xs font-bold"
        >
          {t("auth.signOut")}
        </button>
      </div>

      <div className="space-y-8 mb-16">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-widest uppercase text-chrome border-b border-white/10 pb-4">
          {t("auth.myFavorites")}
        </h2>

        {favorites.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <svg className="w-8 h-8 text-white/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-white/40 mb-4">{t("auth.noFavorites")}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-white/90 transition-colors text-sm"
            >
              {t("auth.startShopping")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {favoriteProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-widest uppercase text-chrome border-b border-white/10 pb-4">
          {t("auth.orderHistory")}
        </h2>

        {loadingOrders ? (
          <div className="w-6 h-6 border-t-2 border-white/50 rounded-full animate-spin"></div>
        ) : orders.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-white/40 mb-4">{t("auth.noOrders")}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-white/90 transition-colors text-sm"
            >
              {t("auth.startShopping")}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
              return (
                <div
                  key={order.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 transition-colors hover:bg-white/[0.07]"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-sm text-white/40 font-mono mb-1">
                        Order #{order.id.split("-")[0]}
                      </p>
                      <p className="text-white">
                        {new Date(order.created_at).toLocaleDateString(locale === "sk" ? "sk-SK" : "en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-white/40 mb-1">{t("auth.total")}</p>
                      <p className="text-lg font-bold text-white">&euro;{order.amount?.toFixed(2) || order.total?.toFixed(2)}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-white/40 mb-1">{t("auth.status")}</p>
                      <span
                        className={`inline-block px-3 py-1 text-xs rounded-full uppercase tracking-wider font-bold ${
                          order.status === "paid" || order.status === "shipped"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-lg overflow-hidden relative flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name.en || "Product image"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.product.name.en}</p>
                          <p className="text-sm text-white/50">
                            {item.size ? `Size: ${item.size}` : ""} {item.quantity > 1 ? `x${item.quantity}` : ""}
                          </p>
                        </div>
                        <p className="text-white">&euro;{(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
