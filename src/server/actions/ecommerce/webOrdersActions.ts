"use server";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  sendOrderShippingUpdateEmail,
  CORREO_ARGENTINO_TRACKING_URL,
} from "@/lib/emailService";
import { formatStaffToCustomerWhatsAppUrl } from "@/lib/whatsapp";
import {
  WebOrdersFilterSchema,
  UpdateWebOrderShippingSchema,
  type WebOrdersFilterInput,
  type UpdateWebOrderShippingInput,
} from "@/schemas/webOrders";
import { revalidatePath } from "next/cache";
import { Prisma, SaleStatus, ShippingStatus } from "@prisma/client";

export interface WebOrderItemDTO {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  imageUrl: string | null;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitPriceFormatted: string;
  subtotal: number;
  subtotalFormatted: string;
  stockStore: number;
  stockWarehouse: number;
}

export interface WebOrderPaymentDTO {
  id: string;
  method: string;
  amount: number;
  referenceCode: string | null;
  cardBrand: string | null;
}

export interface WebOrderDTO {
  id: string;
  orderCode: string;
  channel: string;
  status: SaleStatus;
  shippingStatus: ShippingStatus;
  shippingMethod: string;
  shippingTrackingCode: string | null;
  shippingCost: number;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  subtotalGross: number;
  discount: number;
  total: number;
  totalFormatted: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerDni: string | null;
  notes: string | null;
  reservedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  items: WebOrderItemDTO[];
  payments: WebOrderPaymentDTO[];
  customerWhatsAppUrl: string | null;
  correoArgentinoTrackingUrl: string | null;
}

export interface WebOrdersSummaryCounts {
  total: number;
  pendingPayment: number;
  inPreparation: number;
  readyForPickup: number;
  onTheWay: number;
  delivered: number;
  cancelled: number;
}

export interface WebOrdersResponse {
  success: boolean;
  orders: WebOrderDTO[];
  counts: WebOrdersSummaryCounts;
  pagination: {
    page: number;
    limit: number;
    totalMatching: number;
    totalPages: number;
  };
  error?: string;
}

type SaleWithRelations = Prisma.SaleGetPayload<{
  include: {
    items: {
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true;
                name: true;
                imageUrl: true;
                brand: { select: { name: true } };
                category: { select: { name: true } };
              };
            };
          };
        };
      };
    };
    payments: true;
    customer: {
      select: {
        id: true;
        name: true;
        email: true;
        phone: true;
        dni: true;
      };
    };
  };
}>;

function mapSaleToWebOrderDTO(sale: SaleWithRelations): WebOrderDTO {
  const orderCode =
    sale.invoiceNumber || sale.ticketCode || `WEB-${sale.id.slice(0, 8).toUpperCase()}`;

  const totalNum = Number(sale.total);
  const subtotalGrossNum = Number(sale.subtotalGross || 0);
  const discountNum = Number(sale.discount || 0);
  const shippingCostNum = Number(sale.shippingCost || 0);

  const items: WebOrderItemDTO[] = sale.items.map((item) => {
    const unitPriceNum = Number(item.unitPrice || item.price || 0);
    const subtotalNum = Number(item.subtotal || unitPriceNum * item.quantity);
    const variant = item.variant;
    const product = variant?.product;

    return {
      id: item.id,
      variantId: item.variantId,
      productId: product?.id || "",
      productName: product?.name || "Artículo Web",
      brandName: product?.brand?.name || "Matacos Deportes",
      categoryName: product?.category?.name || "General",
      imageUrl: product?.imageUrl || null,
      size: variant?.size || "Único",
      color: variant?.color || "Único",
      sku: variant?.sku || "S/SKU",
      quantity: item.quantity,
      unitPrice: unitPriceNum,
      unitPriceFormatted: formatCurrency(unitPriceNum),
      subtotal: subtotalNum,
      subtotalFormatted: formatCurrency(subtotalNum),
      stockStore: variant?.stockStore ?? 0,
      stockWarehouse: variant?.stockWarehouse ?? 0,
    };
  });

  const payments: WebOrderPaymentDTO[] = sale.payments.map((p) => ({
    id: p.id,
    method: p.method,
    amount: Number(p.amount),
    referenceCode: p.referenceCode,
    cardBrand: p.cardBrand,
  }));

  const customerWhatsAppUrl = sale.customerPhone
    ? formatStaffToCustomerWhatsAppUrl({
        customerPhone: sale.customerPhone,
        customerName: sale.customerName,
        orderCode,
        shippingStatus: sale.shippingStatus,
      })
    : null;

  const correoArgentinoTrackingUrl = sale.shippingTrackingCode
    ? `${CORREO_ARGENTINO_TRACKING_URL}`
    : null;

  return {
    id: sale.id,
    orderCode,
    channel: sale.channel,
    status: sale.status,
    shippingStatus: sale.shippingStatus,
    shippingMethod: sale.shippingMethod || "RETIRO_LOCAL",
    shippingTrackingCode: sale.shippingTrackingCode,
    shippingCost: shippingCostNum,
    shippingAddress: sale.shippingAddress,
    shippingCity: sale.shippingCity,
    shippingPostalCode: sale.shippingPostalCode,
    subtotalGross: subtotalGrossNum,
    discount: discountNum,
    total: totalNum,
    totalFormatted: formatCurrency(totalNum),
    customerName: sale.customerName || sale.customer?.name || null,
    customerEmail: sale.customerEmail || sale.customer?.email || null,
    customerPhone: sale.customerPhone || sale.customer?.phone || null,
    customerDni: sale.customerDni || sale.customer?.dni || null,
    notes: sale.notes,
    reservedUntil: sale.reservedUntil ? sale.reservedUntil.toISOString() : null,
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
    items,
    payments,
    customerWhatsAppUrl,
    correoArgentinoTrackingUrl,
  };
}

