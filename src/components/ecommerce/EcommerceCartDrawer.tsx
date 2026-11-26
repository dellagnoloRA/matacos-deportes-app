"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface EcommerceCartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function EcommerceCartDrawer({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: EcommerceCartDrawerProps = {}) {
  const {
    items,
    isDrawerOpen,
    hasHydrated,
    closeDrawer,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartStore();

  const open = externalIsOpen !== undefined ? externalIsOpen : isDrawerOpen;
  const handleClose = externalOnClose ?? closeDrawer;

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const pathname = usePathname();

  if (
    !open ||
    !hasHydrated ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/pos") ||
    pathname?.startsWith("/login") ||
    pathname === "/carrito"
  ) {
    return null;
  }

  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const totalSavings = items.reduce((acc, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return acc + (item.originalPrice - item.price) * item.quantity;
    }
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#00A811]" />
              <h2 className="text-base font-bold text-slate-900">
                Tu Carrito ({totalUnits})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Vaciar
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
                    Explorá nuestro catálogo y sumá tus productos favoritos.
                  </p>
                </div>
                <Link
                  href="/catalogo"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase transition-colors"
                >
                  Ir al Catálogo
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const reachedMaxStock = item.quantity >= item.availableStock;
                return (
                  <div
                    key={item.variantId}
                    className="flex gap-3.5 p-3 rounded-2xl border border-slate-100 bg-[#f8fafc] hover:border-slate-200 transition-colors"
                  >
                    <Link
                      href={`/productos/${item.productId}`}
                      onClick={handleClose}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-white p-2 shrink-0 border border-slate-100 flex items-center justify-center"
                    >
                      <img
                        src={item.imageUrl || "/placeholder-product.svg"}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder-product.svg";
                        }}
                      />
                    </Link>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {item.brand}
                          </span>
                          <Link
                            href={`/productos/${item.productId}`}
                            onClick={handleClose}
                            className="text-xs font-bold text-slate-900 hover:text-[#00A811] truncate block transition-colors"
                          >
                            {item.name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              Talle: {item.size}
                            </span>
                            <span className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              {item.color}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded cursor-pointer shrink-0"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.variantId, -1)}
                              className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                              aria-label="Restar unidad"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.variantId, 1)}
                              disabled={reachedMaxStock}
                              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                              title={
                                reachedMaxStock
                                  ? `Stock máximo disponible: ${item.availableStock}`
                                  : "Sumar unidad"
                              }
                              aria-label="Sumar unidad"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          {reachedMaxStock && (
                            <span className="text-[10px] font-semibold text-amber-700">
                              Máx. disp.
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-[10px] text-slate-400 line-through block font-medium">
                              {formatCurrency(item.originalPrice * item.quantity)}
                            </span>
                          )}
                          <span className="text-xs font-black text-[#00A811] block">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[10px] text-slate-400 block">
                              {formatCurrency(item.price)} c/u
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Subtotal productos</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-bold">
                    <span>Ahorro en ofertas:</span>
                    <span className="text-emerald-700 font-black">- {formatCurrency(totalSavings)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Entrega</span>
                  <span className="text-emerald-700 font-bold">
                    Retiro gratis en local o envío
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                  <span>Subtotal estimado</span>
                  <span className="text-lg text-[#00A811]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Seleccioná tu modalidad de retiro o envío en el siguiente paso.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  href="/carrito"
                  onClick={handleClose}
                  className="py-3 px-2 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 active:scale-98 text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-center shadow-xs cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                  <span>VER CARRITO</span>
                </Link>

                <Link
                  href="/checkout"
                  onClick={handleClose}
                  className="py-3 px-2 rounded-xl bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-[#00D615]/20 transition-all text-center cursor-pointer"
                >
                  <span>INICIAR COMPRA</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </div>
            </div>
          )}

          {/* Modal de confirmación para Vaciar en Drawer */}
          {showClearConfirm && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => setShowClearConfirm(false)}
            >
              <div
                className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 text-center relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <h3 className="text-base font-black text-slate-900 mb-1">
                  ¿Vaciar tu carrito?
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed mb-5">
                  Se quitarán todos los productos ({totalUnits} {totalUnits === 1 ? "artículo" : "artículos"}) de tu pedido.
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setShowClearConfirm(false);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/20 cursor-pointer"
                  >
                    Sí, vaciar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
