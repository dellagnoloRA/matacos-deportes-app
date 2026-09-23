import crypto from "crypto";
import QRCode from "qrcode";
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
      cashierCode: sale.cashier?.code || companyConfig.defaultCashierCode || "CAJERO01",
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
      fiscalSerialNumber: companyConfig.fiscalSerialNumber || "SESHRA000022252",
      softwareVersion: companyConfig.softwareVersion || "V: 1.02",
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
 * Genera el payload de demostración idéntico a la fotografía real de Saavedra 241
 */
export function getSampleReceiptData(): ReceiptData {
  const photoSaleMock = {
    id: "d0728c46-7c98-4e5a-8b1e-61e56b3e8e19",
    invoiceNumber: "00008-00026445",
    ticketCode: "#042",
    createdAt: new Date("2026-09-22T13:34:01.000Z"),
    customerName: null,
    subtotalGross: 4800.0,
    discount: 0.0,
    total: 4800.0,
    seller: { id: "seller-1", name: "Nahir Fornari", email: "nahir@matacos.com" },
    cashier: { id: "cashier-1", name: "Agustín Dellagnolo", email: "agustin@matacos.com", code: "CAJERO01" },
    items: [
      {
        variantId: "acc-1",
        quantity: 1,
        originalPrice: 4800.0,
        discount: 0.0,
        unitPrice: 4800.0,
        subtotal: 4800.0,
        variant: {
          sku: "CAN-DRB-01",
          barcode: "7791234567890",
          size: "M",
          color: "Negro",
          product: { name: "CANILLERAS DEPORTIVAS PRO", brand: { name: "DRB" } },
        },
      },
    ],
    payments: [
      {
        id: "pay-1",
        method: "EFECTIVO",
        amount: 4800.0,
        receivedAmount: 4800.0,
        change: 0.0,
      },
    ],
  };

  return buildReceiptPayloadFromSaleRecord(photoSaleMock);
}

/**
 * Consulta la base de datos y genera el payload de ticket por ID de venta
 */
export async function generateReceiptPayload(saleId: string): Promise<ReceiptData> {
  // Soporte para previsualización e impresión directa de ticket de muestra (foto Saavedra 241)
  if (saleId === "sample" || saleId === "demo" || saleId === "foto") {
    const sample = getSampleReceiptData();
    try {
      sample.fiscal.qrDataUrl = await QRCode.toDataURL(sample.fiscal.qrUrl, {
        margin: 1,
        width: 250,
      });
    } catch {
      // Ignorar
    }
    return sample;
  }

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

  const receipt = buildReceiptPayloadFromSaleRecord(sale);
  try {
    receipt.fiscal.qrDataUrl = await QRCode.toDataURL(receipt.fiscal.qrUrl, {
      margin: 1,
      width: 250,
    });
  } catch {
    // Generación silenciosa opcional
  }

  return receipt;
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

  const receipt = buildReceiptPayloadFromSaleRecord(sale);
  try {
    receipt.fiscal.qrDataUrl = await QRCode.toDataURL(receipt.fiscal.qrUrl, {
      margin: 1,
      width: 250,
    });
  } catch {
    // Generación silenciosa opcional
  }

  return receipt;
}

/**
 * Formatea importes numéricos al estilo térmico de comanderas fiscales ($4800,00)
 * Sin espacio entre el signo pesos y el importe, con dos decimales separados por coma.
 */
export function formatThermalPrice(amount: number): string {
  const fixed = Number(amount || 0).toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  return `$${intPart},${decPart}`;
}

function padCenter(text: string, width: number): string {
  if (text.length >= width) return text;
  const leftPad = Math.floor((width - text.length) / 2);
  return " ".repeat(leftPad) + text;
}

function padLeftRight(left: string, right: string, width: number): string {
  const minSpace = 1;
  if (left.length + right.length + minSpace > width) {
    const available = width - right.length - minSpace;
    if (available > 6) {
      return left.slice(0, available) + " ".repeat(minSpace) + right;
    }
    return `${left}\n${" ".repeat(Math.max(0, width - right.length))}${right}`;
  }
  const spaces = width - left.length - right.length;
  return left + " ".repeat(spaces) + right;
}

export interface FormatTicketOptions {
  includePolicies?: boolean;
  qrAscii?: string;
}

/**
 * Convierte un comprobante estructurado ReceiptData a texto plano para impresión térmica directa (ESC/POS)
 * o previsualización monocromática en consola / mostrador (40 columnas estándar de Saavedra 241).
 */
