"use client";

import React, { useState, useMemo } from "react";
import { WizardFormState, ProductVariantItem } from "./types";
import { guessColorHexFromName } from "./colorMatcher";
import {
  Plus,
  Trash2,
  Layers,
  Store,
  Warehouse,
  AlertCircle,
  ArrowUpDown,
  FolderTree,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const SIZE_ORDER: Record<string, number> = {
  XXS: 1,
  XS: 2,
  S: 3,
  M: 4,
  L: 5,
  XL: 6,
  XXL: 7,
  "2XL": 7,
  "3XL": 8,
  "4XL": 9,
  "TALLE ÚNICO": 100,
  "TALLE UNICO": 100,
  "ÚNICO": 100,
  "UNICO": 100,
};

function compareSizes(a: string, b: string): number {
  const cleanA = (a || "").trim().toUpperCase();
  const cleanB = (b || "").trim().toUpperCase();

  const numA = parseFloat(cleanA);
  const numB = parseFloat(cleanB);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  const orderA = SIZE_ORDER[cleanA];
  const orderB = SIZE_ORDER[cleanB];
  if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
  if (orderA !== undefined) return -1;
  if (orderB !== undefined) return 1;

  return cleanA.localeCompare(cleanB, "es", { numeric: true, sensitivity: "base" });
}

function sortVariantsList(list: ProductVariantItem[]): ProductVariantItem[] {
  return [...list].sort((a, b) => {
    const colorComp = (a.color || "").trim().localeCompare((b.color || "").trim(), "es", { sensitivity: "base" });
    if (colorComp !== 0) return colorComp;
    return compareSizes(a.size, b.size);
  });
}

interface Step6Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
}

