"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  ProductDiscountSchema,
  CategoryDiscountSchema,
  RemoveCategoryDiscountSchema,
  type ProductDiscountInput,
  type CategoryDiscountInput,
  type RemoveCategoryDiscountInput,
} from "@/schemas/productDiscount";
import { hasPermission } from "@/server/actions/authActions";
import { getSession } from "@/lib/session";
import { revalidateLandingPageData } from "@/server/actions/ecommerce/landingActions";

export interface SetDiscountResult {
  success: boolean;
  error?: string;
  code?: string;
  data?: {
    productId: string;
    productName: string;
    regularPrice: number;
    discountPercentage: number;
    discountPrice: number;
    discountActive: boolean;
    discountStartDate: string | null;
    discountEndDate: string | null;
    isBelowCost: boolean;
  };
}

export interface BulkDiscountResult {
  success: boolean;
  error?: string;
  code?: string;
  data?: {
    totalEvaluated: number;
    appliedCount: number;
    skippedCount: number;
    skippedProducts: Array<{
      productId: string;
      productName: string;
      regularPrice: number;
      costPrice: number;
      attemptedDiscountPrice: number;
      reason: string;
    }>;
  };
}

export interface RemoveBulkDiscountResult {
  success: boolean;
  error?: string;
  count?: number;
}

/**
 * Server Action (RF-27 / Ticket 1): Fijar o actualizar descuento individual en un producto
 * Valida esquema Zod, cálculo determinista al centavo, protección contra venta a quebranto (costPrice)
 * y autorización mediante permiso atómico `product:discount_below_cost`.
 */
export async function setProductDiscount(
  productId: string,
  rawInput: unknown
): Promise<SetDiscountResult> {
  try {
    const parseResult = ProductDiscountSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors[0]?.message || "Datos de descuento inválidos",
      };
    }

    const validated = parseResult.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        costPrice: true,
        variants: {
          select: {
            id: true,
            price: true,
          },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: "Producto no encontrado.",
      };
    }

    const regularPrice = Number(product.price);
    const discountAmount =
      Math.round(((regularPrice * validated.discountPercentage) / 100) * 100) / 100;
    const discountPrice = Math.max(
      0,
      Math.round((regularPrice - discountAmount) * 100) / 100
    );

    // Salvaguarda de Costo de Reposición (costPrice)
    let isBelowCost = false;
    if (product.costPrice !== null) {
      const cost = Number(product.costPrice);
      if (discountPrice < cost) {
        isBelowCost = true;
      }

      // Evaluar si alguna variante con sobreprecio cae debajo del costo
      for (const variant of product.variants) {
        if (variant.price !== null) {
          const varPrice = Number(variant.price);
          const varDiscount =
            Math.round(((varPrice * validated.discountPercentage) / 100) * 100) / 100;
          const varFinal = Math.max(0, Math.round((varPrice - varDiscount) * 100) / 100);
          if (varFinal < cost) {
            isBelowCost = true;
            break;
          }
        }
      }

      if (isBelowCost) {
        if (!validated.allowBelowCost) {
          return {
            success: false,
            code: "DISCOUNT_BELOW_COST",
            error: `El precio promocional resultante ($ ${discountPrice.toLocaleString(
              "es-AR"
            )}) es inferior al costo de reposición ($ ${cost.toLocaleString(
              "es-AR"
            )}). Active la autorización explícita si desea forzar la venta bajo costo.`,
          };
        }

        // Validar permisos atómicos RBAC
        const hasBelowCostPerm = await hasPermission("product:discount_below_cost");
        const session = await getSession();
        const isAdmin = session?.level !== undefined && session.level >= 100;

        if (!hasBelowCostPerm && !isAdmin) {
          return {
            success: false,
            code: "FORBIDDEN_BELOW_COST",
            error:
              "Acceso denegado: No posee el permiso atómico [product:discount_below_cost] para autorizar ventas por debajo del costo de reposición.",
          };
        }
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        discountActive: validated.discountActive,
        discountPercentage: new Prisma.Decimal(validated.discountPercentage),
        discountPrice: new Prisma.Decimal(discountPrice),
        discountStartDate: validated.discountStartDate,
        discountEndDate: validated.discountEndDate,
      },
    });

    // Invalidar caché bajo demanda de la landing
    try {
      await revalidateLandingPageData("discount");
    } catch (e) {
      console.warn("No se pudo revalidar caché de landing:", e);
    }

    return {
      success: true,
      data: {
        productId: updated.id,
        productName: updated.name,
        regularPrice,
        discountPercentage: Number(updated.discountPercentage),
        discountPrice: Number(updated.discountPrice),
        discountActive: updated.discountActive,
        discountStartDate: updated.discountStartDate
          ? updated.discountStartDate.toISOString()
          : null,
        discountEndDate: updated.discountEndDate
          ? updated.discountEndDate.toISOString()
          : null,
        isBelowCost,
      },
    };
  } catch (error) {
    console.error("Error en setProductDiscount:", error);
    return {
      success: false,
      error: "Error interno al configurar el descuento del producto.",
    };
  }
}