export function formatTicketToPlainText(
  receipt: ReceiptData,
  cols: 40 | 32 | 48 = 40,
  options?: FormatTicketOptions
): string {
  const width = cols;
  const lines: string[] = [];

  // 1. Cabecera Comercial Centrada con Letras Espaciadas
  lines.push(padCenter("M A T A C O S", width));
  lines.push(padCenter("D E P O R T E S", width));

  // 2. Información Fiscal y Comercial del Emisor (Alineada a la izquierda)
  lines.push(receipt.company.legalName);
  lines.push(`CUIT Nro.: ${receipt.company.cuit}`);
  lines.push(`Ing. Brutos ${receipt.company.iibb}`);
  lines.push(`Dirección: ${receipt.company.address}`);
  lines.push(receipt.company.city);
  lines.push(`C.P.${receipt.company.postalCode}`);
  lines.push(`Inicio de Actividades: ${receipt.company.startDate}`);
  lines.push(receipt.company.vatCondition);
  lines.push(receipt.sale.customerCondition || "A CONSUMIDOR FINAL");

  if (receipt.sale.customerName && receipt.sale.customerName !== "CONSUMIDOR FINAL") {
    lines.push(`Cliente: ${receipt.sale.customerName}`);
  }

  // 3. Espacio separador
  lines.push("");

  // 4. Identificación del Comprobante
  lines.push(padCenter(receipt.sale.voucherType, width));
  lines.push(
    padCenter(`P.V. Nro. ${receipt.sale.pointOfSale} - Nro. T. ${receipt.sale.voucherNumber}`, width)
  );
  lines.push(
    padLeftRight(`Fecha ${receipt.sale.date}`, `Hora ${receipt.sale.time}`, width)
  );

  // 5. Espacio separador
  lines.push("");

  // 6. Renglones / Ítems de la Venta
  for (const item of receipt.items) {
    const itemDesc = item.productName || item.fullDescription || "ARTÍCULO";
    const subtotalFormatted = formatThermalPrice(item.subtotal);

    if (item.quantity > 1) {
      lines.push(`  ${item.quantity} x ${formatThermalPrice(item.unitPrice)}`);
    }

    lines.push(padLeftRight(itemDesc.toUpperCase(), subtotalFormatted, width));

    if (item.size && item.size !== "U") {
      const colorPart = item.color && item.color !== "Único" && item.color !== "Estándar" ? ` / ${item.color}` : "";
      lines.push(`  (Talle: ${item.size}${colorPart})`);
    }

    if (item.discount > 0) {
      lines.push(`  (Bonif.: -${formatThermalPrice(item.discount)})`);
    }
  }

  // 7. Espacio separador
  lines.push("");

  // 8. Total en Letra Grande / Negrita
  lines.push(padLeftRight("TOTAL", formatThermalPrice(receipt.totals.netTotal), width));

  // 9. Espacio separador
  lines.push("");

  // 10. Bloque de Pagos Recibidos
  lines.push("RECIBI(MOS)");
  for (const payment of receipt.payments) {
    lines.push(
      padLeftRight(payment.methodName.toUpperCase(), formatThermalPrice(payment.amount), width)
    );
    if (payment.receivedAmount != null && payment.change != null && payment.change > 0) {
      lines.push(padLeftRight("  SU PAGO:", formatThermalPrice(payment.receivedAmount), width));
      lines.push(padLeftRight("  SU VUELTO:", formatThermalPrice(payment.change), width));
    }
  }

  // 11. Espacio separador
  lines.push("");

  // 12. Transparencia Fiscal (RG AFIP 5003 / Ley 27.743)
  lines.push(padCenter("TRANSPARENCIA FISCAL", width));
  lines.push(padLeftRight("IVA contenido:", formatThermalPrice(receipt.fiscal.vatAmount), width));
  lines.push(padLeftRight("", receipt.sale.cashierCode || "CAJERO01", width));

  // 13. Espacio separador
  lines.push("");

  // 14. Código QR
  if (options?.qrAscii) {
    const qrLines = options.qrAscii.split("\n");
    for (const ql of qrLines) {
      if (ql.trim()) {
        lines.push(padCenter(ql, width));
      }
    }
  } else {
    lines.push(padCenter("┌──────────────────────────┐", width));
    lines.push(padCenter("│      [ CÓDIGO QR ]       │", width));
    lines.push(padCenter("│   Escanee para validar   │", width));
    lines.push(padCenter("│     comprobante AFIP     │", width));
    lines.push(padCenter("└──────────────────────────┘", width));
  }

  // 15. Espacio separador
  lines.push("");

  // 16. Pie de Controlador Fiscal y Versión de Firmware
  const serialLabel = `CF ${receipt.fiscal.fiscalSerialNumber || "SESHRA000022252"}`;
  const versionLabel = receipt.fiscal.softwareVersion || "V: 1.02";
  lines.push(padLeftRight(serialLabel, versionLabel, width));

  // 17. Políticas opcionales
  if (options?.includePolicies && receipt.footer.exchangePolicy) {
    lines.push("");
    lines.push("-".repeat(width));
    lines.push(padCenter("POLÍTICAS DE CAMBIO", width));
    lines.push(receipt.footer.exchangePolicy);
    lines.push("-".repeat(width));
  }

  return lines.join("\n");
}

