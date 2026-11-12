"use server";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  ShippingCalculationSchema,
  ApplyShippingToOrderSchema,
  type ShippingCalculationInput,
  type ApplyShippingToOrderInput,
  type ShippingCalculationResult,
  type ShippingRateOption,
  type CorreoArgentinoAgency,
  calculateVirtualPackage,
} from "@/schemas/shipping";
import { correoArgentinoService } from "@/server/services/correoArgentinoService";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

/**
 * Consulta la tarifa plana vigente de cadetería para Formosa Capital (CP 3600)
 */
async function getEffectiveCadeteriaCost(): Promise<number> {
  try {
    const setting = await prisma.storeSetting.findUnique({
      where: { id: "default" },
      select: { cadeteriaCost: true },
    });
    if (setting?.cadeteriaCost) {
      return Number(setting.cadeteriaCost);
    }
  } catch (error) {
    console.warn("[ShippingActions] No se pudo leer cadeteriaCost de DB, usando default $ 2.500", error);
  }
  return 2500;
}

/**
 * Server Action: calculateShippingCostAction (BE-RF19 Subtarea 3)
 * Calcula y compara los costos de flete según la modalidad seleccionada y el código postal,
 * generando además las alternativas comparativas para el comprador.
 */
export async function calculateShippingCostAction(
  rawInput: ShippingCalculationInput
): Promise<ShippingCalculationResult> {
  try {
    const parsed = ShippingCalculationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        cost: 0,
        costFormatted: formatCurrency(0),
        method: rawInput.method || "RETIRO_LOCAL",
        options: [],
        packageDetails: { totalWeightGrams: 500, heightCm: 10, widthCm: 20, lengthCm: 25 },
        error: parsed.error.errors[0]?.message || "Parámetros de cálculo postal inválidos",
      };
    }

    const { postalCode, method, items, agencyCode } = parsed.data;

    // Obtener detalles de variantes y categorías para cálculo heurístico preciso
    const variantIds = items.map((i) => i.variantId);
    const dbVariants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        product: {
          select: {
            weightGrams: true,
            dimensionsCm: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    const variantMetaMap = new Map(dbVariants.map((v) => [v.id, v]));

    const enrichedItems = items.map((item) => {
      const dbV = variantMetaMap.get(item.variantId);
      const catName = item.categoryName || dbV?.product?.category?.name || null;
      const weight = item.weightGrams ?? dbV?.product?.weightGrams ?? null;
      const dim = (item.dimensionsCm || dbV?.product?.dimensionsCm || null) as {
        height?: number;
        width?: number;
        length?: number;
      } | null;

      return {
        quantity: item.quantity,
        weightGrams: weight,
        categoryName: catName,
        dimensionsCm: dim,
      };
    });

    const virtualPackage = calculateVirtualPackage(enrichedItems);
    const cadeteriaCost = await getEffectiveCadeteriaCost();

    // 1. Opción: Retiro en Local Saavedra 241
    const optionRetiroLocal: ShippingRateOption = {
      method: "RETIRO_LOCAL",
      name: "Retiro en Local (Saavedra 241)",
      price: 0,
      priceFormatted: "$ 0,00",
      deliveryTimeMinDays: 0,
      deliveryTimeMaxDays: 0,
      deliveryEstimateText: "Disponible de inmediato en horario comercial",
      isFree: true,
      notes: "Saavedra 241, Formosa Capital. Lunes a Sábado.",
    };

    // 2. Opción: Cadetería Urbana Formosa (Solo para CP 3600)
    const isFormosaLocal = postalCode.replace(/\D/g, "") === "3600";
    const optionCadeteria: ShippingRateOption = {
      method: "CADETERIA_FORMOSA",
      name: "Cadetería en Moto (Formosa Capital)",
      price: isFormosaLocal ? cadeteriaCost : 0,
      priceFormatted: formatCurrency(isFormosaLocal ? cadeteriaCost : 0),
      deliveryTimeMinDays: 1,
      deliveryTimeMaxDays: 1,
      deliveryEstimateText: isFormosaLocal
        ? "Entrega en el día o en 24 hs hábiles"
        : "Solo disponible en Formosa Capital (CP 3600)",
      isFree: false,
      notes: isFormosaLocal
        ? "Reparto urbano en moto con coordinación por WhatsApp"
        : "Código postal no alcanzado por cadetería local",
    };

    // 3. Opción: Correo Argentino a Domicilio
    const quoteHome = await correoArgentinoService.calculateRate({
      postalCodeDestination: postalCode,
      deliveredType: "D",
      dimensions: {
        weight: virtualPackage.weight,
        height: virtualPackage.height,
        width: virtualPackage.width,
        length: virtualPackage.length,
      },
    });

    const optionCorreoDomicilio: ShippingRateOption = {
      method: "CORREO_ARGENTINO_DOMICILIO",
      name: quoteHome.productName,
      price: quoteHome.price,
      priceFormatted: formatCurrency(quoteHome.price),
      deliveryTimeMinDays: quoteHome.deliveryTimeMin,
      deliveryTimeMaxDays: quoteHome.deliveryTimeMax,
      deliveryEstimateText: `Llega entre ${quoteHome.deliveryTimeMin} y ${quoteHome.deliveryTimeMax} días hábiles`,
      deliveredType: "D",
      isFree: false,
      notes: quoteHome.isContingency ? "Tarifa de contingencia aplicada" : undefined,
    };

    // 4. Opción: Correo Argentino Retiro en Sucursal
    const quoteBranch = await correoArgentinoService.calculateRate({
      postalCodeDestination: postalCode,
      deliveredType: "S",
      dimensions: {
        weight: virtualPackage.weight,
        height: virtualPackage.height,
        width: virtualPackage.width,
        length: virtualPackage.length,
      },
    });

    const optionCorreoSucursal: ShippingRateOption = {
      method: "CORREO_ARGENTINO_SUCURSAL",
      name: quoteBranch.productName,
      price: quoteBranch.price,
      priceFormatted: formatCurrency(quoteBranch.price),
      deliveryTimeMinDays: quoteBranch.deliveryTimeMin,
      deliveryTimeMaxDays: quoteBranch.deliveryTimeMax,
      deliveryEstimateText: `Disponible para retiro en ${quoteBranch.deliveryTimeMin} a ${quoteBranch.deliveryTimeMax} días hábiles`,
      deliveredType: "S",
      isFree: false,
      notes: agencyCode ? `Sucursal seleccionada: ${agencyCode}` : undefined,
    };

    const options: ShippingRateOption[] = [
      optionRetiroLocal,
      ...(isFormosaLocal ? [optionCadeteria] : []),
      optionCorreoSucursal,
      optionCorreoDomicilio,
    ];

    // Determinar el costo para el método específicamente solicitado
    let selectedCost = 0;
    if (method === "RETIRO_LOCAL") {
      selectedCost = 0;
    } else if (method === "CADETERIA_FORMOSA") {
      selectedCost = isFormosaLocal ? cadeteriaCost : optionCorreoDomicilio.price;
    } else if (method === "CORREO_ARGENTINO_SUCURSAL") {
      selectedCost = quoteBranch.price;
    } else {
      // CORREO_ARGENTINO o CORREO_ARGENTINO_DOMICILIO
      selectedCost = quoteHome.price;
    }

    return {
      success: true,
      cost: selectedCost,
      costFormatted: formatCurrency(selectedCost),
      method,
      options,
      packageDetails: {
        totalWeightGrams: virtualPackage.weight,
        heightCm: virtualPackage.height,
        widthCm: virtualPackage.width,
        lengthCm: virtualPackage.length,
      },
      isContingencyFallback: quoteHome.isContingency || quoteBranch.isContingency,
    };
  } catch (error) {
    console.error("[calculateShippingCostAction] Error:", error);
    return {
      success: false,
      cost: 7500,
      costFormatted: formatCurrency(7500),
      method: rawInput.method || "RETIRO_LOCAL",
      options: [],
      packageDetails: { totalWeightGrams: 500, heightCm: 10, widthCm: 20, lengthCm: 25 },
      error: error instanceof Error ? error.message : "Error al cotizar envío",
    };
  }
}

