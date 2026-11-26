/**
 * Suite de Pruebas Automatizadas de Backend: RF-17
 * Pago por Transferencia Bancaria, Carga de Comprobante y Conciliación Administrativa
 * Matacos Deportes — Saavedra 241, Formosa Capital
 *
 * Ejecución: pnpm tsx scripts/test-rf17-bank-transfer.ts
 */

import { prisma } from "../src/lib/prisma";
import { companyConfig } from "../src/config/company";
import {
  getBankTransferDetails,
  submitTransferProof,
  verifyTransferPayment,
  getPendingTransferOrders,
} from "../src/server/actions/ecommerce/bankTransferActions";
import {
  SubmitTransferProofSchema,
  VerifyTransferPaymentSchema,
} from "../src/schemas/ecommerce";

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
  console.log("\n========================================================");
  console.log(" MATACOS DEPORTES — TEST SUITE RF-17: TRANSFERENCIA BANCARIA");
  console.log("========================================================\n");

  // --------------------------------------------------------------------------
  // GRUPO 1: Datos Bancarios Institucionales (Tarea 2)
  // --------------------------------------------------------------------------
  console.log("--- 1. Datos Bancarios Institucionales (getBankTransferDetails) ---");
  const bankDetails = await getBankTransferDetails();
  assert(Boolean(bankDetails.bankName), `Banco expuesto: ${bankDetails.bankName}`);
  assert(Boolean(bankDetails.cbu && bankDetails.cbu.length >= 20), `CBU institucional válido: ${bankDetails.cbu}`);
  assert(Boolean(bankDetails.alias && bankDetails.alias.includes(".")), `Alias bancario válido: ${bankDetails.alias}`);
  assert(Boolean(bankDetails.cuit), `CUIT fiscal: ${bankDetails.cuit}`);
  assert(Boolean(bankDetails.accountHolder), `Titular de cuenta: ${bankDetails.accountHolder}`);
  assert(bankDetails.accountHolder === companyConfig.bankAccountHolder, "Titular coincide con companyConfig");

  // --------------------------------------------------------------------------
  // GRUPO 2: Esquemas Zod (Tarea 3)
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Validación de Esquemas Zod (SubmitTransferProofSchema & VerifyTransferPaymentSchema) ---");

  // SubmitTransferProofSchema
  const validSubmit = SubmitTransferProofSchema.safeParse({
    orderId: "WEB-2026-TEST",
    proofUrl: "/uploads/comprobantes/comprobante_123.webp",
    reference: "TRANSF-889922",
    customerNotes: "Pago realizado desde Banco de Formosa",
  });
  assert(validSubmit.success, "SubmitTransferProofSchema acepta comprobante local válido");

  const invalidSubmitUrl = SubmitTransferProofSchema.safeParse({
    orderId: "WEB-2026-TEST",
    proofUrl: "ftp://archivo-invalido.bin",
  });
  assert(!invalidSubmitUrl.success, "SubmitTransferProofSchema rechaza URL/ruta inválida");

  // VerifyTransferPaymentSchema
  const validApproval = VerifyTransferPaymentSchema.safeParse({
    orderId: "WEB-2026-TEST",
    approved: true,
    adminNotes: "Acreditado en extracto bancario del día",
    reconciledBy: "Nahir Fornari",
  });
  assert(validApproval.success, "VerifyTransferPaymentSchema acepta aprobación válida");

  const validRejection = VerifyTransferPaymentSchema.safeParse({
    orderId: "WEB-2026-TEST",
    approved: false,
    rejectionReason: "Importe transferido no coincide con la orden",
    cancelOrderOnReject: false,
  });
  assert(validRejection.success, "VerifyTransferPaymentSchema acepta rechazo con preservación de reserva");

  // --------------------------------------------------------------------------
  // GRUPO 3: Flujo Completo con Base de Datos (Tareas 1, 4 y 5)
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Flujo Transaccional de Carga y Conciliación con BD ---");

  // Crear variante y producto de prueba
  let discipline = await prisma.discipline.findFirst();
  if (!discipline) {
    discipline = await prisma.discipline.create({
      data: { name: "Natación Test RF17", slug: "natacion-test-rf17" },
    });
  }

  let brand = await prisma.brand.findFirst();
  if (!brand) {
    brand = await prisma.brand.create({
      data: { name: "Arena Test", slug: "arena-test" },
    });
  }

  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Mallas Test", slug: "mallas-test" },
    });
  }

  const testProduct = await prisma.product.create({
    data: {
      name: "Malla Entrenamiento RF-17 Test",
      price: 45000.0,
      disciplineId: discipline.id,
      brandId: brand.id,
      categoryId: category.id,
    },
  });

  const testVariant = await prisma.productVariant.create({
    data: {
      productId: testProduct.id,
      sku: `RF17-TEST-${Date.now()}`,
      size: "M",
      color: "Azul",
      stockStore: 5,
      stockWarehouse: 10,
      stockReserved: 2, // 2 unidades reservadas
    },
  });

  const testOrderCode = `WEB-RF17-${Date.now().toString().slice(-6)}`;
  const testSale = await prisma.sale.create({
    data: {
      invoiceNumber: testOrderCode,
      channel: "WEB",
      status: "PENDIENTE_PAGO",
      customerName: "Juan Pérez Test",
      customerEmail: "juan.test@gmail.com",
      customerPhone: "3704112233",
      customerDni: "35123456",
      shippingMethod: "RETIRO_LOCAL",
      total: 90000.0,
      items: {
        create: [
          {
            variantId: testVariant.id,
            quantity: 2,
            unitPrice: 45000.0,
            price: 45000.0,
            subtotal: 90000.0,
          },
        ],
      },
    },
  });

  assert(Boolean(testSale.id), `Orden de prueba creada: ${testOrderCode} en PENDIENTE_PAGO`);

  // Paso 3.1: Cliente carga comprobante (submitTransferProof)
  console.log("\n  Paso 3.1: submitTransferProof(...)");
  const submitRes = await submitTransferProof({
    orderId: testSale.id,
    proofUrl: "/uploads/comprobantes/comp_test_123.webp",
    reference: "COMP-009988",
    customerNotes: "Adjunto comprobante transferencia Red Link",
  });

  assert(submitRes.success, "submitTransferProof respondió success: true");
  assert(submitRes.status === "PENDIENTE_VERIFICACION", "Estado de orden cambió a PENDIENTE_VERIFICACION");
  assert(Boolean(submitRes.whatsappConfirmationUrl), "Generó URL de confirmación por WhatsApp");

  const refreshedSaleAfterProof = await prisma.sale.findUnique({
    where: { id: testSale.id },
    include: { payments: true },
  });
  assert(refreshedSaleAfterProof?.status === "PENDIENTE_VERIFICACION", "BD: status es PENDIENTE_VERIFICACION");
  assert(refreshedSaleAfterProof?.transferProofUrl === "/uploads/comprobantes/comp_test_123.webp", "BD: transferProofUrl almacenado");
  assert(refreshedSaleAfterProof?.payments.some((p) => p.method === "TRANSFERENCIA"), "BD: SalePayment con método TRANSFERENCIA registrado");

  // Paso 3.2: Administrador lista órdenes pendientes (getPendingTransferOrders)
  console.log("\n  Paso 3.2: getPendingTransferOrders(...)");
  const pendingOrdersRes = await getPendingTransferOrders({ search: testOrderCode });
  assert(pendingOrdersRes.success, "getPendingTransferOrders respondió success: true");
  assert(
    Boolean(pendingOrdersRes.data?.some((o) => o.orderCode === testOrderCode)),
    "getPendingTransferOrders encuentra la orden en estado PENDIENTE_VERIFICACION"
  );

  // Paso 3.3: Administrador rechaza pero mantiene reserva temporal para que el cliente reenvíe
  console.log("\n  Paso 3.3: verifyTransferPayment (rechazo temporal)");
  const rejectTempRes = await verifyTransferPayment({
    orderId: testSale.id,
    approved: false,
    rejectionReason: "El monto no coincide exactamente con el total de la orden",
    cancelOrderOnReject: false,
    reconciledBy: "Admin Sandra",
  });
  assert(rejectTempRes.success, "verifyTransferPayment (rechazo) respondió success: true");
  assert(rejectTempRes.status === "PENDIENTE_PAGO", "Orden regresó a PENDIENTE_PAGO");

  const variantAfterTempReject = await prisma.productVariant.findUnique({
    where: { id: testVariant.id },
  });
  assert(variantAfterTempReject?.stockReserved === 2, "Stock reservado (2) se mantiene para reintento");

  // Paso 3.4: Cliente reenvía comprobante correcto
  console.log("\n  Paso 3.4: Reenvío de comprobante por el cliente");
  await submitTransferProof({
    orderId: testSale.id,
    proofUrl: "/uploads/comprobantes/comp_test_corregido.webp",
    reference: "COMP-009989",
  });

  // Paso 3.5: Administrador APRUEBA la transferencia (Acreditación y consolidación de stock)
  console.log("\n  Paso 3.5: verifyTransferPayment (APROBACIÓN)");
  const approveRes = await verifyTransferPayment({
    orderId: testSale.id,
    approved: true,
    adminNotes: "Acreditado y conciliado en Banco de Formosa",
    reconciledBy: "Nahir Fornari",
  });

  assert(approveRes.success, "verifyTransferPayment (aprobación) respondió success: true");
  assert(approveRes.status === "COMPLETADA", "Orden cambió a estado COMPLETADA");

  const saleAfterApprove = await prisma.sale.findUnique({
    where: { id: testSale.id },
    include: { payments: true },
  });
  assert(saleAfterApprove?.status === "COMPLETADA", "BD: status es COMPLETADA");
  assert(saleAfterApprove?.shippingStatus === "EN_PREPARACION", "BD: shippingStatus pasó a EN_PREPARACION");
  assert(Boolean(saleAfterApprove?.reconciledAt), "BD: reconciledAt registrado");
  assert(saleAfterApprove?.reconciledBy === "Nahir Fornari", "BD: reconciledBy registrado correctamente");

  // Verificar consolidación de stock y movimiento VENTA_WEB
  const variantAfterApprove = await prisma.productVariant.findUnique({
    where: { id: testVariant.id },
  });
  assert(variantAfterApprove?.stockReserved === 0, "BD: stockReserved fue liberado a 0");
  assert(variantAfterApprove?.stockWarehouse === 8, "BD: stockWarehouse descontó 2 unidades (10 -> 8)");

  const movement = await prisma.inventoryMovement.findFirst({
    where: {
      variantId: testVariant.id,
      type: "VENTA_WEB",
    },
    orderBy: { createdAt: "desc" },
  });
  assert(Boolean(movement), "BD: Movimiento de inventario VENTA_WEB generado");
  assert(movement?.quantity === 2, "BD: Movimiento VENTA_WEB tiene cantidad 2");

  // Limpieza de datos de prueba
  console.log("\n--- 4. Limpieza de Registros de Prueba ---");
  await prisma.inventoryMovement.deleteMany({ where: { variantId: testVariant.id } });
  await prisma.salePayment.deleteMany({ where: { saleId: testSale.id } });
  await prisma.saleItem.deleteMany({ where: { saleId: testSale.id } });
  await prisma.sale.delete({ where: { id: testSale.id } });
  await prisma.productVariant.delete({ where: { id: testVariant.id } });
  await prisma.product.delete({ where: { id: testProduct.id } });
  console.log("  ✓ Registros de prueba eliminados correctamente");

  // --------------------------------------------------------------------------
  // RESUMEN FINAL
  // --------------------------------------------------------------------------
  console.log("\n========================================================");
  console.log(` RESULTADOS SUITE RF-17: ${passed} PASARON, ${failed} FALLARON`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Error fatal durante la ejecución de pruebas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
