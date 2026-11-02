"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { EcommerceProduct } from "@/components/ecommerce/types";

export interface CartStoreItem {
  id: string; // ID único en el carrito (variantId)
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  size: string;
  color: string;
  price: number;
  image: string;
  quantity: number;
  maxStock?: number;
}

interface CartStore {
  items: CartStoreItem[];
  isOpen: boolean;

  // Acciones de visibilidad del drawer
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Acciones sobre ítems
  addItem: (
    product: EcommerceProduct,
    variantId?: string,
    quantity?: number,
    size?: string,
    color?: string,
    price?: number
  ) => void;
  removeItem: (idOrVariantId: string) => void;
  updateQuantity: (idOrVariantId: string, delta: number) => void;
  clearCart: () => void;

  // Getters computados
  getTotalCount: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (
        product,
        customVariantId,
        quantity = 1,
        customSize,
        customColor,
        customPrice
      ) => {
        let variantId = customVariantId;
        let size = customSize;
        let color = customColor;
        let price = customPrice !== undefined ? customPrice : product.price;

        // Si no se proporcionó variantId explícito, buscar la primera variante disponible del producto
        if (!variantId && product.variants && product.variants.length > 0) {
          const inStockVariant = product.variants.find((v) => v.inStock);
          const picked = inStockVariant || product.variants[0];
          variantId = picked.id;
          size = size || picked.size;
          color = color || picked.color;
          if (picked.price !== null && customPrice === undefined) {
            price = picked.price;
          }
        }

        // Fallback en caso extremo
        if (!variantId) {
          variantId = product.id;
        }

        const cartItemId = variantId;

        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.id === cartItemId || item.variantId === cartItemId
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + quantity,
            };
            return {
              items: updatedItems,
              isOpen: true,
            };
          }

          const newItem: CartStoreItem = {
            id: cartItemId,
            variantId,
            productId: product.id,
            name: product.name,
            brand: product.brand || "Matacos Deportes",
            size: size || "Único",
            color: color || "Estándar",
            price,
            image: product.image || "/placeholder-product.svg",
            quantity,
            maxStock: product.totalAvailableStock,
          };

          return {
            items: [...state.items, newItem],
            isOpen: true,
          };
        });
      },

      removeItem: (idOrVariantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              item.id !== idOrVariantId &&
              item.variantId !== idOrVariantId &&
              item.productId !== idOrVariantId
          ),
        })),

      updateQuantity: (idOrVariantId, delta) =>
        set((state) => ({
          items: state.items
            .map((item) => {
              if (
                item.id === idOrVariantId ||
                item.variantId === idOrVariantId ||
                item.productId === idOrVariantId
              ) {
                const nextQty = item.quantity + delta;
                return nextQty > 0 ? { ...item, quantity: nextQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartStoreItem[],
        })),

      clearCart: () => set({ items: [] }),

      getTotalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalAmount: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "matacos-ecommerce-cart-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
