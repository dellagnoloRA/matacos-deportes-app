"use client";

import React, { useState } from "react";
import { EcommerceHeader } from "./EcommerceHeader";
import { HeroCarousel } from "./HeroCarousel";
import { CommercialBenefitsBanner } from "./CommercialBenefitsBanner";
import { FeaturedDisciplinesGrid } from "./FeaturedDisciplinesGrid";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { AboutStoreSection } from "./AboutStoreSection";
import { EcommerceOfferBanner } from "./EcommerceOfferBanner";
import { EcommerceFooter } from "./EcommerceFooter";
import { FadeInOnScroll } from "@/components/ui/FadeInOnScroll";
import { MOCK_FEATURED_PRODUCTS } from "./mockData";
import type { EcommerceProduct } from "./types";
import type { SerializedBanner } from "@/server/services/bannerService";
import type { FeaturedDisciplineItem } from "@/types/ecommerce";

interface EcommerceHomeViewProps {
  initialProducts?: EcommerceProduct[];
  promoProducts?: EcommerceProduct[];
  bestSellers?: EcommerceProduct[];
  newArrivals?: EcommerceProduct[];
  banners?: SerializedBanner[];
  disciplines?: FeaturedDisciplineItem[];
}

export function EcommerceHomeView({
  initialProducts,
  promoProducts,
  bestSellers,
  newArrivals,
  banners,
  disciplines,
}: EcommerceHomeViewProps) {
  const products =
    initialProducts && initialProducts.length > 0
      ? initialProducts
      : MOCK_FEATURED_PRODUCTS;

  const [searchQuery, setSearchQuery] = useState("");

  // Filter products if a search query is entered in header
  const displayedProducts = React.useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.discipline?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header institucional (incluye CartDrawer global y PredictiveSearchBar) */}
      <EcommerceHeader onSearchChange={(q) => setSearchQuery(q)} />

      {/* Main Page Flow */}
      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section / Carrusel Promocional (RF-26) */}
        <HeroCarousel banners={banners} />

        {/* 3. Propuesta de Valor Comercial: 3 Pilares (RF-28.3) */}
        <FadeInOnScroll direction="up" delayMs={50}>
          <CommercialBenefitsBanner />
        </FadeInOnScroll>

        {/* 4. Disciplinas Insignia con Cards Inmersivas (RF-28.4) */}
        <FadeInOnScroll direction="up" delayMs={100}>
          <FeaturedDisciplinesGrid disciplines={disciplines} />
        </FadeInOnScroll>

        {/* 5. Vitrina de Productos con Pestañas Interactivas (RF-28.5 & RF-27) */}
        <FadeInOnScroll direction="up" delayMs={100}>
          <FeaturedProductsSection
            products={displayedProducts}
            promoProducts={promoProducts}
            bestSellers={bestSellers}
            newArrivals={newArrivals}
          />
        </FadeInOnScroll>

        {/* 6. Historia y Trayectoria de 25 años en Formosa Capital (RF-28.6) */}
        <AboutStoreSection />

        {/* 7. Banner de Ofertas y Promociones Especiales */}
        <FadeInOnScroll direction="up" delayMs={100}>
          <EcommerceOfferBanner
            onViewOffersClick={() => {
              const el = document.getElementById("productos");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </FadeInOnScroll>
      </main>

      {/* 8. Footer Institucional Completo con Políticas y Contacto (RF-28.7) */}
      <EcommerceFooter />
    </div>
  );
}
