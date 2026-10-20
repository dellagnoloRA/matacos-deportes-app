"use client";

import React from "react";
import Link from "next/link";
import { EcommerceProduct } from "./types";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface CartItem {
  product: EcommerceProduct;
  quantity: number;
}

interface EcommerceCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout?: () => void;
}

export function EcommerceCartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: EcommerceCartDrawerProps) {
  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

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
                Tu Carrito ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
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
                  <p className="text-sm font-bold text-slate-700">Tu carrito está vacío</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Explorá nuestras ofertas y productos destacados.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase"
                >
                  Ver Catálogo
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-3 rounded-2xl border border-slate-100 bg-[#f8fafc] hover:border-slate-200 transition-colors"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white p-2 shrink-0 border border-slate-100 flex items-center justify-center">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {item.product.brand}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1 text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-black text-[#00A811]">
                        {formatPrice(item.product.price * item.quantity)}
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
                  <span className="text-emerald-700 font-bold">Gratis en Formosa</span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-lg text-[#00A811]">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Hasta 3 y 6 cuotas fijas o pago con Mercado Pago.
                </p>
              </div>

              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full py-4 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all text-center block"
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
