import { Metadata } from "next";
import { getPublicCatalog, getCatalogFacets } from "@/server/actions/ecommerce/catalogActions";
import { CatalogView } from "@/components/ecommerce/catalog/CatalogView";
import type { CatalogFilterInput } from "@/schemas/ecommerce";
import type {
  CatalogPagination,
  CatalogFacetsResponse,
} from "@/types/ecommerce";

export const metadata: Metadata = {
  title: "Catálogo Completo • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Catálogo digital oficial con stock en tiempo real. Natación Speedo, balones Mikasa, Crocs originales, calzado e indumentaria deportiva. Envíos a toda Argentina.",
};

// Revalidar cada 30 segundos
export const revalidate = 30;

interface CatalogoPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const resolvedParams = await searchParams;

  // Extraer y normalizar parámetros de URL
  const getString = (val: string | string[] | undefined) =>
    Array.isArray(val) ? val[0] : val;

  const filters: CatalogFilterInput = {
    disciplineSlug: getString(resolvedParams.disciplina) || undefined,
    categorySlug: getString(resolvedParams.categoria) || undefined,
    brandSlug: getString(resolvedParams.marca) || undefined,
    size: getString(resolvedParams.talle) || undefined,
    color: getString(resolvedParams.color) || undefined,
    minPrice: resolvedParams.minPrice ? Number(getString(resolvedParams.minPrice)) : undefined,
    maxPrice: resolvedParams.maxPrice ? Number(getString(resolvedParams.maxPrice)) : undefined,
    search: getString(resolvedParams.search) || getString(resolvedParams.q) || undefined,
    sort: (getString(resolvedParams.sort) as any) || "newest",
    page: resolvedParams.page ? Number(getString(resolvedParams.page)) : 1,
    limit: resolvedParams.limit ? Number(getString(resolvedParams.limit)) : 12,
  };

  const defaultPagination: CatalogPagination = {
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const defaultFacets: CatalogFacetsResponse = {
    disciplines: [],
    categories: [],
    brands: [],
    sizes: [],
    priceRange: { min: 0, max: 150000 },
  };

  try {
    const [catalogRes, facetsRes] = await Promise.all([
      getPublicCatalog(filters),
      getCatalogFacets(filters),
    ]);

    const products = catalogRes.success && catalogRes.data ? catalogRes.data.products : [];
    const pagination = catalogRes.success && catalogRes.data ? catalogRes.data.pagination : defaultPagination;
    const facets = facetsRes.success && facetsRes.data ? facetsRes.data : defaultFacets;

    return (
      <CatalogView
        products={products}
        pagination={pagination}
        facets={facets}
        activeFilters={filters}
      />
    );
  } catch (error) {
    console.error("Error al renderizar el catálogo:", error);
    return (
      <CatalogView
        products={[]}
        pagination={defaultPagination}
        facets={defaultFacets}
        activeFilters={filters}
      />
    );
  }
}

