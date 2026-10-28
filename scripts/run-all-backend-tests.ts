/**
 * Runner Maestro de Pruebas de Backend — Matacos Deportes
 * Ejecuta de forma secuencial y estructurada todas las suites de prueba de backend:
 * 1. Generación de Códigos EAN-13 y Etiquetas Térmicas (RF-05)
 * 2. Actualización Porcentual de Precios y Políticas de Redondeo (RF-01.1)
 * 3. Alertas de Stock Mínimo y Productos Agotados (RF-06)
 * 4. Gestión Transaccional de Productos, Variantes y Baja Lógica (RF-01, RF-02)
 * 5. Control de Stock Dual, Movimientos Atómicos y Ventas (RF-03, CU-INV-03, CU-INV-04)
 * 6. Ingestión Masiva y Carga Progresiva de Inventario (RF-04, CU-INV-02)
 * 7. Portal de Clientes, Autenticación Web, Favoritos y Seguimiento (RF-29)
 */

import { execSync } from "child_process";

interface SuiteResult {
  name: string;
  rf: string;
  command: string;
  durationMs: number;
  success: boolean;
  output: string;
}

const SUITES = [
  {
    name: "Códigos de Barras EAN-13 y Formato de Etiquetas",
    rf: "RF-05 / CU-INV-06",
    script: "scripts/test-barcode-rf05.ts",
  },
  {
    name: "Actualización Porcentual Masiva y Redondeo",
    rf: "RF-01.1 / CU-INV-05",
    script: "scripts/test-price-update.ts",
  },
  {
    name: "Alertas de Stock Crítico y Reposición",
    rf: "RF-06 / CU-INV-08",
    script: "scripts/test-stock-alerts-rf.ts",
  },
  {
    name: "ABM de Productos, Variantes y Baja Lógica",
    rf: "RF-01, RF-02 / CU-INV-01",
    script: "scripts/test-product-actions.ts",
  },
  {
    name: "Control de Stock Dual, Movimientos y Ventas",
    rf: "RF-03 / CU-INV-03, CU-INV-04",
    script: "scripts/test-stock-and-sales.ts",
  },
  {
    name: "Ingestión Masiva y Carga Progresiva de Stock",
    rf: "RF-04 / CU-INV-02",
    script: "scripts/test-rf04-bulk-import.ts",
  },
  {
    name: "Botón Contextual de WhatsApp y Asistencia",
    rf: "RF-18",
    script: "scripts/test-rf18-whatsapp-contingency.ts",
  },
  {
    name: "Portal de Clientes, Favoritos y Seguimiento Web",
    rf: "RF-29",
    script: "scripts/test-rf29-customer-portal.ts",
  },
];

async function main() {
  console.log("================================================================================");
  console.log("🚀 EJECUCIÓN MAESTRA DE PRUEBAS DE BACKEND — MATACOS DEPORTES");
  console.log("================================================================================\n");

  const results: SuiteResult[] = [];
  const globalStart = Date.now();

  for (let i = 0; i < SUITES.length; i++) {
    const suite = SUITES[i]!;
    console.log(`[${i + 1}/${SUITES.length}] Ejecutando: ${suite.name} (${suite.rf})...`);

    const start = Date.now();
    let success = false;
    let output = "";

    try {
      output = execSync(`pnpm tsx ${suite.script}`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      success = true;
      console.log(`   ✅ SUPERADO (${Date.now() - start} ms)\n`);
    } catch (error: unknown) {
      success = false;
      const errObj = error as { stdout?: Buffer; stderr?: Buffer; message?: string };
      output =
        errObj.stdout?.toString() ||
        errObj.stderr?.toString() ||
        errObj.message ||
        "Error en ejecución de suite";
      console.error(`   ❌ FALLÓ (${Date.now() - start} ms)\n`);
    }

    results.push({
      name: suite.name,
      rf: suite.rf,
      command: suite.script,
      durationMs: Date.now() - start,
      success,
      output,
    });
  }

  const globalDuration = Date.now() - globalStart;
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("================================================================================");
  console.log("📊 RESUMEN CONSOLIDADO DE PRUEBAS DE BACKEND");
  console.log("================================================================================");
  results.forEach((r, idx) => {
    const badge = r.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${idx + 1}. [${badge}] ${r.rf.padEnd(20)} | ${r.name.padEnd(48)} (${r.durationMs} ms)`);
  });

  console.log("--------------------------------------------------------------------------------");
  console.log(`Total Suites: ${SUITES.length} | Aprobadas: ${passed} | Fallidas: ${failed} | Tiempo Total: ${(globalDuration / 1000).toFixed(2)}s`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error fatal en el runner maestro:", err);
  process.exit(1);
});
