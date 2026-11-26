import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTaxonomies } from "@/server/actions/taxonomyActions";
import { getSizeGuides } from "@/server/actions/sizeGuideActions";
import { getCareGuides } from "@/server/actions/careGuideActions";
import { getProductForWizardEdit } from "@/server/actions/productDraftActions";
import { ProductCreateWizard } from "@/components/admin/ProductCreateWizard/ProductCreateWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar Ficha Web — Matacos Deportes Back Office",
  description: "Edición integral de ficha técnica, descripción, guía de talles y cuidados",
};

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditarProductoPage({ params }: EditPageProps) {
  const { id } = await params;

  const [taxonomiesRes, sizeGuidesRes, careGuidesRes, productRes] = await Promise.all([
    getTaxonomies(),
    getSizeGuides(),
    getCareGuides(),
    getProductForWizardEdit(id),
  ]);

  if (!productRes.success || !productRes.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
          <h1 className="text-lg font-extrabold text-slate-950">Producto no encontrado</h1>
          <p className="text-xs text-slate-500">
            {productRes.error || "No se pudo cargar la ficha del producto solicitado."}
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inventario</span>
          </Link>
        </div>
      </div>
    );
  }

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
      editProductId={id}
      initialEditForm={productRes.data}
    />
  );
}
