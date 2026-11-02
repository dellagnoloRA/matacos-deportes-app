"use client";

import React, { useState } from "react";
import { EcommerceHeader } from "./EcommerceHeader";
import { EcommerceHero } from "./EcommerceHero";
import { CategoryGrid } from "./CategoryGrid";
import { DisciplineGrid } from "./DisciplineGrid";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { EcommerceOfferBanner } from "./EcommerceOfferBanner";
import { EcommerceFooter } from "./EcommerceFooter";
import { EcommerceCartDrawer } from "./EcommerceCartDrawer";
import { useCartStore } from "@/stores/cartStore";
import { MOCK_FEATURED_PRODUCTS } from "./mockData";
import { EcommerceProduct } from "./types";

interface EcommerceHomeViewProps {
  initialProducts?: EcommerceProduct[];
}

export function EcommerceHomeView({ initialProducts }: EcommerceHomeViewProps) {
  // Use mock or real backend products
  const products = initialProducts && initialProducts.length > 0 ? initialProducts : MOCK_FEATURED_PRODUCTS;

  const cartStore = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>();

  // Filter products if a search query is typed
  const displayedProducts = React.useMemo(() => {
    if (!searchQuery) {
      if (!selectedDiscipline) return products;
      return products.filter(
        (p) => p.discipline?.toLowerCase() === selectedDiscipline.toLowerCase()
      );
    }
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.discipline?.toLowerCase().includes(q)
    );
  }, [products, searchQuery, selectedDiscipline]);

  // Cart actions
  const handleAddToCart = (product: EcommerceProduct) => {
    cartStore.addItem(product);
  };

  const handleDisciplineSelect = (slug: string) => {
    setSelectedDiscipline(slug);
    // Smooth scroll to products
    const el = document.getElementById("productos");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header (Top bar + Main Navigation) */}
      <EcommerceHeader
        onSearchChange={(q) => setSearchQuery(q)}
      />

      {/* Main Page Flow */}
      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section */}
        <EcommerceHero />

        {/* 3. Explorá por Categoría */}
        <CategoryGrid
          onSelectCategory={(slug) => {
            const el = document.getElementById("productos");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* 4. Comprá por Disciplina */}
        <DisciplineGrid
          selectedDiscipline={selectedDiscipline}
          onSelectDiscipline={handleDisciplineSelect}
        />

        {/* 5. Productos Destacados */}
        <FeaturedProductsSection
          products={displayedProducts}
          onAddToCart={handleAddToCart}
        />

        {/* 6. Banner de Ofertas */}
        <EcommerceOfferBanner
          onViewOffersClick={() => {
            const el = document.getElementById("productos");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </main>

      {/* 7. Footer */}
      <EcommerceFooter />

      {/* 8. Cart Slide-Over Drawer */}
      <EcommerceCartDrawer />
    </div>
  );
}
