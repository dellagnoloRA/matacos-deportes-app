"use client";

import React from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart, CartStoreItem } from "@/stores/cartStore";

interface EcommerceCartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  items?: CartStoreItem[];
  onUpdateQuantity?: (variantId: string, delta: number) => void;
  onRemoveItem?: (variantId: string) => void;
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
  const cart = useCart();

  const isOpen = propIsOpen !== undefined ? propIsOpen : cart.isOpen;
  const onClose = propOnClose || cart.closeDrawer;
  const items = propItems || cart.items;

  const handleUpdateQty = (variantId: string, delta: number) => {
    if (propOnUpdateQuantity) {
      propOnUpdateQuantity(variantId, delta);
    } else {
      cart.updateQuantity(variantId, delta);
    }
  };

  const handleRemove = (variantId: string) => {
    if (propOnRemoveItem) {
      propOnRemoveItem(variantId);
    } else {
      cart.removeItem(variantId);
    }
  };

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#00A811]" />
              <h2 className="text-base font-bold text-slate-900">
                Tu Carrito ({totalItemsCount})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Tu carrito está vacío</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Explorá nuestras ofertas y productos en Saavedra 241, Formosa.
                  </p>
                </div>
                <Link
                  href="/catalogo"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Ver Catálogo
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const isMaxReached =
                  item.maxAvailableStock > 0 && item.quantity >= item.maxAvailableStock;

                return (
                  <div
                    key={item.variantId}
                    className="flex gap-3 sm:gap-4 p-3 rounded-2xl border border-slate-100 bg-[#f8fafc] hover:border-slate-200 transition-colors"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white p-2 shrink-0 border border-slate-100 flex items-center justify-center">
                      <img
                        src={item.image || "/placeholder-product.svg"}
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
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.size && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                Talle: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                {item.color}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(item.variantId)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors shrink-0"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                          <button
                            onClick={() => handleUpdateQty(item.variantId, -1)}
                            className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
                            title="Disminuir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.variantId, 1)}
                            disabled={isMaxReached}
                            className={`p-1 transition-colors ${
                              isMaxReached
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                            title={isMaxReached ? "Stock máximo alcanzado" : "Aumentar"}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-[#00A811]">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="block text-[10px] text-slate-400">
                              {formatCurrency(item.unitPrice)} c/u
                            </span>
                          )}
                        </div>
                      </div>

                      {isMaxReached && (
                        <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle className="w-3 h-3 inline" />
                          Stock máximo disponible en salón
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Subtotal productos</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Retiro en mostrador (Saavedra 241)</span>
                  <span className="text-emerald-700 font-bold">Gratis</span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                  <span>Total estimado</span>
                  <span className="text-lg text-[#00A811]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Opciones de envío y pago en el siguiente paso.
                </p>
              </div>

              <Link
                href="/checkout"
                onClick={() => {
                  if (onCheckout) onCheckout();
                  onClose();
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all text-center block"
              >
                <span>FINALIZAR COMPRA (INVITADO)</span>
                <ArrowRight className="w-4 h-4 inline-block ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
