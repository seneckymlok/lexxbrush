"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Product } from "@/lib/products";

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

  useEffect(() => {
    const saved = localStorage.getItem("lexxbrush-cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        // ignore invalid cart data
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lexxbrush-cart", JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, size?: string) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.size === size
      );

      if (existing) {
        // One-of-a-kind items can only be added once
        if (product.isOneOfAKind) return prev;
        return prev.map((item) =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { product, size, quantity: 1 }];
    });
  }, []);

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
