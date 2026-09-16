import { PrismaClient } from "@prisma/client";
import {
  createProduct,
  updateProduct,
  getDetailedInventoryProducts,
  deleteProduct,
} from "../src/server/actions/productActions";

const prisma = new PrismaClient();

async function main() {
  console.log("=================================================");
  console.log("TEST AUTOMATIZADO RF-02: PRECIOS DIFERENCIALES POR VARIANTE");
  console.log("=================================================");

  // 1. Obtener disciplina, categoría y marca existentes para el test
  const discipline = await prisma.discipline.findFirst();
  const category = await prisma.category.findFirst();
  const brand = await prisma.brand.findFirst();

  if (!discipline || !category || !brand) {
    console.error("❌ Faltan datos semilla (disciplina, categoría o marca)");
    process.exit(1);
  }

  console.log(`Usando Disciplina: ${discipline.name}, Categoría: ${category.name}, Marca: ${brand.name}`);

  const testName = `Remera Test RF-02 ${Date.now()}`;
  const basePrice = 92000;
  const differentialPriceXXL = 98000;

  // 2. Crear producto con talle M (precio base / hereda) y talle XXL (precio diferencial)
  console.log("\n[TEST 1] Creando producto con precio base y precio diferencial en talle XXL...");
  const createRes = await createProduct({
    name: testName,
    disciplineId: discipline.id,
    categoryId: category.id,
    brandId: brand.id,
    costPrice: 45000,
    price: basePrice,
    active: true,
    variants: [
      {
        size: "M",
        color: "Negro",
        sku: `TEST-M-${Date.now()}`,
        stockStore: 5,
        stockWarehouse: 10,
        price: null, // Hereda base
      },
      {
        size: "XXL",
        color: "Negro",
        sku: `TEST-XXL-${Date.now()}`,
        stockStore: 3,
        stockWarehouse: 6,
        price: differentialPriceXXL, // Diferencial específico
      },
    ],
  });

  if (!createRes.success || !createRes.data) {
    console.error("❌ Falló la creación:", createRes.error);
    process.exit(1);
  }

  const createdId = createRes.data.id;
  console.log(`✅ Producto creado con ID: ${createdId}`);

  try {
    // 3. Consultar y verificar persistencia en BD
    console.log("\n[TEST 2] Verificando persistencia y lectura en getDetailedInventoryProducts...");
    const productsRes = await getDetailedInventoryProducts({ includeInactive: true });
    if (!productsRes.success || !productsRes.data) {
      console.error("❌ Falló la consulta de inventario:", productsRes.error);
      process.exit(1);
    }

    const found = productsRes.data.find((p) => p.id === createdId);
    if (!found) {
      console.error("❌ No se encontró el producto creado en el listado");
      process.exit(1);
    }

    const varM = found.variants.find((v) => v.size === "M");
    const varXXL = found.variants.find((v) => v.size === "XXL");

    if (!varM || !varXXL) {
      console.error("❌ Faltan variantes en el producto recuperado");
      process.exit(1);
    }

    console.log(`- Talle M: price = ${varM.price} (Esperado: null o sin diferencial)`);
    console.log(`- Talle XXL: price = ${varXXL.price} (Esperado: ${differentialPriceXXL})`);

    if (varM.price !== null && varM.price !== undefined) {
      console.error("❌ Error: Talle M debió tener precio null para heredar base");
      process.exit(1);
    }

    if (Number(varXXL.price) !== differentialPriceXXL) {
      console.error(`❌ Error: Talle XXL tiene ${varXXL.price}, se esperaba ${differentialPriceXXL}`);
      process.exit(1);
    }

    console.log("✅ Persistencia inicial de precios diferenciales verificada.");

    // 4. Actualizar producto invirtiendo los precios (M ahora tiene 94000 y XXL hereda base)
    console.log("\n[TEST 3] Actualizando variantes (M con 94.000 y XXL reseteado a base)...");
    const updateRes = await updateProduct({
      id: createdId,
      name: testName,
      disciplineId: discipline.id,
      categoryId: category.id,
      brandId: brand.id,
      costPrice: 45000,
      price: basePrice,
      variants: [
        {
          id: varM.id,
          size: "M",
          color: "Negro",
          sku: varM.sku,
          stockStore: varM.stockStore,
          stockWarehouse: varM.stockWarehouse,
          price: 94000, // Ahora diferencial
        },
        {
          id: varXXL.id,
          size: "XXL",
          color: "Negro",
          sku: varXXL.sku,
          stockStore: varXXL.stockStore,
          stockWarehouse: varXXL.stockWarehouse,
          price: null, // Reseteado a precio base
        },
      ],
    });

    if (!updateRes.success) {
      console.error("❌ Falló la actualización:", updateRes.error);
      process.exit(1);
    }

    // 5. Verificar tras actualización
    const updatedFromDb = await prisma.product.findUnique({
      where: { id: createdId },
      include: { variants: true },
    });

    if (!updatedFromDb) {
      console.error("❌ No se encontró el producto tras actualizar");
      process.exit(1);
    }

    const updatedM = updatedFromDb.variants.find((v) => v.size === "M");
    const updatedXXL = updatedFromDb.variants.find((v) => v.size === "XXL");

    console.log(`- Tras update: Talle M price = ${updatedM?.price?.toString()} (Esperado: 94000)`);
    console.log(`- Tras update: Talle XXL price = ${updatedXXL?.price?.toString()} (Esperado: null)`);

    if (Number(updatedM?.price) !== 94000) {
      console.error("❌ Error: Talle M no se actualizó a 94000");
      process.exit(1);
    }
    if (updatedXXL?.price !== null) {
      console.error("❌ Error: Talle XXL no se reseteó a null");
      process.exit(1);
    }

    console.log("✅ Actualización y reseteo de precios diferenciales verificado exitosamente.");
  } finally {
    // 6. Limpieza
    console.log("\n[TEST 4] Limpiando producto de prueba...");
    await deleteProduct(createdId);
    console.log("✅ Producto de prueba eliminado.");
  }

  console.log("\n=================================================");
  console.log("🎉 TODOS LOS TESTS DE RF-02 PASARON SATISFACTORIAMENTE (4/4)");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("Error inesperado en tests:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

