import { z } from "zod";

/**
 * Esquemas de validación Zod para el Portal de Clientes, Favoritos y Seguimiento (RF-29)
 */

export const CustomerRegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre completo debe tener al menos 3 caracteres")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Debe proporcionar un correo electrónico válido"),
  password: z
    .string()
    .min(6, "La contraseña debe contener al menos 6 caracteres")
    .max(100, "La contraseña es demasiado extensa"),
  phone: z
    .string()
    .trim()
    .min(6, "El teléfono de contacto debe tener al menos 6 caracteres")
    .max(40, "El teléfono es demasiado extenso")
    .optional()
    .nullable()
    .or(z.literal("")),
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,9}$/, "El DNI debe contener entre 7 y 9 dígitos numéricos")
    .optional()
    .nullable()
    .or(z.literal("")),
  defaultAddress: z
    .string()
    .trim()
    .max(200, "La dirección no puede superar los 200 caracteres")
    .optional()
    .nullable()
    .or(z.literal("")),
  defaultCity: z.string().trim().default("Formosa"),
  defaultPostalCode: z.string().trim().default("3600"),
  guestFavorites: z.array(z.string().min(1)).optional().default([]),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({
      message: "Debés aceptar los Términos y Condiciones para registrar tu cuenta",
    }),
  }),
  acceptedPrivacy: z.literal(true, {
    errorMap: () => ({
      message: "Debés aceptar las Políticas de Privacidad para registrar tu cuenta",
    }),
  }),
});

export type CustomerRegisterInput = z.input<typeof CustomerRegisterSchema>;

export const CustomerLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Debe proporcionar un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es requerida"),
  guestFavorites: z.array(z.string().min(1)).optional().default([]),
});

export type CustomerLoginInput = z.input<typeof CustomerLoginSchema>;

export const CustomerProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre completo debe tener al menos 3 caracteres")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  phone: z
    .string()
    .trim()
    .max(40, "El teléfono es demasiado extenso")
    .optional()
    .nullable()
    .or(z.literal("")),
  dni: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^\d{7,9}$/.test(val),
      "El DNI debe contener entre 7 y 9 dígitos numéricos"
    )
    .optional()
    .nullable(),
  defaultAddress: z
    .string()
    .trim()
    .max(200, "La dirección no puede superar los 200 caracteres")
    .optional()
    .nullable()
    .or(z.literal("")),
  defaultCity: z
    .string()
    .trim()
    .min(2, "La localidad es requerida")
    .default("Formosa"),
  defaultPostalCode: z
    .string()
    .trim()
    .min(3, "El código postal es requerido")
    .default("3600"),
});

export type CustomerProfileUpdateInput = z.input<
  typeof CustomerProfileUpdateSchema
>;

export const ToggleFavoriteSchema = z.object({
  productId: z.string().trim().min(1, "El ID del producto es requerido"),
});

export const SyncGuestFavoritesSchema = z.object({
  productIds: z.array(z.string().trim().min(1)).max(100),
});

export const PublicOrderTrackSchema = z.object({
  orderCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Ingresá un código de pedido válido (ej. WEB-2026-0001)"),
  verification: z
    .string()
    .trim()
    .min(4, "Ingresá el correo electrónico o DNI utilizado en la compra"),
});

export type PublicOrderTrackInput = z.input<typeof PublicOrderTrackSchema>;

export const ShippingStatusEnumSchema = z.enum([
  "PENDIENTE",
  "EN_PREPARACION",
  "LISTO_RETIRO",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
]);

export type ShippingStatusType = z.infer<typeof ShippingStatusEnumSchema>;

export const UpdateOrderShippingStatusSchema = z.object({
  saleId: z.string().trim().min(1, "ID de orden requerido"),
  shippingStatus: ShippingStatusEnumSchema,
  shippingTrackingCode: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type UpdateOrderShippingStatusInput = z.input<
  typeof UpdateOrderShippingStatusSchema
>;
