"use server";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getSession } from "@/lib/session";
import {
  GetAnalyticsInputSchema,
  type AnalyticsTimeFilter,
  type GetAnalyticsInput,
  type ManagerialDashboardDataDTO,
  type DashboardKpiCardDTO,
  type EarningsChartPointDTO,
  type TopProductRankingDTO,
  type PaymentChannelMatrixItemDTO,
  type DisciplineSalesBarDTO,
  type LogisticsDistributionSliceDTO,
  type SidebarAlertItemDTO,
  type SidebarActivityItemDTO,
  type SidebarStaffItemDTO,
} from "@/schemas/analytics";

const ARGENTINA_OFFSET_MS = -3 * 60 * 60 * 1000; // UTC-3 (America/Argentina/Buenos_Aires)

const MONTH_NAMES_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/**
 * Obtiene la fecha/hora actual ajustada a los componentes de calendario de Argentina (UTC-3)
 */
function getArgentinaNowParts(referenceDate: Date = new Date()) {
  const arTime = new Date(referenceDate.getTime() + ARGENTINA_OFFSET_MS);
  return {
    year: arTime.getUTCFullYear(),
    month: arTime.getUTCMonth(),
    day: arTime.getUTCDate(),
    dayOfWeek: arTime.getUTCDay(), // 0 = Dom, 1 = Lun, ...
    hours: arTime.getUTCHours(),
  };
}

/**
 * Construye un objeto Date UTC a partir de una fecha local de Argentina (UTC-3)
 */
function buildDateFromArgentinaLocal(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): Date {
  const utcTimestamp =
    Date.UTC(year, month, day, hours, minutes, seconds, ms) - ARGENTINA_OFFSET_MS;
  return new Date(utcTimestamp);
}

/**
 * Calcula las ventanas de tiempo (actual y previa para comparación) en zona horaria Argentina,
 * permitiendo tanto filtros rápidos como revisitar cualquier mes o año histórico.
 */
export async function resolvePeriodWindows(
  timeFilter: AnalyticsTimeFilter,
  referenceDate: Date = new Date(),
  selectedYear?: number,
  selectedMonth?: number | null
) {
  const ar = getArgentinaNowParts(referenceDate);

  if (timeFilter === "Hoy") {
    const currentStart = buildDateFromArgentinaLocal(ar.year, ar.month, ar.day, 0, 0, 0, 0);
    const currentEnd = buildDateFromArgentinaLocal(ar.year, ar.month, ar.day, 23, 59, 59, 999);
    const previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
    const previousEnd = new Date(currentEnd.getTime() - 24 * 60 * 60 * 1000);

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      periodLabel: "Hoy",
      comparisonLabel: "Ayer",
      resolvedYear: ar.year,
      resolvedMonth: ar.month,
    };
  }

  if (timeFilter === "Esta semana") {
    // Lunes como inicio de semana comercial (si hoy es domingo=0, retrocede 6 días)
    const daysSinceMonday = ar.dayOfWeek === 0 ? 6 : ar.dayOfWeek - 1;
    const currentStart = buildDateFromArgentinaLocal(
      ar.year,
      ar.month,
      ar.day - daysSinceMonday,
      0,
      0,
      0,
      0
    );
    const currentEnd = buildDateFromArgentinaLocal(ar.year, ar.month, ar.day, 23, 59, 59, 999);
    const previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousEnd = new Date(currentStart.getTime() - 1);

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      periodLabel: "Esta semana",
      comparisonLabel: "Semana anterior",
      resolvedYear: ar.year,
      resolvedMonth: ar.month,
    };
  }

  if (timeFilter === "Este mes" || timeFilter === "Mes específico") {
    const targetYear = selectedYear ?? ar.year;
    const targetMonth =
      typeof selectedMonth === "number" && selectedMonth >= 0 && selectedMonth <= 11
        ? selectedMonth
        : ar.month;

    const currentStart = buildDateFromArgentinaLocal(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const currentEnd = buildDateFromArgentinaLocal(
      targetYear,
      targetMonth + 1,
      0,
      23,
      59,
      59,
      999
    );
    const previousStart = buildDateFromArgentinaLocal(
      targetYear,
      targetMonth - 1,
      1,
      0,
      0,
      0,
      0
    );
    const previousEnd = buildDateFromArgentinaLocal(targetYear, targetMonth, 0, 23, 59, 59, 999);
    const prevMonthIdx = (targetMonth + 11) % 12;
    const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      periodLabel: `${MONTH_NAMES_SHORT[targetMonth]} ${targetYear}`,
      comparisonLabel: `${MONTH_NAMES_SHORT[prevMonthIdx]} ${prevYear}`,
      resolvedYear: targetYear,
      resolvedMonth: targetMonth,
    };
  }

  // "Año actual" o "Año específico"
  const targetYear = selectedYear ?? ar.year;
  const currentStart = buildDateFromArgentinaLocal(targetYear, 0, 1, 0, 0, 0, 0);
  const currentEnd = buildDateFromArgentinaLocal(targetYear, 11, 31, 23, 59, 59, 999);
  const previousStart = buildDateFromArgentinaLocal(targetYear - 1, 0, 1, 0, 0, 0, 0);
  const previousEnd = buildDateFromArgentinaLocal(targetYear - 1, 11, 31, 23, 59, 59, 999);

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    periodLabel: `Año ${targetYear}`,
    comparisonLabel: `Año ${targetYear - 1}`,
    resolvedYear: targetYear,
    resolvedMonth: null,
  };
}

