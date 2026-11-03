import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/ecommerce/ProductDetailView";
import { getProductById, getProducts } from "@/server/actions/productActions";
import {
  mapPrismaProductToEcommerceProduct,
  MOCK_FEATURED_PRODUCTS,
} from "@/components/ecommerce/mockData";
import { EcommerceProduct } from "@/components/ecommerce/types";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Producto especial de referencia exacta de la captura (Puma Scend Pro 3 Mujer)
const PUMA_SCEND_PRO_SAMPLE: EcommerceProduct = {
  id: "zapatillas-running-puma-scend-pro-3-mujer",
  name: "Zapatillas Running Puma Scend Pro 3 Mujer",
  brand: "Puma",
  category: "Calzado",
  discipline: "Running",
  price: 109999,
  isOffer: false,
  image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
  images: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=85",
  ],
  description:
    "Las Zapatillas Puma Scend Pro 3 para mujer combinan ligereza, máxima amortiguación con tecnología PROFOAM LITE y una capellada de malla transpirable con refuerzos estratégicos para brindarte tracción y confort inigualable en tus salidas de running.",
  installments: "2 y 3 cuotas sin interés",
  sizes: [
    { size: "34.5", inStock: true },
    { size: "35", inStock: false },
    { size: "36", inStock: true },
    { size: "36.5", inStock: true },
    { size: "37", inStock: true },
    { size: "37.5", inStock: true },
    { size: "38", inStock: true },
    { size: "39", inStock: true },
    { size: "39.5", inStock: true },
    { size: "40", inStock: false },
    { size: "41", inStock: false },
    { size: "41.5", inStock: false },
  ],
  colors: ["Negro / Rosa", "Blanco"],
  gender: "Mujer",
  inStock: true,
  stockCount: 8,
  freeShipping: true,
  storePickup: true,
  rating: 4.9,
};

// Producto especial de referencia PUMA HYROX del usuario
const PUMA_HYROX_SAMPLE: EcommerceProduct = {
  id: "zapatillas-puma-hyrox-deviate-nitro-elite-4",
  name: "Zapatillas PUMA x HYROX Deviate NITRO™ Elite 4 para hombre",
  brand: "PUMA",
  category: "Calzado",
  discipline: "Running / Fitness & Training",
  price: 399999,
  isOffer: false,
  isNew: true,
  image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
  images: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=85",
  ],
  description:
    "PUMA x HYROX ofrece diseños de alto rendimiento creados especialmente para la carrera de fitness más intensa. Llegá a la meta el día de la competencia con amortiguación NITROFOAM™ Elite optimizada, placa de propulsión PWRPLATE y suela PUMAGRIP para máxima tracción multisuperficie.",
  installments: "Hasta 6 Cuotas Sin Interés",
  sizes: [
    { size: "38", inStock: true },
    { size: "39", inStock: true },
    { size: "39.5", inStock: true },
    { size: "40", inStock: true },
    { size: "41", inStock: true },
    { size: "41.5", inStock: true },
    { size: "42", inStock: true },
    { size: "43", inStock: true },
    { size: "43.5", inStock: true },
    { size: "44", inStock: true },
    { size: "45", inStock: true },
    { size: "45.5", inStock: false },
    { size: "46", inStock: false },
    { size: "47.5", inStock: false },
  ],
  colors: ["Intense Mint-Light Lavender"],
  gender: "Hombre",
  inStock: true,
  stockCount: 5,
  freeShipping: true,
  storePickup: true,
  rating: 5.0,
};

