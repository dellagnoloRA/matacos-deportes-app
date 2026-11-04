import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import {
  CreateBannerSchema,
  UpdateBannerSchema,
  ReorderBannersSchema,
} from "../src/schemas/banner";
import { POST as uploadPost } from "../src/app/api/upload/route";
import {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "../src/server/actions/bannerActions";
import {
  listAllBannersAdminService,
  createBannerService,
  updateBannerService,
  deleteBannerService,
  reorderBannersService,
} from "../src/server/services/bannerService";

async function runRf26BannerTests() {
  console.log("=================================================================");
  console.log("🧪 SUITE DE PRUEBAS RF-26: GESTIÓN Y PUBLICACIÓN DE BANNERS");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) {
        console.error(`   Detalle: ${detail}`);
      }
      failed++;
    }
  }

  const createdBannerIds: string[] = [];
  const createdTempUserIds: string[] = [];
  const uploadedLocalPaths: string[] = [];
  const testRunTag = `RF26_TEST_${Date.now()}`;

  try {
    // =========================================================================
    // 1. VALIDACIÓN DE ESQUEMAS ZOD (Tarea 3)
    // =========================================================================
    console.log("--- 1. Esquemas Zod (CreateBannerSchema, UpdateBannerSchema, ReorderBannersSchema) ---");

    const validCreate = CreateBannerSchema.safeParse({
      title: "  Temporada Verano Natación 2026  ",
      subtitle: "   ",
      imageUrl: "/uploads/banners/verano-desktop.webp",
      mobileUrl: "",
      linkUrl: "/catalogo?discipline=natacion",
    });
    assert(
      validCreate.success &&
        validCreate.data.title === "Temporada Verano Natación 2026" &&
        validCreate.data.subtitle === null &&
        validCreate.data.mobileUrl === null &&
        validCreate.data.active === true &&
        validCreate.data.order === 0,
      "CreateBannerSchema normaliza textos, defaults y convierte cadenas vacías opcionales a null"
    );

    const invalidUrlCreate = CreateBannerSchema.safeParse({
      title: "Banner Malicioso",
      imageUrl: "//evil.example.com/phishing.webp",
    });
    assert(
      !invalidUrlCreate.success,
      "CreateBannerSchema rechaza URLs protocol-relative inseguras ('//...')"
    );

    const invertedDatesCreate = CreateBannerSchema.safeParse({
      title: "Fechas Invertidas",
      imageUrl: "https://cdn.matacos.com.ar/banner.webp",
      startDate: "2026-12-20T00:00:00.000Z",
      endDate: "2026-12-10T00:00:00.000Z",
    });
    assert(
      !invertedDatesCreate.success,
      "CreateBannerSchema rechaza endDate anterior a startDate"
    );

    const invalidUuidUpdate = UpdateBannerSchema.safeParse({
      id: "id-invalido",
      title: "Nuevo Título",
    });
    assert(
      !invalidUuidUpdate.success,
      "UpdateBannerSchema exige UUID válido en id"
    );

    const duplicateReorder = ReorderBannersSchema.safeParse([
      { id: "11111111-1111-4111-8111-111111111111", order: 0 },
      { id: "11111111-1111-4111-8111-111111111111", order: 1 },
    ]);
    assert(
      !duplicateReorder.success,
      "ReorderBannersSchema rechaza IDs duplicados en la lista"
    );

    const emptyReorder = ReorderBannersSchema.safeParse([]);
    assert(
      !emptyReorder.success,
      "ReorderBannersSchema rechaza arreglos vacíos"
    );

    // =========================================================================
    // 2. ENDPOINT DE SUBIDA DE IMÁGENES /api/upload (Tarea 4)
    // =========================================================================
    console.log("\n--- 2. Subida de Imágenes de Banners en /api/upload (WebP/PNG/JPEG, máx 2MB) ---");

    const samplePngBuffer = await sharp({
      create: {
        width: 800,
        height: 400,
        channels: 3,
        background: { r: 15, g: 82, b: 186 },
      },
    })
      .png()
      .toBuffer();

    const validBannerForm = new FormData();
    validBannerForm.append(
      "file",
      new File([new Uint8Array(samplePngBuffer)], "promo-verano.png", {
        type: "image/png",
      })
    );
    validBannerForm.append("type", "banner");
    validBannerForm.append("title", "Promo Verano Test RF26");
    validBannerForm.append("variant", "desktop");

    const validUploadReq = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: validBannerForm,
    });
    const validUploadRes = await uploadPost(validUploadReq);
    const validUploadJson = (await validUploadRes.json()) as {
      url?: string;
      type?: string;
      category?: string;
      error?: string;
    };

    assert(
      validUploadRes.status === 200 &&
        validUploadJson.type === "image/webp" &&
        validUploadJson.category === "banner" &&
        Boolean(validUploadJson.url),
      "POST /api/upload acepta PNG <= 2MB para banner y optimiza a WebP",
      JSON.stringify(validUploadJson)
    );

    const uploadedBannerUrl = validUploadJson.url || "/uploads/banners/fallback.webp";
    if (uploadedBannerUrl.startsWith("/uploads/banners/")) {
      const diskPath = path.join(
        process.cwd(),
        "public",
        uploadedBannerUrl.replace(/^\//, "")
      );
      uploadedLocalPaths.push(diskPath);
      const stat = await fs.stat(diskPath);
      assert(
        stat.isFile() && stat.size > 0,
        "Archivo WebP optimizado del banner persistido en disco local"
      );
    }

    // Prueba de límite estricto de 2MB
    const oversizedBytes = new Uint8Array(2 * 1024 * 1024 + 1024);
    const oversizedForm = new FormData();
    oversizedForm.append(
      "file",
      new File([oversizedBytes], "pesado.jpg", { type: "image/jpeg" })
    );
    oversizedForm.append("type", "banner");

    const oversizedRes = await uploadPost(
      new Request("http://localhost:3000/api/upload", {
        method: "POST",
        body: oversizedForm,
      })
    );
    assert(
      oversizedRes.status === 400,
      "POST /api/upload rechaza con HTTP 400 imágenes de banner mayores a 2MB"
    );

    // Prueba de formato prohibido en banners (SVG / GIF)
    const svgForm = new FormData();
    svgForm.append(
      "file",
      new File([Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>")], "vector.svg", {
        type: "image/svg+xml",
      })
    );
    svgForm.append("type", "banner");

    const svgRes = await uploadPost(
      new Request("http://localhost:3000/api/upload", {
        method: "POST",
        body: svgForm,
      })
    );
    assert(
      svgRes.status === 400,
      "POST /api/upload rechaza formatos fuera de WebP/PNG/JPEG (ej. SVG) para banners"
    );

    // =========================================================================
    // 3. CONTROL DE ACCESO ESTRICTO ROL ADMIN (Tarea 6 y 7)
    // =========================================================================
    console.log("\n--- 3. Protección de Server Actions para Rol ADMIN ---");

    const unauthList = await getAllBannersAdmin();
    const unauthCreate = await createBanner({
      title: "Intento sin sesión",
      imageUrl: uploadedBannerUrl,
    });
    const unauthUpdate = await updateBanner("11111111-1111-4111-8111-111111111111", {
      active: false,
    });
    const unauthDelete = await deleteBanner("11111111-1111-4111-8111-111111111111");
    const unauthReorder = await reorderBanners([
      { id: "11111111-1111-4111-8111-111111111111", order: 0 },
    ]);

    assert(
      !unauthList.success &&
        !unauthCreate.success &&
        !unauthUpdate.success &&
        !unauthDelete.success &&
        !unauthReorder.success,
      "Server Actions protegidas rechazan llamadas sin sesión autenticada"
    );

    // Preparar actores ADMIN y CAJERO en BD para validar RBAC de servicio
    const passwordHash = await bcrypt.hash("TestPassRf26!", 8);
    const tempAdmin = await prisma.user.create({
      data: {
        name: "Admin Test RF26",
        username: `admin_rf26_${Date.now()}`,
        email: `admin.rf26.${Date.now()}@matacos.local`,
        password: passwordHash,
        role: "ADMIN",
        active: true,
      },
    });
    createdTempUserIds.push(tempAdmin.id);

    const tempCajero = await prisma.user.create({
      data: {
        name: "Cajero Test RF26",
        username: `cajero_rf26_${Date.now()}`,
        email: `cajero.rf26.${Date.now()}@matacos.local`,
        password: passwordHash,
        role: "CAJERO",
        active: true,
      },
    });
    createdTempUserIds.push(tempCajero.id);

    const cajeroCreateAttempt = await createBannerService(tempCajero.id, {
      title: "Intento Cajero",
      imageUrl: uploadedBannerUrl,
    });
    const cajeroListAttempt = await listAllBannersAdminService(tempCajero.id);
    assert(
      !cajeroCreateAttempt.success && !cajeroListAttempt.success,
      "Rol CAJERO tiene bloqueado el acceso administrativo de banners"
    );

    // =========================================================================
    // 4. CRUD COMPLETO Y FILTRADO DE VIGENCIA EN getActiveBanners (Tareas 5 y 6)
    // =========================================================================
    console.log("\n--- 4. CRUD de Banners y Filtrado Público por Vigencia y Orden ---");

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Banner 1: Activo sin fechas límite (order 9102) -> DEBE MOSTRARSE 2do entre los de prueba
    const resB1 = await createBannerService(tempAdmin.id, {
      title: `${testRunTag}_PERMANENTE`,
      subtitle: "Envíos a todo Formosa",
      imageUrl: uploadedBannerUrl,
      linkUrl: "/catalogo",
      order: 9102,
      active: true,
    });
    if (resB1.data) createdBannerIds.push(resB1.data.id);

    // Banner 2: Activo con ventana vigente [ayer, mañana] (order 9101) -> DEBE MOSTRARSE 1ro entre los de prueba
    const resB2 = await createBannerService(tempAdmin.id, {
      title: `${testRunTag}_VIGENTE_HOY`,
      subtitle: "Hasta 6 cuotas",
      imageUrl: "https://cdn.matacos.com.ar/banners/vigente.webp",
      mobileUrl: "https://cdn.matacos.com.ar/banners/vigente-mobile.webp",
      linkUrl: "/catalogo?brand=crocs",
      order: 9101,
      active: true,
      startDate: new Date(now - oneDayMs),
      endDate: new Date(now + oneDayMs),
    });
    if (resB2.data) createdBannerIds.push(resB2.data.id);

    // Banner 3: Inactivo aunque tenga fechas vigentes (order 9100) -> OCULTO
    const resB3 = await createBannerService(tempAdmin.id, {
      title: `${testRunTag}_INACTIVO`,
      imageUrl: "https://cdn.matacos.com.ar/banners/inactivo.webp",
      order: 9100,
      active: false,
      startDate: new Date(now - oneDayMs),
      endDate: new Date(now + oneDayMs),
    });
    if (resB3.data) createdBannerIds.push(resB3.data.id);

    // Banner 4: Programado a futuro [mañana, +7 días] (order 9103) -> OCULTO
    const resB4 = await createBannerService(tempAdmin.id, {
      title: `${testRunTag}_FUTURO`,
      imageUrl: "https://cdn.matacos.com.ar/banners/futuro.webp",
      order: 9103,
      active: true,
      startDate: new Date(now + oneDayMs),
      endDate: new Date(now + 7 * oneDayMs),
    });
    if (resB4.data) createdBannerIds.push(resB4.data.id);

    // Banner 5: Expirado [-7 días, ayer] (order 9104) -> OCULTO
    const resB5 = await createBannerService(tempAdmin.id, {
      title: `${testRunTag}_EXPIRADO`,
      imageUrl: "https://cdn.matacos.com.ar/banners/expirado.webp",
      order: 9104,
      active: true,
      startDate: new Date(now - 7 * oneDayMs),
      endDate: new Date(now - oneDayMs),
    });
    if (resB5.data) createdBannerIds.push(resB5.data.id);

    assert(
      resB1.success &&
        resB2.success &&
        resB3.success &&
        resB4.success &&
        resB5.success,
      "createBanner registra correctamente banners con distintas configuraciones de vigencia"
    );

    const activePublicRes = await getActiveBanners();
    const ourPublicBanners = (activePublicRes.data || []).filter((b) =>
      b.title.startsWith(testRunTag)
    );

    assert(
      activePublicRes.success &&
        ourPublicBanners.length === 2 &&
        ourPublicBanners[0]?.title === `${testRunTag}_VIGENTE_HOY` &&
        ourPublicBanners[1]?.title === `${testRunTag}_PERMANENTE`,
      "getActiveBanners() filtra active=true + fechas vigentes y ordena por order ASC",
      JSON.stringify(ourPublicBanners.map((b) => ({ title: b.title, order: b.order })))
    );

    const allAdminRes = await listAllBannersAdminService(tempAdmin.id);
    const ourAdminBanners = (allAdminRes.data || []).filter((b) =>
      b.title.startsWith(testRunTag)
    );
    const statusMap = new Map(
      ourAdminBanners.map((b) => [b.title, b.validityStatus])
    );

    assert(
      ourAdminBanners.length === 5 &&
        statusMap.get(`${testRunTag}_VIGENTE_HOY`) === "VIGENTE" &&
        statusMap.get(`${testRunTag}_INACTIVO`) === "INACTIVO" &&
        statusMap.get(`${testRunTag}_FUTURO`) === "PROGRAMADO" &&
        statusMap.get(`${testRunTag}_EXPIRADO`) === "EXPIRADO",
      "getAllBannersAdmin retorna todos los banners con su estado de vigencia calculado"
    );

    // Prueba de updateBanner (actualización válida + bloqueo de fecha incoherente parcial)
    const banner2Id = resB2.data!.id;
    const incoherentPartialUpdate = await updateBannerService(tempAdmin.id, {
      id: banner2Id,
      endDate: new Date(now - 10 * oneDayMs), // Anterior al startDate existente (ayer)
    });
    assert(
      !incoherentPartialUpdate.success,
      "updateBanner bloquea actualización parcial donde nuevo endDate queda antes que startDate existente"
    );

    const validUpdateRes = await updateBannerService(tempAdmin.id, {
      id: banner2Id,
      subtitle: "Subtítulo actualizado en test",
      active: false,
    });
    assert(
      validUpdateRes.success &&
        validUpdateRes.data?.subtitle === "Subtítulo actualizado en test" &&
        validUpdateRes.data?.active === false,
      "updateBanner modifica campos y permite desactivar un banner"
    );

    const afterDeactivatePublic = await getActiveBanners();
    const afterDeactivateOurs = (afterDeactivatePublic.data || []).filter((b) =>
      b.title.startsWith(testRunTag)
    );
    assert(
      afterDeactivateOurs.length === 1 &&
        afterDeactivateOurs[0]?.id === resB1.data!.id,
      "Al desactivar un banner deja de exponerse inmediatamente en getActiveBanners()"
    );

    // Reactivar Banner 2 para probar reorderBanners
    await updateBannerService(tempAdmin.id, {
      id: banner2Id,
      active: true,
    });

    // =========================================================================
    // 5. REORDENAMIENTO TRANSACCIONAL ATÓMICO (Tarea 7)
    // =========================================================================
    console.log("\n--- 5. Transacción Atómica en reorderBanners ---");

    const banner1Id = resB1.data!.id;

    // Invertir orden entre Banner 1 (antes 9102 -> ahora 9050) y Banner 2 (antes 9101 -> ahora 9055)
    const reorderSuccessRes = await reorderBannersService(tempAdmin.id, [
      { id: banner1Id, order: 9050 },
      { id: banner2Id, order: 9055 },
    ]);
    assert(
      reorderSuccessRes.success,
      "reorderBanners actualiza posiciones exitosamente en transacción Prisma"
    );

    const reorderedPublic = await getActiveBanners();
    const reorderedOurs = (reorderedPublic.data || []).filter((b) =>
      b.title.startsWith(testRunTag)
    );
    assert(
      reorderedOurs.length === 2 &&
        reorderedOurs[0]?.id === banner1Id &&
        reorderedOurs[1]?.id === banner2Id,
      "getActiveBanners() refleja el nuevo orden (Banner 1 primero, Banner 2 segundo)"
    );

    // Probar atomicidad: enviar un ID real (cambiándolo a 9999) + un UUID inexistente -> debe hacer rollback
    const failedTxRes = await reorderBannersService(tempAdmin.id, [
      { id: banner1Id, order: 9999 },
      { id: "99999999-9999-4999-8999-999999999999", order: 9998 },
    ]);
    const banner1AfterFailedTx = await prisma.banner.findUnique({
      where: { id: banner1Id },
    });
    assert(
      !failedTxRes.success && banner1AfterFailedTx?.order === 9050,
      "reorderBanners revierte atómicamente todos los cambios si algún ID no existe"
    );

    // =========================================================================
    // 6. ELIMINACIÓN Y LIMPIEZA DE IMAGEN LOCAL (Tarea 6)
    // =========================================================================
    console.log("\n--- 6. Eliminación de Banner y Limpieza ---");

    const deleteRes = await deleteBannerService(tempAdmin.id, banner1Id);
    const deletedCheck = await prisma.banner.findUnique({
      where: { id: banner1Id },
    });
    assert(
      deleteRes.success && deletedCheck === null,
      "deleteBanner elimina el registro de la base de datos"
    );

    if (uploadedLocalPaths.length > 0) {
      let fileStillExists = true;
      try {
        await fs.access(uploadedLocalPaths[0]!);
      } catch {
        fileStillExists = false;
      }
      assert(
        !fileStillExists,
        "deleteBanner limpia automáticamente la imagen local huérfana en public/uploads/banners"
      );
    }

    console.log("\n=================================================================");
    console.log(`📊 RESULTADOS RF-26: ${passed} aprobadas, ${failed} fallidas.`);
    console.log("=================================================================\n");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Error fatal ejecutando suite RF-26:", error);
    process.exitCode = 1;
  } finally {
    // Limpieza garantizada de registros y archivos temporales
    if (createdBannerIds.length > 0) {
      await prisma.banner.deleteMany({
        where: { id: { in: createdBannerIds } },
      });
    }
    if (createdTempUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdTempUserIds } },
      });
    }
    for (const filePath of uploadedLocalPaths) {
      try {
        await fs.unlink(filePath);
      } catch {
        // Ya eliminado por deleteBannerService
      }
    }
    await prisma.$disconnect();
  }
}

runRf26BannerTests();
