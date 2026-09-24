/**
 * Tipos e interfaces estandarizadas para Tickets y Comprobantes Térmicos (RF-10)
 * Diseñado para comanderas térmicas de 80mm (40/48 cols) y 58mm (32 cols).
 * Compatible con la normativa fiscal argentina (ARCA/AFIP) y el formato físico de Matacos Deportes.
 */

export * from "@/schemas/receipt";

export interface PlainTextReceiptOptions {
  cols?: 40 | 32 | 48;
  includeQrAscii?: boolean;
  includePolicies?: boolean;
}
