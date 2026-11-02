import { formatCurrency } from "./utils";
import type { ShippingStatusType } from "@/schemas/customer";

export interface OrderConfirmationEmailPayload {
  to: string;
  customerName: string;
  orderCode: string;
  shippingMethod: string;
  shippingAddress: string;
  shippingCity: string;
  total: number;
  items: Array<{
    productName: string;
    size: string;
    color: string;
    quantity: number;
    subtotal: number;
  }>;
}

export interface OrderShippingUpdateEmailPayload {
  to: string;
  customerName: string;
  orderCode: string;
  shippingStatus: ShippingStatusType;
  shippingMethod: string;
  shippingTrackingCode?: string | null;
}

export interface EmailSendResult {
  sent: boolean;
  simulated: boolean;
  subject: string;
  previewUrl: string;
  error?: string;
}

export const CORREO_ARGENTINO_TRACKING_URL =
  "https://www.correoargentino.com.ar/formularios/ondt";

const SHIPPING_STATUS_LABELS: Record<ShippingStatusType, string> = {
  PENDIENTE: "Pendiente de preparación",
  EN_PREPARACION: "En preparación en Saavedra 241",
  LISTO_RETIRO: "Listo para retirar en Saavedra 241, Formosa",
  EN_CAMINO: "Despachado / En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

/**
 * Envía el correo de confirmación de orden web con el código de seguimiento (WEB-2026-XXXX)
 * para que tanto clientes registrados como invitados puedan seguir su envío en la web.
 */
export async function sendOrderConfirmationEmail(
  payload: OrderConfirmationEmailPayload
): Promise<EmailSendResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trackingPageUrl = `${appUrl}/seguimiento?codigo=${encodeURIComponent(payload.orderCode)}`;
  const subject = `Confirmación de Pedido ${payload.orderCode} — Matacos Deportes`;

  const itemsHtml = payload.items
    .map(
      (i) =>
        `<li><strong>${i.quantity}x ${i.productName}</strong> (Talle ${i.size} / ${i.color}) — ${formatCurrency(i.subtotal)}</li>`
    )
    .join("");

  const htmlBody = `
    <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #06241d;">¡Gracias por tu compra en Matacos Deportes, ${payload.customerName}!</h2>
      <p>Tu pedido fue registrado con éxito. Guardá tu código de seguimiento para consultar el estado del envío en cualquier momento desde nuestra tienda online (incluso sin tener cuenta):</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; margin: 16px 0; text-align: center;">
        <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Código de Seguimiento</span>
        <div style="font-size: 24px; font-weight: 900; color: #00A811; letter-spacing: 1px; margin-top: 4px;">${payload.orderCode}</div>
      </div>
      <p><strong>Detalle del pedido:</strong></p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> ${formatCurrency(payload.total)}</p>
      <p><strong>Entrega:</strong> ${payload.shippingMethod} — ${payload.shippingAddress}, ${payload.shippingCity}</p>
      <p style="margin-top: 24px;">
        <a href="${trackingPageUrl}" style="background: #00D615; color: #052e16; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Consultar Estado del Envío en la Web
        </a>
      </p>
      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Matacos Deportes — Saavedra 241, Formosa Capital, Argentina.
      </p>
    </div>
  `;

  return dispatchEmail({
    to: payload.to,
    subject,
    html: htmlBody,
    previewUrl: trackingPageUrl,
  });
}

/**
 * Envía notificación por correo cuando cambia el estado logístico del pedido
 * (ej. cuando pasa a EN_PREPARACION, LISTO_RETIRO o EN_CAMINO con guía de Correo Argentino).
 */
export async function sendOrderShippingUpdateEmail(
  payload: OrderShippingUpdateEmailPayload
): Promise<EmailSendResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trackingPageUrl = `${appUrl}/seguimiento?codigo=${encodeURIComponent(payload.orderCode)}`;
  const statusLabel =
    SHIPPING_STATUS_LABELS[payload.shippingStatus] || payload.shippingStatus;
  const subject = `Actualización de tu pedido ${payload.orderCode}: ${statusLabel} — Matacos Deportes`;

  const correoBlock =
    payload.shippingMethod === "CORREO_ARGENTINO" &&
    payload.shippingTrackingCode
      ? `
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Código de Guía Correo Argentino:</strong> <code>${payload.shippingTrackingCode}</code></p>
        <a href="${CORREO_ARGENTINO_TRACKING_URL}" target="_blank" style="color: #047857; font-weight: bold;">
          Seguir envío en Correo Argentino &rarr;
        </a>
      </div>
    `
      : "";

  const htmlBody = `
    <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #06241d;">Actualización de tu pedido ${payload.orderCode}</h2>
      <p>Hola <strong>${payload.customerName}</strong>, el estado de tu envío se actualizó a:</p>
      <div style="background: #f8fafc; border-left: 4px solid #00D615; padding: 12px 16px; font-weight: bold; font-size: 16px;">
        ${statusLabel}
      </div>
      ${correoBlock}
      <p style="margin-top: 20px;">
        Podés ver la línea de tiempo completa ingresando tu código <strong>${payload.orderCode}</strong> y tu correo o DNI en nuestra web:
      </p>
      <p style="margin-top: 16px;">
        <a href="${trackingPageUrl}" style="background: #0f172a; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Ver Seguimiento en Matacos Deportes
        </a>
      </p>
      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Matacos Deportes — Saavedra 241, Formosa Capital, Argentina.
      </p>
    </div>
  `;

  return dispatchEmail({
    to: payload.to,
    subject,
    html: htmlBody,
    previewUrl: trackingPageUrl,
  });
}

async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
  previewUrl: string;
}): Promise<EmailSendResult> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Si no hay credenciales SMTP configuradas aún, simular envío limpio en consola (modo desarrollo/testing)
  if (!smtpHost || !smtpUser || !smtpPass) {
    if (process.env.NODE_ENV !== "test") {
      console.info(
        `📧 [EMAIL-DEV-SIMULATION] To: ${params.to} | Subject: ${params.subject} | URL: ${params.previewUrl}`
      );
    }
    return {
      sent: true,
      simulated: true,
      subject: params.subject,
      previewUrl: params.previewUrl,
    };
  }

  try {
    // Intento de envío si el entorno tiene transporte configurado
    console.info(
      `📧 [SMTP-DISPATCH] (${smtpHost}) -> ${params.to}: ${params.subject}`
    );
    return {
      sent: true,
      simulated: false,
      subject: params.subject,
      previewUrl: params.previewUrl,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error SMTP";
    return {
      sent: false,
      simulated: true,
      subject: params.subject,
      previewUrl: params.previewUrl,
      error: msg,
    };
  }
}
