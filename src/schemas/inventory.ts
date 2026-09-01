import { z } from "zod";

export const MovementTypeEnum = z.enum([
  "INGRESO_COMPRA",
  "AJUSTE_INGRESO",
  "AJUSTE_EGRESO",
  "VENTA_MOSTRADOR",
], {
  errorMap: () => ({ message: "Tipo de movimiento de inventario no válido" }),
});

/**
 * Esquema de validación para registrar un movimiento manual de stock (Ingreso por compra o Ajustes)
 */
export const InventoryMovementSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
  type: z.enum(["INGRESO_COMPRA", "AJUSTE_INGRESO", "AJUSTE_EGRESO"], {
    errorMap: () => ({ message: "Tipo de movimiento debe ser INGRESO_COMPRA, AJUSTE_INGRESO o AJUSTE_EGRESO" }),
  }),
  quantity: z
    .number({ invalid_type_error: "La cantidad debe ser un número" })
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor a 0"),
  reason: z.string().nullable().optional(),
}).refine(
  (data) => {
    // Si es un ajuste (ingreso o egreso), el motivo es obligatorio para auditoría
    if ((data.type === "AJUSTE_INGRESO" || data.type === "AJUSTE_EGRESO") && (!data.reason || data.reason.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Debe especificar el motivo para realizar un ajuste de inventario",
    path: ["reason"],
  }
);

export type MovementType = z.infer<typeof MovementTypeEnum>;
export type InventoryMovementInput = z.infer<typeof InventoryMovementSchema>;
