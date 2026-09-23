/**
 * Utilidades de Sanitización y Normalización Canónica de Texto
 * Matacos Deportes — Backend
 */

/**
 * Genera un slug canónico en minúsculas, sin tildes ni caracteres especiales.
 * Ejemplos:
 *  "  NAtAcIóN  " -> "natacion"
 *  "Vóley & Red"   -> "voley-red"
 *  "Crocs / Clog"  -> "crocs-clog"
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD") // Descompone caracteres con acentos (ej: "ó" -> "o" + marca diacrítica)
    .replace(/[\u0300-\u036f]/g, "") // Elimina marcas diacríticas/tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Reemplaza espacios y símbolos por un único guion
    .replace(/^-+|-+$/g, ""); // Remueve guiones sobrantes al inicio o final
}

/**
 * Normaliza una cadena de texto a formato Title Case limpio.
 * Colapsa múltiples espacios internos a uno solo y capitaliza cada palabra.
 * Ejemplos:
 *  "  remera MANGA   larga  " -> "Remera Manga Larga"
 *  "natación"                 -> "Natación"
 */
export function toCanonicalTitle(text: string): string {
  if (!text) return "";
  const cleaned = text.trim().replace(/\s+/g, " ");
  return cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Mapeo canónico de modelos conocidos a sus códigos oficiales.
 * Sincronizado al 100% con la plantilla oficial de carga de stock (plantilla_carga_stock_matacos.xlsx).
 */
export const KNOWN_MODEL_CODES: Record<string, string> = {
  // Modelos Crocs
  "crocband": "CB",
  "crocband kids": "CBK",
  "croc classic": "CLS",
  "croc classic kids": "CLK",
  "croc classic sandal": "CLSS",
  "croc crush sandal": "CRS",
  "croc classic crush clog": "CCCC",
  "croc plataforma": "PLAT",
  "croc santa cruz mens": "SCM",
  "croc santa cruz clean cut": "SCCC",
  "croc santa cruz 2 luxe leather": "SC2L",
  "croc inmotion flip": "IM-FLP",
  "croc inmotion clog": "IM-CLG",
  "croc literide 360 pacer": "LR-360",

  // Modelos Wilson / Bolsos / Mochilas / Accesorios
  "bandolera wilson": "BAN",
  "botinero wilson": "BOT",
  "riñonera wilson sin compartimiento": "RIÑ-SC",
  "rinonera wilson sin compartimiento": "RIÑ-SC",
  "riñonera wilson": "RIÑ",
  "rinonera wilson": "RIÑ",
  "mochila 1 compartimiento": "1C",
  "mochila 2 compartimiento": "2C",
  "mochila con porta-notebook": "NOTE",
  "mochila con porta notebook": "NOTE",
  "mochila porta notebook": "NOTE",
  "mochila tapa dura": "TD",
  "bolso chico": "BCH",
  "bolso grande": "BGR",
  "bolso mochilero": "BMOC",
  "bolso raquetero": "RAQ",
  "valija chica policarbonato": "VCHI-POL",
  "valija mediana policarbonato": "VMED-POL",
  "valija grande policarbonato": "VGRA-POL",
  "valija chica tela": "VCHI-TEL",
  "valija mediana tela": "VMED-TEL",
  "valija grande tela": "VGRA-TEL",
  "valija chica": "VCHI",
  "valija mediana": "VMED",
  "valija grande": "VGRA",
};

/**
 * Detecta si un SKU proviene de una fórmula defectuosa o genérica de Excel:
 * 1. Triple prefijo idéntico: "CRO-CRO-CRO-..."
 * 2. Doble guión por talle o componente vacío: "...--..."
 * 3. Prefijos genéricos de Wilson sin modelo: "WIL-ACC-MOC-...", "WIL-ACC-BOL-...", "WIL-ACC-VAL-..."
 */
export function isDefectiveFormulaSku(sku?: string | null): boolean {
  if (!sku) return false;
  const s = sku.trim().toUpperCase();
  if (/^([A-Z0-9]{3})-\1-\1-/.test(s)) return true;
  if (/--/.test(s)) return true;
  if (/^WIL-ACC-(MOC|BOL|VAL)-/i.test(s)) return true;
  return false;
}

/**
 * Sanitiza una porción de código para el SKU preservando la letra Ñ (ej: RIÑ para Riñonera).
 * Remueve tildes y caracteres especiales, convirtiendo a mayúsculas.
 */
export function sanitizeSkuCode(str?: string | null, maxLen = 3): string {
  if (!str) return "GEN";
  const preserved = str
    .toString()
    .replace(/ñ/g, "\u0001")
    .replace(/Ñ/g, "\u0002")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0001/g, "Ñ")
    .replace(/\u0002/g, "Ñ")
    .toUpperCase()
    .replace(/[^A-Z0-9Ñ]/g, "");

  return preserved.slice(0, maxLen) || "GEN";
}