/**
 * Server Action (RF-27 / Ticket 2): Aplicar descuento masivo por Categoría o Disciplina (Estrategia 2B)
 */
export async function applyCategoryDiscount(
  rawInput: unknown
): Promise<BulkDiscountResult> {
  try {
    const parseResult = CategoryDiscountSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors[0]?.message || "Datos de descuento masivo inválidos",
      };
    }

    const validated = parseResult.data;

    // Verificar permisos si se solicita forzar venta bajo costo
    if (validated.allowBelowCost) {
      const hasBelowCostPerm = await hasPermission("product:discount_below_cost");
      const session = await getSession();
      const isAdmin = session?.level !== undefined && session.level >= 100;
      if (!hasBelowCostPerm && !isAdmin) {
        return {
          success: false,
          code: "FORBIDDEN_BELOW_COST",
          error:
            "Acceso denegado: No posee el permiso [product:discount_below_cost] para aplicar descuentos masivos por debajo del costo.",
        };
      }
    }

    const whereClause: Prisma.ProductWhereInput = {
      active: true,
    };

    if (validated.categoryId) {
      whereClause.categoryId = validated.categoryId;
    }
    if (validated.disciplineId) {
      whereClause.disciplineId = validated.disciplineId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        price: true,
        costPrice: true,
        variants: {
          select: {
            id: true,
            price: true,
          },
        },
      },
    });

    if (products.length === 0) {
      return {
        success: false,
        error: "No se encontraron productos activos con los criterios especificados.",
      };
    }

    const productsToApply: Array<{
      id: string;
      discountPrice: number;
    }> = [];

    const skippedProducts: Array<{
      productId: string;
      productName: string;
      regularPrice: number;
      costPrice: number;
      attemptedDiscountPrice: number;
      reason: string;
    }> = [];

    for (const prod of products) {
      const regularPrice = Number(prod.price);
      const discountAmount =
        Math.round(((regularPrice * validated.discountPercentage) / 100) * 100) / 100;
      const discountPrice = Math.max(
        0,
        Math.round((regularPrice - discountAmount) * 100) / 100
      );

      let violatesCost = false;
      const cost = prod.costPrice !== null ? Number(prod.costPrice) : null;

      if (cost !== null) {
        if (discountPrice < cost) {
          violatesCost = true;
        }

        for (const variant of prod.variants) {
          if (variant.price !== null) {
            const varPrice = Number(variant.price);
            const varDiscount =
              Math.round(((varPrice * validated.discountPercentage) / 100) * 100) / 100;
            const varFinal = Math.max(0, Math.round((varPrice - varDiscount) * 100) / 100);
            if (varFinal < cost) {
              violatesCost = true;
              break;
            }
          }
        }
      }

      if (violatesCost && !validated.allowBelowCost) {
        skippedProducts.push({
          productId: prod.id,
          productName: prod.name,
          regularPrice,
          costPrice: cost ?? 0,
          attemptedDiscountPrice: discountPrice,
          reason: "Precio promocional resultante inferior al costo de reposición",
        });
      } else {
        productsToApply.push({
          id: prod.id,
          discountPrice,
        });
      }
    }

    // Ejecutar actualización atómica en bloque
    if (productsToApply.length > 0) {
      await prisma.$transaction(
        productsToApply.map((p) =>
          prisma.product.update({
            where: { id: p.id },
            data: {
              discountActive: true,
              discountPercentage: new Prisma.Decimal(validated.discountPercentage),
              discountPrice: new Prisma.Decimal(p.discountPrice),
              discountStartDate: validated.discountStartDate,
              discountEndDate: validated.discountEndDate,
            },
          })
        )
      );

      try {
        await revalidateLandingPageData("discount");
      } catch (e) {
        console.warn("No se pudo revalidar caché de landing tras descuento masivo:", e);
      }
    }

    return {
      success: true,
      data: {
        totalEvaluated: products.length,
        appliedCount: productsToApply.length,
        skippedCount: skippedProducts.length,
        skippedProducts,
      },
    };
  } catch (error) {
    console.error("Error en applyCategoryDiscount:", error);
    return {
      success: false,
      error: "Error interno al aplicar el descuento masivo.",
    };
  }
}

