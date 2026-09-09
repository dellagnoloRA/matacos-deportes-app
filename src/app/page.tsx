import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDetailedInventoryProducts } from "@/server/actions/productActions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const res = await getDetailedInventoryProducts();
  const initialProducts = res.success ? res.data : undefined;
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#06241d] flex items-center justify-center text-emerald-400 font-bold">Cargando Matacos...</div>}>
      <DashboardView initialProducts={initialProducts} />
    </Suspense>
  );
}
