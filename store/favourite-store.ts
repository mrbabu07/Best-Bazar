"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { fallbackProductImage } from "@/lib/images";
import type { LocalizedText, Product, ProductImage } from "@/lib/types";

export type FavouriteProductInput = Pick<Product, "id" | "slug" | "name" | "price" | "brand"> & {
  images: ProductImage[];
};

export type FavouriteItem = {
  id: string;
  slug: string;
  name: LocalizedText;
  image: string;
  price: number;
  brand: string;
};

type FavouriteState = {
  items: FavouriteItem[];
  toggle: (product: FavouriteProductInput) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  totalItems: () => number;
};

export const useFavouriteStore = create<FavouriteState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) =>
        set((state) => {
          const exists = state.items.some((item) => item.id === product.id);

          if (exists) {
            return { items: state.items.filter((item) => item.id !== product.id) };
          }

          return {
            items: [
              ...state.items,
              {
                id: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0]?.url || fallbackProductImage,
                price: product.price,
                brand: product.brand
              }
            ]
          };
        }),
      remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      has: (id) => get().items.some((item) => item.id === id),
      totalItems: () => get().items.length
    }),
    {
      name: "best-mart-favourites",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items })
    }
  )
);