/**
 * Formatea el talle para el SKU según la regla oficial de la plantilla Excel:
 * Si contiene espacio (ej: "4/6 (36)"), toma lo anterior al primer espacio ("4/6").
 */
export function formatSkuSize(rawSize: string): string {
  if (!rawSize) return "UNI";
  const trimmed = rawSize.trim();
  const spaceIdx = trimmed.indexOf(" ");
  const base = spaceIdx > 0 ? trimmed.slice(0, spaceIdx) : trimmed.slice(0, 6);
  return base.toUpperCase() || "UNI";
}

/**
 * Formatea el color para el SKU según la regla oficial de la plantilla Excel:
 * - Si contiene barra ("Marino/Rojo"), toma 3 letras antes y 3 letras después ("MAR-ROJ").
 * - Si contiene espacio ("Azul Marino"), toma 3 letras de cada palabra ("AZU-MAR").
 * - Si es simple ("Negro"), toma las primeras 3 letras ("NEG").
 */
export function formatSkuColor(rawColor: string): string {
  if (!rawColor) return "UNI";
  const trimmed = rawColor.trim();

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    const p1 = sanitizeSkuCode(parts[0], 3);
    const p2 = sanitizeSkuCode(parts[1], 3);
    return `${p1}-${p2}`;
  }

  if (trimmed.includes(" ")) {
    const parts = trimmed.split(/\s+/);
    const p1 = sanitizeSkuCode(parts[0], 3);
    const p2 = sanitizeSkuCode(parts[1], 3);
    return `${p1}-${p2}`;
  }

  return sanitizeSkuCode(trimmed, 3) || "UNI";
}

/**
 * Extrae o genera un código de modelo para el SKU.
 * 1. Consulta el diccionario canónico de modelos conocidos (ordenando de mayor a menor longitud).
 * 2. Si es un producto nuevo desconocido, aplica el algoritmo heurístico de acrónimos:
 *    - Descarta la marca redundante del inicio.
 *    - Quita conectores y stop-words ("de", "con", "para").
 *    - Extrae siglas de palabras clave y números identificatorios (ej: "Air Max 90" -> "AM-90").
 */
