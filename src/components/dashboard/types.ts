export interface KpiData {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  isFeatured?: boolean;
}

export interface ChartDataPoint {
  month: string;
  currentYear: number;
  lastYear: number;
}

export interface SalesChannelItem {
  id: string;
  name: string;
  level: number; // 1 to 5
}

export interface TrafficSource {
  source: string;
  visits: number;
  label: string;
  barColor: string;
}

export interface ProvinceTraffic {
  province: string;
  percentage: number;
  color: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  iconType: "bug" | "user" | "subscribe";
}

export interface ActivityItem {
  id: string;
  action: string;
  time: string;
  avatarBg: string;
  initials: string;
}

export interface ProviderContact {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  avatarBg: string;
  avatarImg?: string;
  initials: string;
}
