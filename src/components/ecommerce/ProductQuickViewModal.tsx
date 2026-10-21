"use client";

import React, { useState } from "react";
import { EcommerceProduct } from "./types";
import { X, ShoppingBag, Truck, Store, ShieldCheck, Heart, Check, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductQuickViewModalProps {
  product: EcommerceProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: EcommerceProduct, selectedSize?: string) => void;
}

export function ProductQuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductQuickViewModalProps) {
  if (!isOpen || !product) return null;

  const initialAvailableSize = product.sizes?.find((s) => s.inStock)?.size;
  const [selectedSize, setSelectedSize] = useState<string | undefined>(initialAvailableSize);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const formatPrice = (amount: number) => {
    return formatCurrency(amount).replace(/,00$/, "");
  };

  const discountTransferPercent = product.cashTransferDiscountPercent || 10;
  const transferPrice = Math.round(product.price * (1 - discountTransferPercent / 100));
  const quotaAmount = Math.round(product.price / 6);

  const handleAdd = () => {
    onAddToCart?.(product, selectedSize);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Columna Izquierda: Imagen */}
          <div className="relative bg-slate-50 aspect-4/5 md:aspect-auto flex items-center justify-center overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.isOffer && (
              <span className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-sm shadow-xs">
                {product.offerTag || `SALE ${product.discountPercent || 15}% OFF`}
              </span>
            )}
          </div>

          {/* Columna Derecha: Detalles */}
          <div className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  {product.brand} • {product.category}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 mt-0.5 leading-snug">
                  {product.name}
                </h2>
              </div>

              {/* Precios */}
              <div className="space-y-1">
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="text-xs font-bold text-red-600">
                      {product.discountPercent}% OFF
                    </span>
                  </div>
                )}

                <div className="text-2xl font-black text-slate-950">
                  {formatPrice(product.price)}
                </div>

                <div className="text-xs font-semibold text-slate-600">
                  6 cuotas sin interés de{" "}
                  <strong className="text-slate-900">{formatPrice(quotaAmount)}</strong>
                </div>

                <div className="inline-block bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200/60 mt-1">
                  {formatPrice(transferPrice)} con Transferencia / Efectivo ({discountTransferPercent}% OFF)
                </div>
              </div>

              {/* Colores / Variantes */}
              {product.colors && product.colors.length > 0 && (
                <div className="flex items-center gap-2 pt-2 text-xs">
                  <span className="font-bold text-slate-900 uppercase tracking-wider">
                    Color:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.colors.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-200/80 text-[11px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Talles */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 uppercase tracking-wider">
                      Seleccionar Talle:
                    </span>
                    {selectedSize && (
                      <span className="text-emerald-700 font-bold">
                        Elegido: {selectedSize}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => {
                      const isSelected = selectedSize === s.size;
                      const inStock = s.inStock;

                      return (
                        <button
                          key={s.size}
                          type="button"
                          disabled={!inStock}
                          onClick={() => setSelectedSize(s.size)}
                          className={`min-w-9 h-9 px-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center relative ${
                            !inStock
                              ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                              : isSelected
                              ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                              : "bg-white text-slate-800 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <span>{s.size}</span>
                          {!inStock && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-full h-[1px] bg-slate-300 -rotate-45" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Beneficios */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>
                    Retiro gratuito en nuestro local: <strong>Saavedra 241, Formosa Capital</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>Envíos a todo el país por correo y transporte</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>Garantía oficial y cambio directo en sucursal</span>
                </div>
              </div>
            </div>

            {/* Botón de Agregar */}
            <div className="pt-3">
              <button
                onClick={handleAdd}
                disabled={product.inStock === false}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                  addedAnimation
                    ? "bg-emerald-600 text-white"
                    : product.inStock === false
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-[#06241d] hover:bg-[#00D615] hover:text-slate-950 text-white"
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡Agregado al Carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      Agregar al Carrito {selectedSize ? `— Talle ${selectedSize}` : ""}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
