import { Metadata } from "next";
import { EcommerceHomeView } from "@/components/ecommerce/EcommerceHomeView";

export const metadata: Metadata = {
  title: "Matacos Deportes — Tienda Oficial | Saavedra 241, Formosa",
  description:
    "Equipamiento deportivo, calzado, indumentaria y outdoor. Envíos a todo el país y 3 y 6 cuotas sin interés en Matacos Deportes.",
};

export default function HomePage() {
  return <EcommerceHomeView />;
}
