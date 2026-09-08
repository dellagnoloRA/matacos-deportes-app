import { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDetailedInventoryProducts } from "@/server/actions/productActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Back Office & Analíticas — Matacos Deportes",
  description: "Panel de control general y analíticas de ventas y rendimiento para Matacos Deportes",
};

export default async function AdminDashboardPage() {
  const res = await getDetailedInventoryProducts();
  const initialProducts = res.success ? res.data : undefined;
  return <DashboardView initialProducts={initialProducts} />;
}
