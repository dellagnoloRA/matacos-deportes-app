import { Metadata } from "next";
import Link from "next/link";
import {
  getProductDetail,
  getRelatedProducts,
} from "@/server/actions/ecommerce/productDetailActions";
import { ProductDetailView } from "@/components/ecommerce/pdp/ProductDetailView";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import type { PublicProductDetail } from "@/types/ecommerce";

// Revalidar cada 30 segundos
export const revalidate = 30;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Producto especial de referencia exacta de la captura (Puma Scend Pro 3 Mujer)
const PUMA_SCEND_PRO_SAMPLE: PublicProductDetail = {
  id: "zapatillas-running-puma-scend-pro-3-mujer",
  name: "Zapatillas Running Puma Scend Pro 3 Mujer",
  description:
    "Las Zapatillas Puma Scend Pro 3 para mujer combinan ligereza, máxima amortiguación con tecnología PROFOAM LITE y una capellada de malla transpirable con refuerzos estratégicos para brindarte tracción y confort inigualable en tus salidas de running.",
  imageUrl:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
  modelCode: "PU314415",
  price: 109999,
  gender: "MUJER",
  category: { id: "cat-calzado", name: "Calzado", slug: "calzado" },
  brand: { id: "brand-puma", name: "Puma", slug: "puma" },
  discipline: { id: "disc-running", name: "Running", slug: "running" },
  images: [
    {
      id: "img-1",
      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
      color: "Negro",
      isPrimary: true,
      order: 0,
    },
    {
      id: "img-2",
      url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85",
      color: "Blanco",
      isPrimary: false,
      order: 1,
    },
    {
      id: "img-3",
      url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=85",
      color: null,
      isPrimary: false,
      order: 2,
    },
    {
      id: "img-4",
      url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=85",
      color: null,
      isPrimary: false,
      order: 3,
    },
  ],
  variants: [
    {
      id: "v-35",
      size: "35",
      color: "Negro",
      sku: "PU314415-35-NR",
      barcode: null,
      price: 109999,
      originalPrice: null,
      availableStock: 0,
      inStock: false,
    },
    {
      id: "v-36",
      size: "36",
      color: "Negro",
      sku: "PU314415-36-NR",
      barcode: null,
      price: 109999,
      originalPrice: null,
      availableStock: 4,
      inStock: true,
    },
    {
      id: "v-37",
      size: "37",
      color: "Negro",
      sku: "PU314415-37-NR",
      barcode: null,
      price: 109999,
      originalPrice: null,
      availableStock: 2,
      inStock: true,
    },
    {
      id: "v-38",
      size: "38",
      color: "Negro",
      sku: "PU314415-38-NR",
      barcode: null,
      price: 109999,
      originalPrice: null,
      availableStock: 3,
      inStock: true,
    },
    {
      id: "v-39",
      size: "39",
      color: "Negro",
      sku: "PU314415-39-NR",
      barcode: null,
      price: 109999,
      originalPrice: null,
      availableStock: 1,
      inStock: true,
    },
    {
      id: "v-40",
      size: "40",
      color: "Negro",
      sku: "PU314415-40-NR",
      barcode: null,
      price: 109999,
      originalPrice: null,
      availableStock: 0,
      inStock: false,
    },
  ],
  colorOptions: [
    {
      color: "Negro",
      inStock: true,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
    },
    {
      color: "Blanco",
      inStock: true,
      imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85",
    },
  ],
  sizeOptions: [
    { size: "35", inStock: false, availableStock: 0 },
    { size: "36", inStock: true, availableStock: 4 },
    { size: "37", inStock: true, availableStock: 2 },
    { size: "38", inStock: true, availableStock: 3 },
    { size: "39", inStock: true, availableStock: 1 },
    { size: "40", inStock: false, availableStock: 0 },
  ],
  totalAvailableStock: 10,
  hasStock: true,
  minPrice: 109999,
  maxPrice: 109999,
  isLowStock: false,
  stockStatus: "IN_STOCK",
  createdAt: new Date().toISOString(),
};