/**
 * Consulta de órdenes web paginadas con filtros por estado de pago, estado logístico y buscador de texto.
 */
export async function getWebOrdersAction(
  rawInput: Partial<WebOrdersFilterInput> = {}
): Promise<WebOrdersResponse> {
  try {
    const parsed = WebOrdersFilterSchema.safeParse(rawInput);
    const filters = parsed.success
      ? parsed.data
      : {
          page: 1,
          limit: 20,
          paymentStatus: "TODAS" as const,
          shippingStatus: "TODAS" as const,
          shippingMethod: "TODOS" as const,
        };

    const where: Prisma.SaleWhereInput = {
      channel: "WEB",
    };

    if (filters.paymentStatus !== "TODAS") {
      where.status = filters.paymentStatus as SaleStatus;
    }

    if (filters.shippingStatus !== "TODAS") {
      where.shippingStatus = filters.shippingStatus as ShippingStatus;
    }

    if (filters.shippingMethod !== "TODOS") {
      where.shippingMethod = filters.shippingMethod;
    }

    if (filters.search && filters.search.trim().length > 0) {
      const search = filters.search.trim();
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { ticketCode: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerDni: { contains: search, mode: "insensitive" } },
        { shippingTrackingCode: { contains: search, mode: "insensitive" } },
      ];
    }

    // Consulta de conteos globales para las pestañas de métricas
    const [
      totalCount,
      pendingPaymentCount,
      inPrepCount,
      readyPickupCount,
      onTheWayCount,
      deliveredCount,
      cancelledCount,
      totalMatching,
      sales,
    ] = await Promise.all([
      prisma.sale.count({ where: { channel: "WEB" } }),
      prisma.sale.count({ where: { channel: "WEB", status: "PENDIENTE_PAGO" } }),
      prisma.sale.count({
        where: { channel: "WEB", status: "COMPLETADA", shippingStatus: "EN_PREPARACION" },
      }),
      prisma.sale.count({
        where: { channel: "WEB", status: "COMPLETADA", shippingStatus: "LISTO_RETIRO" },
      }),
      prisma.sale.count({
        where: { channel: "WEB", status: "COMPLETADA", shippingStatus: "EN_CAMINO" },
      }),
      prisma.sale.count({
        where: { channel: "WEB", status: "COMPLETADA", shippingStatus: "ENTREGADO" },
      }),
      prisma.sale.count({ where: { channel: "WEB", status: "CANCELADA" } }),
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                      brand: { select: { name: true } },
                      category: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
          payments: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              dni: true,
            },
          },
        },
      }),
    ]);

    const orders = sales.map(mapSaleToWebOrderDTO);

    return {
      success: true,
      orders,
      counts: {
        total: totalCount,
        pendingPayment: pendingPaymentCount,
        inPreparation: inPrepCount,
        readyForPickup: readyPickupCount,
        onTheWay: onTheWayCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
      },
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalMatching,
        totalPages: Math.ceil(totalMatching / filters.limit) || 1,
      },
    };
  } catch (error) {
    console.error("Error en getWebOrdersAction:", error);
    return {
      success: false,
      orders: [],
      counts: {
        total: 0,
        pendingPayment: 0,
        inPreparation: 0,
        readyForPickup: 0,
        onTheWay: 0,
        delivered: 0,
        cancelled: 0,
      },
      pagination: {
        page: 1,
        limit: 20,
        totalMatching: 0,
        totalPages: 1,
      },
      error: error instanceof Error ? error.message : "Error al consultar órdenes web",
    };
  }
}

/**
 * Consulta el detalle completo de una orden web específica por ID.
 */
export async function getWebOrderDetailAction(
  orderId: string
): Promise<{ success: boolean; data?: WebOrderDTO; error?: string }> {
  try {
    if (!orderId || !orderId.trim()) {
      return { success: false, error: "ID de orden requerido" };
    }

    const sale = await prisma.sale.findUnique({
      where: { id: orderId.trim() },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    brand: { select: { name: true } },
                    category: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        payments: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            dni: true,
          },
        },
      },
    });

    if (!sale || sale.channel !== "WEB") {
      return { success: false, error: "Orden web no encontrada" };
    }

    return {
      success: true,
      data: mapSaleToWebOrderDTO(sale),
    };
  } catch (error) {
    console.error("Error en getWebOrderDetailAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener orden web",
    };
  }
}

