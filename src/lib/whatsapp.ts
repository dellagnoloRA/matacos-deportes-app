/**
 * Utilidades centralizadas para integración y enlaces contextuales de WhatsApp (RF-18)
 * Cumple con el estándar de codificación segura URI (encodeURIComponent) y números internacionales wa.me.
 */

import {
  companyConfig,
  sanitizeWhatsAppNumber,
  DEFAULT_WHATSAPP_NUMBER,
} from "@/config/company";
import { formatCurrency } from "@/lib/utils";

/**
 * Parámetros para consulta contextual de producto / variante (PDP y catálogo)
 */
export interface ProductWhatsAppInquiryParams {
  productName?: string | null;
  title?: string | null; // Alias admitido para productName
  size?: string | null;
  talle?: string | null; // Alias admitido para size
  color?: string | null;
  price?: number | null;
  productUrl?: string | null;
  url?: string | null; // Alias admitido para productUrl
  phoneNumber?: string | null;
}

/**
 * Parámetros para consulta de pedidos en curso
 */
export interface OrderWhatsAppInquiryParams {
  orderCode?: string | null;
  orderId?: string | null;
  status?: string | null;
  customerName?: string | null;
  total?: number | null;
  shippingMethod?: string | null;
  shippingTrackingCode?: string | null;
  trackingUrl?: string | null;
  phoneNumber?: string | null;
}

/**
 * Parámetros para enlace de contingencia en confirmación de checkout (R-04)
 */
export interface CheckoutContingencyParams {
  orderCode: string;
  customerName: string;
  customerDni?: string | null;
  total: number;
  items: Array<{
    productName: string;
    size?: string | null;
    color?: string | null;
    quantity: number;
  }>;
  phoneNumber?: string | null;
}

/**
 * Formatea el estado de una orden a texto legible en español neutro comercial
 */
export function formatOrderStatusLabel(status?: string | null): string {
  if (!status) return "En proceso";
  const normalized = status.toUpperCase().trim();
  switch (normalized) {
    case "PENDIENTE_PAGO":
      return "Pendiente de pago";
    case "EN_PREPARACION":
      return "En preparación";
    case "LISTO_RETIRO":
      return "Listo para retirar en local físico";
    case "EN_CAMINO":
      return "En camino";
    case "ENTREGADO":
      return "Entregado";
    case "COMPLETADA":
      return "Completado";
    case "CANCELADA":
      return "Cancelado";
    default:
      return status;
  }
}

/**
 * Genera una URL genérica de WhatsApp con número sanitizado y mensaje codificado
 */

/**
 * Obtiene la URL de chat de WhatsApp resolviendo dinámicamente el número configurado en PostgreSQL
 */
export async function getDynamicWhatsAppUrl(
  message: string = "",
  overrideNumber?: string | null
): Promise<string> {
  if (overrideNumber) {
    return buildWhatsAppChatUrl(overrideNumber, message);
  }
  try {
    const { getStoreSettings } = await import("@/server/actions/storeSettingsActions");
    const res = await getStoreSettings();
    if (res.success && res.data?.whatsappNumber) {
      return buildWhatsAppChatUrl(res.data.whatsappNumber, message);
    }
  } catch {
    // contingencia si corre en cliente o sin acceso a BD
  }
  return buildWhatsAppChatUrl(null, message);
}

