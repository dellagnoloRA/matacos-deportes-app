import { z } from "zod";

/**
 * Enum exhaustivo para los tipos de movimientos de inventario en Matacos Deportes
 */
export const MovementTypeEnum = z.enum([
  "INGRESO_INICIAL",       // Carga inicial o lote de onboarding
  "INGRESO_COMPRA",        // Reabastecimiento de mercadería de proveedores
  "VENTA_MOSTRADOR",       // Egreso por venta física en Saavedra 241
  "VENTA_WEB",             // Egreso por venta online
  "DEVOLUCION_CLIENTE",    // Reingreso por cambio de talle o devolución
  "ANULACION_VENTA",       // Reingreso por ticket anulado
  "AJUSTE_INGRESO",        // Conteo físico favorable / ajuste manual
  "AJUSTE_EGRESO",         // Merma, pérdida o conteo físico negativo
  "TRANSFERENCIA_INTERNA", // Traslado interno de Depósito a Salón
], {
  errorMap: () => ({ message: "Tipo de movimiento de inventario no válido" }),
});

export const LocationEnum = z.enum(["STORE", "WAREHOUSE", "WAREHOUSE_TO_STORE"]);

/**
 * Esquema de validación para registrar un movimiento manual de stock
 */
export const InventoryMovementSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
  type: z.enum([
    "INGRESO_COMPRA",
    "AJUSTE_INGRESO",
    "AJUSTE_EGRESO",
    "DEVOLUCION_CLIENTE",
    "ANULACION_VENTA",
  ], {
    errorMap: () => ({ message: "Tipo de movimiento manual no permitido" }),
  }),
  quantity: z
    .number({ invalid_type_error: "La cantidad debe ser un número" })
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor a 0"),
  targetLocation: z.enum(["STORE", "WAREHOUSE"]).default("STORE"),
  reason: z.string().nullable().optional(),
}).refine(
  (data) => {
    // Si es un ajuste o devolución, el motivo es obligatorio para auditoría contable
    if (
      (data.type === "AJUSTE_INGRESO" ||
       data.type === "AJUSTE_EGRESO" ||
       data.type === "DEVOLUCION_CLIENTE" ||
       data.type === "ANULACION_VENTA") &&
      (!data.reason || data.reason.trim() === "")
    ) {
      return false;
    }
    return true;
  },
  {
    message: "Debe especificar el motivo o ticket para este tipo de movimiento",
    path: ["reason"],
  }
);

/**
 * Esquema para registrar una transferencia interna (Reposición de Depósito a Salón)
 */
export const StockTransferSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
  quantity: z
    .number({ invalid_type_error: "La cantidad debe ser un número" })
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad a trasladar debe ser mayor a 0"),
  fromLocation: z.enum(["WAREHOUSE"]).default("WAREHOUSE"),
  toLocation: z.enum(["STORE"]).default("STORE"),
  reason: z.string().nullable().optional(),
});

export type MovementType = z.infer<typeof MovementTypeEnum>;
export type InventoryMovementInput = z.infer<typeof InventoryMovementSchema>;
export type StockTransferInput = z.infer<typeof StockTransferSchema>;
