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
import {
  SetOrderTrackingInfoSchema,
  CancelWebOrderSchema,
  type SetOrderTrackingInfoInput,
  type CancelWebOrderInput,
  calculateVirtualPackage,
} from "@/schemas/shipping";
import { correoArgentinoService } from "@/server/services/correoArgentinoService";
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
  shippingBranchCode: string | null;
  shippingBranchName: string | null;
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
    shippingBranchCode: (sale as any).shippingBranchCode ?? null,
    shippingBranchName: (sale as any).shippingBranchName ?? null,
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
      if (filters.shippingMethod === "CORREO_ARGENTINO") {
        where.shippingMethod = {
          in: ["CORREO_ARGENTINO", "CORREO_ARGENTINO_DOMICILIO", "CORREO_ARGENTINO_SUCURSAL"],
        };
      } else {
        where.shippingMethod = filters.shippingMethod;
      }
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
 * Server Action: generateShippingLabelAction (BE-RF25 Subtarea 4)
 * Ejecuta la imposición postal en Correo Argentino (vía API MiCorreo o Mock),
 * asigna el código de guía oficial (TN...AR), actualiza el estado a EN_CAMINO,
 * prepara el rótulo imprimible y despacha el correo electrónico de seguimiento al cliente.
 */
export async function generateShippingLabelAction({
  orderId,
  operatorName,
}: {
  orderId: string;
  operatorName?: string;
}): Promise<{
  success: boolean;
  trackingNumber?: string;
  labelPdfUrl?: string;
  data?: WebOrderDTO;
  emailDispatched?: boolean;
  error?: string;
}> {
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
                    weightGrams: true,
                    dimensionsCm: true,
                    brand: { select: { name: true } },
                    category: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        payments: true,
        customer: true,
      },
    });

    if (!sale || sale.channel !== "WEB") {
      return { success: false, error: "Orden web no encontrada" };
    }

    if (sale.status === "CANCELADA") {
      return { success: false, error: "No se puede generar guía para una orden cancelada" };
    }

    const orderCode =
      sale.invoiceNumber || sale.ticketCode || `WEB-${sale.id.slice(0, 8).toUpperCase()}`;

    // Calcular paquete virtual para el envío
    const itemsForVirtualPackage = sale.items.map((i) => ({
      quantity: i.quantity,
      weightGrams: i.variant.product.weightGrams,
      categoryName: i.variant.product.category.name,
      dimensionsCm: i.variant.product.dimensionsCm as any,
    }));
    const virtualPackage = calculateVirtualPackage(itemsForVirtualPackage);

    const isSucursal = sale.shippingMethod === "CORREO_ARGENTINO_SUCURSAL";
    const deliveredType = isSucursal ? "S" : "D";

    // Imposición postal en MiCorreo (o motor Mock)
    const importRes = await correoArgentinoService.importShipment({
      orderId: sale.id,
      orderCode,
      deliveredType,
      agencyCode: (sale as any).shippingBranchCode,
      recipient: {
        name: sale.customerName || sale.customer?.name || "Cliente Matacos",
        email: sale.customerEmail || sale.customer?.email || "ventas@matacosdeportes.com",
        phone: sale.customerPhone || sale.customer?.phone,
        address: !isSucursal
          ? {
              streetName: sale.shippingAddress || "Domicilio",
              streetNumber: "S/N",
              city: sale.shippingCity || "Formosa",
              provinceCode: "P",
              postalCode: sale.shippingPostalCode || "3600",
            }
          : undefined,
      },
      packageDetails: {
        weightGrams: virtualPackage.weight,
        declaredValue: Number(sale.total),
        heightCm: virtualPackage.height,
        widthCm: virtualPackage.width,
        lengthCm: virtualPackage.length,
      },
    });

    const auditNote = `\n[CORREO ARGENTINO]: Guía oficial generada (${importRes.trackingNumber}) por ${operatorName || "operador Saavedra 241"}`;
    const newNotes = sale.notes ? `${sale.notes}${auditNote}` : auditNote.trim();

    const updatedSale = await prisma.sale.update({
      where: { id: sale.id },
      data: {
        shippingTrackingCode: importRes.trackingNumber,
        shippingStatus: "EN_CAMINO",
        notes: newNotes,
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

    const dto = mapSaleToWebOrderDTO(updatedSale as any);

    let emailDispatched = false;
    if (updatedSale.customerEmail) {
      try {
        const emailRes = await sendOrderShippingUpdateEmail({
          to: updatedSale.customerEmail,
          customerName: updatedSale.customerName || "Cliente",
          orderCode: dto.orderCode,
          shippingStatus: "EN_CAMINO",
          shippingMethod: updatedSale.shippingMethod || "CORREO_ARGENTINO",
          shippingTrackingCode: importRes.trackingNumber,
        });
        emailDispatched = emailRes.sent;
      } catch (err) {
        console.error("Error al despachar email de guía postal:", err);
      }
    }

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/pedidos-web");
      revalidatePath("/dashboard");
      revalidatePath("/seguimiento");
    } catch {}

    return {
      success: true,
      trackingNumber: importRes.trackingNumber,
      labelPdfUrl: importRes.labelPdfUrl,
      data: dto,
      emailDispatched,
    };
  } catch (error) {
    console.error("Error en generateShippingLabelAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al generar guía postal",
    };
  }
}

