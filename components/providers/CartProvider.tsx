"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { Product } from "@/lib/products";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  product: Product;
  size?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size?: string) => void;
  removeItem: (productId: string, size?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const { user } = useAuth();

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("lexxbrush-cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        // ignore invalid cart data
      }
    }
    setInitialLoaded(true);
  }, []);

  // 2. Load DB Cart on Login and Merge
  useEffect(() => {
    if (!user || !initialLoaded) return;
    
    const fetchDbCart = async () => {
      const { data } = await supabase.from("carts").select("items").eq("user_id", user.id).single();
      if (data?.items) {
        const dbItems = data.items as CartItem[];
        setItems(prev => {
          if (prev.length === 0) return dbItems;
          const newItems = [...dbItems];
          let changed = false;
          prev.forEach(localItem => {
            const exists = newItems.some(i => i.product.id === localItem.product.id && i.size === localItem.size);
            if (!exists) {
              newItems.push(localItem);
              changed = true;
            }
          });
          return changed ? newItems : dbItems;
        });
      } else if (items.length > 0) {
        // User has no DB cart -> save local cart to DB
        const saveInitialCart = async () => {
          await supabase.from("carts").upsert({ user_id: user.id, items });
        };
        saveInitialCart();
      }
    };
    fetchDbCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, initialLoaded]); // Only run when user ID changes

  // 3. Save to LocalStorage and DB on item changes
  useEffect(() => {
    if (!initialLoaded) return;
    localStorage.setItem("lexxbrush-cart", JSON.stringify(items));
    
    if (user) {
      const syncCart = async () => {
        await supabase.from("carts").upsert({ user_id: user.id, items });
      };
      syncCart();
    }
  }, [items, user, initialLoaded]);

  const sprayAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    sprayAudioRef.current = new Audio("/spraycan.wav");
    sprayAudioRef.current.volume = 0.4;
  }, []);

  const playSpraySound = useCallback(() => {
    if (sprayAudioRef.current) {
      sprayAudioRef.current.currentTime = 0;
      sprayAudioRef.current.play().catch(() => {});
    }
  }, []);

  const addItem = useCallback((product: Product, size?: string) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.size === size
      );

      if (existing) {
        if (product.isOneOfAKind) return prev;
        playSpraySound();
        return prev.map((item) =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      playSpraySound();
      return [...prev, { product, size, quantity: 1 }];
    });
  }, [playSpraySound]);

  const removeItem = useCallback((productId: string, size?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.size === size)
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
