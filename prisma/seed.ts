import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando carga de datos iniciales para Matacos Deportes...");

  // 1. Disciplinas base
  const discNatacion = await prisma.discipline.upsert({
    where: { slug: "natacion" },
    update: {},
    create: { name: "Natación", slug: "natacion" },
  });

  const discVoley = await prisma.discipline.upsert({
    where: { slug: "voley" },
    update: {},
    create: { name: "Vóley", slug: "voley" },
  });

  const discCrocs = await prisma.discipline.upsert({
    where: { slug: "crocs" },
    update: {},
    create: { name: "Crocs", slug: "crocs" },
  });

  const discFitness = await prisma.discipline.upsert({
    where: { slug: "fitness" },
    update: {},
    create: { name: "Fitness & Entrenamiento", slug: "fitness" },
  });

  const discIndumentaria = await prisma.discipline.upsert({
    where: { slug: "indumentaria" },
    update: {},
    create: { name: "Indumentaria", slug: "indumentaria" },
  });

  // 2. Categorías base
  const catCalzado = await prisma.category.upsert({
    where: { slug: "calzado" },
    update: {},
    create: { name: "Calzado", slug: "calzado" },
  });

  const catAntiparras = await prisma.category.upsert({
    where: { slug: "antiparras" },
    update: {},
    create: { name: "Antiparras", slug: "antiparras" },
  });

  const catMallas = await prisma.category.upsert({
    where: { slug: "mallas" },
    update: {},
    create: { name: "Mallas", slug: "mallas" },
  });

  const catPelotas = await prisma.category.upsert({
    where: { slug: "pelotas" },
    update: {},
    create: { name: "Pelotas", slug: "pelotas" },
  });

  const catAccesorios = await prisma.category.upsert({
    where: { slug: "accesorios" },
    update: {},
    create: { name: "Accesorios", slug: "accesorios" },
  });

  // 3. Marcas base
  const brandTopper = await prisma.brand.upsert({
    where: { slug: "topper" },
    update: {},
    create: { name: "Topper", slug: "topper" },
  });

  const brandWilson = await prisma.brand.upsert({
    where: { slug: "wilson" },
    update: {},
    create: { name: "Wilson", slug: "wilson" },
  });

  const brandSpeedo = await prisma.brand.upsert({
    where: { slug: "speedo" },
    update: {},
    create: { name: "Speedo", slug: "speedo" },
  });

  const brandArena = await prisma.brand.upsert({
    where: { slug: "arena" },
    update: {},
    create: { name: "Arena", slug: "arena" },
  });

  const brandMikasa = await prisma.brand.upsert({
    where: { slug: "mikasa" },
    update: {},
    create: { name: "Mikasa", slug: "mikasa" },
  });

  const brandCrocs = await prisma.brand.upsert({
    where: { slug: "crocs" },
    update: {},
    create: { name: "Crocs", slug: "crocs" },
  });

  const brandMatacos = await prisma.brand.upsert({
    where: { slug: "matacos" },
    update: {},
    create: { name: "Matacos", slug: "matacos" },
  });

  // 4. Productos de muestra con stock dual
  const productZapas = await prisma.product.create({
    data: {
      name: "Zapatillas Gondor II",
      brandId: brandTopper.id,
      categoryId: catCalzado.id,
      disciplineId: discIndumentaria.id,
      costPrice: 38000,
      price: 68000,
      variants: {
        create: [
          { size: "40", color: "Negro", sku: "TOP-GON-40-NEG", barcode: "7791001001401", stockStore: 3, stockWarehouse: 5, minStoreStock: 1, minStock: 2 },
          { size: "41", color: "Negro", sku: "TOP-GON-41-NEG", barcode: "7791001001418", stockStore: 5, stockWarehouse: 8, minStoreStock: 1, minStock: 2 },
          { size: "42", color: "Negro", sku: "TOP-GON-42-NEG", barcode: "7791001001425", stockStore: 2, stockWarehouse: 4, minStoreStock: 1, minStock: 2 },
        ],
      },
    },
    include: { variants: true },
  });

  // Movimientos iniciales de inventario
  for (const variant of productZapas.variants) {
    const totalStock = variant.stockStore + variant.stockWarehouse;
    await prisma.inventoryMovement.create({
      data: {
        variantId: variant.id,
        type: "INGRESO_INICIAL",
        quantity: totalStock,
        stockAfter: totalStock,
        location: "STORE",
        reason: "Stock inicial de prueba",
      },
    });
  }

  console.log("¡Datos iniciales de prueba cargados exitosamente!");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