/**
 * Server Action: setOrderTrackingInfoAction (BE-RF25 Subtarea 4)
 * Asocia o modifica el número de seguimiento y transportista para pedidos despachados.
 */
export async function setOrderTrackingInfoAction(
  rawInput: SetOrderTrackingInfoInput
): Promise<{ success: boolean; data?: WebOrderDTO; error?: string }> {
  try {
    const parsed = SetOrderTrackingInfoSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Datos de guía inválidos",
      };
    }

    const { orderId, trackingNumber, courierName, notifyCustomer } = parsed.data;

    const existingSale = await prisma.sale.findUnique({
      where: { id: orderId },
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
        customer: true,
      },
    });

    if (!existingSale) {
      return { success: false, error: "Orden no encontrada" };
    }

    const auditNote = `\n[TRANSPORTE]: Guía ${trackingNumber} asignada (${courierName})`;
    const updatedNotes = existingSale.notes ? `${existingSale.notes}${auditNote}` : auditNote.trim();

    const updatedSale = await prisma.sale.update({
      where: { id: orderId },
      data: {
        shippingTrackingCode: trackingNumber,
        shippingStatus: "EN_CAMINO",
        notes: updatedNotes,
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
        customer: true,
      },
    });

    const dto = mapSaleToWebOrderDTO(updatedSale as any);

    if (notifyCustomer && updatedSale.customerEmail) {
      try {
        await sendOrderShippingUpdateEmail({
          to: updatedSale.customerEmail,
          customerName: updatedSale.customerName || "Cliente",
          orderCode: dto.orderCode,
          shippingStatus: "EN_CAMINO",
          shippingMethod: updatedSale.shippingMethod || courierName,
          shippingTrackingCode: trackingNumber,
        });
      } catch (err) {
        console.error("Error al despachar email en setOrderTrackingInfoAction:", err);
      }
    }

    try {
      revalidatePath("/admin");
      revalidatePath("/dashboard");
      revalidatePath("/seguimiento");
    } catch {}

    return {
      success: true,
      data: dto,
    };
  } catch (error) {
    console.error("Error en setOrderTrackingInfoAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al asignar código de seguimiento",
    };
  }
}

/**
 * Server Action: cancelWebOrderAction (BE-RF25 Subtarea 5)
 * Ejecuta la anulación transaccional de la orden con restitución atómica de existencias:
 * - Si estaba PENDIENTE_PAGO: libera `stockReserved`.
 * - Si estaba COMPLETADA o preparada: reingresa las unidades físicas en `stockStore`
 *   y asienta un movimiento de inventario inmutable de tipo `ANULACION_VENTA`.
 */
export async function cancelWebOrderAction(
  rawInput: CancelWebOrderInput & { operatorName?: string }
): Promise<{ success: boolean; data?: WebOrderDTO; error?: string }> {
  try {
    const parsed = CancelWebOrderSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Datos de cancelación inválidos",
      };
    }

    const { orderId, reason } = parsed.data;
    const operator = rawInput.operatorName || "operador mostrador";

    const sale = await prisma.sale.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!sale) {
      return { success: false, error: "Orden no encontrada" };
    }

    if (sale.status === "CANCELADA") {
      return { success: false, error: "La orden ya se encuentra cancelada" };
    }

    const orderCode = sale.invoiceNumber || sale.ticketCode || `WEB-${sale.id.slice(0, 8)}`;
    const auditText = `\n[CANCELACIÓN]: Motivo: "${reason}". Ejecutado por ${operator} el ${new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`;

    await prisma.$transaction(async (tx) => {
      // 1. Restitución atómica de existencias
      if (sale.status === "PENDIENTE_PAGO") {
        // Solo revertir reserva temporal
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
      } else {
        // Estaba pagada o confirmada: reincorporar al stock de salón y asentar movimiento
        for (const item of sale.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { id: true, stockStore: true, stockWarehouse: true },
          });

          if (variant) {
            const newStoreStock = variant.stockStore + item.quantity;
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                stockStore: newStoreStock,
              },
            });

            await tx.inventoryMovement.create({
              data: {
                variantId: variant.id,
                type: "ANULACION_VENTA",
                quantity: item.quantity,
                stockAfter: newStoreStock + variant.stockWarehouse,
                location: "STORE",
                reason: `Restitución por anulación de pedido web ${orderCode}: ${reason}`,
              },
            });
          }
        }
      }

      // 2. Actualizar estado de la venta y logística
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
        customer: true,
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/dashboard");
      revalidatePath("/seguimiento");
    } catch {}

    return {
      success: true,
      data: updatedSale ? mapSaleToWebOrderDTO(updatedSale as any) : undefined,
    };
  } catch (error) {
    console.error("Error en cancelWebOrderAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al anular orden web",
    };
  }
}

/**
 * Alias retrocompatible para el mostrador
 */
export async function cancelWebOrderManualAction({
  orderId,
  reason,
}: {
  orderId: string;
  reason?: string;
}): Promise<{ success: boolean; data?: WebOrderDTO; error?: string }> {
  return cancelWebOrderAction({
    orderId,
    reason: reason || "Cancelación manual desde mostrador Saavedra 241",
  });
}
