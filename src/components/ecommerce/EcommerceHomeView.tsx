"use client";

import React, { useState } from "react";
import { EcommerceHeader } from "./EcommerceHeader";
import { EcommerceHero } from "./EcommerceHero";
import { CategoryGrid } from "./CategoryGrid";
import { DisciplineGrid } from "./DisciplineGrid";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { EcommerceOfferBanner } from "./EcommerceOfferBanner";
import { EcommerceFooter } from "./EcommerceFooter";
import { EcommerceCartDrawer, CartItem } from "./EcommerceCartDrawer";
import { MOCK_FEATURED_PRODUCTS } from "./mockData";
import { EcommerceProduct } from "./types";

interface EcommerceHomeViewProps {
  initialProducts?: EcommerceProduct[];
}

export function EcommerceHomeView({ initialProducts }: EcommerceHomeViewProps) {
  // Use mock or real backend products
  const products = initialProducts && initialProducts.length > 0 ? initialProducts : MOCK_FEATURED_PRODUCTS;

  // Cart state initialized with 2 demo items as displayed in mockup
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: products[0], quantity: 1 },
    { product: products[3], quantity: 1 },
  ]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
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
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartDrawerOpen(true)}
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
      <EcommerceCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
