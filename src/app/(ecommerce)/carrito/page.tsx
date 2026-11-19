import { Metadata } from "next";
import { CartView } from "@/components/ecommerce/cart/CartView";

export const metadata: Metadata = {
  title: "Mi Carrito • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Revisá los productos y accesorios de tu carrito de compras antes de finalizar tu pedido en Matacos Deportes.",
};

export default function CarritoPage() {
  return <CartView />;
}
