import { z } from "zod";

export const WebOrdersFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  paymentStatus: z
    .enum(["TODAS", "PENDIENTE_PAGO", "COMPLETADA", "CANCELADA"])
    .default("TODAS"),
  shippingStatus: z
    .enum([
      "TODAS",
      "PENDIENTE",
      "EN_PREPARACION",
      "LISTO_RETIRO",
      "EN_CAMINO",
      "ENTREGADO",
      "CANCELADO",
    ])
    .default("TODAS"),
  shippingMethod: z
    .enum(["TODOS", "RETIRO_LOCAL", "CADETERIA_FORMOSA", "CORREO_ARGENTINO"])
    .default("TODOS"),
});

export type WebOrdersFilterInput = z.infer<typeof WebOrdersFilterSchema>;

export const UpdateWebOrderShippingSchema = z.object({
  orderId: z.string().trim().min(1, "El ID de la orden es requerido"),
  shippingStatus: z.enum([
    "PENDIENTE",
    "EN_PREPARACION",
    "LISTO_RETIRO",
    "EN_CAMINO",
    "ENTREGADO",
    "CANCELADO",
  ]),
  shippingTrackingCode: z
    .string()
    .trim()
    .max(100, "El código de seguimiento no puede exceder 100 caracteres")
    .optional()
    .nullable()
    .or(z.literal("")),
  notifyCustomer: z.boolean().default(true),
  notes: z.string().trim().max(500).optional().nullable().or(z.literal("")),
});

export type UpdateWebOrderShippingInput = z.infer<typeof UpdateWebOrderShippingSchema>;