// Producto especial de referencia PUMA HYROX
const PUMA_HYROX_SAMPLE: PublicProductDetail = {
  id: "zapatillas-puma-hyrox-deviate-nitro-elite-4",
  name: "Zapatillas PUMA x HYROX Deviate NITRO™ Elite 4 para hombre",
  description:
    "PUMA x HYROX ofrece diseños de alto rendimiento creados especialmente para la carrera de fitness más intensa. Llegá a la meta el día de la competencia con amortiguación NITROFOAM™ Elite optimizada, placa de propulsión PWRPLATE y suela PUMAGRIP para máxima tracción multisuperficie.",
  imageUrl:
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85",
  modelCode: "HYR-4001",
  price: 399999,
  gender: "HOMBRE",
  category: { id: "cat-calzado", name: "Calzado", slug: "calzado" },
  brand: { id: "brand-puma", name: "PUMA", slug: "puma" },
  discipline: { id: "disc-running", name: "Running / Fitness", slug: "running" },
  images: [
    {
      id: "img-h1",
      url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85",
      color: "Menta",
      isPrimary: true,
      order: 0,
    },
    {
      id: "img-h2",
      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
      color: "Negro",
      isPrimary: false,
      order: 1,
    },
  ],
  variants: [
    {
      id: "vh-40",
      size: "40",
      color: "Menta",
      sku: "HYR4001-40-MNT",
      barcode: null,
      price: 399999,
      originalPrice: null,
      availableStock: 2,
      inStock: true,
    },
    {
      id: "vh-41",
      size: "41",
      color: "Menta",
      sku: "HYR4001-41-MNT",
      barcode: null,
      price: 399999,
      originalPrice: null,
      availableStock: 3,
      inStock: true,
    },
    {
      id: "vh-42",
      size: "42",
      color: "Menta",
      sku: "HYR4001-42-MNT",
      barcode: null,
      price: 399999,
      originalPrice: null,
      availableStock: 1,
      inStock: true,
    },
  ],
  colorOptions: [
    { color: "Menta", inStock: true, imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85" },
    { color: "Negro", inStock: true, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85" },
  ],
  sizeOptions: [
    { size: "40", inStock: true, availableStock: 2 },
    { size: "41", inStock: true, availableStock: 3 },
    { size: "42", inStock: true, availableStock: 1 },
    { size: "43", inStock: false, availableStock: 0 },
  ],
  totalAvailableStock: 6,
  hasStock: true,
  minPrice: 399999,
  maxPrice: 399999,
  isLowStock: false,
  stockStatus: "IN_STOCK",
  createdAt: new Date().toISOString(),
};

// Producto especial de referencia Touché Sport (Top Seamless)
const TOUCHE_SEAMLESS_SAMPLE: PublicProductDetail = {
  id: "force-black-top-seamless",
  name: "Top Seamless Force Black",
  description:
    "Top confeccionado en tejido suave y elastizado con tecnología seamless sin costuras, con un diseño femenino que se adapta al cuerpo. Presenta escote en V con frunce central que realza el busto. Sus tirantes finos se atan alrededor del cuello, dejando la espalda descubierta para un look moderno, seguro y sensual.",
  imageUrl:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
  modelCode: "TOP-FORCE-01",
  price: 55990,
  originalPrice: 68000,
  discountActive: true,
  discountPercentage: 18,
  gender: "MUJER",
  category: { id: "cat-indumentaria", name: "Indumentaria", slug: "indumentaria" },
  brand: { id: "brand-matacos", name: "MATACOS SPORT", slug: "matacos-sport" },
  discipline: { id: "disc-fitness", name: "Fitness & Training", slug: "fitness" },
  images: [
    {
      id: "img-t1",
      url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
      color: "Negro",
      isPrimary: true,
      order: 0,
    },
    {
      id: "img-t2",
      url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=85",
      color: "Grafito",
      isPrimary: false,
      order: 1,
    },
    {
      id: "img-t3",
      url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85",
      color: "Oliva",
      isPrimary: false,
      order: 2,
    },
  ],
  variants: [
    {
      id: "vt-s",
      size: "S",
      color: "Negro",
      sku: "TOP01-S-BLK",
      barcode: null,
      price: 55990,
      originalPrice: 68000,
      availableStock: 3,
      inStock: true,
    },
    {
      id: "vt-m",
      size: "M",
      color: "Negro",
      sku: "TOP01-M-BLK",
      barcode: null,
      price: 55990,
      originalPrice: 68000,
      availableStock: 2,
      inStock: true,
    },
    {
      id: "vt-l",
      size: "L",
      color: "Negro",
      sku: "TOP01-L-BLK",
      barcode: null,
      price: 55990,
      originalPrice: 68000,
      availableStock: 0,
      inStock: false,
    },
  ],
  colorOptions: [
    { color: "Negro", inStock: true, imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85" },
    { color: "Grafito", inStock: true, imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=85" },
    { color: "Oliva", inStock: true, imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85" },
  ],
  sizeOptions: [
    { size: "S", inStock: true, availableStock: 3 },
    { size: "M", inStock: true, availableStock: 2 },
    { size: "L", inStock: false, availableStock: 0 },
  ],
  totalAvailableStock: 5,
  hasStock: true,
  minPrice: 55990,
  maxPrice: 68000,
  isLowStock: false,
  stockStatus: "IN_STOCK",
  createdAt: new Date().toISOString(),
};

function resolveSampleProduct(id: string): PublicProductDetail | null {
  if (id.includes("scend") || id === "zapatillas-running-puma-scend-pro-3-mujer") {
    return PUMA_SCEND_PRO_SAMPLE;
  }
  if (id.includes("hyrox") || id === "zapatillas-puma-hyrox-deviate-nitro-elite-4") {
    return PUMA_HYROX_SAMPLE;
  }
  if (id.includes("seamless") || id === "force-black-top-seamless") {
    return TOUCHE_SEAMLESS_SAMPLE;
  }
  return null;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    let product: PublicProductDetail | null = null;
    const res = await getProductDetail(id);
    if (res.success && res.data) {
      product = res.data;
    } else {
      product = resolveSampleProduct(id);
    }

    if (!product) {
      return {
        title: "Producto no encontrado • Matacos Deportes",
      };
    }

    return {
      title: `${product.name} • ${product.brand.name} | Matacos Deportes`,
      description:
        product.description ||
        `Comprá ${product.name} en Matacos Deportes (Saavedra 241, Formosa). Envíos a toda Argentina y cuotas sin interés.`,
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

    let product: PublicProductDetail | null = null;

    if (detailRes.success && detailRes.data) {
      product = detailRes.data;
    } else {
      // Fallback a productos de muestra de la maqueta
      product = resolveSampleProduct(id);
    }

    if (!product) {
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

    const relatedProducts =
      relatedRes.success && relatedRes.data ? relatedRes.data : [];

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
