import { Metadata } from "next";
import { EcommerceHomeView } from "@/components/ecommerce/EcommerceHomeView";
import { getLandingPageData } from "@/server/actions/ecommerce/landingActions";
import { mapPublicProductToEcommerce } from "@/lib/ecommerceProductMapper";
import type { EcommerceProduct } from "@/components/ecommerce/types";
import type { SerializedBanner } from "@/server/services/bannerService";

export const metadata: Metadata = {
  title: "Matacos Deportes — Tienda Oficial | Saavedra 241, Formosa",
  description:
    "Equipamiento deportivo, calzado, indumentaria y natación. Envíos a todo el país y 3 y 6 cuotas sin interés en Matacos Deportes.",
};

// Política ISR sincronizada con TTL de getLandingPageData (300 segundos / RF-28)
export const revalidate = 300;

export default async function HomePage() {
  let initialProducts: EcommerceProduct[] | undefined = undefined;
  let banners: SerializedBanner[] | undefined = undefined;

  try {
    const res = await getLandingPageData();
    if (res.success && res.data) {
      banners = res.data.banners;

      const combinedMap = new Map<string, EcommerceProduct>();
      const orderedItems = [
        ...res.data.promoProducts,
        ...res.data.bestSellers,
        ...res.data.newArrivals,
      ];

      for (const item of orderedItems) {
        if (!combinedMap.has(item.id)) {
          combinedMap.set(item.id, mapPublicProductToEcommerce(item));
        }
      }

      if (combinedMap.size > 0) {
        initialProducts = Array.from(combinedMap.values());
      }
    }
  } catch (err) {
    console.error("Error cargando datos de la Landing Page (RF-28):", err);
  }

  return (
    <EcommerceHomeView initialProducts={initialProducts} banners={banners} />
  );
}
