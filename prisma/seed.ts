import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando carga de datos iniciales para Matacos Deportes...");

  // Categorías base
  const catCalzado = await prisma.category.upsert({
    where: { name: "Calzado" },
    update: {},
    create: { name: "Calzado", slug: "calzado" },
  });

  const catNatacion = await prisma.category.upsert({
    where: { name: "Natación" },
    update: {},
    create: { name: "Natación", slug: "natacion" },
  });

  const catFitness = await prisma.category.upsert({
    where: { name: "Fitness & Entrenamiento" },
    update: {},
    create: { name: "Fitness & Entrenamiento", slug: "fitness" },
  });

  // Marcas
  const brandTopper = await prisma.brand.upsert({
    where: { name: "Topper" },
    update: {},
    create: { name: "Topper" },
  });

  const brandWilson = await prisma.brand.upsert({
    where: { name: "Wilson" },
    update: {},
    create: { name: "Wilson" },
  });

  const brandSpeedo = await prisma.brand.upsert({
    where: { name: "Speedo" },
    update: {},
    create: { name: "Speedo" },
  });

  // Productos de muestra
  await prisma.product.create({
    data: {
      name: "Zapatillas Gondor II",
      brandId: brandTopper.id,
      categoryId: catCalzado.id,
      discipline: "Running / Urbano",
      costPrice: 38000,
      price: 68000,
      variants: {
        create: [
          { size: "40", color: "Negro", sku: "TOP-GON-40-NEG", barcode: "7791001001401", stockLocal: 3, stockWeb: 1 },
          { size: "41", color: "Negro", sku: "TOP-GON-41-NEG", barcode: "7791001001418", stockLocal: 5, stockWeb: 2 },
          { size: "42", color: "Negro", sku: "TOP-GON-42-NEG", barcode: "7791001001425", stockLocal: 2, stockWeb: 1 },
        ],
      },
    },
  });

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
