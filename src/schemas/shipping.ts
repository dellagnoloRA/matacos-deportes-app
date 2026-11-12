import { z } from "zod";
import { ShippingMethodEnum } from "./ecommerce";

/**
 * ============================================================================
 * ESQUEMAS Y CONSTANTES DE LOGÍSTICA Y ENVÍOS (RF-19 Y RF-25)
 * Matacos Deportes — Saavedra 241, Formosa Capital (CP 3600)
 * ============================================================================
 */

export { ShippingMethodEnum };
export type ShippingMethod = z.infer<typeof ShippingMethodEnum>;

/**
 * Aliases en inglés correspondientes a las subtareas de Jira / Trello
 */
export const LegacyShippingMethodAlias = {
  PICKUP_STORE: "RETIRO_LOCAL",
  LOCAL_COURIER: "CADETERIA_FORMOSA",
  NATIONAL_SHIPPING: "CORREO_ARGENTINO_DOMICILIO",
  NATIONAL_SHIPPING_HOME: "CORREO_ARGENTINO_DOMICILIO",
  NATIONAL_SHIPPING_AGENCY: "CORREO_ARGENTINO_SUCURSAL",
} as const;

/**
 * Pesos heurísticos en gramos por categoría/tipo de producto acordados en dominio
 */
export const HEURISTIC_WEIGHTS_GRAMS: Record<string, number> = {
  CALZADO: 950,
  INDUMENTARIA: 300,
  ACCESORIOS: 150,
  DEFAULT: 500,
};

/**
 * Dimensiones heurísticas de bulto individual promedio en cm (alto x ancho x largo)
 */
export const HEURISTIC_DIMENSIONS_CM = {
  CALZADO: { height: 12, width: 22, length: 32 },
  INDUMENTARIA: { height: 4, width: 25, length: 30 },
  ACCESORIOS: { height: 5, width: 15, length: 15 },
  DEFAULT: { height: 10, width: 20, length: 25 },
};

/**
 * Ítem individual del carrito para el cálculo de flete volumétrico
 */
export const ShippingItemInputSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
  quantity: z
    .number()
    .int("La cantidad debe ser un entero")
    .min(1, "La cantidad mínima es 1"),
  weightGrams: z.number().int().min(1).optional().nullable(),
  categoryName: z.string().optional().nullable(),
  dimensionsCm: z
    .object({
      height: z.number().optional(),
      width: z.number().optional(),
      length: z.number().optional(),
    })
    .optional()
    .nullable(),
});
export type ShippingItemInput = z.infer<typeof ShippingItemInputSchema>;

/**
 * Esquema Zod ShippingCalculationSchema (BE-RF19 Subtarea 2)
 * Valida código postal, método seleccionado y artículos para calcular el flete.
 */
export const ShippingCalculationSchema = z.object({
  postalCode: z
    .string()
    .trim()
    .min(4, "El código postal debe tener al menos 4 dígitos")
    .max(8, "El código postal no puede superar los 8 caracteres"),
  method: ShippingMethodEnum,
  items: z
    .array(ShippingItemInputSchema)
    .min(1, "Debe incluir al menos un artículo para cotizar el envío"),
  agencyCode: z.string().trim().optional().nullable(),
});
export type ShippingCalculationInput = z.infer<typeof ShippingCalculationSchema>;

/**
 * Resultado de la cotización logística (RF-19)
 */
export interface ShippingRateOption {
  method: ShippingMethod;
  name: string;
  price: number;
  priceFormatted: string;
  deliveryTimeMinDays?: number;
  deliveryTimeMaxDays?: number;
  deliveryEstimateText?: string;
  deliveredType?: "D" | "S";
  isFree: boolean;
  notes?: string;
}

export interface ShippingCalculationResult {
  success: boolean;
  cost: number;
  costFormatted: string;
  method: ShippingMethod;
  options: ShippingRateOption[];
  packageDetails: {
    totalWeightGrams: number;
    heightCm: number;
    widthCm: number;
    lengthCm: number;
  };
  isContingencyFallback?: boolean;
  error?: string;
}

/**
 * Esquema para asignación atómica de flete a la orden (BE-RF19 Subtarea 4)
 */
export const ApplyShippingToOrderSchema = z.object({
  orderId: z.string().uuid("ID de orden inválido"),
  shippingMethod: ShippingMethodEnum,
  shippingCost: z
    .number({ invalid_type_error: "El costo de envío debe ser numérico" })
    .min(0, "El costo de envío no puede ser negativo"),
  shippingAddress: z.string().trim().max(200).optional().nullable(),
  shippingCity: z.string().trim().max(80).optional().nullable(),
  shippingPostalCode: z.string().trim().max(15).optional().nullable(),
  shippingBranchCode: z.string().trim().max(30).optional().nullable(),
  shippingBranchName: z.string().trim().max(120).optional().nullable(),
});
export type ApplyShippingToOrderInput = z.infer<typeof ApplyShippingToOrderSchema>;

