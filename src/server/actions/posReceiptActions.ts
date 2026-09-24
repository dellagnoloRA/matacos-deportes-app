"use server";

import {
  generateReceiptPayload,
  generateReceiptPayloadByTicketCode,
  formatTicketToPlainText,
} from "@/server/services/receiptService";
import { ReceiptData } from "@/schemas/receipt";

export interface GetReceiptResponse {
  success: boolean;
  data?: ReceiptData;
  error?: string;
}

export interface GetReceiptPlainTextResponse {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Server Action: Obtiene el payload estructurado y tipado de un comprobante por ID de venta
 * Usado por la interfaz POS en mostrador para previsualización e impresión térmica de 80mm.
 */
export async function getReceiptData(saleId: string): Promise<GetReceiptResponse> {
  try {
    if (!saleId || typeof saleId !== "string") {
      return { success: false, error: "ID de venta inválido o no proporcionado" };
    }

    const data = await generateReceiptPayload(saleId);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error en getReceiptData:", error);
    return {
      success: false,
      error: error.message || "Error al obtener datos del comprobante",
    };
  }
}

/**
 * Server Action: Obtiene el comprobante a partir del código corto de preventa de salón (ej: #042)
 */
export async function getReceiptByTicketCode(ticketCode: string): Promise<GetReceiptResponse> {
  try {
    if (!ticketCode || typeof ticketCode !== "string") {
      return { success: false, error: "Código de ticket inválido" };
    }

    const data = await generateReceiptPayloadByTicketCode(ticketCode);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error en getReceiptByTicketCode:", error);
    return {
      success: false,
      error: error.message || "Error al obtener comprobante por código",
    };
  }
}

/**
 * Server Action: Obtiene la versión en texto plano (ESC/POS monocromático) del comprobante
 */
export async function getReceiptPlainText(
  saleId: string,
  cols: 40 | 32 | 48 = 40,
  includePolicies = false
): Promise<GetReceiptPlainTextResponse> {
  try {
    if (!saleId || typeof saleId !== "string") {
      return { success: false, error: "ID de venta inválido o no proporcionado" };
    }

    const data = await generateReceiptPayload(saleId);
    const text = formatTicketToPlainText(data, cols, { includePolicies });
    return { success: true, text };
  } catch (error: any) {
    console.error("Error en getReceiptPlainText:", error);
    return {
      success: false,
      error: error.message || "Error al obtener texto del comprobante",
    };
  }
}
