import { NextRequest, NextResponse } from "next/server";
import { generateReceiptPayload } from "@/server/services/receiptService";

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
    return NextResponse.json({ success: true, data: receipt });
  } catch (error: any) {
    console.error("Error en GET /api/pos/receipt/[saleId]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al generar comprobante de venta" },
      { status: 404 }
    );
  }
}