// Producto especial de referencia Touché Sport (Top Seamless)
const TOUCHE_SEAMLESS_SAMPLE: EcommerceProduct = {
  id: "force-black-top-seamless",
  name: "Top Seamless Force Black",
  brand: "MATACOS SPORT",
  category: "Indumentaria",
  discipline: "Fitness & Training",
  price: 55990,
  originalPrice: 68000,
  isOffer: true,
  offerTag: "18% OFF",
  discountPercent: 18,
  image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
  images: [
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
  ],
  description:
    "Top confeccionado en tejido suave y elastizado con tecnología seamless sin costuras, con un diseño femenino que se adapta al cuerpo. Presenta escote en V con frunce central que realza el busto. Sus tirantes finos se atan alrededor del cuello, dejando la espalda descubierta para un look moderno, seguro y sensual.",
  installments: "3 y 6 cuotas sin interés",
  sizes: [
    { size: "XS", inStock: true },
    { size: "S", inStock: true },
    { size: "M", inStock: true },
    { size: "L", inStock: true },
    { size: "XL", inStock: false },
  ],
  colors: ["Negro", "Grafito", "Verde Oliva", "Azul Marino"],
  gender: "Mujer",
  inStock: true,
  stockCount: 3,
  freeShipping: true,
  storePickup: true,
  cashTransferDiscountPercent: 10,
  isNew: true,
  rating: 5.0,
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  let product: EcommerceProduct | undefined;

  // 1. Buscar en BD
  try {
    const res = await getProductById(id);
    if (res.success && res.data) {
      product = mapPrismaProductToEcommerceProduct(res.data);
    }
  } catch {
    // Silently proceed to mock check
  }

  // 2. Si no está en BD, buscar en Mock data o referencias
  if (!product) {
    if (id.includes("scend") || id === "zapatillas-running-puma-scend-pro-3-mujer") {
      product = PUMA_SCEND_PRO_SAMPLE;
    } else if (id.includes("puma") || id.includes("hyrox") || id === "zapatillas-puma-hyrox-deviate-nitro-elite-4") {
      product = PUMA_HYROX_SAMPLE;
    } else if (id === "force-black-top-seamless" || id.includes("seamless")) {
      product = TOUCHE_SEAMLESS_SAMPLE;
    } else {
      product = MOCK_FEATURED_PRODUCTS.find((p) => p.id === id);
    }
  }

  if (!product) {
    return {
      title: "Producto — Matacos Deportes | Saavedra 241, Formosa",
      description: "Consultá la disponibilidad de indumentaria y calzado en Matacos Deportes.",
    };
  }

  return {
    title: `${product.name} — ${product.brand} | Matacos Deportes Formosa`,
    description:
      product.description ||
      `Comprá ${product.name} en Matacos Deportes. 3 y 6 cuotas sin interés, envíos a todo el país y retiro gratis en Saavedra 241, Formosa Capital.`,
    openGraph: {
      title: `${product.name} — Matacos Deportes`,
      description: `3 y 6 cuotas sin interés. Retiro en Saavedra 241, Formosa.`,
      images: [
        {
          url: product.image,
          width: 800,
          height: 1000,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;

  let product: EcommerceProduct | undefined;
  let allCatalogProducts: EcommerceProduct[] = [];

  // 1. Obtener producto de PostgreSQL / Prisma
  try {
    const [productRes, catalogRes] = await Promise.all([
      getProductById(id),
      getProducts({ activeOnly: true }),
    ]);

    if (productRes.success && productRes.data) {
      product = mapPrismaProductToEcommerceProduct(productRes.data);
    }

    if (catalogRes.success && catalogRes.data) {
      allCatalogProducts = catalogRes.data.map(mapPrismaProductToEcommerceProduct);
    }
  } catch (err) {
    console.error("Error al consultar producto en BD:", err);
  }

  // 2. Fallbacks de mocks si el ID pertenece a los mock data o muestra Puma / Touché
  if (!product) {
    if (id.includes("scend") || id === "zapatillas-running-puma-scend-pro-3-mujer") {
      product = PUMA_SCEND_PRO_SAMPLE;
    } else if (id.includes("puma") || id.includes("hyrox") || id === "zapatillas-puma-hyrox-deviate-nitro-elite-4") {
      product = PUMA_HYROX_SAMPLE;
    } else if (id === "force-black-top-seamless" || id.includes("seamless")) {
      product = TOUCHE_SEAMLESS_SAMPLE;
    } else {
      product = MOCK_FEATURED_PRODUCTS.find((p) => p.id === id);
    }
  }

  // Si no se encuentra el producto ni en BD ni en mocks, retornar 404
  if (!product) {
    notFound();
  }

  // 3. Productos recomendados ("Completá tu look")
  const pool = allCatalogProducts.length > 0 ? allCatalogProducts : MOCK_FEATURED_PRODUCTS;
  const relatedProducts = pool
    .filter((p) => p.id !== product!.id)
    .sort((a, b) => {
      // Priorizar misma categoría o disciplina
      const aMatches = a.category === product!.category || a.discipline === product!.discipline;
      const bMatches = b.category === product!.category || b.discipline === product!.discipline;
      return (bMatches ? 1 : 0) - (aMatches ? 1 : 0);
    })
    .slice(0, 4);

  return (
    <ProductDetailView
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