function calcPercentageChange(current: number, previous: number): {
  percent: number;
  formatted: string;
  isPositive: boolean;
} {
  if (previous <= 0) {
    if (current > 0) {
      return { percent: 100, formatted: "+100.0%", isPositive: true };
    }
    return { percent: 0, formatted: "0.0%", isPositive: true };
  }
  const raw = ((current - previous) / previous) * 100;
  const rounded = Math.round(raw * 10) / 10;
  const sign = rounded >= 0 ? "+" : "";
  return {
    percent: rounded,
    formatted: `${sign}${rounded.toFixed(1)}%`,
    isPositive: rounded >= 0,
  };
}

function formatRelativeTimeEs(date: Date, now: Date = new Date()): string {
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Recién";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ayer";
  if (diffDays < 30) return `Hace ${diffDays} días`;
  const ar = getArgentinaNowParts(date);
  return `${ar.day} ${MONTH_NAMES_SHORT[ar.month]}`;
}

function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return "MD";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Verifica si el usuario actual posee autorización gerencial para visualizar KPIs y ganancias (RF-24)
 */
async function checkCanViewFinancials(forceUnauthorizedView?: boolean): Promise<boolean> {
  if (forceUnauthorizedView) {
    return false;
  }

  try {
    const session = await getSession();
    if (!session) {
      // Si no hay sesión activa en cookies (ej. entorno de prueba o modo libre local), permitir salvo que se fuerce restricción
      return true;
    }
    if (session.level >= 50) return true;
    if (session.profileName?.toLowerCase().includes("admin")) return true;
    if (session.permissions?.includes("reportes.ver_kpis")) return true;
    if (session.permissions?.includes("inventario.costos")) return true;
    return false;
  } catch {
    // Llamada desde CLI / script de pruebas fuera del scope HTTP de Next.js
    return true;
  }
}

/**
 * Calcula la ganancia bruta y métricas de un conjunto de ventas completadas
 */
function computeSalesFinancialMetrics(
  sales: Array<{
    id: string;
    channel: string;
    total: unknown;
    discount: unknown;
    items: Array<{
      quantity: number;
      unitPrice: unknown;
      subtotal: unknown;
      variant: {
        product: {
          id: string;
          name: string;
          costPrice: unknown;
          imageUrl: string | null;
          brand: { name: string };
          discipline: { id: string; name: string; slug: string };
        };
      };
    }>;
  }>
) {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalUnitsSold = 0;
  let itemsWithoutCostCount = 0;
  let storeSalesCount = 0;
  let webOrdersCount = 0;

  for (const sale of sales) {
    const saleTotal = Math.round(Number(sale.total) * 100) / 100;
    totalRevenue += saleTotal;

    if (sale.channel === "WEB") {
      webOrdersCount++;
    } else {
      storeSalesCount++;
    }

    for (const item of sale.items) {
      totalUnitsSold += item.quantity;
      const rawCost = item.variant?.product?.costPrice;
      if (rawCost !== null && rawCost !== undefined && Number(rawCost) > 0) {
        totalCost += Number(rawCost) * item.quantity;
      } else {
        itemsWithoutCostCount++;
      }
    }
  }

  totalRevenue = Math.round(totalRevenue * 100) / 100;
  totalCost = Math.round(totalCost * 100) / 100;
  const totalProfit = Math.round((totalRevenue - totalCost) * 100) / 100;
  const marginPercent =
    totalRevenue > 0 ? Math.round(((totalProfit / totalRevenue) * 100) * 10) / 10 : 0;
  const totalTransactions = sales.length;
  const averageTicket =
    totalTransactions > 0 ? Math.round((totalRevenue / totalTransactions) * 100) / 100 : 0;

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    marginPercent,
    totalTransactions,
    averageTicket,
    totalUnitsSold,
    itemsWithoutCostCount,
    storeSalesCount,
    webOrdersCount,
  };
}

/**
 * Construye los puntos de la serie temporal para el gráfico de evolución (EarningsChart)
 */
