/**
 * Módulo de Lógica y Cálculo de Descuentos para Matacos Deportes (RF-08)
 * Implementa reglas deterministas al centavo para evitar pérdida de precisión y totales negativos.
 */

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface DiscountConfig {
  type: DiscountType;
  value: number; // Porcentaje (0-100) o Monto Fijo en ARS
  reason?: string;
}

export interface RawSaleItemInput {
  variantId: string;
  quantity: number;
  originalPrice: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  discountAmount?: number; // Puede venir precalculado o calcularse
  unitPrice?: number;
}

export interface CalculatedSaleItem {
  variantId: string;
  quantity: number;
  originalPrice: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  unitDiscount: number; // Descuento monetario por cada unidad
  lineDiscountTotal: number; // unitDiscount * quantity
  unitPrice: number; // originalPrice - unitDiscount (precio unitario efectivo)
  subtotal: number; // quantity * unitPrice
}

export interface CalculatedSaleTotals {
  subtotalGross: number; // Suma de todos los renglones a precio de lista
  totalItemDiscounts: number; // Suma de los descuentos de cada ítem
  subtotalAfterItems: number; // subtotalGross - totalItemDiscounts
  globalDiscountAmount: number; // Descuento global aplicado sobre el ticket
  totalDiscount: number; // totalItemDiscounts + globalDiscountAmount
  totalNet: number; // Importe final a cobrar (subtotalAfterItems - globalDiscountAmount)
  items: CalculatedSaleItem[];
}

/**
 * Calcula el descuento unitario y precio final de un ítem individual
 */
export function calculateItemDiscount(
  originalPrice: number,
  discountType?: DiscountType | null,
  discountValue?: number | null
): { unitDiscount: number; unitPrice: number } {
  if (!discountType || !discountValue || discountValue <= 0) {
    return { unitDiscount: 0, unitPrice: originalPrice };
  }

  let unitDiscount = 0;

  if (discountType === "PERCENTAGE") {
    // Validar rango porcentual estricto
    const clampedPercent = Math.min(100, Math.max(0, discountValue));
    const rawDiscount = (originalPrice * clampedPercent) / 100;
    unitDiscount = Math.round(rawDiscount * 100) / 100;
  } else if (discountType === "FIXED") {
    // El descuento fijo no puede exceder el precio original del producto
    unitDiscount = Math.min(originalPrice, Math.max(0, discountValue));
    unitDiscount = Math.round(unitDiscount * 100) / 100;
  }

  const unitPrice = Math.max(0, Math.round((originalPrice - unitDiscount) * 100) / 100);
  return { unitDiscount, unitPrice };
}

/**
 * Recalcula todos los totales de la venta garantizando:
 * 1. Cero totales negativos.
 * 2. Redondeo determinista a 2 decimales en cada paso.
 * 3. Consistencia total entre renglones, descuentos globales y neto final.
 */
export function calculateSaleTotals(
  items: RawSaleItemInput[],
  globalDiscount?: DiscountConfig | null
): CalculatedSaleTotals {
  let subtotalGross = 0;
  let totalItemDiscounts = 0;

  const calculatedItems: CalculatedSaleItem[] = items.map((item) => {
    const qty = Math.max(1, Math.floor(item.quantity));
    const origPrice = Math.max(0, item.originalPrice);

    const { unitDiscount, unitPrice } = calculateItemDiscount(
      origPrice,
      item.discountType,
      item.discountValue
    );

    const lineGross = Math.round(origPrice * qty * 100) / 100;
    const lineDiscountTotal = Math.round(unitDiscount * qty * 100) / 100;
    const subtotal = Math.max(0, Math.round(unitPrice * qty * 100) / 100);

    subtotalGross += lineGross;
    totalItemDiscounts += lineDiscountTotal;

    return {
      variantId: item.variantId,
      quantity: qty,
      originalPrice: origPrice,
      discountType: item.discountType,
      discountValue: item.discountValue,
      unitDiscount,
      lineDiscountTotal,
      unitPrice,
      subtotal,
    };
  });

  subtotalGross = Math.round(subtotalGross * 100) / 100;
  totalItemDiscounts = Math.round(totalItemDiscounts * 100) / 100;
  const subtotalAfterItems = Math.max(0, Math.round((subtotalGross - totalItemDiscounts) * 100) / 100);

  // Cálculo del Descuento Global del Ticket
  let globalDiscountAmount = 0;
  if (globalDiscount && globalDiscount.value > 0) {
    if (globalDiscount.type === "PERCENTAGE") {
      const clampedPercent = Math.min(100, Math.max(0, globalDiscount.value));
      const rawGlobal = (subtotalAfterItems * clampedPercent) / 100;
      globalDiscountAmount = Math.round(rawGlobal * 100) / 100;
    } else if (globalDiscount.type === "FIXED") {
      // El descuento fijo global no puede superar el subtotal remanente
      globalDiscountAmount = Math.min(subtotalAfterItems, Math.max(0, globalDiscount.value));
      globalDiscountAmount = Math.round(globalDiscountAmount * 100) / 100;
    }
  }

  const totalDiscount = Math.round((totalItemDiscounts + globalDiscountAmount) * 100) / 100;
  const totalNet = Math.max(0, Math.round((subtotalAfterItems - globalDiscountAmount) * 100) / 100);

  return {
    subtotalGross,
    totalItemDiscounts,
    subtotalAfterItems,
    globalDiscountAmount,
    totalDiscount,
    totalNet,
    items: calculatedItems,
  };
}
