import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDetailedInventoryProducts } from "@/server/actions/productActions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const res = await getDetailedInventoryProducts();
  const initialProducts = res.success ? res.data : undefined;
  return <DashboardView initialProducts={initialProducts} />;
}
