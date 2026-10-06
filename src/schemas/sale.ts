import { z } from "zod";

export const PaymentMethodEnum = z.enum([
  "EFECTIVO",
  "DEBITO",
  "CREDITO",
  "TRANSFERENCIA",
  "QR_MERCADOPAGO",
], {
  errorMap: () => ({ message: "Método de pago no válido" }),
});

export const SaleStatusEnum = z.enum([
  "PENDIENTE_PAGO",
  "COMPLETADA",
  "CANCELADA",
]);

export const DiscountTypeEnum = z.enum([
  "PERCENTAGE",
  "FIXED",
]);

/**
 * Esquema para Descuentos Manuales (% o $ fijo)
 * Valida que los porcentajes estén entre 0 y 100%, y valores positivos.
 */
export const DiscountSchema = z
  .object({
    type: DiscountTypeEnum,
    value: z
      .number({ invalid_type_error: "El valor del descuento debe ser un número" })
      .positive("El valor del descuento debe ser mayor a 0"),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "PERCENTAGE") {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: "El descuento porcentual no puede superar el 100%",
      path: ["value"],
    }
  );

/**
 * Esquema para un ítem individual dentro de una venta
 */
export const SaleItemSchema = z
  .object({
    variantId: z.string().uuid("ID de variante inválido"),
    quantity: z
      .number({ invalid_type_error: "La cantidad debe ser un número" })
      .int("La cantidad debe ser un número entero")
      .positive("La cantidad debe ser mayor a 0"),
    price: z
      .number({ invalid_type_error: "El precio unitario debe ser un número" })
      .min(0, "El precio unitario no puede ser negativo"),
    originalPrice: z.number().min(0).optional(),
    discount: z.number().min(0).optional().default(0),
    discountType: DiscountTypeEnum.optional().nullable(),
    discountValue: z.number().min(0).optional().nullable(),
    unitPrice: z.number().min(0).optional(),
  })
  .refine(
    (item) => {
      if (item.discountType === "PERCENTAGE" && item.discountValue !== null && item.discountValue !== undefined) {
        return item.discountValue <= 100;
      }
      return true;
    },
    {
      message: "El descuento porcentual de un ítem no puede superar el 100%",
      path: ["discountValue"],
    }
  );

/**
 * Esquema para un método de pago aplicado a la venta (soporta pagos divididos)
 */
export const SalePaymentSchema = z.object({
  method: PaymentMethodEnum,
  amount: z
    .number({ invalid_type_error: "El monto a pagar debe ser un número" })
    .min(0, "El monto a pagar no puede ser negativo"),
  receivedAmount: z
    .number({ invalid_type_error: "El monto con el que pagó debe ser un número" })
    .min(0, "El monto abonado no puede ser negativo")
    .optional()
    .nullable(),
  change: z
    .number({ invalid_type_error: "El vuelto debe ser un número" })
    .min(0, "El vuelto no puede ser negativo")
    .optional()
    .nullable(),
  cardBrand: z.string().optional().nullable(),
  cardVoucher: z.string().optional().nullable(),
  installments: z.number().int().positive().optional().nullable(),
  referenceCode: z.string().optional().nullable(),
});

/**
 * Esquema completo para procesar una Venta directa en Mostrador (Legacy / Direct POS)
 */
