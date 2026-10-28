import { MercadoPagoConfig, Preference, Payment, WebhookSignatureValidator } from "mercadopago";

/**
 * Token de acceso de Mercado Pago obtenido desde variables de entorno.
 */
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";

/**
 * Cliente singleton de Mercado Pago oficial (SDK v2)
 */
export const mpClient = new MercadoPagoConfig({
  accessToken,
  options: {
    timeout: 7000,
  },
});

/**
 * Determina si las credenciales de Mercado Pago están cargadas con valores reales o de sandbox válidos.
 */
export function isMercadoPagoConfigured(): boolean {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  return (
    Boolean(token) &&
    token !== "TEST-0000000000000000-000000-00000000000000000000000000000000-000000000" &&
    token !== ""
  );
}

/**
 * Obtiene la URL base de la aplicación web de forma segura (sin barra final),
 * priorizando NEXT_PUBLIC_APP_URL, luego NEXTAUTH_URL y finalmente localhost en desarrollo.
 */
export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

/**
 * Valida criptográficamente el encabezado x-signature recibido en los webhooks de Mercado Pago.
 * Utiliza HMAC SHA-256 contra el secreto MERCADOPAGO_WEBHOOK_SECRET configurado.
 */
export function verifyWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret || secret === "your_webhook_secret_here") {
    // Si no está configurado el secreto en entorno de pruebas/desarrollo local
    return false;
  }

  if (!params.xSignature || !params.dataId) {
    return false;
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: params.xSignature,
      xRequestId: params.xRequestId || undefined,
      dataId: params.dataId,
      secret,
    });
    return true;
  } catch (error) {
    console.error("[MercadoPago Webhook] Validación de firma HMAC fallida:", error);
    return false;
  }
}

export { Preference, Payment, WebhookSignatureValidator };
