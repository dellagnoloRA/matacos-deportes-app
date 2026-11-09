"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

export function ClearCartOnSuccess({ isApproved }: { isApproved: boolean }) {
  useEffect(() => {
    if (isApproved) {
      useCartStore.getState().clearCart();
    }
  }, [isApproved]);

  return null;
}
