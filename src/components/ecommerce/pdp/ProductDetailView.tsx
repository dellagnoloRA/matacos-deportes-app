"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { useCartStore } from "@/stores/cartStore";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ProductActionBox } from "./ProductActionBox";
import { SizeGuideModal } from "./SizeGuideModal";
import { ChevronRight, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type {
  PublicProductDetail,
  PublicProductItem,
  PublicVariantItem,
} from "@/types/ecommerce";
import type { EcommerceProduct } from "@/components/ecommerce/types";
import { mapPublicProductToEcommerce } from "@/lib/ecommerceProductMapper";

interface ProductDetailViewProps {
  product: PublicProductDetail;
  relatedProducts: PublicProductItem[];
}

export function ProductDetailView({
  product,
  relatedProducts,
}: ProductDetailViewProps) {
  const router = useRouter();

  // Color selection
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colorOptions[0]?.color || null
  );

  // Size selection
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizeOptions.find((s) => s.inStock)?.size || product.sizeOptions[0]?.size || null
  );

  // Modals state
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Resolve matching active variant
  const activeVariant = useMemo<PublicVariantItem | null>(() => {
    if (!product.variants || product.variants.length === 0) return null;

    // Try finding exact match by color and size
    if (selectedColor && selectedSize) {
      const exact = product.variants.find(
        (v) =>
          v.color.trim().toLowerCase() === selectedColor.trim().toLowerCase() &&
          v.size.trim().toLowerCase() === selectedSize.trim().toLowerCase()
      );
      if (exact) return exact;
    }

    // Try finding match by size
    if (selectedSize) {
      const bySize = product.variants.find(
        (v) => v.size.trim().toLowerCase() === selectedSize.trim().toLowerCase()
      );
      if (bySize) return bySize;
    }

    // Fallback to first available variant
    return product.variants.find((v) => v.inStock) || product.variants[0] || null;
  }, [product.variants, selectedColor, selectedSize]);

  // Pricing calculations
  const effectivePrice = activeVariant?.price ? activeVariant.price : product.price;
  const isOffer = product.maxPrice > product.price;
  const originalPrice = isOffer ? product.maxPrice : undefined;

  // Cart actions
  const handleAddToCart = (quantity: number) => {
    if (!activeVariant) return;

    useCartStore.getState().addItem(
      {
        variantId: activeVariant.id,
        productId: product.id,
        name: product.name,
        brand: product.brand.name,
        size: selectedSize || activeVariant.size,
        color: selectedColor || activeVariant.color,
        image:
          product.images?.find((img) => img.color === activeVariant.color)?.url ||
          product.images?.[0]?.url ||
          product.imageUrl ||
          "/placeholder-product.svg",
        unitPrice: effectivePrice,
        maxAvailableStock: activeVariant.availableStock,
      },
      quantity
    );

    setAddedNotice(product.name);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  const handleBuyNow = (quantity: number) => {
    handleAddToCart(quantity);
    useCartStore.getState().closeDrawer();
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header (automatically connected to cartStore) */}
      <EcommerceHeader />

      {/* 2. Main PDP Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/catalogo" className="hover:text-slate-900 transition-colors">
            Catálogo
          </Link>
          {product.discipline && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link
                href={`/catalogo?disciplina=${product.discipline.slug}`}
                className="hover:text-slate-900 transition-colors"
              >
                {product.discipline.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </nav>

        {/* Product Details Section: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
          {/* Left: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 w-full">
            <ProductImageGallery
              productName={product.name}
              defaultImageUrl={product.imageUrl}
              images={product.images}
              isOffer={isOffer}
            />
          </div>

          {/* Right: Technical Information & Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header / Brand & Titles */}
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="text-[#00A811]">{product.brand.name}</span>
                <span>•</span>
                <span>{product.category.name}</span>
                {product.modelCode && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">Cód: {product.modelCode}</span>
                  </>
                )}
                {product.gender && (
                  <>
                    <span>•</span>
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase">
                      {product.gender === "HOMBRE"
                        ? "Hombre"
                        : product.gender === "MUJER"
                        ? "Mujer"
                        : product.gender === "NINO"
                        ? "Niños"
                        : "Unisex"}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Pricing section */}
              <div className="pt-2">
                {originalPrice && (
                  <span className="text-sm text-slate-400 line-through font-semibold block">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-[#00A811] tracking-tight">
                    {formatCurrency(effectivePrice)}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    3 y 6 Cuotas sin interés
                  </span>
                </div>
              </div>
            </div>

            {/* Variant Selectors (Color & Size) */}
            <ProductVariantSelector
              colorOptions={product.colorOptions}
              sizeOptions={product.sizeOptions}
              variants={product.variants}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onSelectColor={(c) => setSelectedColor(c)}
              onSelectSize={(s) => setSelectedSize(s)}
              onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            />

            {/* Action Box: Quantity, Stock status, Add to Cart, Buy Now, WhatsApp & Guarantees */}
            <ProductActionBox
              productName={product.name}
              price={effectivePrice}
              selectedVariant={activeVariant}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />

            {/* Product Description */}
            <div className="pt-6 border-t border-slate-100 space-y-2">
              <h3 className="font-extrabold text-sm uppercase text-slate-900 tracking-wider">
                Descripción del Producto
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description ||
                  "Artículo deportivo original con garantía oficial de Matacos Deportes. Diseñado con materiales de alto rendimiento para garantizar durabilidad y comodidad durante tus entrenamientos y actividades deportivas."}
              </p>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-6">
            <div className="flex items-end justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00A811]">
                  COMPLETÁ TU EQUIPO
                </span>
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-slate-950 uppercase">
                  PRODUCTOS RELACIONADOS
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {relatedProducts.map((rel) => {
                const relItem = mapPublicProductToEcommerce(rel);
                return (
                  <div
                    key={relItem.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-400 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                  >
                    <div className="relative w-full aspect-square bg-[#f8fafc] overflow-hidden p-4 flex items-center justify-center">
                      <Link
                        href={`/productos/${relItem.id}`}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <img
                          src={relItem.image || "/placeholder-product.svg"}
                          alt={relItem.name}
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
                          {relItem.brand}
                        </span>
                        <Link href={`/productos/${relItem.id}`}>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#00A811] transition-colors line-clamp-2">
                            {relItem.name}
                          </h4>
                        </Link>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-sm font-black text-[#00A811]">
                          {formatCurrency(relItem.price)}
                        </span>
                        <Link
                          href={`/productos/${relItem.id}`}
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

      {/* 3. Footer */}
      <EcommerceFooter />

      {/* 4. Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        gender={product.gender}
        onClose={() => setIsSizeGuideOpen(false)}
        defaultTab={
          product.discipline?.slug === "crocs" || product.category.slug === "calzado"
            ? "calzado"
            : "indumentaria"
        }
      />
    </div>
  );
}

