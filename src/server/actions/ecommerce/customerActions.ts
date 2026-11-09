"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  CustomerRegisterSchema,
  CustomerLoginSchema,
  CustomerProfileUpdateSchema,
  ToggleFavoriteSchema,
  SyncGuestFavoritesSchema,
  PublicOrderTrackSchema,
  UpdateOrderShippingStatusSchema,
  type CustomerRegisterInput,
  type CustomerLoginInput,
  type CustomerProfileUpdateInput,
  type PublicOrderTrackInput,
  type UpdateOrderShippingStatusInput,
  type ShippingStatusType,
} from "@/schemas/customer";
import {
  encryptCustomerSession,
  setCustomerSessionCookie,
  deleteCustomerSessionCookie,
  getCustomerSession,
} from "@/lib/customerSession";
import {
  sendOrderShippingUpdateEmail,
  CORREO_ARGENTINO_TRACKING_URL,
} from "@/lib/emailService";
import { revalidateEcommerceCatalogCache } from "./catalogActions";
import { formatCurrency } from "@/lib/utils";

export interface CustomerProfileDTO {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  dni: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  isGoogleLinked: boolean;
  defaultAddress: string | null;
  defaultCity: string | null;
  defaultPostalCode: string | null;
  favoriteProductIds: string[];
  createdAt: string;
}

export interface CustomerFavoriteItemDTO {
  productId: string;
  name: string;
  brandName: string;
  categoryName: string;
  disciplineName: string;
  price: number;
  priceFormatted: string;
  imageUrl: string | null;
  availableStock: number;
  isAvailable: boolean;
  addedAt: string;
  whatsappInquiryUrl: string;
}

export interface CustomerOrderItemDTO {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  brandName: string;
  imageUrl: string | null;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerOrderDetailDTO {
  id: string;
  orderCode: string;
  channel: "WEB";
  status:
    | "PENDIENTE_PAGO"
    | "PENDIENTE_VERIFICACION"
    | "COMPLETADA"
    | "CANCELADA";
  shippingStatus: ShippingStatusType;
  shippingMethod: string;
  shippingTrackingCode: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingCost: number;
  subtotalProducts: number;
  discount: number;
  total: number;
  totalFormatted: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerDni: string | null;
  canSelfCancel: boolean;
  transferProofUrl?: string | null;
  reconciliationNotes?: string | null;
  correoArgentinoTrackingUrl: string | null;
  whatsappSupportUrl: string;
  createdAt: string;
  createdAtFormatted: string;
  items: CustomerOrderItemDTO[];
}

function formatArgentinaDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

function buildWhatsappOrderSupportUrl(
  orderCode: string,
  customerName: string | null,
  shippingMethod: string | null
): string {
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5493704000000";
  const methodText =
    shippingMethod === "CADETERIA_FORMOSA"
      ? "envío por cadetería en Formosa Capital"
      : shippingMethod === "CORREO_ARGENTINO"
        ? "envío por Correo Argentino"
        : "retiro en local físico";
  const text = encodeURIComponent(
    `¡Hola Matacos Deportes! Consulto por mi pedido web *${orderCode}*${customerName ? ` a nombre de ${customerName}` : ""} (${methodText}).`
  );
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}

/**
 * 1. Registro de Cliente Web con hashing bcryptjs, migración de favoritos locales
 *    y vinculación retroactiva de órdenes web previas hechas como invitado.
 */
export async function registerCustomerAction(
  input: CustomerRegisterInput
): Promise<{
  success: boolean;
  data?: {
    customer: CustomerProfileDTO;
    linkedOrdersCount: number;
    migratedFavoritesCount: number;
    token: string;
  };
  error?: string;
}> {
  try {
    const parsed = CustomerRegisterSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Datos de registro inválidos",
      };
    }

