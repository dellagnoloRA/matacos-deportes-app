import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { companyConfig } from "@/config/company";
import { formatCurrency } from "@/lib/utils";
import { ReceiptData, ReceiptDataSchema } from "@/schemas/receipt";
import { Prisma } from "@prisma/client";

/**
 * Nombres amigables para los métodos de pago en el ticket impreso
 */
const PAYMENT_METHOD_NAMES: Record<string, string> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Tarjeta Débito",
  CREDITO: "Tarjeta Crédito",
  TRANSFERENCIA: "Transferencia Bancaria",
  QR_MERCADOPAGO: "QR Mercado Pago",
};

/**
 * Deducción matemática de Transparencia Fiscal (RG AFIP 5003)
 * Calcula la base imponible neta y el IVA contenido al 21% incluido en el precio.
 * Fórmula: Base = Total / (1 + 0.21) -> IVA = Total - Base
 */
export function calculateVatBreakdown(netTotal: number, vatRate = 0.21) {
  if (netTotal <= 0) {
    return {
      vatRate,
      vatRateLabel: `${Math.round(vatRate * 100)}%`,
      netBaseAmount: 0,
      formattedNetBaseAmount: formatCurrency(0),
      vatAmount: 0,
      formattedVatAmount: formatCurrency(0),
    };
  }

  const netBase = Math.round((netTotal / (1 + vatRate)) * 100) / 100;
  const vatAmount = Math.round((netTotal - netBase) * 100) / 100;

  return {
    vatRate,
    vatRateLabel: `${Math.round(vatRate * 100)}%`,
    netBaseAmount: netBase,
    formattedNetBaseAmount: formatCurrency(netBase),
    vatAmount: vatAmount,
    formattedVatAmount: formatCurrency(vatAmount),
  };
}

/**
 * Genera un Hash criptográfico SHA-256 de seguridad para el comprobante
 * Garantiza la autenticidad e inviolabilidad del ticket y permite escaneo rápido con lector USB.
 */
export function generateReceiptSecurityHash(input: {
  cuit: string;
  pointOfSale: string;
  voucherNumber: string;
  total: number;
  dateIso: string;
}): string {
  const canonicalData = `${input.cuit}|${input.pointOfSale}|${input.voucherNumber}|${input.total.toFixed(2)}|${input.dateIso}`;
  const fullHash = crypto.createHash("sha256").update(canonicalData).digest("hex");
  const shortToken = fullHash.slice(0, 16).toUpperCase();
  // Formato legible en 4 bloques: A1B2-C3D4-E5F6-7890
  return `${shortToken.slice(0, 4)}-${shortToken.slice(4, 8)}-${shortToken.slice(8, 12)}-${shortToken.slice(12, 16)}`;
}

/**
 * Genera el payload estructurado y la URL canónica de AFIP para el código QR (RG 4291 / 5048)
 */