/**
 * Sucursal oficial de Correo Argentino devuelta por la API MiCorreo
 */
export interface CorreoArgentinoAgency {
  code: string;
  name: string;
  phone?: string;
  address: {
    streetName: string;
    streetNumber: string;
    locality: string;
    city: string;
    province: string;
    provinceCode: string;
    postalCode: string;
  };
  hours?: Record<string, any>;
  packageReception: boolean;
  pickupAvailability: boolean;
}

/**
 * Esquema para asociar información de seguimiento y transportista (BE-RF25 Subtarea 4)
 */
export const SetOrderTrackingInfoSchema = z.object({
  orderId: z.string().uuid("ID de orden inválido"),
  trackingNumber: z
    .string()
    .trim()
    .min(5, "El número de guía debe tener al menos 5 caracteres")
    .max(50, "El número de guía no puede exceder los 50 caracteres"),
  courierName: z.string().trim().default("Correo Argentino"),
  notifyCustomer: z.boolean().default(true),
});
export type SetOrderTrackingInfoInput = z.infer<typeof SetOrderTrackingInfoSchema>;

/**
 * Esquema para anulación transaccional de orden web (BE-RF25 Subtarea 5)
 */
export const CancelWebOrderSchema = z.object({
  orderId: z.string().uuid("ID de orden inválido"),
  reason: z
    .string()
    .trim()
    .min(3, "Debe especificar un motivo de cancelación de al menos 3 caracteres")
    .max(300, "El motivo no puede exceder los 300 caracteres"),
});
export type CancelWebOrderInput = z.infer<typeof CancelWebOrderSchema>;

/**
 * Algoritmo canónico de consolidación de Paquete Virtual
 */
export function calculateVirtualPackage(
  items: Array<{
    quantity: number;
    weightGrams?: number | null;
    categoryName?: string | null;
    dimensionsCm?: { height?: number; width?: number; length?: number } | null;
  }>
): { weight: number; height: number; width: number; length: number } {
  let totalWeight = 0;
  let totalVolumeCm3 = 0;
  let maxSide = 15;

  for (const item of items) {
    const qty = Math.max(1, item.quantity);

    // Resolver peso heurístico si no está definido
    let unitWeight = item.weightGrams;
    if (!unitWeight || unitWeight <= 0) {
      const cat = (item.categoryName || "").toUpperCase();
      if (cat.includes("CALZADO") || cat.includes("ZAPATILLA")) {
        unitWeight = HEURISTIC_WEIGHTS_GRAMS.CALZADO;
      } else if (
        cat.includes("INDUMENTARIA") ||
        cat.includes("REMERA") ||
        cat.includes("SHORT") ||
        cat.includes("CALZA") ||
        cat.includes("MALLA")
      ) {
        unitWeight = HEURISTIC_WEIGHTS_GRAMS.INDUMENTARIA;
      } else if (cat.includes("ACCESORIO") || cat.includes("GORRA") || cat.includes("MEDIAS")) {
        unitWeight = HEURISTIC_WEIGHTS_GRAMS.ACCESORIOS;
      } else {
        unitWeight = HEURISTIC_WEIGHTS_GRAMS.DEFAULT;
      }
    }
    totalWeight += unitWeight * qty;

    // Resolver volumen heurístico
    let dim = item.dimensionsCm;
    if (!dim || !dim.height || !dim.width || !dim.length) {
      const cat = (item.categoryName || "").toUpperCase();
      if (cat.includes("CALZADO") || cat.includes("ZAPATILLA")) {
        dim = HEURISTIC_DIMENSIONS_CM.CALZADO;
      } else if (cat.includes("INDUMENTARIA")) {
        dim = HEURISTIC_DIMENSIONS_CM.INDUMENTARIA;
      } else if (cat.includes("ACCESORIO")) {
        dim = HEURISTIC_DIMENSIONS_CM.ACCESORIOS;
      } else {
        dim = HEURISTIC_DIMENSIONS_CM.DEFAULT;
      }
    }

    const itemVolume = (dim.height || 10) * (dim.width || 20) * (dim.length || 25);
    totalVolumeCm3 += itemVolume * qty;
    maxSide = Math.max(maxSide, dim.length || 25, dim.width || 20, dim.height || 10);
  }

  // Estimar lados del paquete virtual a partir del volumen cúbico
  const approxSide = Math.max(15, Math.round(Math.cbrt(totalVolumeCm3)));
  const height = Math.min(approxSide, 70);
  const width = Math.min(approxSide, 70);
  const length = Math.min(Math.max(approxSide, maxSide), 90);

  return {
    weight: Math.max(100, Math.round(totalWeight)), // Mínimo 100g para MiCorreo
    height: Math.max(5, height),
    width: Math.max(10, width),
    length: Math.max(15, length),
  };
}
