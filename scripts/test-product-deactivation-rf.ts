import { deleteProduct, toggleProductActive } from "../src/server/actions/productActions";

async function runTests() {
  console.log("========================================================================");
  console.log("🧪 VERIFICACIÓN: GESTIÓN Y REACTIVACIÓN DE PRODUCTOS (BAJA LÓGICA RF-01)");
  console.log("========================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Probar soporte de productos de demostración en deleteProduct
  console.log("1. Probando Baja Lógica en Productos de Demostración...");
  const deleteDemoRes = await deleteProduct("p1");
  assert(deleteDemoRes.success === true, "deleteProduct para 'p1' retorna éxito (modo demo)");

  // 2. Probar soporte de reactivación en toggleProductActive para demo
  console.log("\n2. Probando Reactivación en Productos de Demostración...");
  const toggleDemoRes = await toggleProductActive("p1");
  assert(toggleDemoRes.success === true, "toggleProductActive para 'p1' retorna éxito (modo demo)");
  assert(toggleDemoRes.data?.active === true, "toggleProductActive marca active: true");

  // 3. Probar validación de producto no encontrado
  console.log("\n3. Probando Validación con UUID Inexistente...");
  const fakeUuid = "00000000-0000-0000-0000-000000000000";
  const fakeDelete = await deleteProduct(fakeUuid);
  assert(fakeDelete.success === true, "deleteProduct con UUID inexistente se resuelve de forma resiliente");

  const fakeToggle = await toggleProductActive(fakeUuid);
  assert(fakeToggle.success === false, "toggleProductActive con UUID inexistente retorna success: false");

  console.log("\n========================================================================");
  console.log(`🏁 RESULTADO: ${passed}/${total} PRUEBAS SUPERADAS EXITOSAMENTE`);
  console.log("========================================================================\n");

  if (passed === total) {
    console.log("🎉 TAREA 7: Gestión y Reactivación de Productos Inactivos (RF-01) 100% verificada.");
  }
}

runTests().catch((err) => {
  console.error("Error ejecutando pruebas:", err);
  process.exit(1);
});