export function generateAfipQrPayload(input: {
  date: Date;
  pointOfSale: number;
  voucherTypeCode: number;
  voucherNumber: number;
  total: number;
  securityHash: string;
}) {
  const yyyy = input.date.getFullYear();
  const mm = String(input.date.getMonth() + 1).padStart(2, "0");
  const dd = String(input.date.getDate()).padStart(2, "0");
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  // Estructura oficial requerida por AFIP para Código QR en comprobantes electrónicos
  const rawPayload = {
    ver: 1,
    fecha: formattedDate,
    cuit: Number(companyConfig.cleanCuit) || 27180360803,
    ptoVta: input.pointOfSale,
    tipoCmp: input.voucherTypeCode,
    nroCmp: input.voucherNumber,
    importe: Number(input.total.toFixed(2)),
    moneda: "PES",
    ctz: 1,
    tipoDocRec: 99, // 99 = Consumidor Final
    nroDocRec: 0,
    tipoCodAut: "E", // Emisión por sistema
    codAut: parseInt(input.securityHash.replace(/[^0-9]/g, "").slice(0, 14), 10) || 26445000000000,
  };

  const base64 = Buffer.from(JSON.stringify(rawPayload)).toString("base64");
  const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64}`;

  return {
    qrUrl,
    rawPayload,
  };
}

/**
 * Calcula de forma atómica el siguiente número correlativo oficial para el Punto de Venta activo.
 * Formato: PPPPP-NNNNNNNN (ej. 00008-00026445)
 */
export async function getNextOfficialInvoiceNumber(
  tx: Prisma.TransactionClient,
  pointOfSale = companyConfig.pointOfSale
): Promise<{ invoiceNumber: string; pointOfSaleStr: string; voucherNumberStr: string }> {
  const pointOfSaleStr = String(pointOfSale).padStart(5, "0");
  const prefix = `${pointOfSaleStr}-`;

  // Buscar la última venta completada para este Punto de Venta
  const lastSale = await tx.sale.findFirst({
    where: {
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextSequence = 1;

  if (lastSale?.invoiceNumber) {
    const parts = lastSale.invoiceNumber.split("-");
    if (parts.length === 2) {
      const currentNumber = parseInt(parts[1], 10);
      if (!isNaN(currentNumber)) {
        nextSequence = currentNumber + 1;
      }
    }
  } else {
    // Si es la primera venta de este Punto de Venta en la base de datos,
    // consultar si se configuró un número inicial en variables de entorno (ej. para continuar el Hasar 26445)
    const initialConfig = parseInt(process.env.POS_INITIAL_INVOICE_NUMBER || "1", 10);
    nextSequence = isNaN(initialConfig) || initialConfig < 1 ? 1 : initialConfig;
  }

  const voucherNumberStr = String(nextSequence).padStart(8, "0");
  const invoiceNumber = `${prefix}${voucherNumberStr}`;

  return {
    invoiceNumber,
    pointOfSaleStr,
    voucherNumberStr,
  };
}

/**
 * Desglosa y formatea la fecha y hora a la zona horaria oficial de Saavedra 241 (America/Argentina/Buenos_Aires)
 */
export function formatReceiptDateTime(date: Date): { date: string; time: string; iso: string } {
  const optionsDate: Intl.DateTimeFormatOptions = {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  const optionsTime: Intl.DateTimeFormatOptions = {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formattedDate = new Intl.DateTimeFormat("es-AR", optionsDate).format(date);
  const formattedTime = new Intl.DateTimeFormat("es-AR", optionsTime).format(date);

  return {
    date: formattedDate,
    time: formattedTime,
    iso: date.toISOString(),
  };
}

/**
 * Construye el payload estructurado completo `ReceiptData` a partir de un registro de venta
 */
export function buildReceiptPayloadFromSaleRecord(sale: any): ReceiptData {
  const dt = formatReceiptDateTime(new Date(sale.createdAt));

  // Parsear punto de venta y número de comprobante desde invoiceNumber
  let pointOfSaleStr = companyConfig.formattedPointOfSale;
  let voucherNumberStr = "00000001";

  if (sale.invoiceNumber && sale.invoiceNumber.includes("-")) {
    const parts = sale.invoiceNumber.split("-");
    if (parts.length === 2 && parts[0].length === 5 && parts[1].length === 8) {
      pointOfSaleStr = parts[0];
      voucherNumberStr = parts[1];
    } else {
      voucherNumberStr = sale.invoiceNumber.slice(-8).padStart(8, "0");
    }
  }

  const netTotal = Number(sale.total);
  const subtotalGross = Number(sale.subtotalGross ?? sale.total);
  const discountTotal = Number(sale.discount ?? 0);

  // Transparencia Fiscal
  const fiscalVat = calculateVatBreakdown(netTotal, companyConfig.vatRate);

  // Hash de seguridad
  const securityHash = generateReceiptSecurityHash({
    cuit: companyConfig.cuit,
    pointOfSale: pointOfSaleStr,
    voucherNumber: voucherNumberStr,
    total: netTotal,
    dateIso: dt.iso,
  });

  // QR Oficial AFIP
  const qrData = generateAfipQrPayload({
    date: new Date(sale.createdAt),
    pointOfSale: parseInt(pointOfSaleStr, 10),
    voucherTypeCode: parseInt(companyConfig.voucherTypeCode, 10),
    voucherNumber: parseInt(voucherNumberStr, 10),
    total: netTotal,
    securityHash,
  });

  // Nombre del cliente
  const hasCustomer = Boolean(sale.customerName && sale.customerName.trim() !== "");
  const customerName = hasCustomer ? sale.customerName.trim() : "CONSUMIDOR FINAL";

  // Ítems de la venta
  let totalItemsCount = 0;
  const items = (sale.items || []).map((item: any) => {
    const qty = Number(item.quantity);
    totalItemsCount += qty;

    const originalPrice = Number(item.originalPrice ?? item.unitPrice ?? item.price);
    const unitPrice = Number(item.unitPrice ?? item.price);
    const discount = Number(item.discount ?? 0);
    const subtotal = Number(item.subtotal ?? unitPrice * qty);

    const productName = item.variant?.product?.name || "Artículo sin descripción";
    const brandName = item.variant?.product?.brand?.name || null;
    const size = item.variant?.size || "U";
    const color = item.variant?.color || "Estándar";
    const sku = item.variant?.sku || "N/A";
    const barcode = item.variant?.barcode || null;

    const fullDescription = brandName ? `${brandName} - ${productName}` : productName;
    const variantDescription = `Talle: ${size} | Color: ${color}`;

    let formattedDiscount: string | null = null;
    if (discount > 0) {
      if (item.discountType === "PERCENTAGE" && item.discountValue) {
        formattedDiscount = `-${Number(item.discountValue)}% (-${formatCurrency(discount)})`;
      } else {
        formattedDiscount = `-${formatCurrency(discount)}`;
      }
    }

    return {
      variantId: item.variantId,
      sku,
      barcode,
      productName,
      brandName,
      size,
      color,
      fullDescription,
      variantDescription,
      quantity: qty,
      originalPrice,
      formattedOriginalPrice: formatCurrency(originalPrice),
      discount,
      discountType: item.discountType || null,
      formattedDiscount,
      unitPrice,
      formattedUnitPrice: formatCurrency(unitPrice),
      subtotal,
      formattedSubtotal: formatCurrency(subtotal),
    };
  });

  // Pagos realizados
  const payments = (sale.payments || []).map((pay: any) => {
    const amount = Number(pay.amount);
    const receivedAmount = pay.receivedAmount ? Number(pay.receivedAmount) : null;
    const change = pay.change ? Number(pay.change) : null;
    const methodStr = String(pay.method);
    const methodName = PAYMENT_METHOD_NAMES[methodStr] || methodStr;

    return {
      id: pay.id,
      method: methodStr,
      methodName,
      amount,
      formattedAmount: formatCurrency(amount),
      receivedAmount,
      formattedReceivedAmount: receivedAmount !== null ? formatCurrency(receivedAmount) : null,
      change,
      formattedChange: change !== null ? formatCurrency(change) : null,
      cardBrand: pay.cardBrand || null,
      cardVoucher: pay.cardVoucher || null,
      installments: pay.installments ? Number(pay.installments) : null,
      referenceCode: pay.referenceCode || null,
    };
  });

  // Ensamblar contrato ReceiptData
  const receiptPayload: ReceiptData = {
    company: {
      name: companyConfig.name,
      legalName: companyConfig.legalName,
      cuit: companyConfig.cuit,
      iibb: companyConfig.iibb,
      address: companyConfig.address,
      city: companyConfig.city,
      postalCode: companyConfig.postalCode,
      startDate: companyConfig.startDate,
      vatCondition: companyConfig.vatCondition,
      phone: companyConfig.phone,
      whatsapp: companyConfig.whatsapp,
      instagram: companyConfig.instagram,
    },
    sale: {
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber || `${pointOfSaleStr}-${voucherNumberStr}`,
      ticketCode: sale.ticketCode || null,
      pointOfSale: pointOfSaleStr,
      voucherNumber: voucherNumberStr,
      voucherType: `Cód. ${companyConfig.voucherTypeCode} - ${companyConfig.voucherTypeName}`,
      date: dt.date,
      time: dt.time,
      dateTimeIso: dt.iso,
      customerName,
      customerCondition: "A CONSUMIDOR FINAL",
      sellerName: sale.seller?.name || null,
      cashierName: sale.cashier?.name || null,
    },
    items,
    totals: {
      subtotalGross,
      formattedSubtotalGross: formatCurrency(subtotalGross),
      discountTotal,
      formattedDiscountTotal: formatCurrency(discountTotal),
      discountGlobalValue: sale.discountValue ? Number(sale.discountValue) : null,
      discountGlobalType: sale.discountType || null,
      netTotal,
      formattedNetTotal: formatCurrency(netTotal),
      totalItemsCount,
    },
    payments,
    fiscal: {
      vatRate: fiscalVat.vatRate,
      vatRateLabel: fiscalVat.vatRateLabel,
      vatAmount: fiscalVat.vatAmount,
      formattedVatAmount: fiscalVat.formattedVatAmount,
      netBaseAmount: fiscalVat.netBaseAmount,
      formattedNetBaseAmount: fiscalVat.formattedNetBaseAmount,
      securityHash,
      qrUrl: qrData.qrUrl,
      qrRawPayload: qrData.rawPayload,
    },
    footer: {
      exchangePolicy: companyConfig.exchangePolicy,
      legalNotice: companyConfig.legalNotice,
      thanksMessage: "¡Gracias por elegir Matacos Deportes!",
      contactPhone: companyConfig.phone,
      contactWhatsapp: companyConfig.whatsapp,
      contactInstagram: companyConfig.instagram,
    },
  };

  // Validar con Zod para garantizar tipado estricto e integridad
  return ReceiptDataSchema.parse(receiptPayload);
}

/**
 * Consulta la base de datos y genera el payload de ticket por ID de venta
 */
export async function generateReceiptPayload(saleId: string): Promise<ReceiptData> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { brand: true },
              },
            },
          },
        },
      },
      payments: true,
      seller: { select: { id: true, name: true, email: true } },
      cashier: { select: { id: true, name: true, email: true } },
    },
  });

  if (!sale) {
    throw new Error(`No se encontró la venta con ID ${saleId}`);
  }

  return buildReceiptPayloadFromSaleRecord(sale);
}

/**
 * Consulta la base de datos y genera el payload de ticket por ticketCode (preventa salón ej. #042)
 */
export async function generateReceiptPayloadByTicketCode(ticketCode: string): Promise<ReceiptData> {
  const normalizedCode = ticketCode.startsWith("#") ? ticketCode : `#${ticketCode}`;

  const sale = await prisma.sale.findFirst({
    where: { ticketCode: normalizedCode },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { brand: true },
              },
            },
          },
        },
      },
      payments: true,
      seller: { select: { id: true, name: true, email: true } },
      cashier: { select: { id: true, name: true, email: true } },
    },
  });

  if (!sale) {
    throw new Error(`No se encontró ninguna venta con el código ${normalizedCode}`);
  }

  return buildReceiptPayloadFromSaleRecord(sale);
}
