import { z } from "zod";

/**
 * Expresión regular formal estricta para correos electrónicos válidos con TLD (.com, .com.ar, etc.)
 */
export const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const StrictEmailSchema = z
  .string()
  .trim()
  .min(5, "El correo electrónico es obligatorio")
  .max(120, "El correo electrónico no puede superar los 120 caracteres")
  .regex(
    STRICT_EMAIL_REGEX,
    "Debe ingresar un formato de correo electrónico válido (ej: usuario@dominio.com)"
  );

/**
 * Validación estricta para números telefónicos y WhatsApp (Argentina / Internacional)
 * Exige entre 10 y 13 dígitos numéricos netos (código de área + abonado sin '15' o con '549').
 */
export const StrictPhoneSchema = z
  .string()
  .trim()
  .min(8, "El teléfono de contacto debe tener al menos 8 caracteres")
  .max(30, "El teléfono ingresado es demasiado extenso")
  .refine(
    (val) => {
      const digits = val.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 13;
    },
    {
      message:
        "El teléfono debe contener entre 10 y 13 dígitos numéricos (ej: 3704123456 o 5493704123456)",
    }
  );

/**
 * Validación estricta de DNI / CUIT argentino (7 a 11 dígitos reales)
 */
export const StrictDniSchema = z
  .string()
  .trim()
  .min(7, "El documento o CUIT debe tener al menos 7 caracteres")
  .max(15, "El documento o CUIT es demasiado extenso")
  .refine(
    (val) => {
      const digits = val.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 11;
    },
    {
      message: "El DNI o CUIT debe contener entre 7 y 11 dígitos numéricos válidos",
    }
  );

/**
 * Esquema Zod para Configuración de la Tienda y Canales de Contacto
 */
export const StoreSettingSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(3, "El nombre del comercio debe tener al menos 3 caracteres")
    .max(80, "El nombre del comercio es demasiado extenso"),
  whatsappNumber: StrictPhoneSchema,
  contactPhone: z
    .string()
    .trim()
    .min(6, "El teléfono fijo o de mostrador debe tener al menos 6 caracteres")
    .max(30, "El teléfono fijo es demasiado extenso"),
  contactEmail: StrictEmailSchema,
  notificationsEmail: StrictEmailSchema.optional().nullable().or(z.literal("")),
  storeAddress: z
    .string()
    .trim()
    .min(3, "La dirección física debe tener al menos 3 caracteres")
    .max(120, "La dirección física es demasiado extensa"),
  storeCity: z
    .string()
    .trim()
    .min(3, "La localidad debe tener al menos 3 caracteres")
    .max(80, "La localidad es demasiado extensa"),
  storePostalCode: z
    .string()
    .trim()
    .min(3, "El código postal es obligatorio")
    .max(15, "El código postal es demasiado extenso"),
  businessHours: z
    .string()
    .trim()
    .min(5, "Los horarios de atención son obligatorios")
    .max(150, "Los horarios son demasiado extensos"),
  instagramHandle: z
    .string()
    .trim()
    .max(50, "El usuario de Instagram es demasiado extenso")
    .optional()
    .nullable()
    .or(z.literal("")),
  cadeteriaCost: z
    .coerce
    .number({ invalid_type_error: "La tarifa de cadetería debe ser un número" })
    .min(0, "La tarifa no puede ser negativa")
    .default(2500),
});

export type StoreSettingInput = z.infer<typeof StoreSettingSchema>;
