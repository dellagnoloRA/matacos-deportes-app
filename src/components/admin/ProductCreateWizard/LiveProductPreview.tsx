"use client";

import React, { useState } from "react";
import { WizardFormState, SizeGuideItem } from "./types";
import { formatCurrency } from "@/lib/utils";
import {
  Truck,
  Store,
  ChevronDown,
  Ruler,
  Check,
  Star,
  Info,
  Smartphone,
  Monitor,
  Eye,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Minus,
  Maximize2,
  Minimize2,
  X,
  GripHorizontal,
} from "lucide-react";

interface LiveProductPreviewProps {
  form: WizardFormState;
  brandName?: string;
  categoryName?: string;
  selectedSizeGuide?: SizeGuideItem | null;
  onClose?: () => void;
  onMinimize?: () => void;
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
  onHeaderMouseDown?: (e: React.MouseEvent) => void;
}

export const LiveProductPreview: React.FC<LiveProductPreviewProps> = ({
  form,
  brandName,
  categoryName,
  selectedSizeGuide,
  onClose,
  onMinimize,
  onToggleMaximize,
  isMaximized = false,
  onHeaderMouseDown,
}) => {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [previewColor, setPreviewColor] = useState<string>("");
  const [previewSize, setPreviewSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "talles" | "specs">("desc");
  const [isSizeGuideModalOpen, setIsSizeGuideModalOpen] = useState(false);

  // Colores únicos deducidos de las variantes o de las fotos
  const availableColors = React.useMemo(() => {
    const map = new Map<string, string>();
    form.variants.forEach((v) => {
      if (v.color && !map.has(v.color)) {
        map.set(v.color, v.colorHex || "#334155");
      }
    });
    if (map.size === 0 && form.generalImages.some((i) => i.color)) {
      form.generalImages.forEach((i) => {
        if (i.color && !map.has(i.color)) {
          map.set(i.color, "#334155");
        }
      });
    }
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [form.variants, form.generalImages]);

  // Si no hay color seleccionado aún, tomar el primero
  const currentColor = previewColor || (availableColors[0]?.name ?? "");

  // Talles disponibles
  const availableSizes = React.useMemo(() => {
    const list: { size: string; inStock: boolean }[] = [];
    form.variants.forEach((v) => {
      if (!list.some((item) => item.size === v.size)) {
        list.push({
          size: v.size,
          inStock: v.stockStore + v.stockWarehouse > 0,
        });
      }
    });
    return list;
  }, [form.variants]);

  const currentSize = previewSize || (availableSizes[0]?.size ?? "");

  // Fotos para mostrar
  const displayImages = React.useMemo(() => {
    // Si hay fotos asociadas al color actual
    if (currentColor && form.colorImages && form.colorImages[currentColor]?.length > 0) {
      return form.colorImages[currentColor];
    }
    if (form.generalImages && form.generalImages.length > 0) {
      return form.generalImages.map((img) => img.url);
    }
    return [];
  }, [form.generalImages, form.colorImages, currentColor]);

  // Cálculos de precios
  const salePrice = Number(form.price) || 0;
  const listPrice = Number(form.listPrice) || 0;
  const discountPercent =
    listPrice > salePrice && listPrice > 0
      ? Math.round(((listPrice - salePrice) / listPrice) * 100)
      : null;
  const vatRate = Number(form.vatRate) || 21;
  const netPrice = salePrice > 0 ? salePrice / (1 + vatRate / 100) : 0;
  const installments = Number(form.installments) || 6;
  const installmentAmount = salePrice > 0 ? Math.round(salePrice / installments) : 0;

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-none border-0 overflow-hidden shadow-none">
      {/* Barra superior UNIFICADA de control y ventana de la Preview */}
      <div
        onMouseDown={onHeaderMouseDown}
        className={`bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between shrink-0 select-none rounded-none ${
          !isMaximized && onHeaderMouseDown ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {/* Izquierda: Indicador en vivo + Título (y agarre para mover) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {!isMaximized && onHeaderMouseDown && (
            <GripHorizontal className="w-4 h-4 text-slate-500 hover:text-slate-300 shrink-0 cursor-grab" />
          )}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#00D615]" />
            <span className="text-xs font-extrabold text-white tracking-wide">
              Vista Previa en Vivo
            </span>
          </div>
        </div>

        {/* Centro: Switcher Desktop / Mobile */}
        <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode("desktop")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "desktop"
                ? "bg-slate-950 text-[#00D615] shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
            title="Vista de Escritorio"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("mobile")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "mobile"
                ? "bg-slate-950 text-[#00D615] shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
            title="Vista Móvil"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Derecha: Controles de Ventana (Minimizar, Agrandar/Restaurar, Cerrar) */}
        <div className="flex items-center gap-1">
          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Minimizar a la esquina"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isMaximized ? "Restaurar tamaño normal" : "Agrandar pantalla completa"}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
              title="Cerrar vista previa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenedor del dispositivo o página web completa con SCROLLBAR fluido */}
      <div
        className={`flex-1 overflow-y-scroll [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 transition-colors ${
          viewMode === "mobile"
            ? "p-4 sm:p-6 flex justify-center bg-slate-100"
            : "p-0 bg-white"
        }`}
      >
        <div
          className={`transition-all duration-200 ${
            viewMode === "mobile"
              ? "w-[390px] bg-white border border-slate-300 shadow-xl rounded-2xl overflow-hidden self-start text-xs my-4"
              : "w-full bg-white rounded-none border-0 shadow-none min-h-full flex flex-col"
          }`}
        >
          {/* 1. Barra de promociones superior (Idéntica a la tienda en vivo) */}
          <div className="bg-[#051c16] text-white px-4 sm:px-8 py-2 flex items-center justify-between text-xs font-medium border-b border-emerald-950 shrink-0 select-none">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs">
              <span className="font-black tracking-wider text-[#00D615]">MATACOS DEPORTES</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 truncate">Saavedra 241, Formosa Capital</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-300 hidden sm:flex">
              <span className="text-emerald-400 font-bold">¡Envío Gratis &gt; $ 109.999!</span>
              <span>•</span>
              <span>3 y 6 Cuotas Sin Interés</span>
            </div>
          </div>

          {/* 2. Header completo de tienda en modo escritorio */}
          {viewMode === "desktop" && (
            <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-6 shrink-0 select-none">
              <div className="flex items-center gap-8">
                <div className="text-xl font-black text-slate-950 tracking-tighter flex items-center gap-1">
                  <span>MATACOS</span>
                  <span className="text-[#00D615] text-2xl leading-none">•</span>
                </div>
                <nav className="hidden md:flex items-center gap-5 text-xs font-extrabold text-slate-700">
                  <span className="hover:text-emerald-600 transition-colors cursor-pointer">CALZADO</span>
                  <span className="hover:text-emerald-600 transition-colors cursor-pointer">INDUMENTARIA</span>
                  <span className="hover:text-emerald-600 transition-colors cursor-pointer">ACCESORIOS</span>
                  <span className="hover:text-emerald-600 transition-colors cursor-pointer">DISCIPLINAS</span>
                  <span className="text-rose-600 font-black hover:text-rose-700 transition-colors cursor-pointer">OFERTAS</span>
                </nav>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs w-48 lg:w-64 border border-slate-200">
                  <span>Buscar en el catálogo...</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Breadcrumbs reales de la tienda */}
          <nav className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 text-xs font-medium text-slate-500 select-none">
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <span className="hover:text-slate-950 transition-colors cursor-pointer">Inicio</span>
              <span className="text-slate-300">/</span>
              <span className="hover:text-slate-950 transition-colors cursor-pointer">
                {categoryName || "Catálogo"}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
                {form.name || "Nuevo Producto"}
              </span>
            </div>
          </nav>

          <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8">
            {/* Grid Principal: Fotos a la izquierda, detalles a la derecha */}
            <div className={`grid gap-6 ${viewMode === "mobile" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-12"}`}>
              {/* Fotos (Columna Izquierda) */}
              <div className={`${viewMode === "mobile" ? "w-full" : "md:col-span-6"} space-y-3`}>
                {/* Imagen Principal o Placeholder Gris */}
                <div className="relative aspect-square bg-[#f8fafc] rounded-xl border border-slate-200/80 flex items-center justify-center overflow-hidden group">
                  {displayImages.length > 0 ? (
                    <img
                      src={displayImages[activeImgIndex] || displayImages[0]}
                      alt={form.name || "Producto"}
                      className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 p-6 text-center space-y-2">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        📷
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        Foto principal aparecerá aquí
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Mínimo 3 fotos recomendadas)
                      </span>
                    </div>
                  )}

                  {/* Etiquetas comerciales flotantes */}
                  {form.tags && form.tags.length > 0 && (
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {form.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-slate-950 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Miniaturas de Fotos */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {displayImages.length > 0 ? (
                    displayImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImgIndex(idx)}
                        className={`w-14 h-14 rounded-lg border-2 p-1 bg-white shrink-0 transition-all cursor-pointer ${
                          activeImgIndex === idx
                            ? "border-slate-950 shadow-xs"
                            : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="Thumb" className="w-full h-full object-contain" />
                      </button>
                    ))
                  ) : (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="w-14 h-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-300"
                        >
                          Foto {n}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Información del Producto */}
              <div className={`${viewMode === "mobile" ? "w-full" : "md:col-span-6"} space-y-3.5`}>
                {/* SKU / Código */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    SKU:{" "}
                    <strong className="text-slate-600 font-mono">
                      {form.skuModel || "AS-MODEL-001"}
                    </strong>
                  </span>
                  {brandName && (
                    <span className="uppercase font-bold tracking-wider text-slate-500">
                      {brandName}
                    </span>
                  )}
                </div>

                {/* Nombre del Producto */}
                {form.name ? (
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 leading-tight">
                    {form.name}
                  </h1>
                ) : (
                  <div className="space-y-1.5 py-1">
                    <div className="h-6 bg-slate-200 rounded-md w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded-md w-1/2 animate-pulse" />
                  </div>
                )}

                {/* Precios */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    {salePrice > 0 ? (
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                        {formatCurrency(salePrice)}
                      </span>
                    ) : (
                      <div className="h-8 bg-slate-200 rounded-md w-32 animate-pulse" />
                    )}

                    {listPrice > salePrice && (
                      <span className="text-sm sm:text-base text-slate-400 line-through">
                        {formatCurrency(listPrice)}
                      </span>
                    )}

                    {discountPercent && discountPercent > 0 && (
                      <span className="bg-rose-500 text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 font-normal">
                    Precio sin Impuestos Nacionales:{" "}
                    <strong className="text-slate-600 font-medium">
                      {netPrice > 0 ? formatCurrency(netPrice) : "$ 0,00"}
                    </strong>
                  </div>
                </div>

                {/* Cuotas sin interés */}
                <div>
                  <span className="inline-block bg-[#dcfce7] text-[#15803d] font-bold text-xs px-2.5 py-1 rounded">
                    {installments} cuotas de{" "}
                    {installmentAmount > 0 ? formatCurrency(installmentAmount) : "$ 0,00"} sin interés
                  </span>
                </div>

                {/* Logos de Pago */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#ff5e00] text-white font-black text-[9px]">
                    Galicia
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#008d36] text-white font-bold text-[9px]">
                    Provincia
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#009ee3] text-white font-bold text-[9px]">
                    mercado pago
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#1a1f71] text-white font-black text-[9px]">
                    VISA
                  </span>
                  <span className="inline-flex items-center h-4.5 px-1 rounded bg-white border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-red-500 -mr-0.5 inline-block" />
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  </span>
                  <span className="text-[11px] text-slate-600 underline font-medium cursor-pointer ml-1">
                    Ver detalle
                  </span>
                </div>

                {/* Envío Gratuito */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pt-1">
                  <Truck className="w-4 h-4 text-slate-800 shrink-0" />
                  <span>¡Envío gratuito en pedidos de $ 109.999!</span>
                </div>

                {/* Selector de Color en Círculos */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-900">
                    Color:{" "}
                    <span className="font-extrabold text-slate-950 ml-1">
                      {currentColor || "(Seleccionar color)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {availableColors.length > 0 ? (
                      availableColors.map((c) => {
                        const isSelected = currentColor.toLowerCase() === c.name.toLowerCase();
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                              setPreviewColor(c.name);
                              setActiveImgIndex(0);
                            }}
                            className={`w-7 h-7 rounded-full p-0.5 transition-all cursor-pointer ${
                              isSelected
                                ? "ring-2 ring-slate-950 ring-offset-2 scale-110"
                                : "hover:scale-105 opacity-80 hover:opacity-100"
                            }`}
                            title={c.name}
                          >
                            <span
                              className="block w-full h-full rounded-full border border-black/15 shadow-2xs"
                              style={{ backgroundColor: c.hex }}
                            />
                          </button>
                        );
                      })
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 animate-pulse" />
                        <div className="w-7 h-7 rounded-full bg-slate-200 animate-pulse" />
                        <span className="text-[11px] text-slate-400 italic">
                          Los colores se generarán en el Paso 6 (Variantes)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selector de Talle */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <div>
                      Talle:{" "}
                      <span className="font-extrabold text-slate-950 ml-1">
                        {currentSize || "(Elegir talle)"}
                      </span>
                    </div>

                    {form.useSizeGuide && (
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 hover:text-slate-950 underline underline-offset-2 cursor-pointer"
                      >
                        <Ruler className="w-3.5 h-3.5" />
                        <span>Guía de talles</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {availableSizes.length > 0 ? (
                      availableSizes.map((s) => {
                        const isSelected = currentSize === s.size;
                        return (
                          <button
                            key={s.size}
                            type="button"
                            onClick={() => setPreviewSize(s.size)}
                            className={`min-w-[40px] h-9 px-2 rounded border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                                : "bg-white text-slate-800 border-slate-300 hover:border-slate-800"
                            }`}
                          >
                            {s.size}
                          </button>
                        );
                      })
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {["39", "40", "41", "42"].map((t) => (
                          <div
                            key={t}
                            className="w-10 h-9 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs text-slate-400"
                          >
                            {t}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stepper Cantidad + Botón Agregar al Carrito Verde Lima */}
                <div className="flex items-center gap-2.5 pt-2">
                  <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white h-10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-xs text-slate-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="flex-1 h-10 bg-[#9bdc65] hover:bg-[#8ccb55] text-slate-950 font-extrabold text-xs sm:text-sm rounded-full shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                  >
                    <span>Agregar al carrito</span>
                  </button>
                </div>

                {/* Retiro en Formosa */}
                <div className="border border-slate-200 rounded-lg p-2.5 space-y-1.5 bg-[#fafafa] text-[11px] text-slate-700">
                  <div className="flex items-start gap-2">
                    <Store className="w-3.5 h-3.5 text-[#00A811] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">Retiro GRATIS en sucursal</strong>
                      <span className="text-slate-500">Saavedra 241, Formosa Capital</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Apartados Inferiores: Pestañas */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4 border-b border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("desc")}
                  className={`pb-2 transition-all cursor-pointer ${
                    activeTab === "desc"
                      ? "text-slate-950 border-b-2 border-slate-950"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Descripción
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`pb-2 transition-all cursor-pointer ${
                    activeTab === "specs"
                      ? "text-slate-950 border-b-2 border-slate-950"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Ficha Técnica
                </button>
                {form.useSizeGuide && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("talles")}
                    className={`pb-2 transition-all cursor-pointer ${
                      activeTab === "talles"
                        ? "text-slate-950 border-b-2 border-slate-950"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    Tabla de Talles
                  </button>
                )}
              </div>

              <div className="py-3 text-xs text-slate-700">
                {activeTab === "desc" && (
                  <div className="space-y-3">
                    {form.shortDescription && (
                      <p className="font-medium text-slate-900">{form.shortDescription}</p>
                    )}
                    {form.description ? (
                      <div className="whitespace-pre-line text-slate-600 leading-relaxed">
                        {form.description}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">
                        La descripción detallada del producto aparecerá aquí.
                      </p>
                    )}

                    {/* Características destacadas */}
                    {form.highlights && form.highlights.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {form.highlights.map((h, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-900 block text-[11px]">
                                {h.title}
                              </strong>
                              <span className="text-[10px] text-slate-500">{h.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "specs" && (
                  <div className="space-y-2">
                    {Object.keys(form.specs || {}).length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(form.specs).map(([key, val]) => (
                          <div key={key} className="p-2 bg-slate-50 rounded border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                              {key}
                            </span>
                            <span className="font-bold text-slate-900">{val}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">
                        No hay especificaciones técnicas cargadas aún.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "talles" && (
                  <div className="space-y-2">
                    {selectedSizeGuide ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              {selectedSizeGuide.columns.map((col) => (
                                <th key={col} className="p-2">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedSizeGuide.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50">
                                {selectedSizeGuide.columns.map((col) => (
                                  <td key={col} className="p-2 text-slate-800">
                                    {row[col] || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">
                        Selecciona o crea una guía de talles en el Paso 5.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal interactivo de Guía de Talles (Réplica de lo que ve el cliente) */}
      {isSizeGuideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-950">
                  {selectedSizeGuide?.name || "Guía de Talles y Medidas"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeGuideModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedSizeGuide?.fitNote && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Nota de calce:</strong> {selectedSizeGuide.fitNote}
                </span>
              </div>
            )}

            {selectedSizeGuide ? (
              <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      {selectedSizeGuide.columns.map((col) => (
                        <th key={col} className="p-2.5">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSizeGuide.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {selectedSizeGuide.columns.map((col) => (
                          <td key={col} className="p-2.5 text-slate-800 font-medium">
                            {row[col] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No hay guía vinculada todavía.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsSizeGuideModalOpen(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Cerrar vista previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