export const CreateSaleSchema = z
  .object({
    userId: z.string().uuid("ID de usuario inválido").optional().nullable(),
    sellerId: z.string().uuid("ID de vendedor inválido").optional().nullable(),
    cashierId: z.string().uuid("ID de cajero inválido").optional().nullable(),
    cashShiftId: z.string().uuid("ID de turno de caja inválido").optional().nullable(),
    terminalId: z.string().optional().nullable(),
    customerName: z.string().optional().nullable(),
    channel: z.string().default("MOSTRADOR"),
    discount: z
      .number({ invalid_type_error: "El descuento debe ser un número" })
      .min(0, "El descuento no puede ser negativo")
      .default(0),
    discountType: DiscountTypeEnum.optional().nullable(),
    discountValue: z.number().min(0).optional().nullable(),
    items: z
      .array(SaleItemSchema)
      .min(1, "La venta debe contener al menos un producto"),
    payments: z
      .array(SalePaymentSchema)
      .min(1, "Debe registrar al menos un método de pago"),
    offlineId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) => {
      const itemsTotal = data.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      const netTotal = Math.max(0, itemsTotal - data.discount);
      const paymentsTotal = data.payments.reduce(
        (sum, pay) => sum + pay.amount,
        0
      );

      // Los pagos deben cubrir el total neto de la venta (tolerancia de 0.05 por redondeo decimal)
      return paymentsTotal >= netTotal - 0.05;
    },
    {
      message: "El monto total de los pagos ingresados no cubre el importe neto total de la venta",
      path: ["payments"],
    }
  )
  .refine(
    (data) => {
      // Si se especificó con cuánto abonó en efectivo, debe cubrir el monto a cobrar
      for (const pay of data.payments) {
        if (
          pay.method === "EFECTIVO" &&
          pay.receivedAmount !== undefined &&
          pay.receivedAmount !== null &&
          pay.receivedAmount < pay.amount - 0.05
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message: "El monto abonado en efectivo es menor al importe a cobrar",
      path: ["payments"],
    }
  );

/**
 * Esquema para un ítem de Preventa (Terminal 1 Salón y Modificación en Caja)
 */
export const PendingSaleItemSchema = z
  .object({
    variantId: z.string().uuid("ID de variante inválido"),
    quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
    originalPrice: z.number().min(0, "El precio no puede ser negativo"),
    discountType: DiscountTypeEnum.optional().nullable(),
    discountValue: z.number().min(0).optional().nullable(),
    discountAmount: z.number().min(0).default(0),
    unitPrice: z.number().min(0, "El precio unitario no puede ser negativo"),
  })
  .refine(
    (item) => {
      if (item.discountType === "PERCENTAGE" && item.discountValue !== null && item.discountValue !== undefined) {
        return item.discountValue <= 100;
      }
      return true;
    },
    {
      message: "El descuento porcentual de un ítem no puede superar el 100%",
      path: ["discountValue"],
    }
  );

/**
 * Esquema para Crear Preventa en Salón de Ventas (Terminal 1)
 */
export const CreatePendingSaleSchema = z.object({
  sellerId: z.string().uuid("ID de vendedor inválido").optional().nullable(),
  customerName: z.string().min(1, "El nombre o alias del cliente es requerido").max(100),
  items: z
    .array(PendingSaleItemSchema)
    .min(1, "La preventa debe contener al menos un producto"),
  globalDiscount: DiscountSchema.optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
  offlineId: z.string().uuid().optional().nullable(),
});

/**
 * Esquema para Modificar Preventa en Caja Mostrador antes de cobrar
 */
export const UpdatePendingSaleSchema = z.object({
  saleId: z.string().uuid("ID de venta inválido"),
  customerName: z.string().min(1).max(100).optional(),
  items: z
    .array(PendingSaleItemSchema)
    .min(1, "La preventa debe contener al menos un producto"),
  globalDiscount: DiscountSchema.optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

/**
 * Esquema para Cobrar y Concretar la Preventa en Caja Mostrador (Terminal 2)
 */
export const CompletePendingSaleSchema = z
  .object({
    saleId: z.string().uuid("ID de venta inválido"),
    cashierId: z.string().uuid("ID de cajero inválido").optional().nullable(),
    cashShiftId: z.string().uuid("ID de turno de caja inválido").optional().nullable(),
    terminalId: z.string().optional().nullable(),
    payments: z
      .array(SalePaymentSchema)
      .min(1, "Debe registrar al menos un método de pago"),
  });

/**
 * Esquema para Sincronización por Lote Offline (RF-12)
 */
export const SyncOfflineSalesSchema = z.object({
  sales: z.array(CreateSaleSchema).min(1, "El lote debe contener al menos una venta"),
});

export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
export type SaleStatus = z.infer<typeof SaleStatusEnum>;
export type DiscountType = z.infer<typeof DiscountTypeEnum>;
export type DiscountInput = z.input<typeof DiscountSchema>;
export type SaleItemInput = z.input<typeof SaleItemSchema>;
export type SalePaymentInput = z.input<typeof SalePaymentSchema>;
export type CreateSaleInput = z.input<typeof CreateSaleSchema>;
export type CreatePendingSaleInput = z.input<typeof CreatePendingSaleSchema>;
export type UpdatePendingSaleInput = z.input<typeof UpdatePendingSaleSchema>;
export type CompletePendingSaleInput = z.input<typeof CompletePendingSaleSchema>;
export type SyncOfflineSalesInput = z.input<typeof SyncOfflineSalesSchema>;
