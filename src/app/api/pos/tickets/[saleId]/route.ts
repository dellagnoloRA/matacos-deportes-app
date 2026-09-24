import { NextRequest, NextResponse } from "next/server";
import {
  generateSaleReceiptPayload,
  formatTicketToPlainText,
  formatTicketToHtml,
} from "@/server/services/receiptService";

interface RouteParams {
  params: Promise<{
    saleId: string;
  }>;
}

/**
 * Endpoint para obtener el comprobante de venta formateado según el estándar (RF-10)
 * GET /api/pos/tickets/[saleId] -> JSON
 * GET /api/pos/tickets/[saleId]?format=plain&cols=40 -> Texto ESC/POS
 * GET /api/pos/tickets/[saleId]?format=print -> Vista HTML con diálogo de impresión automática
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { saleId } = await params;
    if (!saleId) {
      return NextResponse.json({ error: "saleId es requerido" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const parsedCols = parseInt(searchParams.get("cols") || "40", 10);
    const cols = parsedCols === 32 ? 32 : parsedCols === 48 ? 48 : 40;
    const includePolicies = searchParams.get("policies") === "true";

    const ticketPayload = await generateSaleReceiptPayload(saleId);

    if (format === "print" || format === "html") {
      const htmlOutput = formatTicketToHtml(ticketPayload, {
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
      const textOutput = formatTicketToPlainText(ticketPayload, cols, { includePolicies });
      return new NextResponse(textOutput, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "private, no-cache",
        },
      });
    }

    return NextResponse.json({ success: true, data: ticketPayload }, {
      headers: {
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error al generar ticket de venta:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar comprobante de venta" },
      { status: 500 }
    );
  }
}
