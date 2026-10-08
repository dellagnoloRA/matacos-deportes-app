"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Barcode,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { DetailedProductItem, ProductVariantItem } from "./types";
import { createQuickPosProduct } from "@/server/actions/posSaleActions";
import { formatCurrency } from "@/lib/utils";

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchQuery?: string;
  disciplines?: string[];
  categories?: string[];
  brands?: string[];
  onProductCreated: (
    product: DetailedProductItem,
    variant: ProductVariantItem
  ) => void;
}

const COMMON_DISCIPLINES = [
  "Multideporte",
  "Running / Urbano",
  "Natación",
  "Vóley",
  "Básquet",
  "Fútbol",
  "Pádel / Tenis",
  "Fitness / Gym",
];

const COMMON_CATEGORIES = [
  "Calzado",
  "Indumentaria",
  "Accesorios",
  "Equipamiento",
  "Protección",
];

const COMMON_BRANDS = [
  "Topper",
  "Adidas",
  "Puma Sports",
  "Speedo",
  "Arena",
  "Mikasa",
  "Wilson",
  "Matacos",
  "Genérica",
];

const COMMON_SIZES = [
  "Único",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
];

export function QuickProductModal({
  isOpen,
  onClose,
  initialSearchQuery = "",
  disciplines = COMMON_DISCIPLINES,
  categories = COMMON_CATEGORIES,
  brands = COMMON_BRANDS,
  onProductCreated,
}: QuickProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("");
  const [size, setSize] = useState("Único");
  const [customSize, setCustomSize] = useState("");
  const [color, setColor] = useState("Único");
  const [barcode, setBarcode] = useState("");
  const [disciplineName, setDisciplineName] = useState("Multideporte");
  const [categoryName, setCategoryName] = useState("Calzado");
  const [brandName, setBrandName] = useState("Genérica");
  const [initialStock, setInitialStock] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicializar campos según la búsqueda previa
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);
    setIsSubmitting(false);

    const query = initialSearchQuery.trim();
    const isDigitsOnly = /^\d{6,}$/.test(query);

    if (isDigitsOnly) {
      setBarcode(query);
      setName("");
    } else {
      setName(query);
      setBarcode("");
    }

    setPrice("");
    setCostPrice("");
    setSize("Único");
    setCustomSize("");
    setColor("Único");
    setDisciplineName("Multideporte");
    setCategoryName("Calzado");
    setBrandName("Genérica");
    setInitialStock(1);
  }, [isOpen, initialSearchQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMessage("El nombre del producto debe tener al menos 2 caracteres.");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMessage("Ingrese un precio de venta válido mayor a cero.");
      return;
    }

    const finalSize = (size === "OTRO" ? customSize.trim() : size.trim()) || "Único";
    if (!finalSize) {
      setErrorMessage("Debe especificar un talle para la prenda.");
      return;
    }

    const parsedCost = costPrice ? parseFloat(costPrice) : null;

    setIsSubmitting(true);
    try {
      const res = await createQuickPosProduct({
        name: trimmedName,
        price: parsedPrice,
        costPrice: parsedCost && !isNaN(parsedCost) ? parsedCost : null,
        size: finalSize,
        color: color.trim() || "Único",
        barcode: barcode.trim() || null,
        disciplineName: disciplineName.trim() || "Multideporte",
        categoryName: categoryName.trim() || "General",
        brandName: brandName.trim() || "Genérica",
        initialStock: Math.max(1, initialStock || 1),
      });

      if (!res.success || !res.product || !res.variant) {
        setErrorMessage(res.error || "Ocurrió un error al registrar el producto.");
        setIsSubmitting(false);
        return;
      }

      onProductCreated(res.product, res.variant);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al conectar con el servidor.";
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">
                  Carga Rápida de Producto
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                  Emergencia
                </span>
              </div>
              <p className="text-xs text-amber-100 leading-tight mt-0.5">
                Alta express para productos aún no catalogados en stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-amber-50/80 border-b border-amber-200/60 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-900 shrink-0">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            El producto se creará en el catálogo con stock en salón y se agregará <strong>automáticamente a la preventa</strong>.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-left">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de la Prenda o Artículo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej: Zapatilla Topper Basquet / Remera Matacos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
            />
          </div>

          {/* Precios (Venta + Costo opcional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Precio de Venta ($ ARS) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Precio Costo (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-slate-400 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Talle y Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Talle <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-1.5">
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                >
                  {COMMON_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="OTRO">Otro talle...</option>
                </select>
                {size === "OTRO" && (
                  <input
                    type="text"
                    required
                    placeholder="Escribir talle (ej. 39.5, 4XL)"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold outline-none"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Color
              </label>
              <input
                type="text"
                placeholder="Ej: Negro / Azul / Único"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-500 outline-none transition"
              />
            </div>
          </div>

          {/* Código de barras y Stock inicial */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código de Barras (Lector USB)
              </label>
              <div className="relative">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Escaneá o ingresá el código"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-amber-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stock Salón
              </label>
              <input
                type="number"
                min="1"
                required
                value={initialStock}
                onChange={(e) => setInitialStock(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-900 focus:bg-white focus:border-amber-500 outline-none transition"
              />
            </div>
          </div>

          {/* Categorización rápida: Disciplina, Categoría, Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Disciplina
              </label>
              <select
                value={disciplineName}
                onChange={(e) => setDisciplineName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-amber-500"
              >
                {disciplines.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Categoría
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-amber-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Marca
              </label>
              <input
                type="text"
                list="brands-list"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Marca"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-amber-500"
              />
              <datalist id="brands-list">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar y Sumar a la Preventa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
