import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface PosSearchResultItem {
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  barcode: string | null;
  sku: string;
  price: number;
  stockStore: number;
  stockWarehouse: number;
  stockReserved: number;
  stockAvailable: number;
  imageUrl: string | null;
}

export interface PosSearchResponse {
  exactMatch: boolean;
  count: number;
  query: string;
  durationMs: number;
  items: PosSearchResultItem[];
}

/**
 * Endpoint de Búsqueda Ágil en Mostrador (RF-07)
 * Diseñado para respuesta < 50ms con escaneo instantáneo de lector USB y predictivo por texto.
 */
export async function GET(req: NextRequest) {
  const startTime = performance.now();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json<PosSearchResponse>({
      exactMatch: false,
      count: 0,
      query: "",
      durationMs: 0,
      items: [],
    });
  }

  try {
    // 1. Detección de Código de Barras USB o SKU exacto (Tiempo < 20ms)
    const exactVariant = await prisma.productVariant.findFirst({
      where: {
        OR: [{ barcode: q }, { sku: q }],
        product: { active: true },
      },
      select: {
        id: true,
        size: true,
        color: true,
        sku: true,
        barcode: true,
        stockStore: true,
        stockWarehouse: true,
        stockReserved: true,
        price: true,
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    });

    if (exactVariant) {
      const effectivePrice = Number(exactVariant.price ?? exactVariant.product.price);
      const stockAvailable = Math.max(0, exactVariant.stockStore - exactVariant.stockReserved);
      const durationMs = Math.round(performance.now() - startTime);

      const items: PosSearchResultItem[] = [
        {
          variantId: exactVariant.id,
          productId: exactVariant.product.id,
          name: exactVariant.product.name,
          brand: exactVariant.product.brand.name,
          category: exactVariant.product.category.name,
          size: exactVariant.size,
          color: exactVariant.color,
          barcode: exactVariant.barcode,
          sku: exactVariant.sku,
          price: effectivePrice,
          stockStore: exactVariant.stockStore,
          stockWarehouse: exactVariant.stockWarehouse,
          stockReserved: exactVariant.stockReserved,
          stockAvailable,
          imageUrl: exactVariant.product.imageUrl,
        },
      ];

      return NextResponse.json<PosSearchResponse>(
        {
          exactMatch: true,
          count: 1,
          query: q,
          durationMs,
          items,
        },
        {
          headers: {
            "Server-Timing": `search;dur=${durationMs}`,
            "Cache-Control": "private, no-cache",
          },
        }
      );
    }

    // 2. Búsqueda Predictiva por Nombre, Marca, Categoría, Color, Talle o SKU (Top 20)
    const terms = q.split(/\s+/).filter(Boolean);
    const variants = await prisma.productVariant.findMany({
      where: {
        product: { active: true },
        ...(terms.length === 1
          ? {
              OR: [
                { product: { name: { contains: q, mode: "insensitive" } } },
                { product: { brand: { name: { contains: q, mode: "insensitive" } } } },
                { product: { category: { name: { contains: q, mode: "insensitive" } } } },
                { sku: { contains: q, mode: "insensitive" } },
                { barcode: { contains: q, mode: "insensitive" } },
                { color: { contains: q, mode: "insensitive" } },
                { size: { contains: q, mode: "insensitive" } },
              ],
            }
          : {
              AND: terms.map((term) => ({
                OR: [
                  { product: { name: { contains: term, mode: "insensitive" } } },
                  { product: { brand: { name: { contains: term, mode: "insensitive" } } } },
                  { product: { category: { name: { contains: term, mode: "insensitive" } } } },
                  { sku: { contains: term, mode: "insensitive" } },
                  { barcode: { contains: term, mode: "insensitive" } },
                  { color: { contains: term, mode: "insensitive" } },
                  { size: { contains: term, mode: "insensitive" } },
                ],
              })),
            }),
      },
      take: 20,
      orderBy: [
        { stockStore: "desc" }, // Prioriza ítems con disponibilidad física en salón
      ],
      select: {
        id: true,
        size: true,
        color: true,
        sku: true,
        barcode: true,
        stockStore: true,
        stockWarehouse: true,
        stockReserved: true,
        price: true,
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    });

    const items: PosSearchResultItem[] = variants.map((v) => {
      const effectivePrice = Number(v.price ?? v.product.price);
      const stockAvailable = Math.max(0, v.stockStore - v.stockReserved);
      return {
        variantId: v.id,
        productId: v.product.id,
        name: v.product.name,
        brand: v.product.brand.name,
        category: v.product.category.name,
        size: v.size,
        color: v.color,
        barcode: v.barcode,
        sku: v.sku,
        price: effectivePrice,
        stockStore: v.stockStore,
        stockWarehouse: v.stockWarehouse,
        stockReserved: v.stockReserved,
        stockAvailable,
        imageUrl: v.product.imageUrl,
      };
    });

    const durationMs = Math.round(performance.now() - startTime);

    return NextResponse.json<PosSearchResponse>(
      {
        exactMatch: false,
        count: items.length,
        query: q,
        durationMs,
        items,
      },
      {
        headers: {
          "Server-Timing": `search;dur=${durationMs}`,
          "Cache-Control": "private, no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error en búsqueda POS RF-07:", error);
    return NextResponse.json(
      { error: "Error al procesar la búsqueda en mostrador" },
      { status: 500 }
    );
  }
}
