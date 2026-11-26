import { prisma } from "../src/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  encryptCustomerSession,
  decryptCustomerSession,
  setTestContextCustomerToken,
} from "../src/lib/customerSession";
import { decryptSession } from "../src/lib/session";
import { hasPermission } from "../src/server/actions/authActions";
import {
  registerCustomerAction,
  loginCustomerAction,
  logoutCustomerAction,
  toggleCustomerFavoriteAction,
  getCustomerFavoritesDetailsAction,
  getCustomerOrdersAction,
  trackPublicWebOrderAction,
  cancelCustomerOrderAction,
  updateWebOrderShippingStatusAction,
  updateCustomerProfileAction,
} from "../src/server/actions/ecommerce/customerActions";
import { createGuestOrder } from "../src/server/actions/ecommerce/checkoutActions";

async function runRf29Tests() {
  console.log("=====================================================================");
  console.log("🧪 TEST SUITE: RF-29 Portal de Clientes, Favoritos y Seguimiento Web");
  console.log("=====================================================================\n");

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

  const testRunSuffix = Date.now().toString().slice(-6);
  const testEmail1 = `cliente.rf29.${testRunSuffix}@matacos.test`;
  const testEmailGuest = `invitado.rf29.${testRunSuffix}@matacos.test`;

  const createdCustomerIds: string[] = [];
  const createdSaleIds: string[] = [];

  // Buscar al menos 2 productos activos y 1 variante con stock >= 4 para pruebas reales
  const activeProducts = await prisma.product.findMany({
    where: { active: true },
    take: 3,
    select: { id: true, name: true },
  });

  const sampleVariant = await prisma.productVariant.findFirst({
    where: {
      product: { active: true },
      stockStore: { gte: 4 },
    },
    include: { product: true },
  });

  if (activeProducts.length < 2 || !sampleVariant) {
    console.error(
      "❌ Se requieren al menos 2 productos activos y 1 variante con stock >= 4 en la base de datos."
    );
    process.exit(1);
  }

  const productA = activeProducts[0]!;
  const productB = activeProducts[1]!;

  try {
    // ------------------------------------------------------------------------
    // 1. Customer Registration & Password Hashing
    // ------------------------------------------------------------------------
    console.log("🔹 1. Registro de Cliente, Unicidad de Email y Hashing bcryptjs");

    const regRes = await registerCustomerAction({
      name: "Martín Gómez",
      email: testEmail1,
      password: "MiClaveSegura2026!",
      phone: "3704556677",
      dni: "38999111",
      defaultAddress: "Av. 25 de Mayo 450",
      defaultCity: "Formosa",
      defaultPostalCode: "3600",
    });

    assert(
      regRes.success && Boolean(regRes.data?.customer.id),
      "registerCustomerAction() crea registro en tabla Customer exitosamente"
    );

    if (regRes.data?.customer.id) {
      createdCustomerIds.push(regRes.data.customer.id);

      const dbCustomer = await prisma.customer.findUnique({
        where: { id: regRes.data.customer.id },
      });

      assert(
        Boolean(
          dbCustomer?.password &&
            dbCustomer.password !== "MiClaveSegura2026!" &&
            dbCustomer.password.startsWith("$2")
        ),
        "La contraseña se almacena como hash irreversible bcryptjs"
      );

      if (dbCustomer?.password) {
        const isMatch = await bcrypt.compare(
          "MiClaveSegura2026!",
          dbCustomer.password
        );
        assert(
          isMatch,
          "El hash almacenado valida correctamente con bcrypt.compare()"
        );
      }
    }

    // Intentar duplicar registro con el mismo correo
    const duplicateReg = await registerCustomerAction({
      name: "Otro Nombre",
      email: testEmail1.toUpperCase(), // prueba case-insensitive
      password: "OtraPassword123",
    });

    assert(
      !duplicateReg.success,
      "Rechaza registro duplicado con un correo electrónico ya existente"
    );

    // Probar actualización de perfil y dirección
    const updateProfileRes = await updateCustomerProfileAction({
      name: "Martín Ignacio Gómez",
      phone: "3704112233",
      dni: "38999111",
      defaultAddress: "Saavedra 500 Piso 2",
      defaultCity: "Formosa Capital",
      defaultPostalCode: "3600",
    });

    assert(
      updateProfileRes.success &&
        updateProfileRes.data?.defaultAddress === "Saavedra 500 Piso 2",
      "updateCustomerProfileAction() actualiza dirección postal predeterminada"
    );

    // ------------------------------------------------------------------------
    // 2. Session Lifecycle (matacos_customer_token)
    // ------------------------------------------------------------------------
    console.log("\n🔹 2. Ciclo de Vida de Sesión JWT (matacos_customer_token)");

    const validToken = await encryptCustomerSession({
      customerId: regRes.data!.customer.id,
      email: testEmail1,
      name: "Martín Gómez",
      role: "CUSTOMER",
    });

    const decrypted = await decryptCustomerSession(validToken);
    assert(
      Boolean(
        decrypted &&
          decrypted.customerId === regRes.data!.customer.id &&
          decrypted.email === testEmail1 &&
          decrypted.role === "CUSTOMER"
      ),
      "Cifra y descifra correctamente los claims del token matacos_customer_token"
    );

    // Token expirado
    const expiredToken = await encryptCustomerSession(
      {
        customerId: regRes.data!.customer.id,
        email: testEmail1,
        name: "Martín Gómez",
        role: "CUSTOMER",
      },
      "-5s"
    );
    const decryptedExpired = await decryptCustomerSession(expiredToken);
    assert(
      decryptedExpired === null,
      "Rechaza automáticamente tokens de cliente expirados"
    );

    // ------------------------------------------------------------------------
    // 3. Privilege Boundary (Aislamiento Customer vs User interno)
    // ------------------------------------------------------------------------
    console.log("\n🔹 3. Aislamiento de Privilegios (Customer vs Personal Interno)");

    const staffDecryptionAttempt = await decryptSession(validToken);
    assert(
      staffDecryptionAttempt === null,
      "El token de cliente web es rechazado por el verificador de sesión del personal interno (matacos_session)"
    );

    const canSellPos = await hasPermission("pos.vender");
    const canAdminUsers = await hasPermission("admin.usuarios");
    assert(
      canSellPos === false && canAdminUsers === false,
      "Un cliente autenticado tiene 0 permisos en módulos internos de POS y Administración"
    );

    // ------------------------------------------------------------------------
    // 4. Wishlist Operations (Toggle & Unique Constraint)
    // ------------------------------------------------------------------------
    console.log("\n🔹 4. Operaciones de Lista de Favoritos (Wishlist)");

    const addFavRes = await toggleCustomerFavoriteAction(productA.id);
    assert(
      addFavRes.success &&
        addFavRes.data?.added === true &&
        addFavRes.data.favoriteProductIds.includes(productA.id),
      "toggleCustomerFavoriteAction() agrega producto a Favoritos cuando no estaba marcado"
    );

    // Verificar restricción única compuesta en base de datos @@unique([customerId, productId])
    let uniqueConstraintEnforced = false;
    try {
      await prisma.favorite.create({
        data: {
          customerId: regRes.data!.customer.id,
          productId: productA.id,
        },
      });
    } catch {
      uniqueConstraintEnforced = true;
    }
    assert(
      uniqueConstraintEnforced,
      "La restricción única compuesta @@unique([customerId, productId]) impide duplicados en DB"
    );

    const removeFavRes = await toggleCustomerFavoriteAction(productA.id);
    assert(
      removeFavRes.success &&
        removeFavRes.data?.added === false &&
        !removeFavRes.data.favoriteProductIds.includes(productA.id),
      "toggleCustomerFavoriteAction() elimina el registro cuando el producto ya estaba en Favoritos"
    );

    // ------------------------------------------------------------------------
    // 5. Guest Wishlist Migration on Login
    // ------------------------------------------------------------------------
    console.log("\n🔹 5. Migración Atómica de Favoritos de Invitado al Iniciar Sesión");

    await logoutCustomerAction();

    const loginWithFavsRes = await loginCustomerAction({
      email: testEmail1,
      password: "MiClaveSegura2026!",
      guestFavorites: [productA.id, productB.id],
    });

    assert(
      loginWithFavsRes.success &&
        loginWithFavsRes.data?.customer.favoriteProductIds.includes(productA.id) &&
        loginWithFavsRes.data?.customer.favoriteProductIds.includes(productB.id),
      "loginCustomerAction() migra atómicamente los productIds de localStorage a la tabla Favorite"
    );

    const favDetailsRes = await getCustomerFavoritesDetailsAction();
    assert(
      favDetailsRes.success &&
        Array.isArray(favDetailsRes.data) &&
        favDetailsRes.data.length === 2,
      "getCustomerFavoritesDetailsAction() retorna el detalle y stock en tiempo real de los favoritos"
    );

    // ------------------------------------------------------------------------
    // 6. Retroactive Web Order Linking & Public Guest Order Tracking by Code
    // ------------------------------------------------------------------------
    console.log(
      "\n🔹 6. Seguimiento Público por Código (Invitado) y Vinculación Retroactiva al Registrarse"
    );

    await logoutCustomerAction();

    // 6.1 Crear orden como invitado sin cuenta (customerId: null)
    const guestOrderRes = await createGuestOrder({
      customerName: "Lucía Fernández",
      customerDni: "41222333",
      customerEmail: testEmailGuest,
      customerPhone: "3704889900",
      shippingMethod: "CORREO_ARGENTINO",
      shippingAddress: "San Martín 920",
      shippingCity: "Formosa",
      shippingPostalCode: "3600",
      items: [{ variantId: sampleVariant.id, quantity: 1 }],
    });

    assert(
      guestOrderRes.success && Boolean(guestOrderRes.data?.orderCode),
      `Orden de invitado creada con código de seguimiento: ${guestOrderRes.data?.orderCode}`
    );

    const guestSaleId = guestOrderRes.data!.saleId;
    const guestOrderCode = guestOrderRes.data!.orderCode;
    createdSaleIds.push(guestSaleId);

    // 6.2 Probar consulta pública sin cuenta usando código WEB-2026-XXXX + Email
    const publicTrackByEmail = await trackPublicWebOrderAction({
      orderCode: guestOrderCode,
      verification: testEmailGuest,
    });
    assert(
      publicTrackByEmail.success &&
        publicTrackByEmail.data?.orderCode === guestOrderCode,
      "Invitado sin cuenta puede consultar el estado de su envío con Código + Email"
    );

    // 6.3 Probar consulta pública sin cuenta usando código WEB-2026-XXXX + DNI
    const publicTrackByDni = await trackPublicWebOrderAction({
      orderCode: guestOrderCode,
      verification: "41.222.333",
    });
    assert(
      publicTrackByDni.success &&
        publicTrackByDni.data?.orderCode === guestOrderCode,
      "Invitado sin cuenta puede consultar el estado de su envío con Código + DNI"
    );

    // 6.4 Verificar que un tercero no pueda espiar el pedido con un email/DNI falso
    const unauthorizedTrack = await trackPublicWebOrderAction({
      orderCode: guestOrderCode,
      verification: "intruso@otrocorreo.com",
    });
    assert(
      !unauthorizedTrack.success,
      "Bloquea consulta pública si el Email o DNI no coincide con el comprador del pedido"
    );

    // 6.5 Registrar al cliente con el mismo email usado como invitado
    const regGuestCustomerRes = await registerCustomerAction({
      name: "Lucía Fernández",
      email: testEmailGuest,
      password: "LuciaPassword2026!",
      dni: "41222333",
      phone: "3704889900",
    });

    assert(
      regGuestCustomerRes.success &&
        regGuestCustomerRes.data?.linkedOrdersCount === 1,
      "Al registrarse, vincula retroactivamente las compras previas hechas como invitado con ese email"
    );

    const newCustomerId = regGuestCustomerRes.data!.customer.id;
    createdCustomerIds.push(newCustomerId);

    const linkedSaleInDb = await prisma.sale.findUnique({
      where: { id: guestSaleId },
      select: { customerId: true },
    });
    assert(
      linkedSaleInDb?.customerId === newCustomerId,
      "El campo Sale.customerId en PostgreSQL se actualizó automáticamente al ID del nuevo Customer"
    );

    // ------------------------------------------------------------------------
    // 7. Order Tracking Query & Strict Channel Filtering (WEB vs MOSTRADOR)
    // ------------------------------------------------------------------------
    console.log(
      "\n🔹 7. Consulta de Pedidos del Cliente, Filtro Estricto de Canal (WEB) y Guía Correo Argentino"
    );

    // Crear una venta presencial (channel: "MOSTRADOR") asociada al mismo cliente para probar que NO se filtre al portal web
    const mostradorSale = await prisma.sale.create({
      data: {
        invoiceNumber: `MOST-TEST-${testRunSuffix}`,
        ticketCode: `#T${testRunSuffix}`,
        channel: "MOSTRADOR",
        status: "COMPLETADA",
        customerId: newCustomerId,
        customerName: "Lucía Fernández",
        subtotalGross: new Prisma.Decimal(15000),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(15000),
      },
    });
    createdSaleIds.push(mostradorSale.id);

    // Actualizar estado logístico de la orden web a EN_CAMINO con código de seguimiento de Correo Argentino
    const dispatchRes = await updateWebOrderShippingStatusAction({
      saleId: guestSaleId,
      shippingStatus: "EN_CAMINO",
      shippingTrackingCode: "CA987654321AR",
    });

    assert(
      dispatchRes.success &&
        dispatchRes.data?.shippingStatus === "EN_CAMINO" &&
        dispatchRes.data?.shippingTrackingCode === "CA987654321AR" &&
        dispatchRes.data?.correoArgentinoTrackingUrl ===
          "https://www.correoargentino.com.ar/formularios/ondt" &&
        dispatchRes.emailDispatched === true,
      "Actualiza estado a EN_CAMINO con código de guía, genera enlace a Correo Argentino y dispara notificación por email"
    );

    const customerOrdersRes = await getCustomerOrdersAction();
    assert(
      customerOrdersRes.success &&
        Array.isArray(customerOrdersRes.data) &&
        customerOrdersRes.data.length === 1 &&
        customerOrdersRes.data[0]?.id === guestSaleId &&
        customerOrdersRes.data.every((o) => o.channel === "WEB"),
      "getCustomerOrdersAction() retorna exclusivamente órdenes con channel === 'WEB', excluyendo ventas de 'MOSTRADOR'"
    );

    // ------------------------------------------------------------------------
    // 8. Customer Self-Cancellation & Stock Reservation Release
    // ------------------------------------------------------------------------
    console.log(
      "\n🔹 8. Autogestión: Cancelación de Pedido PENDIENTE_PAGO y Restitución de Stock Reservado"
    );

    const stockBeforeCancel = await prisma.productVariant.findUnique({
      where: { id: sampleVariant.id },
      select: { stockReserved: true },
    });

    // 8.1 Cancelar la orden que está en PENDIENTE_PAGO
    const selfCancelRes = await cancelCustomerOrderAction(guestSaleId);
    assert(
      selfCancelRes.success &&
        selfCancelRes.data?.status === "CANCELADA" &&
        selfCancelRes.data?.shippingStatus === "CANCELADO",
      "El cliente puede cancelar por sí mismo su orden en estado PENDIENTE_PAGO"
    );

    const stockAfterCancel = await prisma.productVariant.findUnique({
      where: { id: sampleVariant.id },
      select: { stockReserved: true },
    });

    assert(
      stockAfterCancel!.stockReserved ===
        Math.max(0, stockBeforeCancel!.stockReserved - 1),
      "La cancelación por el cliente decrementa atómicamente stockReserved en ProductVariant"
    );

    // 8.2 Crear una segunda orden web, pasarla a COMPLETADA (pagada) y verificar que rechaza autogestión de cancelación
    const paidOrderRes = await createGuestOrder({
      customerId: newCustomerId,
      customerName: "Lucía Fernández",
      customerDni: "41222333",
      customerEmail: testEmailGuest,
      customerPhone: "3704889900",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: sampleVariant.id, quantity: 1 }],
    });

    const paidSaleId = paidOrderRes.data!.saleId;
    createdSaleIds.push(paidSaleId);

    // Simular pago acreditado y descontar reserva de prueba
    await prisma.sale.update({
      where: { id: paidSaleId },
      data: { status: "COMPLETADA", shippingStatus: "EN_PREPARACION" },
    });
    await prisma.productVariant.update({
      where: { id: sampleVariant.id },
      data: { stockReserved: { decrement: 1 } },
    });

    const rejectCancelPaid = await cancelCustomerOrderAction(paidSaleId);
    assert(
      !rejectCancelPaid.success,
      "Impide que el cliente cancele por sí mismo un pedido que ya fue pagado (COMPLETADA)"
    );

    console.log("\n=====================================================================");
    console.log(
      `📊 RESULTADO FINAL RF-29: ${passed} pruebas superadas, ${failed} fallidas.`
    );
    console.log("=====================================================================\n");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    // Limpieza determinista de datos de prueba
    setTestContextCustomerToken(null);
    if (createdSaleIds.length > 0) {
      await prisma.sale.deleteMany({
        where: { id: { in: createdSaleIds } },
      });
    }
    if (createdCustomerIds.length > 0) {
      await prisma.customer.deleteMany({
        where: { id: { in: createdCustomerIds } },
      });
    }
    await prisma.$disconnect();
  }
}

runRf29Tests().catch((err) => {
  console.error("Error fatal en test-rf29-customer-portal:", err);
  process.exit(1);
});
