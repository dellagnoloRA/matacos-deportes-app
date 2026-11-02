import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando carga de datos iniciales para Matacos Deportes...");

  // 1. Disciplinas base
  const discNatacion = await prisma.discipline.upsert({
    where: { slug: "natacion" },
    update: {},
    create: { name: "Natación", slug: "natacion" },
  });

  const discVoley = await prisma.discipline.upsert({
    where: { slug: "voley" },
    update: {},
    create: { name: "Vóley", slug: "voley" },
  });

  const discCrocs = await prisma.discipline.upsert({
    where: { slug: "crocs" },
    update: {},
    create: { name: "Crocs", slug: "crocs" },
  });

  const discFitness = await prisma.discipline.upsert({
    where: { slug: "fitness" },
    update: {},
    create: { name: "Fitness & Entrenamiento", slug: "fitness" },
  });

  const discIndumentaria = await prisma.discipline.upsert({
    where: { slug: "indumentaria" },
    update: {},
    create: { name: "Indumentaria", slug: "indumentaria" },
  });

  // 2. Categorías base
  const catCalzado = await prisma.category.upsert({
    where: { slug: "calzado" },
    update: {},
    create: { name: "Calzado", slug: "calzado" },
  });

  const catAntiparras = await prisma.category.upsert({
    where: { slug: "antiparras" },
    update: {},
    create: { name: "Antiparras", slug: "antiparras" },
  });

  const catMallas = await prisma.category.upsert({
    where: { slug: "mallas" },
    update: {},
    create: { name: "Mallas", slug: "mallas" },
  });

  const catPelotas = await prisma.category.upsert({
    where: { slug: "pelotas" },
    update: {},
    create: { name: "Pelotas", slug: "pelotas" },
  });

  const catAccesorios = await prisma.category.upsert({
    where: { slug: "accesorios" },
    update: {},
    create: { name: "Accesorios", slug: "accesorios" },
  });

  // 3. Marcas base
  const brandTopper = await prisma.brand.upsert({
    where: { slug: "topper" },
    update: {},
    create: { name: "Topper", slug: "topper" },
  });

  const brandWilson = await prisma.brand.upsert({
    where: { slug: "wilson" },
    update: {},
    create: { name: "Wilson", slug: "wilson" },
  });

  const brandSpeedo = await prisma.brand.upsert({
    where: { slug: "speedo" },
    update: {},
    create: { name: "Speedo", slug: "speedo" },
  });

  const brandArena = await prisma.brand.upsert({
    where: { slug: "arena" },
    update: {},
    create: { name: "Arena", slug: "arena" },
  });

  const brandMikasa = await prisma.brand.upsert({
    where: { slug: "mikasa" },
    update: {},
    create: { name: "Mikasa", slug: "mikasa" },
  });

  const brandCrocs = await prisma.brand.upsert({
    where: { slug: "crocs" },
    update: {},
    create: { name: "Crocs", slug: "crocs" },
  });

  const brandMatacos = await prisma.brand.upsert({
    where: { slug: "matacos" },
    update: {},
    create: { name: "Matacos", slug: "matacos" },
  });

  const brandAsics = await prisma.brand.upsert({
    where: { slug: "asics" },
    update: {},
    create: { name: "Asics", slug: "asics" },
  });

  // 4. Catálogo completo de productos
  const seedProducts = [
    {
      name: "Antiparras Cobra Ultra Mirror",
      gender: "UNISEX",
      description: "Antiparras de competición hidrodinámicas con lentes espejadas y protección UV400.",
      brandId: brandArena.id,
      categoryId: catAntiparras.id,
      disciplineId: discNatacion.id,
      costPrice: 42000,
      price: 68000,
      variants: [
        { size: "Único", color: "Mirror Silver", sku: "NAT-ARE-COB-SIL", barcode: "779123456701-1", stockStore: 8, stockWarehouse: 12 },
        { size: "Único", color: "Mirror Gold", sku: "NAT-ARE-COB-GLD", barcode: "779123456701-2", stockStore: 6, stockWarehouse: 10 },
        { size: "Único", color: "Mirror Blue", sku: "NAT-ARE-COB-BLU", barcode: "779123456701-3", stockStore: 5, stockWarehouse: 8 },
      ],
    },
    {
      name: "Pelota Vóley V200W Oficial FIVB",
      gender: "UNISEX",
      description: "Balón oficial de juego de la FIVB con diseño aerodinámico de 18 paneles.",
      brandId: brandMikasa.id,
      categoryId: catPelotas.id,
      disciplineId: discVoley.id,
      costPrice: 98000,
      price: 145000,
      variants: [
        { size: "N° 5", color: "Azul/Amarillo", sku: "VOL-MIK-V200-N5", barcode: "779123456702-1", stockStore: 6, stockWarehouse: 14 },
      ],
    },
    {
      name: "Zapatillas Gel-Rocket 11 Indoor",
      gender: "HOMBRE",
      description: "Calzado multiusos para canchas de interior con tecnología GEL y suela de tracción.",
      brandId: brandAsics.id,
      categoryId: catCalzado.id,
      disciplineId: discVoley.id,
      costPrice: 78000,
      price: 120000,
      variants: [
        { size: "39", color: "Blanco/Azul", sku: "CAL-ASI-ROC-39", barcode: "779123456703-39", stockStore: 2, stockWarehouse: 4 },
        { size: "40", color: "Blanco/Azul", sku: "CAL-ASI-ROC-40", barcode: "779123456703-40", stockStore: 3, stockWarehouse: 6 },
        { size: "41", color: "Blanco/Azul", sku: "CAL-ASI-ROC-41", barcode: "779123456703-41", stockStore: 4, stockWarehouse: 8 },
        { size: "42", color: "Blanco/Azul", sku: "CAL-ASI-ROC-42", barcode: "779123456703-42", stockStore: 3, stockWarehouse: 5 },
      ],
    },
    {
      name: "Crocs Classic Clog Unisex",
      gender: "UNISEX",
      description: "El zueco icónico ultraliviano y resistente al agua fabricado en material Croslite.",
      brandId: brandCrocs.id,
      categoryId: catCalzado.id,
      disciplineId: discCrocs.id,
      costPrice: 34000,
      price: 58000,
      variants: [
        { size: "4/6 (36)", color: "Negro", sku: "CRC-CLS-46-NEG", barcode: "779123456704-36", stockStore: 4, stockWarehouse: 6 },
        { size: "5/7 (37)", color: "Negro", sku: "CRC-CLS-57-NEG", barcode: "779123456704-37", stockStore: 5, stockWarehouse: 7 },
        { size: "6/8 (38)", color: "Negro", sku: "CRC-CLS-68-NEG", barcode: "779123456704-38", stockStore: 6, stockWarehouse: 8 },
        { size: "7/9 (39)", color: "Negro", sku: "CRC-CLS-79-NEG", barcode: "779123456704-39", stockStore: 7, stockWarehouse: 9 },
        { size: "8/10 (40)", color: "Negro", sku: "CRC-CLS-810-NEG", barcode: "779123456704-40", stockStore: 8, stockWarehouse: 12 },
        { size: "9/11 (41)", color: "Negro", sku: "CRC-CLS-911-NEG", barcode: "779123456704-41", stockStore: 6, stockWarehouse: 9 },
        { size: "10/12 (42)", color: "Negro", sku: "CRC-CLS-1012-NEG", barcode: "779123456704-42", stockStore: 8, stockWarehouse: 10 },
        { size: "M11 (43)", color: "Negro", sku: "CRC-CLS-M11-NEG", barcode: "779123456704-43", stockStore: 5, stockWarehouse: 6 },
        { size: "M12 (44)", color: "Negro", sku: "CRC-CLS-M12-NEG", barcode: "779123456704-44", stockStore: 4, stockWarehouse: 5 },
        { size: "M13 (45)", color: "Negro", sku: "CRC-CLS-M13-NEG", barcode: "779123456704-45", stockStore: 3, stockWarehouse: 4 },
      ],
    },
    {
      name: "Malla Competición Fastskin LZR",
      gender: "MUJER",
      description: "Traje de baño de competición aprobado por World Aquatics con costuras termoselladas.",
      brandId: brandSpeedo.id,
      categoryId: catMallas.id,
      disciplineId: discNatacion.id,
      costPrice: 59000,
      price: 92000,
      variants: [
        { size: "S", color: "Negro/Dorado", sku: "NAT-SPE-FST-S", barcode: "779123456705-S", stockStore: 2, stockWarehouse: 3 },
        { size: "M", color: "Negro/Dorado", sku: "NAT-SPE-FST-M", barcode: "779123456705-M", stockStore: 4, stockWarehouse: 6 },
        { size: "L", color: "Negro/Dorado", sku: "NAT-SPE-FST-L", barcode: "779123456705-L", stockStore: 4, stockWarehouse: 5 },
      ],
    },
    {
      name: "Cinturón de Levantamiento Cuero Pro",
      gender: "UNISEX",
      description: "Cinturón lumbar en cuero reforzado de 10mm con hebilla de acero inoxidable de doble púa.",
      brandId: brandMatacos.id,
      categoryId: catAccesorios.id,
      disciplineId: discFitness.id,
      costPrice: 31000,
      price: 49000,
      variants: [
        { size: "M", color: "Marrón", sku: "FIT-MAT-CIN-M", barcode: "779123456706-M", stockStore: 5, stockWarehouse: 7 },
        { size: "L", color: "Marrón", sku: "FIT-MAT-CIN-L", barcode: "779123456706-L", stockStore: 6, stockWarehouse: 8 },
      ],
    },
    {
      name: "Zapatillas Gondor II",
      gender: "HOMBRE",
      description: "Calzado deportivo versátil y duradero para entrenamiento y uso diario.",
      brandId: brandTopper.id,
      categoryId: catCalzado.id,
      disciplineId: discIndumentaria.id,
      costPrice: 38000,
      price: 68000,
      variants: [
        { size: "40", color: "Negro", sku: "TOP-GON-40-NEG", barcode: "7791001001401", stockStore: 3, stockWarehouse: 5 },
        { size: "41", color: "Negro", sku: "TOP-GON-41-NEG", barcode: "7791001001418", stockStore: 5, stockWarehouse: 8 },
        { size: "42", color: "Negro", sku: "TOP-GON-42-NEG", barcode: "7791001001425", stockStore: 2, stockWarehouse: 4 },
      ],
    },
  ];

  for (const item of seedProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          brandId: item.brandId,
          categoryId: item.categoryId,
          disciplineId: item.disciplineId,
          costPrice: item.costPrice,
          price: item.price,
          gender: (item as any).gender || "UNISEX",
          active: true,
          variants: {
            create: item.variants.map((v) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              barcode: v.barcode,
              stockStore: v.stockStore,
              stockWarehouse: v.stockWarehouse,
              minStoreStock: 1,
              minStock: 2,
            })),
          },
        },
        include: { variants: true },
      });

      for (const variant of created.variants) {
        const totalStock = variant.stockStore + variant.stockWarehouse;
        if (totalStock > 0) {
          await prisma.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "INGRESO_INICIAL",
              quantity: totalStock,
              stockAfter: totalStock,
              location: "STORE",
              reason: "Stock inicial de catálogo",
            },
          });
        }
      }
    }
  }

  console.log("¡Catálogo completo de productos cargado exitosamente en PostgreSQL!");

  // 5. Catálogo Maestro de Permisos (RF-23)
  console.log("Cargando catálogo maestro de permisos...");
  await prisma.permission.deleteMany({
    where: { code: "caja.anular_venta" },
  });
  const masterPermissions = [
    // POS (Salón / Mostrador)
    { code: "pos.vender", module: "POS", description: "Crear tickets, agregar productos, procesar cobros y emitir comprobantes" },
    { code: "pos.descuento_manual", module: "POS", description: "Aplicar bonificaciones o descuentos manuales en mostrador" },
    { code: "pos.cambios_devoluciones", module: "POS", description: "Gestionar cambios de talle/prenda y devoluciones de clientes" },

    // CAJA (Flujo de Dinero y Turnos)
    { code: "caja.abrir_turno", module: "CAJA", description: "Abrir turno de terminal con fondo inicial en efectivo" },
    { code: "caja.movimientos", module: "CAJA", description: "Registrar ingresos y egresos de caja chica o retiros de seguridad" },
    { code: "caja.cerrar_arqueo", module: "CAJA", description: "Ejecutar arqueo de billetes y cierre de jornada de terminal" },
    { code: "caja.auditoria_historial", module: "CAJA", description: "Consultar historial consolidado de arqueos y justificaciones" },
    { code: "caja.ver_teorico", module: "CAJA", description: "Visualizar el total esperado del sistema antes de contar billetes" },
    { code: "caja.reimprimir_ticket", module: "CAJA", description: "Reimpresión de tickets finalizados desde el historial" },
    { code: "caja.modificar_preventa", module: "CAJA", description: "Editar o cancelar preventas pendientes antes de su cobro" },

    // INVENTARIO (Depósito, Stock y Catálogo)
    { code: "inventario.ver", module: "INVENTARIO", description: "Consultar catálogo y existencias en Salón y Depósito" },
    { code: "inventario.crear_producto", module: "INVENTARIO", description: "Alta, edición y desactivación de productos y variantes" },
    { code: "inventario.precios", module: "INVENTARIO", description: "Modificar individualmente el precio de venta al público (PVP)" },
    { code: "inventario.actualizacion_lote", module: "INVENTARIO", description: "Modificación masiva de precios por lote, marca o categoría" },
    { code: "inventario.costos", module: "INVENTARIO", description: "Visualizar precio de costo de proveedores (costPrice) y margen" },
    { code: "inventario.ajuste_stock", module: "INVENTARIO", description: "Ajustes manuales de existencias, roturas y transferencias" },
    { code: "inventario.importar_excel", module: "INVENTARIO", description: "Carga e importación masiva de catálogo vía Excel/CSV" },
    { code: "inventario.maestros", module: "INVENTARIO", description: "Administrar Marcas, Categorías y Disciplinas deportivas" },
    { code: "inventario.historial_precios", module: "INVENTARIO", description: "Auditar bitácora histórica de modificaciones de precios" },
    { code: "inventario.alertas_stock", module: "INVENTARIO", description: "Configurar umbrales de stock crítico y reposición" },
    { code: "inventario.etiquetas_codigos", module: "INVENTARIO", description: "Generación e impresión de etiquetas con código de barras" },

    // E-COMMERCE (Tienda Digital)
    { code: "ecommerce.pedidos", module: "ECOMMERCE", description: "Gestionar pedidos web entrantes, preparación y despacho" },
    { code: "ecommerce.banners", module: "ECOMMERCE", description: "Modificar banners del carrusel hero y vitrinas destacadas" },
    { code: "ecommerce.cupones", module: "ECOMMERCE", description: "Crear y gestionar cupones de descuento y promociones online" },
    { code: "ecommerce.clientes", module: "ECOMMERCE", description: "Visualizar cartera de clientes registrados en la tienda online" },

    // REPORTES (Métricas de Negocio)
    { code: "reportes.ver_kpis", module: "REPORTES", description: "Visualizar facturación global, ticket promedio y gráficos financieros" },
    { code: "reportes.exportar", module: "REPORTES", description: "Exportar reportes de ventas, arqueos y stock a Excel/PDF" },

    // ADMIN (Seguridad y Usuarios)
    { code: "admin.usuarios", module: "ADMIN", description: "Gestionar altas, bajas, roles y contraseñas de personal" },
    { code: "admin.perfiles", module: "ADMIN", description: "Crear y configurar perfiles de acceso y permisos" },
  ];

  const permissionsMap = new Map<string, string>();
  for (const perm of masterPermissions) {
    const upserted = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });
    permissionsMap.set(perm.code, upserted.id);
  }

  // 6. Perfiles Base del Sistema
  console.log("Creando perfiles base del sistema...");
  const profileAdmin = await prisma.profile.upsert({
    where: { name: "Administrador" },
    update: { level: 100, isSystem: true },
    create: {
      name: "Administrador",
      description: "Acceso total y gobierno del sistema, costos, métricas y seguridad",
      level: 100,
      isSystem: true,
    },
  });

  const profileCajero = await prisma.profile.upsert({
    where: { name: "Cajero Mostrador" },
    update: { level: 10, isSystem: true },
    create: {
      name: "Cajero Mostrador",
      description: "Operador de terminal de cobros, arqueos y atención en Saavedra 241",
      level: 10,
      isSystem: true,
    },
  });

  const profileEncargado = await prisma.profile.upsert({
    where: { name: "Encargado de Local" },
    update: { level: 50, isSystem: true, parentProfileId: profileCajero.id },
    create: {
      name: "Encargado de Local",
      description: "Supervisión del local físico, control de caja, transferencias y mermas",
      level: 50,
      isSystem: true,
      parentProfileId: profileCajero.id,
    },
  });

  const profileVendedor = await prisma.profile.upsert({
    where: { name: "Vendedor Salón" },
    update: { level: 5, isSystem: true },
    create: {
      name: "Vendedor Salón",
      description: "Atención comercial, consulta de stock y emisión de preventas",
      level: 5,
      isSystem: true,
    },
  });

  // 7. Asignación de Permisos a Perfiles Base
  console.log("Asignando matriz de permisos a perfiles...");
  await prisma.profilePermission.deleteMany({
    where: {
      profileId: {
        in: [profileAdmin.id, profileEncargado.id, profileCajero.id, profileVendedor.id],
      },
    },
  });

  // Admin tiene TODOS los 30 permisos
  const adminPermissionsData = Array.from(permissionsMap.values()).map((permissionId) => ({
    profileId: profileAdmin.id,
    permissionId,
  }));
  await prisma.profilePermission.createMany({ data: adminPermissionsData });

  // Cajero Mostrador
  const cajeroCodes = [
    "pos.vender",
    "pos.descuento_manual",
    "pos.cambios_devoluciones",
    "caja.abrir_turno",
    "caja.movimientos",
    "caja.cerrar_arqueo",
    "caja.reimprimir_ticket",
    "caja.modificar_preventa",
    "inventario.ver",
  ];
  const cajeroPermissionsData = cajeroCodes
    .map((code) => permissionsMap.get(code))
    .filter((id): id is string => Boolean(id))
    .map((permissionId) => ({ profileId: profileCajero.id, permissionId }));
  await prisma.profilePermission.createMany({ data: cajeroPermissionsData });

  // Encargado de Local (Hereda Cajero Mostrador mediante parentProfileId, y suma supervisión)
  const encargadoSpecificCodes = [
    "caja.auditoria_historial",
    "caja.ver_teorico",
    "inventario.ajuste_stock",
    "inventario.etiquetas_codigos",
    "inventario.alertas_stock",
    "ecommerce.pedidos",
    "reportes.ver_kpis",
  ];
  const encargadoPermissionsData = encargadoSpecificCodes
    .map((code) => permissionsMap.get(code))
    .filter((id): id is string => Boolean(id))
    .map((permissionId) => ({ profileId: profileEncargado.id, permissionId }));
  await prisma.profilePermission.createMany({ data: encargadoPermissionsData });

  // Vendedor Salón
  const vendedorCodes = ["pos.vender", "caja.modificar_preventa", "inventario.ver"];
  const vendedorPermissionsData = vendedorCodes
    .map((code) => permissionsMap.get(code))
    .filter((id): id is string => Boolean(id))
    .map((permissionId) => ({ profileId: profileVendedor.id, permissionId }));
  await prisma.profilePermission.createMany({ data: vendedorPermissionsData });

  // 8. Usuarios Base con Contraseñas Hasheadas
  console.log("Configurando usuarios con credenciales seguras (bcryptjs)...");
  const hashedAdminPassword = await bcrypt.hash("MatacosAdmin2026!", 10);
  const hashedCajeroPassword = await bcrypt.hash("Caja241Saavedra!", 10);
  const hashedEncargadoPassword = await bcrypt.hash("Encargado241!", 10);
  const hashedVendedorPassword = await bcrypt.hash("Vendedor241!", 10);

  // Administrador General
  await prisma.user.upsert({
    where: { email: "admin@matacosdeportes.com.ar" },
    update: {
      username: "admin",
      profileId: profileAdmin.id,
      role: "ADMIN",
      active: true,
    },
    create: {
      name: "Administrador Matacos",
      username: "admin",
      email: "admin@matacosdeportes.com.ar",
      password: hashedAdminPassword,
      role: "ADMIN",
      profileId: profileAdmin.id,
      active: true,
    },
  });

  // Cajero 1
  await prisma.user.upsert({
    where: { email: "cajero.1@matacos.local" },
    update: {
      username: "cajero1",
      profileId: profileCajero.id,
      password: hashedCajeroPassword,
      active: true,
    },
    create: {
      name: "Cajero 1",
      username: "cajero1",
      email: "cajero.1@matacos.local",
      password: hashedCajeroPassword,
      role: "CAJERO",
      profileId: profileCajero.id,
      active: true,
    },
  });

  // Cajero Mostrador
  await prisma.user.upsert({
    where: { email: "cajero.mostrador@matacos.local" },
    update: {
      username: "mostrador",
      profileId: profileCajero.id,
      password: hashedCajeroPassword,
      active: true,
    },
    create: {
      name: "Cajero Mostrador",
      username: "mostrador",
      email: "cajero.mostrador@matacos.local",
      password: hashedCajeroPassword,
      role: "CAJERO",
      profileId: profileCajero.id,
      active: true,
    },
  });

  // Encargado de Local
  await prisma.user.upsert({
    where: { email: "encargado@matacosdeportes.com.ar" },
    update: {
      username: "encargado",
      profileId: profileEncargado.id,
      password: hashedEncargadoPassword,
      active: true,
    },
    create: {
      name: "Encargado de Turno",
      username: "encargado",
      email: "encargado@matacosdeportes.com.ar",
      password: hashedEncargadoPassword,
      role: "CAJERO",
      profileId: profileEncargado.id,
      active: true,
    },
  });

  // Vendedor Salón
  await prisma.user.upsert({
    where: { email: "vendedor@matacosdeportes.com.ar" },
    update: {
      username: "vendedor",
      profileId: profileVendedor.id,
      password: hashedVendedorPassword,
      active: true,
    },
    create: {
      name: "Vendedor Salón",
      username: "vendedor",
      email: "vendedor@matacosdeportes.com.ar",
      password: hashedVendedorPassword,
      role: "CAJERO",
      profileId: profileVendedor.id,
      active: true,
    },
  });

  // Cliente de prueba E-commerce (RF-29 / Checkout)
  const hashedCustomerPassword = await bcrypt.hash("cliente123", 10);
  await prisma.customer.upsert({
    where: { email: "cliente@matacos.com.ar" },
    update: {
      password: hashedCustomerPassword,
    },
    create: {
      name: "Juan Pérez",
      email: "cliente@matacos.com.ar",
      password: hashedCustomerPassword,
      dni: "38123456",
      phone: "3704556677",
      defaultAddress: "Av. 25 de Mayo 850",
      defaultCity: "Formosa",
      defaultPostalCode: "3600",
    },
  });

  console.log("¡Esquema de seguridad, perfiles, cliente demo y permisos RF-23 sembrado con éxito!");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
