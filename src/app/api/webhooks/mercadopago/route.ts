import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/mercadopago";
import { processMercadoPagoPayment } from "@/server/actions/ecommerce/mercadopagoActions";

/**
 * Route Handler para recibir Webhooks oficiales de Mercado Pago (RF-16)
 * Endpoint: POST /api/webhooks/mercadopago
 */
export async function POST(req: NextRequest) {
  try {
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    const searchParams = req.nextUrl.searchParams;

    // Intentar leer el cuerpo JSON
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Si el request no trajo body JSON, se confía en los query params (IPN)
      body = {};
    }

    // 1. Extraer identificador de la transacción (data.id o id)
    const dataId =
      searchParams.get("data.id") ||
      searchParams.get("id") ||
      body?.data?.id ||
      body?.id;

    // 2. Extraer tipo de evento (type o topic)
    const eventType =
      searchParams.get("type") ||
      searchParams.get("topic") ||
      body?.type ||
      body?.topic ||
      body?.action;

    // 3. Validar firma criptográfica HMAC en entornos donde esté configurado el webhook secret
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const isSecretConfigured =
      webhookSecret &&
      webhookSecret !== "your_webhook_secret_here" &&
      webhookSecret.trim() !== "";

    if (isSecretConfigured && xSignature && dataId) {
      const isValid = verifyWebhookSignature({
        xSignature,
        xRequestId,
        dataId: String(dataId),
      });

      if (!isValid) {
        console.warn("[MercadoPago Webhook] Rechazado por firma criptográfica inválida");
        return NextResponse.json(
          { error: "Firma de webhook no autorizada" },
          { status: 401 }
        );
      }
    }

    // 4. Filtrar y procesar únicamente eventos vinculados a pagos
    const isPaymentEvent =
      eventType === "payment" ||
      eventType === "payment.created" ||
      eventType === "payment.updated" ||
      Boolean(dataId && !eventType);

    if (!isPaymentEvent || !dataId) {
      // Retornar 200 para eventos que no son de pagos (ej: merchant_order, plan, etc.)
      return NextResponse.json({
        received: true,
        message: "Evento no asociado a pagos ignorado correctamente",
      });
    }

    // 5. Procesar la acreditación / cancelación atómica
    const processResult = await processMercadoPagoPayment(dataId);

    if (!processResult.success) {
      console.error("[MercadoPago Webhook] Error en procesamiento:", processResult.error);
      return NextResponse.json(
        { error: processResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      data: processResult,
    });
  } catch (error) {
    console.error("[MercadoPago Webhook] Excepción no controlada:", error);
    return NextResponse.json(
      { error: "Error interno al procesar notificación" },
      { status: 500 }
    );
  }
}
