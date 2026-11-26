"use server";

import { unstable_cache } from "next/cache";
import {
  LANDING_CACHE_TAG,
  LANDING_CACHE_TTL_SECONDS,
  getFallbackLandingCache,
  setFallbackLandingCache,
  invalidateLandingCache,
  type LandingInvalidationSource,
} from "@/lib/landingCache";
import { fetchLandingPageDataUncached } from "@/server/services/landingService";
import type {
  LandingDataResponse,
  GetLandingPageDataResult,
} from "@/types/ecommerce";

/**
 * Tarea 3 (RF-28): Caché de alto rendimiento con `unstable_cache`,
 * etiqueta `landing-data` y TTL de 300 segundos (5 minutos).
 */
const getCachedLandingData = unstable_cache(
  async (): Promise<LandingDataResponse> => fetchLandingPageDataUncached(),
  ["matacos-landing-page-data"],
  {
    tags: [LANDING_CACHE_TAG],
    revalidate: LANDING_CACHE_TTL_SECONDS,
  }
);

/**
 * Tarea 2 y 3 (RF-28): Server Action unificada para la Landing Page (`/`)
 * de Matacos Deportes. Agrega en paralelo (Promise.all):
 *  - Banners promocionales activos y vigentes (`order asc`)
 *  - Disciplinas insignia con imagen y total de artículos disponibles
 *  - Últimos 8 ingresos (`newArrivals`)
 *  - 8 más vendidos según historial `SaleItem` (`bestSellers`)
 *  - 8 productos con descuento activo (`promoProducts`, `discountActive: true`)
 */
export async function getLandingPageData(): Promise<GetLandingPageDataResult> {
  try {
    try {
      const cached = await getCachedLandingData();
      return { success: true, data: cached };
    } catch {
      // Respaldo fuera del runtime incremental de Next.js (ej. scripts CLI / suites tsx)
      const fallbackHit = getFallbackLandingCache();
      if (fallbackHit) {
        return { success: true, data: fallbackHit };
      }

      const fresh = await fetchLandingPageDataUncached();
      setFallbackLandingCache(fresh);
      return { success: true, data: fresh };
    }
  } catch (error) {
    console.error("Error en getLandingPageData:", error);
    return {
      success: false,
      error: "No se pudieron cargar los datos de la página de inicio.",
    };
  }
}

/**
 * Tarea 4 (RF-28): Server Action / Helper de invalidación de caché bajo demanda
 * para invocar cuando se modifiquen banners (RF-26) o descuentos promocionales (RF-27).
 */
export async function revalidateLandingPageData(
  source: LandingInvalidationSource = "manual"
): Promise<{
  success: boolean;
  tag: string;
  source: LandingInvalidationSource;
  timestamp: string;
}> {
  const res = invalidateLandingCache(source);
  return {
    success: res.invalidated,
    tag: res.tag,
    source: res.source,
    timestamp: res.timestamp,
  };
}
