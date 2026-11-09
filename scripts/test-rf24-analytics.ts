/**
 * Suite de Pruebas Automatizadas para RF-24:
 * Pantalla Gerencial de Reportes, Estadísticas, KPIs y Ganancias en Tiempo Real
 */

import { prisma } from "../src/lib/prisma";
import {
  getManagerialDashboardData,
  ensureDemoAnalyticsSalesIfEmpty,
} from "../src/server/actions/analyticsActions";

async function runRf24AnalyticsTests() {
  console.log("================================================================================");
  console.log("🧪 TEST SUITE: RF-24 PANTALLA GERENCIAL DE REPORTES, ESTADÍSTICAS Y GANANCIAS");
  console.log("================================================================================\n");

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

  try {
    // 1. Verificar inicialización y siembra de operaciones gerenciales
    console.log("🔹 1. Siembra e Inicialización de Datos Operativos Omnicanal");
    const seedRes = await ensureDemoAnalyticsSalesIfEmpty();
    assert(seedRes.count > 0, `Base de datos cuenta con ventas completadas (${seedRes.count} ventas)`);

    // 2. Consulta de KPIs Principales en los 4 períodos temporales
    console.log("\n🔹 2. Consulta Dinámica por Períodos Temporales (Hoy, Semana, Mes, Año)");
    const filters = ["Hoy", "Esta semana", "Este mes", "Año actual"] as const;

    for (const filter of filters) {
      const res = await getManagerialDashboardData({ timeFilter: filter });
      assert(
        Boolean(res.success && res.data),
        `getManagerialDashboardData('${filter}') responde exitosamente`
      );
      if (res.data) {
        assert(
          res.data.kpis.length === 4,
          `Retorna las 4 tarjetas KPI principales para '${filter}'`
        );
        assert(
          res.data.chartSeries.length >= 5,
          `Retorna serie temporal válida (${res.data.chartSeries.length} puntos) para '${filter}'`
        );
      }
    }

    // 3. Verificación Matemática de Ingresos, Ganancias, Margen y Ticket Promedio
    console.log("\n🔹 3. Exactitud Matemática de Facturación, Ganancia Bruta y Ticket Promedio");
    const monthRes = await getManagerialDashboardData({ timeFilter: "Este mes" });
    const data = monthRes.data!;

    assert(
      data.summary.totalRevenue > 0,
      `Ingresos Totales del mes > 0 (${data.kpis[0].value})`
    );
    assert(
      data.summary.totalProfit > 0 && data.summary.totalProfit < data.summary.totalRevenue,
      `Ganancia Bruta Real ($ ${data.summary.totalProfit}) es positiva e inferior al ingreso bruto`
    );

    const expectedAvgTicket =
      Math.round((data.summary.totalRevenue / data.summary.totalTransactions) * 100) / 100;
    assert(
      Math.abs(data.summary.averageTicket - expectedAvgTicket) <= 0.01,
      `Ticket Promedio exacto al centavo ($ ${data.summary.averageTicket} === $ ${expectedAvgTicket})`
    );

    const expectedMargin =
      Math.round(((data.summary.totalProfit / data.summary.totalRevenue) * 100) * 10) / 10;
    assert(
      Math.abs(data.summary.marginPercent - expectedMargin) <= 0.1,
      `Porcentaje de margen comercial consistente (${data.summary.marginPercent}%)`
    );

    // 4. Desglose de Medios de Pago y Conciliación
    console.log("\n🔹 4. Matriz de Medios de Pago y Conciliación Omnicanal");
    assert(
      data.paymentChannels.length === 4,
      "Retorna los 4 grupos de medios de pago (Tarjetas, Mercado Pago, Transferencia, Efectivo)"
    );

    const sumPayments = data.paymentChannels.reduce((acc, ch) => acc + ch.amount, 0);
    assert(
      Math.abs(sumPayments - data.summary.totalRevenue) <= 1,
      `Suma de medios de pago ($ ${sumPayments}) concilia con Ingresos Totales ($ ${data.summary.totalRevenue})`
    );

    // 5. Ranking de Productos, Disciplinas y Distribución Logística
    console.log("\n🔹 5. Ventas por Disciplina, Ranking de Productos y Logística");
    assert(
      data.topProducts.length > 0,
      `Ranking Top Productos contiene artículos vendidos (${data.topProducts.length} productos)`
    );
    assert(
      data.disciplineSales.length > 0,
      `Gráfico de Ventas por Disciplina contiene rubros (${data.disciplineSales.length} disciplinas)`
    );
    assert(
      data.logisticsDistribution.length === 4,
      "Gráfico de Dona Logística contiene las 4 modalidades (Mostrador, Cadetería, Retiro, Correo Argentino)"
    );

    const sumLogisticsCount = data.logisticsDistribution.reduce((acc, l) => acc + l.count, 0);
    assert(
      sumLogisticsCount === data.summary.totalTransactions,
      `Total de operaciones en dona logística (${sumLogisticsCount}) coincide con transacciones del período (${data.summary.totalTransactions})`
    );

    // 6. Salvaguarda RBAC para Perfiles Operativos sin Permiso Gerencial
    console.log("\n🔹 6. Salvaguarda de Confidencialidad de Costos y Ganancias (RBAC)");
    const restrictedRes = await getManagerialDashboardData({
      timeFilter: "Este mes",
      forceUnauthorizedView: true,
    });
    const restrictedData = restrictedRes.data!;

    assert(
      restrictedData.canViewFinancials === false,
      "Indicador canViewFinancials es false para perfiles sin 'reportes.ver_kpis'"
    );
    assert(
      restrictedData.summary.totalProfit === 0 && restrictedData.summary.marginPercent === 0,
      "Ganancia bruta y margen porcentual son ocultados (0) en el payload restringido"
    );
    assert(
      restrictedData.kpis[1].value === "Restringido" && restrictedData.kpis[1].isRestricted === true,
      "Tarjeta KPI de Ganancia muestra estado 'Restringido' con bloqueo RBAC"
    );
    assert(
      restrictedData.topProducts.every((p) => p.profit === 0 && p.formattedProfit === "Restringido"),
      "Ranking de productos oculta el margen de ganancia a usuarios no autorizados"
    );
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n================================================================================");
  console.log(`📊 RESULTADOS RF-24: ${passed} Pasados | ${failed} Fallidos`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRf24AnalyticsTests();
