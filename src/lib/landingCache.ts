import { revalidatePath, revalidateTag } from "next/cache";
import type { LandingDataResponse } from "@/types/ecommerce";

export const LANDING_CACHE_TAG = "landing-data";
export const LANDING_CACHE_TTL_SECONDS = 300; // 5 minutos

export type LandingInvalidationSource =
  | "banner"
  | "discount"
  | "product"
  | "manual";

interface MemoryCacheEntry {
  data: LandingDataResponse;
  expiresAt: number;
  generation: number;
}

let memoryCacheEntry: MemoryCacheEntry | null = null;
let cacheGeneration = 0;

/**
 * Obtiene la entrada en memoria de contingencia si está vigente dentro del TTL de 300s.
 * Se emplea como respaldo cuando `unstable_cache` se ejecuta fuera del runtime incremental de Next.js.
 */
export function getFallbackLandingCache(): LandingDataResponse | null {
  if (!memoryCacheEntry) return null;
  if (
    memoryCacheEntry.generation !== cacheGeneration ||
    Date.now() > memoryCacheEntry.expiresAt
  ) {
    memoryCacheEntry = null;
    return null;
  }
  return memoryCacheEntry.data;
}

/**
 * Almacena en la caché de respaldo en memoria con TTL estricto de 300 segundos.
 */
export function setFallbackLandingCache(data: LandingDataResponse): void {
  memoryCacheEntry = {
    data,
    expiresAt: Date.now() + LANDING_CACHE_TTL_SECONDS * 1000,
    generation: cacheGeneration,
  };
}

/**
 * Retorna el contador monotónico de generación de caché (útil para auditoría y pruebas).
 */
export function getLandingCacheGeneration(): number {
  return cacheGeneration;
}

/**
 * Tarea 4 (RF-28): Helper centralizado de invalidación de caché de la Landing Page.
 * Invalida la etiqueta `landing-data` (unstable_cache), la ruta raíz `/` (ISR)
 * y, si el origen es un descuento (RF-27) o producto, sincroniza también las etiquetas del catálogo.
 */
export function invalidateLandingCache(
  source: LandingInvalidationSource = "manual"
): {
  invalidated: boolean;
  tag: string;
  source: LandingInvalidationSource;
  generation: number;
  timestamp: string;
} {
  cacheGeneration += 1;
  memoryCacheEntry = null;

  try {
    revalidateTag(LANDING_CACHE_TAG);
    revalidatePath("/");

    if (source === "discount" || source === "product") {
      revalidateTag("ecommerce-catalog");
      revalidateTag("catalog-facets");
      revalidatePath("/catalogo");
      revalidatePath("/productos");
    }

    if (source === "banner") {
      revalidatePath("/admin");
      revalidatePath("/admin/banners");
    }
  } catch {
    // Silenciado cuando se invoca desde scripts CLI / suites tsx fuera del store HTTP de Next.js
  }

  return {
    invalidated: true,
    tag: LANDING_CACHE_TAG,
    source,
    generation: cacheGeneration,
    timestamp: new Date().toISOString(),
  };
}