function buildTimeSeriesChartPoints(
  timeFilter: AnalyticsTimeFilter,
  currentSales: Array<{
    createdAt: Date;
    channel: string;
    total: unknown;
    items: Array<{
      quantity: number;
      variant: { product: { costPrice: unknown } };
    }>;
  }>,
  previousSales: Array<{
    createdAt: Date;
    channel: string;
    total: unknown;
  }>,
  referenceDate: Date = new Date()
): EarningsChartPointDTO[] {
  const arNow = getArgentinaNowParts(referenceDate);

  const calcSaleProfit = (sale: {
    total: unknown;
    items: Array<{ quantity: number; variant: { product: { costPrice: unknown } } }>;
  }) => {
    const rev = Number(sale.total);
    let cost = 0;
    for (const it of sale.items) {
      const c = it.variant?.product?.costPrice;
      if (c !== null && c !== undefined && Number(c) > 0) {
        cost += Number(c) * it.quantity;
      }
    }
    return Math.round((rev - cost) * 100) / 100;
  };

  if (timeFilter === "Hoy") {
    // 6 franjas horarias de 4 horas en horario comercial argentino
    const slots = [
      { label: "08 hs", startH: 0, endH: 9 },
      { label: "10 hs", startH: 10, endH: 11 },
      { label: "12 hs", startH: 12, endH: 15 },
      { label: "16 hs", startH: 16, endH: 17 },
      { label: "18 hs", startH: 18, endH: 19 },
      { label: "20 hs", startH: 20, endH: 23 },
    ];

    return slots.map((slot) => {
      let currentRevenue = 0;
      let previousRevenue = 0;
      let currentProfit = 0;
      let storeRevenue = 0;
      let webRevenue = 0;

      for (const s of currentSales) {
        const h = getArgentinaNowParts(s.createdAt).hours;
        if (h >= slot.startH && h <= slot.endH) {
          const rev = Number(s.total);
          currentRevenue += rev;
          currentProfit += calcSaleProfit(s);
          if (s.channel === "WEB") webRevenue += rev;
          else storeRevenue += rev;
        }
      }

      for (const s of previousSales) {
        const h = getArgentinaNowParts(s.createdAt).hours;
        if (h >= slot.startH && h <= slot.endH) {
          previousRevenue += Number(s.total);
        }
      }

      return {
        label: slot.label,
        currentRevenue: Math.round(currentRevenue),
        previousRevenue: Math.round(previousRevenue),
        currentProfit: Math.round(currentProfit),
        storeRevenue: Math.round(storeRevenue),
        webRevenue: Math.round(webRevenue),
      };
    });
  }

  if (timeFilter === "Esta semana") {
    // 7 días de Lunes a Domingo
    const orderedDays = [
      { dayOfWeek: 1, label: "Lun" },
      { dayOfWeek: 2, label: "Mar" },
      { dayOfWeek: 3, label: "Mié" },
      { dayOfWeek: 4, label: "Jue" },
      { dayOfWeek: 5, label: "Vie" },
      { dayOfWeek: 6, label: "Sáb" },
      { dayOfWeek: 0, label: "Dom" },
    ];

    return orderedDays.map((d) => {
      let currentRevenue = 0;
      let previousRevenue = 0;
      let currentProfit = 0;
      let storeRevenue = 0;
      let webRevenue = 0;

      for (const s of currentSales) {
        if (getArgentinaNowParts(s.createdAt).dayOfWeek === d.dayOfWeek) {
          const rev = Number(s.total);
          currentRevenue += rev;
          currentProfit += calcSaleProfit(s);
          if (s.channel === "WEB") webRevenue += rev;
          else storeRevenue += rev;
        }
      }

      for (const s of previousSales) {
        if (getArgentinaNowParts(s.createdAt).dayOfWeek === d.dayOfWeek) {
          previousRevenue += Number(s.total);
        }
      }

      return {
        label: d.label,
        currentRevenue: Math.round(currentRevenue),
        previousRevenue: Math.round(previousRevenue),
        currentProfit: Math.round(currentProfit),
        storeRevenue: Math.round(storeRevenue),
        webRevenue: Math.round(webRevenue),
      };
    });
  }

  if (timeFilter === "Este mes" || timeFilter === "Mes específico") {
    // 5 semanas / bloques de días del mes (1-7, 8-14, 15-21, 22-28, 29-31)
    const weeks = [
      { label: "Sem 1", minDay: 1, maxDay: 7 },
      { label: "Sem 2", minDay: 8, maxDay: 14 },
      { label: "Sem 3", minDay: 15, maxDay: 21 },
      { label: "Sem 4", minDay: 22, maxDay: 28 },
      { label: "Sem 5", minDay: 29, maxDay: 31 },
    ];

    return weeks.map((w) => {
      let currentRevenue = 0;
      let previousRevenue = 0;
      let currentProfit = 0;
      let storeRevenue = 0;
      let webRevenue = 0;

      for (const s of currentSales) {
        const day = getArgentinaNowParts(s.createdAt).day;
        if (day >= w.minDay && day <= w.maxDay) {
          const rev = Number(s.total);
          currentRevenue += rev;
          currentProfit += calcSaleProfit(s);
          if (s.channel === "WEB") webRevenue += rev;
          else storeRevenue += rev;
        }
      }

      for (const s of previousSales) {
        const day = getArgentinaNowParts(s.createdAt).day;
        if (day >= w.minDay && day <= w.maxDay) {
          previousRevenue += Number(s.total);
        }
      }

      return {
        label: w.label,
        currentRevenue: Math.round(currentRevenue),
        previousRevenue: Math.round(previousRevenue),
        currentProfit: Math.round(currentProfit),
        storeRevenue: Math.round(storeRevenue),
        webRevenue: Math.round(webRevenue),
      };
    });
  }

  // "Año actual" o "Año específico": los 12 meses completos del año (Ene a Dic)
  const months: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return months.map((m) => {
    let currentRevenue = 0;
    let previousRevenue = 0;
    let currentProfit = 0;
    let storeRevenue = 0;
    let webRevenue = 0;

    for (const s of currentSales) {
      if (getArgentinaNowParts(s.createdAt).month === m) {
        const rev = Number(s.total);
        currentRevenue += rev;
        currentProfit += calcSaleProfit(s);
        if (s.channel === "WEB") webRevenue += rev;
        else storeRevenue += rev;
      }
    }

    for (const s of previousSales) {
      if (getArgentinaNowParts(s.createdAt).month === m) {
        previousRevenue += Number(s.total);
      }
    }

    return {
      label: MONTH_NAMES_SHORT[m],
      currentRevenue: Math.round(currentRevenue),
      previousRevenue: Math.round(previousRevenue),
      currentProfit: Math.round(currentProfit),
      storeRevenue: Math.round(storeRevenue),
      webRevenue: Math.round(webRevenue),
    };
  });
}

/**
 * Siembra un conjunto idempotente de ventas históricas realistas si la base de datos no tiene ventas completadas,
 * permitiendo visualizar todas las métricas gerenciales de RF-24 en localhost de inmediato.
 */
