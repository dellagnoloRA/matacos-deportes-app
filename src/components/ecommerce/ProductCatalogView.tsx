"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { EcommerceProduct } from "./types";
import { ProductCatalogCard } from "./ProductCatalogCard";
import {
  ProductFiltersSidebar,
  FilterState,
  SizeGroup,
} from "./ProductFiltersSidebar";
import { ProductQuickViewModal } from "./ProductQuickViewModal";
import { EcommerceHeader } from "./EcommerceHeader";
import { EcommerceFooter } from "./EcommerceFooter";
import { EcommerceCartDrawer, CartItem } from "./EcommerceCartDrawer";
import {
  Filter,
  ChevronDown,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Familias canónicas de colores para agrupar tonos y variantes de productos (ej: Azul -> Azul Francia, Marino)
export interface ColorFamily {
  name: string;
  hex: string;
  keywords: string[];
}

export const COLOR_FAMILIES: ColorFamily[] = [
  {
    name: "Azul",
    hex: "#2563EB",
    keywords: ["azul", "marino", "navy", "royal", "francia", "celeste", "turquesa", "cian", "aqua", "petroleo", "petróleo"],
  },
  {
    name: "Negro",
    hex: "#111827",
    keywords: ["negro", "black", "azabache"],
  },
  {
    name: "Blanco",
    hex: "#FFFFFF",
    keywords: ["blanco", "white", "marfil", "crudo", "hueso", "tiza"],
  },
  {
    name: "Rojo",
    hex: "#DC2626",
    keywords: ["rojo", "red", "bordo", "bordó", "escarlata", "carmesi", "carmesí", "vino", "borgoña", "granate"],
  },
  {
    name: "Verde",
    hex: "#16A34A",
    keywords: ["verde", "green", "oliva", "militar", "lima", "menta", "esmeralda", "musgo"],
  },
  {
    name: "Gris",
    hex: "#6B7280",
    keywords: ["gris", "grey", "gray", "plateado", "plata", "grafito", "plomo", "ceniza", "melange"],
  },
  {
    name: "Rosa",
    hex: "#EC4899",
    keywords: ["rosa", "pink", "rosado", "fucsia", "fuchsia", "magenta", "chicle"],
  },
  {
    name: "Amarillo",
    hex: "#EAB308",
    keywords: ["amarillo", "yellow", "dorado", "oro", "mostaza"],
  },
  {
    name: "Naranja",
    hex: "#F97316",
    keywords: ["naranja", "orange", "coral", "salmon", "salmón"],
  },
  {
    name: "Violeta",
    hex: "#8B5CF6",
    keywords: ["violeta", "purple", "morado", "lila", "purpura", "púrpura", "lavanda"],
  },
  {
    name: "Marrón",
    hex: "#854D0E",
    keywords: ["marron", "marrón", "brown", "beige", "habano", "arena", "suela", "camel", "chocolate", "cafe", "café"],
  },
  {
    name: "Multicolor",
    hex: "#6366F1",
    keywords: ["multicolor", "estampado", "combinado", "rayado", "print"],
  },
];

export function getColorFamily(colorName: string): { name: string; hex: string } {
  if (!colorName) return { name: "Otro", hex: "#94A3B8" };
  const lower = colorName.toLowerCase().trim();

  for (const family of COLOR_FAMILIES) {
    if (family.keywords.some((kw) => lower.includes(kw))) {
      return { name: family.name, hex: family.hex };
    }
  }

  // Si no coincide con ninguna palabra clave, capitalizar el nombre del color
  const capitalized = colorName.charAt(0).toUpperCase() + colorName.slice(1);
  return { name: capitalized, hex: "#94A3B8" };
}

interface ProductCatalogViewProps {
  initialProducts?: EcommerceProduct[];
  initialCategory?: string;
  initialDiscipline?: string;
}

export function ProductCatalogView({
  initialProducts = [],
  initialCategory,
  initialDiscipline,
}: ProductCatalogViewProps) {
  // Productos base: EXCLUSIVAMENTE los provenientes de la base de datos PostgreSQL
  const allProducts = initialProducts;

  // Estado de filtros
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    discipline: initialDiscipline,
    brand: [],
    sizes: [],
    colors: [],
    gender: undefined,
    onlyInStock: true, // "En existencia" activo por defecto como en la Imagen 1
    onlyOffers: false,
    storePickupOnly: false,
    freeShippingOnly: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "relevancia" | "menor-precio" | "mayor-precio" | "descuento" | "novedades"
  >("relevancia");

  // Estado de UI
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<EcommerceProduct | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Carrito de compras iniciado vacío
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // 1. Determinar si existe un contexto activo (Categoría, Disciplina o Marca)
  // Regla: Talles y Colores NO deben aparecer a menos de que el usuario seleccione según catálogo, disciplina y marcas
  const hasActiveScopeForSizes = Boolean(
    filters.category ||
    filters.discipline ||
    (filters.brand && filters.brand.length > 0)
  );

  // Rango de precios mínimo y máximo dinámico según los productos de la base de datos
  const { minProductPrice, maxProductPrice } = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return { minProductPrice: 0, maxProductPrice: 250000 };
    }
    const prices = allProducts.map((p) => p.price);
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return {
      minProductPrice: Math.max(0, min),
      maxProductPrice: max > min ? max : min + 10000,
    };
  }, [allProducts]);

  // Etiqueta legible del contexto activo para el encabezado de los acordeones
  const activeScopeLabel = useMemo(() => {
    const parts: string[] = [];
    if (filters.discipline) parts.push(filters.discipline);
    if (filters.category) parts.push(filters.category);
    if (filters.brand && filters.brand.length > 0) parts.push(filters.brand.join(", "));
    return parts.length > 0 ? parts.join(" • ") : undefined;
  }, [filters.category, filters.discipline, filters.brand]);

  // 2. Extraer grupos de talles dinámicamente según las categorías reales de la base de datos
  // Solo se calcula y muestra si el usuario seleccionó según catálogo, disciplina o marcas
  const sizeGroups = useMemo<SizeGroup[]>(() => {
    if (!hasActiveScopeForSizes) return [];

    const groupMap = new Map<string, Map<string, number>>();

    for (const p of allProducts) {
      // Filtrar por categoría si el cliente la seleccionó
      const matchCategory =
        !filters.category ||
        p.category.toLowerCase() === filters.category.toLowerCase();

      // Filtrar por disciplina si fue seleccionada
      const matchDiscipline =
        !filters.discipline ||
        (p.discipline &&
          p.discipline.toLowerCase() === filters.discipline.toLowerCase());

      // Filtrar por marca si fue seleccionada
      const matchBrand =
        !filters.brand ||
        filters.brand.length === 0 ||
        (p.brand && filters.brand.includes(p.brand));

      if (matchCategory && matchDiscipline && matchBrand && p.sizes && Array.isArray(p.sizes)) {
        // Usar el nombre REAL de la categoría de la base de datos
        const categoryName = p.category || "General";
        let map = groupMap.get(categoryName);
        if (!map) {
          map = new Map<string, number>();
          groupMap.set(categoryName, map);
        }
        for (const s of p.sizes) {
          map.set(s.size, (map.get(s.size) || 0) + 1);
        }
      }
    }

    const result: SizeGroup[] = [];
    for (const [name, map] of groupMap.entries()) {
      // Regla: Solo mostrar la categoría si tiene más de un talle (> 1)
      if (map.size > 1) {
        const sizes = Array.from(map.entries())
          .map(([size, count]) => ({ size, count }))
          .sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }));

        result.push({
          name,
          sizes,
        });
      }
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts, hasActiveScopeForSizes, filters.category, filters.discipline, filters.brand]);

  // Lista plana de todos los talles de los grupos actuales
  const availableSizes = useMemo(() => {
    if (!hasActiveScopeForSizes) return [];
    const list: { size: string; count: number }[] = [];
    const seen = new Set<string>();
    for (const g of sizeGroups) {
      for (const s of g.sizes) {
        if (!seen.has(s.size)) {
          seen.add(s.size);
          list.push(s);
        }
      }
    }
    return list;
  }, [sizeGroups, hasActiveScopeForSizes]);

  // Extraer colores dinámicos AGRUPADOS en familias según el contexto activo (catálogo, disciplina, marcas)
  const availableColors = useMemo(() => {
    if (!hasActiveScopeForSizes) return [];

    // Mapeo: nombreFamilia -> { count: númeroDeProductosUnicos, hex: string, rawColors: Set<string> }
    const familyMap = new Map<string, { count: number; hex: string; rawColors: Set<string> }>();

    for (const p of allProducts) {
      const matchCategory =
        !filters.category ||
        p.category.toLowerCase() === filters.category.toLowerCase();

      const matchDiscipline =
        !filters.discipline ||
        (p.discipline &&
          p.discipline.toLowerCase() === filters.discipline.toLowerCase());

      const matchBrand =
        !filters.brand ||
        filters.brand.length === 0 ||
        (p.brand && filters.brand.includes(p.brand));

      if (matchCategory && matchDiscipline && matchBrand && p.colors && Array.isArray(p.colors)) {
        // Para cada producto, identificamos las familias únicas a las que pertenecen sus colores
        const productFamilies = new Map<string, { hex: string; rawColor: string }>();

        for (const c of p.colors) {
          if (!c) continue;
          const family = getColorFamily(c);
          if (!productFamilies.has(family.name)) {
            productFamilies.set(family.name, { hex: family.hex, rawColor: c });
          }
        }

        // Incrementamos el contador por familia exactamente una vez por producto
        for (const [familyName, { hex, rawColor }] of productFamilies.entries()) {
          const entry = familyMap.get(familyName) || {
            count: 0,
            hex,
            rawColors: new Set<string>(),
          };
          entry.count += 1;
          entry.rawColors.add(rawColor);
          familyMap.set(familyName, entry);
        }
      }
    }

    return Array.from(familyMap.entries())
      .map(([color, { count, hex, rawColors }]) => ({
        color, // Nombre de la familia (ej: "Azul")
        count, // Total de productos en la familia
        hex, // Muestra de color representativa
        shades: Array.from(rawColors), // Tonos específicos encontrados (ej: ["Azul Francia", "Marino"])
      }))
      .sort((a, b) => a.color.localeCompare(b.color));
  }, [allProducts, hasActiveScopeForSizes, filters.category, filters.discipline, filters.brand]);

  // Limpiar automáticamente talles seleccionados que ya no correspondan a la selección actual o si se desactiva el alcance
  useEffect(() => {
    if (!hasActiveScopeForSizes) {
      if (filters.sizes && filters.sizes.length > 0) {
        setFilters((prev) => ({ ...prev, sizes: [] }));
      }
      return;
    }
    if (filters.sizes && filters.sizes.length > 0) {
      const validSizeSet = new Set(availableSizes.map((s) => s.size));
      const filtered = filters.sizes.filter((s) => validSizeSet.has(s));
      if (filtered.length !== filters.sizes.length) {
        setFilters((prev) => ({ ...prev, sizes: filtered }));
      }
    }
  }, [hasActiveScopeForSizes, availableSizes, filters.sizes]);

  // Limpiar automáticamente colores seleccionados que ya no correspondan a la selección actual o si se desactiva el alcance
  useEffect(() => {
    if (!hasActiveScopeForSizes) {
      if (filters.colors && filters.colors.length > 0) {
        setFilters((prev) => ({ ...prev, colors: [] }));
      }
      return;
    }
    if (filters.colors && filters.colors.length > 0) {
      const validColorSet = new Set(availableColors.map((c) => c.color));
      const filtered = filters.colors.filter((c) => validColorSet.has(c));
      if (filtered.length !== filters.colors.length) {
        setFilters((prev) => ({ ...prev, colors: filtered }));
      }
    }
  }, [hasActiveScopeForSizes, availableColors, filters.colors]);

  // 3. Extracción de metadatos generales (Categorías, Marcas, Disciplinas, Colores)
  const filterOptions = useMemo(() => {
    const brandMap = new Map<string, number>();
    const catMap = new Map<string, number>();
    const discMap = new Map<string, number>();
    const colorMap = new Map<string, number>();

    let inStock = 0;
    let outOfStock = 0;

    for (const p of allProducts) {
      if (p.inStock !== false) {
        inStock++;
      } else {
        outOfStock++;
      }

      // Marcas
      if (p.brand) {
        brandMap.set(p.brand, (brandMap.get(p.brand) || 0) + 1);
      }

      // Categorías
      if (p.category) {
        catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
      }

      // Disciplinas
      if (p.discipline) {
        discMap.set(p.discipline, (discMap.get(p.discipline) || 0) + 1);
      }

      // Colores
      if (p.colors && Array.isArray(p.colors)) {
        for (const c of p.colors) {
          colorMap.set(c, (colorMap.get(c) || 0) + 1);
        }
      }
    }

    return {
      availableBrands: Array.from(brandMap.entries())
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => a.brand.localeCompare(b.brand)),
      availableCategories: Array.from(catMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => a.category.localeCompare(b.category)),
      availableDisciplines: Array.from(discMap.entries())
        .map(([discipline, count]) => ({ discipline, count }))
        .sort((a, b) => a.discipline.localeCompare(b.discipline)),
      availableColors: Array.from(colorMap.entries())
        .map(([color, count]) => ({ color, count }))
        .sort((a, b) => a.color.localeCompare(b.color)),
      inStockCount: inStock,
      outOfStockCount: outOfStock,
    };
  }, [allProducts]);

  // Filtrado y ordenamiento reactivo
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Buscador
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.discipline && p.discipline.toLowerCase().includes(q))
      );
    }

    // 2. Categoría
    if (filters.category) {
      result = result.filter(
        (p) => p.category.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    // 3. Disciplina
    if (filters.discipline) {
      result = result.filter(
        (p) => p.discipline?.toLowerCase() === filters.discipline?.toLowerCase()
      );
    }

    // 4. Marcas
    if (filters.brand && filters.brand.length > 0) {
      result = result.filter((p) => filters.brand?.includes(p.brand));
    }

    // 5. Talles
    if (filters.sizes && filters.sizes.length > 0) {
      result = result.filter((p) =>
        p.sizes?.some(
          (s) => filters.sizes?.includes(s.size) && s.inStock
        )
      );
    }

    // 6. Colores (Agrupados por familia de color: ej. tocar "Azul" incluye "Azul Francia", "Marino", etc.)
    if (filters.colors && filters.colors.length > 0) {
      result = result.filter((p) =>
        p.colors?.some((c) => {
          const family = getColorFamily(c);
          return (
            filters.colors?.includes(family.name) ||
            filters.colors?.includes(c)
          );
        })
      );
    }

    // 7. Disponibilidad (En existencia)
    if (filters.onlyInStock) {
      result = result.filter((p) => p.inStock !== false);
    }

    // 8. Solo ofertas / SALE
    if (filters.onlyOffers) {
      result = result.filter((p) => p.isOffer || (p.discountPercent && p.discountPercent > 0));
    }

    // 9. Retiro en local
    if (filters.storePickupOnly) {
      result = result.filter((p) => p.storePickup !== false);
    }

    // 10. Envío a domicilio
    if (filters.freeShippingOnly) {
      result = result.filter((p) => p.freeShipping === true);
    }

    // 11. Rango de Precio (Slider)
    if (filters.priceRange) {
      const [minP, maxP] = filters.priceRange;
      result = result.filter((p) => p.price >= minP && p.price <= maxP);
    }

    // 11. Ordenamiento
    if (sortBy === "menor-precio") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "mayor-precio") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "descuento") {
      result.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    } else if (sortBy === "novedades") {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return result;
  }, [allProducts, searchQuery, filters, sortBy]);

  // Manejo de Carrito
  const handleAddToCart = (product: EcommerceProduct, selectedSize?: string) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id
      );
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

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
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

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleClearFilters = () => {
    setFilters({
      category: undefined,
      discipline: undefined,
      brand: [],
      sizes: [],
      colors: [],
      gender: undefined,
      onlyInStock: false,
      onlyOffers: false,
      storePickupOnly: false,
      freeShippingOnly: false,
      priceRange: undefined,
    });
    setSearchQuery("");
  };

  // Quitar filtro activo específico
  const removeFilterChip = (type: string, value?: string) => {
    if (type === "onlyInStock") {
      setFilters((prev) => ({ ...prev, onlyInStock: false }));
    } else if (type === "category") {
      setFilters((prev) => ({ ...prev, category: undefined }));
    } else if (type === "discipline") {
      setFilters((prev) => ({ ...prev, discipline: undefined }));
    } else if (type === "onlyOffers") {
      setFilters((prev) => ({ ...prev, onlyOffers: false }));
    } else if (type === "storePickupOnly") {
      setFilters((prev) => ({ ...prev, storePickupOnly: false }));
    } else if (type === "freeShippingOnly") {
      setFilters((prev) => ({ ...prev, freeShippingOnly: false }));
    } else if (type === "priceRange") {
      setFilters((prev) => ({ ...prev, priceRange: undefined }));
    } else if (type === "brand" && value) {
      setFilters((prev) => ({
        ...prev,
        brand: prev.brand?.filter((b) => b !== value),
      }));
    } else if (type === "size" && value) {
      setFilters((prev) => ({
        ...prev,
        sizes: prev.sizes?.filter((s) => s !== value),
      }));
    } else if (type === "color" && value) {
      setFilters((prev) => ({
        ...prev,
        colors: prev.colors?.filter((c) => c !== value),
      }));
    }
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header Oficial de Matacos Deportes */}
      <EcommerceHeader
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartDrawerOpen(true)}
        onSearchChange={(q) => setSearchQuery(q)}
      />

      {/* 2. Breadcrumbs & Sub-header */}
      <div className="bg-white py-4 px-4 sm:px-8 lg:px-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <nav className="flex items-center gap-2">
            <Link href="/" className="hover:text-slate-700 transition-colors">
              Inicio
            </Link>
            <span>&gt;</span>
            <Link href="/productos" className="hover:text-slate-700 transition-colors">
              Catálogo
            </Link>
            {(filters.discipline || filters.category || (filters.brand && filters.brand.length > 0)) && (
              <>
                <span>&gt;</span>
                <span className="font-semibold text-slate-800">
                  {filters.discipline || filters.category || filters.brand?.[0]}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* 3. Contenedor Principal: Sidebar + Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grow">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Columna Izquierda: Sidebar de Filtros en Desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            <ProductFiltersSidebar
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={handleClearFilters}
              sizeGroups={sizeGroups}
              availableSizes={availableSizes}
              hasActiveScopeForSizes={hasActiveScopeForSizes}
              activeScopeLabel={activeScopeLabel}
              availableBrands={filterOptions.availableBrands}
              availableCategories={filterOptions.availableCategories}
              availableDisciplines={filterOptions.availableDisciplines}
              availableColors={availableColors}
              totalProductCount={filteredProducts.length}
              inStockCount={filterOptions.inStockCount}
              outOfStockCount={filterOptions.outOfStockCount}
              minPrice={minProductPrice}
              maxPrice={maxProductPrice}
            />
          </div>

          {/* Columna Derecha: Catálogo de Productos */}
          <div className="grow w-full space-y-4">
            {/* Barra Superior de Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              {/* Izquierda: Contador de artículos disponibles */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
                  <span>Filtros</span>
                </button>

                <span className="text-sm font-bold text-slate-800">
                  {filteredProducts.length} artículos disponibles
                </span>
              </div>

              {/* Derecha: Desplegable Ordenar Por */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="hidden sm:inline font-medium text-slate-500">Ordenar por:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-[#00D615] cursor-pointer shadow-2xs"
                  >
                    <option value="relevancia">Novedades y Destacados</option>
                    <option value="menor-precio">Menor precio</option>
                    <option value="mayor-precio">Mayor precio</option>
                    <option value="descuento">Mayor descuento</option>
                    <option value="novedades">Novedades</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Chips de Filtros Activos (Exacto a la captura) */}
            {Boolean(
              filters.category ||
              filters.discipline ||
              (filters.brand && filters.brand.length > 0) ||
              (filters.sizes && filters.sizes.length > 0) ||
              (filters.colors && filters.colors.length > 0) ||
              filters.priceRange
            ) && (
              <div className="flex flex-wrap items-center gap-2.5 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  FILTROS ACTIVOS:
                </span>

                {filters.discipline && (
                  <button
                    onClick={() => removeFilterChip("discipline")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-full transition-colors group cursor-pointer border border-slate-200 shadow-2xs"
                  >
                    <span>Disciplina: {filters.discipline}</span>
                    <X className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
                  </button>
                )}

                {filters.category && (
                  <button
                    onClick={() => removeFilterChip("category")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-full transition-colors group cursor-pointer border border-slate-200 shadow-2xs"
                  >
                    <span>Categoría: {filters.category}</span>
                    <X className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
                  </button>
                )}

                {filters.brand?.map((b) => (
                  <button
                    key={b}
                    onClick={() => removeFilterChip("brand", b)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-full transition-colors group cursor-pointer border border-slate-200 shadow-2xs"
                  >
                    <span>Marca: {b}</span>
                    <X className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
                  </button>
                ))}

                {filters.sizes?.map((s) => (
                  <button
                    key={s}
                    onClick={() => removeFilterChip("size", s)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-full transition-colors group cursor-pointer border border-slate-200 shadow-2xs"
                  >
                    <span>Talle: {s}</span>
                    <X className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
                  </button>
                ))}

                {filters.colors?.map((c) => (
                  <button
                    key={c}
                    onClick={() => removeFilterChip("color", c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-full transition-colors group cursor-pointer border border-slate-200 shadow-2xs"
                  >
                    <span>Color: {c}</span>
                    <X className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
                  </button>
                ))}

                {filters.priceRange && (
                  <button
                    onClick={() => removeFilterChip("priceRange")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-full transition-colors group cursor-pointer border border-slate-200 shadow-2xs"
                  >
                    <span>
                      Precio: {formatCurrency(filters.priceRange[0])} - {formatCurrency(filters.priceRange[1])}
                    </span>
                    <X className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer ml-1"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            )}


            {/* Grilla de Productos (columnas y espaciado compacto idéntico a la referencia) */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCatalogCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            ) : (
              /* Estado Vacío cuando no hay resultados */
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-4 my-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <Search className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    No encontramos productos que coincidan con tus filtros
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Probá desmarcar algunos filtros de talle, marca o disponibilidad para ver
                    más artículos del catálogo.
                  </p>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-[#06241d] hover:bg-slate-950 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Restablecer todos los filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4. Modal Móvil de Filtros (Drawer) */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white h-full overflow-y-auto overscroll-contain p-5 ml-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div>
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between pb-3 border-b border-slate-200 mb-4 pt-0.5">
                <span className="font-bold text-sm text-slate-900">Filtros</span>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ProductFiltersSidebar
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={handleClearFilters}
                sizeGroups={sizeGroups}
                availableSizes={availableSizes}
                hasActiveScopeForSizes={hasActiveScopeForSizes}
                activeScopeLabel={activeScopeLabel}
                availableBrands={filterOptions.availableBrands}
                availableCategories={filterOptions.availableCategories}
                availableDisciplines={filterOptions.availableDisciplines}
                availableColors={availableColors}
                totalProductCount={filteredProducts.length}
                inStockCount={filterOptions.inStockCount}
                outOfStockCount={filterOptions.outOfStockCount}
                minPrice={minProductPrice}
                maxPrice={maxProductPrice}
                isMobileModal={true}
                onCloseMobileModal={() => setIsMobileFiltersOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal de Vista Rápida */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 6. Drawer de Carrito */}
      <EcommerceCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
      />

      {/* 7. Footer Oficial */}
      <EcommerceFooter />
    </div>
  );
}
