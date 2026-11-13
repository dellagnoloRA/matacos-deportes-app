"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { SizeGuideModal } from "./SizeGuideModal";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { getActiveInstallmentPlans } from "@/server/actions/installmentActions";
import type { SerializedInstallmentPlan } from "@/server/services/installmentService";
import {
  calculateInstallmentPlanAmounts,
  DEFAULT_MATACOS_INSTALLMENT_PLANS,
} from "@/schemas/installment";
import type {
  PublicProductDetail,
  PublicProductItem,
  PublicVariantItem,
} from "@/types/ecommerce";
import {
  Truck,
  Store,
  ChevronDown,
  Ruler,
  Check,
  ZoomIn,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ShoppingBag,
  Zap,
  ChevronRight,
  X,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";

// =============================================================================
// ICONOS VECTORIALES ESTÁNDAR TEXTILES DE LAVADO Y CUIDADO
// =============================================================================
function BleachNoIcon() {
  return (
    <svg
      className="w-5 h-5 shrink-0 text-slate-800"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 3L2 21h20L12 3z" />
      <path d="M8 11l8 8M16 11l-8 8" />
    </svg>
  );
}

function TumbleDryLowIcon() {
  return (
    <svg
      className="w-5 h-5 shrink-0 text-slate-800"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function DryCleanNoIcon() {
  return (
    <svg
      className="w-5 h-5 shrink-0 text-slate-800"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
    </svg>
  );
}

function IronLowIcon() {
  return (
    <svg
      className="w-5 h-5 shrink-0 text-slate-800"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3 18h18l-3-8H8a5 5 0 0 0-5 5v3z" />
      <path d="M6 10V7a3 3 0 0 1 3-3h8" />
      <circle cx="10" cy="14" r="1.2" fill="currentColor" />
    </svg>
  );
}

function Wash30ColdIcon() {
  return (
    <svg
      className="w-5 h-5 shrink-0 text-slate-800"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3 7h18l-2 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L3 7z" />
      <path d="M3 12c2.5-1 4.5 1 7 0s4.5-1 7 0 2.5 1 4 0" />
      <text
        x="12"
        y="17.5"
        fontSize="7"
        fontWeight="bold"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
      >
        30°
      </text>
    </svg>
  );
}

// Logo SVG bicolor oficial de Mastercard
function MastercardLogoSvg() {
  return (
    <svg className="h-3 w-auto" viewBox="0 0 24 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="7.5" fill="#EB001B" />
      <circle cx="16.5" cy="7.5" r="7.5" fill="#F79E1B" />
      <path d="M12 2.2a7.5 7.5 0 0 0 0 10.6 7.5 7.5 0 0 0 0-10.6z" fill="#FF5F00" />
    </svg>
  );
}

// Mapeo exhaustivo de nombres de color a tonos hexadecimales
const COLOR_HEX_MAP: Record<string, string> = {
  beige: "#E8D8C8",
  negro: "#111827",
  black: "#111827",
  blanco: "#FFFFFF",
  white: "#FFFFFF",
  marino: "#1E3A8A",
  azul: "#2563EB",
  "azul/rojo": "#1E3A8A",
  navy: "#1E3A8A",
  "azul marino": "#1E3A8A",
  "verde militar": "#3F6212",
  "rosa pastel": "#FBCFE8",
  hueso: "#F5F5DC",
  gris: "#64748B",
  grafito: "#334155",
  verde: "#16A34A",
  oliva: "#4D7C0F",
  militar: "#3F6212",
  marrón: "#78350F",
  marron: "#78350F",
  rosa: "#F472B6",
  violeta: "#8B5CF6",
  morado: "#581C87",
  rojo: "#DC2626",
  amarillo: "#EAB308",
  naranja: "#EA580C",
  lavanda: "#C4B5FD",
  menta: "#6EE7B7",
  celeste: "#38BDF8",
};

function getColorHex(colorName: string): string {
  const norm = colorName.trim().toLowerCase();
  return COLOR_HEX_MAP[norm] || "#64748B";
}

interface ProductDetailViewProps {
  product: PublicProductDetail;
  relatedProducts: PublicProductItem[];
}

export function ProductDetailView({
  product,
  relatedProducts,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem, openDrawer } = useCartStore();

  // 1. Selector de Color
  const initialColor =
    product.colorOptions[0]?.color ||
    product.variants[0]?.color ||
    "Único";
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);

  // 2. Selector de Talle
  const initialSize =
    product.sizeOptions.find((s) => s.inStock)?.size ||
    product.sizeOptions[0]?.size ||
    product.variants.find((v) => v.inStock)?.size ||
    product.variants[0]?.size ||
    "Único";
  const [selectedSize, setSelectedSize] = useState<string>(initialSize);

  // 3. Cantidad y Estados de Interacción
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSizeGuideModalOpen, setIsSizeGuideModalOpen] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [postalCalculated, setPostalCalculated] = useState(false);

  // 4. Pestaña activa de los apartados inferiores
  const [activeTab, setActiveTab] = useState<
    "descripcion" | "cuidados" | "talles" | "valoraciones"
  >("descripcion");

  // 5. Filtros y modal de valoraciones
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [reviewSort, setReviewSort] = useState("novedades");
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Galería de fotos del producto (con fallbacks realistas si la BD tiene pocas fotos)
  const images = useMemo(() => {
    const list: string[] = [];

    // Priorizar fotos de la variante o color activo
    const byColor = product.images.filter(
      (img) => img.color && img.color.trim().toLowerCase() === selectedColor.trim().toLowerCase()
    );
    if (byColor.length > 0) {
      byColor.forEach((img) => {
        if (!list.includes(img.url)) list.push(img.url);
      });
    }

    // Luego agregar todas las fotos del producto
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (!list.includes(img.url)) list.push(img.url);
      });
    }

    if (product.imageUrl && !list.includes(product.imageUrl)) {
      list.unshift(product.imageUrl);
    }

    // Fallbacks fotográficos deportivos estándar para completar las 4 miniaturas
    const fallbackImgs = [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=85",
    ];

    let i = 0;
    while (list.length < 4) {
      list.push(fallbackImgs[i % fallbackImgs.length]);
      i++;
    }

    return list.slice(0, 4);
  }, [product.images, product.imageUrl, selectedColor]);

  // Resolver la variante activa según Color y Talle seleccionados
  const activeVariant = useMemo<PublicVariantItem | null>(() => {
    if (!product.variants || product.variants.length === 0) return null;

    // 1. Coincidencia exacta de color y talle
    const exact = product.variants.find(
      (v) =>
        v.color.trim().toLowerCase() === selectedColor.trim().toLowerCase() &&
        v.size.trim().toLowerCase() === selectedSize.trim().toLowerCase()
    );
    if (exact) return exact;

    // 2. Coincidencia por talle
    const bySize = product.variants.find(
      (v) => v.size.trim().toLowerCase() === selectedSize.trim().toLowerCase()
    );
    if (bySize) return bySize;

    // 3. Fallback a primera con stock o primera disponible
    return product.variants.find((v) => v.inStock) || product.variants[0] || null;
  }, [product.variants, selectedColor, selectedSize]);

  // Cálculos de precios, descuentos y financiación
  const effectivePrice = activeVariant?.price ? activeVariant.price : product.price;

  const originalPrice =
    activeVariant?.originalPrice && activeVariant.originalPrice > effectivePrice
      ? activeVariant.originalPrice
      : product.originalPrice && product.originalPrice > effectivePrice
      ? product.originalPrice
      : undefined;

  const isOffer = Boolean(
    product.discountActive ||
    (originalPrice && originalPrice > effectivePrice) ||
    product.maxPrice > product.price
  );

  const discountPercent =
    originalPrice && originalPrice > effectivePrice
      ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
      : product.discountPercentage || null;

  const netPrice = Math.round(effectivePrice / 1.21); // Precio sin IVA/Impuestos nacionales (21%)

  // Planes de cuotas dinámicos configurados desde Administración
  const [installmentPlans, setInstallmentPlans] = useState<SerializedInstallmentPlan[]>(() =>
    DEFAULT_MATACOS_INSTALLMENT_PLANS.map((p, idx) => ({
      id: `default-pdp-${idx}`,
      ...p,
      startDate: null,
      endDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCurrentlyVisible: true,
      validityStatus: "VIGENTE" as const,
    }))
  );

  useEffect(() => {
    let mounted = true;
    getActiveInstallmentPlans()
      .then((res) => {
        if (mounted && res.success && res.data && res.data.length > 0) {
          setInstallmentPlans(res.data);
        }
      })
      .catch(() => {
        // Mantiene fallback local
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Resumen destacado de cuotas para la píldora verde del producto
  const featuredInstallmentBadge = useMemo(() => {
    const activePlans = installmentPlans.filter((p) => p.active && p.installments > 1);
    const eligibleZeroInterest = activePlans
      .filter((p) => p.interestRate === 0 && effectivePrice >= p.minAmount)
      .sort((a, b) => {
        // Priorizar planes bancarizados generales o mayor cantidad de cuotas
        if (b.installments !== a.installments) return b.installments - a.installments;
        return a.order - b.order;
      });

    if (eligibleZeroInterest.length > 0) {
      const bancarizadaEligible = eligibleZeroInterest.find(
        (p) => p.cardGroup === "BANCARIZADAS" || p.cardGroup === "TODAS"
      );
      const naranjaMax = eligibleZeroInterest.find((p) => p.cardGroup === "NARANJA_X");

      if (bancarizadaEligible && naranjaMax && naranjaMax.installments > bancarizadaEligible.installments) {
        const calcBanc = calculateInstallmentPlanAmounts(
          effectivePrice,
          bancarizadaEligible
        );
        return `${bancarizadaEligible.installments} cuotas de ${formatCurrency(calcBanc.installmentAmount)} sin interés (o ${naranjaMax.installments} en Naranja X)`;
      }

      const best = bancarizadaEligible || eligibleZeroInterest[0];
      const calc = calculateInstallmentPlanAmounts(effectivePrice, best);
      if (best.isPlanZ) {
        return `Plan Z: ${best.installments} cuotas de ${formatCurrency(calc.installmentAmount)} cero interés con Naranja X`;
      }
      return `${best.installments} cuotas de ${formatCurrency(calc.installmentAmount)} sin interés`;
    }

    // Si por el monto del producto aún no alcanza el mínimo de bancarizadas, informar umbral
    const minBancarizadaPlan = activePlans
      .filter((p) => p.interestRate === 0 && p.minAmount > 0)
      .sort((a, b) => a.minAmount - b.minAmount)[0];

    if (minBancarizadaPlan) {
      return `${minBancarizadaPlan.installments} cuotas sin interés en compras desde ${formatCurrency(minBancarizadaPlan.minAmount)}`;
    }

    return `Cuotas sin interés con tarjetas seleccionadas`;
  }, [installmentPlans, effectivePrice]);

  const availableStock = activeVariant ? activeVariant.availableStock : product.totalAvailableStock;
  const isAvailable = activeVariant ? activeVariant.inStock && availableStock > 0 : product.hasStock;

  // Lista de opciones de color únicas
  const colorOptions = useMemo(() => {
    if (product.colorOptions && product.colorOptions.length > 0) {
      return product.colorOptions.map((co) => ({
        name: co.color,
        hex: getColorHex(co.color),
        inStock: co.inStock,
      }));
    }
    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (v.color) set.add(v.color);
    });
    const arr = Array.from(set);
    if (arr.length === 0) arr.push("Único");
    return arr.map((c) => ({
      name: c,
      hex: getColorHex(c),
      inStock: true,
    }));
  }, [product.colorOptions, product.variants]);

  // Lista de talles únicos con disponibilidad para el color actual
  const sizesList = useMemo(() => {
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      return product.sizeOptions.map((so) => {
        // Verificar si existe variante en este color y talle con stock
        const match = product.variants.find(
          (v) =>
            v.color.trim().toLowerCase() === selectedColor.trim().toLowerCase() &&
            v.size.trim().toLowerCase() === so.size.trim().toLowerCase()
        );
        const inStock = match ? match.inStock && match.availableStock > 0 : so.inStock;
        return {
          size: so.size,
          inStock,
          availableStock: match ? match.availableStock : so.availableStock,
        };
      });
    }

    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (v.size) set.add(v.size);
    });
    const arr = Array.from(set);
    if (arr.length === 0) arr.push("Único");
    return arr.map((s) => ({
      size: s,
      inStock: true,
      availableStock: 5,
    }));
  }, [product.sizeOptions, product.variants, selectedColor]);

  // Apartado de Tecnologías del Producto
  const technologiesList = useMemo(() => {
    const nameLower = (product.name || "").toLowerCase();
    const categoryLower = (product.category?.name || "").toLowerCase();
    const disciplineLower = (product.discipline?.name || "").toLowerCase();

    // Natación / Acuático
    if (
      nameLower.includes("malla") ||
      nameLower.includes("endurance") ||
      categoryLower.includes("nataci") ||
      disciplineLower.includes("nataci")
    ) {
      return [
        {
          title: "Endurance+ (Anti-cloro)",
          description:
            "Tejido técnico de polibutileno 100% resistente al cloro y a los efectos solares, garantizando máxima vida útil sin perder compresión.",
        },
        {
          title: "4-Way Stretch",
          description:
            "Elasticidad multidireccional que asegura total libertad de movimiento en el agua sin deformarse ni perder su calce ergonómico.",
        },
        {
          title: "Secado Rápido (Quick Dry)",
          description:
            "Tecnología de rápida evaporación de humedad que optimiza el confort térmico al salir de la pileta.",
        },
      ];
    }

    // Calzado / Zapatillas / Crocs
    if (
      nameLower.includes("zapatilla") ||
      nameLower.includes("clog") ||
      nameLower.includes("croc") ||
      categoryLower.includes("calzado") ||
      disciplineLower.includes("running") ||
      disciplineLower.includes("crocs")
    ) {
      return [
        {
          title: "Amortiguación Reactiva",
          description:
            "Espuma de retorno de energía continuo que absorbe el impacto articular y favorece la propulsión en cada pisada.",
        },
        {
          title: "Malla Engineered Transpirable",
          description:
            "Tejido técnico con microperforaciones estratégicas que regulan el flujo de aire y previenen la humedad interna.",
        },
        {
          title: "Suela Grippy Multisuperficie",
          description:
            "Compuesto de goma de alta resistencia al desgaste con tracción multidireccional apta para asfalto, pista y superficies lisas.",
        },
      ];
    }

    // Indumentaria general
    return [
      {
        title: "Tejido Técnico Transpirable",
        description:
          "Fibras de ventilación avanzada que absorben el sudor y lo trasladan al exterior para mantener el cuerpo seco y fresco.",
      },
      {
        title: "Costuras Planas Flatlock",
        description:
          "Costuras anatómicas ultra lisas desarrolladas para reducir la fricción con la piel y eliminar rozaduras durante el entrenamiento.",
      },
      {
        title: "Corte Ergonómico Anatómico",
        description:
          "Diseño ceñido que se adapta a la silueta corporal, reduciendo la fatiga muscular sin restringir la flexibilidad.",
      },
    ];
  }, [product.name, product.category, product.discipline]);

  // Acciones de Carrito
  const pushVariantToCart = (qty: number): boolean => {
    if (!activeVariant || activeVariant.availableStock <= 0) {
      return false;
    }

    const res = addItem({
      variantId: activeVariant.id,
      productId: product.id,
      name: product.name,
      brand: product.brand.name,
      size: activeVariant.size,
      color: activeVariant.color,
      sku: activeVariant.sku,
      price: effectivePrice,
      originalPrice,
      discountActive: isOffer,
      imageUrl: images[activeImageIndex] || product.imageUrl || "/placeholder-product.svg",
      availableStock: activeVariant.availableStock,
      quantity: qty,
    });

    return res.added;
  };

  const handleAddToCart = () => {
    if (pushVariantToCart(quantity)) {
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
      openDrawer();
    }
  };

  const handleBuyNow = () => {
    if (pushVariantToCart(quantity)) {
      router.push("/checkout");
    }
  };

  // RF-18: Enlace de consulta contextual a WhatsApp (estable para evitar errores de hidratación SSR)
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const productUrl =
    currentUrl || `https://matacosdeportes.com.ar/productos/${product.id}`;
  const waText = encodeURIComponent(
    `¡Hola Matacos Deportes! Quiero consultar por ${product.name} (Talle: ${
      selectedSize || "A consultar"
    }, Color: ${selectedColor || "A consultar"}) por ${formatCurrency(
      effectivePrice
    )}. Visto en la tienda: ${productUrl}`
  );
  const waUrl = `https://wa.me/5493704000000?text=${waText}`;

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased selection:bg-[#00D615] selection:text-slate-950">
      {/* 1. Header Oficial de Matacos Deportes */}
      <EcommerceHeader />

      {/* 2. Breadcrumbs de Navegación */}
      <nav
        aria-label="Breadcrumb"
        className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 text-xs font-medium text-slate-500"
      >
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          <Link href="/" className="hover:text-slate-950 transition-colors">
            Inicio
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/catalogo" className="hover:text-slate-950 transition-colors">
            Catálogo
          </Link>
          {product.category && (
            <>
              <span className="text-slate-300">/</span>
              <Link
                href={`/catalogo?categoria=${product.category.slug}`}
                className="hover:text-slate-950 transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </div>
      </nav>

      {/* 3. Bloque Superior: Galería Izquierda + Panel de Compra (Derecha) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16">
          {/* ================= COLUMNA IZQUIERDA: GALERÍA DE FOTOS ================= */}
          <section className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Tira de Miniaturas */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto scrollbar-none shrink-0 py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md border overflow-hidden bg-slate-50 cursor-pointer transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? "border-slate-800 ring-1 ring-slate-800/30 opacity-100 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 opacity-60 hover:opacity-100"
                  }`}
                  title={`Ver foto ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} miniatura ${idx + 1}`}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Imagen Principal Grande con Lightbox Zoom */}
            <div
              onClick={() => setZoomImage(images[activeImageIndex])}
              className="relative flex-1 aspect-square sm:aspect-[4/5] bg-[#f8fafc] rounded-xl border border-slate-200/90 overflow-hidden group cursor-zoom-in flex items-center justify-center shadow-2xs"
            >
              {isOffer && (
                <span className="absolute top-3 left-3 z-10 bg-[#00D615] text-slate-950 font-black text-xs uppercase px-2.5 py-1 rounded shadow-xs tracking-wider">
                  {discountPercent ? `${discountPercent}% OFF` : "OFERTA"}
                </span>
              )}

              <img
                src={images[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ease-out"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                }}
              />
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5 text-slate-900" />
                <span>Ampliar</span>
              </div>
            </div>
          </section>

          {/* ================= COLUMNA DERECHA: ORGANIZACIÓN Y ESPACIADO EXACTOS ================= */}
          <section className="lg:col-span-5 flex flex-col space-y-3 lg:sticky lg:top-24 h-fit max-w-lg">
            {/* 1. Marca */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold tracking-wide uppercase">
              <span className="text-[#00A811] font-bold">{product.brand?.name}</span>
            </div>

            {/* 2. Título Oficial del Producto */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* 3. Precio y Sub-precio (Precio sin Impuestos Nacionales) */}
            <div className="space-y-0.5 pt-0.5">
              {originalPrice && originalPrice > effectivePrice && (
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg text-slate-400 line-through font-semibold">
                    {formatCurrency(originalPrice)}
                  </span>
                  {discountPercent && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Ahorrás {formatCurrency(originalPrice - effectivePrice)}
                    </span>
                  )}
                </div>
              )}
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {formatCurrency(effectivePrice)}
              </div>
              <div className="text-xs text-slate-400 font-normal">
                Precio sin Impuestos Nacionales: {formatCurrency(netPrice)}
              </div>
            </div>

            {/* 4. Pill verde de cuotas sin interés */}
            <div>
              <span className="inline-block bg-[#dcfce7] text-[#15803d] font-bold text-xs px-2.5 py-1 rounded">
                {featuredInstallmentBadge}
              </span>
            </div>

            {/* 5. Fila de Logos de Tarjetas y Enlace "Ver detalle" */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {/* VISA */}
              <span
                className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-[#1a1f71] text-white font-black text-[9px] tracking-wider shadow-2xs select-none"
                title="Visa"
              >
                VISA
              </span>

              {/* Mastercard */}
              <span
                className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-white border border-slate-200 shadow-2xs select-none"
                title="Mastercard"
              >
                <MastercardLogoSvg />
              </span>

              {/* Cabal */}
              <span
                className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-[#004a98] text-white font-black text-[9px] tracking-wider shadow-2xs select-none"
                title="Cabal"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#e30613] mr-1 inline-block shrink-0" />
                CABAL
              </span>

              {/* Naranja X */}
              <span
                className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-[#ff6200] text-white font-bold text-[9px] tracking-tight shadow-2xs select-none"
                title="Naranja X"
              >
                <span>naranja</span>
                <span className="font-black text-white ml-0.5 text-[10px]">X</span>
              </span>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="text-xs text-slate-700 font-medium underline flex items-center gap-0.5 hover:text-slate-950 ml-1 cursor-pointer"
              >
                <span>Ver detalle</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 6. Beneficio de Envío */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pt-1">
              <Truck className="w-4 h-4 text-slate-800 shrink-0" />
              <span>¡Envío gratuito en pedidos de {formatCurrency(109999)}!</span>
            </div>

            {/* 7. Selector de Colores en Circulitos con Nombre al Lado */}
            <div className="space-y-2 pt-2">
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                Color: <span className="font-extrabold text-slate-950 ml-1">{selectedColor}</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {colorOptions.map((c) => {
                  const isSelected = selectedColor.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-7 h-7 rounded-full p-0.5 transition-all cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-slate-950 ring-offset-2 scale-110"
                          : "hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      title={c.name}
                    >
                      <span
                        className="block w-full h-full rounded-full border border-black/15 shadow-2xs"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. Selector de Talle con lista de cajas y Guía de Talles */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Talle: <span className="font-extrabold text-slate-950 ml-1">{selectedSize}</span>
                </div>

                {/* Enlace Guía de talles */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("talles");
                    const el = document.getElementById("apartados-inferiores");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-slate-950 underline underline-offset-2 cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Guía de talles</span>
                </button>
              </div>

              {/* Botones de Talles */}
              <div className="flex items-center gap-2 flex-wrap">
                {sizesList.map((s) => {
                  const isSelected = selectedSize === s.size;
                  const isAvailableSize = s.inStock;

                  return (
                    <button
                      key={s.size}
                      type="button"
                      disabled={!isAvailableSize}
                      onClick={() => setSelectedSize(s.size)}
                      className={`min-w-[42px] h-10 px-2.5 rounded-lg border text-xs font-bold transition-all select-none cursor-pointer flex items-center justify-center relative ${
                        isSelected
                          ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                          : isAvailableSize
                          ? "bg-white text-slate-800 border-slate-300 hover:border-slate-800"
                          : "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                      }`}
                      title={isAvailableSize ? `Talle ${s.size}` : "Sin stock disponible"}
                    >
                      <span>{s.size}</span>
                      {s.availableStock > 0 && s.availableStock <= 3 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 9. Cantidad Stepper + Botones de Compra */}
            <div className="space-y-2 pt-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white h-11 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !isAvailable}
                    className="w-9 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-9 text-center font-bold text-sm text-slate-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    disabled={quantity >= availableStock || !isAvailable}
                    className="w-9 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                  className="flex-1 h-11 bg-[#9bdc65] hover:bg-[#8ccb55] disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-extrabold text-sm rounded-full shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:cursor-not-allowed"
                >
                  {isAddedToCart ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      <span>¡Agregado al Carrito!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isAvailable ? "Agregar al carrito" : "Agotado"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Botón COMPRAR AHORA */}
              {isAvailable && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full h-11 bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-98"
                >
                  <span>COMPRAR AHORA</span>
                </button>
              )}

              {/* Botón Asistencia WhatsApp (RF-18) */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                suppressHydrationWarning
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-600/40 text-emerald-800 hover:bg-emerald-50 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>

            {/* 10. Caja de Entrega y Retiro Saavedra 241 Formosa */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-3 bg-[#fafafa] mt-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <Store className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Retiro GRATIS en sucursal Formosa
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Saavedra 241, Formosa Capital. ¡Listo para retirar en menos de 2 horas!
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-700 pt-2 border-t border-slate-200/60">
                <Truck className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-slate-900 block">
                    Envíos a todo el país
                  </span>
                  <span className="text-slate-500 text-[11px] block mb-2">
                    Correo Argentino y Andreani a domicilio o sucursal.
                  </span>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Tu código postal (ej: 3600)"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="h-8 px-2.5 rounded border border-slate-300 text-xs w-44 focus:outline-none focus:border-slate-800 bg-white"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setPostalCalculated(true)}
                      className="h-8 px-3 rounded bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Calcular
                    </button>
                  </div>

                  {postalCalculated && (
                    <div className="text-[11px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        ¡Envío disponible para tu código postal {postalCode || "3600"}!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-700 pt-2 border-t border-slate-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Garantía oficial y cambio en el local
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Productos 100% originales con respaldo de Matacos Deportes.
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* =========================================================================
            4. APARTADOS INFERIORES: PESTAÑAS INTERACTIVAS
            - DESCRIPCIÓN
            - LAVADO Y CUIDADO
            - TABLA DE TALLES
            - VALORACIONES (44) ★★★★★
           ========================================================================= */}
        <section id="apartados-inferiores" className="mt-14 sm:mt-20 pt-8 border-t border-slate-200">
          {/* Barra de Pestañas Superior */}
          <div className="flex items-center gap-6 sm:gap-10 border-b border-slate-200 overflow-x-auto scrollbar-none pb-0 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
            <button
              type="button"
              onClick={() => setActiveTab("descripcion")}
              className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "descripcion"
                  ? "border-slate-950 text-slate-950 font-extrabold"
                  : "border-transparent hover:text-slate-950"
              }`}
            >
              Descripción
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cuidados")}
              className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "cuidados"
                  ? "border-slate-950 text-slate-950 font-extrabold"
                  : "border-transparent hover:text-slate-950"
              }`}
            >
              Lavado y Cuidado
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("talles")}
              className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "talles"
                  ? "border-slate-950 text-slate-950 font-extrabold"
                  : "border-transparent hover:text-slate-950"
              }`}
            >
              Tabla de Talles
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("valoraciones")}
              className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "valoraciones"
                  ? "border-slate-950 text-slate-950 font-extrabold"
                  : "border-transparent hover:text-slate-950"
              }`}
            >
              <span>Valoraciones (44)</span>
              <span className="text-amber-500 text-xs font-normal">★★★★★</span>
            </button>
          </div>

          {/* CONTENIDO DE CADA PESTAÑA */}
          <div className="py-8">
            {/* ----------------- PESTAÑA 1: DESCRIPCIÓN ----------------- */}
            {activeTab === "descripcion" && (
              <div className="max-w-4xl space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-extrabold uppercase text-slate-950 tracking-tight">
                    {product.name}
                  </h3>
                  {product.description ? (
                    product.description.includes("<") ? (
                      <div
                        className="text-slate-700 leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&>h3]:font-bold [&>h4]:font-bold"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    ) : (
                      <p className="whitespace-pre-line">{product.description}</p>
                    )
                  ) : (
                    <p>
                      Diseñado para atletas y entusiastas del deporte que buscan el equilibrio definitivo entre respuesta, confort y soporte. Cada costura y material ha sido testeado en condiciones reales de entrenamiento para garantizar durabilidad insuperable y confort durante todo el día.
                    </p>
                  )}
                  <ul className="list-disc list-inside space-y-1.5 text-slate-600 pt-1">
                    <li>Capellada técnica de malla transpirable con refuerzos estratégicos.</li>
                    <li>Amortiguación reactiva con retorno de energía constante en cada uso.</li>
                    <li>Suela de alta tracción apta para múltiples superficies y uso intensivo.</li>
                    <li>Ajuste ceñido ergonómico para reducir fatiga muscular.</li>
                  </ul>
                </div>

                {/* Apartado de Tecnología */}
                <div className="pt-6 border-t border-slate-200 space-y-3">
                  <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-slate-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Tecnología</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {technologiesList.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1 hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-slate-950">
                          <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{t.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {t.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- PESTAÑA 2: LAVADO Y CUIDADO ----------------- */}
            {activeTab === "cuidados" && (
              <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Columna Izquierda: Instrucciones con Iconos */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 font-mono">
                    INSTRUCCIONES DE LAVADO
                  </h3>
                  <div className="space-y-3.5 text-xs text-slate-700">
                    <div className="flex items-center gap-3">
                      <BleachNoIcon />
                      <span>No usar blanqueador</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TumbleDryLowIcon />
                      <span>Puede utilizarse secadora en temperatura baja.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DryCleanNoIcon />
                      <span>No lavar en seco.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IronLowIcon />
                      <span>Planchar a temperatura baja.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Wash30ColdIcon />
                      <span>Lavar a máquina en temperatura fría (30°C).</span>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Información Adicional sobre el Cuidado */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 font-mono">
                    INFORMACIÓN ADICIONAL SOBRE EL CUIDADO
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700 list-none">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>Lavar a máquina dentro de bolsa para lavar ropa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>Lavar con cierres y abrojos ajustados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>Usar únicamente detergente suave</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>No planchar las cintas ni estampas termoselladas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>Retirar rápidamente del tambor después de lavar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>No usar suavizante textil</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-900 font-bold">•</span>
                      <span>Lavar por separado del revés</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* ----------------- PESTAÑA 3: TABLA DE TALLES ----------------- */}
            {activeTab === "talles" && (
              <div className="max-w-4xl space-y-8">
                {/* Tabla 1: CALZAS, SHORTS, JOGGERS */}
                <div className="space-y-2.5">
                  <div className="text-center sm:text-left">
                    <span className="text-xs font-black tracking-widest text-slate-500 uppercase block">
                      INDUMENTARIA INFERIOR
                    </span>
                    <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                      CALZAS • SHORTS • JOGGERS • PANTALONES
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded overflow-hidden">
                      <thead className="bg-slate-50 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-2 sm:p-2.5">TALLE</th>
                          <th className="p-2 sm:p-2.5">EQUIVALENCIA</th>
                          <th className="p-2 sm:p-2.5">PANTALÓN</th>
                          <th className="p-2 sm:p-2.5">1. CINTURA</th>
                          <th className="p-2 sm:p-2.5">2. CADERA</th>
                          <th className="p-2 sm:p-2.5">3. TIRO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="p-2 sm:p-2.5 font-bold">XS</td>
                          <td className="p-2 sm:p-2.5">0</td>
                          <td className="p-2 sm:p-2.5">30-32</td>
                          <td className="p-2 sm:p-2.5">61-66cm</td>
                          <td className="p-2 sm:p-2.5">86-91cm</td>
                          <td className="p-2 sm:p-2.5">78cm</td>
                        </tr>
                        <tr className="bg-slate-50/40">
                          <td className="p-2 sm:p-2.5 font-bold">S</td>
                          <td className="p-2 sm:p-2.5">1</td>
                          <td className="p-2 sm:p-2.5">34-36</td>
                          <td className="p-2 sm:p-2.5">67-72cm</td>
                          <td className="p-2 sm:p-2.5">92-97cm</td>
                          <td className="p-2 sm:p-2.5">78.5cm</td>
                        </tr>
                        <tr>
                          <td className="p-2 sm:p-2.5 font-bold">M</td>
                          <td className="p-2 sm:p-2.5">2</td>
                          <td className="p-2 sm:p-2.5">38-40</td>
                          <td className="p-2 sm:p-2.5">73-78cm</td>
                          <td className="p-2 sm:p-2.5">98-103cm</td>
                          <td className="p-2 sm:p-2.5">79cm</td>
                        </tr>
                        <tr className="bg-slate-50/40">
                          <td className="p-2 sm:p-2.5 font-bold">L</td>
                          <td className="p-2 sm:p-2.5">3</td>
                          <td className="p-2 sm:p-2.5">42-44</td>
                          <td className="p-2 sm:p-2.5">79-85cm</td>
                          <td className="p-2 sm:p-2.5">104-110cm</td>
                          <td className="p-2 sm:p-2.5">79.5cm</td>
                        </tr>
                        <tr>
                          <td className="p-2 sm:p-2.5 font-bold">XL</td>
                          <td className="p-2 sm:p-2.5">4</td>
                          <td className="p-2 sm:p-2.5">46-48</td>
                          <td className="p-2 sm:p-2.5">86-96cm</td>
                          <td className="p-2 sm:p-2.5">111-118cm</td>
                          <td className="p-2 sm:p-2.5">80cm</td>
                        </tr>
                        <tr className="bg-slate-50/40">
                          <td className="p-2 sm:p-2.5 font-bold">XXL</td>
                          <td className="p-2 sm:p-2.5">5</td>
                          <td className="p-2 sm:p-2.5">50-52</td>
                          <td className="p-2 sm:p-2.5">97-104cm</td>
                          <td className="p-2 sm:p-2.5">119-125cm</td>
                          <td className="p-2 sm:p-2.5">80.5cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabla 2: TOPS, REMERAS, CAMPERAS */}
                <div className="space-y-2.5">
                  <div className="text-center sm:text-left">
                    <span className="text-xs font-black tracking-widest text-slate-500 uppercase block">
                      INDUMENTARIA SUPERIOR
                    </span>
                    <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                      TOPS • REMERAS • CAMPERAS • BUZOS
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded overflow-hidden">
                      <thead className="bg-slate-50 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-2 sm:p-2.5">TALLE</th>
                          <th className="p-2 sm:p-2.5">CORPIÑO</th>
                          <th className="p-2 sm:p-2.5">BRA COPA</th>
                          <th className="p-2 sm:p-2.5">BUSTO</th>
                          <th className="p-2 sm:p-2.5">ABAJO BUSTO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="p-2 sm:p-2.5 font-bold">S</td>
                          <td className="p-2 sm:p-2.5">80-85</td>
                          <td className="p-2 sm:p-2.5">34 B-DD</td>
                          <td className="p-2 sm:p-2.5">84-88cm</td>
                          <td className="p-2 sm:p-2.5">68-72cm</td>
                        </tr>
                        <tr className="bg-slate-50/40">
                          <td className="p-2 sm:p-2.5 font-bold">M</td>
                          <td className="p-2 sm:p-2.5">85-90</td>
                          <td className="p-2 sm:p-2.5">36 B-DD</td>
                          <td className="p-2 sm:p-2.5">89-93cm</td>
                          <td className="p-2 sm:p-2.5">73-77cm</td>
                        </tr>
                        <tr>
                          <td className="p-2 sm:p-2.5 font-bold">L</td>
                          <td className="p-2 sm:p-2.5">90-95</td>
                          <td className="p-2 sm:p-2.5">38 A-C</td>
                          <td className="p-2 sm:p-2.5">94-98cm</td>
                          <td className="p-2 sm:p-2.5">78-82cm</td>
                        </tr>
                        <tr className="bg-slate-50/40">
                          <td className="p-2 sm:p-2.5 font-bold">XL</td>
                          <td className="p-2 sm:p-2.5">95-105</td>
                          <td className="p-2 sm:p-2.5">38 D-DD</td>
                          <td className="p-2 sm:p-2.5">99-103cm</td>
                          <td className="p-2 sm:p-2.5">83-87cm</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sección de Instrucciones de Medición con Siluetas */}
                <div className="pt-6 border-t border-slate-200">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-4">
                    Para saber cuál es tu talle, sigue los siguientes pasos:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-4 text-xs sm:text-sm text-slate-700">
                      <div>
                        <p className="font-extrabold text-slate-900 tracking-tight">■ 1. PECHO</p>
                        <p className="text-slate-600 mt-0.5">
                          Medí alrededor de la parte más ancha del pecho, manteniendo la cinta métrica horizontal sin apretar.
                        </p>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 tracking-tight">■ 2. CINTURA</p>
                        <p className="text-slate-600 mt-0.5">
                          Rodeá la parte más estrecha de tu cintura con la cinta métrica en posición recta.
                        </p>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 tracking-tight">■ 3. CADERA</p>
                        <p className="text-slate-600 mt-0.5">
                          Parate con los pies juntos y rodeá tus caderas con la cinta métrica en la parte de mayor volumen.
                        </p>
                      </div>
                    </div>

                    {/* Siluetas Hombre y Mujer cargadas desde /public/images/talles */}
                    <div className="md:col-span-5 flex items-center justify-center gap-4 py-3 px-4 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Hombre
                        </span>
                        <div className="h-44 sm:h-52 w-auto overflow-hidden rounded-md flex items-center justify-center bg-white p-1 border border-slate-200 shadow-2xs">
                          <img
                            src="/images/talles/guia-talles-hombre.jpg"
                            alt="Guía de talles Hombre - Pecho, Cintura, Cadera"
                            className="h-full w-auto object-contain"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Mujer
                        </span>
                        <div className="h-44 sm:h-52 w-auto overflow-hidden rounded-md flex items-center justify-center bg-white p-1 border border-slate-200 shadow-2xs">
                          <img
                            src="/images/talles/guia-talles-mujer.jpg"
                            alt="Guía de talles Mujer - Pecho, Cintura, Cadera"
                            className="h-full w-auto object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- PESTAÑA 4: VALORACIONES ----------------- */}
            {activeTab === "valoraciones" && (
              <div className="space-y-8 max-w-4xl">
                {/* Cabecera de Valoraciones */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-extrabold text-slate-950">4.8</span>
                    <div>
                      <div className="text-amber-500 text-lg">★★★★★</div>
                      <span className="text-xs text-slate-500 font-medium">
                        Basado en 44 opiniones verificadas
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsWritingReview(true)}
                    className="px-5 py-2.5 rounded border border-slate-900 text-slate-900 hover:bg-slate-950 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-2"
                  >
                    <span>Escribir una reseña</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Dimensiones / Sliders de Calidad y Ajuste */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-slate-900 block">Comodidad</span>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-slate-900 w-[92%]" />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Deficiente</span>
                      <span className="font-bold text-slate-900">Excelente (92%)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-slate-900 block">Calidad</span>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-slate-900 w-[95%]" />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Deficiente</span>
                      <span className="font-bold text-slate-900">Excelente (95%)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-slate-900 block">Ajuste</span>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-slate-900 w-[50%] ml-[25%]" />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Ajustado</span>
                      <span className="font-bold text-slate-900">Perfecto (Calce Real)</span>
                      <span>Holgado</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-slate-900 block">Longitud</span>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-slate-900 w-[50%] ml-[25%]" />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Corta</span>
                      <span className="font-bold text-slate-900">Exacta a la Guía</span>
                      <span>Larga</span>
                    </div>
                  </div>
                </div>

                {/* Caja de "Lo que dicen las reseñas" (Resumen Asistido por IA) */}
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                      Lo que dicen las reseñas
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Este resumen es generado por inteligencia artificial analizando opiniones de clientes reales.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-900 font-bold">•</span>
                        <span>Los clientes elogian la amortiguación ligera y el confort térmico durante todo el día.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-900 font-bold">•</span>
                        <span>Muchos destacan la estética versátil que combina fácilmente para entrenamiento y uso urbano.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-900 font-bold">•</span>
                        <span>La mayoría aprecia la suela con buen agarre tanto en asfalto como en el gimnasio.</span>
                      </li>
                    </ul>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-900 font-bold">•</span>
                        <span>Recomiendan guiarse por la tabla de medidas de la ficha para elegir el calce ideal.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-slate-900 font-bold">•</span>
                        <span>Excelente atención y rapidez al retirar en el local de Saavedra 241, Formosa.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Barra de Filtros y Orden */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-700 mr-1">Filtrar por estrellas:</span>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setSelectedStarFilter(selectedStarFilter === star ? null : star)
                        }
                        className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                          selectedStarFilter === star
                            ? "bg-slate-950 text-white border-slate-950"
                            : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Ordenar por:</span>
                    <select
                      value={reviewSort}
                      onChange={(e) => setReviewSort(e.target.value)}
                      className="h-8 px-2.5 rounded border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="novedades">Novedades</option>
                      <option value="mas-alta">Calificación más alta</option>
                      <option value="mas-baja">Calificación más baja</option>
                    </select>
                  </div>
                </div>

                {/* Lista de Reseñas de Clientes */}
                <div className="space-y-6 divide-y divide-slate-100 pt-2">
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="text-amber-500 text-xs">★★★★★</div>
                      <span className="text-xs font-black text-slate-900">Yohanaoje</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                        ✓ Comprador verificado
                      </span>
                      <span className="text-[11px] text-slate-400">• 25 de septiembre de 2026</span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Muy lindo, excelente calidad
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Me gustó mucho el material y la comodidad al usarlo todo el día. El calce es perfecto y la atención al retirar en el local de Saavedra fue súper rápida.
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>¿Te resultó útil?</span>
                      <button
                        type="button"
                        className="hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <ThumbsUp className="w-3 h-3" /> <span>4</span>
                      </button>
                      <button
                        type="button"
                        className="hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <ThumbsDown className="w-3 h-3" /> <span>0</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-6">
                    <div className="flex items-center gap-2">
                      <div className="text-amber-500 text-xs">★★★★★</div>
                      <span className="text-xs font-black text-slate-900">Samy</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                        ✓ Comprador verificado
                      </span>
                      <span className="text-[11px] text-slate-400">• 23 de agosto de 2026</span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Súper cómodas para entrenar
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      La amortiguación se nota desde el primer día. Las uso para correr y el calce es impecable. Recomiendo seguir la tabla de medidas al pie de la letra.
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>¿Te resultó útil?</span>
                      <button
                        type="button"
                        className="hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <ThumbsUp className="w-3 h-3" /> <span>2</span>
                      </button>
                      <button
                        type="button"
                        className="hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <ThumbsDown className="w-3 h-3" /> <span>0</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= SECCIÓN INFERIOR: PRODUCTOS RELACIONADOS ================= */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-slate-200 space-y-6">
            <div className="flex items-end justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00A811]">
                  COMPLETÁ TU EQUIPO
                </span>
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-slate-950 uppercase">
                  PRODUCTOS RECOMENDADOS
                </h2>
              </div>
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-[#00A811] transition-colors"
              >
                <span>Ver todo el catálogo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {relatedProducts.slice(0, 4).map((rel) => {
                const imgUrl =
                  rel.images?.find((img) => img.isPrimary)?.url ||
                  rel.images?.[0]?.url ||
                  rel.imageUrl ||
                  "/placeholder-product.svg";

                return (
                  <div
                    key={rel.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-400 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    <div className="relative w-full aspect-square bg-[#f8fafc] overflow-hidden p-4 flex items-center justify-center">
                      <Link
                        href={`/productos/${rel.id}`}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <img
                          src={imgUrl}
                          alt={rel.name}
                          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                          }}
                        />
                      </Link>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {rel.brand?.name}
                        </span>
                        <Link href={`/productos/${rel.id}`}>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#00A811] transition-colors line-clamp-2">
                            {rel.name}
                          </h4>
                        </Link>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-sm font-black text-[#00A811]">
                          {formatCurrency(rel.price)}
                        </span>
                        <Link
                          href={`/productos/${rel.id}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-900 text-slate-900 font-bold text-[11px] uppercase hover:bg-slate-900 hover:text-white transition-all"
                        >
                          Ver
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* 5. Footer Oficial */}
      <EcommerceFooter />

      {/* 6. Modal de Imagen Ampliada (Lightbox Zoom) */}
      {zoomImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10"
            title="Cerrar imagen"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-4xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImage}
              alt="Vista ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* 7. Modal de Promociones y Medios de Pago */}
      {isPaymentModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsPaymentModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Promociones y Medios de Pago
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              {/* Tarjeta Naranja X */}
              <div className="p-3.5 rounded-xl bg-orange-50/90 border border-orange-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#ff6000] block text-sm">
                    Tarjeta Naranja X
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ff6000] text-white">
                    Naranja X
                  </span>
                </div>
                <div className="space-y-1.5 pt-0.5">
                  {installmentPlans
                    .filter((p) => p.active && p.cardBrands.includes("NARANJA_X"))
                    .sort((a, b) => a.installments - b.installments)
                    .map((plan) => {
                      const calc = calculateInstallmentPlanAmounts(
                        effectivePrice,
                        plan
                      );
                      const meetsMin = effectivePrice >= plan.minAmount;
                      return (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between gap-2 bg-white/80 px-2.5 py-1.5 rounded-lg border border-orange-100"
                        >
                          <div>
                            <span className="font-bold text-slate-900">
                              {plan.isPlanZ
                                ? `Plan Z (${plan.installments} cuotas)`
                                : plan.installments === 1
                                ? "1 pago"
                                : `${plan.installments} cuotas`}
                            </span>{" "}
                            <span className="text-slate-600">
                              de {formatCurrency(calc.installmentAmount)}
                            </span>
                            {plan.minAmount > 0 && (
                              <span
                                className={`block text-[10px] font-semibold ${
                                  meetsMin ? "text-emerald-700" : "text-amber-700"
                                }`}
                              >
                                A partir de {formatCurrency(plan.minAmount)}
                                {!meetsMin && " (sumando al carrito)"}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                              plan.interestRate === 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {plan.interestRate === 0
                              ? "Sin interés"
                              : `+${plan.interestRate}%`}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Tarjetas Bancarizadas */}
              <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#16a34a] block text-sm">
                    Tarjetas Bancarizadas
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Visa · Mastercard · Cabal
                  </span>
                </div>
                <div className="space-y-1.5 pt-0.5">
                  {installmentPlans
                    .filter(
                      (p) =>
                        p.active &&
                        (p.cardBrands.includes("VISA") ||
                          p.cardBrands.includes("MASTERCARD") ||
                          p.cardBrands.includes("CABAL"))
                    )
                    .sort((a, b) => a.installments - b.installments)
                    .map((plan) => {
                      const calc = calculateInstallmentPlanAmounts(
                        effectivePrice,
                        plan
                      );
                      const meetsMin = effectivePrice >= plan.minAmount;
                      return (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between gap-2 bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-100"
                        >
                          <div>
                            <span className="font-bold text-slate-900">
                              {plan.installments === 1
                                ? "1 pago"
                                : `${plan.installments} cuotas`}
                            </span>{" "}
                            <span className="text-slate-600">
                              de {formatCurrency(calc.installmentAmount)}
                            </span>
                            {plan.minAmount > 0 && (
                              <span
                                className={`block text-[10px] font-semibold ${
                                  meetsMin ? "text-emerald-700" : "text-amber-700"
                                }`}
                              >
                                A partir de {formatCurrency(plan.minAmount)}
                                {!meetsMin && " (sumando al carrito)"}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                              plan.interestRate === 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {plan.interestRate === 0
                              ? "Sin interés"
                              : `+${plan.interestRate}%`}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block text-sm">
                  Efectivo y Transferencia Bancaria
                </span>
                <p className="text-slate-600">
                  Atención personalizada por transferencia inmediata o en efectivo en nuestro mostrador (Saavedra 241, Formosa Capital).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal para Escribir una Reseña */}
      {isWritingReview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsWritingReview(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Escribir una reseña
                </h3>
                <p className="text-xs text-slate-500">{product.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsWritingReview(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-extrabold text-slate-900">¡Muchas gracias por tu reseña!</h4>
                <p className="text-xs text-slate-600">
                  Tu opinión fue registrada y será publicada una vez verificada.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsWritingReview(false);
                    setReviewSubmitted(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setReviewSubmitted(true);
                }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 block">Puntuación general</label>
                  <div className="flex items-center gap-2 text-xl text-amber-500 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="hover:scale-110 transition-transform">
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 block">Título de la reseña</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Excelente calidad y calce perfecto"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 block">Tu opinión</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Contanos tu experiencia con el producto, materiales, calce y comodidad..."
                    className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 block">Tu nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sofía"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Enviar reseña
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 9. Size Guide Modal Rápido */}
      <SizeGuideModal
        isOpen={isSizeGuideModalOpen}
        onClose={() => setIsSizeGuideModalOpen(false)}
        gender={product.gender}
        defaultTab={
          product.discipline?.slug === "crocs" || product.category?.slug === "calzado"
            ? "calzado"
            : "indumentaria"
        }
      />
    </div>
  );
}
