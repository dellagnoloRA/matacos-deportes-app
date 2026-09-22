import { z } from "zod";

export const CashShiftStatusEnum = z.enum(["ABIERTA", "CERRADA"]);

export const CashMovementTypeEnum = z.enum([
  "INGRESO_EXTRAORDINARIO",
  "RETIRO_CAJA_FUERTE",
  "GASTO_MENOR",
  "AJUSTE_ARQUEO",
]);

/**
 * Esquema para Apertura de Turno de Caja (Fondo de Cambio Inicial)
 */
export const OpenCashShiftSchema = z.object({
  terminalId: z.string().min(1, "El identificador de terminal es obligatorio"),
  userId: z.string().uuid("ID de usuario inválido"),
  initialAmount: z
    .number({ invalid_type_error: "El fondo inicial debe ser un número" })
    .min(0, "El fondo inicial no puede ser negativo"),
  notes: z.string().max(250).optional().nullable(),
});

/**
 * Esquema para Movimientos Intermedios de Caja (Ingresos / Retiros / Gastos Menores)
 */
export const CreateCashMovementSchema = z.object({
  cashShiftId: z.string().uuid("ID de turno de caja inválido"),
  type: CashMovementTypeEnum,
  amount: z
    .number({ invalid_type_error: "El monto debe ser un número" })
    .positive("El monto debe ser mayor a 0"),
  reason: z
    .string()
    .min(3, "El motivo debe contener al menos 3 caracteres")
    .max(200, "El motivo no puede superar los 200 caracteres"),
  receiptNumber: z.string().max(50).optional().nullable(),
  performedBy: z.string().min(1, "El nombre del responsable es obligatorio"),
});

/**
 * Esquema para Cierre y Arqueo de Turno de Caja (RF-11)
 * El cajero ingresa los montos reales contados físicamente y cupones de terminales.
 */
export const CloseCashShiftSchema = z.object({
  cashShiftId: z.string().uuid("ID de turno de caja inválido"),
  actualCash: z
    .number({ invalid_type_error: "El conteo de efectivo debe ser un número" })
    .min(0, "El conteo de efectivo no puede ser negativo"),
  actualDebit: z.number().min(0).optional().nullable(),
  actualCredit: z.number().min(0).optional().nullable(),
  actualTransfer: z.number().min(0).optional().nullable(),
  actualQr: z.number().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CashShiftStatus = z.infer<typeof CashShiftStatusEnum>;
export type CashMovementType = z.infer<typeof CashMovementTypeEnum>;
export type OpenCashShiftInput = z.infer<typeof OpenCashShiftSchema>;
export type CreateCashMovementInput = z.infer<typeof CreateCashMovementSchema>;
export type CloseCashShiftInput = z.infer<typeof CloseCashShiftSchema>;
