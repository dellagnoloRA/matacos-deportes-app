import { Metadata } from "next";
import { EcommerceHomeView } from "@/components/ecommerce/EcommerceHomeView";
import { getPublicCatalog } from "@/server/actions/ecommerce/catalogActions";
import { mapPublicProductToEcommerce } from "@/lib/ecommerceProductMapper";

export const metadata: Metadata = {
  title: "Matacos Deportes — Tienda Oficial | Saavedra 241, Formosa",
  description:
    "Equipamiento deportivo, calzado, indumentaria y natación. Envíos a todo el país y 3 y 6 cuotas sin interés en Matacos Deportes.",
};

// Revalidar el catálogo público cada 60 segundos
export const revalidate = 60;

export default async function HomePage() {
  let initialProducts = undefined;

  try {
    const res = await getPublicCatalog({ limit: 16, sort: "newest" });
    if (res.success && res.data?.products && res.data.products.length > 0) {
      initialProducts = res.data.products.map(mapPublicProductToEcommerce);
    }
  } catch (err) {
    console.error("Error cargando productos iniciales de catálogo:", err);
  }

  return <EcommerceHomeView initialProducts={initialProducts} />;
}