/**
 * Server Action (RF-27 / Ticket 2): Revertir masivamente ofertas por Categoría o Disciplina
 */
export async function removeCategoryDiscount(
  rawInput: unknown
): Promise<RemoveBulkDiscountResult> {
  try {
    const parseResult = RemoveCategoryDiscountSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors[0]?.message || "Criterios de reversión inválidos",
      };
    }

    const validated = parseResult.data;

    const whereClause: Prisma.ProductWhereInput = {
      discountActive: true,
    };

    if (validated.categoryId) {
      whereClause.categoryId = validated.categoryId;
    }
    if (validated.disciplineId) {
      whereClause.disciplineId = validated.disciplineId;
    }

    const updateRes = await prisma.product.updateMany({
      where: whereClause,
      data: {
        discountActive: false,
        discountPercentage: null,
        discountPrice: null,
        discountStartDate: null,
        discountEndDate: null,
      },
    });

    try {
      await revalidateLandingPageData("discount");
    } catch (e) {
      console.warn("No se pudo revalidar caché de landing tras reversión masiva:", e);
    }

    return {
      success: true,
      count: updateRes.count,
    };
  } catch (error) {
    console.error("Error en removeCategoryDiscount:", error);
    return {
      success: false,
      error: "Error interno al revertir las promociones del rubro.",
    };
  }
}

/**
 * Server Action (RF-27 / Ticket 5): Obtener lista de campañas y productos en promoción para el panel admin
 */
export async function getPromoCampaigns(filter?: "all" | "active" | "scheduled" | "expired" | "paused") {
  try {
    const now = new Date();
    const whereClause: Prisma.ProductWhereInput = {
      OR: [
        { discountActive: true },
        { discountPercentage: { not: null } },
      ],
    };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        discipline: { select: { id: true, name: true } },
      },
      orderBy: [
        { updatedAt: "desc" },
        { name: "asc" },
      ],
    });

    const campaigns = products.map((p) => {
      const regularPrice = Number(p.price);
      const costPrice = p.costPrice !== null ? Number(p.costPrice) : null;
      const discountPct = p.discountPercentage !== null ? Number(p.discountPercentage) : 0;
      const discountPrice = p.discountPrice !== null ? Number(p.discountPrice) : regularPrice;

      let status: "ACTIVA" | "PROGRAMADA" | "EXPIRADA" | "PAUSADA" = "PAUSADA";
      if (!p.discountActive) {
        status = "PAUSADA";
      } else if (p.discountStartDate && p.discountStartDate > now) {
        status = "PROGRAMADA";
      } else if (p.discountEndDate && p.discountEndDate < now) {
        status = "EXPIRADA";
      } else {
        status = "ACTIVA";
      }

      let marginPercentage: number | null = null;
      if (costPrice !== null && costPrice > 0) {
        marginPercentage =
          Math.round((((discountPrice - costPrice) / costPrice) * 100) * 10) / 10;
      }

      return {
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        categoryName: p.category.name,
        brandName: p.brand.name,
        disciplineName: p.discipline.name,
        regularPrice,
        costPrice,
        discountPercentage: discountPct,
        discountPrice,
        discountActive: p.discountActive,
        discountStartDate: p.discountStartDate?.toISOString() || null,
        discountEndDate: p.discountEndDate?.toISOString() || null,
        status,
        marginPercentage,
        isBelowCost: costPrice !== null ? discountPrice < costPrice : false,
      };
    });

    if (!filter || filter === "all") {
      return { success: true, data: campaigns };
    }

    const filtered = campaigns.filter((c) => {
      if (filter === "active") return c.status === "ACTIVA";
      if (filter === "scheduled") return c.status === "PROGRAMADA";
      if (filter === "expired") return c.status === "EXPIRADA";
      if (filter === "paused") return c.status === "PAUSADA";
      return true;
    });

    return { success: true, data: filtered };
  } catch (error) {
    console.error("Error en getPromoCampaigns:", error);
    return {
      success: false,
      error: "Error interno al cargar el listado de promociones.",
    };
  }
}
