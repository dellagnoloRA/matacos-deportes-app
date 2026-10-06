import { prisma } from "../src/lib/prisma";
import {
  createPendingSale,
  getPendingSales,
  updatePendingSale,
  cancelPendingSale,
  searchPosProducts,
} from "../src/server/actions/posSaleActions";

async function testTicketModificationInCaja() {
  console.log("================================================================================");
  console.log("🧪 TEST DE INTEGRACIÓN: MODIFICACIÓN DINÁMICA DE ARTÍCULOS EN CAJA (RF-08)");
  console.log("================================================================================");

  // 1. Obtener 3 variantes distintas con stock en salón
  const variants = await prisma.productVariant.findMany({
    where: {
      stockStore: { gt: 3 },
      product: { active: true },
    },
    include: { product: true },
    take: 3,
  });

  if (variants.length < 3) {
    console.error("❌ Se necesitan al menos 3 variantes con stockStore > 3 para la prueba.");
    process.exit(1);
  }

  const [varA, varB, varC] = variants;
  console.log("\n1. Variantes seleccionadas para la prueba:");
  console.log(`   - Var A: ${varA.product.name} (${varA.size}) | Stock Salón: ${varA.stockStore} | Reservado: ${varA.stockReserved}`);
  console.log(`   - Var B: ${varB.product.name} (${varB.size}) | Stock Salón: ${varB.stockStore} | Reservado: ${varB.stockReserved}`);
  console.log(`   - Var C: ${varC.product.name} (${varC.size}) | Stock Salón: ${varC.stockStore} | Reservado: ${varC.stockReserved}`);

  const initialResA = varA.stockReserved;
  const initialResB = varB.stockReserved;
  const initialResC = varC.stockReserved;

  const priceA = Number(varA.price ?? varA.product.price);
  const priceB = Number(varB.price ?? varB.product.price);
  const priceC = Number(varC.price ?? varC.product.price);

  // 2. Crear Preventa inicial con Var A (2 un.) y Var B (1 un.)
  console.log("\n2. Creando preventa inicial con Var A (2 un.) y Var B (1 un.)...");
  const createRes = await createPendingSale({
    customerName: "Cliente Caja Test",
    items: [
      {
        variantId: varA.id,
        quantity: 2,
        originalPrice: priceA,
        unitPrice: priceA,
      },
      {
        variantId: varB.id,
        quantity: 1,
        originalPrice: priceB,
        unitPrice: priceB,
      },
    ],
  });

  if (!createRes.success || !createRes.data) {
    console.error("❌ Error al crear preventa inicial:", createRes.error);
    process.exit(1);
  }

  const saleId = createRes.data.saleId;
  const ticketCode = createRes.data.ticketCode;
  console.log(`   ✅ Preventa generada: Ticket ${ticketCode} (ID: ${saleId})`);

  // Verificar reservas iniciales
  const checkRes1A = await prisma.productVariant.findUnique({ where: { id: varA.id } });
  const checkRes1B = await prisma.productVariant.findUnique({ where: { id: varB.id } });
  if (checkRes1A?.stockReserved !== initialResA + 2 || checkRes1B?.stockReserved !== initialResB + 1) {
    console.error("❌ Falló la reserva inicial de stock.");
    process.exit(1);
  }
  console.log("   ✅ Reservas iniciales confirmadas: A (+2), B (+1)");

  // 3. Modificar ticket en Caja:
  //    - Quitar Var B por completo (debe liberar 1 unidad)
  //    - Incrementar Var A de 2 a 3 unidades (debe reservar 1 unidad adicional)
  //    - Añadir NUEVA Var C con 1 unidad (debe reservar 1 unidad de C)
  console.log("\n3. Modificando ticket en Caja: Quitando B, incrementando A (+1) y agregando nuevo C (+1)...");
  const updateRes = await updatePendingSale({
    saleId: saleId,
    customerName: "Cliente Caja Test (Modificado)",
    items: [
      {
        variantId: varA.id,
        quantity: 3,
        originalPrice: priceA,
        unitPrice: priceA,
      },
      {
        variantId: varC.id,
        quantity: 1,
        originalPrice: priceC,
        unitPrice: priceC,
      },
    ],
    notes: "Artículo removido y nuevo artículo añadido en caja",
  });

  if (!updateRes.success || !updateRes.data) {
    console.error("❌ Error al modificar preventa:", updateRes.error);
    process.exit(1);
  }

  console.log(`   ✅ Preventa modificada exitosamente:`);
  console.log(`      - Nuevo total neto: $ ${updateRes.data.totalNet}`);
  console.log(`      - Cantidad de renglones: ${updateRes.data.itemsCount}`);
  console.log(`      - Objeto sale devuelto: ${updateRes.data.sale ? "Sí (completo)" : "No"}`);

  // 4. Verificar rebalanceo atómico de stock:
  //    - Var A debe tener initialResA + 3
  //    - Var B debe haber vuelto a initialResB (stock liberado)
  //    - Var C debe tener initialResC + 1
  console.log("\n4. Verificando rebalanceo atómico de reservas en base de datos:");
  const checkRes2A = await prisma.productVariant.findUnique({ where: { id: varA.id } });
  const checkRes2B = await prisma.productVariant.findUnique({ where: { id: varB.id } });
  const checkRes2C = await prisma.productVariant.findUnique({ where: { id: varC.id } });

  console.log(`   - Var A reservado: ${checkRes2A?.stockReserved} (esperado: ${initialResA + 3})`);
  console.log(`   - Var B reservado: ${checkRes2B?.stockReserved} (esperado: ${initialResB} -> LIBERADO)`);
  console.log(`   - Var C reservado: ${checkRes2C?.stockReserved} (esperado: ${initialResC + 1} -> NUEVA RESERVA)`);

  if (
    checkRes2A?.stockReserved !== initialResA + 3 ||
    checkRes2B?.stockReserved !== initialResB ||
    checkRes2C?.stockReserved !== initialResC + 1
  ) {
    console.error("❌ Falló el rebalanceo de reservas.");
    process.exit(1);
  }
  console.log("   ✅ Rebalanceo de stock en salón perfecto.");

  // 5. Verificar que getPendingSales() retorna el ticket modificado con sus datos y variantes
  console.log("\n5. Consultando getPendingSales()...");
  const pendingRes = await getPendingSales();
  const pendingTicket = (pendingRes.data as any[]).find((s) => s.id === saleId);

  if (!pendingTicket) {
    console.error("❌ El ticket no se encontró en getPendingSales.");
    process.exit(1);
  }

  if (pendingTicket.items.length !== 2) {
    console.error(`❌ Se esperaban 2 renglones en el ticket pero se obtuvieron ${pendingTicket.items.length}`);
    process.exit(1);
  }

  console.log(`   ✅ Ticket ${pendingTicket.ticketCode} verificado en Caja con 2 ítems.`);
  console.log(`      - Ítem 1: ${pendingTicket.items[0].variant.product.name} (Cant: ${pendingTicket.items[0].quantity})`);
  console.log(`      - Ítem 2: ${pendingTicket.items[1].variant.product.name} (Cant: ${pendingTicket.items[1].quantity})`);

  // 6. Limpieza: Cancelar la preventa de prueba y verificar liberación total
  console.log("\n6. Limpieza: Cancelando preventa de prueba...");
  const cancelRes = await cancelPendingSale(saleId);
  if (!cancelRes.success) {
    console.error("❌ Error al cancelar preventa de prueba:", cancelRes.error);
    process.exit(1);
  }

  const checkFinalA = await prisma.productVariant.findUnique({ where: { id: varA.id } });
  const checkFinalC = await prisma.productVariant.findUnique({ where: { id: varC.id } });

  if (checkFinalA?.stockReserved !== initialResA || checkFinalC?.stockReserved !== initialResC) {
    console.error("❌ Error en la liberación final de stock al cancelar.");
    process.exit(1);
  }
  console.log("   ✅ Todas las reservas restauradas limpiamente.");

  console.log("\n================================================================================");
  console.log("🎉 TEST DE MODIFICACIÓN DE TICKETS EN CAJA SUPERADO AL 100%");
  console.log("================================================================================");
}

testTicketModificationInCaja()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
