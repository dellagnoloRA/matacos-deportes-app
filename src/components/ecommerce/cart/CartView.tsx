"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Tag,
  ShieldCheck,
  Truck,
  CreditCard,
  Check,
  Store,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import {
  COMPLEMENTARY_ITEMS,
  type ComplementaryItem,
  type ComplementaryVariant,
} from "@/lib/complementaryItems";

function ComplementaryAccessoryCard({
  item,
  cartItems,
  onAddToCart,
}: {
  item: ComplementaryItem;
  cartItems: { variantId: string; quantity: number }[];
  onAddToCart: (variant: ComplementaryVariant, item: ComplementaryItem) => void;
}) {
  const colors = useMemo(
    () => Array.from(new Set(item.variants.map((v) => v.color))),
    [item.variants]
  );
  const sizes = useMemo(
    () => Array.from(new Set(item.variants.map((v) => v.size))),
    [item.variants]
  );

  const [selectedColor, setSelectedColor] = useState(colors[0] || "");
  const [selectedSize, setSelectedSize] = useState(sizes[0] || "");

  useEffect(() => {
    if (colors.length > 0 && (!selectedColor || !colors.includes(selectedColor))) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  useEffect(() => {
    if (sizes.length > 0 && (!selectedSize || !sizes.includes(selectedSize))) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes, selectedSize]);

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    const validSizes = item.variants
      .filter((v) => v.color === newColor)
      .map((v) => v.size);
    if (validSizes.length > 0 && !validSizes.includes(selectedSize)) {
      setSelectedSize(validSizes[0]);
    }
  };

  const handleSizeChange = (newSize: string) => {
    setSelectedSize(newSize);
    const validColors = item.variants
      .filter((v) => v.size === newSize)
      .map((v) => v.color);
    if (validColors.length > 0 && !validColors.includes(selectedColor)) {
      setSelectedColor(validColors[0]);
    }
  };

  const currentVariant = useMemo(() => {
    return (
      item.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      ) ||
      item.variants.find((v) => v.color === selectedColor) ||
      item.variants.find((v) => v.size === selectedSize) ||
      item.variants[0]
    );
  }, [item.variants, selectedColor, selectedSize]);

  const isAlreadyInCart = useMemo(() => {
    if (!currentVariant) return false;
    return cartItems.some((ci) => ci.variantId === currentVariant.id);
  }, [cartItems, currentVariant]);

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all text-left group">
      <div>
        <span className="inline-block px-2 py-0.5 rounded bg-[#06241d] text-[#00D615] text-[10px] font-black tracking-wide mb-3">
          {item.discountTag}
        </span>

        <div className="w-full h-32 rounded-xl bg-slate-50 flex items-center justify-center p-2 mb-3">
          <img
            src={item.image}
            alt={item.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
          />
        </div>

        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {item.brand}
        </span>

        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 min-h-8">
          {item.name}
        </h4>
      </div>

      <div>
        <div className="mt-3 text-center">
          <span className="text-xs sm:text-sm font-black text-slate-900 block">
            {formatCurrency(item.price)}
          </span>
          {item.originalPrice > item.price && (
            <span className="text-[10px] text-slate-400 line-through font-normal block mt-0.5">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="relative">
              <select
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full text-[11px] py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-slate-400 cursor-pointer"
                title="Seleccionar Color"
              >
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={selectedSize}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="w-full text-[11px] py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-slate-400 cursor-pointer"
                title="Seleccionar Talle"
              >
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isAlreadyInCart ? (
            <button
              type="button"
              disabled
              className="w-full py-2.5 px-3 rounded-full bg-[#00D615] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-[#00D615]/25 cursor-default transition-all"
            >
              <Check className="w-4 h-4 stroke-[3] text-white" />
              <span>Agregado</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(currentVariant, item)}
              className="w-full py-2.5 px-3 rounded-full bg-[#9bdc65] hover:bg-[#8ccb55] active:scale-98 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Agregar al carrito</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CartView() {
  const {
    items,
    hasHydrated,
    updateQuantity,
    removeItem,
    clearCart,
    addItem,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState("");
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
  const [couponNotice, setCouponNotice] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
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

  const couponDiscountAmount = Math.round(
    (totalAmount * couponDiscountPercent) / 100
  );
  const finalTotal = Math.max(0, totalAmount - couponDiscountAmount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (code === "MATACOS10" || code === "ASICS10") {
      setCouponDiscountPercent(10);
      setCouponNotice({
        text: "¡Cupón del 10% de descuento aplicado con éxito!",
        isError: false,
      });
    } else {
      setCouponDiscountPercent(0);
      setCouponNotice({
        text: "El cupón ingresado no es válido o ha expirado.",
        isError: true,
      });
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscountPercent(0);
    setCouponNotice(null);
    setCouponInput("");
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <EcommerceHeader />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-full" />
            <div className="w-48 h-4 bg-slate-200 rounded" />
          </div>
        </main>
        <EcommerceFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col text-slate-800">
      <EcommerceHeader />

      {/* Trust & Promotions Banner (Estilo Asics / Matacos) */}
      <section className="bg-[#06241d] text-white text-xs border-y border-[#00D615]/20 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5 text-[#00D615]" />
            <span className="font-bold text-[#00D615]">3 Y 6 CUOTAS SIN INTERÉS</span>
            <span className="text-slate-400 hidden md:inline">| Con todas las tarjetas bancarias</span>
          </div>
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Store className="w-3.5 h-3.5 text-[#00D615]" />
            <span className="text-slate-200 font-medium">RETIRO GRATIS EN SAAVEDRA 241 (FORMOSA)</span>
          </div>
          <div className="flex items-center gap-2 mx-auto sm:mx-0 hidden lg:flex">
            <Truck className="w-3.5 h-3.5 text-[#00D615]" />
            <span className="text-slate-300 font-medium">ENVÍOS SEGUROS A TODO EL PAÍS</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Mi Carrito</span>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Seguir comprando</span>
          </Link>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 text-[#00A811] rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
              <ShoppingBag className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              Tu carrito está vacío
            </h2>
            <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
              Parece que todavía no agregaste ningún producto a tu pedido. ¡Explorá nuestro catálogo de indumentaria, calzado y accesorios deportivos!
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00D615]/20 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explorar Catálogo</span>
            </Link>
          </div>
        ) : (
          /* Active Cart Grid (Asics Style) */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Items Table (70%) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Header card with item count and clear cart */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                      Mi Carrito
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                      {totalUnits} {totalUnits === 1 ? "artículo" : "artículos"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar carrito</span>
                  </button>
                </div>

                {/* Table Header on Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <span className="col-span-6">Producto</span>
                  <span className="col-span-3 text-center">Cantidad</span>
                  <span className="col-span-3 text-right">Precio</span>
                </div>

                {/* Product Rows List */}
                <div className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const reachedMax =
                      item.availableStock !== undefined &&
                      item.availableStock > 0 &&
                      item.quantity >= item.availableStock;

                    return (
                      <div
                        key={item.variantId}
                        className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center group"
                      >
                        {/* Product Info (Col 1-6) */}
                        <div className="sm:col-span-6 flex items-center gap-4">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-50 border border-slate-200/80 p-2 flex items-center justify-center shrink-0">
                            <img
                              src={item.imageUrl || "/placeholder-product.svg"}
                              alt={item.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/placeholder-product.svg";
                              }}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            {item.brand && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                {item.brand}
                              </span>
                            )}
                            <Link
                              href={`/productos/${item.productId}`}
                              className="text-sm font-bold text-slate-900 hover:text-[#00A811] transition-colors line-clamp-2 block leading-snug"
                            >
                              {item.name}
                            </Link>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {item.size && (
                                <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                  Talle: {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                  Color: {item.color}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls (Col 7-9) */}
                        <div className="sm:col-span-3 flex flex-col items-start sm:items-center justify-center gap-1">
                          <div className="flex items-center border border-slate-200 bg-white rounded-xl shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.variantId, -1)}
                              className="p-2 text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
                              title="Restar cantidad"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-black text-slate-900 min-w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.variantId, 1)}
                              disabled={reachedMax}
                              className="p-2 text-slate-600 hover:text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title={
                                reachedMax
                                  ? `Stock máximo: ${item.availableStock}`
                                  : "Sumar cantidad"
                              }
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {reachedMax && (
                            <span className="text-[10px] font-bold text-amber-700">
                              Máx. disponible
                            </span>
                          )}
                        </div>

                        {/* Price & Trash Action (Col 10-12) */}
                        <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3 text-right">
                          <div>
                            {item.originalPrice &&
                              item.originalPrice > item.price && (
                                <span className="text-[11px] text-slate-400 line-through block">
                                  {formatCurrency(
                                    item.originalPrice * item.quantity
                                  )}
                                </span>
                              )}
                            <span className="text-sm sm:text-base font-black text-slate-950 block">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {formatCurrency(item.price)} c/u
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar producto del carrito"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shopping Reassurance Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00A811] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Envíos a todo el país</h4>
                    <p className="text-[11px] text-slate-500">Entrega rápida y con seguimiento</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00A811] flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Retiro en Saavedra 241</h4>
                    <p className="text-[11px] text-slate-500">Sin costo de envío en nuestro local</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00A811] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Compra 100% Segura</h4>
                    <p className="text-[11px] text-slate-500">Garantía oficial y cambio directo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary Card (Estático arriba) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-6">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                  Resumen de compra
                </h3>

                {/* Cupón de descuento (Estilo Asics) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Cupón de descuento
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Código"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#00D615] bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Añadir
                    </button>
                  </div>

                  {couponNotice && (
                    <div
                      className={`text-xs p-2.5 rounded-xl font-medium flex items-center justify-between gap-2 ${
                        couponNotice.isError
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                      }`}
                    >
                      <span>{couponNotice.text}</span>
                      {!couponNotice.isError && (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs underline text-slate-500 hover:text-slate-800"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Totals Breakdown */}
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
                      <span>Ahorro en ofertas:</span>
                      <span className="font-black">
                        - {formatCurrency(totalSavings)}
                      </span>
                    </div>
                  )}

                  {couponDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
                      <span>Descuento cupón (10%):</span>
                      <span className="font-black">
                        - {formatCurrency(couponDiscountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between text-slate-600 gap-2">
                    <span>Gastos de envío:</span>
                    <span className="text-right font-medium text-slate-500 text-[11px]">
                      Se calcula en el siguiente paso
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-950">
                      Total
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#00A811] block leading-none">
                        {formatCurrency(finalTotal)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Impuestos incluidos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA Button: INICIAR COMPRA */}
                <div className="space-y-2.5 pt-2">
                  <Link
                    href="/checkout"
                    className="w-full py-4 px-6 rounded-full bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/25 transition-all text-center group cursor-pointer"
                  >
                    <span>INICIAR COMPRA</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
                  </Link>

                  <Link
                    href="/catalogo"
                    className="w-full py-3 px-4 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Continuar comprando</span>
                  </Link>
                </div>

                {/* Payment guarantees */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Transacción encriptada SSL de 256 bits</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Selling Section: Completá tu compra (Ancho completo abajo, como en Checkout) */}
          <section className="mt-12 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Completá tu compra
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Accesorios esenciales con ofertas especiales para sumar a tu pedido.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {COMPLEMENTARY_ITEMS.map((compItem) => (
                <ComplementaryAccessoryCard
                  key={compItem.id}
                  item={compItem}
                  cartItems={items}
                  onAddToCart={(variant, cItem) => {
                    addItem({
                      variantId: variant.id,
                      productId: cItem.id,
                      name: cItem.name,
                      brand: cItem.brand,
                      size: variant.size,
                      color: variant.color,
                      sku: variant.sku,
                      price: cItem.price,
                      originalPrice: cItem.originalPrice,
                      imageUrl: cItem.image,
                      availableStock: variant.stock,
                      quantity: 1,
                    });
                  }}
                />
              ))}
            </div>
          </section>
        </>
      )}
      </main>

      <EcommerceFooter />

      {/* Modal de Advertencia y Confirmación para Vaciar Carrito */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-200 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1.5">
              ¿Vaciar tu carrito?
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Estás a punto de eliminar todos los productos seleccionados ({totalUnits} {totalUnits === 1 ? "artículo" : "artículos"}). Esta acción no se puede deshacer.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                Sí, vaciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