/**
 * Actualiza el estado logístico de un pedido web (EN_PREPARACION, LISTO_RETIRO, EN_CAMINO, ENTREGADO),
 * asocia el código de seguimiento de Correo Argentino y dispara la notificación por email al cliente.
 */
export async function updateWebOrderShippingStatusAction(
  input: UpdateWebOrderShippingInput
): Promise<{
  success: boolean;
  data?: WebOrderDTO;
  emailDispatched?: boolean;
  error?: string;
}> {
  try {
    const parsed = UpdateWebOrderShippingSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Datos de estado logístico inválidos",
      };
    }

    const { orderId, shippingStatus, shippingTrackingCode, notifyCustomer, notes } = parsed.data;

    const existingSale = await prisma.sale.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        channel: true,
        status: true,
        shippingStatus: true,
        shippingMethod: true,
        customerEmail: true,
        customerName: true,
        invoiceNumber: true,
        ticketCode: true,
        notes: true,
      },
    });

    if (!existingSale) {
      return { success: false, error: "Orden no encontrada" };
    }

    const trackingTrimmed = shippingTrackingCode ? shippingTrackingCode.trim() : null;

    let auditNote = "";
    if (notes && notes.trim().length > 0) {
      auditNote = `\n[NOTA LOGÍSTICA]: ${notes.trim()}`;
    }
    if (shippingStatus === "LISTO_RETIRO" && existingSale.shippingStatus !== "LISTO_RETIRO") {
      auditNote += `\n[SALÓN]: Pedido listo para retiro en Saavedra 241`;
    } else if (shippingStatus === "EN_CAMINO" && trackingTrimmed) {
      auditNote += `\n[LOGÍSTICA]: Despachado por Correo Argentino (Guía: ${trackingTrimmed})`;
    }

    const newNotes = existingSale.notes ? `${existingSale.notes}${auditNote}` : auditNote.trim();

    const updatedSale = await prisma.sale.update({
      where: { id: orderId },
      data: {
        shippingStatus: shippingStatus as ShippingStatus,
        shippingTrackingCode: trackingTrimmed,
        notes: newNotes || undefined,
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    brand: { select: { name: true } },
                    category: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        payments: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            dni: true,
          },
        },
      },
    });

    const dto = mapSaleToWebOrderDTO(updatedSale);

    let emailDispatched = false;
    if (notifyCustomer && updatedSale.customerEmail) {
      try {
        const emailRes = await sendOrderShippingUpdateEmail({
          to: updatedSale.customerEmail,
          customerName: updatedSale.customerName || "Cliente",
          orderCode: dto.orderCode,
          shippingStatus: shippingStatus as any,
          shippingMethod: updatedSale.shippingMethod || "RETIRO_LOCAL",
          shippingTrackingCode: updatedSale.shippingTrackingCode,
        });
        emailDispatched = emailRes.sent;
      } catch (emailErr) {
        console.error("Error al despachar email de actualización logística:", emailErr);
      }
    }

    try {
      revalidatePath("/dashboard");
      revalidatePath("/seguimiento");
    } catch {}

    return {
      success: true,
      data: dto,
      emailDispatched,
    };
  } catch (error) {
    console.error("Error en updateWebOrderShippingStatusAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar estado logístico",
    };
  }
}

/**
 * Cancelación manual de una orden web no pagada desde mostrador con liberación atómica de reservas.
 */
export async function cancelWebOrderManualAction({
  orderId,
  reason,
}: {
  orderId: string;
  reason?: string;
}): Promise<{ success: boolean; data?: WebOrderDTO; error?: string }> {
  try {
    if (!orderId || !orderId.trim()) {
      return { success: false, error: "ID de orden requerido" };
    }

    const sale = await prisma.sale.findUnique({
      where: { id: orderId.trim() },
      include: {
        items: true,
      },
    });

    if (!sale) {
      return { success: false, error: "Orden no encontrada" };
    }

    if (sale.status === "COMPLETADA") {
      return {
        success: false,
        error: "No se puede cancelar manualmente una orden completada con pago aprobado",
      };
    }

    if (sale.status === "CANCELADA") {
      return {
        success: false,
        error: "La orden ya se encuentra cancelada",
      };
    }

    const auditText = `\n[CANCELACIÓN MANUAL]: ${reason?.trim() || "Cancelada desde mostrador Saavedra 241"}`;

    await prisma.$transaction(async (tx) => {
      // Liberar stock reservado
      for (const item of sale.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockReserved: {
              decrement: item.quantity,
            },
          },
        });
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: "CANCELADA",
          shippingStatus: "CANCELADO",
          notes: sale.notes ? `${sale.notes}${auditText}` : auditText.trim(),
        },
      });
    });

    const updatedSale = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    brand: { select: { name: true } },
                    category: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        payments: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            dni: true,
          },
        },
      },
    });

    try {
      revalidatePath("/dashboard");
      revalidatePath("/seguimiento");
    } catch {}

    return {
      success: true,
      data: updatedSale ? mapSaleToWebOrderDTO(updatedSale) : undefined,
    };
  } catch (error) {
    console.error("Error en cancelWebOrderManualAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cancelar orden web",
    };
  }
}