/**
 * Genera el ticket en texto plano incorporando el renderizado real del código QR en caracteres terminales
 */
export async function formatTicketWithQrAsync(
  receipt: ReceiptData,
  cols: 40 | 32 | 48 = 40,
  options?: { includePolicies?: boolean }
): Promise<string> {
  let qrAscii: string | undefined = undefined;
  try {
    qrAscii = await QRCode.toString(receipt.fiscal.qrUrl, {
      type: "terminal",
      small: true,
    });
  } catch (err) {
    console.warn("No se pudo generar QR terminal:", err);
  }

  return formatTicketToPlainText(receipt, cols, {
    ...options,
    qrAscii,
  });
}

/**
 * Renderiza el ticket en un documento HTML completo autocontenido,
 * optimizado para impresión térmica directa de 80mm desde el navegador y con auto-print.
 */
export function formatTicketToHtml(
  receipt: ReceiptData,
  options?: { autoPrint?: boolean }
): string {
  const shouldAutoPrint = options?.autoPrint !== false;
  const autoPrintScript = shouldAutoPrint
    ? `<script>window.addEventListener('load', () => setTimeout(() => window.print(), 350));</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ticket ${receipt.sale.invoiceNumber} — Matacos Deportes</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #e2e8f0;
      font-family: 'Courier New', Courier, Monaco, monospace;
      color: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 10px;
      font-size: 12.5px;
      line-height: 1.32;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ticket-paper {
      width: 310px;
      max-width: 80mm;
      background: #fff;
      padding: 16px 14px 20px 14px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .title-spaced {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 4px;
      text-align: center;
    }
    .row-split {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      word-break: break-word;
    }
    .divider {
      border-top: 1px dashed #cbd5e1;
      margin: 9px 0;
    }
    .divider-solid {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      margin: 6px 0;
      padding: 4px 0;
    }
    .text-sub {
      font-size: 11px;
      color: #525252;
    }
    .qr-container {
      display: flex;
      justify-content: center;
      margin: 8px 0;
    }
    .qr-img {
      width: 145px;
      height: 145px;
      image-rendering: pixelated;
    }
    .btn-bar {
      margin-bottom: 16px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .btn {
      background: #059669;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.08);
      transition: background 0.15s;
    }
    .btn:hover { background: #047857; }
    .btn-secondary {
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .btn-secondary:hover { background: #f8fafc; }
    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
      }
      .btn-bar, .no-print {
        display: none !important;
      }
      .ticket-paper {
        width: 80mm !important;
        max-width: 80mm !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 3mm 2mm 5mm 2mm !important;
      }
    }
  </style>
</head>
<body>
  <div class="btn-bar no-print">
    <button class="btn" onclick="window.print()">🖨️ Imprimir Comprobante (80mm)</button>
    <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.querySelector('.ticket-paper').innerText); alert('Texto copiado al portapapeles');">📋 Copiar Texto</button>
  </div>
  <div class="ticket-paper">
    <div class="title-spaced">M A T A C O S</div>
    <div class="title-spaced">D E P O R T E S</div>
    
    <div class="divider"></div>
    
    <div style="font-size: 11.5px; line-height: 1.3;">
      <div class="bold">${receipt.company.legalName}</div>
      <div>CUIT Nro.: ${receipt.company.cuit}</div>
      <div>Ing. Brutos ${receipt.company.iibb}</div>
      <div>Dirección: ${receipt.company.address}</div>
      <div>${receipt.company.city}</div>
      <div>C.P.${receipt.company.postalCode}</div>
      <div>Inicio de Actividades: ${receipt.company.startDate}</div>
      <div>${receipt.company.vatCondition}</div>
      <div style="margin-top: 2px;">${receipt.sale.customerCondition || "A CONSUMIDOR FINAL"}</div>
      ${receipt.sale.customerName && receipt.sale.customerName !== "CONSUMIDOR FINAL" ? `<div class="bold" style="margin-top: 2px;">Cliente: ${receipt.sale.customerName}</div>` : ""}
    </div>
    
    <div class="divider"></div>
    
    <div class="center" style="font-size: 12px;">
      <div class="bold" style="font-size: 13px;">${receipt.sale.voucherType}</div>
      <div>P.V. Nro. ${receipt.sale.pointOfSale} - Nro. T. ${receipt.sale.voucherNumber}</div>
      <div class="row-split" style="margin-top: 2px;">
        <span>Fecha ${receipt.sale.date}</span>
        <span>Hora ${receipt.sale.time}</span>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <!-- Ítems -->
    <div style="display: flex; flex-direction: column; gap: 7px;">
      ${receipt.items
        .map(
          (item) => `
        <div>
          <div class="row-split">
            <span class="bold" style="font-size: 13px;">${item.productName.toUpperCase()}</span>
            <span class="bold" style="font-size: 13px;">${formatThermalPrice(item.subtotal)}</span>
          </div>
          <div class="row-split text-sub" style="margin-top: 1px;">
            <span>
              ${item.quantity > 1 ? `${item.quantity} un. x ${formatThermalPrice(item.unitPrice)}` : "1 un."}
              ${item.size && item.size !== "U" ? ` • Talle: ${item.size}` : ""}
              ${item.color && item.color !== "Único" && item.color !== "Estándar" ? ` • Color: ${item.color}` : ""}
            </span>
            ${item.discount > 0 ? `<span class="bold">Bonif.: -${item.formattedDiscount}</span>` : ""}
          </div>
        </div>
      `
        )
        .join("")}
    </div>
    
    <div class="divider"></div>
    
    <!-- Total -->
    <div class="divider-solid">
      <div class="row-split bold" style="font-size: 15.5px;">
        <span>TOTAL</span>
        <span>${formatThermalPrice(receipt.totals.netTotal)}</span>
      </div>
    </div>
    
    <!-- Pagos -->
    <div style="margin-top: 6px;">
      <div class="bold" style="font-size: 11.5px; margin-bottom: 3px;">RECIBI(MOS)</div>
      ${receipt.payments
        .map(
          (pay) => `
        <div style="margin-bottom: 2px;">
          <div class="row-split" style="font-size: 12px;">
            <span>${pay.methodName.toUpperCase()}</span>
            <span class="bold">${formatThermalPrice(pay.amount)}</span>
          </div>
          ${
            pay.receivedAmount != null && pay.change != null && pay.change > 0
              ? `
            <div class="text-sub" style="padding-left: 8px;">
              <div class="row-split">
                <span>SU PAGO:</span>
                <span>${formatThermalPrice(pay.receivedAmount)}</span>
              </div>
              <div class="row-split">
                <span>SU VUELTO:</span>
                <span>${formatThermalPrice(pay.change)}</span>
              </div>
            </div>
          `
              : ""
          }
        </div>
      `
        )
        .join("")}
    </div>
    
    <div class="divider"></div>
    
    <!-- Transparencia Fiscal -->
    <div>
      <div class="center bold" style="font-size: 11.5px; letter-spacing: 0.5px;">TRANSPARENCIA FISCAL</div>
      <div class="row-split" style="font-size: 12px; margin-top: 2px;">
        <span>IVA contenido (21%):</span>
        <span class="bold">${formatThermalPrice(receipt.fiscal.vatAmount)}</span>
      </div>
      <div class="right bold" style="font-size: 11px; margin-top: 2px; color: #374151;">${receipt.sale.cashierCode || "CAJERO01"}</div>
    </div>
    
    <div class="divider"></div>
    
    <!-- Código QR -->
    <div class="qr-container">
      ${
        receipt.fiscal.qrDataUrl
          ? `<img class="qr-img" src="${receipt.fiscal.qrDataUrl}" alt="QR AFIP" />`
          : `<div class="center text-sub">[ CÓDIGO QR AFIP ]</div>`
      }
    </div>
    
    <!-- Pie Controlador Fiscal -->
    <div class="row-split" style="font-size: 11px; color: #525252; border-top: 1px dotted #cbd5e1; padding-top: 6px;">
      <span>CF ${receipt.fiscal.fiscalSerialNumber || "SESHRA000022252"}</span>
      <span>${receipt.fiscal.softwareVersion || "V: 1.02"}</span>
    </div>
  </div>
  ${autoPrintScript}
</body>
</html>`;
}

export const generateSaleReceiptPayload = generateReceiptPayload;
