"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Store,
  Building2,
  Package,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/utils";
import {
  BulkImportMode,
  BulkImportPayloadInput,
  BulkImportResult,
  BulkImportError,
  BulkProductItemInput,
  BulkVariantItemInput,
} from "@/schemas/bulkImport";
import { bulkImportProducts } from "@/server/actions/bulkImportActions";

export interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

interface RawRow {
  [key: string]: any;
}

interface ParsedSummary {
  totalRows: number;
  uniqueProductsCount: number;
  totalVariantsCount: number;
  totalStockUnits: number;
  items: BulkProductItemInput[];
  warnings: string[];
}

/**
 * Normaliza nombres de encabezados para soportar acentos, espacios, guiones bajos o variaciones.
 * Remueve todo carácter no alfanumérico (ej: paréntesis, signos pesos, guiones, barras).
 */
function normalizeHeaderKey(key: string): string {
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remover tildes
    .replace(/[^a-z0-9]/g, "") // remover caracteres especiales, paréntesis, espacios
    .trim();
}

/**
 * Extrae el valor de una fila buscando entre posibles alias de columna
 */
function getRowValue(row: RawRow, possibleKeys: string[]): any {
  const normalizedRowKeys = Object.keys(row).reduce<{ [norm: string]: string }>((acc, k) => {
    acc[normalizeHeaderKey(k)] = k;
    return acc;
  }, {});

  // 1. Coincidencia exacta de clave normalizada
  for (const alias of possibleKeys) {
    const normAlias = normalizeHeaderKey(alias);
    if (normalizedRowKeys[normAlias]) {
      const actualKey = normalizedRowKeys[normAlias];
      const val = row[actualKey];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return val;
      }
    }
  }

  // 2. Coincidencia por inclusión (ej: "preciocostoars" contiene "preciocosto", "codigodebarra" contiene "codigobarra")
  for (const alias of possibleKeys) {
    const normAlias = normalizeHeaderKey(alias);
    for (const [rowNormKey, actualKey] of Object.entries(normalizedRowKeys)) {
      if (rowNormKey.includes(normAlias) || normAlias.includes(rowNormKey)) {
        const val = row[actualKey];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return val;
        }
      }
    }
  }

  return undefined;
}

/**
 * Parsea importes monetarios tolerando formatos argentinos ($ 45.000,00 / 45.000 / 45000,50) y números nativos
 */
