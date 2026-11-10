/**
 * Suite de Pruebas Automatizadas de Backend: RF-19 y RF-25
 * Logística, Envíos, Cotización de Paquetes y Despacho con Correo Argentino
 *
 * Cliente: Matacos Deportes (Saavedra 241, Formosa Capital)
 * Ejecución: pnpm tsx scripts/test-rf19-rf25-shipping-logistics.ts
 */

import {
  calculateVirtualPackage,
  ShippingCalculationSchema,
  CancelWebOrderSchema,
  ApplyShippingToOrderSchema,
} from "../src/schemas/shipping";
import {
  correoArgentinoService,
  MOCK_AGENCIES,
} from "../src/server/services/correoArgentinoService";
import {
  calculateShippingCostAction,
  getAgenciesAction,
} from "../src/server/actions/ecommerce/shippingActions";
import {
  createGuestOrder,
} from "../src/server/actions/ecommerce/checkoutActions";
import {
  generateShippingLabelAction,
  cancelWebOrderAction,
  getWebOrdersAction,
} from "../src/server/actions/ecommerce/webOrdersActions";
import { prisma } from "../src/lib/prisma";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n===============================================================================");
  console.log(" MATACOS DEPORTES — TEST SUITE RF-19 & RF-25: LOGÍSTICA Y CORREO ARGENTINO");
  console.log(" Saavedra 241, Formosa Capital — Envíos, Despacho y Rótulo Postal");
  console.log("===============================================================================\n");

  // --------------------------------------------------------------------------
  // GRUPO 1: Heurística de Empaque y Esquemas de Validación (BE-RF19)
  // --------------------------------------------------------------------------
  console.log("--- 1. Heurística de Paquete Virtual y Validación de Esquemas Zod ---");

  // Calzado (950g c/u)
  const pkgCalzado = calculateVirtualPackage([
    { quantity: 2, categoryName: "Calzado Deportivo" },
  ]);
  assert(pkgCalzado.weight === 1900, `2 pares de calzado pesan 1900g (950g c/u) [Obtenido: ${pkgCalzado.weight}g]`);
  assert(pkgCalzado.height >= 12, `Altura virtual de paquete adecuada [Obtenido: ${pkgCalzado.height}cm]`);

  // Indumentaria (300g c/u)
  const pkgRopa = calculateVirtualPackage([
    { quantity: 3, categoryName: "Camisetas y Remeras" },
  ]);
  assert(pkgRopa.weight === 900, `3 prendas de indumentaria pesan 900g (300g c/u) [Obtenido: ${pkgRopa.weight}g]`);

  // Accesorios (150g c/u)
  const pkgAcc = calculateVirtualPackage([
    { quantity: 4, categoryName: "Medias y Accesorios" },
  ]);
  assert(pkgAcc.weight === 600, `4 accesorios pesan 600g (150g c/u) [Obtenido: ${pkgAcc.weight}g]`);

  // Paquete Mixto
  const pkgMixto = calculateVirtualPackage([
    { quantity: 1, categoryName: "Calzado Zapatillas" },       // 950g
    { quantity: 2, categoryName: "Indumentaria Short" },        // 600g
    { quantity: 1, categoryName: "Accesorios Muñequera" },      // 150g
  ]);
  assert(pkgMixto.weight === 1700, `Paquete mixto suma correctamente los pesos heurísticos (1700g) [Obtenido: ${pkgMixto.weight}g]`);
  assert(pkgMixto.length >= 20 && pkgMixto.width >= 15, "Dimensiones de paquete respetan mínimos de embalaje");

  // Validación de esquemas Zod
  const dummyUUID = "a0000000-0000-0000-0000-000000000001";
  const validCalculation = ShippingCalculationSchema.safeParse({
    postalCode: "3600",
    method: "CORREO_ARGENTINO_DOMICILIO",
    items: [{ variantId: dummyUUID, quantity: 1 }],
  });
  assert(validCalculation.success, "ShippingCalculationSchema valida correctamente CP 3600 y variantes con UUID");

  const invalidCP = ShippingCalculationSchema.safeParse({
    postalCode: "ABC",
    method: "CORREO_ARGENTINO_DOMICILIO",
    items: [{ variantId: dummyUUID, quantity: 1 }],
  });
  assert(!invalidCP.success, "ShippingCalculationSchema rechaza código postal no numérico o inválido");

  const validCancel = CancelWebOrderSchema.safeParse({
    orderId: dummyUUID,
    reason: "Cancelación solicitada por el cliente antes del despacho",
  });
  assert(validCancel.success, "CancelWebOrderSchema acepta UUID de orden y motivo descriptivo");

  // --------------------------------------------------------------------------
  // GRUPO 2: Servicio Nativo de Correo Argentino (Simulador / Modo Mock)
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Servicio Nativo Correo Argentino (Modo Mock & Contratos API) ---");

  // Cotización Domicilio y Sucursal para Formosa Capital (CP 3600)
  const rateBranchFsa = await correoArgentinoService.calculateRate({
    postalCodeDestination: "3600",
    deliveredType: "S",
    dimensions: { weight: 800, height: 15, width: 20, length: 25 },
  });
  const rateHomeFsa = await correoArgentinoService.calculateRate({
    postalCodeDestination: "3600",
    deliveredType: "D",
    dimensions: { weight: 800, height: 15, width: 20, length: 25 },
  });

  assert(rateBranchFsa.price > 0, `Tarifa Sucursal Formosa calculada: $${rateBranchFsa.price}`);
  assert(rateHomeFsa.price > 0, `Tarifa Domicilio Formosa calculada: $${rateHomeFsa.price}`);
  assert(
    rateBranchFsa.price < rateHomeFsa.price,
    `Retiro en Sucursal ($${rateBranchFsa.price}) es más económico que Domicilio ($${rateHomeFsa.price})`
  );

  // Cotización para CABA / BsAs (CP 1425)
  const rateHomeCABA = await correoArgentinoService.calculateRate({
    postalCodeDestination: "1425",
    deliveredType: "D",
    dimensions: { weight: 800, height: 15, width: 20, length: 25 },
  });
  assert(rateHomeCABA.price > rateHomeFsa.price, `Tarifa nacional CABA ($${rateHomeCABA.price}) es mayor a local Formosa ($${rateHomeFsa.price})`);

  // Búsqueda de Sucursales Oficiales
  const agenciesFormosa = await correoArgentinoService.getAgencies({ postalCode: "3600" });
  assert(agenciesFormosa.length > 0, "Obtiene sucursales oficiales para CP 3600 Formosa");
  assert(
    agenciesFormosa.some((a) => a.address.streetName.toLowerCase().includes("brandsen")),
    "Identifica la Sucursal Central Formosa en Brandsen 202"
  );

  const agenciesClorinda = await correoArgentinoService.getAgencies({ postalCode: "3610" });
  assert(
    agenciesClorinda.some((a) => a.address.city.toLowerCase().includes("clorinda")),
    "Identifica la Sucursal Oficial Clorinda para CP 3610"
  );

  // Imposición Postal de Paquete (Generación de Guía TN)
  const importResult = await correoArgentinoService.importShipment({
    orderId: dummyUUID,
    orderCode: "WEB-TEST-001",
    deliveredType: "D",
    recipient: {
      name: "Juan Pérez",
      email: "juan@example.com",
      cellPhone: "3704112233",
      address: {
        streetName: "Av. 25 de Mayo",
        streetNumber: "1234",
        city: "Formosa",
        provinceCode: "P",
        postalCode: "3600",
      },
    },
    packageDetails: {
      weightGrams: 950,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 12,
      declaredValue: 45000,
    },
  });

  assert(Boolean(importResult.trackingNumber), "Imposición de paquete en Correo Argentino exitosa");
  assert(importResult.trackingNumber.startsWith("TN"), `Código de seguimiento generado con formato TN (${importResult.trackingNumber})`);
  assert(Boolean(importResult.labelPdfUrl), "Genera URL de rótulo para la guía postal");

  // Consulta de Tracking
  const trackingData = await correoArgentinoService.getTracking(importResult.trackingNumber);
  assert(trackingData.events.length > 0, "Consulta de tracking devuelve eventos iniciales de imposición");
  assert(trackingData.events[0]?.status === "PREIMPOSICION", "Estado inicial de seguimiento en preimposición");

  // --------------------------------------------------------------------------
  // GRUPO 3: Server Actions de Envíos BE-RF19
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Server Actions de Envíos (calculateShippingCostAction & getAgenciesAction) ---");

  // Cotización completa con calculateShippingCostAction
  const quoteResult = await calculateShippingCostAction({
    postalCode: "3600",
    method: "CORREO_ARGENTINO_DOMICILIO",
    items: [{ variantId: dummyUUID, quantity: 1 }],
  });

  assert(quoteResult.success, "calculateShippingCostAction responde exitosamente");
  assert(
    quoteResult.options.some((o) => o.method === "RETIRO_LOCAL" && o.price === 0),
    "Opción RETIRO_LOCAL siempre disponible a costo $0 (Saavedra 241)"
  );
  assert(
    quoteResult.options.some((o) => o.method === "CADETERIA_FORMOSA" && o.price > 0),
    "Opción CADETERIA_FORMOSA disponible para CP 3600 con costo dinámico"
  );
  assert(
    quoteResult.options.some((o) => o.method === "CORREO_ARGENTINO_DOMICILIO"),
    "Opción CORREO_ARGENTINO_DOMICILIO disponible en resultado"
  );
  assert(
    quoteResult.options.some((o) => o.method === "CORREO_ARGENTINO_SUCURSAL"),
    "Opción CORREO_ARGENTINO_SUCURSAL disponible en resultado"
  );

  // Cotización fuera de Formosa (ej: CP 1425 CABA)
  const quoteNational = await calculateShippingCostAction({
    postalCode: "1425",
    method: "CORREO_ARGENTINO_DOMICILIO",
    items: [{ variantId: dummyUUID, quantity: 1 }],
  });
  const cadeteriaFuera = quoteNational.options.find((o) => o.method === "CADETERIA_FORMOSA");
  assert(!cadeteriaFuera, "Cadetería en moto queda excluida fuera de Formosa Capital");

  // getAgenciesAction
  const agenciesActionRes = await getAgenciesAction(undefined, "3600");
  assert(agenciesActionRes.success, "getAgenciesAction responde exitosamente");
  assert(agenciesActionRes.agencies.length > 0, "getAgenciesAction devuelve agencias oficiales");

  // --------------------------------------------------------------------------
  // GRUPO 4: Ciclo de Vida, Despacho y Restitución Atómica BE-RF25
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Ciclo de Vida de Pedidos Web, Despacho y Restitución Atómica ---");

  // Buscamos una variante disponible en la base de datos
  const testVariant = await prisma.productVariant.findFirst({
    include: { product: true },
  });

  if (!testVariant) {
    console.log("  [INFO] No se encontró variante en base de datos. Se omite prueba transaccional directa de DB.");
  } else {
    console.log(`  [INFO] Variante de prueba: SKU ${testVariant.sku} (Stock Salón: ${testVariant.stockStore}, Reservado: ${testVariant.stockReserved})`);

    const initialStockStore = testVariant.stockStore;
    const initialReserved = testVariant.stockReserved;

    // 4.1 Crear Orden Web de prueba en PENDIENTE_PAGO
    const orderRes = await createGuestOrder({
      customerName: "Comprador Test Logística",
      customerDni: "33999888",
      customerEmail: "logistica.test@matacos.com.ar",
      customerPhone: "3704556677",
      shippingMethod: "CORREO_ARGENTINO_SUCURSAL",
      shippingAddress: "Sucursal Central Correo Argentino",
      shippingCity: "Formosa",
      shippingPostalCode: "3600",
      shippingBranchCode: "01001",
      shippingBranchName: "Correo Argentino - Brandsen 202, Formosa",
      shippingCost: 5800,
      notes: "Prueba automatizada de despacho y cancelación",
      items: [
        {
          variantId: testVariant.id,
          quantity: 1,
          expectedUnitPrice: Number(testVariant.price),
        },
      ],
    });

    assert(orderRes.success && Boolean(orderRes.data), "createGuestOrder crea la orden web exitosamente");
    const orderId = orderRes.data!.saleId;

    // Verificar incremento de stockReserved
    const variantAfterReserve = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });
    assert(
      (variantAfterReserve?.stockReserved ?? 0) === initialReserved + 1,
      `Reserva atómica incrementa stockReserved (+1) [Antes: ${initialReserved}, Ahora: ${variantAfterReserve?.stockReserved}]`
    );

    // 4.2 Despachar con Generación de Guía Correo Argentino (generateShippingLabelAction)
    const labelRes = await generateShippingLabelAction({
      orderId,
      operatorName: "Operador Test Despacho",
    });

    assert(labelRes.success, "generateShippingLabelAction genera la guía e impone el paquete");
    assert(Boolean(labelRes.trackingNumber), `Guía generada con número de tracking: ${labelRes.trackingNumber}`);
    assert(labelRes.data?.shippingStatus === "EN_CAMINO", "Estado logístico de la orden pasa a EN_CAMINO");

    // Verificar en base de datos que se haya guardado el tracking code y sucursal
    const saleInDb = await prisma.sale.findUnique({
      where: { id: orderId },
    });
    assert(
      saleInDb?.shippingTrackingCode === labelRes.trackingNumber,
      "El código de guía quedó persistido en PostgreSQL (Sale.shippingTrackingCode)"
    );
    assert(
      saleInDb?.shippingBranchCode === "01001",
      "El código de sucursal oficial quedó persistido (Sale.shippingBranchCode)"
    );

    // 4.3 Anular la orden y verificar restitución de stock (cancelWebOrderAction)
    const cancelRes = await cancelWebOrderAction({
      orderId,
      reason: "Prueba automatizada de anulación con restitución de inventario",
      operatorName: "Auditor de Pruebas",
    });

    assert(cancelRes.success, "cancelWebOrderAction anula la orden correctamente");
    assert(cancelRes.data?.status === "CANCELADA", "Estado comercial de la orden pasa a CANCELADA");
    assert(cancelRes.data?.shippingStatus === "CANCELADO", "Estado logístico de la orden pasa a CANCELADO");

    // Verificar que stockReserved haya vuelto al valor original
    const variantAfterCancel = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });
    assert(
      (variantAfterCancel?.stockReserved ?? 0) === initialReserved,
      `stockReserved fue liberado atómicamente al anular [Actual: ${variantAfterCancel?.stockReserved}, Original: ${initialReserved}]`
    );

    // 4.4 Probar anulación de orden COMPLETADA (simulando pago y salida de stockStore)
    const completedSale = await prisma.sale.create({
      data: {
        channel: "WEB",
        status: "COMPLETADA",
        shippingStatus: "EN_PREPARACION",
        customerName: "Cliente Pagado Test",
        customerDni: "22333444",
        customerEmail: "pagado@test.com",
        customerPhone: "3704889900",
        shippingMethod: "CORREO_ARGENTINO_DOMICILIO",
        shippingAddress: "Av. Gutnisky 2000",
        shippingCity: "Formosa",
        shippingPostalCode: "3600",
        shippingCost: 7900,
        subtotalGross: 50000,
        discount: 0,
        total: 57900,
        items: {
          create: [
            {
              variantId: testVariant.id,
              quantity: 2,
              unitPrice: 25000,
              originalPrice: 25000,
              discount: 0,
              price: 25000,
              subtotal: 50000,
            },
          ],
        },
      },
    });

    // Simular que el stock físico ya se había descontado
    await prisma.productVariant.update({
      where: { id: testVariant.id },
      data: { stockStore: { decrement: 2 } },
    });

    const stockBeforeCancelCompleted = (await prisma.productVariant.findUnique({ where: { id: testVariant.id } }))?.stockStore ?? 0;

    // Anular la orden completada
    const cancelCompletedRes = await cancelWebOrderAction({
      orderId: completedSale.id,
      reason: "Cancelación de orden cobrada: reintegro a stock salón",
      operatorName: "Operador Saavedra 241",
    });

    assert(cancelCompletedRes.success, "cancelWebOrderAction anula orden COMPLETADA con éxito");

    const variantAfterCompletedCancel = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });

    assert(
      (variantAfterCompletedCancel?.stockStore ?? 0) === stockBeforeCancelCompleted + 2,
      `Unidades físicas reingresadas a stockStore (+2) [Antes: ${stockBeforeCancelCompleted}, Después: ${variantAfterCompletedCancel?.stockStore}]`
    );

    // Verificar registro del movimiento de inventario inmutable ANULACION_VENTA
    const movement = await prisma.inventoryMovement.findFirst({
      where: {
        variantId: testVariant.id,
        type: "ANULACION_VENTA",
        reason: { contains: completedSale.id.slice(0, 8) },
      },
    });

    assert(Boolean(movement), "Se registró el movimiento de inventario inmutable ANULACION_VENTA en PostgreSQL");
    assert(movement?.quantity === 2, "La cantidad asentada en el movimiento ANULACION_VENTA es +2 u.");

    // Limpieza de órdenes de prueba creadas
    await prisma.saleItem.deleteMany({ where: { saleId: { in: [orderId, completedSale.id] } } });
    if (movement) {
      await prisma.inventoryMovement.delete({ where: { id: movement.id } });
    }
    await prisma.sale.deleteMany({ where: { id: { in: [orderId, completedSale.id] } } });

    // Restaurar stock original de la variante
    await prisma.productVariant.update({
      where: { id: testVariant.id },
      data: {
        stockStore: initialStockStore,
        stockReserved: initialReserved,
      },
    });
    console.log("  [INFO] Existencias y estado de variante restaurados a valores originales.");
  }

  // --------------------------------------------------------------------------
  // GRUPO 5: Verificación de Filtros del Panel de Gestión (getWebOrdersAction)
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Filtros Logísticos en Panel de Gestión (getWebOrdersAction) ---");

  const ordersRes = await getWebOrdersAction({
    page: 1,
    pageSize: 10,
    shippingMethod: "CORREO_ARGENTINO",
  });
  assert(ordersRes.success, "getWebOrdersAction ejecuta con filtro CORREO_ARGENTINO");
  assert(typeof ordersRes.counts.total === "number", "Devuelve conteos globales de órdenes para las pestañas");

  // --------------------------------------------------------------------------
  // RESUMEN FINAL
  // --------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(` RESULTADO FINAL TEST SUITE RF-19 & RF-25:`);
  console.log(` ✓ Pruebas Pasadas: ${passed}`);
  console.log(` ✗ Pruebas Falladas: ${failed}`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Error fatal durante la ejecución de las pruebas:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
