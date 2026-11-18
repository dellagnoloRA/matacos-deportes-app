"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

export function ClearCartOnSuccess({ isApproved, isFailure }: { isApproved?: boolean; isFailure?: boolean }) {
  useEffect(() => {
    // Limpiar carrito siempre que no sea un fallo explícito
    if (isApproved || !isFailure) {
      useCartStore.getState().clearCart();
    }
  }, [isApproved, isFailure]);

  return null;
}
