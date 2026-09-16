import { PrismaClient } from "@prisma/client";
import {
  createBrand,
  updateBrand,
  deleteBrand,
  getBrands,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  getDisciplines,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
} from "../src/server/actions/categoryActions";
import { createProduct, deleteProduct } from "../src/server/actions/productActions";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================================");
  console.log("TEST AUTOMATIZADO RF-01.2: TABLAS MAESTRAS (ABM Y REGLAS DE INTEGRIDAD)");
  console.log("==================================================================");

  const timestamp = Date.now();
  const testBrandName = `Marca Test ${timestamp}`;
  const testDisciplineName = `Disciplina Test ${timestamp}`;
  const testCategoryName = `Categoría Test ${timestamp}`;

  // 1. CREACIÓN DE ENTIDADES MAESTRAS
  console.log("\n[TEST 1] Creando Marca, Disciplina y Categoría maestras...");
  const brandRes = await createBrand({ name: testBrandName });
  if (!brandRes.success || !brandRes.data) {
    throw new Error(`Fallo al crear marca: ${brandRes.error}`);
  }
  const brandId = brandRes.data.id;
  console.log(`✅ Marca creada: "${brandRes.data.name}" (ID: ${brandId}, Slug: ${brandRes.data.slug})`);

  const disciplineRes = await createDiscipline({ name: testDisciplineName });
  if (!disciplineRes.success || !disciplineRes.data) {
    throw new Error(`Fallo al crear disciplina: ${disciplineRes.error}`);
  }
  const disciplineId = disciplineRes.data.id;
  console.log(`✅ Disciplina creada: "${disciplineRes.data.name}" (ID: ${disciplineId}, Slug: ${disciplineRes.data.slug})`);

  const categoryRes = await createCategory({ name: testCategoryName });
  if (!categoryRes.success || !categoryRes.data) {
    throw new Error(`Fallo al crear categoría: ${categoryRes.error}`);
  }
  const categoryId = categoryRes.data.id;
  console.log(`✅ Categoría creada: "${categoryRes.data.name}" (ID: ${categoryId}, Slug: ${categoryRes.data.slug})`);

  // 2. ACTUALIZACIÓN (EDICIÓN) DE NOMBRE Y SLUG
  console.log("\n[TEST 2] Actualizando nombre y slug de las tablas maestras...");
  const updatedBrand = await updateBrand({
    id: brandId,
    name: `${testBrandName} Modificada`,
    slug: `marca-test-${timestamp}-mod`,
  });
  if (!updatedBrand.success || updatedBrand.data?.name !== `${testBrandName} Modificada`) {
    throw new Error(`Fallo al actualizar marca: ${updatedBrand.error}`);
  }
  console.log(`✅ Marca actualizada correctamente: "${updatedBrand.data.name}" -> slug: "${updatedBrand.data.slug}"`);

  const updatedDisc = await updateDiscipline({
    id: disciplineId,
    name: `${testDisciplineName} Modificada`,
    slug: `disciplina-test-${timestamp}-mod`,
  });
  if (!updatedDisc.success || updatedDisc.data?.name !== `${testDisciplineName} Modificada`) {
    throw new Error(`Fallo al actualizar disciplina: ${updatedDisc.error}`);
  }
  console.log(`✅ Disciplina actualizada correctamente: "${updatedDisc.data.name}" -> slug: "${updatedDisc.data.slug}"`);

  const updatedCat = await updateCategory({
    id: categoryId,
    name: `${testCategoryName} Modificada`,
    slug: `categoria-test-${timestamp}-mod`,
  });
  if (!updatedCat.success || updatedCat.data?.name !== `${testCategoryName} Modificada`) {
    throw new Error(`Fallo al actualizar categoría: ${updatedCat.error}`);
  }
  console.log(`✅ Categoría actualizada correctamente: "${updatedCat.data.name}" -> slug: "${updatedCat.data.slug}"`);

  // 3. VINCULAR UN PRODUCTO DE PRUEBA A ESTAS TABLAS MAESTRAS
  console.log("\n[TEST 3] Creando producto vinculado a la marca, disciplina y categoría de prueba...");
  const productRes = await createProduct({
    name: `Producto Test Integridad ${timestamp}`,
    brandId: brandId,
    disciplineId: disciplineId,
    categoryId: categoryId,
    costPrice: 1000,
    price: 2000,
    active: true,
    variants: [
      {
        size: "Único",
        color: "Estándar",
        sku: `SKU-INT-${timestamp}`,
        stockStore: 5,
        stockWarehouse: 5,
      },
    ],
  });

  if (!productRes.success || !productRes.data) {
    throw new Error(`Fallo al crear producto de prueba: ${productRes.error}`);
  }
  const productId = productRes.data.id;
  console.log(`✅ Producto vinculado creado con ID: ${productId}`);

  // 4. VERIFICAR CONTADOR DE PRODUCTOS ASOCIADOS EN LECTURA
  console.log("\n[TEST 4] Verificando conteo de productos asociados en getBrands, getDisciplines, getCategories...");
  const allBrands = await getBrands();
  const brandItem = allBrands.data?.find((b: any) => b.id === brandId);
  console.log(`Conteo de productos en Marca: ${brandItem?._count?.products} (Esperado: 1)`);
  if (brandItem?._count?.products !== 1) {
    throw new Error("El conteo de productos en Marca no coincide con 1");
  }

  // 5. INTENTAR ELIMINAR CUANDO EXISTEN PRODUCTOS ASOCIADOS (INTEGRIDAD REFERENCIAL)
  console.log("\n[TEST 5] Intentando eliminar marca, disciplina y categoría con productos asociados (Debe bloquearse)...");

  const blockBrandDel = await deleteBrand(brandId);
  console.log(`Resultado eliminación Marca con productos: success=${blockBrandDel.success}, error="${blockBrandDel.error}"`);
  if (blockBrandDel.success) {
    throw new Error("❌ ERROR GRAVE: deleteBrand permitió eliminar una marca con productos asociados");
  }
  console.log("✅ deleteBrand bloqueó correctamente la eliminación por integridad referencial");

  const blockDiscDel = await deleteDiscipline(disciplineId);
  console.log(`Resultado eliminación Disciplina con productos: success=${blockDiscDel.success}, error="${blockDiscDel.error}"`);
  if (blockDiscDel.success) {
    throw new Error("❌ ERROR GRAVE: deleteDiscipline permitió eliminar una disciplina con productos asociados");
  }
  console.log("✅ deleteDiscipline bloqueó correctamente la eliminación por integridad referencial");

  const blockCatDel = await deleteCategory(categoryId);
  console.log(`Resultado eliminación Categoría con productos: success=${blockCatDel.success}, error="${blockCatDel.error}"`);
  if (blockCatDel.success) {
    throw new Error("❌ ERROR GRAVE: deleteCategory permitió eliminar una categoría con productos asociados");
  }
  console.log("✅ deleteCategory bloqueó correctamente la eliminación por integridad referencial");

  // 6. ELIMINAR EL PRODUCTO ASOCIADO PARA LIBERAR LA RESTRICCIÓN
  console.log("\n[TEST 6] Eliminando producto de prueba físico de la BD para liberar restricción referencial...");
  const variants = await prisma.productVariant.findMany({ where: { productId }, select: { id: true } });
  const variantIds = variants.map((v) => v.id);
  await prisma.inventoryMovement.deleteMany({ where: { variantId: { in: variantIds } } });
  await prisma.productVariant.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });
  console.log("✅ Movimientos, producto y variantes de test eliminados de la BD");

  // 7. ELIMINAR MARCA, DISCIPLINA Y CATEGORÍA CUANDO NO TIENEN PRODUCTOS
  console.log("\n[TEST 7] Eliminando Marca, Disciplina y Categoría sin productos asociados...");
  const deleteBrandRes = await deleteBrand(brandId);
  if (!deleteBrandRes.success) {
    throw new Error(`Fallo al eliminar marca liberada: ${deleteBrandRes.error}`);
  }
  console.log("✅ Marca eliminada exitosamente");

  const deleteDiscRes = await deleteDiscipline(disciplineId);
  if (!deleteDiscRes.success) {
    throw new Error(`Fallo al eliminar disciplina liberada: ${deleteDiscRes.error}`);
  }
  console.log("✅ Disciplina eliminada exitosamente");

  const deleteCatRes = await deleteCategory(categoryId);
  if (!deleteCatRes.success) {
    throw new Error(`Fallo al eliminar categoría liberada: ${deleteCatRes.error}`);
  }
  console.log("✅ Categoría eliminada exitosamente");

  console.log("\n🎉 TODAS LAS PRUEBAS DE INTEGRIDAD REFERENCIAL Y CRUD DE TABLAS MAESTRAS PASARON CON ÉXITO!");
}

main()
  .catch((e) => {
    console.error("❌ Error en tests de tablas maestras:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
