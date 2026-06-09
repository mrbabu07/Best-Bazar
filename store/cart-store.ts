"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { fallbackProductImage } from "@/lib/images";
import type { LocalizedText, Product, ProductVariant } from "@/lib/types";

export type CartItem = {
  id: string;
  productId?: string;
  variantId?: string;
  slug: string;
  name: LocalizedText;
  variantName?: LocalizedText;
  variantColorHex?: string;
  variantSku?: string;
  image: string;
  price: number;
  brand: string;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1, variant) => {
        const availableStock = variant?.stock ?? product.stock;
        const lineId = variant ? `${product.id}:${variant.id}` : product.id;

        if (availableStock <= 0) {
          return;
        }

        set((state) => {
          const existing = state.items.find((item) => item.id === lineId);

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === lineId
                  ? { ...item, stock: availableStock, quantity: Math.min(item.quantity + quantity, availableStock) }
                  : item
              )
            };
          }

          return {
            items: [
              ...state.items,
              {
                id: lineId,
                productId: product.id,
                variantId: variant?.id,
                slug: product.slug,
                name: product.name,
                variantName: variant?.name,
                variantColorHex: variant?.colorHex,
                variantSku: variant?.sku,
                image: variant?.imageUrl || product.images[0]?.url || fallbackProductImage,
                price: product.price,
                brand: product.brand,
                stock: availableStock,
                quantity: Math.min(quantity, availableStock)
              }
            ]
          };
        });
      },
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === id
                ? { ...item, quantity: Math.min(Math.max(quantity, 0), item.stock) }
                : item
            )
            .filter((item) => item.quantity > 0)
        })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      subtotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0)
    }),
    {
      name: "best-bazar-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items })
    }
  )
);
