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
 * Genera un SKU determinista y legible para variantes que no lo tengan definido.
 * Formato: [MARCA-3]-[DISC-3]-[PROD-3]-[TALLE]-[COLOR-3]
 * Ejemplo: "SPE-NAT-MAR-UNI-AZU"
 */
export function generateDeterministicSku(params: {
  brand: string;
  discipline: string;
  productName: string;
  size: string;
  color: string;
}): string {
  const sanitizePart = (str: string, maxLen = 3) => {
    const slug = slugify(str).replace(/-/g, "").toUpperCase();
    return slug.slice(0, maxLen) || "GEN";
  };

  const b = sanitizePart(params.brand, 3);
  const d = sanitizePart(params.discipline, 3);
  const p = sanitizePart(params.productName, 3);
  const s = slugify(params.size).toUpperCase().slice(0, 4) || "UNI";
  const c = sanitizePart(params.color, 3);

  return `${b}-${d}-${p}-${s}-${c}`;
}
