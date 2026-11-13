"use client";

import React, { useState } from "react";
import { WizardFormState, ProductVariantItem } from "./types";
import { guessColorHexFromName } from "./colorMatcher";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Barcode,
  Layers,
  Sparkles,
  Store,
  Warehouse,
  Check,
  AlertCircle,
  Copy,
  Sliders,
} from "lucide-react";

interface Step6Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
}

export const Step6VariantsStock: React.FC<Step6Props> = ({ form, updateForm }) => {
  // Generador Color × Talle
  const [colorInput, setColorInput] = useState("");
  const [colorHexInput, setColorHexInput] = useState("#111827");
  const [sizeInput, setSizeInput] = useState("");

  const [bulkStockStore, setBulkStockStore] = useState<number | "">("");
  const [bulkStockWarehouse, setBulkStockWarehouse] = useState<number | "">("");
  const [bulkPrice, setBulkPrice] = useState<number | "">("");

  const [activeColorFilter, setActiveColorFilter] = useState<string>("ALL");

  const variants = form.variants || [];

  // Colores únicos existentes
  const uniqueColors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));

  // Detección y ajuste intuitivo del color según lo que escribe el usuario
  const handleColorInputChange = (value: string) => {
    setColorInput(value);
    const autoHex = guessColorHexFromName(value);
    if (autoHex) {
      setColorHexInput(autoHex);
    }
  };

  // Agregar una variante individual o por combinación
  const handleAddManualVariant = () => {
    if (!colorInput.trim() || !sizeInput.trim()) return;

    const baseSku = form.skuModel ? form.skuModel : "PROD";
    const cleanColor = colorInput.trim();
    const cleanHex = colorHexInput || guessColorHexFromName(cleanColor) || "#111827";
    const cleanSize = sizeInput.trim();
    const sku = `${baseSku}-${cleanColor.slice(0, 3).toUpperCase()}-${cleanSize.replace(/\s+/g, "")}`;

    const newVariant: ProductVariantItem = {
      color: cleanColor,
      colorHex: cleanHex,
      size: cleanSize,
      sku,
      barcode: "",
      price: null,
      stockStore: 2,
      stockWarehouse: 5,
      minStoreStock: 1,
      minStock: 2,
    };

    updateForm({ variants: [...variants, newVariant] });
    setSizeInput("");
  };

  // Generador masivo: varios talles para un color
  const handleGenerateSizesForColor = (sizesList: string[]) => {
    if (!colorInput.trim()) {
      alert("Ingresa un color primero para generar los talles.");
      return;
    }

    const baseSku = form.skuModel ? form.skuModel : "PROD";
    const cleanColor = colorInput.trim();
    const cleanHex = colorHexInput || guessColorHexFromName(cleanColor) || "#111827";

    const newItems: ProductVariantItem[] = sizesList.map((size) => ({
      color: cleanColor,
      colorHex: cleanHex,
      size,
      sku: `${baseSku}-${cleanColor.slice(0, 3).toUpperCase()}-${size.replace(/\s+/g, "")}`,
      barcode: "",
      price: null,
      stockStore: 1,
      stockWarehouse: 4,
      minStoreStock: 1,
      minStock: 2,
    }));

    // Filtrar para no duplicar combinación exacta (color + talle)
    const filteredExisting = variants.filter(
      (v) => !(v.color.toLowerCase() === cleanColor.toLowerCase() && sizesList.includes(v.size))
    );

    updateForm({ variants: [...filteredExisting, ...newItems] });
  };

  // Actualizar una variante específica
  const handleUpdateVariant = (index: number, updates: Partial<ProductVariantItem>) => {
    const updated = variants.map((v, i) => (i === index ? { ...v, ...updates } : v));
    updateForm({ variants: updated });
  };

  // Eliminar variante
  const handleRemoveVariant = (index: number) => {
    updateForm({ variants: variants.filter((_, i) => i !== index) });
  };

  // Aplicar a todos los talles (Acciones masivas)
  const handleApplyBulk = () => {
    const updated = variants.map((v) => {
      // Si hay filtro de color, aplicar solo a ese color
      if (activeColorFilter !== "ALL" && v.color !== activeColorFilter) return v;

      return {
        ...v,
        ...(bulkStockStore !== "" ? { stockStore: Number(bulkStockStore) } : {}),
        ...(bulkStockWarehouse !== "" ? { stockWarehouse: Number(bulkStockWarehouse) } : {}),
        ...(bulkPrice !== "" ? { price: Number(bulkPrice) } : {}),
      };
    });

    updateForm({ variants: updated });
    setBulkStockStore("");
    setBulkStockWarehouse("");
    setBulkPrice("");
  };

  // Generar códigos de barras aleatorios internos tipo EAN si están vacíos
  const handleGenerateBarcodes = () => {
    const updated = variants.map((v) => {
      if (v.barcode && v.barcode.trim() !== "") return v;
      const random = "779" + Math.floor(1000000000 + Math.random() * 9000000000).toString();
      return { ...v, barcode: random };
    });
    updateForm({ variants: updated });
  };

  // Variantes filtradas por color
  const displayedVariants = variants.filter(
    (v) => activeColorFilter === "ALL" || v.color === activeColorFilter
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">6. Variantes, Precios y Control de Stock</h2>
        <p className="text-xs text-slate-500">
          Genera las combinaciones de color × talle y asigna existencias entre Salón (Saavedra 241) y Depósito.
        </p>
      </div>

      {/* Generador Rápido de Variantes */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Generador de Variantes (Color × Talle)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Color y Selector Hex */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-bold text-slate-900">Color</label>
            <div className="flex items-center gap-2">
              {/* Muestra visual automática de color (sin selector emergente nativo) */}
              <div
                className="w-9 h-9 rounded-lg border border-slate-300 shadow-2xs shrink-0 transition-colors duration-200 select-none"
                style={{ backgroundColor: colorHexInput }}
                title={`Color asignado automáticamente: ${colorHexInput}`}
              />
              <input
                type="text"
                placeholder="Ej: Negro / Blanco, Azul Marino"
                value={colorInput}
                onChange={(e) => handleColorInputChange(e.target.value)}
                className="flex-1 h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Talle individual */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-900">Talle Individual</label>
            <input
              type="text"
              placeholder="Ej: 41, M, L"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddManualVariant()}
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddManualVariant}
              className="w-full h-9 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Variante</span>
            </button>
          </div>
        </div>

        {/* Generadores de Curvas de Talle Rápidas */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <span className="text-[11px] font-bold text-slate-600 block">
            O generar curva completa para "{colorInput || 'este color'}":
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                handleGenerateSizesForColor(["38", "39", "40", "41", "42", "43", "44", "45"])
              }
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded cursor-pointer"
            >
              Curva Calzado (38 a 45)
            </button>
            <button
              type="button"
              onClick={() => handleGenerateSizesForColor(["S", "M", "L", "XL", "XXL"])}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded cursor-pointer"
            >
              Curva Ropa (S a XXL)
            </button>
            <button
              type="button"
              onClick={() => handleGenerateSizesForColor(["Talle Único"])}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded cursor-pointer"
            >
              Talle Único
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar de Acciones Masivas y Filtros */}
      {variants.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Sliders className="w-4 h-4" />
              <span>Acciones Masivas para {displayedVariants.length} variante(s)</span>
            </div>

            {/* Filtro por color */}
            {uniqueColors.length > 1 && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400">Filtrar color:</span>
                <select
                  value={activeColorFilter}
                  onChange={(e) => setActiveColorFilter(e.target.value)}
                  className="h-7 px-2 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                >
                  <option value="ALL">Todos los colores</option>
                  {uniqueColors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <input
              type="number"
              placeholder="Stock Salón (ej: 3)"
              value={bulkStockStore}
              onChange={(e) =>
                setBulkStockStore(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="h-8 px-2.5 rounded bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500"
            />
            <input
              type="number"
              placeholder="Stock Depósito (ej: 8)"
              value={bulkStockWarehouse}
              onChange={(e) =>
                setBulkStockWarehouse(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="h-8 px-2.5 rounded bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500"
            />
            <input
              type="number"
              placeholder="Precio diferencial $"
              value={bulkPrice}
              onChange={(e) =>
                setBulkPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="h-8 px-2.5 rounded bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleApplyBulk}
              className="h-8 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
            >
              Aplicar a Mostrados
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleGenerateBarcodes}
              className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer flex items-center gap-1"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Autogenerar códigos de barras vacíos (EAN interno)</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabla de Variantes */}
      {displayedVariants.length > 0 ? (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Color</th>
                <th className="p-3">Talle</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Cód. Barras</th>
                <th className="p-3">Precio Esp.</th>
                <th className="p-3 bg-emerald-50 text-emerald-950">
                  <div className="flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Salón</span>
                  </div>
                </th>
                <th className="p-3 bg-blue-50 text-blue-950">
                  <div className="flex items-center gap-1">
                    <Warehouse className="w-3.5 h-3.5 text-blue-700" />
                    <span>Depósito</span>
                  </div>
                </th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayedVariants.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {/* Color con miniatura */}
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                        style={{
                          backgroundColor:
                            v.colorHex || guessColorHexFromName(v.color) || "#111827",
                        }}
                        title={v.colorHex || v.color}
                      />
                      <span className="font-bold text-slate-900 truncate max-w-[90px]">
                        {v.color}
                      </span>
                    </div>
                  </td>

                  {/* Talle */}
                  <td className="p-2.5">
                    <span className="font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded">
                      {v.size}
                    </span>
                  </td>

                  {/* SKU */}
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(idx, { sku: e.target.value })}
                      className="w-28 h-7 px-1.5 rounded border border-slate-200 text-xs font-mono font-bold"
                    />
                  </td>

                  {/* Barcode */}
                  <td className="p-2.5">
                    <input
                      type="text"
                      placeholder="Sin código"
                      value={v.barcode || ""}
                      onChange={(e) => handleUpdateVariant(idx, { barcode: e.target.value })}
                      className="w-28 h-7 px-1.5 rounded border border-slate-200 text-xs font-mono"
                    />
                  </td>

                  {/* Precio específico si varía */}
                  <td className="p-2.5">
                    <input
                      type="number"
                      placeholder={form.price ? `$ ${form.price}` : "General"}
                      value={v.price || ""}
                      onChange={(e) =>
                        handleUpdateVariant(idx, {
                          price: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-20 h-7 px-1.5 rounded border border-slate-200 text-xs text-right font-medium"
                    />
                  </td>

                  {/* Stock Salón */}
                  <td className="p-2.5 bg-emerald-50/40">
                    <input
                      type="number"
                      value={v.stockStore}
                      onChange={(e) =>
                        handleUpdateVariant(idx, { stockStore: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-16 h-7 px-1.5 rounded border border-emerald-300 text-xs font-bold text-emerald-950 text-center bg-white"
                      min={0}
                    />
                  </td>

                  {/* Stock Depósito */}
                  <td className="p-2.5 bg-blue-50/40">
                    <input
                      type="number"
                      value={v.stockWarehouse}
                      onChange={(e) =>
                        handleUpdateVariant(idx, {
                          stockWarehouse: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-16 h-7 px-1.5 rounded border border-blue-300 text-xs font-bold text-blue-950 text-center bg-white"
                      min={0}
                    />
                  </td>

                  {/* Eliminar */}
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-slate-300 hover:text-red-600 p-1 cursor-pointer"
                      title="Eliminar variante"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400 bg-slate-50">
          No hay variantes generadas aún. Agrega una o genera una curva arriba.
        </div>
      )}
    </div>
  );
};
