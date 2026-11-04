import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartStoreItem {
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  size: string;
  color: string;
  image: string;
  unitPrice: number;
  quantity: number;
  maxAvailableStock: number;
}

interface CartStore {
  items: CartStoreItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  validationError: string | null;
  isValidating: boolean;

  // Actions
  addItem: (item: Omit<CartStoreItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, deltaOrQuantity: number, isAbsolute?: boolean) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setHasHydrated: (hydrated: boolean) => void;
  setValidationError: (error: string | null) => void;

  // Computed helpers
  getTotalItemsCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hasHydrated: false,
      validationError: null,
      isValidating: false,

      addItem: (item, quantity = 1) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (i) => i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const existing = currentItems[existingIndex];
          const newQty = Math.min(
            existing.quantity + quantity,
            item.maxAvailableStock > 0 ? item.maxAvailableStock : 999
          );

          const updated = [...currentItems];
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
            unitPrice: item.unitPrice,
            maxAvailableStock: item.maxAvailableStock,
          };
          set({ items: updated, isOpen: true });
        } else {
          const validQty = Math.min(
            Math.max(1, quantity),
            item.maxAvailableStock > 0 ? item.maxAvailableStock : 999
          );
          set({
            items: [...currentItems, { ...item, quantity: validQty }],
            isOpen: true,
          });
        }
      },

      removeItem: (variantId: string) => {
        set({
          items: get().items.filter((i) => i.variantId !== variantId),
        });
      },

      updateQuantity: (variantId: string, deltaOrQuantity: number, isAbsolute = false) => {
        const currentItems = get().items;
        const item = currentItems.find((i) => i.variantId === variantId);
        if (!item) return;

        let newQty: number;
        if (isAbsolute) {
          newQty = deltaOrQuantity;
        } else {
          newQty = item.quantity + deltaOrQuantity;
        }

        if (newQty <= 0) {
          get().removeItem(variantId);
          return;
        }

        const max = item.maxAvailableStock > 0 ? item.maxAvailableStock : 999;
        const clampedQty = Math.min(newQty, max);

        set({
          items: currentItems.map((i) =>
            i.variantId === variantId ? { ...i, quantity: clampedQty } : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [], validationError: null });
      },

      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),

      setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),
      setValidationError: (error: string | null) => set({ validationError: error }),

      getTotalItemsCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (acc, item) => acc + item.unitPrice * item.quantity,
          0
        );
      },
    }),
    {
      name: "matacos-cart-storage",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        };
      }),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Hook seguro para consumir el carrito en componentes cliente sin errores de hidratación
 */
export function useCart() {
  const store = useCartStore();
  const itemCount = store.hasHydrated ? store.getTotalItemsCount() : 0;
  const subtotal = store.hasHydrated ? store.getSubtotal() : 0;
  const items = store.hasHydrated ? store.items : [];

  return {
    ...store,
    items,
    itemCount,
    subtotal,
    isReady: store.hasHydrated,
  };
}

