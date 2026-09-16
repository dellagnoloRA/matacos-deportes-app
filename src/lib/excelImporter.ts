import * as xlsx from "xlsx";
import {
  BulkImportPayloadInput,
  BulkImportMode,
  BulkProductItemInput,
  BulkVariantItemInput,
} from "@/schemas/bulkImport";

export interface RawExcelStockRow {
  Disciplina?: string | null;
  Categoría?: string | null;
  Marca?: string | null;
  "Nombre Producto"?: string | null;
  Descripción?: string | null;
  Talle?: string | number | null;
  Color?: string | null;
  "Código de Barra"?: string | number | null;
  "SKU (Autogenerado)"?: string | null;
  "Stock Salón"?: string | number | null;
  "Stock Depósito"?: string | number | null;
  "Mínimo Salón"?: string | number | null;
  "Mínimo Proveedor"?: string | number | null;
  "Precio Costo (ARS)"?: string | number | null;
  "Precio Venta (ARS)"?: string | number | null;
}

export interface ParseExcelOptions {
  filePath?: string;
  buffer?: Buffer;
  sheetName?: string;
  batchReference?: string;
  mode?: BulkImportMode;
  maxRows?: number;
  rowFilter?: (row: RawExcelStockRow, index: number) => boolean;
}

/**
 * Limpia y normaliza números provenientes de hojas de cálculo (maneja guiones '-', vacíos y nulos)
 */
function cleanNumeric(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") {
    return isNaN(val) ? fallback : val;
  }
  const str = String(val).trim();
  if (str === "" || str === "-") return fallback;

  // Manejo de posibles formatos de moneda o separadores argentinos: ej "$ 88.400,00" o "88400"
  const cleaned = str.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(/,/g, ".");
  const num = Number(cleaned);
  return isNaN(num) ? fallback : num;
}

/**
 * Limpia y recorta cadenas de texto
 */
function cleanText(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/**
 * Parsea y agrupa una planilla de stock Excel (.xlsx) al formato de payload de BulkImport (RF-04)
 */
export function parseExcelStockToPayload(options: ParseExcelOptions): {
  payload: BulkImportPayloadInput;
  filteredCount: number;
  totalParsedRows: number;
} {
  const {
    filePath,
    buffer,
    sheetName = "Productos_y_Stock",
    batchReference = "Lote-Importacion-Excel",
    mode = "ACCUMULATE_STOCK",
    maxRows,
    rowFilter,
  } = options;

  const workbook = buffer
    ? xlsx.read(buffer, { type: "buffer" })
    : filePath
    ? xlsx.readFile(filePath)
    : null;

  if (!workbook) {
    throw new Error("Debe proporcionar un filePath válido o un buffer de Excel.");
  }

  const sheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    throw new Error(`No se encontró la hoja '${sheetName}' en el archivo Excel.`);
  }

  const rawRows = xlsx.utils.sheet_to_json<RawExcelStockRow>(sheet, { defval: null });

  // 1. Filtrar filas de acuerdo al criterio (ej: solo Crocs o primeras N filas)
  const candidateRows: RawExcelStockRow[] = [];
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    // Ignorar filas totalmente vacías
    if (!row["Nombre Producto"] && !row["Talle"] && !row["Disciplina"]) {
      continue;
    }

    if (rowFilter) {
      if (rowFilter(row, i)) {
        candidateRows.push(row);
      }
    } else {
      candidateRows.push(row);
    }

    if (maxRows && candidateRows.length >= maxRows) {
      break;
    }
  }

  // 2. Agrupar filas de variantes por Producto padre
  const groupedProducts = new Map<string, {
    product: Omit<BulkProductItemInput, "variants">;
    variants: BulkVariantItemInput[];
  }>();

  for (const row of candidateRows) {
    const productName = cleanText(row["Nombre Producto"]);
    const disciplineName = cleanText(row["Disciplina"]) || "General";
    const brandName = cleanText(row["Marca"]) || "Genérica";
    const categoryName = cleanText(row["Categoría"]) || "Calzado";
    const description = cleanText(row["Descripción"]) || null;

    const costPrice = cleanNumeric(row["Precio Costo (ARS)"], 0);
    const salePrice = cleanNumeric(row["Precio Venta (ARS)"], 0);

    const groupKey = `${disciplineName.toLowerCase()}::${brandName.toLowerCase()}::${productName.toLowerCase()}`;

    if (!groupedProducts.has(groupKey)) {
      groupedProducts.set(groupKey, {
        product: {
          name: productName,
          description,
          disciplineName,
          brandName,
          categoryName,
          costPrice,
          price: salePrice,
        },
        variants: [],
      });
    }

    const currentGroup = groupedProducts.get(groupKey)!;

    // Actualizar precio de producto si el existente es 0 y esta fila tiene un precio válido
    if (currentGroup.product.price === 0 && salePrice > 0) {
      currentGroup.product.price = salePrice;
    }
    if (currentGroup.product.costPrice === 0 && costPrice > 0) {
      currentGroup.product.costPrice = costPrice;
    }

    const size = cleanText(row["Talle"]) || "Único";
    const color = cleanText(row["Color"]) || "Único";
    const rawSku = cleanText(row["SKU (Autogenerado)"]);
    const rawBarcode = cleanText(row["Código de Barra"]);

    const stockStore = Math.floor(cleanNumeric(row["Stock Salón"], 0));
    const stockWarehouse = Math.floor(cleanNumeric(row["Stock Depósito"], 0));
    const minStoreStock = Math.floor(cleanNumeric(row["Mínimo Salón"], 1));
    const minStock = Math.floor(cleanNumeric(row["Mínimo Proveedor"], 2));

    const variant: BulkVariantItemInput = {
      size,
      color,
      sku: rawSku || null,
      barcode: rawBarcode || null,
      stockStore,
      stockWarehouse,
      minStoreStock,
      minStock,
    };

    currentGroup.variants.push(variant);
  }

  // 3. Ensamblar la lista de productos con sus variantes
  const items: BulkProductItemInput[] = [];
  for (const group of groupedProducts.values()) {
    items.push({
      ...group.product,
      variants: group.variants,
    });
  }

  return {
    payload: {
      batchReference,
      mode,
      defaultTargetLocation: "STORE",
      items,
    },
    filteredCount: candidateRows.length,
    totalParsedRows: rawRows.length,
  };
}