/**
 * Server Action: getAgenciesAction (BE-RF19 / Q5)
 * Retorna las sucursales habilitadas de Correo Argentino para la zona indicada.
 */
export async function getAgenciesAction(
  provinceCode?: string,
  postalCode?: string
): Promise<{ success: boolean; agencies: CorreoArgentinoAgency[]; error?: string }> {
  try {
    const agencies = await correoArgentinoService.getAgencies({
      provinceCode,
      postalCode,
    });
    return {
      success: true,
      agencies,
    };
  } catch (error) {
    console.error("[getAgenciesAction] Error:", error);
    return {
      success: false,
      agencies: [],
      error: error instanceof Error ? error.message : "Error al obtener sucursales",
    };
  }
}

/**
 * Server Action: applyShippingToOrderAction (BE-RF19 Subtarea 4)
 * Asocia de forma atómica los datos de flete calculados a una orden existente
 * recalculando el total neto (`subtotalGross - discount + shippingCost`).
 */
export async function applyShippingToOrderAction(
  rawInput: ApplyShippingToOrderInput
): Promise<{ success: boolean; orderId?: string; totalFormatted?: string; error?: string }> {
  try {
    const parsed = ApplyShippingToOrderSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Datos de envío inválidos",
      };
    }

    const {
      orderId,
      shippingMethod,
      shippingCost,
      shippingAddress,
      shippingCity,
      shippingPostalCode,
      shippingBranchCode,
      shippingBranchName,
    } = parsed.data;

    const updatedSale = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          subtotalGross: true,
          discount: true,
        },
      });

      if (!sale) {
        throw new Error("La orden especificada no existe");
      }

      if (sale.status === "COMPLETADA" || sale.status === "CANCELADA") {
        throw new Error("No se puede modificar el envío de una orden ya finalizada o cancelada");
      }

      const gross = Number(sale.subtotalGross || 0);
      const disc = Number(sale.discount || 0);
      const newTotal = Math.max(0, gross - disc + shippingCost);

      const updated = await tx.sale.update({
        where: { id: orderId },
        data: {
          shippingMethod,
          shippingCost: new Prisma.Decimal(shippingCost),
          shippingAddress: shippingAddress ?? undefined,
          shippingCity: shippingCity ?? undefined,
          shippingPostalCode: shippingPostalCode ?? undefined,
          shippingBranchCode: shippingBranchCode ?? null,
          shippingBranchName: shippingBranchName ?? null,
          total: new Prisma.Decimal(newTotal),
        },
      });

      return updated;
    });

    try {
      revalidatePath("/checkout");
      revalidatePath("/(ecommerce)/checkout", "page");
    } catch {}

    return {
      success: true,
      orderId: updatedSale.id,
      totalFormatted: formatCurrency(Number(updatedSale.total)),
    };
  } catch (error) {
    console.error("[applyShippingToOrderAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al aplicar envío a la orden",
    };
  }
}

/**
 * Server Action: updateCadeteriaCostAction (BE-RF19 Subtarea 3.2 / Q3)
 * Permite al administrador actualizar la tarifa plana de cadetería para Formosa Capital.
 */
export async function updateCadeteriaCostAction(
  newCost: number
): Promise<{ success: boolean; newCostFormatted?: string; error?: string }> {
  try {
    if (typeof newCost !== "number" || newCost < 0) {
      return { success: false, error: "El costo de cadetería debe ser un número mayor o igual a 0" };
    }

    const updated = await prisma.storeSetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        cadeteriaCost: new Prisma.Decimal(newCost),
      },
      update: {
        cadeteriaCost: new Prisma.Decimal(newCost),
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/checkout");
    } catch {}

    return {
      success: true,
      newCostFormatted: formatCurrency(Number(updated.cadeteriaCost)),
    };
  } catch (error) {
    console.error("[updateCadeteriaCostAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar tarifa de cadetería",
    };
  }
}
