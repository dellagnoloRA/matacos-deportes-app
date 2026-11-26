import { Metadata } from "next";
import { getTaxonomies } from "@/server/actions/taxonomyActions";
import { getSizeGuides } from "@/server/actions/sizeGuideActions";
import { getCareGuides } from "@/server/actions/careGuideActions";
import { ProductCreateWizard } from "@/components/admin/ProductCreateWizard/ProductCreateWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuevo Producto — Matacos Deportes Back Office",
  description: "Alta interactiva de productos con plantilla en vivo y sincronización de stock",
};

export default async function AdminNuevoProductoPage() {
  const [taxonomiesRes, sizeGuidesRes, careGuidesRes] = await Promise.all([
    getTaxonomies(),
    getSizeGuides(),
    getCareGuides(),
  ]);

  const initialTaxonomies =
    taxonomiesRes.success && taxonomiesRes.data
      ? taxonomiesRes.data
      : { brands: [], categories: [], disciplines: [] };

  const initialSizeGuides =
    sizeGuidesRes.success && sizeGuidesRes.data ? sizeGuidesRes.data : [];

  const initialCareGuides =
    careGuidesRes.success && careGuidesRes.data ? careGuidesRes.data : [];

  return (
    <ProductCreateWizard
      initialTaxonomies={initialTaxonomies}
      initialSizeGuides={initialSizeGuides}
      initialCareGuides={initialCareGuides}
    />
  );
}
