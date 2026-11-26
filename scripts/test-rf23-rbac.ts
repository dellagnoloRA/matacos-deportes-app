import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { encryptSession, decryptSession, SessionPayload } from "../src/lib/session";

async function runRbacTests() {
  console.log("=================================================");
  console.log("🧪 INICIANDO PRUEBAS DE AUTENTICACIÓN Y RBAC (RF-23)");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Detalle: ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Prueba de búsqueda por Username y por Email
    const userByUsername = await prisma.user.findFirst({
      where: { username: "admin", active: true },
      include: { profile: true },
    });
    assert(
      Boolean(userByUsername && userByUsername.email === "admin@matacosdeportes.com.ar"),
      "Búsqueda de usuario por username corto ('admin')"
    );

    const userByEmail = await prisma.user.findFirst({
      where: { email: "cajero.1@matacos.local", active: true },
      include: { profile: true },
    });
    assert(
      Boolean(userByEmail && userByEmail.username === "cajero1"),
      "Búsqueda de usuario por correo ('cajero.1@matacos.local')"
    );

    // 2. Validación de contraseña correcta con bcrypt
    if (userByUsername) {
      const matchAdmin = await bcrypt.compare("MatacosAdmin2026!", userByUsername.password);
      assert(matchAdmin, "Validación de contraseña correcta para admin (bcryptjs)");

      const wrongMatch = await bcrypt.compare("clave_equivocada_123", userByUsername.password);
      assert(!wrongMatch, "Rechazo de contraseña incorrecta");
    }

    // 3. Resolución de permisos con Herencia Jerárquica para Encargado
    const encargadoUser = await prisma.user.findFirst({
      where: { username: "encargado" },
      include: {
        profile: {
          include: {
            permissions: { include: { permission: true } },
            parentProfile: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    assert(Boolean(encargadoUser), "Usuario 'encargado' existe en base de datos");

    if (encargadoUser?.profile) {
      const directCodes = encargadoUser.profile.permissions.map((p) => p.permission.code);
      const inheritedCodes = encargadoUser.profile.parentProfile?.permissions.map((p) => p.permission.code) || [];
      const allEffective = Array.from(new Set([...directCodes, ...inheritedCodes]));

      assert(
        directCodes.includes("caja.ver_teorico"),
        "Encargado posee permiso directo de supervisión ('caja.ver_teorico')"
      );

      assert(
        inheritedCodes.includes("pos.vender"),
        "Encargado hereda permiso de cobro ('pos.vender') del perfil padre Cajero Mostrador"
      );

      assert(
        allEffective.includes("pos.cambios_devoluciones") && allEffective.includes("caja.cerrar_arqueo"),
        "Permisos efectivos de Encargado contienen tanto directos como heredados"
      );

      assert(
        !allEffective.includes("inventario.costos"),
        "Encargado NO tiene acceso al costo de fábrica ('inventario.costos')"
      );
    }

    // 4. Verificación de restricciones para Cajero
    const cajeroUser = await prisma.user.findFirst({
      where: { username: "cajero1" },
      include: {
        profile: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (cajeroUser?.profile) {
      const cajeroCodes = cajeroUser.profile.permissions.map((p) => p.permission.code);
      assert(
        cajeroCodes.includes("pos.vender") && cajeroCodes.includes("caja.abrir_turno"),
        "Cajero cuenta con permisos de venta y turno de caja"
      );
      assert(
        !cajeroCodes.includes("caja.ver_teorico"),
        "Cajero tiene bloqueado el saldo teórico del arqueo ('caja.ver_teorico')"
      );
      assert(
        !cajeroCodes.includes("admin.usuarios") && !cajeroCodes.includes("admin.perfiles"),
        "Cajero tiene bloqueados los módulos administrativos de gobierno"
      );
    }

    // 5. Cifrado y descifrado de sesión JWT (jose)
    const mockSessionPayload: SessionPayload = {
      userId: "test-user-id",
      name: "Cajero Test",
      username: "cajerotest",
      email: "test@matacos.local",
      profileId: "test-profile-id",
      profileName: "Cajero Mostrador",
      level: 10,
      permissions: ["pos.vender", "caja.abrir_turno"],
    };

    const token = await encryptSession(mockSessionPayload);
    assert(typeof token === "string" && token.length > 20, "Generación exitosa de JWT cifrado");

    const decrypted = await decryptSession(token);
    assert(
      Boolean(decrypted && decrypted.userId === "test-user-id" && decrypted.username === "cajerotest"),
      "Descifrado y validación exitosa del token de sesión"
    );

    console.log("\n=================================================");
    console.log(`📊 RESULTADOS: ${passed} pasadas, ${failed} falladas.`);
    console.log("=================================================\n");

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Error fatal en suite de pruebas:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRbacTests();
