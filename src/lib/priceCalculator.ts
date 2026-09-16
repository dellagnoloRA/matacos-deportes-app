/**
 * Políticas de redondeo disponibles para ajustes comerciales de precios
 */
export type RoundingPolicy =
  | "NONE"             // 2 decimales exactos (sin redondeo a enteros)
  | "INTEGER"          // Entero más cercano ($ 15.423)
  | "NEAREST_10"       // Múltiplo de 10 más cercano ($ 15.420)
  | "NEAREST_50"       // Múltiplo de 50 más cercano ($ 15.450)
  | "NEAREST_100"      // Múltiplo de 100 más cercano ($ 15.400)
  | "UP_10"            // Redondeo hacia arriba al múltiplo de 10 ($ 15.430)
  | "UP_50"            // Redondeo hacia arriba al múltiplo de 50 ($ 15.450)
  | "UP_100"           // Redondeo hacia arriba al múltiplo de 100 ($ 15.500)
  | "PSYCHOLOGICAL_90"; // Redondeo psicológico terminado en 90 ($ 15.390, $ 15.490)

export interface PriceCalculationResult {
  originalPrice: number;
  percentage: number;
  rawNewPrice: number;       // Precio exacto sin redondeo (2 decimales)
  finalPrice: number;        // Precio final tras aplicar la política de redondeo
  delta: number;             // Diferencia absoluta (finalPrice - originalPrice)
  effectivePercentage: number; // Porcentaje real aplicado tras el redondeo
  roundingPolicy: RoundingPolicy;
}

/**
 * Aplica una política de redondeo a un valor monetario
 */
export function applyRoundingPolicy(amount: number, policy: RoundingPolicy): number {
  if (amount <= 0) return 0;

  switch (policy) {
    case "NONE":
      // Redondeo estándar a 2 decimales evitando errores de coma flotante
      return Math.round((amount + Number.EPSILON) * 100) / 100;

    case "INTEGER":
      return Math.round(amount);

    case "NEAREST_10":
      return Math.round(amount / 10) * 10;

    case "NEAREST_50":
      return Math.round(amount / 50) * 50;

    case "NEAREST_100":
      return Math.round(amount / 100) * 100;

    case "UP_10":
      return Math.ceil(amount / 10) * 10;

    case "UP_50":
      return Math.ceil(amount / 50) * 50;

    case "UP_100":
      return Math.ceil(amount / 100) * 100;

    case "PSYCHOLOGICAL_90": {
      // Si el precio es menor a 100, no podemos terminarlo en 90 razonablemente
      if (amount < 90) return Math.round(amount);
      const base = Math.round(amount / 100) * 100;
      const candidate = base - 10; // ej. 15.500 -> 15.490
      return candidate > 0 ? candidate : 90;
    }

    default:
      return Math.round(amount);
  }
}

/**
 * Calcula con exactitud matemática el nuevo precio a partir de un porcentaje y una política de redondeo.
 * Utiliza aritmética escalada para mitigar imprecisiones de coma flotante IEEE-754.
 *
 * @param currentPrice Precio actual en base (debe ser >= 0)
 * @param percentage Porcentaje a aplicar (ej: 15 para +15%, -10 para -10% de descuento)
 * @param policy Política de redondeo a aplicar (por defecto: NEAREST_10)
 */
export function calculateNewPrice(
  currentPrice: number,
  percentage: number,
  policy: RoundingPolicy = "NEAREST_10"
): PriceCalculationResult {
  const safeCurrent = Math.max(0, currentPrice);

  // Si el precio actual es 0, no hay aumento porcentual posible
  if (safeCurrent === 0) {
    return {
      originalPrice: 0,
      percentage,
      rawNewPrice: 0,
      finalPrice: 0,
      delta: 0,
      effectivePercentage: 0,
      roundingPolicy: policy,
    };
  }

  // Multiplicador con aritmética de precisión:
  // factor = (100 + percentage) / 100
  // Para evitar errores de coma flotante como 0.1 + 0.2, escalamos a enteros en centavos
  const currentCents = Math.round(safeCurrent * 100);
  const factor = (10000 + Math.round(percentage * 100)) / 10000;
  
  const rawPriceCents = currentCents * factor;
  const rawNewPrice = Math.max(0, Math.round(rawPriceCents) / 100);

  // Aplicar la política de redondeo configurada
  const finalPrice = Math.max(0, applyRoundingPolicy(rawNewPrice, policy));
  const delta = Math.round((finalPrice - safeCurrent) * 100) / 100;

  // Porcentaje efectivo resultante luego del redondeo
  const effectivePercentage =
    safeCurrent > 0 ? Math.round(((finalPrice - safeCurrent) / safeCurrent) * 10000) / 100 : 0;

  return {
    originalPrice: safeCurrent,
    percentage,
    rawNewPrice,
    finalPrice,
    delta,
    effectivePercentage,
    roundingPolicy: policy,
  };
}