export function extractModelCode(productName: string, brand?: string | null): string {
  if (!productName) return "GEN";
  // 1. Limpiar guiones colgantes al final y normalizar espacios
  const cleanName = productName.trim().replace(/\s*-\s*$/, "").replace(/\s+/g, " ");
  // Normalizar guiones internos como " - " a " " para que "Valija Grande - Tela" coincida con "valija grande tela"
  const normalizedKey = cleanName.toLowerCase().replace(/\s*-\s*/g, " ").replace(/\s+/g, " ");

  // 1. Búsqueda exacta en diccionario
  if (KNOWN_MODEL_CODES[normalizedKey]) {
    return KNOWN_MODEL_CODES[normalizedKey];
  }

  // 2. Búsqueda por prefijo ordenando las claves por longitud descendente
  // Esto garantiza que frases más largas y específicas coincidan antes que frases cortas
  const sortedEntries = Object.entries(KNOWN_MODEL_CODES).sort((a, b) => b[0].length - a[0].length);

  for (const [key, code] of sortedEntries) {
    if (normalizedKey === key || normalizedKey.startsWith(key + " ") || normalizedKey.startsWith(key)) {
      return code;
    }
  }

  // 3. Algoritmo heurístico para productos nuevos no mapeados
  let text = cleanName;

  // Remover marca si está al inicio del nombre (ej: "Crocs Duet" -> "Duet")
  if (brand && brand.trim().length > 1) {
    const brandRegex = new RegExp(`^${brand.trim()}\\s*`, "i");
    text = text.replace(brandRegex, "");
  }

  // Quitar también "Croc " genérico si quedó
  text = text.replace(/^crocs?\s+/i, "");

  // Remover stop-words en español
  const stopWords = new Set(["de", "del", "la", "las", "el", "los", "con", "sin", "para", "en", "y", "un", "una", "al"]);
  const words = text
    .split(/[\s_-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) {
    return sanitizeSkuCode(cleanName, 4) || "GEN";
  }

  // Si tiene números (ej: "Pegasus 40", "Speedo Fastskin 2"), preservarlos
  const numberWord = words.find((w) => /^\d+$/.test(w));

  if (words.length === 1) {
    return sanitizeSkuCode(words[0], 4) || "MOD";
  }

  if (words.length === 2) {
    const w1 = sanitizeSkuCode(words[0], 3);
    const w2 = sanitizeSkuCode(words[1], 3);
    return `${w1}-${w2}`;
  }

  // 3 o más palabras: extraer siglas de palabras clave
  const acronym = words
    .filter((w) => w !== numberWord)
    .map((w) => sanitizeSkuCode(w, 1))
    .join("");

  if (numberWord) {
    return `${acronym.slice(0, 3)}-${numberWord}`;
  }

  return acronym.slice(0, 4) || sanitizeSkuCode(words[0], 3);
}

export interface GenerateModelCodeParams {
  brand: string;
  discipline?: string | null;
  category?: string | null;
  productName: string;
}

/**
 * Genera el Código de Modelo canónico para el Producto Padre (agrupador de familia).
 * Formato oficial: [MARCA-3]-[CAT/DISC-3]-[MODELO]
 * Ejemplos:
 *  - "CRO-CAL-CB" (Crocs Calzado Crocband)
 *  - "WIL-MOC-1C" (Wilson Mochila 1 Compartimiento)
 *  - "SPE-NAT-ANT" (Speedo Natación Antiparras)
 */
export function generateModelCode(params: GenerateModelCodeParams): string {
  const b = sanitizeSkuCode(params.brand, 3);
  const c = sanitizeSkuCode(params.category || params.discipline, 3);
  const m = extractModelCode(params.productName, params.brand);
  return `${b}-${c}-${m}`;
}

export interface GenerateDeterministicSkuParams {
  brand: string;
  discipline?: string | null;
  category?: string | null;
  productName: string;
  size: string;
  color: string;
  suffixIndex?: number;
}

/**
 * Genera un SKU determinista, legible y canónico para variantes de productos.
 * Sincronizado con la regla oficial de Matacos Deportes:
 * Formato: [MARCA-3]-[CAT/DISC-3]-[MODELO]-[TALLE]-[COLOR]
 * Ejemplos:
 *  - "CRO-CAL-CB-4/6-NEG"
 *  - "WIL-MOC-1C-ÚNICO-NEG-ROJ"
 *  - "CRO-CAL-LR-360-M11-NEG"
 */
export function generateDeterministicSku(params: GenerateDeterministicSkuParams): string {
  const modelCode = generateModelCode({
    brand: params.brand,
    category: params.category,
    discipline: params.discipline,
    productName: params.productName,
  });
  const s = formatSkuSize(params.size);
  const col = formatSkuColor(params.color);

  let sku = `${modelCode}-${s}-${col}`;

  if (params.suffixIndex && params.suffixIndex > 1) {
    sku += `-${params.suffixIndex}`;
  }

  return sku;
}

export interface GenerateProductImageFilenameParams {
  brand?: string | null;
  productName?: string | null;
  color?: string | null;
  order?: number | string;
  isPrimary?: boolean;
}

/**
 * Genera un nombre de archivo normalizado y estandarizado para imágenes de productos (WebP).
 * Formato canónico: [slug-marca-producto]-[color]-[rol]-[hash5].webp
 * Ejemplos:
 *  - "crocs-crocband-negro-portada-3a8f1.webp"
 *  - "crocs-crocband-marino-rojo-foto-2-9c4d2.webp"
 *  - "wilson-pelota-voley-portada-e1b7x.webp"
 */
export function generateProductImageFilename(params: GenerateProductImageFilenameParams): string {
  const brandSlug = params.brand ? slugify(params.brand) : "";
  const productSlug = params.productName ? slugify(params.productName) : "producto";

  // Si el slug del producto ya incluye la marca, no duplicarla (ej. "crocs-crocband" vs "crocs")
  let combinedSlug = productSlug;
  if (brandSlug && !productSlug.startsWith(brandSlug)) {
    combinedSlug = `${brandSlug}-${productSlug}`;
  }

  // Sanitizar color (si es null, vacío o "general", no agrega segmento de color redundante)
  const colorSlug =
    params.color && slugify(params.color) !== "general" ? slugify(params.color) : "";

  // Rol de la imagen en el carrusel
  const orderNum = Number(params.order) || 1;
  const roleSlug = params.isPrimary ? "portada" : `foto-${orderNum}`;

  // Hash aleatorio corto (5 caracteres alfanuméricos) para evitar colisiones y asegurar refresco de caché
  const uniqueHash = Math.random().toString(36).substring(2, 7);

  const parts = [combinedSlug, colorSlug, roleSlug, uniqueHash].filter(Boolean);
  return `${parts.join("-")}.webp`;
}