function parseNumericPrice(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : Math.max(0, val);

  let str = String(val).trim().replace(/\$/g, "").trim();

  // Si contiene punto y coma: "45.000,50" -> punto es miles, coma es decimal
  if (str.includes(".") && str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(",")) {
    // Solo tiene coma: "45000,50" -> coma es decimal
    str = str.replace(",", ".");
  } else if (str.includes(".")) {
    // Puede ser "45.000" (miles) o "45.50" (decimal)
    const parts = str.split(".");
    if (parts.length > 2) {
      str = parts.join("");
    } else if (parts.length === 2 && parts[1].length === 3 && parseInt(parts[0], 10) >= 1) {
      str = parts.join("");
    }
  }

  str = str.replace(/[^0-9.]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Determina si una fila de la planilla está completamente vacía (sin ningún dato en ninguna celda)
 */
function isRowCompletelyEmpty(row: RawRow): boolean {
  return Object.values(row).every(
    (val) => val === undefined || val === null || String(val).trim() === ""
  );
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  // Stepper State (Paso 1: Archivo -> Paso 2: Configuración -> Paso 3: Vista Previa -> Paso 4: Resultados)
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Paso 1: Archivo y Drag & Drop
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paso 2: Configuración del Lote
  const [batchReference, setBatchReference] = useState<string>(
    `Lote-${new Date().toISOString().slice(0, 10)}-Matacos`
  );
  const [mode, setMode] = useState<BulkImportMode>("ACCUMULATE_STOCK");
  const [defaultTargetLocation, setDefaultTargetLocation] = useState<"STORE" | "WAREHOUSE">("STORE");

  // Paso 3: Datos Parseados y Vista Previa
  const [parsedData, setParsedData] = useState<ParsedSummary | null>(null);

  // Paso 4: Ejecución e Ingestión
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [copiedErrors, setCopiedErrors] = useState(false);

  if (!isOpen) return null;

  // Limpiar y resetear estados al cerrar
  const handleClose = () => {
    if (isImporting) return;
    setCurrentStep(1);
    setFile(null);
    setParseError(null);
    setParsedData(null);
    setImportResult(null);
    setCopiedErrors(false);
    onClose();
  };

  // -------------------------------------------------------------
  // PARSING EN CLIENTE: Transforma el archivo Excel/CSV con xlsx
  // -------------------------------------------------------------
  const parseSpreadsheetFile = async (selectedFile: File) => {
    setIsParsingFile(true);
    setParseError(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("El archivo no contiene hojas de cálculo legibles.");
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: RawRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (rawRows.length === 0) {
        throw new Error("La planilla está vacía o no contiene filas de datos.");
      }

      // Filtrar filas completamente vacías (ej: cuando se eliminan productos pero Excel preserva el rango A1:O300 formateado)
      const validRowsWithIndex = rawRows
        .map((row, idx) => ({ row, rowNum: idx + 2 }))
        .filter(({ row }) => !isRowCompletelyEmpty(row));

      if (validRowsWithIndex.length === 0) {
        throw new Error("La planilla no contiene filas con datos de productos.");
      }

      // Procesar y agrupar filas por Producto (clave: Nombre + Marca)
      const productsMap = new Map<string, BulkProductItemInput>();
      const warnings: string[] = [];
      let totalVariantsCount = 0;
      let totalStockUnits = 0;

      validRowsWithIndex.forEach(({ row, rowNum }) => {
        const discipline = String(
          getRowValue(row, ["disciplina", "discipline", "area", "deporte"]) || ""
        ).trim();
        const category = String(
          getRowValue(row, ["categoria", "category", "subcategoria", "rubro"]) || ""
        ).trim();
        const brand = String(
          getRowValue(row, ["marca", "brand", "proveedor", "fabricante"]) || ""
        ).trim();
        const productName = String(
          getRowValue(row, ["nombreproducto", "nombre", "productname", "producto", "articulo", "item"]) || ""
        ).trim();
        const description = getRowValue(row, ["descripcion", "description", "detalle", "observaciones"]);

        const size = String(getRowValue(row, ["talle", "size", "medida", "numero", "dimension"]) || "Único").trim();
        const color = String(getRowValue(row, ["color", "variante", "colour", "modelo"]) || "Único").trim();
        const barcodeRaw = getRowValue(row, ["codigodebarra", "codigobarra", "barcode", "codigobarras", "codigo", "ean", "ean13", "upc"]);
        const skuRaw = getRowValue(row, ["skuautogenerado", "sku", "codigoarticulo", "codigointerno", "articulocodigo"]);

        const stockStoreRaw = getRowValue(row, ["stocksalon", "stocksalonars", "stocktienda", "salon", "stocklocal", "tienda"]);
        const stockWarehouseRaw = getRowValue(row, ["stockdeposito", "stockdepositoars", "deposito", "almacen"]);
        const minStoreStockRaw = getRowValue(row, ["minimosalon", "minsalon", "stockminimosalon"]);
        const minStockRaw = getRowValue(row, ["minimoproveedor", "minproveedor", "minstock", "stockminimo"]);

        const costPriceRaw = getRowValue(row, ["preciocostoars", "preciocosto", "costo", "costprice", "preciocompra"]);
        const priceRaw = getRowValue(row, ["precioventaars", "precioventa", "precio", "price", "pvp", "preciopublico"]);

        // Validaciones básicas de fila obligatoria
        if (!productName || !brand || !category || !discipline) {
          warnings.push(`Fila ${rowNum}: Producto omitido por falta de datos requeridos (Nombre, Marca, Categoría o Disciplina).`);
          return;
        }

        const costPrice = parseNumericPrice(costPriceRaw);
        const price = parseNumericPrice(priceRaw);

        const stockStore = Math.max(0, parseInt(String(stockStoreRaw || 0).replace(/[^0-9]/g, ""), 10) || 0);
        const stockWarehouse = Math.max(0, parseInt(String(stockWarehouseRaw || 0).replace(/[^0-9]/g, ""), 10) || 0);
        const minStoreStock = Math.max(0, parseInt(String(minStoreStockRaw || 1).replace(/[^0-9]/g, ""), 10) || 1);
        const minStock = Math.max(0, parseInt(String(minStockRaw || 2).replace(/[^0-9]/g, ""), 10) || 2);

        const barcode = barcodeRaw ? String(barcodeRaw).trim() : null;
        const sku = skuRaw ? String(skuRaw).trim().toUpperCase() : null;

        totalVariantsCount++;
        totalStockUnits += stockStore + stockWarehouse;

        const productKey = `${productName.toLowerCase()}___${brand.toLowerCase()}`;

        const variantItem: BulkVariantItemInput = {
          size,
          color,
          sku,
          barcode,
          stockStore,
          stockWarehouse,
          minStoreStock,
          minStock,
          price: price > 0 ? price : null,
        };

        if (productsMap.has(productKey)) {
          const existing = productsMap.get(productKey)!;
          existing.variants.push(variantItem);
          // Si una fila tiene precio más actualizado, preservarlo
          if (price > 0 && (!existing.price || existing.price === 0)) {
            existing.price = price;
          }
          if (costPrice > 0 && (!existing.costPrice || existing.costPrice === 0)) {
            existing.costPrice = costPrice;
          }
        } else {
          productsMap.set(productKey, {
            name: productName,
            description: description ? String(description).trim() : null,
            disciplineName: discipline,
            categoryName: category,
            brandName: brand,
            costPrice,
            price,
            variants: [variantItem],
          });
        }
      });

      const groupedProducts = Array.from(productsMap.values());

      if (groupedProducts.length === 0) {
        throw new Error("No se pudo extraer ningún producto válido de la planilla. Verifique que las columnas coincidan con la plantilla oficial.");
      }

      setParsedData({
        totalRows: validRowsWithIndex.length,
        uniqueProductsCount: groupedProducts.length,
        totalVariantsCount,
        totalStockUnits,
        items: groupedProducts,
        warnings,
      });

      setFile(selectedFile);
      // Avanzar al paso de configuración automáticamente
      setCurrentStep(2);
    } catch (err) {
      console.error("Error al parsear planilla:", err);
      setParseError(
        err instanceof Error
          ? err.message
          : "Error al procesar el archivo. Asegúrese de subir un archivo .xlsx o .csv válido."
      );
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      parseSpreadsheetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      parseSpreadsheetFile(e.target.files[0]);
    }
  };

  // -------------------------------------------------------------
  // EJECUCIÓN DEL LOTE EN EL SERVIDOR (Server Action)
  // -------------------------------------------------------------
  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.items.length === 0) return;

    setIsImporting(true);
    setParseError(null);

    try {
      const payload: BulkImportPayloadInput = {
        batchReference: batchReference.trim() !== "" ? batchReference.trim() : "Lote-Sin-Referencia",
        mode,
        defaultTargetLocation,
        items: parsedData.items,
      };

      const result = await bulkImportProducts(payload);
      setImportResult(result);
      setCurrentStep(4);

      if (result.summary.successfulProducts > 0) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error al ejecutar importación:", err);
      setParseError("Ocurrió un error inesperado al procesar el lote en el servidor.");
    } finally {
      setIsImporting(false);
    }
  };

  // Copiar reporte de errores al portapapeles
  const handleCopyErrors = () => {
    if (!importResult || importResult.errors.length === 0) return;

    const text = importResult.errors
      .map(
        (err) =>
          `Fila ${err.index}: ${err.productName} - ${err.field ? `[${err.field}] ` : ""}${err.reason}`
      )
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopiedErrors(true);
    setTimeout(() => setCopiedErrors(false), 3000);
  };

  // Exportar errores a archivo Excel
  const handleExportErrors = () => {
    if (!importResult || importResult.errors.length === 0) return;

    const dataToExport = importResult.errors.map((e) => ({
      "Fila N°": e.index,
      "Producto": e.productName,
      "SKU": e.sku || "S/D",
      "Código de Barra": e.barcode || "S/D",
      "Campo Observado": e.field || "General",
      "Causa del Rechazo": e.reason,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errores_Importacion");
    XLSX.writeFile(wb, `Errores_${batchReference.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal Dialog Container */}
      <div className="relative bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header con Título y Stepper */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-[#00D615] flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Carga Progresiva e Ingestión Excel / CSV
                </h2>
                <p className="text-xs text-slate-500">
                  Asistente guiado de 4 pasos para alta masiva de inventario y catálogo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition-colors disabled:opacity-50"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-4 gap-2 pt-4">
            {[
              { num: 1, label: "1. Archivo y Plantilla" },
              { num: 2, label: "2. Configuración" },
              { num: 3, label: "3. Vista Previa" },
              { num: 4, label: "4. Resultados" },
            ].map((step) => (
              <div key={step.num} className="flex flex-col gap-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep >= step.num
                      ? "bg-[#00D615]"
                      : "bg-slate-200"
                  }`}
                />
                <span
                  className={`text-[10.5px] font-bold truncate ${
                    currentStep === step.num
                      ? "text-slate-900"
                      : currentStep > step.num
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          
          {/* ======================================================== */}
          {/* PASO 1: Carga de Archivo (Drag & Drop) y Plantilla */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Banner Plantilla Oficial */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-xs">
                      Plantilla Oficial de Matacos Deportes
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      Incluye las columnas exactas, fórmulas de SKU y ejemplos de natación, vóley y calzado.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href="/plantilla_carga_stock_matacos.xlsx"
                    download="plantilla_carga_stock_matacos.xlsx"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Plantilla (.xlsx)</span>
                  </a>
                  <a
                    href="/plantilla_carga_stock_matacos.csv"
                    download="plantilla_carga_stock_matacos.csv"
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-2 bg-white hover:bg-slate-100 border border-emerald-300 text-emerald-900 font-semibold text-xs rounded-xl transition-all shadow-2xs"
                    title="Descargar en formato CSV plano"
                  >
                    <span>.csv</span>
                  </a>
                </div>
              </div>

              {/* Zona Drag & Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]"
                    : "border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {isParsingFile ? (
                  <div className="space-y-3 py-4">
                    <Loader2 className="w-10 h-10 mx-auto text-emerald-600 animate-spin" />
                    <p className="font-bold text-slate-800 text-xs">
                      Leyendo y validando estructura de la planilla...
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Agrupando variantes y verificando columnas comerciales
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-3xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs">
                      <UploadCloud className="w-7 h-7 text-emerald-600 stroke-[1.8]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Arrastra tu archivo aquí o haz clic para examinar
                      </h4>
                      <p className="text-slate-500 text-xs mt-1">
                        Soporta hojas de cálculo de Microsoft Excel (<strong className="text-slate-700 font-semibold">.xlsx</strong>, <strong className="text-slate-700 font-semibold">.xls</strong>) y texto plano (<strong className="text-slate-700 font-semibold">.csv</strong>).
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 text-[11px] font-medium shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Detecta automáticamente variantes repetidas por Nombre y Marca
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mensaje de Error si el parsing falló */}
              {parseError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">{parseError}</div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: Configuración del Lote */}
          {/* ======================================================== */}
          {currentStep === 2 && parsedData && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Tarjeta Informativa de Archivo Detectado */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#00D615] flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{file?.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {parsedData.totalRows} filas leídas • {parsedData.uniqueProductsCount} productos detectados • {parsedData.totalVariantsCount} variantes
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedData(null);
                    setCurrentStep(1);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Campos de Configuración */}
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200">
                {/* 1. Referencia del Lote */}
                <div>
                  <label className="text-slate-800 font-bold block mb-1.5 text-xs">
                    Identificador / Referencia del Lote <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={batchReference}
                    onChange={(e) => setBatchReference(e.target.value)}
                    placeholder="Ej. Lote-001-Calzado-Topper o Factura Speedo #4890"
                    className="w-full text-xs font-semibold py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Quedará registrado en la auditoría contable de cada movimiento de stock ingresado.
                  </span>
                </div>

                {/* 2. Modo de Ingestión */}
                <div>
                  <label className="text-slate-800 font-bold block mb-2 text-xs">
                    Modo de Ingestión del Stock
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Modo 1: ACCUMULATE_STOCK */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        mode === "ACCUMULATE_STOCK"
                          ? "bg-emerald-50/40 border-emerald-600 shadow-xs ring-1 ring-emerald-600"
                          : "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          checked={mode === "ACCUMULATE_STOCK"}
                          onChange={() => setMode("ACCUMULATE_STOCK")}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            Sumar Existencias (Default)
                          </span>
                          <span className="text-[10.5px] text-slate-500 leading-snug block mt-0.5">
                            Suma las unidades del Excel al stock existente en Saavedra 241. Ideal para reposiciones de mercadería.
                          </span>
                        </div>
                      </div>
                    </label>

                    {/* Modo 2: OVERWRITE */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        mode === "OVERWRITE"
                          ? "bg-amber-50/40 border-amber-600 shadow-xs ring-1 ring-amber-600"
                          : "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          checked={mode === "OVERWRITE"}
                          onChange={() => setMode("OVERWRITE")}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            Sobreescribir Datos y Stock
                          </span>
                          <span className="text-[10.5px] text-slate-500 leading-snug block mt-0.5">
                            Pisa los precios de costo/venta y reemplaza las existencias previas.
                          </span>
                        </div>
                      </div>
                    </label>

                    {/* Modo 3: CREATE_ONLY */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        mode === "CREATE_ONLY"
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900"
                          : "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          checked={mode === "CREATE_ONLY"}
                          onChange={() => setMode("CREATE_ONLY")}
                          className="mt-0.5 text-slate-900 focus:ring-slate-900"
                        />
                        <div>
                          <span className={`font-bold block text-xs ${mode === "CREATE_ONLY" ? "text-white" : "text-slate-900"}`}>
                            Solo Productos Nuevos
                          </span>
                          <span className={`text-[10.5px] leading-snug block mt-0.5 ${mode === "CREATE_ONLY" ? "text-slate-300" : "text-slate-500"}`}>
                            Da de alta artículos nuevos. Si el producto ya existe en catálogo, no lo toca.
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Ubicación predeterminada */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-slate-800 font-bold block text-xs">
                      Destino de Stock Predeterminado
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Ubicación física predeterminada para el registro de movimientos en mostrador.
                    </span>
                  </div>

                  <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDefaultTargetLocation("STORE")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        defaultTargetLocation === "STORE"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Salón de Ventas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultTargetLocation("WAREHOUSE")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        defaultTargetLocation === "WAREHOUSE"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Depósito Interno</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 3: Vista Previa y Pre-validación */}
          {/* ======================================================== */}
          {currentStep === 3 && parsedData && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Tarjetas de Resumen de Impacto Previo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Productos Únicos</span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-0.5">
                    {parsedData.uniqueProductsCount}
                  </span>
                  <span className="text-[10px] text-slate-400">Padres agrupados</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Variantes / Talles</span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-0.5">
                    {parsedData.totalVariantsCount}
                  </span>
                  <span className="text-[10px] text-slate-400">Combinaciones talle/color</span>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/70">
                  <span className="text-[11px] text-emerald-800 font-medium block">Unidades a Ingresar</span>
                  <span className="text-lg font-extrabold text-emerald-900 block mt-0.5">
                    +{parsedData.totalStockUnits} un.
                  </span>
                  <span className="text-[10px] text-emerald-700">Stock físico global</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Modo Seleccionado</span>
                  <span className="text-xs font-extrabold text-slate-900 block mt-1">
                    {mode === "ACCUMULATE_STOCK"
                      ? "Sumar Existencias"
                      : mode === "OVERWRITE"
                      ? "Sobreescribir"
                      : "Solo Nuevos"}
                  </span>
                  <span className="text-[10px] text-slate-400">{batchReference}</span>
                </div>
              </div>

              {/* Advertencias de formato si las hubo */}
              {parsedData.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-800">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Se detectaron {parsedData.warnings.length} observaciones en la planilla:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-700">
                    {parsedData.warnings.slice(0, 3).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {parsedData.warnings.length > 3 && (
                      <li>...y {parsedData.warnings.length - 3} advertencias adicionales.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Tabla de Vista Previa de Productos Agrupados */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>
                    Vista previa de los {parsedData.items.length} productos procesados
                  </span>
                  <span className="font-mono text-slate-400">
                    {parsedData.totalRows} filas totales
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[320px] custom-scrollbar">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Producto / Marca</th>
                        <th className="py-2.5 px-3">Disciplina / Categoría</th>
                        <th className="py-2.5 px-3">Variantes</th>
                        <th className="py-2.5 px-3">Precio Costo</th>
                        <th className="py-2.5 px-3">Precio Venta</th>
                        <th className="py-2.5 px-3 text-right">Stock a Ingresar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {parsedData.items.map((item, pIdx) => {
                        const storeStock = item.variants.reduce((acc, v) => acc + (v.stockStore || 0), 0);
                        const warehouseStock = item.variants.reduce((acc, v) => acc + (v.stockWarehouse || 0), 0);
                        const productTotalStock = storeStock + warehouseStock;

                        return (
                          <tr key={pIdx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block truncate max-w-xs">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {item.brandName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                                {item.disciplineName}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {item.categoryName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {item.variants.map((v, vIdx) => (
                                  <span
                                    key={vIdx}
                                    className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700 border border-slate-200/70"
                                  >
                                    {v.size} ({v.color})
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {formatCurrency(item.costPrice)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                                +{productTotalStock} un.
                              </span>
                              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                {storeStock} salón · {warehouseStock} dep.
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
          )}

          {/* ======================================================== */}
          {/* PASO 4: Resultados y Reporte Granular de Errores */}
          {/* ======================================================== */}
          {currentStep === 4 && importResult && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header de Éxito / Estado */}
              <div className="p-4 rounded-2xl border flex items-center gap-3.5 bg-slate-50 border-slate-200">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    importResult.errors.length === 0
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {importResult.errors.length === 0 ? (
                    <CheckCircle2 className="w-7 h-7 stroke-[2]" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 stroke-[2]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {importResult.errors.length === 0
                      ? "¡Ingestión de Lote Completada con Éxito!"
                      : "Ingestión Finalizada con Observaciones"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lote: <strong className="text-slate-800 font-semibold">{importResult.batchReference}</strong> • Modo: <span className="font-mono font-bold">{importResult.mode}</span>
                  </p>
                </div>
              </div>

              {/* Tarjetas con Indicadores Clave */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Total Enviados</span>
                  <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
                    {importResult.summary.totalProductsSubmitted}
                  </span>
                  <span className="text-[10px] text-slate-400">Productos procesados</span>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/70">
                  <span className="text-[11px] text-emerald-800 font-medium block">Productos Creados</span>
                  <span className="text-xl font-extrabold text-emerald-900 block mt-0.5">
                    +{importResult.summary.createdProducts}
                  </span>
                  <span className="text-[10px] text-emerald-700">Nuevos en catálogo</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Variantes Creadas</span>
                  <span className="text-xl font-extrabold text-slate-900 block mt-0.5">
                    +{importResult.summary.createdVariants}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({importResult.summary.updatedVariants} actualizadas)
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border ${
                    importResult.errors.length === 0
                      ? "bg-slate-50 border-slate-200 text-slate-400"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <span className="text-[11px] font-medium block">Errores / Rechazos</span>
                  <span
                    className={`text-xl font-extrabold block mt-0.5 ${
                      importResult.errors.length === 0 ? "text-slate-400" : "text-rose-700"
                    }`}
                  >
                    {importResult.errors.length}
                  </span>
                  <span className="text-[10px]">
                    {importResult.errors.length === 0 ? "Sin errores detectados" : "Filas observadas"}
                  </span>
                </div>
              </div>

              {/* Reporte Granular de Errores (Si hubo errores) */}
              {importResult.errors.length > 0 && (
                <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-2xs space-y-2">
                  <div className="px-4 py-3 bg-rose-50/80 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-rose-950 text-xs">
                        Reporte Granular de Errores ({importResult.errors.length} filas observadas)
                      </h4>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        Puedes copiar o exportar las filas rechazadas para corregirlas en Excel y reintentar su carga.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyErrors}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-900 font-bold text-xs transition-all active:scale-95 shadow-2xs"
                      >
                        {copiedErrors ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Errores</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleExportErrors}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition-all shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar a Excel</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[220px] custom-scrollbar p-2">
                    <table className="w-full text-left text-xs min-w-[550px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3 w-16">Fila</th>
                          <th className="py-2 px-3">Producto Observado</th>
                          <th className="py-2 px-3">Campo</th>
                          <th className="py-2 px-3">Causa del Rechazo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {importResult.errors.map((err, errIdx) => (
                          <tr key={errIdx} className="hover:bg-rose-50/40">
                            <td className="py-2 px-3 font-mono font-bold text-rose-600">
                              #{err.index}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {err.productName}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                              {err.field || "Validación general"}
                            </td>
                            <td className="py-2 px-3 text-rose-700 text-xs">
                              {err.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer / Navigation Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          
          {/* Botón Izquierdo (Cancelar o Atrás) */}
          {currentStep === 1 && (
            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-all shadow-2xs"
            >
              Cancelar
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-all shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Atrás: Archivo</span>
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={isImporting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-all shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Atrás: Configuración</span>
            </button>
          )}

          {currentStep === 4 && (
            <span className="text-[11px] text-slate-400">
              Datos reflejados en el mostrador e inventario activo
            </span>
          )}

          {/* Botón Derecho (Siguiente o Confirmar o Finalizar) */}
          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all"
            >
              <span>Siguiente: Vista Previa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting}
              className="inline-flex items-center gap-2 bg-[#00D615] hover:bg-[#00be13] active:scale-95 text-slate-950 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Ingestando en Base de Datos...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                  <span>Confirmar e Ingestar Lote</span>
                </>
              )}
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              onClick={handleClose}
              className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all"
            >
              Finalizar y Volver al Inventario
            </button>
          )}

        </div>

      </div>
    </div>
  );
}

