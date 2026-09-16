"use client";

import React, { useState } from "react";
import { X, Package, QrCode, Tag, Check, ArrowRight, ShieldCheck, MapPin, Globe } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  discipline: string;
  price: number;
  costPrice: number;
  sku: string;
  barcode: string;
  stockLocal: number;
  stockWeb: number;
  minStock: number;
  updatedAt: string;
  iconBg: string;
  category: string;
  variants: {
    size: string;
    color: string;
    stockLocal: number;
    stockWeb: number;
    barcode: string;
    minStock?: number;
  }[];
}

interface ProductDetailModalProps {
  product: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStock?: (productId: string, variantIndex: number, localDelta: number, webDelta: number) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onUpdateStock,
}: ProductDetailModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${product.iconBg} flex items-center justify-center text-white shadow-sm ring-1 ring-slate-200`}
            >
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">{product.brand}</span>
                <span>•</span>
                <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                  {product.discipline}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-600">SKU: {product.sku}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Price & Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">Precio de Venta</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {formatCurrency(product.price)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">Costo de Compra</span>
              <div className="text-base font-semibold text-slate-700 mt-0.5">
                {formatCurrency(product.costPrice)}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <MapPin className="w-3 h-3" />
                <span>Saavedra 241 (Local)</span>
              </div>
              <div className="text-base font-bold text-emerald-900 mt-0.5">
                {product.stockLocal} unidades
              </div>
            </div>

            <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100">
              <div className="flex items-center gap-1 text-[11px] text-sky-700 font-medium">
                <Globe className="w-3 h-3" />
                <span>Tienda Web</span>
              </div>
              <div className="text-base font-bold text-sky-900 mt-0.5">
                {product.stockWeb} unidades
              </div>
            </div>
          </div>

          {/* Variants Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Variantes y Talles
              </h3>
              <span className="text-[11px] text-slate-400">
                {product.variants.length} variante(s) registrada(s)
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Talle</th>
                    <th className="py-2.5 px-3">Color</th>
                    <th className="py-2.5 px-3">Cód. Barras</th>
                    <th className="py-2.5 px-3 text-center">Local (Formosa)</th>
                    <th className="py-2.5 px-3 text-center">Web</th>
                    <th className="py-2.5 px-3 text-center">Mín. Alerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {product.variants.map((v, idx) => {
                    const minThreshold = v.minStock ?? product.minStock ?? 2;
                    const total = (v.stockLocal || 0) + (v.stockWeb || 0);
                    const isCritical = total <= minThreshold;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{v.size}</td>
                        <td className="py-2.5 px-3">{v.color}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {v.barcode}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                              v.stockLocal <= 1
                                ? "bg-amber-100 text-amber-800 font-bold"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {v.stockLocal} un.
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                            {v.stockWeb} un.
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                              isCritical
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-slate-100 text-slate-600"
                            }`}
                            title={`Umbral de alerta: ${minThreshold} un.`}
                          >
                            {minThreshold} un.
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Inventario sincronizado</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
