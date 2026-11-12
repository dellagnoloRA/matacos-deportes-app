import { z } from "zod";
import { StrictEmailSchema, StrictPhoneSchema } from "./settings";

/**
 * Esquema Zod de Consentimiento Legal Obligatorio (Ley 25.326 y CCCN)
 */
export const LegalConsentSchema = z.object({
  acceptedTerms: z.literal(true, {
    errorMap: () => ({
      message: "Debés aceptar los Términos y Condiciones para continuar.",
    }),
  }),
  acceptedPrivacy: z.literal(true, {
    errorMap: () => ({
      message: "Debés aceptar las Políticas de Privacidad para continuar.",
    }),
  }),
  termsVersion: z.string().trim().default("v1.0"),
  privacyVersion: z.string().trim().default("v1.0"),
});

export type LegalConsentInput = z.infer<typeof LegalConsentSchema>;

/**
 * Esquema de Solicitud de Revocación / Botón de Arrepentimiento (Res. 271/2020 SCI)
 */
export const RevocationRequestSchema = z.object({
  orderCode: z
    .string()
    .trim()
    .min(3, "El código de pedido o tique es obligatorio")
    .max(60, "El código no puede superar los 60 caracteres"),
  customerEmail: StrictEmailSchema,
  customerPhone: StrictPhoneSchema.optional().nullable().or(z.literal("")),
  reason: z
    .string()
    .trim()
    .max(1000, "El motivo no puede superar los 1000 caracteres")
    .optional()
    .nullable(),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({
      message: "Debés aceptar los Términos y Condiciones del trámite de arrepentimiento.",
    }),
  }),
  acceptedPrivacy: z.literal(true, {
    errorMap: () => ({
      message: "Debés aceptar las Políticas de Privacidad para procesar la solicitud.",
    }),
  }),
});

export type RevocationRequestInput = z.infer<typeof RevocationRequestSchema>;

/**
 * Tipos de formularios sujetos a auditoría de consentimiento
 */
export type FormConsentType =
  | "GUEST_CHECKOUT"
  | "CUSTOMER_REGISTER"
  | "REVOCATION_REQUEST"
  | "TRANSFER_PROOF";
