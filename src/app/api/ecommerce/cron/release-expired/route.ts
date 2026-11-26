import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredWebOrders } from "@/server/actions/ecommerce/checkoutActions";
import { WEB_ORDER_RESERVATION_MINUTES } from "@/types/ecommerce";

/**
 * Endpoint de Tarea Programada / Cron para liberar reservas de stock de órdenes web impagas
 * tras 15 minutos (RF-15 / Mitigación Riesgo R-01).
 *
 * Puede ser invocado periódicamente por un cron del servidor (ej. cada 5 minutos):
 * GET /api/ecommerce/cron/release-expired
 */
export async function GET(request: NextRequest) {
  const minutesParam = request.nextUrl.searchParams.get("minutes");
  const expirationMinutes = minutesParam
    ? parseInt(minutesParam, 10) || WEB_ORDER_RESERVATION_MINUTES
    : WEB_ORDER_RESERVATION_MINUTES;

  const result = await releaseExpiredWebOrders(expirationMinutes);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: result.data,
  });
}
