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

  const brandAsics = await prisma.brand.upsert({
    where: { slug: "asics" },
    update: {},
    create: { name: "Asics", slug: "asics" },
  });

  // 4. Catálogo completo de productos
  const seedProducts = [
    {
      name: "Antiparras Cobra Ultra Mirror",
      description: "Antiparras de competición hidrodinámicas con lentes espejadas y protección UV400.",
      brandId: brandArena.id,
      categoryId: catAntiparras.id,
      disciplineId: discNatacion.id,
      costPrice: 42000,
      price: 68000,
      variants: [
        { size: "Único", color: "Mirror Silver", sku: "NAT-ARE-COB-SIL", barcode: "779123456701-1", stockStore: 8, stockWarehouse: 12 },
        { size: "Único", color: "Mirror Gold", sku: "NAT-ARE-COB-GLD", barcode: "779123456701-2", stockStore: 6, stockWarehouse: 10 },
        { size: "Único", color: "Mirror Blue", sku: "NAT-ARE-COB-BLU", barcode: "779123456701-3", stockStore: 5, stockWarehouse: 8 },
      ],
    },
    {
      name: "Pelota Vóley V200W Oficial FIVB",
      description: "Balón oficial de juego de la FIVB con diseño aerodinámico de 18 paneles.",
      brandId: brandMikasa.id,
      categoryId: catPelotas.id,
      disciplineId: discVoley.id,
      costPrice: 98000,
      price: 145000,
      variants: [
        { size: "N° 5", color: "Azul/Amarillo", sku: "VOL-MIK-V200-N5", barcode: "779123456702-1", stockStore: 6, stockWarehouse: 14 },
      ],
    },
    {
      name: "Zapatillas Gel-Rocket 11 Indoor",
      description: "Calzado multiusos para canchas de interior con tecnología GEL y suela de tracción.",
      brandId: brandAsics.id,
      categoryId: catCalzado.id,
      disciplineId: discVoley.id,
      costPrice: 78000,
      price: 120000,
      variants: [
        { size: "39", color: "Blanco/Azul", sku: "CAL-ASI-ROC-39", barcode: "779123456703-39", stockStore: 2, stockWarehouse: 4 },
        { size: "40", color: "Blanco/Azul", sku: "CAL-ASI-ROC-40", barcode: "779123456703-40", stockStore: 3, stockWarehouse: 6 },
        { size: "41", color: "Blanco/Azul", sku: "CAL-ASI-ROC-41", barcode: "779123456703-41", stockStore: 4, stockWarehouse: 8 },
        { size: "42", color: "Blanco/Azul", sku: "CAL-ASI-ROC-42", barcode: "779123456703-42", stockStore: 3, stockWarehouse: 5 },
      ],
    },
    {
      name: "Crocs Classic Clog Unisex",
      description: "El zueco icónico ultraliviano y resistente al agua fabricado en material Croslite.",
      brandId: brandCrocs.id,
      categoryId: catCalzado.id,
      disciplineId: discCrocs.id,
      costPrice: 34000,
      price: 58000,
      variants: [
        { size: "38", color: "Negro", sku: "CRC-CLS-38-NEG", barcode: "779123456704-38", stockStore: 6, stockWarehouse: 8 },
        { size: "40", color: "Negro", sku: "CRC-CLS-40-NEG", barcode: "779123456704-40", stockStore: 8, stockWarehouse: 12 },
        { size: "42", color: "Negro", sku: "CRC-CLS-42-NEG", barcode: "779123456704-42", stockStore: 8, stockWarehouse: 10 },
      ],
    },
    {
      name: "Malla Competición Fastskin LZR",
      description: "Traje de baño de competición aprobado por World Aquatics con costuras termoselladas.",
      brandId: brandSpeedo.id,
      categoryId: catMallas.id,
      disciplineId: discNatacion.id,
      costPrice: 59000,
      price: 92000,
      variants: [
        { size: "S", color: "Negro/Dorado", sku: "NAT-SPE-FST-S", barcode: "779123456705-S", stockStore: 2, stockWarehouse: 3 },
        { size: "M", color: "Negro/Dorado", sku: "NAT-SPE-FST-M", barcode: "779123456705-M", stockStore: 4, stockWarehouse: 6 },
        { size: "L", color: "Negro/Dorado", sku: "NAT-SPE-FST-L", barcode: "779123456705-L", stockStore: 4, stockWarehouse: 5 },
      ],
    },
    {
      name: "Cinturón de Levantamiento Cuero Pro",
      description: "Cinturón lumbar en cuero reforzado de 10mm con hebilla de acero inoxidable de doble púa.",
      brandId: brandMatacos.id,
      categoryId: catAccesorios.id,
      disciplineId: discFitness.id,
      costPrice: 31000,
      price: 49000,
      variants: [
        { size: "M", color: "Marrón", sku: "FIT-MAT-CIN-M", barcode: "779123456706-M", stockStore: 5, stockWarehouse: 7 },
        { size: "L", color: "Marrón", sku: "FIT-MAT-CIN-L", barcode: "779123456706-L", stockStore: 6, stockWarehouse: 8 },
      ],
    },
    {
      name: "Zapatillas Gondor II",
      description: "Calzado deportivo versátil y duradero para entrenamiento y uso diario.",
      brandId: brandTopper.id,
      categoryId: catCalzado.id,
      disciplineId: discIndumentaria.id,
      costPrice: 38000,
      price: 68000,
      variants: [
        { size: "40", color: "Negro", sku: "TOP-GON-40-NEG", barcode: "7791001001401", stockStore: 3, stockWarehouse: 5 },
        { size: "41", color: "Negro", sku: "TOP-GON-41-NEG", barcode: "7791001001418", stockStore: 5, stockWarehouse: 8 },
        { size: "42", color: "Negro", sku: "TOP-GON-42-NEG", barcode: "7791001001425", stockStore: 2, stockWarehouse: 4 },
      ],
    },
  ];

  for (const item of seedProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          brandId: item.brandId,
          categoryId: item.categoryId,
          disciplineId: item.disciplineId,
          costPrice: item.costPrice,
          price: item.price,
          active: true,
          variants: {
            create: item.variants.map((v) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              barcode: v.barcode,
              stockStore: v.stockStore,
              stockWarehouse: v.stockWarehouse,
              minStoreStock: 1,
              minStock: 2,
            })),
          },
        },
        include: { variants: true },
      });

      for (const variant of created.variants) {
        const totalStock = variant.stockStore + variant.stockWarehouse;
        if (totalStock > 0) {
          await prisma.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "INGRESO_INICIAL",
              quantity: totalStock,
              stockAfter: totalStock,
              location: "STORE",
              reason: "Stock inicial de catálogo",
            },
          });
        }
      }
    }
  }

  console.log("¡Catálogo completo de productos cargado exitosamente en PostgreSQL!");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
