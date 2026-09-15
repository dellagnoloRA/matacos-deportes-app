import { Suspense } from "react";
import { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDetailedInventoryProducts } from "@/server/actions/productActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sistema Matacos — Analíticas y Control",
  description: "Panel de control general y analíticas de ventas y rendimiento para Matacos Deportes",
};

export default async function AdminDashboardPage() {
  const res = await getDetailedInventoryProducts();
  const initialProducts = res.success ? res.data : undefined;
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#06241d] flex items-center justify-center text-emerald-400 font-bold">Cargando Matacos...</div>}>
      <DashboardView initialProducts={initialProducts} />
    </Suspense>
  );
}
