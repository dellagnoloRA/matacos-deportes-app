import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Finalizar Compra — Matacos Deportes",
  description:
    "Completá tus datos de entrega y pagá con Mercado Pago de forma segura en Saavedra 241, Formosa.",
};

export default async function CheckoutPage() {
  // Cargar variantes activas con stock para visualización y pruebas inmediatas
  const rawVariants = await prisma.productVariant.findMany({
    where: {
      stockStore: { gt: 0 },
      product: { active: true },
    },
    take: 5,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
    },
    orderBy: {
      stockStore: "desc",
    },
  });

  const availableVariants = rawVariants.map((v) => ({
    id: v.id,
    name: v.product.name,
    size: v.size,
    color: v.color,
    price: Number(v.price !== null ? v.price : v.product.price),
    stock: v.stockStore,
  }));

  return <CheckoutClient availableVariants={availableVariants} />;
}