    const data = parsed.data;
    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return {
        success: false,
        error:
          "Ya existe una cuenta registrada con este correo electrónico. Iniciá sesión para continuar.",
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const txResult = await prisma.$transaction(async (tx) => {
      // 1.1 Crear registro en tabla Customer
      const createdCustomer = await tx.customer.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: data.name.trim(),
          phone: data.phone ? data.phone.trim() : null,
          dni: data.dni ? data.dni.trim() : null,
          defaultAddress: data.defaultAddress
            ? data.defaultAddress.trim()
            : null,
          defaultCity: data.defaultCity || "Formosa",
          defaultPostalCode: data.defaultPostalCode || "3600",
        },
      });

      // 1.2 Vinculación retroactiva de órdenes web previas como invitado (SPEC-RF29 #5)
      const linkedOrders = await tx.sale.updateMany({
        where: {
          channel: "WEB",
          customerId: null,
          customerEmail: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
        data: {
          customerId: createdCustomer.id,
        },
      });

      // 1.3 Migración atómica de favoritos guardados en modo visitante (SPEC-RF29 #4 y #5)
      let migratedFavoritesCount = 0;
      const rawGuestFavs = Array.from(new Set(data.guestFavorites || []));
      if (rawGuestFavs.length > 0) {
        const validProducts = await tx.product.findMany({
          where: { id: { in: rawGuestFavs } },
          select: { id: true },
        });

        if (validProducts.length > 0) {
          const createdFavs = await tx.favorite.createMany({
            data: validProducts.map((p) => ({
              customerId: createdCustomer.id,
              productId: p.id,
            })),
            skipDuplicates: true,
          });
          migratedFavoritesCount = createdFavs.count;
        }
      }

      const favorites = await tx.favorite.findMany({
        where: { customerId: createdCustomer.id },
        select: { productId: true },
        orderBy: { createdAt: "desc" },
      });

      return {
        customer: createdCustomer,
        favoriteProductIds: favorites.map((f) => f.productId),
        linkedOrdersCount: linkedOrders.count,
        migratedFavoritesCount,
      };
    });

    const token = await encryptCustomerSession({
      customerId: txResult.customer.id,
      email: txResult.customer.email,
      name: txResult.customer.name,
      role: "CUSTOMER",
    });

    await setCustomerSessionCookie(token);

    return {
      success: true,
      data: {
        customer: {
          id: txResult.customer.id,
          email: txResult.customer.email,
          name: txResult.customer.name,
          phone: txResult.customer.phone,
          dni: txResult.customer.dni,
          avatarUrl: txResult.customer.avatarUrl,
          hasPassword: Boolean(txResult.customer.password),
          isGoogleLinked: Boolean(txResult.customer.googleId),
          defaultAddress: txResult.customer.defaultAddress,
          defaultCity: txResult.customer.defaultCity,
          defaultPostalCode: txResult.customer.defaultPostalCode,
          favoriteProductIds: txResult.favoriteProductIds,
          createdAt: txResult.customer.createdAt.toISOString(),
        },
        linkedOrdersCount: txResult.linkedOrdersCount,
        migratedFavoritesCount: txResult.migratedFavoritesCount,
        token,
      },
    };
  } catch (error) {
    console.error("Error en registerCustomerAction:", error);
    return {
      success: false,
      error: "Ocurrió un error al registrar tu cuenta. Intentá nuevamente.",
    };
  }
}

/**
 * 2. Inicio de Sesión de Cliente Web (Email + Contraseña) con sincronización de favoritos locales
 */
