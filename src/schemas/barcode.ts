import { z } from "zod";
import { validateEan13 } from "@/lib/barcodeGenerator";

/**
 * Esquema para solicitar la generación de un lote de códigos de barra internos EAN-13
 */
export const GenerateBarcodesSchema = z.object({
  count: z
    .number({ invalid_type_error: "La cantidad debe ser un número" })
    .int("Debe ser un número entero")
    .min(1, "Debe generar al menos 1 código")
    .max(1000, "El límite máximo por lote es de 1000 códigos")
    .default(1),
  prefix: z
    .string()
    .regex(/^\d{3}$/, "El prefijo interno debe ser de exactamente 3 dígitos numéricos (ej: 200)")
    .default("200"),
});

/**
 * Esquema para asignar un código de barras a una variante de producto existente
 */
export const AssignBarcodeToVariantSchema = z.object({
  variantId: z.string().uuid("ID de variante de producto inválido"),
  customBarcode: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[A-Za-z0-9\-_.]{6,20}$/.test(val) || validateEan13(val),
      "El código de barras provisto debe ser un EAN-13 válido con dígito verificador o un código alfanumérico válido (Code-128)"
    )
    .optional(),
});

/**
 * Esquema para solicitar etiquetas para impresión térmica de mostrador
 */
export const PrintLabelsPayloadSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid("ID de variante inválido"),
        copies: z
          .number({ invalid_type_error: "La cantidad de copias debe ser un número" })
          .int()
          .min(1, "Debe solicitar al menos 1 copia")
          .max(100, "Máximo 100 copias por variante")
          .default(1),
      })
    )
    .min(1, "Debe seleccionar al menos una variante para imprimir etiquetas"),
});

export type GenerateBarcodesInput = z.infer<typeof GenerateBarcodesSchema>;
export type AssignBarcodeToVariantInput = z.infer<typeof AssignBarcodeToVariantSchema>;
export type PrintLabelsPayloadInput = z.infer<typeof PrintLabelsPayloadSchema>;

/**
 * Respuesta estructurada con los datos listos para el renderer de impresión térmica
 */
export interface PrintableLabelItem {
  variantId: string;
  productId: string;
  productName: string;
  brand: string;
  discipline: string;
  category: string;
  size: string;
  color: string;
  sku: string;
  barcode: string;
  priceFormatted: string;
  priceNumeric: number;
  copies: number;
}

export interface PrintLabelsResult {
  success: boolean;
  message: string;
  error?: string;
  totalLabelsToPrint: number;
  labels: PrintableLabelItem[];
}