export const Step6VariantsStock: React.FC<Step6Props> = ({ form, updateForm }) => {
  // Generador Color × Talle
  const [colorInput, setColorInput] = useState("");
  const [colorHexInput, setColorHexInput] = useState("#111827");
  const [sizeInput, setSizeInput] = useState("");

  // Modos de visualización: agrupado por color / variables y colapsados
  const [isGrouped, setIsGrouped] = useState(false);
  const [expandedColors, setExpandedColors] = useState<Record<string, boolean>>({});

  const variants = form.variants || [];

  // Detección de códigos de barra duplicados entre variantes
  const duplicateBarcodes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of variants) {
      const code = v.barcode?.trim();
      if (code) {
        counts.set(code, (counts.get(code) || 0) + 1);
      }
    }
    return new Set(
      Array.from(counts.entries())
        .filter(([_, count]) => count > 1)
        .map(([code]) => code)
    );
  }, [variants]);

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

    const sorted = sortVariantsList([...variants, newVariant]);
    updateForm({ variants: sorted });
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

    const sorted = sortVariantsList([...filteredExisting, ...newItems]);
    updateForm({ variants: sorted });
  };

  // Ordenar manualmente las variantes por color y talle en orden ascendente
  const handleSortVariants = () => {
    const sorted = sortVariantsList(variants);
    updateForm({ variants: sorted });
  };

  // Alternar expandir/colapsar un grupo de color
  const toggleColorExpand = (color: string) => {
    setExpandedColors((prev) => ({
      ...prev,
      [color]: !prev[color],
    }));
  };

  // Expandir o minimizar todos los grupos
  const handleExpandAll = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    groupedByColor.forEach((g) => {
      newState[g.color] = expand;
    });
    setExpandedColors(newState);
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

  // Agrupamiento estructurado por color/variables para vista minimizada/agrupada
  const groupedByColor = useMemo(() => {
    const map = new Map<string, { items: ProductVariantItem[]; indices: number[] }>();

    variants.forEach((v, idx) => {
      const key = v.color.trim() || "Sin Color";
      if (!map.has(key)) {
        map.set(key, { items: [], indices: [] });
      }
      map.get(key)!.items.push(v);
      map.get(key)!.indices.push(idx);
    });

    return Array.from(map.entries()).map(([color, data]) => {
      // Ordenar talles de este grupo
      const pairs = data.items.map((item, i) => ({ item, index: data.indices[i] }));
      pairs.sort((a, b) => compareSizes(a.item.size, b.item.size));

      const sortedSizes = pairs.map((p) => p.item.size);
      const minSize = sortedSizes[0] || "";
      const maxSize = sortedSizes[sortedSizes.length - 1] || "";
      const sizeSummary =
        sortedSizes.length <= 1
          ? minSize
          : `${minSize} a ${maxSize}`;

      const totalStore = data.items.reduce((acc, curr) => acc + (curr.stockStore || 0), 0);
      const totalWarehouse = data.items.reduce((acc, curr) => acc + (curr.stockWarehouse || 0), 0);
      const colorHex = data.items[0]?.colorHex || guessColorHexFromName(color) || "#111827";

      return {
        color,
        colorHex,
        pairs,
        sizeSummary,
        sizesCount: data.items.length,
        totalStore,
        totalWarehouse,
      };
    });
  }, [variants]);

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
              className="w-full h-9 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Variante</span>
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

      {/* Controles de la Tabla de Variantes */}
      {variants.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">
              {variants.length} variante(s) creada(s)
            </span>
            {isGrouped && (
              <span className="text-[11px] text-slate-500 font-medium">
                ({groupedByColor.length} grupo{groupedByColor.length === 1 ? "" : "s"} de color)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Ordenar */}
            <button
              type="button"
              onClick={handleSortVariants}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Ordenar variantes por color y talle en orden numérico ascendente"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
              <span>Ordenar Talles</span>
            </button>

            {/* Toggle Agrupar / Minimizar por Variables */}
            <button
              type="button"
              onClick={() => setIsGrouped(!isGrouped)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                isGrouped
                  ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <FolderTree className={`w-3.5 h-3.5 ${isGrouped ? "text-white" : "text-emerald-600"}`} />
              <span>{isGrouped ? "Vista Agrupada (Activa)" : "Agrupar por Variables"}</span>
            </button>

            {isGrouped && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 pl-1">
                <button
                  type="button"
                  onClick={() => handleExpandAll(true)}
                  className="hover:underline cursor-pointer"
                >
                  Expandir todo
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleExpandAll(false)}
                  className="hover:underline cursor-pointer"
                >
                  Minimizar todo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Renderizado de Variantes: Agrupado vs Tabla Plana */}
      {variants.length > 0 ? (
        isGrouped ? (
          /* ================= VISTA AGRUPADA / MINIMIZADA ================= */
          <div className="space-y-3">
            {groupedByColor.map((group) => {
              const isExpanded = expandedColors[group.color] ?? false;
              return (
                <div
                  key={group.color}
                  className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden transition-all"
                >
                  {/* Cabecera resumida del grupo (clicable para colapsar/expandir) */}
                  <div
                    onClick={() => toggleColorExpand(group.color)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                        style={{ backgroundColor: group.colorHex }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-xs font-extrabold text-slate-950">
                            {group.color}
                          </strong>
                          <span className="text-[11px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            {group.sizeSummary}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({group.sizesCount} talle{group.sizesCount === 1 ? "" : "s"})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden sm:flex items-center gap-2 text-xs">
                        <span className="bg-emerald-50 text-emerald-950 border border-emerald-200/80 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 text-[11px]">
                          <Store className="w-3 h-3 text-emerald-700" />
                          <span>Salón: {group.totalStore} u.</span>
                        </span>
                        <span className="bg-blue-50 text-blue-950 border border-blue-200/80 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 text-[11px]">
                          <Warehouse className="w-3 h-3 text-blue-700" />
                          <span>Depósito: {group.totalWarehouse} u.</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                        title={isExpanded ? "Minimizar" : "Expandir"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tabla desplegable con talles del grupo */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 overflow-x-auto bg-slate-50/20">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Talle</th>
                            <th className="p-2.5">SKU</th>
                            <th className="p-2.5">Cód. Barras</th>
                            <th className="p-2.5">Precio Esp.</th>
                            <th className="p-2.5 bg-emerald-50/60 text-emerald-950">
                              <div className="flex items-center gap-1">
                                <Store className="w-3 h-3 text-emerald-700" />
                                <span>Salón</span>
                              </div>
                            </th>
                            <th className="p-2.5 bg-blue-50/60 text-blue-950">
                              <div className="flex items-center gap-1">
                                <Warehouse className="w-3 h-3 text-blue-700" />
                                <span>Depósito</span>
                              </div>
                            </th>
                            <th className="p-2.5 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium bg-white">
                          {group.pairs.map(({ item: v, index: origIdx }) => {
                            const isDuplicate = Boolean(
                              v.barcode?.trim() && duplicateBarcodes.has(v.barcode.trim())
                            );
                            return (
                              <tr
                                key={origIdx}
                                className={`transition-colors ${
                                  isDuplicate
                                    ? "bg-red-50/40 hover:bg-red-50/60"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                {/* Talle editable */}
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={v.size}
                                    onChange={(e) =>
                                      handleUpdateVariant(origIdx, { size: e.target.value })
                                    }
                                    className="w-16 h-7 px-1.5 rounded border border-slate-200 text-xs font-bold text-center bg-slate-50 hover:bg-slate-100 focus:bg-white focus:border-emerald-500 focus:outline-none"
                                    title="Modificar talle"
                                  />
                                </td>

                                {/* SKU */}
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={v.sku}
                                    onChange={(e) =>
                                      handleUpdateVariant(origIdx, { sku: e.target.value })
                                    }
                                    className="w-28 h-7 px-1.5 rounded border border-slate-200 text-xs font-mono font-bold"
                                  />
                                </td>

                                {/* Barcode */}
                                <td className="p-2">
                                  <div className="space-y-0.5">
                                    <input
                                      type="text"
                                      placeholder="Sin código"
                                      value={v.barcode || ""}
                                      onChange={(e) =>
                                        handleUpdateVariant(origIdx, { barcode: e.target.value })
                                      }
                                      className={`w-32 h-7 px-1.5 rounded text-xs font-mono transition-colors ${
                                        isDuplicate
                                          ? "border-2 border-red-500 bg-red-50 text-red-950 font-bold focus:outline-none"
                                          : "border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                                      }`}
                                    />
                                    {isDuplicate && (
                                      <span className="text-[10px] text-red-600 font-bold block">
                                        Código repetido
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Precio */}
                                <td className="p-2">
                                  <input
                                    type="number"
                                    placeholder={form.price ? `$ ${form.price}` : "General"}
                                    value={v.price || ""}
                                    onChange={(e) =>
                                      handleUpdateVariant(origIdx, {
                                        price: e.target.value === "" ? null : Number(e.target.value),
                                      })
                                    }
                                    className="w-20 h-7 px-1.5 rounded border border-slate-200 text-xs text-right font-medium"
                                  />
                                </td>

                                {/* Stock Salón */}
                                <td className="p-2 bg-emerald-50/30">
                                  <input
                                    type="number"
                                    value={v.stockStore}
                                    onChange={(e) =>
                                      handleUpdateVariant(origIdx, {
                                        stockStore: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className="w-16 h-7 px-1.5 rounded border border-emerald-300 text-xs font-bold text-emerald-950 text-center bg-white"
                                    min={0}
                                  />
                                </td>

                                {/* Stock Depósito */}
                                <td className="p-2 bg-blue-50/30">
                                  <input
                                    type="number"
                                    value={v.stockWarehouse}
                                    onChange={(e) =>
                                      handleUpdateVariant(origIdx, {
                                        stockWarehouse: Math.max(0, parseInt(e.target.value) || 0),
                                      })
                                    }
                                    className="w-16 h-7 px-1.5 rounded border border-blue-300 text-xs font-bold text-blue-950 text-center bg-white"
                                    min={0}
                                  />
                                </td>

                                {/* Eliminar */}
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(origIdx)}
                                    className="text-slate-300 hover:text-red-600 p-1 cursor-pointer"
                                    title="Eliminar variante"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= VISTA PLANA NORMAL ================= */
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
                {variants.map((v, idx) => {
                  const isDuplicateBarcode = Boolean(v.barcode?.trim() && duplicateBarcodes.has(v.barcode.trim()));
                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isDuplicateBarcode ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-slate-50"
                      }`}
                    >
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

                      {/* Talle editable */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => handleUpdateVariant(idx, { size: e.target.value })}
                          className="w-16 h-7 px-1.5 rounded border border-slate-200 text-xs font-bold text-center bg-slate-50 hover:bg-slate-100 focus:bg-white focus:border-emerald-500 focus:outline-none"
                          title="Modificar talle"
                        />
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
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Sin código"
                            value={v.barcode || ""}
                            onChange={(e) => handleUpdateVariant(idx, { barcode: e.target.value })}
                            className={`w-32 h-7 px-1.5 rounded text-xs font-mono transition-colors ${
                              isDuplicateBarcode
                                ? "border-2 border-red-500 bg-red-50 text-red-950 font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                                : "border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            }`}
                          />
                          {isDuplicateBarcode && (
                            <div className="flex items-center gap-1 text-[10px] text-red-600 font-extrabold whitespace-nowrap">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Código duplicado</span>
                            </div>
                          )}
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400 bg-slate-50">
          No hay variantes generadas aún. Agrega una o genera una curva arriba.
        </div>
      )}

      {/* Alerta de bloqueo si hay códigos de barra duplicados */}
      {duplicateBarcodes.size > 0 && (
        <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-950 text-xs flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0 text-red-700">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="space-y-1 flex-1">
            <p className="font-extrabold text-red-950 text-xs">
              No es posible continuar: Códigos de barra duplicados
            </p>
            <p className="text-[11px] text-red-800 leading-relaxed">
              Existen variantes que comparten el mismo código de barras:{" "}
              <span className="font-mono font-bold bg-red-100 text-red-950 px-1.5 py-0.5 rounded border border-red-300">
                {Array.from(duplicateBarcodes).join(", ")}
              </span>
              . Cada código debe ser único para la identificación en mostrador y escaneo con lector USB, o dejarse en blanco.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
