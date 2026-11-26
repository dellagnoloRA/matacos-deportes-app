"use server";

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import {
  RevocationRequestSchema,
  type RevocationRequestInput,
  type FormConsentType,
} from "@/schemas/legal";

export interface LogLegalConsentParams {
  formType: FormConsentType;
  email: string;
  name?: string | null;
  dni?: string | null;
  customerId?: string | null;
  saleId?: string | null;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  termsVersion?: string;
  privacyVersion?: string;
}

/**
 * Registra un evento de consentimiento legal de forma inmutable con IP y User-Agent
 */
export async function logLegalConsentHelper(params: LogLegalConsentParams) {
  try {
    let ipAddress = "127.0.0.1";
    let userAgent = "Desconocido / No provisto";

    try {
      const headerList = await headers();
      const forwarded = headerList.get("x-forwarded-for");
      ipAddress = forwarded
        ? forwarded.split(",")[0].trim()
        : headerList.get("x-real-ip") || "127.0.0.1";
      userAgent = headerList.get("user-agent") || "Navegador Web";
    } catch {
      // Fuera del ciclo de petición HTTP (ej: suites de prueba CLI)
      ipAddress = "127.0.0.1";
      userAgent = "CLI Test Suite / Node Runner";
    }

    const record = await prisma.legalConsentLog.create({
      data: {
        formType: params.formType,
        acceptedTerms: params.acceptedTerms,
        termsVersion: params.termsVersion || "v1.0",
        acceptedPrivacy: params.acceptedPrivacy,
        privacyVersion: params.privacyVersion || "v1.0",
        email: params.email.toLowerCase().trim(),
        name: params.name?.trim() || null,
        dni: params.dni?.trim() || null,
        customerId: params.customerId || null,
        saleId: params.saleId || null,
        ipAddress,
        userAgent,
      },
    });

    return { success: true, recordId: record.id };
  } catch (error) {
    console.error("Error al registrar consentimiento legal:", error);
    // No bloqueamos la transacción principal si falla la telemetría, pero advertimos
    return { success: false, error: "No se pudo auditar el consentimiento" };
  }
}

export interface RevocationActionResult {
  success: boolean;
  error?: string;
  data?: {
    revocationCode: string;
    orderCode: string;
    message: string;
    status: string;
  };
}

/**
 * Procesa una solicitud de revocación/arrepentimiento (Resolución 271/2020 SCI)
 */
export async function submitRevocationRequestAction(
  rawInput: RevocationRequestInput
): Promise<RevocationActionResult> {
  try {
    const validated = RevocationRequestSchema.parse(rawInput);
    const cleanOrderCode = validated.orderCode.trim().toUpperCase();
    const cleanEmail = validated.customerEmail.toLowerCase().trim();

    // Buscar la orden por invoiceNumber, ticketCode, o id
    const sale = await prisma.sale.findFirst({
      where: {
        channel: "WEB",
        OR: [
          { invoiceNumber: cleanOrderCode },
          { ticketCode: cleanOrderCode },
          { id: validated.orderCode.trim() },
        ],
      },
      include: {
        customer: true,
      },
    });

    if (!sale) {
      return {
        success: false,
        error:
          "No encontramos una orden web con ese código. Verificá el identificador recibido en tu comprobante de compra.",
      };
    }

    // Validar coincidencia de correo electrónico
    const orderEmail = (sale.customerEmail || sale.customer?.email || "").toLowerCase().trim();
    if (orderEmail && orderEmail !== cleanEmail) {
      return {
        success: false,
        error:
          "El correo electrónico ingresado no coincide con el registrado en el pedido.",
      };
    }

    // Validar plazo legal de 10 días corridos desde la compra / entrega
    const purchaseDate = new Date(sale.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - purchaseDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 10) {
      return {
        success: false,
        error:
          "El plazo legal de 10 días corridos para revocar la compra online ha expirado. Podés solicitar un cambio por talle/producto comunicándote con atención al cliente.",
      };
    }

    // Generar código de revocación único "REV-XXXXXX"
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const revocationCode = `REV-${randomSuffix}`;

    const revocation = await prisma.revocationRequest.create({
      data: {
        code: revocationCode,
        saleId: sale.id,
        orderCode: sale.invoiceNumber || sale.ticketCode || sale.id,
        customerEmail: cleanEmail,
        customerPhone: validated.customerPhone || sale.customerPhone,
        reason: validated.reason || "Revocación por derecho de arrepentimiento (Ley 24.240)",
        status: "PENDIENTE_REVISION",
      },
    });

    // Registrar consentimiento legal de la solicitud
    await logLegalConsentHelper({
      formType: "REVOCATION_REQUEST",
      email: cleanEmail,
      name: sale.customerName || sale.customer?.name,
      dni: sale.customerDni || sale.customer?.dni,
      customerId: sale.customerId,
      saleId: sale.id,
      acceptedTerms: validated.acceptedTerms,
      acceptedPrivacy: validated.acceptedPrivacy,
    });

    return {
      success: true,
      data: {
        revocationCode: revocation.code,
        orderCode: sale.invoiceNumber || sale.ticketCode || sale.id,
        status: revocation.status,
        message:
          "Tu solicitud de arrepentimiento ha sido registrada exitosamente. Guardá el código de trámite para su seguimiento.",
      },
    };
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as { issues: Array<{ message: string }> };
      return {
        success: false,
        error: zodError.issues[0]?.message || "Datos del formulario inválidos.",
      };
    }

    console.error("Error al procesar solicitud de revocación:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al procesar la solicitud. Intentá nuevamente.",
    };
  }
}

/**
 * Consulta el estado de un trámite de revocación existente
 */
export async function getRevocationStatusAction(
  code: string,
  email: string
) {
  try {
    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const revocation = await prisma.revocationRequest.findFirst({
      where: {
        code: cleanCode,
        customerEmail: cleanEmail,
      },
      include: {
        sale: {
          select: {
            total: true,
            createdAt: true,
            channel: true,
          },
        },
      },
    });

    if (!revocation) {
      return {
        success: false,
        error: "No se encontró ningún trámite con ese código y correo electrónico.",
      };
    }

    return {
      success: true,
      data: {
        code: revocation.code,
        orderCode: revocation.orderCode,
        status: revocation.status,
        createdAt: revocation.createdAt,
        rejectionReason: revocation.rejectionReason,
        totalAmount: revocation.sale?.total ? Number(revocation.sale.total) : null,
      },
    };
  } catch (error) {
    console.error("Error al consultar revocación:", error);
    return {
      success: false,
      error: "Error al consultar el trámite.",
    };
  }
}
