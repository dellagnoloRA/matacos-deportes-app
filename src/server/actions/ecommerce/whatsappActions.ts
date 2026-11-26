"use server";

import { prisma } from "@/lib/prisma";
import {
  formatOrderWhatsAppUrl,
  formatProductWhatsAppUrl,
  ProductWhatsAppInquiryParams,
  OrderWhatsAppInquiryParams,
} from "@/lib/whatsapp";

export interface OrderWhatsAppActionResult {
  success: boolean;
  url?: string;
  orderCode?: string;
  status?: string;
  shippingStatus?: string | null;
  error?: string;
}

/**
 * RF-18 (Objetivo 3): Server Action para generar URLs de consulta sobre pedidos en curso.
 * Puede recibir el código de orden o ID (ej: "WEB-2026-0001", UUID) o un objeto con metadatos.
 * Consulta la base de datos para obtener el estado en tiempo real (pago, preparación, tracking)
 * y si no existiera en base local genera el enlace seguro con los datos provistos.
 */
export async function getOrderWhatsAppInquiryUrlAction(
  input: string | OrderWhatsAppInquiryParams
): Promise<OrderWhatsAppActionResult> {
  try {
    const rawIdentifier =
      typeof input === "string"
        ? input.trim()
        : (input.orderCode || input.orderId || "").trim();

    if (!rawIdentifier && typeof input === "object" && !input.status) {
      return {
        success: false,
        error: "Identificador de pedido no provisto",
      };
    }

    // Si tenemos un identificador, intentamos buscarlo en PostgreSQL con Prisma
    let foundSale: {
      id: string;
      invoiceNumber: string | null;
      ticketCode: string | null;
      status: string;
      shippingStatus: string | null;
      shippingTrackingCode: string | null;
      total: number;
      customerName: string | null;
    } | null = null;

    if (rawIdentifier) {
      const sale = await prisma.sale.findFirst({
        where: {
          OR: [
            { id: rawIdentifier },
            { invoiceNumber: rawIdentifier },
            { ticketCode: rawIdentifier },
          ],
        },
        select: {
          id: true,
          invoiceNumber: true,
          ticketCode: true,
          status: true,
          shippingStatus: true,
          shippingTrackingCode: true,
          total: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
      });

      if (sale) {
        foundSale = {
          id: sale.id,
          invoiceNumber: sale.invoiceNumber,
          ticketCode: sale.ticketCode,
          status: sale.status,
          shippingStatus: sale.shippingStatus,
          shippingTrackingCode: sale.shippingTrackingCode,
          total: Number(sale.total),
          customerName: sale.customer?.name || null,
        };
      }
    }

    if (foundSale) {
      const orderCode =
        foundSale.invoiceNumber || foundSale.ticketCode || foundSale.id;
      // Priorizar estado logístico sobre el fiscal para el mensaje al comprador
      const currentStatus =
        foundSale.shippingStatus || foundSale.status;

      const url = formatOrderWhatsAppUrl({
        orderCode,
        status: currentStatus,
        customerName: foundSale.customerName,
        total: foundSale.total,
        shippingTrackingCode: foundSale.shippingTrackingCode,
        phoneNumber: typeof input === "object" ? input.phoneNumber : undefined,
      });

      return {
        success: true,
        url,
        orderCode,
        status: foundSale.status,
        shippingStatus: foundSale.shippingStatus,
      };
    }

    // Si no está persistido o se pasaron metadatos directos
    const params: OrderWhatsAppInquiryParams =
      typeof input === "string"
        ? { orderCode: input }
        : input;

    const url = formatOrderWhatsAppUrl(params);

    return {
      success: true,
      url,
      orderCode: params.orderCode || params.orderId || rawIdentifier,
      status: params.status || undefined,
    };
  } catch (error) {
    console.error("Error en getOrderWhatsAppInquiryUrlAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo generar el enlace de consulta para el pedido",
    };
  }
}

/**
 * RF-18: Server Action para generar URLs de consulta sobre productos
 */
export async function getProductWhatsAppInquiryUrlAction(
  params: ProductWhatsAppInquiryParams
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const url = formatProductWhatsAppUrl(params);
    return { success: true, url };
  } catch (error) {
    console.error("Error en getProductWhatsAppInquiryUrlAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo generar el enlace de WhatsApp para el producto",
    };
  }
}
