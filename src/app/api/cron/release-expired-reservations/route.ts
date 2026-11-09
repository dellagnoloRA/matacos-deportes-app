import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredWebOrders } from "@/server/actions/ecommerce/checkoutActions";

/**
 * Route Handler para el Cron Job de liberación automática de reservas de stock vencidas (RF-15 / Ticket 01)
 * Endpoint: GET / POST /api/cron/release-expired-reservations
 *
 * Seguridad:
 * - Valida encabezado 'Authorization: Bearer <CRON_SECRET>' o 'x-cron-secret: <CRON_SECRET>'.
 * - En modo desarrollo, si no está configurado CRON_SECRET, permite la ejecución emitiendo advertencia en logs.
 */
export async function GET(req: NextRequest) {
  return handleCronRelease(req);
}

export async function POST(req: NextRequest) {
  return handleCronRelease(req);
}

async function handleCronRelease(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;
    const headerSecret = req.headers.get("x-cron-secret")?.trim();

    const isSecretConfigured =
      Boolean(cronSecret) &&
      cronSecret !== "your_cron_secret_here" &&
      cronSecret!.trim() !== "";

    if (isSecretConfigured) {
      const provided = bearerToken || headerSecret;
      if (provided !== cronSecret) {
        return NextResponse.json(
          { error: "No autorizado. Token de cron inválido." },
          { status: 401 }
        );
      }
    } else {
      // Si no hay secret configurado, solo permitir en entorno de desarrollo local
      const isDev = process.env.NODE_ENV !== "production";
      if (!isDev) {
        return NextResponse.json(
          {
            error:
              "Endpoint de cron deshabilitado: configure la variable CRON_SECRET en el entorno de producción.",
          },
          { status: 403 }
        );
      }
      console.warn(
        "[Cron Stock] Ejecución sin CRON_SECRET configurado (permitido exclusivamente en desarrollo)."
      );
    }

    const result = await releaseExpiredWebOrders();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al liberar reservas vencidas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result.data,
    });
  } catch (error) {
    console.error("[Cron Stock] Error no controlado al liberar reservas:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno al ejecutar liberación de reservas",
      },
      { status: 500 }
    );
  }
}
