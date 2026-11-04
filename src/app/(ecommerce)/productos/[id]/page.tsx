import { Metadata } from "next";
import Link from "next/link";
import { getProductDetail, getRelatedProducts } from "@/server/actions/ecommerce/productDetailActions";
import { ProductDetailView } from "@/components/ecommerce/pdp/ProductDetailView";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { ShoppingBag, ArrowLeft } from "lucide-react";

// Revalidar cada 30 segundos
export const revalidate = 30;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await getProductDetail(id);
    if (!res.success || !res.data) {
      return {
        title: "Producto no encontrado • Matacos Deportes",
      };
    }
    return {
      title: `${res.data.name} • ${res.data.brand.name} | Matacos Deportes`,
      description:
        res.data.description ||
        `Comprá ${res.data.name} en Matacos Deportes (Saavedra 241, Formosa). Envíos a toda Argentina y cuotas sin interés.`,
    };
  } catch {
    return {
      title: "Matacos Deportes — Tienda Oficial",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  try {
    const [detailRes, relatedRes] = await Promise.all([
      getProductDetail(id),
      getRelatedProducts(id, 4),
    ]);

    if (!detailRes.success || !detailRes.data) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <EcommerceHeader />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-black text-slate-900">
                Producto no disponible
              </h1>
              <p className="text-xs text-slate-500">
                El producto solicitado no existe o ya no se encuentra activo en nuestro catálogo.
              </p>
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Catálogo</span>
              </Link>
            </div>
          </main>
          <EcommerceFooter />
        </div>
      );
    }

    const product = detailRes.data;
    const relatedProducts = relatedRes.success && relatedRes.data ? relatedRes.data : [];

    return (
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
      />
    );
  } catch (error) {
    console.error("Error al cargar detalle del producto:", error);
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <EcommerceHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h1 className="text-xl font-black text-slate-900">
              Ocurrió un error al cargar el producto
            </h1>
            <p className="text-xs text-slate-500">
              Por favor intentá nuevamente más tarde o comunicate con nosotros.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Catálogo</span>
            </Link>
          </div>
        </main>
        <EcommerceFooter />
      </div>
    );
  }
}
