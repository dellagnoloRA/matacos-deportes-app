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
 * Permite especificar userId (UUID) o userName (nombre del cajero para auto-resolución).
 */
export const OpenCashShiftSchema = z
  .object({
    terminalId: z.string().min(1, "El identificador de terminal es obligatorio"),
    userId: z.string().uuid("ID de usuario inválido").optional().nullable(),
    userName: z
      .string()
      .min(2, "El nombre del cajero debe tener al menos 2 caracteres")
      .max(100, "El nombre del cajero es demasiado largo")
      .optional()
      .nullable(),
    initialAmount: z
      .number({ invalid_type_error: "El fondo inicial debe ser un número" })
      .min(0, "El fondo inicial no puede ser negativo"),
    notes: z.string().max(250, "Las notas no pueden superar 250 caracteres").optional().nullable(),
  })
  .refine((data) => Boolean(data.userId || data.userName), {
    message: "Debe especificar el ID de usuario o el nombre del cajero responsable",
    path: ["userName"],
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
  receiptNumber: z.string().max(50, "El nro de comprobante no puede superar 50 caracteres").optional().nullable(),
  performedBy: z.string().min(1, "El nombre del responsable es obligatorio"),
});

/**
 * Esquema para Cierre y Arqueo Ciego de Turno de Caja (RF-11)
 * El cajero ingresa los montos reales contados físicamente y cupones de terminales.
 */
export const CloseCashShiftSchema = z.object({
  cashShiftId: z.string().uuid("ID de turno de caja inválido"),
  actualCash: z
    .number({ invalid_type_error: "El conteo de efectivo debe ser un número" })
    .min(0, "El conteo de efectivo no puede ser negativo"),
  actualDebit: z.number().min(0, "El monto de débito no puede ser negativo").optional().nullable(),
  actualCredit: z.number().min(0, "El monto de crédito no puede ser negativo").optional().nullable(),
  actualTransfer: z.number().min(0, "El monto de transferencia no puede ser negativo").optional().nullable(),
  actualQr: z.number().min(0, "El monto de QR no puede ser negativo").optional().nullable(),
  notes: z.string().max(500, "Las observaciones no pueden superar 500 caracteres").optional().nullable(),
});

/**
 * Esquema para Consulta y Filtro de Turnos
 */
export const ListCashShiftsSchema = z.object({
  terminalId: z.string().optional(),
  status: CashShiftStatusEnum.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type CashShiftStatus = z.infer<typeof CashShiftStatusEnum>;
export type CashMovementType = z.infer<typeof CashMovementTypeEnum>;
export type OpenCashShiftInput = z.infer<typeof OpenCashShiftSchema>;
export type CreateCashMovementInput = z.infer<typeof CreateCashMovementSchema>;
export type CloseCashShiftInput = z.infer<typeof CloseCashShiftSchema>;
export type ListCashShiftsInput = z.infer<typeof ListCashShiftsSchema>;
