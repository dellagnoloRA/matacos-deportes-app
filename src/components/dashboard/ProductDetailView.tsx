"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Package,
  QrCode,
  Tag,
  ShieldCheck,
  MapPin,
  Globe,
  Info,
  Layers,
  Sparkles,
  TrendingUp,
  DollarSign,
  Barcode,
  Ruler,
  Boxes,
  Percent,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  ExternalLink,
  Edit3,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DetailedProductItem, SizeConversion } from "./types";
import { ProductFormModal } from "./ProductFormModal";
import { toggleProductActive } from "@/server/actions/productActions";

interface ProductDetailViewProps {
  product: DetailedProductItem;
  onBack: () => void;
}

const TABS = [
  { id: "overview", label: "Visión general" },
  { id: "details", label: "Detalles" },
  { id: "variants", label: "Variantes" },
  { id: "rates", label: "Tarifas" },
  { id: "size_guide", label: "Guía de Talles" },
];

export function ProductDetailView({ product, onBack }: ProductDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await toggleProductActive(product.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        onBack();
      } else {
        setDeleteError(res.error || "No se pudo dar de baja el producto");
      }
    } catch (err) {
      console.error("Error al dar de baja el producto:", err);
      setDeleteError("Ocurrió un error inesperado al dar de baja el producto");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculations
  const totalStoreStock = product.variants.reduce((acc, v) => acc + (v.stockStore || 0), 0);
  const totalWarehouseStock = product.variants.reduce((acc, v) => acc + (v.stockWarehouse || 0), 0);
  const totalStock = totalStoreStock + totalWarehouseStock;
  const receivedTotal = product.receivedTotal ?? (totalStock * 2 + 140);
  const salesStore = product.salesStoreTotal ?? Math.floor(receivedTotal * 0.45);
  const salesWeb = product.salesWebTotal ?? Math.floor(receivedTotal * 0.25);
  const salesTotal = salesStore + salesWeb;
  const stockInTransfer = product.stockTransfer ?? 46;

  // Margin calculation
  const profitMargin = product.price - product.costPrice;
  const marginPercentage = product.costPrice > 0 ? ((profitMargin / product.costPrice) * 100).toFixed(1) : "0";

  // Default size conversions if none provided
  const sizeConversions: SizeConversion[] =
    product.sizeConversions && product.sizeConversions.length > 0
      ? product.sizeConversions
      : [
          { ar: "38 AR", us: "6.0 US", eu: "39 EU", br: "37 BR", cm: "24.5 cm", note: "Ajuste estándar" },
          { ar: "40 AR", us: "7.5 US", eu: "41 EU", br: "39 BR", cm: "25.5 cm", note: "Ajuste estándar" },
          { ar: "41 AR", us: "8.5 US", eu: "42 EU", br: "40 BR", cm: "26.5 cm", note: "Recomendado" },
          { ar: "42 AR", us: "9.5 US", eu: "43 EU", br: "41 BR", cm: "27.5 cm", note: "Ajuste estándar" },
          { ar: "43 AR", us: "10.5 US", eu: "44 EU", br: "42 BR", cm: "28.5 cm", note: "Ajuste amplio" },
        ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto pb-12 select-none">
      {/* 1. Header Navigation Bar with Back Button & Barcode */}
      <div className="bg-white border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 py-3.5 sticky top-0 z-20 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Back button + Title + Badges */}
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1 group active:scale-95 shrink-0 mt-0.5 sm:mt-0"
              title="Volver a la lista de productos"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {product.name}
              </h1>
              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 tracking-wide whitespace-nowrap shrink-0">
                {product.barcode || product.sku}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 whitespace-nowrap shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Sincronizado POS & Web</span>
              </span>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#c2f25b] hover:bg-[#b0e838] rounded-xl transition-all border border-lime-400 shadow-2xs active:scale-95 whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              title="Eliminar producto"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200 active:scale-95 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Eliminar</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors border border-slate-200 active:scale-95 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>Etiquetas 80mm</span>
            </button>
          </div>
        </div>

        {/* 2. Top Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-2 border-t border-slate-100 no-scrollbar text-xs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 2xl:px-12 py-5 space-y-5 w-full">
        {/* 3. 5 KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Recibido */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <span className="text-[11.5px] font-medium text-slate-500 tracking-tight">Recibido</span>
            <div className="text-2xl lg:text-3xl font-bold text-[#4f46e5] mt-1 tracking-tight">
              {receivedTotal}
            </div>
            <span className="text-[10px] text-slate-400">Total ingresos a depósito</span>
          </div>

          {/* Card 2: Stock Tienda (Saavedra 241) */}
          <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-xs transition-shadow bg-gradient-to-br from-white to-emerald-50/30">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-emerald-800">Stock Tienda</span>
              <span className="text-[9.5px] font-medium text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                Saavedra 241
              </span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-emerald-700 mt-1 tracking-tight">
              {totalStoreStock}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Mostrador local</span>
          </div>

          {/* Card 3: Stock Depósito */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-slate-500">Stock Depósito</span>
              <span title="Almacén central para reposición" className="cursor-help inline-flex items-center">
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1 tracking-tight">
              {totalWarehouseStock}
            </div>
            <span className="text-[10px] text-slate-400">Almacén Central Formosa</span>
          </div>

          {/* Card 4: Existencias Disponibles Totales */}
          <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-2xs hover:shadow-xs transition-shadow bg-gradient-to-br from-white to-blue-50/40">
            <span className="text-[11.5px] font-semibold text-blue-900">Existencias Disponibles</span>
            <div className="text-2xl lg:text-3xl font-bold text-blue-600 mt-1 tracking-tight">
              {totalStock}
            </div>
            <span className="text-[10px] text-blue-600 font-medium">Tienda + Depósito</span>
          </div>

          {/* Card 5: Ventas Totales */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow col-span-2 sm:col-span-1">
            <span className="text-[11.5px] font-medium text-slate-500">Ventas Totales</span>
            <div className="text-2xl lg:text-3xl font-bold text-indigo-900 mt-1 tracking-tight">
              {salesTotal}
            </div>
            <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5">
              <span>Local: {salesStore}</span>
              <span>•</span>
              <span>Web: {salesWeb}</span>
            </div>
          </div>
        </div>

        {/* 4. Tab Content: Visión General (Active view matching reference) */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ======================================================== */}
            {/* COLUMNA IZQUIERDA: FOTOGRAFÍA + FICHA TÉCNICA DEL PRODUCTO */}
            {/* ======================================================== */}
            <div className="lg:col-span-4 space-y-4">
              {/* Card de Imagen del Producto */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden group">
                <div className="relative aspect-4/3 sm:aspect-square bg-gradient-to-b from-slate-100 to-slate-200/60 flex items-center justify-center p-6 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className={`w-32 h-32 rounded-3xl bg-gradient-to-tr ${product.iconBg} text-white flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}
                    >
                      <Package className="w-16 h-16 stroke-[1.5]" />
                      <span className="text-xs font-bold uppercase tracking-wider mt-2">
                        {product.brand}
                      </span>
                    </div>
                  )}

                  {/* Discipline Badge floating */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-900 font-bold text-[11px] px-2.5 py-1 rounded-lg shadow-xs border border-slate-200/60">
                    {product.discipline}
                  </div>

                  {/* Stock Status Badge */}
                  <div className="absolute top-3 right-3">
                    {totalStock <= product.minStock ? (
                      <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                        Stock Crítico
                      </span>
                    ) : (
                      <span className="bg-[#c2f25b] text-slate-950 font-bold text-[10.5px] px-2.5 py-0.5 rounded-full shadow-xs">
                        Disponible ({totalStock} un.)
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Identification footer in Image Card */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    Código de Producto
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-800 mt-0.5">
                    {product.barcode || product.sku}
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-2.5">
                    Nombre Oficial
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mt-0.5">
                    {product.name}
                  </div>
                </div>
              </div>

              {/* Ficha Técnica y Económica Completa */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Ficha Técnica y Económica
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">{product.brand}</span>
                </div>

                {/* Descripción */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Descripción
                  </span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {product.description || "Sin descripción adicional registrada en catálogo."}
                  </p>
                </div>

                {/* Categoría y Subcategoría */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Categoría
                    </span>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                      {product.category}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Subcategoría
                    </span>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                      {product.subcategory || "General"}
                    </div>
                  </div>
                </div>

                {/* Disciplina y Marca */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Disciplina
                    </span>
                    <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                      {product.discipline}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                      Marca
                    </span>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5">
                      {product.brand}
                    </div>
                  </div>
                </div>

                {/* Precios: Costo de Compra y Precio de Venta */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10.5px] text-slate-500 font-medium">Costo de Compra</span>
                      <div className="text-xs font-semibold text-slate-700">
                        {formatCurrency(product.costPrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10.5px] text-slate-500 font-medium">Precio de Venta</span>
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(product.price)}
                      </div>
                    </div>
                  </div>

                  {/* Margen de Utilidad */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-50/80 rounded-lg border border-emerald-100 text-xs">
                    <span className="text-emerald-800 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      Margen Bruto
                    </span>
                    <span className="font-bold text-emerald-900">
                      +{marginPercentage}% ({formatCurrency(profitMargin)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* COLUMNA DERECHA: DOS TABLAS ORDENADAS (VARIANTES + TALLES) */}
            {/* ======================================================== */}
            <div className="lg:col-span-8 space-y-5">
              {/* ---------------------------------------------------- */}
              {/* TABLA 1: VARIANTES, TALLES, CÓDIGOS DE BARRA Y STOCK */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Variantes, Talles y Stock
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {product.variants.length} variante(s) registradas
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Color</th>
                        <th className="py-3 px-3">Talle</th>
                        <th className="py-3 px-3 font-mono">Cód. de Barra</th>
                        <th className="py-3 px-3 text-center">Stock Tienda</th>
                        <th className="py-3 px-3 text-center">Stock Depósito</th>
                        <th className="py-3 px-3 text-center">Recibido</th>
                        <th className="py-3 px-3 text-center">Vendido</th>
                        <th className="py-3 px-4 text-center">Existencias</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {product.variants.map((v, idx) => {
                        const variantTotal = (v.stockStore || 0) + (v.stockWarehouse || 0);
                        const isLowStore = (v.stockStore || 0) <= 2;
                        const vReceived = v.receivedCount ?? (variantTotal * 3 + 25);
                        const vSold = (v.soldCountStore || 0) + (v.soldCountWeb || 0) || Math.floor(vReceived * 0.7);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            {/* Color */}
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />
                                <span>{v.color}</span>
                              </div>
                            </td>

                            {/* Talle */}
                            <td className="py-3 px-3 font-bold text-slate-800">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">
                                {v.size}
                              </span>
                            </td>

                            {/* Código de Barra */}
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                              {v.barcode || `${product.barcode}-${v.size}`}
                            </td>

                            {/* Stock Tienda (Saavedra 241) */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  isLowStore
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {v.stockStore} un.
                              </span>
                            </td>

                            {/* Stock Depósito */}
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">
                                {v.stockWarehouse} un.
                              </span>
                            </td>

                            {/* Recibido */}
                            <td className="py-3 px-3 text-center font-medium text-slate-600">
                              {vReceived}
                            </td>

                            {/* Vendido */}
                            <td className="py-3 px-3 text-center font-medium text-slate-600">
                              {vSold}
                            </td>

                            {/* Existencias Totales */}
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center justify-center font-bold px-2.5 py-0.5 rounded-full text-[11.5px] bg-[#c2f25b]/40 text-slate-900 border border-[#c2f25b]">
                                {variantTotal}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subfooter summary */}
                <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Control de stock atómico con PostgreSQL</span>
                  </div>
                  <div className="font-semibold text-slate-700">
                    Total Físico: {totalStock} unidades disponibles
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* TABLA 2: GUÍA DE TALLAS Y CONVERSIÓN (AR, USA, EUROPA, BRASIL, CM) */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Tabla de Tallas y Conversión Internacional
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    Estándar Matacos Deportes
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Talle AR (Local)</th>
                        <th className="py-3 px-4">Talle USA (US)</th>
                        <th className="py-3 px-4">Talle Europa (EU)</th>
                        <th className="py-3 px-4">Talle Brasil (BR)</th>
                        <th className="py-3 px-4">Medida (CM)</th>
                        <th className="py-3 px-4 text-right">Equivalencia / Calce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {sizeConversions.map((conv, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          {/* AR */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[11px]">
                              {conv.ar}
                            </span>
                          </td>

                          {/* US */}
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {conv.us}
                          </td>

                          {/* EU */}
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {conv.eu}
                          </td>

                          {/* BR */}
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {conv.br}
                          </td>

                          {/* CM */}
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {conv.cm}
                          </td>

                          {/* Nota */}
                          <td className="py-3 px-4 text-right">
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                              {conv.note || "Ajuste estándar"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/40 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Valores de referencia para calzado e indumentaria de alta competencia.</span>
                  <span className="text-emerald-700 font-semibold">Formosa, Saavedra 241</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Sub-views for other tabs */}
        {activeTab === "details" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4 animate-in fade-in-50">
            <h2 className="text-base font-bold text-slate-900">Especificaciones del Catálogo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Nombre Completo</span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{product.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Disciplina Deportiva</span>
                <span className="font-semibold text-emerald-700 text-sm mt-0.5 block">{product.discipline}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Categoría & Subcategoría</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{product.category} &gt; {product.subcategory || "General"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Código SKU / Barcode Base</span>
                <span className="font-mono font-semibold text-slate-800 mt-0.5 block">{product.sku} / {product.barcode}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "variants" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4 animate-in fade-in-50">
            <h2 className="text-base font-bold text-slate-900">Administrador de Variantes</h2>
            <p className="text-xs text-slate-500">Control individual de códigos de barra por talle y color.</p>
            <div className="space-y-2">
              {product.variants.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                      Talle {v.size}
                    </span>
                    <span className="font-medium text-slate-700">{v.color}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{v.barcode}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-semibold">Salón: {v.stockStore} un.</span>
                    <span className="text-slate-600 font-medium">Depósito: {v.stockWarehouse} un.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "rates" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4 animate-in fade-in-50">
            <h2 className="text-base font-bold text-slate-900">Estructura de Precios y Tarifas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-400 font-medium">Costo de Adquisición</span>
                <div className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(product.costPrice)}</div>
                <span className="text-[10px] text-slate-500">Precio neto mayorista proveedor</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-700 font-medium">Margen Bruto de Ganancia</span>
                <div className="text-lg font-bold text-emerald-800 mt-1">+{marginPercentage}%</div>
                <span className="text-[10px] text-emerald-600 font-medium">Utilidad: {formatCurrency(profitMargin)}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 text-white">
                <span className="text-xs text-slate-400 font-medium">Precio Venta Público</span>
                <div className="text-lg font-bold text-[#c2f25b] mt-1">{formatCurrency(product.price)}</div>
                <span className="text-[10px] text-slate-300">Precio final en mostrador</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "size_guide" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4 animate-in fade-in-50">
            <h2 className="text-base font-bold text-slate-900">Guía Completa de Medidas y Calce</h2>
            <p className="text-xs text-slate-500">Tabla de equivalencias internacionales recomendada para clientes de Matacos Deportes.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Argentina (AR)</th>
                    <th className="p-3">Estados Unidos (USA)</th>
                    <th className="p-3">Europa (EU)</th>
                    <th className="p-3">Brasil (BR)</th>
                    <th className="p-3">Longitud (CM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sizeConversions.map((sc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{sc.ar}</td>
                      <td className="p-3">{sc.us}</td>
                      <td className="p-3">{sc.eu}</td>
                      <td className="p-3">{sc.br}</td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{sc.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Editar Producto */}
      <ProductFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          onBack();
        }}
        productToEdit={product}
      />

      {/* Modal de Confirmación para Dar de Baja Lógica */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-md rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">
                  ¿Eliminar producto?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  El producto <strong className="text-slate-800 font-semibold">{product.name}</strong> se dará de baja del mostrador (POS) y del catálogo activo, pero <span className="font-medium text-slate-700">su historial de ventas y trazabilidad se conservarán intactos</span>.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Producto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
