"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { EcommerceProduct } from "./types";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore, CartStoreItem } from "@/stores/cartStore";

export interface CartItem {
  product: EcommerceProduct;
  quantity: number;
  size?: string;
  color?: string;
  variantId?: string;
}

interface EcommerceCartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  items?: CartItem[];
  onUpdateQuantity?: (productId: string, delta: number) => void;
  onRemoveItem?: (productId: string) => void;
  onCheckout?: () => void;
}

export function EcommerceCartDrawer({
  isOpen: propIsOpen,
  onClose: propOnClose,
  items: propItems,
  onUpdateQuantity: propOnUpdateQuantity,
  onRemoveItem: propOnRemoveItem,
  onCheckout,
}: EcommerceCartDrawerProps) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const store = useCartStore();

  const isOpen = propIsOpen !== undefined ? propIsOpen : store.isOpen;
  const onClose = propOnClose || store.closeCart;

  if (!isOpen) return null;

  // Use props if passed, otherwise use items from store
  const items: Array<{
    id: string;
    name: string;
    brand: string;
    price: number;
    image: string;
    quantity: number;
    size?: string;
    color?: string;
  }> =
    propItems !== undefined
      ? propItems.map((item) => ({
          id: item.variantId || item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          price: item.product.price,
          image: item.product.image,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        }))
      : hasMounted
      ? store.items.map((item) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        }))
      : [];

  const handleUpdateQty = (id: string, delta: number) => {
    if (propOnUpdateQuantity) {
      propOnUpdateQuantity(id, delta);
    } else {
      store.updateQuantity(id, delta);
    }
  };

  const handleRemove = (id: string) => {
    if (propOnRemoveItem) {
      propOnRemoveItem(id);
    } else {
      store.removeItem(id);
    }
  };

  const totalAmount = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const formatPrice = (amount: number) => {
    return formatCurrency(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#00A811]" />
              <h2 className="text-base font-bold text-slate-900">
                Tu Carrito ({totalCount})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Tu carrito está vacío
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Explorá nuestras ofertas y productos destacados.
                  </p>
                </div>
                <Link
                  href="/catalogo"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase"
                >
                  Ver Catálogo
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-2xl border border-slate-100 bg-[#f8fafc] hover:border-slate-200 transition-colors"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white p-2 shrink-0 border border-slate-100 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                          {item.brand}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        {(item.size || item.color) && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            {item.size ? `Talle: ${item.size}` : ""}
                            {item.size && item.color ? " • " : ""}
                            {item.color ? `${item.color}` : ""}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                        <button
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-black text-[#00A811]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Envío a convenir</span>
                  <span className="text-emerald-700 font-bold">
                    {totalAmount >= 100000
                      ? "¡Envío Gratis!"
                      : "Desde $ 2.500 en Formosa"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-lg text-[#00A811]">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Hasta 3 y 6 cuotas fijas o pago seguro con Mercado Pago.
                </p>
              </div>

              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full py-4 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all text-center block cursor-pointer"
              >
                <span>INICIAR COMPRA</span>
                <ArrowRight className="w-4 h-4 inline-block ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
