"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Image from "next/image";
import Link from "next/link";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { locale, t } = useLanguage();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundOrder, setNotFoundOrder] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error || !data) {
        setNotFoundOrder(true);
      } else {
        setOrder(data);
      }
      setLoading(false);
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-24 flex items-center justify-center">
        <div className="w-6 h-6 border-t border-white/30 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFoundOrder || !order) {
    return (
      <div className="min-h-screen pt-32 pb-24 flex flex-col items-center justify-center px-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text mb-4">
          Order Not Found
        </h1>
        <p className="text-white/40 mb-8 text-center max-w-sm">This order does not exist or the link is invalid.</p>
        <Link href="/" className="px-8 py-4 bg-white text-black text-sm font-bold rounded-full hover:bg-white/90 transition-colors">
          {t("product.backToShop")}
        </Link>
      </div>
    );
  }

  let items: any[] = [];
  try {
    const raw = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    items = Array.isArray(raw) ? raw : [];
  } catch {
    items = [];
  }

  const shippingData = order.shipping_address ? (typeof order.shipping_address === "string" ? JSON.parse(order.shipping_address) : order.shipping_address) : null;
  const isPickup = order.delivery_type === "pickup";

  return (
    <div className="min-h-screen pt-28 pb-24 px-5 md:px-10 w-full max-w-3xl mx-auto">
      <div className="mb-12 text-center md:text-left">
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-extrabold tracking-tight uppercase chrome-text">
          {t("checkout.title") || "Order Details"}
        </h1>
        <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-3 mx-auto md:mx-0" />
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden p-6 md:p-10 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-white/[0.06]">
          <div>
            <p className="text-xs font-mono text-white/40 uppercase mb-1">Order No.</p>
            <p className="text-lg text-white font-mono">{order.id.split("-")[0]}</p>
          </div>
          <div className="md:text-right">
            <p className="text-xs font-mono text-white/40 uppercase mb-1">Date</p>
            <p className="text-sm text-white/80">
              {new Date(order.created_at).toLocaleDateString(locale === "sk" ? "sk-SK" : "en-US", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-xs font-mono text-white/40 uppercase mb-1">{t("auth.status")}</p>
            <span className={`inline-block text-xs font-[family-name:var(--font-display)] tracking-[0.15em] uppercase px-3 py-1 rounded-full ${
                order.status === "paid" || order.status === "shipped"
                  ? "text-emerald-400 bg-emerald-500/[0.1]"
                  : "text-amber-400 bg-amber-500/[0.1]"
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] uppercase text-chrome-bright">
            {t("checkout.orderSummary")}
          </h2>
          {items.map((item: any, idx: number) => {
            const name      = item.name ?? item.product?.name_en ?? item.product?.name?.en ?? item.product?.name ?? "Product";
            const price     = item.price ?? item.product?.price ?? 0;
            const quantity  = item.quantity ?? item.qty ?? item.q ?? 1;
            const size      = item.size ?? item.s ?? null;
            const imgSrc    = item.images?.[0] ?? item.product?.images?.[0] ?? null;
            const lineTotal = (price * quantity) / 100;

            return (
              <div key={idx} className="flex items-center gap-4 py-4 border-b border-white/[0.04] last:border-0">
                <div className="w-16 h-16 bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden relative flex-shrink-0">
                  {imgSrc ? (
                    <Image src={imgSrc} alt={name} fill sizes="64px" className="object-contain" />
                  ) : (
                    <div className="w-full h-full bg-white/5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base text-white truncate">{name}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {size ? `${size}` : ""}{size && quantity > 1 ? " - " : ""}{quantity > 1 ? `x${quantity}` : ""}
                  </p>
                </div>
                <p className="text-base text-white/80 font-mono">
                  &euro;{lineTotal.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-10 pt-8 border-t border-white/[0.06]">
          {shippingData && (
            <div className="flex-1">
              <h2 className="font-[family-name:var(--font-display)] text-xs tracking-[0.2em] uppercase text-chrome-bright mb-4">
                {t("checkout.shipping")}
              </h2>
              <div className="text-sm text-white/50 leading-relaxed">
                <p className="text-white/80 mb-1">{isPickup ? "Packeta Pickup Point" : "Home Delivery"}</p>
                {isPickup ? (
                  <>
                    <p>{shippingData.point?.name || shippingData.name}</p>
                    <p>{shippingData.point?.street || shippingData.street}</p>
                    <p>{shippingData.point?.zip || shippingData.zip} {shippingData.point?.city || shippingData.city}</p>
                  </>
                ) : (
                  <>
                    <p>{order.customer_name}</p>
                    <p>{shippingData.address?.street || shippingData.street || shippingData.line1}</p>
                    <p>{shippingData.address?.postcode || shippingData.zip || shippingData.postal_code} {shippingData.address?.city || shippingData.city}</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 md:text-right">
            <h2 className="font-[family-name:var(--font-display)] text-xs tracking-[0.2em] uppercase text-chrome-bright mb-4">
              {t("cart.total")}
            </h2>
            <p className="text-3xl font-[family-name:var(--font-display)] font-extrabold text-white">
              &euro;{((order.amount ?? order.total ?? 0) / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center">
         <Link href="/" className="inline-block font-[family-name:var(--font-display)] text-xs tracking-[0.1em] uppercase text-chrome hover:text-white transition-colors duration-300 border-b border-white/20 hover:border-white/50 pb-1">
            {t("product.backToShop")}
         </Link>
      </div>
    </div>
  );
}