export async function loginCustomerAction(
  input: CustomerLoginInput
): Promise<{
  success: boolean;
  data?: {
    customer: CustomerProfileDTO;
    linkedOrdersCount: number;
    migratedFavoritesCount: number;
    token: string;
  };
  error?: string;
}> {
  try {
    const parsed = CustomerLoginSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Credenciales de ingreso inválidas",
      };
    }

    const { email, password, guestFavorites } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      return {
        success: false,
        error: "Correo electrónico o contraseña incorrectos",
      };
    }

    if (!customer.password) {
      return {
        success: false,
        error:
          "Esta cuenta fue creada con Google. Por favor ingresá usando el botón «Continuar con Google».",
      };
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Correo electrónico o contraseña incorrectos",
      };
    }

    const txResult = await prisma.$transaction(async (tx) => {
      // Vincular órdenes web huérfanas con el mismo email
      const linkedOrders = await tx.sale.updateMany({
        where: {
          channel: "WEB",
          customerId: null,
          customerEmail: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
        data: {
          customerId: customer.id,
        },
      });

      // Migrar favoritos del navegador si existen
      let migratedFavoritesCount = 0;
      const uniqueGuestFavs = Array.from(new Set(guestFavorites || []));
      if (uniqueGuestFavs.length > 0) {
        const validProducts = await tx.product.findMany({
          where: { id: { in: uniqueGuestFavs } },
          select: { id: true },
        });

        if (validProducts.length > 0) {
          const inserted = await tx.favorite.createMany({
            data: validProducts.map((p) => ({
              customerId: customer.id,
              productId: p.id,
            })),
            skipDuplicates: true,
          });
          migratedFavoritesCount = inserted.count;
        }
      }

      const favorites = await tx.favorite.findMany({
        where: { customerId: customer.id },
        select: { productId: true },
        orderBy: { createdAt: "desc" },
      });

      return {
        favoriteProductIds: favorites.map((f) => f.productId),
        linkedOrdersCount: linkedOrders.count,
        migratedFavoritesCount,
      };
    });

    const token = await encryptCustomerSession({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      role: "CUSTOMER",
    });

    await setCustomerSessionCookie(token);

    return {
      success: true,
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          dni: customer.dni,
          avatarUrl: customer.avatarUrl,
          hasPassword: Boolean(customer.password),
          isGoogleLinked: Boolean(customer.googleId),
          defaultAddress: customer.defaultAddress,
          defaultCity: customer.defaultCity,
          defaultPostalCode: customer.defaultPostalCode,
          favoriteProductIds: txResult.favoriteProductIds,
          createdAt: customer.createdAt.toISOString(),
        },
        linkedOrdersCount: txResult.linkedOrdersCount,
        migratedFavoritesCount: txResult.migratedFavoritesCount,
        token,
      },
    };
  } catch (error) {
    console.error("Error en loginCustomerAction:", error);
    return {
      success: false,
      error: "Ocurrió un error al iniciar sesión. Intentá nuevamente.",
    };
  }
}

/**
 * 3. Autenticación / Registro con Google OAuth
 */
