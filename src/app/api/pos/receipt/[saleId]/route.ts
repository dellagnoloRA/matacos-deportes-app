import { NextRequest, NextResponse } from "next/server";
import {
  generateReceiptPayload,
  formatTicketToPlainText,
  formatTicketToHtml,
} from "@/server/services/receiptService";

/**
 * Route Handler REST: GET /api/pos/receipt/[saleId]
 * Permite a microservicios, clientes HTTP y herramientas locales de impresión
 * obtener el payload estructurado del ticket sin acoplarse al framework React.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params;
    if (!saleId) {
      return NextResponse.json(
        { success: false, error: "ID de venta requerido" },
        { status: 400 }
      );
    }

    const receipt = await generateReceiptPayload(saleId);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    if (format === "print" || format === "html") {
      const htmlOutput = formatTicketToHtml(receipt, {
        autoPrint: searchParams.get("autoprint") !== "false",
      });
      return new NextResponse(htmlOutput, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-cache",
        },
      });
    }

    if (format === "plain") {
      const parsedCols = parseInt(searchParams.get("cols") || "40", 10);
      const cols = parsedCols === 32 ? 32 : parsedCols === 48 ? 48 : 40;
      const includePolicies = searchParams.get("policies") === "true";
      const textOutput = formatTicketToPlainText(receipt, cols, { includePolicies });
      return new NextResponse(textOutput, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "private, no-cache",
        },
      });
    }

    return NextResponse.json({ success: true, data: receipt });
  } catch (error: any) {
    console.error("Error en GET /api/pos/receipt/[saleId]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al generar comprobante de venta" },
      { status: 404 }
    );
  }
}