export function buildWhatsAppChatUrl(
  phoneNumber?: string | null,
  message: string = ""
): string {
  const cleanPhone = sanitizeWhatsAppNumber(phoneNumber || companyConfig.whatsappNumber || DEFAULT_WHATSAPP_NUMBER);
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanPhone}${encodedText ? `?text=${encodedText}` : ""}`;
}

/**
 * RF-18: Helper tipado para consulta contextual sobre un producto o variante.
 * Estructura: "Hola Matacos Deportes! Quiero consultar por [Producto] (Talle: [T], Color: [C]) [por $ 45.000,00]. [URL]"
 */
export function formatProductWhatsAppUrl(
  params: ProductWhatsAppInquiryParams
): string {
  const title = (params.productName || params.title || "este producto").trim();
  const talle = (params.size || params.talle || "").trim();
  const color = (params.color || "").trim();
  const price =
    typeof params.price === "number" && !isNaN(params.price) && params.price > 0
      ? params.price
      : null;
  const rawUrl = (params.productUrl || params.url || "").trim();

  // Construcción de variantes (Talle: [T], Color: [C])
  const variantParts: string[] = [];
  if (talle && color) {
    variantParts.push(`Talle: ${talle}, Color: ${color}`);
  } else if (talle) {
    variantParts.push(`Talle: ${talle}`);
  } else if (color) {
    variantParts.push(`Color: ${color}`);
  }

  const variantText = variantParts.length > 0 ? ` (${variantParts.join(", ")})` : "";
  const priceText = price != null ? ` por ${formatCurrency(price)}` : "";

  let message = `Hola Matacos Deportes! Quiero consultar por ${title}${variantText}${priceText}.`;

  if (rawUrl) {
    message += ` ${rawUrl}`;
  }

  return buildWhatsAppChatUrl(params.phoneNumber, message);
}

/**
 * RF-18: Helper tipado para consulta sobre pedidos en curso (orderId, estado, seguimiento).
 * Estructura: "Hola Matacos Deportes! Quiero consultar por mi pedido *[OrderCode]* (Estado: [Estado])..."
 */
export function formatOrderWhatsAppUrl(
  params: OrderWhatsAppInquiryParams
): string {
  const code = (params.orderCode || params.orderId || "mi pedido").trim();
  const statusLabel = formatOrderStatusLabel(params.status);

  let message = `Hola Matacos Deportes! Quiero consultar por el estado de mi pedido *${code}*`;

  if (params.customerName && params.customerName.trim()) {
    message += ` a nombre de ${params.customerName.trim()}`;
  }

  message += ` (Estado: ${statusLabel})`;

  if (typeof params.total === "number" && !isNaN(params.total) && params.total > 0) {
    message += ` por ${formatCurrency(params.total)}`;
  }

  if (params.shippingTrackingCode && params.shippingTrackingCode.trim()) {
    message += `. Código de seguimiento: ${params.shippingTrackingCode.trim()}`;
  }

  message += ".";

  if (params.trackingUrl && params.trackingUrl.trim()) {
    message += ` Seguimiento: ${params.trackingUrl.trim()}`;
  }

  return buildWhatsAppChatUrl(params.phoneNumber, message);
}

/**
 * RF-18 / Mitigación R-04: Helper tipado para enlace de contingencia generado al crear órdenes web en checkout
 */
export function formatCheckoutContingencyWhatsAppUrl(
  params: CheckoutContingencyParams
): string {
  const itemsText = params.items
    .map(
      (item) =>
        `${item.quantity}x ${item.productName} (${item.size || "Único"}/${item.color || "Único"})`
    )
    .join(", ");

  const dniPart = params.customerDni ? ` (DNI ${params.customerDni})` : "";

  const message = `¡Hola Matacos Deportes! Generé el pedido web *${params.orderCode}* a nombre de ${params.customerName}${dniPart} por ${formatCurrency(params.total)}. Detalle: ${itemsText}.`;

  return buildWhatsAppChatUrl(params.phoneNumber, message);
}

/**
 * Helper tipado para que el personal de mostrador o depósito inicie conversación con el comprador web
 * Estructura: "¡Hola [Nombre]! Te escribimos desde Matacos Deportes (Saavedra 241) respecto a tu compra online *[OrderCode]*..."
 */
export function formatStaffToCustomerWhatsAppUrl(params: {
  customerPhone: string;
  customerName?: string | null;
  orderCode: string;
  shippingStatus?: string | null;
  customMessage?: string | null;
}): string {
  const name = params.customerName?.trim() || "Cliente";
  const status = formatOrderStatusLabel(params.shippingStatus);
  const baseMessage =
    params.customMessage?.trim() ||
    `¡Hola ${name}! Te escribimos desde Matacos Deportes (Saavedra 241) respecto a tu compra online *${params.orderCode}* (Estado: ${status}).`;

  return buildWhatsAppChatUrl(params.customerPhone, baseMessage);
}

