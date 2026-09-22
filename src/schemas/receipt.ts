import { z } from "zod";

/**
 * Esquema de datos para la cabecera comercial y fiscal del emisor
 */
export const ReceiptCompanySchema = z.object({
  name: z.string(),
  legalName: z.string(),
  cuit: z.string(),
  iibb: z.string(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  startDate: z.string(),
  vatCondition: z.string(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
});

/**
 * Esquema de datos para el encabezado y metadatos del comprobante
 */
export const ReceiptSaleHeaderSchema = z.object({
  saleId: z.string().uuid(),
  invoiceNumber: z.string(), // "00008-00026445"
  ticketCode: z.string().nullable().optional(), // "#042"
  pointOfSale: z.string(), // "00008"
  voucherNumber: z.string(), // "00026445"
  voucherType: z.string(), // "Cód. 083 - TIQUE"
  date: z.string(), // "22/09/2026"
  time: z.string(), // "10:34:01"
  dateTimeIso: z.string(),
  customerName: z.string(), // "CONSUMIDOR FINAL" o nombre específico
  customerCondition: z.string(), // "A CONSUMIDOR FINAL"
  sellerName: z.string().nullable().optional(), // "Nahir Fornari"
  cashierName: z.string().nullable().optional(), // "Agustín Dellagnolo"
});

/**
 * Esquema para cada ítem/renglón del comprobante con detalle de variante deportiva
 */
export const ReceiptItemSchema = z.object({
  variantId: z.string(),
  sku: z.string(),
  barcode: z.string().nullable().optional(),
  productName: z.string(),
  brandName: z.string().nullable().optional(),
  size: z.string(),
  color: z.string(),
  fullDescription: z.string(), // "ADIDAS - Remera Essentials"
  variantDescription: z.string(), // "Talle: M | Color: Negro"
  quantity: z.number().int().positive(),
  originalPrice: z.number().min(0),
  formattedOriginalPrice: z.string(),
  discount: z.number().min(0),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).nullable().optional(),
  formattedDiscount: z.string().nullable().optional(),
  unitPrice: z.number().min(0),
  formattedUnitPrice: z.string(),
  subtotal: z.number().min(0),
  formattedSubtotal: z.string(),
});

/**
 * Esquema para los totales y descuentos consolidados
 */
export const ReceiptTotalsSchema = z.object({
  subtotalGross: z.number().min(0),
  formattedSubtotalGross: z.string(),
  discountTotal: z.number().min(0),
  formattedDiscountTotal: z.string(),
  discountGlobalValue: z.number().min(0).nullable().optional(),
  discountGlobalType: z.enum(["PERCENTAGE", "FIXED"]).nullable().optional(),
  netTotal: z.number().min(0),
  formattedNetTotal: z.string(),
  totalItemsCount: z.number().int().min(0),
});

/**
 * Esquema para cada medio de pago imputado a la venta
 */
export const ReceiptPaymentSchema = z.object({
  id: z.string(),
  method: z.string(),
  methodName: z.string(), // "Efectivo", "Tarjeta Débito", etc.
  amount: z.number().min(0),
  formattedAmount: z.string(),
  receivedAmount: z.number().min(0).nullable().optional(),
  formattedReceivedAmount: z.string().nullable().optional(),
  change: z.number().min(0).nullable().optional(),
  formattedChange: z.string().nullable().optional(),
  cardBrand: z.string().nullable().optional(),
  cardVoucher: z.string().nullable().optional(),
  installments: z.number().int().nullable().optional(),
  referenceCode: z.string().nullable().optional(),
});

/**
 * Esquema de datos fiscales (Transparencia Fiscal, QR AFIP y Hash de integridad)
 */
export const ReceiptFiscalSchema = z.object({
  vatRate: z.number(), // 0.21
  vatRateLabel: z.string(), // "21%"
  vatAmount: z.number().min(0),
  formattedVatAmount: z.string(),
  netBaseAmount: z.number().min(0),
  formattedNetBaseAmount: z.string(),
  securityHash: z.string(), // Hash SHA-256 corto para antifraude
  qrUrl: z.string(), // URL estándar AFIP con JSON en Base64
  qrRawPayload: z.record(z.unknown()), // Datos puros para impresoras ESC/POS
});

/**
 * Esquema para el pie de página con políticas de cambio y canales oficiales
 */
export const ReceiptFooterSchema = z.object({
  exchangePolicy: z.string(),
  legalNotice: z.string(),
  thanksMessage: z.string(),
  contactPhone: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  contactInstagram: z.string().optional(),
});

/**
 * Esquema integral del ticket estructurado
 */
export const ReceiptDataSchema = z.object({
  company: ReceiptCompanySchema,
  sale: ReceiptSaleHeaderSchema,
  items: z.array(ReceiptItemSchema),
  totals: ReceiptTotalsSchema,
  payments: z.array(ReceiptPaymentSchema),
  fiscal: ReceiptFiscalSchema,
  footer: ReceiptFooterSchema,
});

export type ReceiptCompany = z.infer<typeof ReceiptCompanySchema>;
export type ReceiptSaleHeader = z.infer<typeof ReceiptSaleHeaderSchema>;
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
export type ReceiptTotals = z.infer<typeof ReceiptTotalsSchema>;
export type ReceiptPayment = z.infer<typeof ReceiptPaymentSchema>;
export type ReceiptFiscal = z.infer<typeof ReceiptFiscalSchema>;
export type ReceiptFooter = z.infer<typeof ReceiptFooterSchema>;
export type ReceiptData = z.infer<typeof ReceiptDataSchema>;