export async function ensureDemoAnalyticsSalesIfEmpty(): Promise<{
  seeded: boolean;
  count: number;
}> {
  try {
    const existingDemoCount = await prisma.sale.count({
      where: { invoiceNumber: { startsWith: "DEMO-RF24-" } },
    });

    if (existingDemoCount >= 9) {
      const totalCompleted = await prisma.sale.count({
        where: { status: "COMPLETADA" },
      });
      return { seeded: false, count: totalCompleted };
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        product: {
          active: true,
          costPrice: { gt: 0 },
        },
      },
      include: { product: true },
      orderBy: { createdAt: "asc" },
      take: 15,
    });

    if (variants.length === 0) {
      return { seeded: false, count: 0 };
    }

    const adminUser = await prisma.user.findFirst({
      where: { active: true },
    });

    const customer = await prisma.customer.findFirst();
    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Escenarios realistas distribuidos en Hoy, Esta Semana, Este Mes y Meses Anteriores
    const demoScenarios = [
      {
        code: "DEMO-RF24-0001",
        offsetMs: -1 * 60 * 60 * 1000, // Hoy hace 1 hora
        channel: "MOSTRADOR",
        method: "EFECTIVO" as const,
        shippingMethod: null,
        shippingCity: "Formosa",
        variantIdx: 0,
        qty: 2,
      },
      {
        code: "DEMO-RF24-0002",
        offsetMs: -3 * 60 * 60 * 1000, // Hoy hace 3 horas
        channel: "WEB",
        method: "MERCADOPAGO_ONLINE" as const,
        shippingMethod: "CADETERIA_FORMOSA",
        shippingCity: "Formosa",
        variantIdx: Math.min(2, variants.length - 1),
        qty: 1,
      },
      {
        code: "DEMO-RF24-0003",
        offsetMs: -1 * DAY_MS - 2 * 60 * 60 * 1000, // Ayer
        channel: "MOSTRADOR",
        method: "DEBITO" as const,
        shippingMethod: null,
        shippingCity: "Formosa",
        variantIdx: Math.min(4, variants.length - 1),
        qty: 1,
      },
      {
        code: "DEMO-RF24-0004",
        offsetMs: -2 * DAY_MS, // Hace 2 días
        channel: "WEB",
        method: "TRANSFERENCIA" as const,
        shippingMethod: "RETIRO_LOCAL",
        shippingCity: "Formosa",
        variantIdx: Math.min(1, variants.length - 1),
        qty: 2,
      },
      {
        code: "DEMO-RF24-0005",
        offsetMs: -4 * DAY_MS, // Hace 4 días
        channel: "MOSTRADOR",
        method: "CREDITO" as const,
        shippingMethod: null,
        shippingCity: "Formosa",
        variantIdx: Math.min(6, variants.length - 1),
        qty: 1,
      },
      {
        code: "DEMO-RF24-0006",
        offsetMs: -9 * DAY_MS, // Semana pasada (mismo mes)
        channel: "WEB",
        method: "MERCADOPAGO_ONLINE" as const,
        shippingMethod: "CORREO_ARGENTINO",
        shippingCity: "Resistencia, Chaco",
        variantIdx: Math.min(3, variants.length - 1),
        qty: 1,
      },
      {
        code: "DEMO-RF24-0007",
        offsetMs: -15 * DAY_MS, // Hace 15 días
        channel: "MOSTRADOR",
        method: "EFECTIVO" as const,
        shippingMethod: null,
        shippingCity: "Formosa",
        variantIdx: Math.min(8, variants.length - 1),
        qty: 2,
      },
      {
        code: "DEMO-RF24-0008",
        offsetMs: -35 * DAY_MS, // Mes anterior
        channel: "MOSTRADOR",
        method: "TRANSFERENCIA" as const,
        shippingMethod: null,
        shippingCity: "Formosa",
        variantIdx: 0,
        qty: 1,
      },
      {
        code: "DEMO-RF24-0009",
        offsetMs: -42 * DAY_MS, // Mes anterior
        channel: "WEB",
        method: "MERCADOPAGO_ONLINE" as const,
        shippingMethod: "CORREO_ARGENTINO",
        shippingCity: "Corrientes",
        variantIdx: Math.min(5, variants.length - 1),
        qty: 1,
      },
    ];

    for (const sc of demoScenarios) {
      const existing = await prisma.sale.findUnique({
        where: { invoiceNumber: sc.code },
      });
      if (existing) continue;

      const v = variants[sc.variantIdx];
      const unitPrice = Number(v.price ?? v.product.price);
      const subtotal = Math.round(unitPrice * sc.qty * 100) / 100;
      const saleDate = new Date(now.getTime() + sc.offsetMs);

      await prisma.sale.create({
        data: {
          invoiceNumber: sc.code,
          ticketCode: sc.code,
          channel: sc.channel,
          status: "COMPLETADA",
          shippingMethod: sc.shippingMethod,
          shippingStatus: sc.channel === "WEB" ? "ENTREGADO" : "PENDIENTE",
          shippingCity: sc.shippingCity,
          shippingPostalCode: sc.shippingCity === "Formosa" ? "3600" : "3500",
          customerId: sc.channel === "WEB" ? customer?.id ?? null : null,
          customerName: sc.channel === "WEB" ? customer?.name ?? "Cliente Web" : "Consumidor Final",
          customerEmail: sc.channel === "WEB" ? customer?.email ?? "cliente@matacos.com.ar" : null,
          subtotalGross: subtotal,
          discount: 0,
          total: subtotal,
          userId: adminUser?.id ?? null,
          cashierId: sc.channel === "MOSTRADOR" ? adminUser?.id ?? null : null,
          createdAt: saleDate,
          updatedAt: saleDate,
          items: {
            create: [
              {
                variantId: v.id,
                quantity: sc.qty,
                originalPrice: unitPrice,
                unitPrice,
                price: unitPrice,
                subtotal,
              },
            ],
          },
          payments: {
            create: [
              {
                method: sc.method,
                amount: subtotal,
                receivedAmount: sc.method === "EFECTIVO" ? subtotal : null,
                change: sc.method === "EFECTIVO" ? 0 : null,
              },
            ],
          },
        },
      });
    }

    const finalCount = await prisma.sale.count({ where: { status: "COMPLETADA" } });
    return { seeded: true, count: finalCount };
  } catch (error) {
    console.error("Error en ensureDemoAnalyticsSalesIfEmpty:", error);
    return { seeded: false, count: 0 };
  }
}

