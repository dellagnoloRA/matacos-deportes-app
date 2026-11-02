"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ValidatedCartItem } from "@/server/actions/ecommerce/checkoutActions";
import type { EcommerceProduct } from "@/components/ecommerce/types";

export interface CartStoreItem {
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  imageUrl: string;
  quantity: number;
  availableStock: number;
}

export interface AddCartItemInput {
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  imageUrl: string;
  availableStock: number;
  quantity?: number;
}

interface CartStoreState {
  items: CartStoreItem[];
  isDrawerOpen: boolean;
  hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  addItem: (input: AddCartItemInput) => { added: boolean; capped: boolean };
  updateQuantity: (variantId: string, delta: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  syncValidatedItems: (validatedItems: ValidatedCartItem[]) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      addItem: (input) => {
        if (!input.variantId || input.availableStock <= 0) {
          return { added: false, capped: false };
        }

        const requestedDelta = Math.max(1, Math.floor(input.quantity ?? 1));
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (i) => i.variantId === input.variantId
        );

        let capped = false;

        if (existingIndex >= 0) {
          const existing = currentItems[existingIndex]!;
          const maxStock = Math.max(1, input.availableStock);
          const nextQty = Math.min(maxStock, existing.quantity + requestedDelta);
          if (existing.quantity + requestedDelta > maxStock) {
            capped = true;
          }

          const updated = [...currentItems];
          updated[existingIndex] = {
            ...existing,
            name: input.name,
            brand: input.brand,
            size: input.size,
            color: input.color,
            sku: input.sku,
            price: input.price,
            imageUrl: input.imageUrl,
            availableStock: maxStock,
            quantity: nextQty,
          };

          set({ items: updated });
          return { added: true, capped };
        }

        const maxStock = Math.max(1, input.availableStock);
        const initialQty = Math.min(maxStock, requestedDelta);
        if (requestedDelta > maxStock) {
          capped = true;
        }

        const newItem: CartStoreItem = {
          variantId: input.variantId,
          productId: input.productId,
          name: input.name,
          brand: input.brand,
          size: input.size,
          color: input.color,
          sku: input.sku,
          price: input.price,
          imageUrl: input.imageUrl || "/placeholder-product.svg",
          quantity: initialQty,
          availableStock: maxStock,
        };

        set({ items: [...currentItems, newItem] });
        return { added: true, capped };
      },

      updateQuantity: (variantId, delta) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.variantId !== variantId) return item;
              const nextQty = item.quantity + delta;
              if (nextQty <= 0) return null;
              const clamped = Math.min(item.availableStock, nextQty);
              return { ...item, quantity: clamped };
            })
            .filter((item): item is CartStoreItem => item !== null),
        }));
      },

      setQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.variantId !== variantId) return item;
              if (quantity <= 0) return null;
              const clamped = Math.min(item.availableStock, Math.floor(quantity));
              return { ...item, quantity: clamped };
            })
            .filter((item): item is CartStoreItem => item !== null),
        }));
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      syncValidatedItems: (validatedItems) => {
        const validatedMap = new Map(
          validatedItems.map((v) => [v.variantId, v])
        );

        set((state) => ({
          items: state.items.map((item) => {
            const v = validatedMap.get(item.variantId);
            if (!v) return item;

            const safeStock = Math.max(0, v.availableStock);
            const adjustedQty =
              safeStock > 0 ? Math.min(item.quantity, safeStock) : item.quantity;

            return {
              ...item,
              productId: v.productId || item.productId,
              name: v.productName || item.name,
              brand: v.brandName || item.brand,
              size: v.size || item.size,
              color: v.color || item.color,
              sku: v.sku || item.sku,
              price: v.currentUnitPrice > 0 ? v.currentUnitPrice : item.price,
              imageUrl: v.imageUrl || item.imageUrl,
              availableStock: safeStock,
              quantity: adjustedQty,
            };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "matacos-ecommerce-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Resuelve un CartItemInput válido desde un EcommerceProduct (por ejemplo, desde Vista Rápida)
 * seleccionando la variante solicitada o la primera variante con stock disponible.
 */
export function buildCartItemFromEcommerceProduct(
  product: EcommerceProduct,
  variantId?: string,
  quantity: number = 1
): AddCartItemInput | null {
  const variants = product.variants ?? [];
  if (variants.length === 0) {
    return null;
  }

  const chosenVariant = variantId
    ? variants.find((v) => v.id === variantId)
    : variants.find((v) => v.inStock && v.availableStock > 0) || variants[0];

  if (!chosenVariant || chosenVariant.availableStock <= 0) {
    return null;
  }

  const unitPrice =
    chosenVariant.price !== null && chosenVariant.price > 0
      ? chosenVariant.price
      : product.price;

  // Buscar imagen asociada al color de la variante si existe
  const colorImage = product.images?.find(
    (img) =>
      img.color &&
      img.color.trim().toLowerCase() === chosenVariant.color.trim().toLowerCase()
  )?.url;

  return {
    variantId: chosenVariant.id,
    productId: product.id,
    name: product.name,
    brand: product.brand,
    size: chosenVariant.size,
    color: chosenVariant.color,
    sku: chosenVariant.sku,
    price: unitPrice,
    imageUrl: colorImage || product.image || "/placeholder-product.svg",
    availableStock: chosenVariant.availableStock,
    quantity,
  };
}
