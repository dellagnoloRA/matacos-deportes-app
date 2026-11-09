import { z } from "zod";

export const AnalyticsTimeFilterSchema = z.enum([
  "Hoy",
  "Esta semana",
  "Este mes",
  "Año actual",
  "Mes específico",
  "Año específico",
]);

export type AnalyticsTimeFilter = z.infer<typeof AnalyticsTimeFilterSchema>;

export const GetAnalyticsInputSchema = z.object({
  timeFilter: AnalyticsTimeFilterSchema.default("Este mes"),
  selectedYear: z.number().int().min(2020).max(2100).optional(),
  selectedMonth: z.number().int().min(0).max(11).nullable().optional(),
  forceUnauthorizedView: z.boolean().optional(),
});

export type GetAnalyticsInput = z.infer<typeof GetAnalyticsInputSchema>;

export interface DashboardKpiCardDTO {
  id: string;
  title: string;
  value: string;
  rawValue: number;
  subtitle: string;
  change: string;
  changePercent: number;
  isPositive: boolean;
  isFeatured?: boolean;
  isRestricted?: boolean;
}

export interface EarningsChartPointDTO {
  label: string;
  currentRevenue: number;
  previousRevenue: number;
  currentProfit: number;
  storeRevenue: number;
  webRevenue: number;
}

export interface TopProductRankingDTO {
  productId: string;
  name: string;
  brand: string;
  discipline: string;
  imageUrl: string | null;
  unitsSold: number;
  revenue: number;
  formattedRevenue: string;
  profit: number;
  formattedProfit: string;
  marginPercent: number;
}

export interface PaymentChannelMatrixItemDTO {
  id: string;
  methodKey: string;
  name: string;
  amount: number;
  formattedAmount: string;
  percentage: number;
  transactionsCount: number;
  activeCol: number[]; // 5-column visual intensity indicator [0|1, 0|1, 0|1, 0|1, 0|1]
}

export interface DisciplineSalesBarDTO {
  disciplineId: string;
  source: string; // Nombre corto para el eje X (ej. "Natación", "Vóley")
  fullName: string;
  revenue: number;
  formattedRevenue: string;
  unitsSold: number;
  color: string;
}

export interface LogisticsDistributionSliceDTO {
  id: string;
  province: string; // Etiqueta mostrada en la leyenda (ej. "Mostrador Local", "Cadetería Formosa")
  count: number;
  revenue: number;
  formattedRevenue: string;
  percentage: number;
  color: string;
  dotClass: string;
}

export interface OperationalStatusCardDTO {
  cashShift: {
    isOpen: boolean;
    cashierName: string | null;
    openedAtFormatted: string | null;
    expectedCash: number;
    formattedExpectedCash: string;
    lastClosedDifference: number;
    formattedLastDifference: string;
  };
  webOperations: {
    pendingPreparationCount: number;
    pendingVerificationCount: number;
    completedInPeriodCount: number;
    activePromotionsCount: number;
    criticalStockCount: number;
  };
}

export interface SidebarAlertItemDTO {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  iconType: "bug" | "user" | "subscribe";
  severity: "critical" | "warning" | "info" | "success";
  targetTab?: string;
}

export interface SidebarActivityItemDTO {
  id: string;
  action: string;
  detail: string;
  time: string;
  avatarBg: string;
  initials: string;
}

export interface SidebarStaffItemDTO {
  id: string;
  name: string;
  roleLabel: string;
  status: "online" | "offline" | "busy";
  avatarBg: string;
  initials: string;
}

export interface ManagerialDashboardDataDTO {
  timeFilter: AnalyticsTimeFilter;
  selectedYear?: number;
  selectedMonth?: number | null;
  availableYears?: number[];
  periodLabel: string;
  comparisonLabel: string;
  canViewFinancials: boolean;
  summary: {
    totalRevenue: number;
    previousRevenue: number;
    totalProfit: number;
    previousProfit: number;
    marginPercent: number;
    totalTransactions: number;
    averageTicket: number;
    previousAverageTicket: number;
    webOrdersCount: number;
    pendingWebOrdersCount: number;
    storeSalesCount: number;
    totalUnitsSold: number;
    itemsWithoutCostCount: number;
  };
  kpis: DashboardKpiCardDTO[];
  chartSeries: EarningsChartPointDTO[];
  topProducts: TopProductRankingDTO[];
  paymentChannels: PaymentChannelMatrixItemDTO[];
  disciplineSales: DisciplineSalesBarDTO[];
  logisticsDistribution: LogisticsDistributionSliceDTO[];
  operationalStatus: OperationalStatusCardDTO;
  sidebar: {
    notifications: SidebarAlertItemDTO[];
    activities: SidebarActivityItemDTO[];
    staff: SidebarStaffItemDTO[];
  };
}