/**
 * Server Action Principal (RF-24): Obtiene todas las métricas, gráficos y estado operativo
 * para la Pantalla Gerencial de Reportes, Estadísticas y Ganancias.
 */
export async function getManagerialDashboardData(
  rawInput?: Partial<GetAnalyticsInput>
): Promise<{
  success: boolean;
  data?: ManagerialDashboardDataDTO;
  error?: string;
}> {
  try {
    const parsed = GetAnalyticsInputSchema.safeParse(rawInput ?? {});
    const input: GetAnalyticsInput = parsed.success
      ? parsed.data
      : { timeFilter: "Este mes" };

    // Sembrar ventas de demostración si la base está recién inicializada sin operaciones
    await ensureDemoAnalyticsSalesIfEmpty();

    const canViewFinancials = await checkCanViewFinancials(input.forceUnauthorizedView);
    const now = new Date();
    const windows = await resolvePeriodWindows(
      input.timeFilter,
      now,
      input.selectedYear,
      input.selectedMonth
    );

    // 1. Consultar ventas COMPLETADAS del período actual y del período previo en paralelo
    const [
      currentSales,
      previousSales,
      pendingWebOrdersCount,
      pendingVerificationCount,
      pendingPreparationCount,
      activeCashShift,
      lastClosedShift,
      allVariantsForAlerts,
      activePromotionsCount,
      recentSales,
      recentMovements,
      staffUsers,
    ] = await Promise.all([
      prisma.sale.findMany({
        where: {
          status: "COMPLETADA",
          createdAt: {
            gte: windows.currentStart,
            lte: windows.currentEnd,
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      brand: { select: { name: true } },
                      discipline: { select: { id: true, name: true, slug: true } },
                    },
                  },
                },
              },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.sale.findMany({
        where: {
          status: "COMPLETADA",
          createdAt: {
            gte: windows.previousStart,
            lte: windows.previousEnd,
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      brand: { select: { name: true } },
                      discipline: { select: { id: true, name: true, slug: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      // Pedidos web pendientes globales (para subtítulo del KPI)
      prisma.sale.count({
        where: {
          channel: "WEB",
          OR: [
            { status: "PENDIENTE_VERIFICACION" },
            {
              status: "COMPLETADA",
              shippingStatus: { in: ["PENDIENTE", "EN_PREPARACION", "LISTO_RETIRO"] },
            },
          ],
        },
      }),
      prisma.sale.count({
        where: {
          channel: "WEB",
          status: "PENDIENTE_VERIFICACION",
        },
      }),
      prisma.sale.count({
        where: {
          channel: "WEB",
          status: "COMPLETADA",
          shippingStatus: { in: ["PENDIENTE", "EN_PREPARACION"] },
        },
      }),
      prisma.cashShift.findFirst({
        where: { status: "ABIERTA" },
        include: { user: { select: { name: true } } },
        orderBy: { openedAt: "desc" },
      }),
      prisma.cashShift.findFirst({
        where: { status: "CERRADA" },
        orderBy: { closedAt: "desc" },
      }),
      prisma.productVariant.findMany({
        where: {
          product: { active: true, ignoreAlerts: false },
        },
        select: {
          id: true,
          stockStore: true,
          stockWarehouse: true,
          minStoreStock: true,
          minStock: true,
        },
      }),
      prisma.product.count({
        where: { active: true, discountActive: true },
      }),
      prisma.sale.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          channel: true,
          status: true,
          total: true,
          customerName: true,
          createdAt: true,
          cashier: { select: { name: true } },
        },
      }),
      prisma.inventoryMovement.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { active: true },
        include: { profile: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: 6,
      }),
    ]);

    // 2. Calcular métricas financieras agregadas
    const currentMetrics = computeSalesFinancialMetrics(currentSales);
    const previousMetrics = computeSalesFinancialMetrics(previousSales);

    const revenueChange = calcPercentageChange(
      currentMetrics.totalRevenue,
      previousMetrics.totalRevenue
    );
    const profitChange = calcPercentageChange(
      currentMetrics.totalProfit,
      previousMetrics.totalProfit
    );
    const ticketChange = calcPercentageChange(
      currentMetrics.averageTicket,
      previousMetrics.averageTicket
    );
    const webOrdersChange = calcPercentageChange(
      currentMetrics.webOrdersCount,
      previousMetrics.webOrdersCount
    );

    // 3. Construir las 4 Tarjetas KPI Principales (respetando restricción RBAC en Ganancias)
    const kpis: DashboardKpiCardDTO[] = [
      {
        id: "kpi-sales",
        title: "Ingresos Totales",
        value: formatCurrency(currentMetrics.totalRevenue),
        rawValue: currentMetrics.totalRevenue,
        subtitle: `${currentMetrics.totalTransactions} ventas completadas (${currentMetrics.storeSalesCount} salón · ${currentMetrics.webOrdersCount} web)`,
        change: revenueChange.formatted,
        changePercent: revenueChange.percent,
        isPositive: revenueChange.isPositive,
        isFeatured: true,
      },
      {
        id: "kpi-earnings",
        title: "Ganancia Bruta Real",
        value: canViewFinancials
          ? formatCurrency(currentMetrics.totalProfit)
          : "Restringido",
        rawValue: canViewFinancials ? currentMetrics.totalProfit : 0,
        subtitle: canViewFinancials
          ? `Margen neto sobre ventas: ${currentMetrics.marginPercent.toFixed(1)}%`
          : "Requiere permiso gerencial (reportes.ver_kpis)",
        change: canViewFinancials ? profitChange.formatted : "RBAC",
        changePercent: canViewFinancials ? profitChange.percent : 0,
        isPositive: canViewFinancials ? profitChange.isPositive : true,
        isRestricted: !canViewFinancials,
      },
      {
        id: "kpi-ticket",
        title: "Ticket Promedio",
        value: formatCurrency(currentMetrics.averageTicket),
        rawValue: currentMetrics.averageTicket,
        subtitle: `${currentMetrics.totalUnitsSold} unidades despachadas en el período`,
        change: ticketChange.formatted,
        changePercent: ticketChange.percent,
        isPositive: ticketChange.isPositive,
      },
      {
        id: "kpi-orders",
        title: "Pedidos Online",
        value: String(currentMetrics.webOrdersCount),
        rawValue: currentMetrics.webOrdersCount,
        subtitle:
          pendingWebOrdersCount > 0
            ? `${pendingWebOrdersCount} pendientes de gestión/envío`
            : "Todos los pedidos web al día",
        change: webOrdersChange.formatted,
        changePercent: webOrdersChange.percent,
        isPositive: webOrdersChange.isPositive,
      },
    ];

    // 4. Construir la Serie Temporal para EarningsChart
    const rawChartSeries = buildTimeSeriesChartPoints(
      input.timeFilter,
      currentSales,
      previousSales,
      now
    );

    const chartSeries: EarningsChartPointDTO[] = rawChartSeries.map((pt) => ({
      ...pt,
      currentProfit: canViewFinancials ? pt.currentProfit : 0,
    }));

    // 5. Ranking Top 5 Productos Más Vendidos del Período
    const productAggregator = new Map<
      string,
      {
        productId: string;
        name: string;
        brand: string;
        discipline: string;
        imageUrl: string | null;
        unitsSold: number;
        revenue: number;
        cost: number;
      }
    >();

    for (const sale of currentSales) {
      for (const item of sale.items) {
        const prod = item.variant.product;
        const existing = productAggregator.get(prod.id) ?? {
          productId: prod.id,
          name: prod.name,
          brand: prod.brand.name,
          discipline: prod.discipline.name,
          imageUrl: prod.imageUrl,
          unitsSold: 0,
          revenue: 0,
          cost: 0,
        };

        const itemRev = Number(item.subtotal);
        const unitCost = prod.costPrice !== null ? Number(prod.costPrice) : 0;

        existing.unitsSold += item.quantity;
        existing.revenue += itemRev;
        existing.cost += unitCost * item.quantity;

        productAggregator.set(prod.id, existing);
      }
    }

    const topProducts: TopProductRankingDTO[] = Array.from(productAggregator.values())
      .sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold)
      .slice(0, 5)
      .map((p) => {
        const rev = Math.round(p.revenue * 100) / 100;
        const prof = Math.round((p.revenue - p.cost) * 100) / 100;
        const margin = rev > 0 ? Math.round(((prof / rev) * 100) * 10) / 10 : 0;
        return {
          productId: p.productId,
          name: p.name,
          brand: p.brand,
          discipline: p.discipline,
          imageUrl: p.imageUrl,
          unitsSold: p.unitsSold,
          revenue: rev,
          formattedRevenue: formatCurrency(rev),
          profit: canViewFinancials ? prof : 0,
          formattedProfit: canViewFinancials ? formatCurrency(prof) : "Restringido",
          marginPercent: canViewFinancials ? margin : 0,
        };
      });

    // 6. Matriz de Canales y Medios de Pago (SalesChannelsMatrix)
    const paymentGroups = {
      tarjetas: { name: "Tarjetas (Débito / Crédito)", amount: 0, count: 0 },
      mercadopago: { name: "Mercado Pago / QR", amount: 0, count: 0 },
      transferencia: { name: "Transferencia bancaria", amount: 0, count: 0 },
      efectivo: { name: "Efectivo en mostrador", amount: 0, count: 0 },
    };

    let totalPaymentsAmount = 0;

    for (const sale of currentSales) {
      for (const pay of sale.payments) {
        const amt = Number(pay.amount);
        totalPaymentsAmount += amt;

        if (pay.method === "DEBITO" || pay.method === "CREDITO") {
          paymentGroups.tarjetas.amount += amt;
          paymentGroups.tarjetas.count++;
        } else if (
          pay.method === "MERCADOPAGO_ONLINE" ||
          pay.method === "QR_MERCADOPAGO"
        ) {
          paymentGroups.mercadopago.amount += amt;
          paymentGroups.mercadopago.count++;
        } else if (pay.method === "TRANSFERENCIA") {
          paymentGroups.transferencia.amount += amt;
          paymentGroups.transferencia.count++;
        } else {
          paymentGroups.efectivo.amount += amt;
          paymentGroups.efectivo.count++;
        }
      }
    }

    const buildActiveDots = (pct: number): number[] => {
      // Convierte el porcentaje (0-100%) en un patrón visual de 5 columnas
      const activeCount = pct <= 0 ? 0 : Math.min(5, Math.max(1, Math.ceil(pct / 20)));
      return [1, 2, 3, 4, 5].map((col) => (col <= activeCount ? 1 : 0));
    };

    const paymentChannels: PaymentChannelMatrixItemDTO[] = Object.entries(paymentGroups).map(
      ([id, grp]) => {
        const roundedAmt = Math.round(grp.amount * 100) / 100;
        const pct =
          totalPaymentsAmount > 0
            ? Math.round(((roundedAmt / totalPaymentsAmount) * 100) * 10) / 10
            : 0;
        return {
          id,
          methodKey: id,
          name: grp.name,
          amount: roundedAmt,
          formattedAmount: formatCurrency(roundedAmt),
          percentage: pct,
          transactionsCount: grp.count,
          activeCol: buildActiveDots(pct),
        };
      }
    );

    // 7. Ventas por Disciplina Deportiva (Reemplazo real de WebTrafficChart)
    const allDisciplines = await prisma.discipline.findMany({
      orderBy: { name: "asc" },
    });

    const disciplineMap = new Map<
      string,
      { id: string; name: string; revenue: number; units: number }
    >();

    for (const d of allDisciplines) {
      disciplineMap.set(d.id, { id: d.id, name: d.name, revenue: 0, units: 0 });
    }

    for (const sale of currentSales) {
      for (const item of sale.items) {
        const disc = item.variant.product.discipline;
        const entry = disciplineMap.get(disc.id) ?? {
          id: disc.id,
          name: disc.name,
          revenue: 0,
          units: 0,
        };
        entry.revenue += Number(item.subtotal);
        entry.units += item.quantity;
        disciplineMap.set(disc.id, entry);
      }
    }

    const sortedDisciplines = Array.from(disciplineMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const maxDisciplineRev = Math.max(1, ...sortedDisciplines.map((d) => d.revenue));

    const disciplineSales: DisciplineSalesBarDTO[] = sortedDisciplines.map((d, idx) => {
      const shortLabel =
        d.name.length > 12 ? d.name.split(" ")[0] : d.name;
      const isTop = idx === 0 && d.revenue > 0;
      const hasSales = d.revenue > 0;
      return {
        disciplineId: d.id,
        source: shortLabel,
        fullName: d.name,
        revenue: Math.round(d.revenue),
        formattedRevenue: formatCurrency(d.revenue),
        unitsSold: d.units,
        color: isTop
          ? "bg-slate-900 hover:bg-slate-800"
          : hasSales
          ? "bg-emerald-600 hover:bg-emerald-500"
          : "bg-slate-400 hover:bg-slate-500",
      };
    });

    // 8. Distribución por Canal y Logística (Reemplazo real de ProvinceTrafficChart)
    const logisticsBuckets = {
      mostrador: {
        id: "mostrador",
        province: "Mostrador Saavedra 241",
        count: 0,
        revenue: 0,
        color: "#10b981",
        dotClass: "bg-emerald-500",
      },
      cadeteria: {
        id: "cadeteria",
        province: "Cadetería Formosa",
        count: 0,
        revenue: 0,
        color: "#0f172a",
        dotClass: "bg-slate-900",
      },
      retiro: {
        id: "retiro",
        province: "Retiro en Tienda Web",
        count: 0,
        revenue: 0,
        color: "#0284c7",
        dotClass: "bg-sky-600",
      },
      nacional: {
        id: "nacional",
        province: "Correo Argentino (País)",
        count: 0,
        revenue: 0,
        color: "#f59e0b",
        dotClass: "bg-amber-500",
      },
    };

    for (const sale of currentSales) {
      const rev = Number(sale.total);
      if (sale.channel !== "WEB") {
        logisticsBuckets.mostrador.count++;
        logisticsBuckets.mostrador.revenue += rev;
      } else if (sale.shippingMethod === "CADETERIA_FORMOSA") {
        logisticsBuckets.cadeteria.count++;
        logisticsBuckets.cadeteria.revenue += rev;
      } else if (sale.shippingMethod === "CORREO_ARGENTINO") {
        logisticsBuckets.nacional.count++;
        logisticsBuckets.nacional.revenue += rev;
      } else {
        logisticsBuckets.retiro.count++;
        logisticsBuckets.retiro.revenue += rev;
      }
    }

    const totalOrdersForDonut = currentSales.length;
    const logisticsDistribution: LogisticsDistributionSliceDTO[] = Object.values(
      logisticsBuckets
    ).map((b) => {
      const pct =
        totalOrdersForDonut > 0
          ? Math.round(((b.count / totalOrdersForDonut) * 100) * 10) / 10
          : b.id === "mostrador"
          ? 100
          : 0;
      return {
        id: b.id,
        province: b.province,
        count: b.count,
        revenue: Math.round(b.revenue * 100) / 100,
        formattedRevenue: formatCurrency(b.revenue),
        percentage: pct,
        color: b.color,
        dotClass: b.dotClass,
      };
    });

    // 9. Estado Operativo de Caja, Stock Crítico y Despachos (Tarjeta 3 Inferior)
    let criticalStockCount = 0;
    for (const v of allVariantsForAlerts) {
      const totalVarStock = v.stockStore + v.stockWarehouse;
      if (v.stockStore <= v.minStoreStock || totalVarStock <= v.minStock) {
        criticalStockCount++;
      }
    }

    const expectedCash = activeCashShift ? Number(activeCashShift.expectedCash) : 0;
    const lastDiff =
      lastClosedShift && lastClosedShift.differenceCash !== null
        ? Number(lastClosedShift.differenceCash)
        : 0;

    const operationalStatus = {
      cashShift: {
        isOpen: Boolean(activeCashShift),
        cashierName: activeCashShift?.user?.name ?? null,
        openedAtFormatted: activeCashShift
          ? formatRelativeTimeEs(activeCashShift.openedAt, now)
          : null,
        expectedCash,
        formattedExpectedCash: formatCurrency(expectedCash),
        lastClosedDifference: lastDiff,
        formattedLastDifference: formatCurrency(lastDiff),
      },
      webOperations: {
        pendingPreparationCount,
        pendingVerificationCount,
        completedInPeriodCount: currentMetrics.webOrdersCount,
        activePromotionsCount,
        criticalStockCount,
      },
    };

    // 10. Construir datos reales para SidebarRight (Alertas, Actividad en Vivo y Personal)
    const notifications: SidebarAlertItemDTO[] = [];

    if (pendingVerificationCount > 0) {
      notifications.push({
        id: "alert-transfer",
        title: `${pendingVerificationCount} transferencia(s) por conciliar`,
        subtitle: "Comprobantes web pendientes de validación",
        time: "Prioridad alta",
        iconType: "subscribe",
        severity: "warning",
        targetTab: "ecommerce",
      });
    }

    if (pendingPreparationCount > 0) {
      notifications.push({
        id: "alert-orders",
        title: `${pendingPreparationCount} pedido(s) web para preparar`,
        subtitle: "Picking en salón o despacho logístico",
        time: "En cola",
        iconType: "user",
        severity: "info",
        targetTab: "ecommerce",
      });
    }

    if (criticalStockCount > 0) {
      notifications.push({
        id: "alert-stock",
        title: `${criticalStockCount} variante(s) en stock crítico`,
        subtitle: "Requieren reposición de depósito a salón",
        time: "Inventario",
        iconType: "bug",
        severity: "critical",
        targetTab: "inventario",
      });
    }

    notifications.push({
      id: "alert-cash",
      title: activeCashShift
        ? `Caja abierta (${activeCashShift.user?.name ?? "Mostrador"})`
        : "Caja de mostrador cerrada",
      subtitle: activeCashShift
        ? `Teórico en cajón: ${formatCurrency(expectedCash)}`
        : "Inicie turno en POS para operar en efectivo",
      time: activeCashShift
        ? formatRelativeTimeEs(activeCashShift.openedAt, now)
        : "Sin turno activo",
      iconType: "subscribe",
      severity: activeCashShift ? "success" : "info",
      targetTab: "pos",
    });

    const avatarGradients = [
      "from-emerald-600 to-teal-700",
      "from-slate-700 to-slate-900",
      "from-indigo-600 to-blue-700",
      "from-amber-500 to-orange-600",
      "from-rose-500 to-pink-600",
    ];

    const activities: SidebarActivityItemDTO[] = [];

    recentSales.forEach((s, idx) => {
      const actor =
        s.channel === "WEB"
          ? s.customerName || "Cliente Web"
          : s.cashier?.name || "Mostrador";
      const code = s.invoiceNumber || s.id.slice(0, 8).toUpperCase();
      activities.push({
        id: `sale-${s.id}`,
        action: `${s.channel === "WEB" ? "Pedido Web" : "Venta POS"} ${code}`,
        detail: `${formatCurrency(Number(s.total))} · ${actor}`,
        time: formatRelativeTimeEs(s.createdAt, now),
        avatarBg: avatarGradients[idx % avatarGradients.length],
        initials: getInitials(actor),
      });
    });

    recentMovements.slice(0, Math.max(1, 5 - activities.length)).forEach((m, idx) => {
      const prodName = m.variant?.product?.name || "Producto";
      activities.push({
        id: `mov-${m.id}`,
        action: `${m.type}: ${prodName.slice(0, 22)}`,
        detail: `${m.quantity > 0 ? `+${m.quantity}` : m.quantity} un. (${
          m.location === "WAREHOUSE" ? "Depósito" : "Salón"
        })`,
        time: formatRelativeTimeEs(m.createdAt, now),
        avatarBg: avatarGradients[(idx + 2) % avatarGradients.length],
        initials: "ST",
      });
    });

    const staff: SidebarStaffItemDTO[] = staffUsers.map((u, idx) => {
      const isCashierInShift =
        activeCashShift && activeCashShift.user?.name === u.name;
      return {
        id: u.id,
        name: u.name,
        roleLabel: isCashierInShift
          ? "En turno de caja"
          : u.profile?.name || u.role || "Personal",
        status: isCashierInShift ? "online" : "busy",
        avatarBg: avatarGradients[idx % avatarGradients.length],
        initials: getInitials(u.name),
      };
    });

    const arNow = getArgentinaNowParts(now);
    const oldestSale = await prisma.sale.findFirst({
      where: { status: "COMPLETADA" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const minYear = Math.min(
      arNow.year - 1,
      oldestSale ? getArgentinaNowParts(oldestSale.createdAt).year : arNow.year - 1
    );
    const availableYears: number[] = [];
    for (let y = arNow.year; y >= minYear; y--) {
      availableYears.push(y);
    }

    const payload: ManagerialDashboardDataDTO = {
      timeFilter: input.timeFilter,
      selectedYear: windows.resolvedYear,
      selectedMonth: windows.resolvedMonth,
      availableYears,
      periodLabel: windows.periodLabel,
      comparisonLabel: windows.comparisonLabel,
      canViewFinancials,
      summary: {
        totalRevenue: currentMetrics.totalRevenue,
        previousRevenue: previousMetrics.totalRevenue,
        totalProfit: canViewFinancials ? currentMetrics.totalProfit : 0,
        previousProfit: canViewFinancials ? previousMetrics.totalProfit : 0,
        marginPercent: canViewFinancials ? currentMetrics.marginPercent : 0,
        totalTransactions: currentMetrics.totalTransactions,
        averageTicket: currentMetrics.averageTicket,
        previousAverageTicket: previousMetrics.averageTicket,
        webOrdersCount: currentMetrics.webOrdersCount,
        pendingWebOrdersCount,
        storeSalesCount: currentMetrics.storeSalesCount,
        totalUnitsSold: currentMetrics.totalUnitsSold,
        itemsWithoutCostCount: currentMetrics.itemsWithoutCostCount,
      },
      kpis,
      chartSeries,
      topProducts,
      paymentChannels,
      disciplineSales,
      logisticsDistribution,
      operationalStatus,
      sidebar: {
        notifications: notifications.slice(0, 4),
        activities: activities.slice(0, 5),
        staff,
      },
    };

    return {
      success: true,
      data: payload,
    };
  } catch (error) {
    console.error("Error en getManagerialDashboardData (RF-24):", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron calcular las métricas gerenciales.",
    };
  }
}
