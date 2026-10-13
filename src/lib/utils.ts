import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combinador de clases Tailwind para componentes UI
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea importes numéricos a Pesos Argentinos (ARS)
 * Ejemplo: 45000 -> "$ 45.000,00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Normaliza un texto para búsquedas tolerantes a:
 * - Tildes/acentos (ej: "Vóley" → "voley")
 * - Guiones, puntos y otros separadores (ej: "Gel-Rocket" → "gel rocket")
 * - Mayúsculas
 * Uso: comparar normalizeSearch(query) contra normalizeSearch(campo)
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar diacríticos (tildes, diéresis, etc.)
    .toLowerCase()
    .replace(/[-_.,()/\\|]+/g, " ") // separadores especiales → espacio
    .replace(/\s+/g, " ")           // colapsar espacios múltiples
    .trim();
}

/**
 * Formatea fechas a la zona horaria oficial de Formosa, Argentina
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}
