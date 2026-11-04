"use client";

import React, { useState } from "react";
import { EcommerceHeader } from "./EcommerceHeader";
import { EcommerceHero } from "./EcommerceHero";
import { CategoryGrid } from "./CategoryGrid";
import { DisciplineGrid } from "./DisciplineGrid";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { EcommerceOfferBanner } from "./EcommerceOfferBanner";
import { EcommerceFooter } from "./EcommerceFooter";
import { MOCK_FEATURED_PRODUCTS } from "./mockData";
import { EcommerceProduct } from "./types";
import type { SerializedBanner } from "@/server/services/bannerService";

interface EcommerceHomeViewProps {
  initialProducts?: EcommerceProduct[];
  banners?: SerializedBanner[];
}

export function EcommerceHomeView({
  initialProducts,
  banners,
}: EcommerceHomeViewProps) {
  const products =
    initialProducts && initialProducts.length > 0
      ? initialProducts
      : MOCK_FEATURED_PRODUCTS;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<
    string | undefined
  >();

  // Filter products if a search query or discipline is selected
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

  const handleDisciplineSelect = (slug: string) => {
    setSelectedDiscipline((prev) => (prev === slug ? undefined : slug));
    const el = document.getElementById("productos");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header (incluye EcommerceCartDrawer global) */}
      <EcommerceHeader onSearchChange={(q) => setSearchQuery(q)} />

      {/* Main Page Flow */}
      <main className="flex-1 flex flex-col">
        {/* 2. Hero Section */}
        <EcommerceHero banners={banners} />

        {/* 3. Explorá por Categoría */}
        <CategoryGrid
          onSelectCategory={() => {
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
        <FeaturedProductsSection products={displayedProducts} />

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
    </div>
  );
}
