import { prisma } from "../src/lib/prisma";

async function cleanDatabase() {
  console.log("Iniciando eliminación de todos los registros en la base de datos...");

  // Usamos una transacción atómica para limpiar todas las tablas respetando la integridad referencial
  await prisma.$transaction([
    prisma.salePayment.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.discipline.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("✅ Todos los registros han sido eliminados correctamente.");

  const counts = {
    users: await prisma.user.count(),
    sales: await prisma.sale.count(),
    saleItems: await prisma.saleItem.count(),
    salePayments: await prisma.salePayment.count(),
    inventoryMovements: await prisma.inventoryMovement.count(),
    productVariants: await prisma.productVariant.count(),
    products: await prisma.product.count(),
    categories: await prisma.category.count(),
    brands: await prisma.brand.count(),
    disciplines: await prisma.discipline.count(),
  };

  console.log("Estado actual de tablas:", counts);
}

cleanDatabase()
  .catch((error) => {
    console.error("❌ Error al limpiar la base de datos:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