export async function loginOrRegisterGoogleCustomer(params: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  guestFavorites?: string[];
}): Promise<{
  success: boolean;
  data?: {
    customer: CustomerProfileDTO;
    token: string;
  };
  error?: string;
}> {
  try {
    const normalizedEmail = params.email.trim().toLowerCase();

    const txResult = await prisma.$transaction(async (tx) => {
      let customer = await tx.customer.findFirst({
        where: {
          OR: [{ googleId: params.googleId }, { email: normalizedEmail }],
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            email: normalizedEmail,
            googleId: params.googleId,
            name: params.name.trim() || normalizedEmail.split("@")[0] || "Cliente",
            avatarUrl: params.avatarUrl ?? null,
            password: null,
          },
        });
      } else if (!customer.googleId || customer.avatarUrl !== params.avatarUrl) {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            googleId: customer.googleId || params.googleId,
            avatarUrl: params.avatarUrl ?? customer.avatarUrl,
          },
        });
      }

      // Vincular retroactivamente compras hechas como invitado con ese mismo email
      await tx.sale.updateMany({
        where: {
          channel: "WEB",
          customerId: null,
          customerEmail: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
        data: {
          customerId: customer.id,
        },
      });

      // Migrar favoritos si se enviaron
      const uniqueFavs = Array.from(new Set(params.guestFavorites || []));
      if (uniqueFavs.length > 0) {
        const validProducts = await tx.product.findMany({
          where: { id: { in: uniqueFavs } },
          select: { id: true },
        });
        if (validProducts.length > 0) {
          await tx.favorite.createMany({
            data: validProducts.map((p) => ({
              customerId: customer.id,
              productId: p.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      const favorites = await tx.favorite.findMany({
        where: { customerId: customer.id },
        select: { productId: true },
        orderBy: { createdAt: "desc" },
      });

      return {
        customer,
        favoriteProductIds: favorites.map((f) => f.productId),
      };
    });

    const token = await encryptCustomerSession({
      customerId: txResult.customer.id,
      email: txResult.customer.email,
      name: txResult.customer.name,
      role: "CUSTOMER",
    });

    await setCustomerSessionCookie(token);

    return {
      success: true,
      data: {
        customer: {
          id: txResult.customer.id,
          email: txResult.customer.email,
          name: txResult.customer.name,
          phone: txResult.customer.phone,
          dni: txResult.customer.dni,
          avatarUrl: txResult.customer.avatarUrl,
          hasPassword: Boolean(txResult.customer.password),
          isGoogleLinked: Boolean(txResult.customer.googleId),
          defaultAddress: txResult.customer.defaultAddress,
          defaultCity: txResult.customer.defaultCity,
          defaultPostalCode: txResult.customer.defaultPostalCode,
          favoriteProductIds: txResult.favoriteProductIds,
          createdAt: txResult.customer.createdAt.toISOString(),
        },
        token,
      },
    };
  } catch (error) {
    console.error("Error en loginOrRegisterGoogleCustomer:", error);
    return {
      success: false,
      error: "No se pudo autenticar con Google",
    };
  }
}

/**
 * 4. Cerrar Sesión de Cliente Web
 */
export async function logoutCustomerAction(): Promise<{ success: boolean }> {
  try {
    await deleteCustomerSessionCookie();
    return { success: true };
  } catch (error) {
    console.error("Error en logoutCustomerAction:", error);
    return { success: false };
  }
}

/**
 * 5. Obtener el perfil del cliente autenticado actual
 */
export async function getCurrentCustomerAction(): Promise<{
  success: boolean;
  data: CustomerProfileDTO | null;
}> {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return { success: true, data: null };
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      include: {
        favorites: {
          select: { productId: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        dni: customer.dni,
        avatarUrl: customer.avatarUrl,
        hasPassword: Boolean(customer.password),
        isGoogleLinked: Boolean(customer.googleId),
        defaultAddress: customer.defaultAddress,
        defaultCity: customer.defaultCity,
        defaultPostalCode: customer.defaultPostalCode,
        favoriteProductIds: customer.favorites.map((f) => f.productId),
        createdAt: customer.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error en getCurrentCustomerAction:", error);
    return { success: false, data: null };
  }
}

/**
 * 6. Actualizar datos de contacto y libreta de dirección predeterminada del cliente
 */
export async function updateCustomerProfileAction(
  input: CustomerProfileUpdateInput
): Promise<{
  success: boolean;
  data?: CustomerProfileDTO;
  error?: string;
}> {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return {
        success: false,
        error: "Debés iniciar sesión para actualizar tu perfil",
      };
    }

    const parsed = CustomerProfileUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Datos de perfil inválidos",
      };
    }

    const data = parsed.data;

    const updated = await prisma.customer.update({
      where: { id: session.customerId },
      data: {
        name: data.name.trim(),
        phone: data.phone ? data.phone.trim() : null,
        dni: data.dni ? data.dni.trim() : null,
        defaultAddress: data.defaultAddress ? data.defaultAddress.trim() : null,
        defaultCity: data.defaultCity.trim(),
        defaultPostalCode: data.defaultPostalCode.trim(),
      },
      include: {
        favorites: {
          select: { productId: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Actualizar cookie con el nombre nuevo si cambió
    const token = await encryptCustomerSession({
      customerId: updated.id,
      email: updated.email,
      name: updated.name,
      role: "CUSTOMER",
    });
    await setCustomerSessionCookie(token);

    return {
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        dni: updated.dni,
        avatarUrl: updated.avatarUrl,
        hasPassword: Boolean(updated.password),
        isGoogleLinked: Boolean(updated.googleId),
        defaultAddress: updated.defaultAddress,
        defaultCity: updated.defaultCity,
        defaultPostalCode: updated.defaultPostalCode,
        favoriteProductIds: updated.favorites.map((f) => f.productId),
        createdAt: updated.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error en updateCustomerProfileAction:", error);
    return {
      success: false,
      error: "No se pudo actualizar tu información de perfil",
    };
  }
}

/**
 * 7. Alternar un producto en la Lista de Favoritos (Wishlist) del cliente autenticado
 */
export async function toggleCustomerFavoriteAction(
  productId: string
): Promise<{
  success: boolean;
  data?: {
    added: boolean;
    productId: string;
    favoriteProductIds: string[];
  };
  error?: string;
}> {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return {
        success: false,
        error: "Debés iniciar sesión para guardar favoritos en tu cuenta",
      };
    }

    const parsed = ToggleFavoriteSchema.safeParse({ productId });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "ID de producto inválido",
      };
    }

    const cleanProductId = parsed.data.productId;

    const existing = await prisma.favorite.findUnique({
      where: {
        customerId_productId: {
          customerId: session.customerId,
          productId: cleanProductId,
        },
      },
    });

    let added = false;
    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      added = false;
    } else {
      const productExists = await prisma.product.findUnique({
        where: { id: cleanProductId },
        select: { id: true },
      });

      if (!productExists) {
        return {
          success: false,
          error: "El producto seleccionado no existe en el catálogo",
        };
      }

      await prisma.favorite.create({
        data: {
          customerId: session.customerId,
          productId: cleanProductId,
        },
      });
      added = true;
    }

    const allFavorites = await prisma.favorite.findMany({
      where: { customerId: session.customerId },
      select: { productId: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: {
        added,
        productId: cleanProductId,
        favoriteProductIds: allFavorites.map((f) => f.productId),
      },
    };
  } catch (error) {
    console.error("Error en toggleCustomerFavoriteAction:", error);
    return {
      success: false,
      error: "No se pudo actualizar tu lista de favoritos",
    };
  }
}

/**
 * 8. Sincronizar lista de favoritos de invitado (localStorage) hacia PostgreSQL
 */
export async function syncGuestFavoritesAction(
  productIds: string[]
): Promise<{
  success: boolean;
  data?: {
    migratedCount: number;
    favoriteProductIds: string[];
  };
  error?: string;
}> {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return {
        success: false,
        error: "Sesión de cliente requerida para sincronizar favoritos",
      };
    }

    const parsed = SyncGuestFavoritesSchema.safeParse({ productIds });
    if (!parsed.success) {
      return {
        success: false,
        error: "Lista de productos inválida",
      };
    }

    const uniqueIds = Array.from(new Set(parsed.data.productIds));
    let migratedCount = 0;

    if (uniqueIds.length > 0) {
      const validProducts = await prisma.product.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });

      if (validProducts.length > 0) {
        const res = await prisma.favorite.createMany({
          data: validProducts.map((p) => ({
            customerId: session.customerId,
            productId: p.id,
          })),
          skipDuplicates: true,
        });
        migratedCount = res.count;
      }
    }

    const allFavorites = await prisma.favorite.findMany({
      where: { customerId: session.customerId },
      select: { productId: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: {
        migratedCount,
        favoriteProductIds: allFavorites.map((f) => f.productId),
      },
    };
  } catch (error) {
    console.error("Error en syncGuestFavoritesAction:", error);
    return {
      success: false,
      error: "Error al sincronizar favoritos con tu cuenta",
    };
  }
}

/**
 * 9. Obtener el detalle enriquecido de productos en Favoritos (con stock real y sin costPrice)
 */
export async function getCustomerFavoritesDetailsAction(
  guestProductIds?: string[]
): Promise<{
  success: boolean;
  data?: CustomerFavoriteItemDTO[];
  error?: string;
}> {
  try {
    const session = await getCustomerSession();
    let targetIds: string[] = [];
    const addedAtMap = new Map<string, Date>();

    if (session) {
      const dbFavs = await prisma.favorite.findMany({
        where: { customerId: session.customerId },
        orderBy: { createdAt: "desc" },
        select: { productId: true, createdAt: true },
      });
      targetIds = dbFavs.map((f) => f.productId);
      dbFavs.forEach((f) => addedAtMap.set(f.productId, f.createdAt));
    } else if (guestProductIds && guestProductIds.length > 0) {
      targetIds = Array.from(new Set(guestProductIds));
    }

    if (targetIds.length === 0) {
      return { success: true, data: [] };
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: targetIds },
        active: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        createdAt: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        discipline: { select: { name: true } },
        images: {
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
          take: 1,
          select: { url: true },
        },
        variants: {
          select: {
            stockStore: true,
            stockWarehouse: true,
            stockReserved: true,
          },
        },
      },
    });

    const whatsappNumber =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5493704000000";

    const productMap = new Map(products.map((p) => [p.id, p]));
    const result: CustomerFavoriteItemDTO[] = [];

    for (const pid of targetIds) {
      const p = productMap.get(pid);
      if (!p) continue;

      const availableStock = p.variants.reduce((acc, v) => {
        const net = Math.max(
          0,
          v.stockStore + v.stockWarehouse - v.stockReserved
        );
        return acc + net;
      }, 0);

      const priceNum = Number(p.price);
      const inquiryText = encodeURIComponent(
        `¡Hola Matacos Deportes! Quería consultar cuándo vuelve a ingresar stock del artículo "${p.name}" (${p.brand.name}).`
      );

      result.push({
        productId: p.id,
        name: p.name,
        brandName: p.brand.name,
        categoryName: p.category.name,
        disciplineName: p.discipline.name,
        price: priceNum,
        priceFormatted: formatCurrency(priceNum),
        imageUrl: p.imageUrl || p.images[0]?.url || null,
        availableStock,
        isAvailable: availableStock > 0,
        addedAt: (addedAtMap.get(p.id) || p.createdAt).toISOString(),
        whatsappInquiryUrl: `https://wa.me/${whatsappNumber}?text=${inquiryText}`,
      });
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error en getCustomerFavoritesDetailsAction:", error);
    return {
      success: false,
      error: "No se pudieron cargar tus productos favoritos",
    };
  }
}

/**
 * Helper interno para transformar una entidad Sale de Prisma en CustomerOrderDetailDTO
 */
function mapSaleToOrderDetailDTO(sale: {
  id: string;
  invoiceNumber: string | null;
  ticketCode: string | null;
  status:
    | "PENDIENTE_PAGO"
    | "PENDIENTE_VERIFICACION"
    | "COMPLETADA"
    | "CANCELADA";
  shippingStatus: ShippingStatusType;
  shippingMethod: string | null;
  shippingTrackingCode: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingCost: unknown;
  subtotalGross: unknown;
  discount: unknown;
  total: unknown;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerDni: string | null;
  transferProofUrl?: string | null;
  reconciliationNotes?: string | null;
  createdAt: Date;
  items: Array<{
    id: string;
    variantId: string;
    quantity: number;
    unitPrice: unknown;
    subtotal: unknown;
    variant: {
      size: string;
      color: string;
      sku: string;
      product: {
        id: string;
        name: string;
        imageUrl: string | null;
        brand: { name: string };
      };
    };
  }>;
}): CustomerOrderDetailDTO {
  const orderCode =
    sale.invoiceNumber || sale.ticketCode || sale.id.slice(0, 8).toUpperCase();
  const totalNum = Number(sale.total);
  const shippingCostNum = Number(sale.shippingCost ?? 0);
  const subtotalNum = Number(sale.subtotalGross ?? 0);
  const discountNum = Number(sale.discount ?? 0);

  const effectiveShippingStatus: ShippingStatusType =
    sale.status === "CANCELADA" ? "CANCELADO" : sale.shippingStatus;

  const correoUrl =
    sale.shippingMethod === "CORREO_ARGENTINO" && sale.shippingTrackingCode
      ? CORREO_ARGENTINO_TRACKING_URL
      : null;

  return {
    id: sale.id,
    orderCode,
    channel: "WEB",
    status: sale.status,
    shippingStatus: effectiveShippingStatus,
    shippingMethod: sale.shippingMethod || "RETIRO_LOCAL",
    shippingTrackingCode: sale.shippingTrackingCode,
    shippingAddress: sale.shippingAddress,
    shippingCity: sale.shippingCity,
    shippingPostalCode: sale.shippingPostalCode,
    shippingCost: shippingCostNum,
    subtotalProducts: subtotalNum,
    discount: discountNum,
    total: totalNum,
    totalFormatted: formatCurrency(totalNum),
    customerName: sale.customerName,
    customerEmail: sale.customerEmail,
    customerPhone: sale.customerPhone,
    customerDni: sale.customerDni,
    canSelfCancel: sale.status === "PENDIENTE_PAGO",
    transferProofUrl: sale.transferProofUrl ?? null,
    reconciliationNotes: sale.reconciliationNotes ?? null,
    correoArgentinoTrackingUrl: correoUrl,
    whatsappSupportUrl: buildWhatsappOrderSupportUrl(
      orderCode,
      sale.customerName,
      sale.shippingMethod
    ),
    createdAt: sale.createdAt.toISOString(),
    createdAtFormatted: formatArgentinaDateTime(sale.createdAt),
    items: sale.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productId: item.variant.product.id,
      productName: item.variant.product.name,
      brandName: item.variant.product.brand.name,
      imageUrl: item.variant.product.imageUrl,
      size: item.variant.size,
      color: item.variant.color,
      sku: item.variant.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  };
}

/**
 * 10. Obtener el historial y estado de pedidos del cliente autenticado
 *     REGLA CRÍTICA (SPEC-RF29 #6): Filtra estrictamente por `customerId == session.customerId` Y `channel == "WEB"`.
 *     Las ventas presenciales (`channel == "MOSTRADOR"`) están excluidas del portal web.
 */
export async function getCustomerOrdersAction(): Promise<{
  success: boolean;
  data?: CustomerOrderDetailDTO[];
  error?: string;
}> {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return {
        success: false,
        error: "Debés iniciar sesión para consultar tus pedidos",
      };
    }

    // Asegurar que cualquier compra web hecha como invitado con su mismo correo se vincule
    await prisma.sale.updateMany({
      where: {
        channel: "WEB",
        customerId: null,
        customerEmail: {
          equals: session.email,
          mode: "insensitive",
        },
      },
      data: {
        customerId: session.customerId,
      },
    });

    const sales = await prisma.sale.findMany({
      where: {
        customerId: session.customerId,
        channel: "WEB",
      },
      orderBy: {
        createdAt: "desc",
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
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: sales.map(mapSaleToOrderDetailDTO),
    };
  } catch (error) {
    console.error("Error en getCustomerOrdersAction:", error);
    return {
      success: false,
      error: "No se pudieron obtener tus pedidos",
    };
  }
}

/**
 * 11. Buscador Público de Seguimiento de Pedido para Invitados (sin necesidad de cuenta)
 *     Exige el Código de Orden (`WEB-2026-XXXX`) + Verificación (`Email` o `DNI` del comprador)
 *     para proteger la privacidad de los datos de envío.
 */
export async function trackPublicWebOrderAction(
  input: PublicOrderTrackInput
): Promise<{
  success: boolean;
  data?: CustomerOrderDetailDTO;
  error?: string;
}> {
  try {
    const parsed = PublicOrderTrackSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Ingresá un código de pedido y tu correo o DNI",
      };
    }

    const cleanCode = parsed.data.orderCode.trim().toUpperCase();
    const cleanVerification = parsed.data.verification.trim().toLowerCase();
    const cleanDigits = cleanVerification.replace(/\D/g, "");

    const sale = await prisma.sale.findFirst({
      where: {
        channel: "WEB",
        OR: [
          { invoiceNumber: { equals: cleanCode, mode: "insensitive" } },
          { ticketCode: { equals: cleanCode, mode: "insensitive" } },
        ],
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return {
        success: false,
        error:
          "No encontramos un pedido web con ese código o los datos de verificación no coinciden.",
      };
    }

    const emailMatches =
      Boolean(sale.customerEmail) &&
      sale.customerEmail!.trim().toLowerCase() === cleanVerification;

    const saleDniDigits = (sale.customerDni || "").replace(/\D/g, "");
    const dniMatches =
      cleanDigits.length >= 7 &&
      saleDniDigits.length >= 7 &&
      saleDniDigits === cleanDigits;

    if (!emailMatches && !dniMatches) {
      return {
        success: false,
        error:
          "No encontramos un pedido web con ese código o los datos de verificación (Email/DNI) no coinciden.",
      };
    }

    return {
      success: true,
      data: mapSaleToOrderDetailDTO(sale),
    };
  } catch (error) {
    console.error("Error en trackPublicWebOrderAction:", error);
    return {
      success: false,
      error: "No se pudo consultar el seguimiento del pedido",
    };
  }
}

/**
 * 12. Autogestión: Cancelación de una orden en estado PENDIENTE_PAGO por el propio cliente
 *     Libera atómicamente el stockReserved en cada variante (User Story 22 y Escenario Test 8).
 */
export async function cancelCustomerOrderAction(
  saleId: string,
  reason = "Cancelado por el cliente desde Mi Cuenta"
): Promise<{
  success: boolean;
  data?: CustomerOrderDetailDTO;
  error?: string;
}> {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return {
        success: false,
        error: "Debés iniciar sesión para cancelar un pedido",
      };
    }

    const cleanSaleId = saleId.trim();
    if (!cleanSaleId) {
      return { success: false, error: "Identificador de pedido requerido" };
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: {
          id: cleanSaleId,
          customerId: session.customerId,
          channel: "WEB",
        },
        include: {
          items: true,
        },
      });

      if (!sale) {
        throw new Error("Pedido no encontrado en tu cuenta");
      }

      if (sale.status !== "PENDIENTE_PAGO") {
        throw new Error(
          "Solo se pueden cancelar automáticamente pedidos pendientes de pago. Para pedidos ya abonados, contactanos por WhatsApp."
        );
      }

      // Liberar stockReserved de cada variante
      for (const item of sale.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { id: true, stockReserved: true },
        });

        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stockReserved: Math.max(0, variant.stockReserved - item.quantity),
            },
          });
        }
      }

      return tx.sale.update({
        where: { id: sale.id },
        data: {
          status: "CANCELADA",
          shippingStatus: "CANCELADO",
          notes: sale.notes ? `${sale.notes} | ${reason}` : reason,
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
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    await revalidateEcommerceCatalogCache();

    return {
      success: true,
      data: mapSaleToOrderDetailDTO(updatedSale),
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "No se pudo cancelar el pedido",
    };
  }
}

/**
 * 13. Actualizar el estado logístico de envío y código de guía (ej. Correo Argentino)
 *     y disparar correo transaccional al comprador (con o sin cuenta).
 */
export async function updateWebOrderShippingStatusAction(
  input: UpdateOrderShippingStatusInput
): Promise<{
  success: boolean;
  data?: CustomerOrderDetailDTO;
  emailDispatched?: boolean;
  error?: string;
}> {
  try {
    const parsed = UpdateOrderShippingStatusSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Datos de estado logístico inválidos",
      };
    }

    const { saleId, shippingStatus, shippingTrackingCode } = parsed.data;

    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        shippingStatus,
        shippingTrackingCode: shippingTrackingCode
          ? shippingTrackingCode.trim()
          : null,
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
                  },
                },
              },
            },
          },
        },
      },
    });

    const dto = mapSaleToOrderDetailDTO(updatedSale);

    let emailDispatched = false;
    if (updatedSale.customerEmail) {
      const emailRes = await sendOrderShippingUpdateEmail({
        to: updatedSale.customerEmail,
        customerName: updatedSale.customerName || "Cliente",
        orderCode: dto.orderCode,
        shippingStatus,
        shippingMethod: updatedSale.shippingMethod || "RETIRO_LOCAL",
        shippingTrackingCode: updatedSale.shippingTrackingCode,
      });
      emailDispatched = emailRes.sent;
    }

    return {
      success: true,
      data: dto,
      emailDispatched,
    };
  } catch (error) {
    console.error("Error en updateWebOrderShippingStatusAction:", error);
    return {
      success: false,
      error: "No se pudo actualizar el estado logístico del pedido",
    };
  }
}
