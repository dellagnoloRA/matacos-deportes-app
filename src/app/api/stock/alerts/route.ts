import { NextRequest, NextResponse } from "next/server";
import { getConsolidatedStockAlerts } from "@/server/actions/stockAlertActions";
import { StockAlertFilter } from "@/schemas/stockAlerts";

/**
 * Endpoint REST para consultar la lista consolidada de productos con stock en alerta y agotados
 *
 * GET /api/stock/alerts
 * Parámetros de consulta opcionales:
 *  - filter: "ALL" | "OUT_OF_STOCK" | "CRITICAL_LOW" | "STORE_REPLENISHMENT"
 *  - categoryId: string UUID
 *  - brandId: string UUID
 *  - disciplineId: string UUID
 *  - search: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filterParam = searchParams.get("filter") as StockAlertFilter | null;
    const categoryId = searchParams.get("categoryId") || undefined;
    const brandId = searchParams.get("brandId") || undefined;
    const disciplineId = searchParams.get("disciplineId") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await getConsolidatedStockAlerts({
      filter: filterParam || "ALL",
      categoryId,
      brandId,
      disciplineId,
      search,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/stock/alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al procesar la solicitud de alertas de stock",
      },
      { status: 500 }
    );
  }
}
