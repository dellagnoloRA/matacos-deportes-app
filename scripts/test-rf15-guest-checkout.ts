import { prisma } from "../src/lib/prisma";
import { GuestCheckoutSchema } from "../src/schemas/ecommerce";
import {
  validateCartItems,
  createGuestOrder,
  releaseExpiredWebOrders,
  cancelGuestOrder,
} from "../src/server/actions/ecommerce/checkoutActions";
import { checkVariantStock } from "../src/server/actions/ecommerce/productDetailActions";
import { formatCurrency } from "../src/lib/utils";

async function runRf15Tests() {
  console.log("===============================================================");
  console.log("🧪 TEST SUITE: RF-15 Carrito, Guest Checkout y Reserva de Stock");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     Detalle: ${detail}`);
      failed++;
    }
  }

  // 0. Seleccionar una variante real con stock suficiente para las pruebas
  const sampleVariant = await prisma.productVariant.findFirst({
    where: {
      product: { active: true },
      stockStore: { gte: 4 },
    },
    include: {
      product: true,
    },
  });

  if (!sampleVariant) {
    console.error(
      "❌ No se encontró ninguna variante activa con stock >= 4 para ejecutar las pruebas."
    );
    process.exit(1);
  }

  const initialReserved = sampleVariant.stockReserved;
  const initialAvailable =
    sampleVariant.stockStore + sampleVariant.stockWarehouse - initialReserved;
  const expectedPrice =
    sampleVariant.price !== null
      ? Number(sampleVariant.price)
      : Number(sampleVariant.product.price);

  console.log(
    `📦 Variante de prueba: "${sampleVariant.product.name}" — Talle ${sampleVariant.size} / ${sampleVariant.color}`
  );
  console.log(
    `   Stock Salón: ${sampleVariant.stockStore} | Depósito: ${sampleVariant.stockWarehouse} | Reservado Inicial: ${initialReserved} | Disponible: ${initialAvailable}\n`
  );

  const createdSaleIds: string[] = [];

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Esquema Zod GuestCheckoutSchema
    // --------------------------------------------------------------------------
    console.log("🔹 1. Validación de Esquema Zod: GuestCheckoutSchema");

    const validPickup = GuestCheckoutSchema.safeParse({
      customerName: "Juan Pérez",
      customerDni: "38.456.789",
      customerEmail: "juan.perez@example.com",
      customerPhone: "3704123456",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: sampleVariant.id, quantity: 2 }],
    });
    assert(
      validPickup.success,
      "Acepta compra como invitado con RETIRO_LOCAL sin exigir dirección postal"
    );

    const invalidDeliveryNoAddress = GuestCheckoutSchema.safeParse({
      customerName: "María Gómez",
      customerDni: "40111222",
      customerEmail: "maria@example.com",
      customerPhone: "3704654321",
      shippingMethod: "CADETERIA_FORMOSA",
      shippingAddress: "",
      items: [{ variantId: sampleVariant.id, quantity: 1 }],
    });
    assert(
      !invalidDeliveryNoAddress.success,
      "Rechaza envío por CADETERIA_FORMOSA si no se especifica dirección de entrega"
    );

    const invalidDni = GuestCheckoutSchema.safeParse({
      customerName: "Pedro López",
      customerDni: "ABC-INVALIDO",
      customerEmail: "pedro@example.com",
      customerPhone: "3704999888",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: sampleVariant.id, quantity: 1 }],
    });
    assert(!invalidDni.success, "Rechaza DNI/CUIT con formato alfanumérico inválido");

    const invalidEmptyCart = GuestCheckoutSchema.safeParse({
      customerName: "Pedro López",
      customerDni: "35123456",
      customerEmail: "pedro@example.com",
      customerPhone: "3704999888",
      shippingMethod: "RETIRO_LOCAL",
      items: [],
    });
    assert(!invalidEmptyCart.success, "Rechaza orden con lista de ítems vacía");

    // --------------------------------------------------------------------------
    // TEST 2: Server Action validateCartItems(items)
    // --------------------------------------------------------------------------
    console.log("\n🔹 2. Server Action: validateCartItems(items)");

    const validCartRes = await validateCartItems([
      {
        variantId: sampleVariant.id,
        quantity: 2,
        expectedUnitPrice: expectedPrice,
      },
    ]);

    assert(validCartRes.success && Boolean(validCartRes.data), "validateCartItems() responde con éxito");
    if (validCartRes.data) {
      assert(validCartRes.data.isValid === true, "Carrito válido cuando hay stock suficiente");
      assert(
        validCartRes.data.hasPriceChanges === false,
        "No reporta cambio de precio cuando coincide con DB"
      );
      assert(
        validCartRes.data.subtotalProducts === expectedPrice * 2,
        `Subtotal calculado con precio vigente en DB: ${formatCurrency(validCartRes.data.subtotalProducts)}`
      );
    }

    // Probar detección de cambio de precio
    const outdatedPriceRes = await validateCartItems([
      {
        variantId: sampleVariant.id,
        quantity: 1,
        expectedUnitPrice: expectedPrice - 5000,
      },
    ]);
    assert(
      Boolean(outdatedPriceRes.data?.hasPriceChanges === true),
      "Detecta discrepancia si el precio en el carrito difiere del vigente en PostgreSQL"
    );

    // Probar detección de exceso de stock
    const excessiveStockRes = await validateCartItems([
      {
        variantId: sampleVariant.id,
        quantity: initialAvailable + 50,
      },
    ]);
    assert(
      Boolean(
        excessiveStockRes.data?.isValid === false &&
          excessiveStockRes.data?.hasStockIssues === true
      ),
      "Detecta falta de stock cuando la cantidad supera el stock neto disponible"
    );

    // --------------------------------------------------------------------------
    // TEST 3: Server Action transaccional createGuestOrder(payload)
    // --------------------------------------------------------------------------
    console.log("\n🔹 3. Server Action Transaccional: createGuestOrder(payload)");

    const orderQty = 2;
    const orderRes = await createGuestOrder({
      customerName: "Carlos Invitado Formosa",
      customerDni: "36789012",
      customerEmail: "carlos.invitado@formosa.com.ar",
      customerPhone: "3704556677",
      shippingMethod: "CADETERIA_FORMOSA",
      shippingAddress: "Av. 25 de Mayo 850",
      shippingCity: "Formosa",
      shippingPostalCode: "3600",
      items: [{ variantId: sampleVariant.id, quantity: orderQty }],
    });

    assert(orderRes.success && Boolean(orderRes.data), "createGuestOrder() ejecutado exitosamente");

    if (orderRes.success && orderRes.data) {
      const order = orderRes.data;
      createdSaleIds.push(order.saleId);

      assert(
        /^WEB-\d{4}-\d{4,}$/.test(order.orderCode),
        `Código correlativo generado con formato oficial: ${order.orderCode}`
      );
      assert(
        order.channel === "WEB" && order.status === "PENDIENTE_PAGO",
        `Estado inicial correcto: channel="${order.channel}", status="${order.status}"`
      );
      assert(
        order.customer.isGuest === true && order.customer.dni === "36789012",
        "Datos de comprador invitado persistidos sin requerir cuenta registrada"
      );
      assert(
        order.totals.total === expectedPrice * orderQty + 2500,
        `Total calculado incluye subtotal (${formatCurrency(expectedPrice * orderQty)}) + cadetería ($ 2.500,00) = ${order.totals.totalFormatted}`
      );
      assert(
        order.whatsappContingencyUrl.includes("wa.me") &&
          order.whatsappContingencyUrl.includes(order.orderCode),
        "Mitigación R-04: Incluye enlace de contingencia por WhatsApp con el código de orden"
      );

      // 3.2 Verificar incremento atómico de stockReserved en DB y en checkVariantStock (RF-14)
      const stockAfterOrder = await checkVariantStock(sampleVariant.id);
      assert(
        stockAfterOrder.success &&
          stockAfterOrder.data?.availableStock === initialAvailable - orderQty,
        `Mitigación R-01: Stock disponible en tiempo real disminuyó de ${initialAvailable} a ${stockAfterOrder.data?.availableStock} un. tras la reserva`
      );

      // 3.3 Verificar creación de SaleItem con precio congelado
      const dbSale = await prisma.sale.findUnique({
        where: { id: order.saleId },
        include: { items: true },
      });
      assert(
        Boolean(
          dbSale &&
            dbSale.items.length === 1 &&
            Number(dbSale.items[0].unitPrice) === expectedPrice &&
            Number(dbSale.items[0].subtotal) === expectedPrice * orderQty
        ),
        "Registro en SaleItem congela precio unitario y subtotal calculado en PostgreSQL"
      );
    }

    // --------------------------------------------------------------------------
    // TEST 4: Prevención de Sobreventas Concurrentes (Riesgo R-01)
    // --------------------------------------------------------------------------
    console.log("\n🔹 4. Prevención de Sobreventas (Riesgo R-01)");
    const remainingAvailable = initialAvailable - orderQty;
    const oversellAttempt = await createGuestOrder({
      customerName: "Intento Sobreventa",
      customerDni: "39000111",
      customerEmail: "sobreventa@test.com",
      customerPhone: "3704112233",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: sampleVariant.id, quantity: remainingAvailable + 1 }],
    });

    assert(
      oversellAttempt.success === false &&
        Boolean(oversellAttempt.error?.includes("Stock insuficiente")),
      `Bloquea intento de compra que excede el stock no reservado (Disponible: ${remainingAvailable}, Solicitado: ${remainingAvailable + 1})`
    );

    // --------------------------------------------------------------------------
    // TEST 5: Liberación Automática de Stock Reservado tras 15 Minutos (Punto 4 / Riesgo R-01)
    // --------------------------------------------------------------------------
    console.log(
      "\n🔹 5. Liberación Automática de Stock por Vencimiento (> 15 minutos impaga)"
    );

    if (createdSaleIds.length > 0) {
      const targetSaleId = createdSaleIds[0];

      // Simular que la orden fue creada hace 16 minutos
      const sixteenMinutesAgo = new Date(Date.now() - 16 * 60 * 1000);
      await prisma.sale.update({
        where: { id: targetSaleId },
        data: { createdAt: sixteenMinutesAgo },
      });

      // Ejecutar tarea de liberación de órdenes vencidas (umbral 15 min)
      const releaseRes = await releaseExpiredWebOrders(15);
      assert(
        releaseRes.success &&
          Boolean(releaseRes.data && releaseRes.data.releasedOrdersCount >= 1),
        `releaseExpiredWebOrders(15) detectó y canceló ${releaseRes.data?.releasedOrdersCount} orden(es) vencida(s)`
      );

      // Verificar que la orden pasó a CANCELADA
      const expiredSaleInDb = await prisma.sale.findUnique({
        where: { id: targetSaleId },
      });
      assert(
        expiredSaleInDb?.status === "CANCELADA",
        "La orden impaga tras 15 minutos pasó a estado CANCELADA"
      );

      // Verificar que el stockReserved volvió exactamente a su valor inicial
      const stockAfterRelease = await checkVariantStock(sampleVariant.id);
      assert(
        stockAfterRelease.success &&
          stockAfterRelease.data?.availableStock === initialAvailable,
        `El stock disponible se restituyó íntegramente a ${initialAvailable} unidades`
      );
    }
  } finally {
    // Limpieza de registros de prueba creados durante el test
    for (const saleId of createdSaleIds) {
      try {
        const s = await prisma.sale.findUnique({
          where: { id: saleId },
          include: { items: true },
        });
        if (s && s.status === "PENDIENTE_PAGO") {
          await cancelGuestOrder(saleId, "Limpieza post-test RF-15");
        }
        await prisma.sale.delete({ where: { id: saleId } });
      } catch {
        // Ignorar si ya fue eliminado
      }
    }
  }

  // --------------------------------------------------------------------------
  // RESUMEN FINAL
  // --------------------------------------------------------------------------
  console.log("\n===============================================================");
  console.log(`📊 RESULTADOS RF-15: ${passed} pasados, ${failed} fallidos`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRf15Tests().catch((err) => {
  console.error("Error fatal en pruebas RF-15:", err);
  process.exit(1);
});
