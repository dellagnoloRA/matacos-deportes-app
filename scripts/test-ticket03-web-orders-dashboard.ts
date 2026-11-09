/**
 * Suite de Pruebas Automatizadas — Ticket 03: Panel Operativo de Órdenes Web y Despacho para Salón (RF-19)
 *
 * Ejecución: pnpm tsx scripts/test-ticket03-web-orders-dashboard.ts
 */

import { prisma } from "../src/lib/prisma";
import {
  getWebOrdersAction,
  getWebOrderDetailAction,
  updateWebOrderShippingStatusAction,
  cancelWebOrderManualAction,
} from "../src/server/actions/ecommerce/webOrdersActions";
import { formatStaffToCustomerWhatsAppUrl } from "../src/lib/whatsapp";
import { CORREO_ARGENTINO_TRACKING_URL } from "../src/lib/emailService";

interface TestStats {
  passed: number;
  failed: number;
}

const stats: TestStats = { passed: 0, failed: 0 };

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    stats.passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    stats.failed++;
  }
}

async function runTicket03Tests() {
  console.log("================================================================================");
  console.log("🧪 INICIANDO PRUEBAS TICKET 03: PANEL DE ÓRDENES WEB Y DESPACHO (RF-19)");
  console.log("================================================================================\n");

  const runId = Date.now().toString().slice(-6);
  const testEmail = `cliente.test.${runId}@ejemplo.com`;
  const testPhone = "3704123456";

  const createdSaleIds: string[] = [];

  try {
    // --------------------------------------------------------------------------
    // 1. OBTENCIÓN DE VARIANTE CON STOCK EXISTENTE
    // --------------------------------------------------------------------------
    console.log("📦 Fase 1: Obtención de variante existente para picking...");

    const testVariant = await prisma.productVariant.findFirst({
      where: {
        stockStore: { gte: 2 },
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
          },
        },
      },
    });

    if (!testVariant) {
      console.error("❌ No se encontró ninguna variante de prueba con stockStore >= 2");
      process.exit(1);
    }

    console.log(`  Articulo de prueba: ${testVariant.product.name} (${testVariant.size}/${testVariant.color})`);
    console.log(`  Existencias: Salón=${testVariant.stockStore}, Depósito=${testVariant.stockWarehouse}`);
    assert(Boolean(testVariant.id), "Variante de prueba obtenida correctamente");

    // --------------------------------------------------------------------------
    // 2. CREACIÓN DE ÓRDENES WEB DE PRUEBA EN DIFERENTES ESTADOS
    // --------------------------------------------------------------------------
    console.log("\n🛒 Fase 2: Creación de Órdenes Web simuladas (Distintos estados y canales)...");

    // Orden 1: PENDIENTE_PAGO (15 min TTL)
    const sale1 = await prisma.sale.create({
      data: {
        invoiceNumber: `WEB-TEST-${runId}-01`,
        channel: "WEB",
        status: "PENDIENTE_PAGO",
        shippingStatus: "PENDIENTE",
        shippingMethod: "RETIRO_LOCAL",
        customerName: `Juan Pérez ${runId}`,
        customerEmail: testEmail,
        customerPhone: testPhone,
        customerDni: "35123456",
        shippingAddress: "Saavedra 241",
        shippingCity: "Formosa",
        shippingPostalCode: "3600",
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
        total: 25000,
        items: {
          create: [
            {
              variantId: testVariant.id,
              quantity: 1,
              price: 25000,
              unitPrice: 25000,
              subtotal: 25000,
            },
          ],
        },
      },
    });
    createdSaleIds.push(sale1.id);

    // Orden 2: COMPLETADA, EN_PREPARACION (Picking en Saavedra 241)
    const sale2 = await prisma.sale.create({
      data: {
        invoiceNumber: `WEB-TEST-${runId}-02`,
        channel: "WEB",
        status: "COMPLETADA",
        shippingStatus: "EN_PREPARACION",
        shippingMethod: "CADETERIA_FORMOSA",
        customerName: `María Gómez ${runId}`,
        customerEmail: testEmail,
        customerPhone: testPhone,
        customerDni: "38999888",
        shippingAddress: "Av. 25 de Mayo 1234",
        shippingCity: "Formosa",
        shippingPostalCode: "3600",
        total: 50000,
        items: {
          create: [
            {
              variantId: testVariant.id,
              quantity: 2,
              price: 25000,
              unitPrice: 25000,
              subtotal: 50000,
            },
          ],
        },
      },
    });
    createdSaleIds.push(sale2.id);

    // Orden 3: COMPLETADA, EN_CAMINO por Correo Argentino
    const sale3 = await prisma.sale.create({
      data: {
        invoiceNumber: `WEB-TEST-${runId}-03`,
        channel: "WEB",
        status: "COMPLETADA",
        shippingStatus: "EN_CAMINO",
        shippingMethod: "CORREO_ARGENTINO",
        shippingTrackingCode: `AR${runId}TEST`,
        customerName: `Carlos López ${runId}`,
        customerEmail: testEmail,
        customerPhone: testPhone,
        customerDni: "40111222",
        shippingAddress: "San Martín 500",
        shippingCity: "Clorinda",
        shippingPostalCode: "3610",
        total: 25000,
        items: {
          create: [
            {
              variantId: testVariant.id,
              quantity: 1,
              price: 25000,
              unitPrice: 25000,
              subtotal: 25000,
            },
          ],
        },
      },
    });
    createdSaleIds.push(sale3.id);

    assert(createdSaleIds.length === 3, "3 órdenes web creadas con éxito en base de datos");

    // --------------------------------------------------------------------------
    // 3. CONSULTA CON getWebOrdersAction (Listado y Conteos)
    // --------------------------------------------------------------------------
    console.log("\n📊 Fase 3: Consulta general de órdenes y conteos con getWebOrdersAction...");

    const allOrdersRes = await getWebOrdersAction({ page: 1, limit: 50 });
    assert(allOrdersRes.success === true, "getWebOrdersAction responde con éxito");
    assert(allOrdersRes.counts.total >= 3, `Conteos globales calculados correctamente (total: ${allOrdersRes.counts.total})`);
    assert(allOrdersRes.counts.pendingPayment >= 1, `Conteo de órdenes pendientes de pago >= 1 (actual: ${allOrdersRes.counts.pendingPayment})`);
    assert(allOrdersRes.counts.inPreparation >= 1, `Conteo de órdenes en preparación >= 1 (actual: ${allOrdersRes.counts.inPreparation})`);
    assert(allOrdersRes.counts.onTheWay >= 1, `Conteo de órdenes en camino >= 1 (actual: ${allOrdersRes.counts.onTheWay})`);

    // --------------------------------------------------------------------------
    // 4. FILTROS POR ESTADO DE PAGO Y ESTADO LOGÍSTICO
    // --------------------------------------------------------------------------
    console.log("\n🔍 Fase 4: Filtros por estado logístico y de pago...");

    const pendingPayRes = await getWebOrdersAction({
      paymentStatus: "PENDIENTE_PAGO",
      search: runId,
    });
    assert(
      pendingPayRes.orders.some((o) => o.id === sale1.id),
      "Filtro PENDIENTE_PAGO encuentra la orden esperada"
    );

    const inPrepRes = await getWebOrdersAction({
      shippingStatus: "EN_PREPARACION",
      search: runId,
    });
    assert(
      inPrepRes.orders.some((o) => o.id === sale2.id),
      "Filtro EN_PREPARACION encuentra la orden en picking"
    );

    const onTheWayRes = await getWebOrdersAction({
      shippingStatus: "EN_CAMINO",
      search: runId,
    });
    assert(
      onTheWayRes.orders.some((o) => o.id === sale3.id),
      "Filtro EN_CAMINO encuentra la orden despachada por correo"
    );

    const shippingMethodRes = await getWebOrdersAction({
      shippingMethod: "CORREO_ARGENTINO",
      search: runId,
    });
    assert(
      shippingMethodRes.orders.some((o) => o.id === sale3.id),
      "Filtro por modalidad CORREO_ARGENTINO funciona correctamente"
    );

    // --------------------------------------------------------------------------
    // 5. BÚSQUEDA TEXTUAL (Código, DNI, Teléfono, Guía)
    // --------------------------------------------------------------------------
    console.log("\n🔎 Fase 5: Búsqueda textual omnicanal...");

    const searchByCodeRes = await getWebOrdersAction({
      search: `WEB-TEST-${runId}-01`,
    });
    assert(
      searchByCodeRes.orders.length === 1 && searchByCodeRes.orders[0].id === sale1.id,
      "Búsqueda por código exacto de comprobante encuentra la orden"
    );

    const searchByDniRes = await getWebOrdersAction({
      search: "38999888",
    });
    assert(
      searchByDniRes.orders.some((o) => o.id === sale2.id),
      "Búsqueda por DNI del comprador encuentra la orden"
    );

    const searchByTrackingRes = await getWebOrdersAction({
      search: `AR${runId}TEST`,
    });
    assert(
      searchByTrackingRes.orders.some((o) => o.id === sale3.id),
      "Búsqueda por código de guía de Correo Argentino encuentra la orden"
    );

    // --------------------------------------------------------------------------
    // 6. DETALLE DE ORDEN CON ARTÍCULOS PARA PICKING
    // --------------------------------------------------------------------------
    console.log("\n📋 Fase 6: Consulta de detalle con getWebOrderDetailAction...");

    const detailRes = await getWebOrderDetailAction(sale2.id);
    assert(detailRes.success === true && Boolean(detailRes.data), "getWebOrderDetailAction responde con éxito");
    const detailData = detailRes.data!;

    assert(detailData.items.length === 1, "Detalle incluye 1 ítem de compra");
    assert(detailData.items[0].stockStore === testVariant.stockStore, "Detalle desglosa stock en Salón");
    assert(detailData.items[0].stockWarehouse === testVariant.stockWarehouse, "Detalle desglosa stock en Depósito");
    assert(detailData.customerName === `María Gómez ${runId}`, "Nombre del comprador recuperado correctamente");
    assert(detailData.customerWhatsAppUrl !== null, "Enlace directo de WhatsApp generado para el comprador");

    // --------------------------------------------------------------------------
    // 7. ACTUALIZACIÓN DE ESTADO LOGÍSTICO Y NOTIFICACIÓN POR EMAIL
    // --------------------------------------------------------------------------
    console.log("\n🚚 Fase 7: Actualización de estado logístico y disparo de correo...");

    // Actualizar sale2 de EN_PREPARACION a LISTO_RETIRO
    const updateToListoRes = await updateWebOrderShippingStatusAction({
      orderId: sale2.id,
      shippingStatus: "LISTO_RETIRO",
      notifyCustomer: true,
      notes: "Preparado en caja 1 de mostrador",
    });

    assert(updateToListoRes.success === true, "updateWebOrderShippingStatusAction pasa a LISTO_RETIRO exitosamente");
    assert(updateToListoRes.data?.shippingStatus === "LISTO_RETIRO", "Estado persistido como LISTO_RETIRO");
    assert(updateToListoRes.emailDispatched === true, "Notificación transaccional por correo despachada");

    // Actualizar sale2 a EN_CAMINO con código de seguimiento
    const testTrackingCode = `TN${runId}AR`;
    const updateToEnCaminoRes = await updateWebOrderShippingStatusAction({
      orderId: sale2.id,
      shippingStatus: "EN_CAMINO",
      shippingTrackingCode: testTrackingCode,
      notifyCustomer: true,
    });

    assert(updateToEnCaminoRes.success === true, "updateWebOrderShippingStatusAction pasa a EN_CAMINO exitosamente");
    assert(updateToEnCaminoRes.data?.shippingTrackingCode === testTrackingCode, "Código de guía guardado correctamente");
    assert(
      updateToEnCaminoRes.data?.correoArgentinoTrackingUrl === CORREO_ARGENTINO_TRACKING_URL,
      "URL de seguimiento oficial de Correo Argentino vinculada"
    );

    // --------------------------------------------------------------------------
    // 8. GENERACIÓN DE ENLACE WHATSAPP VENDEDOR-COMPRADOR
    // --------------------------------------------------------------------------
    console.log("\n💬 Fase 8: Generación de enlace de WhatsApp Staff-a-Cliente...");

    const waUrl = formatStaffToCustomerWhatsAppUrl({
      customerPhone: "5493704123456",
      customerName: "Ricardo Dellagnolo",
      orderCode: "WEB-2026-9999",
      shippingStatus: "LISTO_RETIRO",
    });

    assert(waUrl.startsWith("https://wa.me/5493704123456"), "URL de WhatsApp utiliza número internacional sanitizado");
    assert(waUrl.includes(encodeURIComponent("WEB-2026-9999")), "Mensaje incluye el código de orden codificado");
    assert(waUrl.includes(encodeURIComponent("Matacos Deportes")), "Mensaje incluye mención a Saavedra 241 y Matacos Deportes");

    // --------------------------------------------------------------------------
    // 9. CANCELACIÓN MANUAL DESDE MOSTRADOR CON LIBERACIÓN DE RESERVA
    // --------------------------------------------------------------------------
    console.log("\n🛑 Fase 9: Cancelación manual de orden no pagada...");

    // Reservar 1 unidad en la variante para simular la reserva de sale1
    await prisma.productVariant.update({
      where: { id: testVariant.id },
      data: { stockReserved: { increment: 1 } },
    });

    const initialReservedStock = (await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    }))?.stockReserved ?? 0;

    const cancelRes = await cancelWebOrderManualAction({
      orderId: sale1.id,
      reason: "Comprador desistió de la compra en mostrador",
    });

    assert(cancelRes.success === true, "cancelWebOrderManualAction cancela orden no pagada");
    assert(cancelRes.data?.status === "CANCELADA", "Estado de orden actualizado a CANCELADA");

    const finalReservedStock = (await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    }))?.stockReserved ?? 0;

    assert(
      finalReservedStock === initialReservedStock - 1,
      `Stock reservado liberado atómicamente (${initialReservedStock} -> ${finalReservedStock})`
    );

    // Intentar cancelar una orden completada debe fallar
    const cancelCompletedRes = await cancelWebOrderManualAction({
      orderId: sale2.id,
      reason: "Intento inválido",
    });
    assert(
      cancelCompletedRes.success === false,
      "Cancelación de orden completada es rechazada con mensaje de error"
    );

  } catch (err) {
    console.error("❌ ERROR INESPERADO DURANTE LA SUITE:", err);
    stats.failed++;
  } finally {
    // --------------------------------------------------------------------------
    // 10. CLEANUP DE REGISTROS DE PRUEBA
    // --------------------------------------------------------------------------
    console.log("\n🧹 Limpieza de datos de prueba...");
    try {
      if (createdSaleIds.length > 0) {
        await prisma.saleItem.deleteMany({
          where: { saleId: { in: createdSaleIds } },
        });
        await prisma.sale.deleteMany({
          where: { id: { in: createdSaleIds } },
        });
      }
      console.log("  ✅ Limpieza completada con éxito.");
    } catch (cleanupErr) {
      console.warn("  ⚠️ Advertencia durante limpieza:", cleanupErr);
    }
  }

  console.log("\n================================================================================");
  console.log(`📊 RESUMEN FINAL: ${stats.passed} PASARON | ${stats.failed} FALLARON`);
  console.log("================================================================================");

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runTicket03Tests();
