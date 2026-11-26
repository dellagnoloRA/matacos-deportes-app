"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { SizeGuideModal } from "./SizeGuideModal";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import { getProductReviewsAction } from "@/server/actions/ecommerce/reviewActions";
import type {
  ProductReviewsSummary,
  PublicProductReviewsResponse,
} from "@/types/reviews";
import {
  HighlightIcon,
  getSmartHighlightIcon,
} from "@/components/admin/ProductCreateWizard/highlightIcons";
import { formatCurrency } from "@/lib/utils";
import { useStoreSettings } from "@/hooks/useStoreSettings";
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
  Sparkles,
  ShoppingBag,
  Zap,
  ChevronRight,
  X,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Info,
  Droplets,
  Sun,
  AlertTriangle,
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

  // 4. Pestaña activa de los apartados inferiores y resumen real de valoraciones
  const [activeTab, setActiveTab] = useState<
    "descripcion" | "cuidados" | "talles" | "valoraciones"
  >("descripcion");
  const [initialReviewsData, setInitialReviewsData] =
    useState<PublicProductReviewsResponse | null>(null);
  const [reviewsSummary, setReviewsSummary] = useState<ProductReviewsSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    getProductReviewsAction({ productId: product.id })
      .then((res) => {
        if (mounted && res.success && res.data) {
          setInitialReviewsData(res.data);
          setReviewsSummary(res.data.summary);
        }
      })
      .catch(() => {
        // Silenciado si la BD no está disponible o aún no se aplicó la migración
      });
    return () => {
      mounted = false;
    };
  }, [product.id]);

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

  const availableSizeNames = useMemo(
    () => sizesList.map((s) => s.size),
    [sizesList]
  );

  const hasSizeGuide = Boolean(
    product.sizeGuide &&
      (product.sizeGuide.columns.length > 0 || product.sizeGuide.guideImage)
  );

  const hasCareGuide = Boolean(
    product.careGuide &&
      (product.careGuide.instructions.length > 0 ||
        product.careGuide.summary ||
        product.careGuide.warning)
  );

  const effectiveActiveTab =
    (activeTab === "cuidados" && !hasCareGuide) ||
    (activeTab === "talles" && !hasSizeGuide)
      ? "descripcion"
      : activeTab;

  useEffect(() => {
    if (
      (activeTab === "cuidados" && !hasCareGuide) ||
      (activeTab === "talles" && !hasSizeGuide)
    ) {
      setActiveTab("descripcion");
    }
  }, [activeTab, hasCareGuide, hasSizeGuide]);

  const isFootwear = useMemo(() => {
    const categorySlug = (product.category?.slug || "").toLowerCase();
    const categoryLower = (product.category?.name || "").toLowerCase();
    const disciplineSlug = (product.discipline?.slug || "").toLowerCase();
    const nameLower = (product.name || "").toLowerCase();
    return (
      categorySlug === "calzado" ||
      categoryLower.includes("calzado") ||
      disciplineSlug === "crocs" ||
      /zapatilla|botin|botín|ojota|sandalia|clog|croc/.test(nameLower)
    );
  }, [product.category, product.discipline, product.name]);

  // Características destacadas reales guardadas en la BD (highlights)
  const productHighlights = useMemo(() => {
    return (product.highlights || []).filter((h) => h.title || h.text);
  }, [product.highlights]);

  // Especificaciones técnicas reales (specs) guardadas en la BD
  const specEntries = useMemo(() => {
    return Object.entries(product.specs || {}).filter(
      ([k, v]) => k.trim() !== "" && v.trim() !== ""
    );
  }, [product.specs]);

  const sanitizedDescriptionHtml = useMemo(() => {
    if (!product.description || !product.description.includes("<")) return "";
    return sanitizeRichHtml(product.description);
  }, [product.description]);

  const renderCareIcon = (iconKey?: string) => {
    switch (iconKey) {
      case "no_bleach":
        return <BleachNoIcon />;
      case "tumble_low":
        return <TumbleDryLowIcon />;
      case "no_dry_clean":
        return <DryCleanNoIcon />;
      case "iron_low":
        return <IronLowIcon />;
      case "wash_cold":
        return <Wash30ColdIcon />;
      case "hand_wash":
      case "rinse_cold":
        return <Droplets className="w-5 h-5 shrink-0 text-sky-700" />;
      case "shade_dry":
      case "no_heat":
        return <Sun className="w-5 h-5 shrink-0 text-amber-600" />;
      case "wipe_clean":
      default:
        return <Check className="w-5 h-5 shrink-0 text-emerald-700" />;
    }
  };

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

  // RF-18: Enlace de consulta contextual a WhatsApp (dinámico desde StoreSettings)
  const storeSettings = useStoreSettings();
  const whatsappPhone = storeSettings.whatsappNumber;
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
  const waUrl = `https://wa.me/${whatsappPhone}?text=${waText}`;

  const handleWhatsAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

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

              {/* Mercado Pago */}
              <span
                className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-white border border-slate-200 shadow-2xs select-none gap-1"
                title="Mercado Pago"
              >
                <img
                  src="/images/mercadopago-logo.png"
                  alt="Mercado Pago"
                  className="h-3.5 w-auto object-contain"
                />
                <span className="font-extrabold text-[9px] text-[#009EE3]">Mercado Pago</span>
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
              <span>Retiro gratis en Saavedra 241 • Envíos a todo el país</span>
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

                {/* Enlace Guía de talles (solo si tiene guía asignada) */}
                {hasSizeGuide && (
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-slate-950 underline underline-offset-2 cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Guía de talles</span>
                  </button>
                )}
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
                onClick={handleWhatsAppClick}
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
            - DESCRIPCIÓN (siempre visible: resumen, texto rico, destacados y specs)
            - CUIDADOS (solo si el producto tiene CareGuide asignada en BD)
            - TABLA DE TALLES (solo si el producto tiene SizeGuide asignada en BD)
           ========================================================================= */}
        <section id="apartados-inferiores" className="mt-14 sm:mt-20 pt-8 border-t border-slate-200">
          {/* Barra de Pestañas Superior */}
          <div
            role="tablist"
            aria-label="Información detallada del producto"
            className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 overflow-x-auto scrollbar-none pb-0 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500"
          >
            <button
              id="tab-descripcion"
              type="button"
              role="tab"
              aria-selected={effectiveActiveTab === "descripcion"}
              onClick={() => setActiveTab("descripcion")}
              className="pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 border-transparent hover:text-slate-950 aria-selected:border-slate-950 aria-selected:text-slate-950 aria-selected:font-extrabold"
            >
              Descripción
            </button>

            {hasCareGuide && (
              <button
                id="tab-cuidados"
                type="button"
                role="tab"
                aria-selected={effectiveActiveTab === "cuidados"}
                onClick={() => setActiveTab("cuidados")}
                className="pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 border-transparent hover:text-slate-950 aria-selected:border-slate-950 aria-selected:text-slate-950 aria-selected:font-extrabold"
              >
                Cuidados
              </button>
            )}

            {hasSizeGuide && (
              <button
                id="tab-talles"
                type="button"
                role="tab"
                aria-selected={effectiveActiveTab === "talles"}
                onClick={() => setActiveTab("talles")}
                className="pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 border-transparent hover:text-slate-950 aria-selected:border-slate-950 aria-selected:text-slate-950 aria-selected:font-extrabold"
              >
                Tabla de Talles
              </button>
            )}

            <button
              id="tab-valoraciones"
              type="button"
              role="tab"
              aria-selected={effectiveActiveTab === "valoraciones"}
              onClick={() => setActiveTab("valoraciones")}
              className="pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border-transparent hover:text-slate-950 aria-selected:border-slate-950 aria-selected:text-slate-950 aria-selected:font-extrabold"
            >
              <span>
                Valoraciones
                {reviewsSummary && reviewsSummary.reviewsCount > 0
                  ? ` (${reviewsSummary.reviewsCount})`
                  : ""}
              </span>
              {reviewsSummary &&
                reviewsSummary.reviewsCount > 0 &&
                reviewsSummary.ratingAverage !== null && (
                  <span className="text-amber-500 text-xs font-bold">
                    ★ {reviewsSummary.ratingAverage.toFixed(1)}
                  </span>
                )}
            </button>
          </div>

          {/* CONTENIDO DE CADA PESTAÑA */}
          <div className="py-8">
            {/* ----------------- PESTAÑA 1: DESCRIPCIÓN ----------------- */}
            {effectiveActiveTab === "descripcion" && (
              <div
                role="tabpanel"
                aria-labelledby="tab-descripcion"
                className="max-w-4xl space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed"
              >
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-extrabold uppercase text-slate-950 tracking-tight">
                    {product.name}
                  </h3>

                  {product.shortDescription && (
                    <p className="font-semibold text-slate-900 text-sm sm:text-base leading-relaxed">
                      {product.shortDescription}
                    </p>
                  )}

                  {product.description ? (
                    product.description.includes("<") ? (
                      <div
                        className="text-slate-700 leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&>h3]:font-bold [&>h4]:font-bold"
                        dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }}
                      />
                    ) : (
                      <p className="whitespace-pre-line">{product.description}</p>
                    )
                  ) : (
                    !product.shortDescription && (
                      <p className="text-slate-600">
                        {product.name} de {product.brand.name}, categoría {product.category.name}. Producto 100% original con respaldo y garantía oficial de Matacos Deportes (Saavedra 241, Formosa Capital).
                      </p>
                    )
                  )}
                </div>

                {/* Apartado de Características Destacadas / Tecnología reales de la BD */}
                {productHighlights.length > 0 && (
                  <div className="pt-6 border-t border-slate-200 space-y-3">
                    <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-slate-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Características Destacadas</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                      {productHighlights.map((h, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5 hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 font-bold text-xs text-slate-950">
                            <HighlightIcon
                              icon={
                                h.isCustomIcon && h.icon
                                  ? h.icon
                                  : getSmartHighlightIcon(h.title, h.text)
                              }
                              className="w-4 h-4 text-emerald-600 shrink-0"
                            />
                            <span>{h.title}</span>
                          </div>
                          {h.text && (
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {h.text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Especificaciones técnicas reales (specs) guardadas en la BD (sin peso/dimensiones logísticas) */}
                {specEntries.length > 0 && (
                  <div className="pt-6 border-t border-slate-200 space-y-3">
                    <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-slate-950 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span>Especificaciones Técnicas</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {specEntries.map(([key, val]) => (
                        <div
                          key={key}
                          className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {key}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------- PESTAÑA 2: CUIDADOS (CareGuide BD) ----------------- */}
            {effectiveActiveTab === "cuidados" && hasCareGuide && product.careGuide && (
              <div
                role="tabpanel"
                aria-labelledby="tab-cuidados"
                className="max-w-4xl space-y-6"
              >
                <div className="space-y-2">
                  <span className="text-[11px] font-black tracking-widest text-emerald-700 uppercase block">
                    GUÍA DE CUIDADOS • {product.careGuide.type.replace("_", " ")}
                  </span>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                    {product.careGuide.name}
                  </h3>
                  {product.careGuide.summary && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {product.careGuide.summary}
                    </p>
                  )}
                </div>

                {product.careGuide.instructions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {product.careGuide.instructions.map((inst, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-700"
                      >
                        <div className="mt-0.5 shrink-0">{renderCareIcon(inst.icon)}</div>
                        <span className="leading-relaxed">{inst.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {product.careGuide.warning && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Atención:</strong> {product.careGuide.warning}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ----------------- PESTAÑA 3: TABLA DE TALLES (SizeGuide BD) ----------------- */}
            {effectiveActiveTab === "talles" && hasSizeGuide && product.sizeGuide && (
              <div
                role="tabpanel"
                aria-labelledby="tab-talles"
                className="max-w-4xl space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-black tracking-widest text-emerald-700 uppercase block">
                      GUÍA ASIGNADA AL PRODUCTO • {product.sizeGuide.type.replace("_", " ")}
                    </span>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                      {product.sizeGuide.name}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    Unidad: {product.sizeGuide.unit || "cm"}
                  </span>
                </div>

                {product.sizeGuide.fitNote && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Nota de calce:</strong> {product.sizeGuide.fitNote}
                    </span>
                  </div>
                )}

                {product.sizeGuide.guideImage && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-3">
                    <img
                      src={product.sizeGuide.guideImage}
                      alt={product.sizeGuide.name}
                      className="w-full max-h-96 object-contain rounded-xl"
                    />
                  </div>
                )}

                {product.sizeGuide.columns.length > 0 && product.sizeGuide.rows.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] tracking-wider border-b border-slate-200">
                        <tr>
                          {product.sizeGuide.columns.map((col) => (
                            <th key={col} className="p-2.5 sm:p-3 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {product.sizeGuide.rows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}
                          >
                            {product.sizeGuide!.columns.map((col, cIdx) => (
                              <td
                                key={col}
                                className={`p-2.5 sm:p-3 whitespace-nowrap ${
                                  cIdx === 0 ? "font-bold text-slate-950" : ""
                                }`}
                              >
                                {row[col] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {product.sizeGuide.type === "CALZADO" && (
                  <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-2 text-xs text-slate-600">
                      <h4 className="font-extrabold text-slate-900 uppercase tracking-tight text-xs sm:text-sm">
                        ¿Cómo medir tu pie en casa?
                      </h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Colocá una hoja de papel en el suelo pegada a la pared.</li>
                        <li>Apoyá tu pie descalzo con el talón firme contra la pared.</li>
                        <li>Marcá con un lápiz vertical hasta dónde llega tu dedo más largo.</li>
                        <li>Medí la distancia en centímetros y comparala con la columna de largo de pie.</li>
                      </ol>
                    </div>
                    <div className="md:col-span-5 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
                      <img
                        src="/images/talles/guia-talles-medidas.png"
                        alt="Instructivo para medir tu pie"
                        className="max-h-44 w-auto object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------- PESTAÑA 4: VALORACIONES (RESEÑAS REALES BD) ----------------- */}
            {effectiveActiveTab === "valoraciones" && (
              <div role="tabpanel" aria-labelledby="tab-valoraciones">
                <ProductReviewsSection
                  productId={product.id}
                  productName={product.name}
                  availableSizes={availableSizeNames}
                  initialReviewsData={initialReviewsData}
                  onSummaryChange={setReviewsSummary}
                  onReviewsDataSync={setInitialReviewsData}
                />
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

              {/* Mercado Pago */}
              <div className="p-3.5 rounded-xl bg-sky-50/90 border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src="/images/mercadopago-logo.png"
                      alt="Mercado Pago"
                      className="h-5 w-auto object-contain"
                    />
                    <span className="font-bold text-slate-900 text-sm">
                      Mercado Pago
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#009EE3] text-white">
                    HASTA 6 CUOTAS
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Aboná de forma segura con tarjetas de crédito (Visa, Mastercard, Cabal, Naranja X), tarjetas de débito o dinero en cuenta de Mercado Pago con acreditación inmediata.
                </p>
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

      {/* 8. Size Guide Modal Rápido (solo si tiene guía asignada) */}
      {hasSizeGuide && (
        <SizeGuideModal
          isOpen={isSizeGuideModalOpen}
          onClose={() => setIsSizeGuideModalOpen(false)}
          gender={product.gender}
          sizeGuide={product.sizeGuide}
          defaultTab={isFootwear ? "calzado" : "indumentaria"}
        />
      )}
    </div>
  );
}
