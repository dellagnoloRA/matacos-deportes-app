import { prisma } from "../src/lib/prisma";
import { generateDeterministicSku } from "../src/lib/textUtils";

async function main() {
  console.log("Iniciando normalización de SKUs existentes a formato canónico oficial...");

  const products = await prisma.product.findMany({
    include: {
      brand: true,
      category: true,
      discipline: true,
      variants: true,
    },
  });

  const updates: Array<{ id: string; canonicalSku: string }> = [];

  for (const product of products) {
    for (const variant of product.variants) {
      const canonicalSku = generateDeterministicSku({
        brand: product.brand.name,
        category: product.category.name,
        discipline: product.discipline.name,
        productName: product.name,
        size: variant.size,
        color: variant.color,
      });

      if (variant.sku !== canonicalSku) {
        updates.push({ id: variant.id, canonicalSku });
      }
    }
  }

  console.log(`Se detectaron ${updates.length} variantes con SKUs desfasados o defectuosos.`);

  // Fase 1: Asignar SKUs temporales para evitar colisiones cruzadas durante la migración
  console.log("Fase 1: Asignando claves intermedias temporales...");
  for (const item of updates) {
    await prisma.productVariant.update({
      where: { id: item.id },
      data: { sku: `TEMP-${item.id}` },
    });
  }

  // Fase 2: Asignar el SKU canónico definitivo
  console.log("Fase 2: Asignando SKUs canónicos definitivos...");
  for (const item of updates) {
    await prisma.productVariant.update({
      where: { id: item.id },
      data: { sku: item.canonicalSku },
    });
  }

  console.log(`✅ ¡Migración completada exitosamente! ${updates.length} variantes migradas.`);
}

main()
  .catch((e) => {
    console.error("Error durante la migración de SKUs:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
