import { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Back Office & Analíticas — Matacos Deportes",
  description: "Panel de control general y analíticas de ventas y rendimiento para Matacos Deportes",
};

export default function AdminDashboardPage() {
  return <DashboardView />;
}
