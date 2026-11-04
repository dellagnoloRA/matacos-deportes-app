"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EcommerceHeader } from "./EcommerceHeader";
import { EcommerceHero } from "./EcommerceHero";
import { CategoryGrid } from "./CategoryGrid";
import { DisciplineGrid } from "./DisciplineGrid";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { EcommerceOfferBanner } from "./EcommerceOfferBanner";
import { EcommerceFooter } from "./EcommerceFooter";
import { MOCK_FEATURED_PRODUCTS } from "./mockData";
import { EcommerceProduct } from "./types";
import { useCartStore } from "@/stores/cartStore";

interface EcommerceHomeViewProps {
  initialProducts?: EcommerceProduct[];
}

export function EcommerceHomeView({ initialProducts }: EcommerceHomeViewProps) {
  const router = useRouter();
  // Use mock or real backend products
  const products = initialProducts && initialProducts.length > 0 ? initialProducts : MOCK_FEATURED_PRODUCTS;

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

  // Cart actions via persistent store
  const handleAddToCart = (product: EcommerceProduct) => {
    const variant =
      product.variants?.find((v) => v.inStock && v.availableStock > 0) ||
      product.variants?.[0];

    if (variant) {
      useCartStore.getState().addItem(
        {
          variantId: variant.id,
          productId: product.id,
          name: product.name,
          brand: product.brand,
          size: variant.size,
          color: variant.color,
          image: product.image || "/placeholder-product.svg",
          unitPrice: variant.price || product.price,
          maxAvailableStock: variant.availableStock,
        },
        1
      );
    } else {
      router.push(`/productos/${product.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header (includes persistent Cart Drawer) */}
      <EcommerceHeader
        onSearchChange={(q) => setSearchQuery(q)}
      />

      <main className="flex-1">
        {/* 2. Hero */}
        <EcommerceHero />

        {/* 3. Categorías Principales */}
        <CategoryGrid />

        {/* 4. Disciplinas y Deportes */}
        <DisciplineGrid
          selectedDiscipline={selectedDiscipline}
          onSelectDiscipline={(disc) => {
            setSelectedDiscipline(disc);
            const el = document.getElementById("productos");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
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
    </div>
  );
}
