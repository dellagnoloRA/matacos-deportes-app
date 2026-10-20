import { Metadata } from "next";
import { Suspense } from "react";
import { ProductCatalogView } from "@/components/ecommerce/ProductCatalogView";
import { getProducts } from "@/server/actions/productActions";
import { mapPrismaProductToEcommerceProduct } from "@/components/ecommerce/mockData";
import { EcommerceProduct } from "@/components/ecommerce/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo Completo de Productos — Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Consultá todo nuestro catálogo de productos disponible en el salón de ventas y depósito. Saavedra 241, Formosa Capital.",
};

interface ProductosPageProps {
  searchParams?: Promise<{
    categoria?: string;
    disciplina?: string;
    q?: string;
  }>;
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { categoria, disciplina } = resolvedParams;

  let products: EcommerceProduct[] = [];

  try {
    const res = await getProducts({ activeOnly: true });
    if (res.success && res.data) {
      // Usar ÚNICAMENTE los productos reales persistidos en la base de datos
      products = res.data.map(mapPrismaProductToEcommerceProduct);
    }
  } catch (error) {
    console.error("Error cargando productos de BD en /productos:", error);
    products = [];
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-800">
            Cargando catálogo de Matacos Deportes...
          </span>
        </div>
      }
    >
      <ProductCatalogView
        initialProducts={products}
        initialCategory={categoria}
        initialDiscipline={disciplina}
      />
    </Suspense>
  );
}
