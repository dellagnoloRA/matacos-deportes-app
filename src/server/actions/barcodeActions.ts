"use server";

import { prisma } from "@/lib/prisma";
import {
  GenerateBarcodesSchema,
  GenerateBarcodesInput,
  AssignBarcodeToVariantSchema,
  AssignBarcodeToVariantInput,
  PrintLabelsPayloadSchema,
  PrintLabelsPayloadInput,
  PrintLabelsResult,
  PrintableLabelItem,
} from "@/schemas/barcode";
import {
  generateEan13FromSequence,
  generateBatchEan13,
  validateEan13,
  GS1_INTERNAL_PREFIX,
} from "@/lib/barcodeGenerator";
import { formatCurrency } from "@/lib/utils";

/**
 * Obtiene el próximo número de secuencia correlativo libre para el prefijo interno indicado.
 * Analiza los códigos existentes en la base de datos para garantizar continuidad sin saltos ni colisiones.
 */
async function getNextInternalSequence(prefix = GS1_INTERNAL_PREFIX): Promise<number> {
  // Buscar todas las variantes con código que comience con el prefijo de 3 dígitos
  const existingVariants = await prisma.productVariant.findMany({
    where: {
      barcode: {
        startsWith: prefix,
      },
    },
    select: { barcode: true },
  });

  let maxSequence = 0;

  for (const v of existingVariants) {
    if (v.barcode && v.barcode.length === 13 && /^\d{13}$/.test(v.barcode)) {
      // Los dígitos 3 al 11 corresponden a la secuencia numérica de 9 dígitos
      const seqStr = v.barcode.slice(3, 12);
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSequence) {
        maxSequence = seqNum;
      }
    }
  }

  return maxSequence + 1;
}

/**
 * Genera un lote de códigos de barra EAN-13 correlativos únicos y verificados algorítmicamente
 */
export async function generateInternalBarcodes(
  input: GenerateBarcodesInput = { count: 1, prefix: GS1_INTERNAL_PREFIX }
): Promise<{
  success: boolean;
  barcodes: string[];
  startSequence: number;
  count: number;
  error?: string;
}> {
  try {
    const validated = GenerateBarcodesSchema.parse(input);
    const startSequence = await getNextInternalSequence(validated.prefix);

    const barcodes = generateBatchEan13(startSequence, validated.count, validated.prefix);

    return {
      success: true,
      barcodes,
      startSequence,
      count: barcodes.length,
    };
  } catch (error) {
    console.error("Error al generar códigos de barras internos:", error);
    return {
      success: false,
      barcodes: [],
      startSequence: 0,
      count: 0,
      error: error instanceof Error ? error.message : "Error inesperado al generar códigos",
    };
  }
}

/**
 * Asigna automáticamente un código EAN-13 interno correlativo a una variante de producto que carezca de él
 */
export async function assignInternalBarcodeToVariant(
  input: AssignBarcodeToVariantInput
): Promise<{
  success: boolean;
  barcode?: string;
  message?: string;
  error?: string;
}> {
  try {
    const validated = AssignBarcodeToVariantSchema.parse(input);

    const variant = await prisma.productVariant.findUnique({
      where: { id: validated.variantId },
      include: { product: true },
    });

    if (!variant) {
      return { success: false, error: "La variante de producto no existe" };
    }

    let targetBarcode: string;

    if (validated.customBarcode && validated.customBarcode.trim() !== "") {
      targetBarcode = validated.customBarcode.trim();

      // Verificar unicidad en la base de datos
      const existing = await prisma.productVariant.findFirst({
        where: {
          barcode: targetBarcode,
          id: { not: variant.id },
        },
      });

      if (existing) {
        return {
          success: false,
          error: `El código de barras "${targetBarcode}" ya está asignado a otra variante en el sistema.`,
        };
      }
    } else {
      // Generar automáticamente el siguiente EAN-13 correlativo
      const nextSeq = await getNextInternalSequence(GS1_INTERNAL_PREFIX);
      targetBarcode = generateEan13FromSequence(nextSeq, GS1_INTERNAL_PREFIX);
    }

    // Actualizar en base de datos
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { barcode: targetBarcode },
    });

    return {
      success: true,
      barcode: targetBarcode,
      message: `Código de barras ${targetBarcode} asignado exitosamente a "${variant.product.name} (Talle: ${variant.size}, Color: ${variant.color})"`,
    };
  } catch (error) {
    console.error("Error al asignar código de barras:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado",
    };
  }
}

/**
 * Genera el payload de datos formateados para impresión de etiquetas térmicas adhesivas
 */
export async function getPrintableLabels(
  input: PrintLabelsPayloadInput
): Promise<PrintLabelsResult> {
  try {
    const validated = PrintLabelsPayloadSchema.parse(input);
    const variantIds = validated.items.map((i) => i.variantId);

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
            discipline: true,
          },
        },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const labels: PrintableLabelItem[] = [];
    let totalCopies = 0;

    for (const item of validated.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) continue;

      let barcodeToUse = variant.barcode;

      // Si la variante no tiene código asignado, generamos uno temporal válido
      if (!barcodeToUse || barcodeToUse.trim() === "") {
        const nextSeq = await getNextInternalSequence(GS1_INTERNAL_PREFIX);
        barcodeToUse = generateEan13FromSequence(nextSeq, GS1_INTERNAL_PREFIX);

        // Persistir el código generado para que quede registrado
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { barcode: barcodeToUse },
        });
      }

      const effectivePrice = variant.price !== null ? Number(variant.price) : Number(variant.product.price);

      labels.push({
        variantId: variant.id,
        productId: variant.product.id,
        productName: variant.product.name,
        brand: variant.product.brand.name,
        discipline: variant.product.discipline.name,
        category: variant.product.category.name,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        barcode: barcodeToUse,
        priceFormatted: formatCurrency(effectivePrice),
        priceNumeric: effectivePrice,
        copies: item.copies,
      });

      totalCopies += item.copies;
    }

    return {
      success: true,
      message: `Se generaron ${labels.length} formatos de etiquetas con un total de ${totalCopies} impresiones solicitadas.`,
      totalLabelsToPrint: totalCopies,
      labels,
    };
  } catch (error) {
    console.error("Error al preparar etiquetas de impresión:", error);
    return {
      success: false,
      message: "Error al preparar las etiquetas",
      error: error instanceof Error ? error.message : "Error inesperado",
      totalLabelsToPrint: 0,
      labels: [],
    };
  }
}
