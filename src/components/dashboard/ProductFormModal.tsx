"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Package,
  Layers,
  Tag,
  DollarSign,
  Barcode,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  Camera,
  RefreshCw,
  Check,
  Wand2,
  Star,
  Search,
  ChevronDown,
  Palette,
  Ruler,
  Store,
} from "lucide-react";
import { DetailedProductItem, ProductVariantItem } from "./types";
import {
  createProduct,
  updateProduct,
} from "@/server/actions/productActions";
import {
  getDisciplines,
  getCategories,
  getBrands,
  createDiscipline,
  createCategory,
  createBrand,
} from "@/server/actions/categoryActions";
import { formatCurrency } from "@/lib/utils";
import { slugify, generateDeterministicSku, generateModelCode } from "@/lib/textUtils";
import { generateEan13FromSequence, GS1_INTERNAL_PREFIX } from "@/lib/barcodeGenerator";
import { generateInternalBarcodes } from "@/server/actions/barcodeActions";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isEditing?: boolean) => void;
  productToEdit?: DetailedProductItem | null;
}

interface FormVariant {
  _clientId: string;
  id?: string;
  size: string;
  color: string;
  sku: string;
  barcode: string;
  stockStore: number;
  stockWarehouse: number;
  minStoreStock: number;
  minStock: number;
  price?: number | "";
}

export interface FormProductImage {
  id?: string;
  url: string;
  file?: File;
  previewUrl: string;
  color: string;
  isPrimary: boolean;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}: ProductFormModalProps) {
  const isEditing = Boolean(productToEdit);

  // Estados del formulario base
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");

  // Estados para galería de imágenes por color con Blob
  const [productImages, setProductImages] = useState<FormProductImage[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Opciones cargadas desde la BD
  const [disciplines, setDisciplines] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  // Variantes
  const [variants, setVariants] = useState<FormVariant[]>([
    {
      _clientId: "var_init_0",
      size: "Único",
      color: "Negro",
      sku: "",
      barcode: "",
      stockStore: 1,
      stockWarehouse: 0,
      minStoreStock: 1,
      minStock: 2,
      price: "",
    },
  ]);

  // Estados de control y feedback
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [generatingBarcodeIndex, setGeneratingBarcodeIndex] = useState<string | null>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const initialSnapshotRef = useRef<string | null>(null);

  // Estados para búsqueda y filtrado de variantes en el formulario
  const [variantSearchQuery, setVariantSearchQuery] = useState("");
  const [selectedColorFilter, setSelectedColorFilter] = useState("ALL");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState("ALL");
  const [selectedStockFilter, setSelectedStockFilter] = useState<
    "ALL" | "IN_STOCK" | "STORE_STOCK" | "WAREHOUSE_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
  >("ALL");

  // Estado para el banner informativo plegable (cerrado por defecto al abrir)
  const [isInfoBannerExpanded, setIsInfoBannerExpanded] = useState<boolean>(false);

  // Opciones disponibles de color y talle en base a las variantes actuales para los filtros
  const filterAvailableColors = useMemo(() => {
    const map = new Map<string, number>();
    variants.forEach((v) => {
      const c = (v.color || "").trim();
      if (c) {
        map.set(c, (map.get(c) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([color, count]) => ({ color, count }));
  }, [variants]);

  const filterAvailableSizes = useMemo(() => {
    const map = new Map<string, number>();
    variants.forEach((v) => {
      const s = (v.size || "").trim();
      if (s) {
        map.set(s, (map.get(s) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([size, count]) => ({ size, count }));
  }, [variants]);

  const hasActiveVariantFilters = useMemo(() => {
    return (
      variantSearchQuery.trim() !== "" ||
      selectedColorFilter !== "ALL" ||
      selectedSizeFilter !== "ALL" ||
      selectedStockFilter !== "ALL"
    );
  }, [variantSearchQuery, selectedColorFilter, selectedSizeFilter, selectedStockFilter]);

  // Variantes filtradas preservando su índice original para no alterar handleVariantChange(idx, ...)
  const filteredIndexedVariants = useMemo(() => {
    return variants
      .map((variant, originalIndex) => ({ variant, originalIndex }))
      .filter(({ variant }) => {
        // 1. Filtro por color
        if (
          selectedColorFilter !== "ALL" &&
          (variant.color || "").toLowerCase().trim() !== selectedColorFilter.toLowerCase().trim()
        ) {
          return false;
        }

        // 2. Filtro por talle
        if (
          selectedSizeFilter !== "ALL" &&
          (variant.size || "").toLowerCase().trim() !== selectedSizeFilter.toLowerCase().trim()
        ) {
          return false;
        }

        // 3. Filtro por disponibilidad de stock
        const salonStock = Number(variant.stockStore) || 0;
        const depStock = Number(variant.stockWarehouse) || 0;
        const totalStock = salonStock + depStock;
        const minSalon = Number(variant.minStoreStock) || 0;
        const minDep = Number(variant.minStock) || 0;

        if (selectedStockFilter === "IN_STOCK" && totalStock <= 0) return false;
        if (selectedStockFilter === "STORE_STOCK" && salonStock <= 0) return false;
        if (selectedStockFilter === "WAREHOUSE_STOCK" && depStock <= 0) return false;
        if (selectedStockFilter === "OUT_OF_STOCK" && totalStock > 0) return false;
        if (selectedStockFilter === "LOW_STOCK") {
          const isCriticalSalon = salonStock <= minSalon && minSalon > 0;
          const isCriticalDep = totalStock <= minDep && minDep > 0;
          if (!isCriticalSalon && !isCriticalDep) return false;
        }

        // 4. Búsqueda textual (talle, color, código de barras, SKU)
        if (variantSearchQuery.trim()) {
          const q = variantSearchQuery.toLowerCase().trim();
          const matchSize = (variant.size || "").toLowerCase().includes(q);
          const matchColor = (variant.color || "").toLowerCase().includes(q);
          const matchBarcode = (variant.barcode || "").toLowerCase().includes(q);
          const matchSku = (variant.sku || "").toLowerCase().includes(q);
          if (!matchSize && !matchColor && !matchBarcode && !matchSku) {
            return false;
          }
        }

        return true;
      });
  }, [variants, variantSearchQuery, selectedColorFilter, selectedSizeFilter, selectedStockFilter]);

  const fulfillFieldError = useCallback((fieldKey: string, messageKeyword?: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    if (messageKeyword) {
      setErrorMessage((prev) => {
        if (prev && prev.toLowerCase().includes(messageKeyword.toLowerCase())) {
          return null;
        }
        return prev;
      });
    }
  }, []);

  // Referencia y función para mensajes de error temporales (auto-cierre a los 5s, ej. duplicados)
  const temporaryErrorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setTemporaryErrorMessage = useCallback((msg: string) => {
    if (temporaryErrorTimerRef.current) {
      clearTimeout(temporaryErrorTimerRef.current);
    }
    setErrorMessage(msg);
    temporaryErrorTimerRef.current = setTimeout(() => {
      setErrorMessage((prev) => (prev === msg ? null : prev));
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (temporaryErrorTimerRef.current) {
        clearTimeout(temporaryErrorTimerRef.current);
      }
    };
  }, []);

  // Estados para creación rápida en línea de Disciplina, Categoría y Marca
  const [quickCreateType, setQuickCreateType] = useState<"discipline" | "category" | "brand" | null>(null);
  const [quickCreateValue, setQuickCreateValue] = useState("");
  const [isSavingQuickCreate, setIsSavingQuickCreate] = useState(false);

  // Temporizador para auto-ocultar mensajes de éxito a los 5 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Temporizador para auto-ocultar mensajes emergentes flotantes a los 5 segundos
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Lista dinámica de colores presentes en las variantes para asignar a las fotos
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => {
      const c = v.color?.trim();
      if (c && c.toLowerCase() !== "único" && c.toLowerCase() !== "unico") {
        set.add(c);
      }
    });
    return Array.from(set);
  }, [variants]);

  // Procesar archivos seleccionados (soporta selección múltiple)
  const processSelectedFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Por favor selecciona archivos de imagen válidos (PNG, JPG, WEBP, etc.)");
        continue;
      }
      if (file.size > 12 * 1024 * 1024) {
        setErrorMessage("Cada imagen no debe superar los 12 MB de tamaño");
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setProductImages((prev) => {
      const newItems: FormProductImage[] = validFiles.map((file, idx) => ({
        url: "",
        file,
        previewUrl: URL.createObjectURL(file),
        color: availableColors[0] || "General",
        isPrimary: prev.length === 0 && idx === 0,
      }));
      return [...prev, ...newItems];
    });

    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProductImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    setProductImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === indexToPrimary,
      }))
    );
  };

  const handleImageColorChange = (index: number, newColor: string) => {
    setProductImages((prev) =>
      prev.map((img, idx) => (idx === index ? { ...img, color: newColor } : img))
    );
  };

  // Cargar disciplinas, categorías y marcas de la BD
  const loadSelectOptions = useCallback(async () => {
    setIsLoadingOptions(true);
    setErrorMessage(null);
    try {
      const [discRes, catRes, brandRes] = await Promise.all([
        getDisciplines(),
        getCategories(),
        getBrands(),
      ]);

      if (discRes.success && discRes.data) setDisciplines(discRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (brandRes.success && brandRes.data) setBrands(brandRes.data);

      if (!discRes.success || !catRes.success || !brandRes.success) {
        console.warn("Advertencia al cargar opciones:", { discRes, catRes, brandRes });
      }
    } catch (err) {
      console.error("Error al cargar opciones:", err);
      setErrorMessage("No se pudieron cargar las opciones desde el servidor. Compruebe la conexión o vuelva a intentar.");
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSelectOptions();
    }
  }, [isOpen, loadSelectOptions]);

  // Precargar datos si se está editando
  useEffect(() => {
    // Al abrir el modal, el banner siempre inicia cerrado y los filtros limpios
    setIsInfoBannerExpanded(false);
    setVariantSearchQuery("");
    setSelectedColorFilter("ALL");
    setSelectedSizeFilter("ALL");
    setSelectedStockFilter("ALL");

    if (productToEdit && isOpen) {
      setName(productToEdit.name);
      setDescription(productToEdit.description || "");
      setCostPrice(
        productToEdit.costPrice !== null && productToEdit.costPrice !== undefined
          ? productToEdit.costPrice
          : ""
      );
      setPrice(productToEdit.price);
      setImageUrl(productToEdit.imageUrl || null);

      if (productToEdit.images && productToEdit.images.length > 0) {
        setProductImages(
          productToEdit.images.map((img, idx) => ({
            id: img.id,
            url: img.url,
            previewUrl: img.url,
            color: img.color || "General",
            isPrimary: img.isPrimary ?? (idx === 0),
          }))
        );
      } else if (productToEdit.imageUrl) {
        setProductImages([
          {
            url: productToEdit.imageUrl,
            previewUrl: productToEdit.imageUrl,
            color: "General",
            isPrimary: true,
          },
        ]);
      } else {
        setProductImages([]);
      }

      // Mapear variantes existentes
      if (productToEdit.variants && productToEdit.variants.length > 0) {
        setVariants(
          productToEdit.variants.map((v, idx) => ({
            _clientId: v.id || `var_edit_${idx}_${Date.now()}`,
            id: v.id,
            size: v.size,
            color: v.color,
            sku: v.sku || "",
            barcode: v.barcode || "",
            stockStore: v.stockStore,
            stockWarehouse: v.stockWarehouse,
            minStoreStock:
              v.minStoreStock !== undefined && v.minStoreStock !== null
                ? Number(v.minStoreStock)
                : productToEdit.minStoreStock ?? 1,
            minStock:
              v.minStock !== undefined && v.minStock !== null
                ? Number(v.minStock)
                : productToEdit.minStock || 2,
            price: v.price !== null && v.price !== undefined ? Number(v.price) : "",
          }))
        );
      }

      // Snapshot inicial para detección de cambios al editar
      const editImagesSnapshot =
        productToEdit.images && productToEdit.images.length > 0
          ? productToEdit.images.map((img, idx) => ({
              url: img.url,
              color: img.color || "General",
              isPrimary: img.isPrimary ?? (idx === 0),
            }))
          : productToEdit.imageUrl
          ? [{ url: productToEdit.imageUrl, color: "General", isPrimary: true }]
          : [];

      const editVariantsSnapshot = (productToEdit.variants || []).map((v) => ({
        size: v.size.trim(),
        color: v.color.trim(),
        sku: (v.sku || "").trim(),
        barcode: (v.barcode || "").trim(),
        stockStore: Number(v.stockStore) || 0,
        stockWarehouse: Number(v.stockWarehouse) || 0,
        minStoreStock:
          v.minStoreStock !== undefined && v.minStoreStock !== null
            ? Number(v.minStoreStock)
            : productToEdit.minStoreStock ?? 1,
        minStock:
          v.minStock !== undefined && v.minStock !== null
            ? Number(v.minStock)
            : productToEdit.minStock || 2,
        price: v.price !== null && v.price !== undefined ? Number(v.price) : "",
      }));

      initialSnapshotRef.current = JSON.stringify({
        name: productToEdit.name.trim(),
        description: (productToEdit.description || "").trim(),
        discipline: (productToEdit.discipline || "").trim().toLowerCase(),
        category: (productToEdit.category || "").trim().toLowerCase(),
        brand: (productToEdit.brand || "").trim().toLowerCase(),
        costPrice:
          productToEdit.costPrice !== null && productToEdit.costPrice !== undefined
            ? Number(productToEdit.costPrice)
            : 0,
        price: Number(productToEdit.price) || 0,
        images: editImagesSnapshot,
        variants: editVariantsSnapshot,
      });
    } else if (isOpen) {
      // Limpiar formulario en modo creación
      setName("");
      setDescription("");
      setDisciplineId("");
      setCategoryId("");
      setBrandId("");
      setCostPrice("");
      setPrice("");
      setImageUrl(null);
      setProductImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setVariants([
        {
          _clientId: `var_new_${Date.now()}_0`,
          size: "Único",
          color: "Negro",
          sku: "",
          barcode: "",
          stockStore: 1,
          stockWarehouse: 0,
          minStoreStock: 1,
          minStock: 2,
          price: "",
        },
      ]);
      setErrorMessage(null);

      initialSnapshotRef.current = JSON.stringify({
        name: "",
        description: "",
        discipline: "",
        category: "",
        brand: "",
        costPrice: 0,
        price: 0,
        images: [],
        variants: [
          {
            size: "Único",
            color: "Negro",
            sku: "",
            barcode: "",
            stockStore: 1,
            stockWarehouse: 0,
            minStoreStock: 1,
            minStock: 2,
            price: "",
          },
        ],
      });
    }

    if (!isOpen) {
      initialSnapshotRef.current = null;
      setShowUnsavedChangesDialog(false);
    }

    setFieldErrors({});
    setQuickCreateType(null);
    setQuickCreateValue("");
  }, [productToEdit, isOpen]);

  // Selección automática de IDs al editar si coinciden con los nombres
  useEffect(() => {
    if (productToEdit && disciplines.length > 0 && !disciplineId) {
      const match = disciplines.find(
        (d) => d.name.toLowerCase() === productToEdit.discipline.toLowerCase()
      );
      if (match) setDisciplineId(match.id);
    }
    if (productToEdit && categories.length > 0 && !categoryId) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === productToEdit.category.toLowerCase()
      );
      if (match) setCategoryId(match.id);
    }
    if (productToEdit && brands.length > 0 && !brandId) {
      const match = brands.find(
        (b) => b.name.toLowerCase() === productToEdit.brand.toLowerCase()
      );
      if (match) setBrandId(match.id);
    }
  }, [productToEdit, disciplines, categories, brands, disciplineId, categoryId, brandId]);

  // Detección contextual de Calzado y Crocs según Disciplina, Categoría o Marca
  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name || "";
  const selectedDisciplineName = disciplines.find((d) => d.id === disciplineId)?.name || "";
  const selectedBrandName = brands.find((b) => b.id === brandId)?.name || "";

  // Constructor de fotografía (snapshot) para detectar modificaciones en tiempo real
  const buildSnapshot = useCallback(
    (
      pName: string,
      pDesc: string,
      pDisc: string,
      pCat: string,
      pBrand: string,
      pCost: number | string,
      pPrice: number | string,
      pImages: FormProductImage[],
      pVariants: FormVariant[]
    ) => {
      return JSON.stringify({
        name: pName.trim(),
        description: pDesc.trim(),
        discipline: pDisc.trim().toLowerCase(),
        category: pCat.trim().toLowerCase(),
        brand: pBrand.trim().toLowerCase(),
        costPrice: typeof pCost === "number" ? pCost : parseFloat(String(pCost)) || 0,
        price: typeof pPrice === "number" ? pPrice : parseFloat(String(pPrice)) || 0,
        images: pImages.map((img) => ({
          url: img.url,
          color: img.color || "General",
          isPrimary: !!img.isPrimary,
        })),
        variants: pVariants.map((v) => ({
          size: v.size.trim(),
          color: v.color.trim(),
          sku: (v.sku || "").trim(),
          barcode: (v.barcode || "").trim(),
          stockStore: Number(v.stockStore) || 0,
          stockWarehouse: Number(v.stockWarehouse) || 0,
          minStoreStock: Number(v.minStoreStock) || 0,
          minStock: Number(v.minStock) || 0,
          price: v.price === "" ? "" : Number(v.price) || 0,
        })),
      });
    },
    []
  );

  const currentSnapshot = useMemo(() => {
    return buildSnapshot(
      name,
      description,
      selectedDisciplineName,
      selectedCategoryName,
      selectedBrandName,
      costPrice,
      price,
      productImages,
      variants
    );
  }, [
    name,
    description,
    selectedDisciplineName,
    selectedCategoryName,
    selectedBrandName,
    costPrice,
    price,
    productImages,
    variants,
    buildSnapshot,
  ]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialSnapshotRef.current) return false;
    return currentSnapshot !== initialSnapshotRef.current;
  }, [currentSnapshot]);

  // Manejador centralizado de intentos de cierre (para activar diálogo estilo Word si hay cambios)
  const handleRequestClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  // Interceptar tecla Escape para el diálogo o cierre
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showUnsavedChangesDialog) {
          setShowUnsavedChangesDialog(false);
        } else if (!quickCreateType) {
          handleRequestClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showUnsavedChangesDialog, quickCreateType, handleRequestClose]);

  const previewModelCode = useMemo(() => {
    if (!name.trim()) return "";
    return generateModelCode({
      brand: selectedBrandName || "MAT",
      category: selectedCategoryName || "GEN",
      discipline: selectedDisciplineName,
      productName: name,
    });
  }, [name, selectedBrandName, selectedCategoryName, selectedDisciplineName]);

  const isCrocsOrFootwear = useMemo(() => {
    const b = selectedBrandName.toLowerCase();
    const d = selectedDisciplineName.toLowerCase();
    const c = selectedCategoryName.toLowerCase();
    const n = name.toLowerCase();

    return (
      b.includes("crocs") ||
      d.includes("crocs") ||
      c.includes("crocs") ||
      d.includes("calzado") ||
      c.includes("calzado") ||
      n.includes("crocs") ||
      n.includes("zapatilla") ||
      n.includes("botin") ||
      n.includes("zueco")
    );
  }, [selectedBrandName, selectedDisciplineName, selectedCategoryName, name]);

  // Si cambia a disciplina/categoría/marca Crocs o Calzado y tiene variantes con "Único", se limpian a vacío
  useEffect(() => {
    if (isCrocsOrFootwear) {
      setVariants((prev) =>
        prev.map((v) =>
          v.size.toLowerCase() === "único" || v.size.toLowerCase() === "unico"
            ? { ...v, size: "" }
            : v
        )
      );
    }
  }, [isCrocsOrFootwear]);

  // Calcular margen en tiempo real
  const costNum = typeof costPrice === "number" && !isNaN(costPrice) ? costPrice : null;
  const priceNum = typeof price === "number" && !isNaN(price) ? price : 0;
  const hasCost = costNum !== null && costNum > 0;
  const profitMargin = hasCost ? priceNum - costNum : 0;
  const marginPercentage =
    hasCost && costNum ? ((profitMargin / costNum) * 100).toFixed(1) : "0.0";

  // Manejar variantes
  const handleAddVariant = () => {
    const referenceVariant = variants[0] || variants[variants.length - 1];
    const lastColor = referenceVariant?.color || "Negro";
    const lastMinStore = referenceVariant?.minStoreStock ?? 1;
    const lastMinStock = referenceVariant?.minStock ?? 2;
    const newClientId = `var_new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newVariant: FormVariant = {
      _clientId: newClientId,
      size: "",
      color: lastColor,
      sku: "",
      barcode: "",
      stockStore: 1,
      stockWarehouse: 0,
      minStoreStock: lastMinStore,
      minStock: lastMinStock,
      price: "",
    };

    // 1. Limpiar filtros activos para garantizar que la nueva variante sea inmediatamente visible arriba de todo
    setVariantSearchQuery("");
    setSelectedColorFilter("ALL");
    setSelectedSizeFilter("ALL");
    setSelectedStockFilter("ALL");

    // 2. Insertar la nueva variante al principio del array (índice 0, arriba de todos los talles)
    setVariants((prev) => [newVariant, ...prev]);

    // 3. Enfocar automáticamente el campo Talle de la nueva variante agregada arriba y asegurar visibilidad
    setTimeout(() => {
      const card = document.getElementById(`variant-card-${newClientId}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      const firstInput = (document.getElementById(`variant-size-${newClientId}`) ||
        document.getElementById("variant-size-0")) as HTMLInputElement | null;
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 60);
  };

  // Replicar los umbrales de stock mínimo de la primera variante a todas las demás
  const handleApplyMinStockToAll = () => {
    if (variants.length <= 1) return;
    const firstMinStore = variants[0]?.minStoreStock ?? 1;
    const firstMinStock = variants[0]?.minStock ?? 2;

    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        minStoreStock: firstMinStore,
        minStock: firstMinStock,
      }))
    );
    setSuccessMessage(
      `Se aplicó Mín. Local (${firstMinStore} un.) y Mín. Depósito (${firstMinStock} un.) a todos los talles.`
    );
  };

  const handleRemoveVariant = (target: number | string) => {
    if (variants.length <= 1) {
      setErrorMessage("El producto debe tener al menos una variante de talle/color.");
      return;
    }
    setVariants((prev) =>
      typeof target === "number"
        ? prev.filter((_, i) => i !== target)
        : prev.filter((v) => v._clientId !== target)
    );
  };

  const handleVariantChange = (
    target: number | string,
    field: keyof FormVariant,
    value: string | number
  ) => {
    setVariants((prev) => {
      return prev.map((item, idx) => {
        const matches = typeof target === "number" ? idx === target : item._clientId === target;
        if (!matches) return item;
        return { ...item, [field]: value };
      });
    });
    if (typeof value === "string" && value.trim().length > 0) {
      fulfillFieldError(`variant_${target}_${field}`, field === "size" ? "talle" : "color");
    }
  };

  // Generar código EAN-13 correlativo oficial con prefijo GS1 200 (Circulación interna)
  const handleGenerateInternalBarcode = async (target: number | string) => {
    try {
      const targetKey = String(target);
      setGeneratingBarcodeIndex(targetKey);

      // 1. Analizar códigos internos que ya existen en el formulario (React state) para evitar colisiones
      let maxFormSequence = 0;
      const assignedBarcodesInForm = new Set<string>();

      variants.forEach((v, idx) => {
        const isTarget = typeof target === "number" ? idx === target : v._clientId === target;
        const b = v.barcode ? v.barcode.trim() : "";
        if (b) {
          if (!isTarget) {
            assignedBarcodesInForm.add(b);
          }
          if (b.startsWith(GS1_INTERNAL_PREFIX) && b.length === 13 && /^\d{13}$/.test(b)) {
            const seq = parseInt(b.slice(3, 12), 10);
            if (!isNaN(seq) && seq > maxFormSequence) {
              maxFormSequence = seq;
            }
          }
        }
      });

      // 2. Consultar el próximo número correlativo en la base de datos
      let nextSeq = 1;
      try {
        const res = await generateInternalBarcodes({ count: 1, prefix: GS1_INTERNAL_PREFIX });
        if (res.success && typeof res.startSequence === "number") {
          nextSeq = res.startSequence;
        }
      } catch (err) {
        console.warn("Utilizando generador local de códigos GS1 EAN-13:", err);
        const fallbackSeed = Math.floor(Date.now() / 1000) % 900000000;
        nextSeq = Math.max(1, fallbackSeed);
      }

      // 3. Si en el formulario en pantalla ya usamos una secuencia igual o mayor, avanzar correlativamente
      if (maxFormSequence >= nextSeq) {
        nextSeq = maxFormSequence + 1;
      }

      // 4. Generar el código con el dígito verificador y garantizar unicidad
      let codeToUse = generateEan13FromSequence(nextSeq, GS1_INTERNAL_PREFIX);
      while (assignedBarcodesInForm.has(codeToUse)) {
        nextSeq++;
        codeToUse = generateEan13FromSequence(nextSeq, GS1_INTERNAL_PREFIX);
      }

      handleVariantChange(target, "barcode", codeToUse);
    } catch (err) {
      console.error("Error al generar código de barra:", err);
      setErrorMessage("No se pudo generar el código de barra correlativo.");
    } finally {
      setGeneratingBarcodeIndex(null);
    }
  };

  // Guardar nueva disciplina, categoría o marca creada de forma rápida
  const handleSaveQuickCreate = async (type: "discipline" | "category" | "brand") => {
    const trimmed = quickCreateValue.trim();
    if (!trimmed || trimmed.length < 2) {
      setTemporaryErrorMessage("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    // 1. Verificación client-side para evitar duplicados en el listado actual
    if (type === "discipline") {
      const duplicate = disciplines.some(
        (d) => d.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) {
        setTemporaryErrorMessage(`Ya existe la disciplina "${trimmed}" en el listado.`);
        return;
      }
    } else if (type === "category") {
      const duplicate = categories.some(
        (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) {
        setTemporaryErrorMessage(`Ya existe la categoría "${trimmed}" en el listado.`);
        return;
      }
    } else if (type === "brand") {
      const duplicate = brands.some(
        (b) => b.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) {
        setTemporaryErrorMessage(`Ya existe la marca "${trimmed}" en el listado.`);
        return;
      }
    }

    setIsSavingQuickCreate(true);
    setErrorMessage(null);

    try {
      if (type === "discipline") {
        const res = await createDiscipline({ name: trimmed });
        if (res.success && res.data) {
          const newItem = { id: res.data.id, name: res.data.name };
          setDisciplines((prev) => {
            const exists = prev.some((d) => d.id === newItem.id);
            if (exists) return prev;
            return [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name));
          });
          setDisciplineId(newItem.id);
          setQuickCreateType(null);
          setQuickCreateValue("");
          setErrorMessage(null);
          setSuccessMessage(`¡Disciplina "${newItem.name}" agregada con éxito!`);
        } else {
          const isDuplicate = res.error?.toLowerCase().includes("ya existe");
          setTemporaryErrorMessage(
            isDuplicate
              ? `Ya existe la disciplina "${trimmed}" en el listado.`
              : res.error || "No se pudo crear la disciplina."
          );
        }
      } else if (type === "category") {
        const res = await createCategory({ name: trimmed });
        if (res.success && res.data) {
          const newItem = { id: res.data.id, name: res.data.name };
          setCategories((prev) => {
            const exists = prev.some((c) => c.id === newItem.id);
            if (exists) return prev;
            return [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name));
          });
          setCategoryId(newItem.id);
          setQuickCreateType(null);
          setQuickCreateValue("");
          setErrorMessage(null);
          setSuccessMessage(`¡Categoría "${newItem.name}" agregada con éxito!`);
        } else {
          const isDuplicate = res.error?.toLowerCase().includes("ya existe");
          setTemporaryErrorMessage(
            isDuplicate
              ? `Ya existe la categoría "${trimmed}" en el listado.`
              : res.error || "No se pudo crear la categoría."
          );
        }
      } else if (type === "brand") {
        const res = await createBrand({ name: trimmed });
        if (res.success && res.data) {
          const newItem = { id: res.data.id, name: res.data.name };
          setBrands((prev) => {
            const exists = prev.some((b) => b.id === newItem.id);
            if (exists) return prev;
            return [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name));
          });
          setBrandId(newItem.id);
          setQuickCreateType(null);
          setQuickCreateValue("");
          setErrorMessage(null);
          setSuccessMessage(`¡Marca "${newItem.name}" agregada con éxito!`);
        } else {
          const isDuplicate = res.error?.toLowerCase().includes("ya existe");
          setTemporaryErrorMessage(
            isDuplicate
              ? `Ya existe la marca "${trimmed}" en el listado.`
              : res.error || "No se pudo crear la marca."
          );
        }
      }
    } catch (err) {
      console.error("Error al crear:", err);
      setTemporaryErrorMessage("Ocurrió un error inesperado al guardar.");
    } finally {
      setIsSavingQuickCreate(false);
    }
  };

  // Manejador del campo Talle: en Crocs/Calzado impide letras en tiempo real y alerta al usuario
  const handleSizeChange = (target: number | string, rawValue: string) => {
    let cleanValue = rawValue;

    if (isCrocsOrFootwear) {
      // Si el usuario intenta escribir letras
      if (/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(rawValue)) {
        setErrorMessage(
          "Para la disciplina Crocs no se permiten talles en letras. Ingrese únicamente números (ej. 38, 40 o 4/6 (36))."
        );
        // Filtrar y eliminar cualquier letra ingresada, permitiendo números y caracteres de formato (/, (), -, espacio)
        cleanValue = rawValue.replace(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g, "");
      }
    }

    handleVariantChange(target, "size", cleanValue);
  };

  // Ejecución centralizada de guardado (desde el formulario o desde el diálogo de confirmación)
  const executeSubmit = async () => {
    setErrorMessage(null);

    // Validación de modificaciones previas en modo edición
    if (isEditing && !hasUnsavedChanges) {
      setErrorMessage("No se detectaron modificaciones en el producto para guardar.");
      setShowUnsavedChangesDialog(false);
      return;
    }

    // Validaciones de campos obligatorios
    const errors: Record<string, boolean> = {};

    if (!name.trim() || name.trim().length < 3) {
      errors.name = true;
    }
    if (!disciplineId) {
      errors.disciplineId = true;
    }
    if (!categoryId) {
      errors.categoryId = true;
    }
    if (!brandId) {
      errors.brandId = true;
    }
    if (typeof costPrice === "number" && !isNaN(costPrice) && costPrice < 0) {
      errors.costPrice = true;
    }
    if (priceNum <= 0) {
      errors.price = true;
    }

    // Validar talle y color en cada variante
    variants.forEach((v, idx) => {
      if (!v.size.trim()) {
        errors[`variant_${idx}_size`] = true;
        errors[`variant_${v._clientId}_size`] = true;
      }
      if (!v.color.trim()) {
        errors[`variant_${idx}_color`] = true;
        errors[`variant_${v._clientId}_color`] = true;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name) {
        setErrorMessage("Por favor, ingresa el nombre del producto (mínimo 3 caracteres).");
      } else if (errors.disciplineId) {
        setErrorMessage("Por favor, selecciona una disciplina deportiva.");
      } else if (errors.categoryId) {
        setErrorMessage("Por favor, selecciona una categoría para el producto.");
      } else if (errors.brandId) {
        setErrorMessage("Por favor, selecciona una marca para el producto.");
      } else if (errors.costPrice) {
        setErrorMessage("El precio de costo no puede ser negativo.");
      } else if (errors.price) {
        setErrorMessage("El precio de venta debe ser mayor a $ 0,00.");
      } else {
        const hasMissingSize = Object.keys(errors).some((k) => k.endsWith("_size"));
        if (hasMissingSize) {
          setErrorMessage("Debes indicar el talle en todas las variantes (ej. 41, M o Único).");
        } else {
          setErrorMessage("Debes indicar el color en todas las variantes (ej. Negro, Azul).");
        }
      }
      return;
    }

    if (hasCost && costNum !== null && priceNum < costNum) {
      setFieldErrors({ price: true });
      setErrorMessage("El precio de venta base no debería ser inferior al precio de costo.");
      return;
    }

    // Validación preventiva: advertir si alguna variante tiene un precio diferencial menor al costo
    if (hasCost && costNum !== null) {
      const variantBelowCost = variants.find(
        (v) =>
          v.price !== "" &&
          v.price !== undefined &&
          Number(v.price) > 0 &&
          Number(v.price) < costNum
      );
      if (variantBelowCost) {
        setErrorMessage(
          `El precio diferencial del talle "${variantBelowCost.size || "seleccionado"}" (${formatCurrency(
            Number(variantBelowCost.price)
          )}) no debería ser inferior al precio de costo (${formatCurrency(costNum)}).`
        );
        return;
      }
    }

    // Validación estricta para Calzado y Crocs: no permitir 'Talle Único' ni solo letras (ej. S, M, L)
    if (isCrocsOrFootwear) {
      const invalidVariant = variants.find((v) => {
        const sz = v.size.trim().toLowerCase();
        if (!sz) return true;
        const isUnico =
          sz === "único" ||
          sz === "unico" ||
          sz === "u" ||
          sz.includes("unico") ||
          sz.includes("único");
        const hasNumbers = /\d/.test(sz);
        return isUnico || !hasNumbers;
      });

      if (invalidVariant) {
        setErrorMessage(
          `Para la disciplina Crocs no se permite "Talle Único" ni letras. El talle "${invalidVariant.size || "vacío"}" debe contener números (ej. 38, 40 o 4/6 (36)).`
        );
        return;
      }
    }

    setFieldErrors({});

    setIsSubmitting(true);

    try {
      // 1. Subir imágenes nuevas con Blob si tienen un archivo pendiente
      setIsUploadingImage(true);
      const finalImagesList: {
        id?: string;
        url: string;
        color?: string | null;
        isPrimary: boolean;
        order: number;
      }[] = [];

      for (let idx = 0; idx < productImages.length; idx++) {
        const item = productImages[idx];
        let finalUrl = item.url;

        if (item.file) {
          const uploadData = new FormData();
          uploadData.append("file", item.file);
          if (selectedBrandName) {
            uploadData.append("brand", selectedBrandName);
          }
          uploadData.append("productName", name || "producto");
          if (item.color && item.color !== "General") {
            uploadData.append("color", item.color);
          }
          uploadData.append("order", String(idx + 1));
          uploadData.append("isPrimary", String(item.isPrimary));

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json();
            throw new Error(errData.error || "Fallo al subir una de las imágenes con Blob");
          }

          const uploadJson = await uploadRes.json();
          finalUrl = uploadJson.url;
        }

        if (finalUrl) {
          finalImagesList.push({
            id: item.id,
            url: finalUrl,
            color: item.color === "General" ? null : item.color,
            isPrimary: item.isPrimary,
            order: idx,
          });
        }
      }
      setIsUploadingImage(false);

      const coverImageUrl =
        finalImagesList.find((img) => img.isPrimary)?.url ||
        finalImagesList[0]?.url ||
        imageUrl ||
        null;

      // 2. Formatear variantes (conservando ID si existía)
      const formattedVariants = variants.map((v, i) => {
        const autoSku =
          v.sku && v.sku.trim() !== ""
            ? v.sku.trim().toUpperCase()
            : generateDeterministicSku({
                brand: selectedBrandName || "MAT",
                category: selectedCategoryName || "GEN",
                discipline: selectedDisciplineName,
                productName: name,
                size: v.size,
                color: v.color,
                suffixIndex: i > 0 ? i + 1 : undefined,
              });

        return {
          id: v.id,
          size: v.size.trim(),
          color: v.color.trim(),
          sku: autoSku,
          barcode: v.barcode && v.barcode.trim() !== "" ? v.barcode.trim() : null,
          stockStore: Number(v.stockStore) || 0,
          stockWarehouse: Number(v.stockWarehouse) || 0,
          minStoreStock:
            typeof v.minStoreStock === "number" && !isNaN(v.minStoreStock)
              ? Math.max(0, v.minStoreStock)
              : 1,
          minStock:
            typeof v.minStock === "number" && !isNaN(v.minStock)
              ? Math.max(0, v.minStock)
              : 2,
          price: v.price !== "" && v.price !== undefined && Number(v.price) > 0 ? Number(v.price) : null,
        };
      });

      const canonicalModelCode =
        previewModelCode ||
        generateModelCode({
          brand: selectedBrandName || "MAT",
          category: selectedCategoryName || "GEN",
          discipline: selectedDisciplineName,
          productName: name,
        });

      if (isEditing && productToEdit) {
        // Modo Actualización con Variantes e Imágenes por Color
        const res = await updateProduct({
          id: productToEdit.id,
          name: name.trim(),
          description: description.trim() || null,
          modelCode: canonicalModelCode,
          disciplineId,
          categoryId,
          brandId,
          costPrice: costNum,
          price: priceNum,
          imageUrl: coverImageUrl,
          images: finalImagesList,
          variants: formattedVariants,
        });

        if (!res.success) {
          setErrorMessage(res.error || "No se pudo actualizar el producto");
          setIsSubmitting(false);
          setIsUploadingImage(false);
          return;
        }
      } else {
        // Modo Creación con Variantes e Imágenes por Color
        const res = await createProduct({
          name: name.trim(),
          description: description.trim() || null,
          modelCode: canonicalModelCode,
          disciplineId,
          categoryId,
          brandId,
          costPrice: costNum,
          price: priceNum,
          imageUrl: coverImageUrl,
          images: finalImagesList,
          active: true,
          variants: formattedVariants,
        });

        if (!res.success) {
          setErrorMessage(res.error || "No se pudo crear el producto");
          setIsSubmitting(false);
          setIsUploadingImage(false);
          return;
        }
      }

      // Éxito: limpiar snapshot, cerrar diálogo y refrescar tabla
      initialSnapshotRef.current = null;
      setShowUnsavedChangesDialog(false);
      onSuccess(Boolean(isEditing && productToEdit));
      onClose();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setErrorMessage("Ocurrió un error inesperado al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSubmit();
  };

  const handleConfirmSave = async () => {
    await executeSubmit();
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedChangesDialog(false);
    initialSnapshotRef.current = null;
    onClose();
  };

  // Atajo de teclado: Ctrl+S / Cmd+S para guardar inmediatamente desde cualquier campo
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        executeSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasUnsavedChanges, isEditing]);

  // Advertencia de navegador si el usuario intenta refrescar o cerrar la pestaña con cambios sin guardar
  useEffect(() => {
    if (!isOpen || !hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isOpen, hasUnsavedChanges]);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleRequestClose}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="relative bg-white w-full max-w-5xl rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal (Sticky con botón de Guardar a mano arriba a la derecha) */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5 border-b border-slate-200/90 bg-white/95 backdrop-blur-xs shadow-2xs shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-emerald-950 text-[#c2f25b] flex items-center justify-center shadow-xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight truncate">
                  {isEditing ? "Editar Producto" : "Nuevo Producto"}
                </h2>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 animate-in fade-in duration-150">
                    Cambios sin guardar
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {isEditing
                  ? "Actualiza los datos del catálogo y precios"
                  : "Carga un nuevo artículo al catálogo de Matacos Deportes"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón de Guardar accesible arriba a la derecha */}
            <button
              type="button"
              onClick={executeSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl border border-emerald-400/40 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
              title="Guardar producto inmediatamente (Atajo: Ctrl+S)"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isUploadingImage ? "Subiendo..." : "Guardando..."}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isEditing ? "Guardar Cambios" : "Crear Producto"}</span>
                </>
              )}
            </button>

            {/* Botón de Cierre / Cancelar */}
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Cerrar modal (Esc)"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Avisos de Alerta / Éxito (con botón X y auto-cierre a los 5s) */}
        {(errorMessage || successMessage) && (
          <div className="px-6 pt-4 shrink-0">
            {errorMessage && (
              <div className="flex items-center justify-between gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold text-xs leading-relaxed">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (temporaryErrorTimerRef.current) {
                      clearTimeout(temporaryErrorTimerRef.current);
                    }
                    setErrorMessage(null);
                    setFieldErrors({});
                  }}
                  className="p-1 text-rose-500 hover:text-rose-800 hover:bg-rose-100/80 rounded-lg transition-colors shrink-0"
                  title="Cerrar aviso"
                  aria-label="Cerrar aviso de error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {successMessage && (
              <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-xs leading-relaxed">{successMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="p-1 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100/80 rounded-lg transition-colors shrink-0"
                  title="Cerrar aviso"
                  aria-label="Cerrar aviso de éxito"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form Body */}
        <form
          noValidate
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Evitar que la tecla Enter (habitual en pistolas de código de barras USB y tipeo rápido)
            // dispare el submit involuntario del formulario
            if (e.key === "Enter") {
              const target = e.target as HTMLElement;
              if (target.tagName === "INPUT" || target.tagName === "SELECT") {
                e.preventDefault();
              }
            }
          }}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-xs"
        >
          {/* 1. Datos Principales */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 text-[11px]">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Información General
            </h3>

            {/* Galería de Fotografías del Producto (Blob Storage) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-700 font-semibold text-xs">
                  Fotografías y Galería por Color <span className="text-slate-400 font-normal">(Blob Storage)</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {productImages.length} foto(s) cargada(s)
                </span>
              </div>

              {/* Grid de miniaturas cargadas */}
              {productImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                  {productImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative bg-white rounded-xl border p-2 flex flex-col justify-between transition-all group shadow-2xs ${
                        img.isPrimary
                          ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Imagen Preview */}
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center p-1.5">
                        <img
                          src={img.previewUrl}
                          alt={`Foto ${idx + 1}`}
                          className="max-h-full max-w-full object-contain"
                        />
                        {/* Botón Borrar Flotante */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-md shadow-xs opacity-90 hover:opacity-100 transition-opacity"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Selector de Color y Portada */}
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-1">
                          <select
                            value={img.color}
                            onChange={(e) => handleImageColorChange(idx, e.target.value)}
                            className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
                            title="Asignar a un color de variante"
                          >
                            <option value="General">Portada General</option>
                            {availableColors.map((c) => (
                              <option key={c} value={c}>
                                Color: {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className={`w-full py-1 px-1.5 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all ${
                            img.isPrimary
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Star className={`w-3 h-3 ${img.isPrimary ? "fill-white" : ""}`} />
                          <span>{img.isPrimary ? "Principal" : "Hacer Principal"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Zona de Dropzone para subir / agregar más */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 select-none ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/70 scale-[1.01]"
                    : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50/80"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    {productImages.length > 0 ? "Agregar más fotos" : "Haz clic para subir fotos"}
                  </span>
                  <span className="text-xs text-slate-500"> o arrastra archivos aquí</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Selección múltiple permitida • PNG, JPG, WEBP, AVIF (conversión automática a WebP optimizado, máx. 12 MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,image/heic,image/heif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Nombre del Producto <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  if (val.trim().length >= 3) {
                    fulfillFieldError("name", "nombre");
                  }
                }}
                placeholder="Ej. Antiparras Cobra Ultra Mirror / Zapatilla Gel-Rocket"
                className={`w-full px-3.5 py-2.5 rounded-xl border transition-all font-medium ${
                  fieldErrors.name
                    ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900"
                    : "bg-slate-50 text-slate-900 border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                }`}
              />
              {previewModelCode && (
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5 px-0.5 animate-in fade-in">
                  <span className="flex items-center gap-1.5">
                    Código de Modelo:{" "}
                    <strong className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      {previewModelCode}
                    </strong>
                  </span>
                  <span className="text-[10.5px] text-slate-400 hidden sm:inline">
                    Raíz común de la familia
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Descripción Comercial <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Detalla características técnicas, materiales o recomendaciones..."
                className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium resize-none"
              />
            </div>

            {/* Selects: Disciplina, Categoría, Marca */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Disciplina */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold text-xs">
                    Disciplina <span className="text-rose-500">*</span>
                  </label>
                  {isLoadingOptions && (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cargando...
                    </span>
                  )}
                </div>

                {quickCreateType === "discipline" ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={quickCreateValue}
                      onChange={(e) => setQuickCreateValue(e.target.value)}
                      placeholder="Nueva disciplina..."
                      autoFocus
                      disabled={isSavingQuickCreate}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveQuickCreate("discipline");
                        } else if (e.key === "Escape") {
                          setQuickCreateType(null);
                          setQuickCreateValue("");
                        }
                      }}
                      className="flex-1 min-w-0 bg-white text-slate-900 px-3 py-2 text-xs rounded-xl border-2 border-emerald-500 focus:outline-none font-semibold shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveQuickCreate("discipline")}
                      disabled={isSavingQuickCreate || !quickCreateValue.trim()}
                      className="p-2.5 bg-[#c2f25b] hover:bg-[#b0e838] text-slate-950 rounded-xl transition-all active:scale-95 disabled:opacity-50 shrink-0 font-bold shadow-2xs"
                      title="Guardar disciplina"
                    >
                      {isSavingQuickCreate ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCreateType(null);
                        setQuickCreateValue("");
                      }}
                      disabled={isSavingQuickCreate}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={disciplineId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDisciplineId(val);
                        if (val) fulfillFieldError("disciplineId", "disciplina");
                      }}
                      disabled={isLoadingOptions}
                      className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border font-medium disabled:opacity-60 transition-all text-xs ${
                        fieldErrors.disciplineId
                          ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900"
                          : "bg-slate-50 text-slate-900 border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500"
                      }`}
                    >
                      <option value="">
                        {isLoadingOptions ? "Cargando disciplinas..." : "Seleccionar..."}
                      </option>
                      {disciplines.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCreateType("discipline");
                        setQuickCreateValue("");
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all shrink-0 active:scale-95 shadow-2xs"
                      title="Añadir nueva disciplina"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Categoría */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold text-xs">
                    Categoría <span className="text-rose-500">*</span>
                  </label>
                  {isLoadingOptions && (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cargando...
                    </span>
                  )}
                </div>

                {quickCreateType === "category" ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={quickCreateValue}
                      onChange={(e) => setQuickCreateValue(e.target.value)}
                      placeholder="Nueva categoría..."
                      autoFocus
                      disabled={isSavingQuickCreate}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveQuickCreate("category");
                        } else if (e.key === "Escape") {
                          setQuickCreateType(null);
                          setQuickCreateValue("");
                        }
                      }}
                      className="flex-1 min-w-0 bg-white text-slate-900 px-3 py-2 text-xs rounded-xl border-2 border-emerald-500 focus:outline-none font-semibold shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveQuickCreate("category")}
                      disabled={isSavingQuickCreate || !quickCreateValue.trim()}
                      className="p-2.5 bg-[#c2f25b] hover:bg-[#b0e838] text-slate-950 rounded-xl transition-all active:scale-95 disabled:opacity-50 shrink-0 font-bold shadow-2xs"
                      title="Guardar categoría"
                    >
                      {isSavingQuickCreate ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCreateType(null);
                        setQuickCreateValue("");
                      }}
                      disabled={isSavingQuickCreate}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCategoryId(val);
                        if (val) fulfillFieldError("categoryId", "categoría");
                      }}
                      disabled={isLoadingOptions}
                      className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border font-medium disabled:opacity-60 transition-all text-xs ${
                        fieldErrors.categoryId
                          ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900"
                          : "bg-slate-50 text-slate-900 border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500"
                      }`}
                    >
                      <option value="">
                        {isLoadingOptions ? "Cargando categorías..." : "Seleccionar..."}
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCreateType("category");
                        setQuickCreateValue("");
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all shrink-0 active:scale-95 shadow-2xs"
                      title="Añadir nueva categoría"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Marca */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold text-xs">
                    Marca <span className="text-rose-500">*</span>
                  </label>
                  {isLoadingOptions && (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cargando...
                    </span>
                  )}
                </div>

                {quickCreateType === "brand" ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={quickCreateValue}
                      onChange={(e) => setQuickCreateValue(e.target.value)}
                      placeholder="Nueva marca..."
                      autoFocus
                      disabled={isSavingQuickCreate}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveQuickCreate("brand");
                        } else if (e.key === "Escape") {
                          setQuickCreateType(null);
                          setQuickCreateValue("");
                        }
                      }}
                      className="flex-1 min-w-0 bg-white text-slate-900 px-3 py-2 text-xs rounded-xl border-2 border-emerald-500 focus:outline-none font-semibold shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveQuickCreate("brand")}
                      disabled={isSavingQuickCreate || !quickCreateValue.trim()}
                      className="p-2.5 bg-[#c2f25b] hover:bg-[#b0e838] text-slate-950 rounded-xl transition-all active:scale-95 disabled:opacity-50 shrink-0 font-bold shadow-2xs"
                      title="Guardar marca"
                    >
                      {isSavingQuickCreate ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCreateType(null);
                        setQuickCreateValue("");
                      }}
                      disabled={isSavingQuickCreate}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={brandId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBrandId(val);
                        if (val) fulfillFieldError("brandId", "marca");
                      }}
                      disabled={isLoadingOptions}
                      className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border font-medium disabled:opacity-60 transition-all text-xs ${
                        fieldErrors.brandId
                          ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900"
                          : "bg-slate-50 text-slate-900 border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500"
                      }`}
                    >
                      <option value="">
                        {isLoadingOptions ? "Cargando marcas..." : "Seleccionar..."}
                      </option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCreateType("brand");
                        setQuickCreateValue("");
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all shrink-0 active:scale-95 shadow-2xs"
                      title="Añadir nueva marca"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Precios y Margen de Ganancia */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 text-[11px]">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Precios y Rentabilidad
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Precio de Costo (ARS) <span className="text-slate-400 font-normal text-xs">(Opcional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={costPrice}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setCostPrice(val);
                    if (typeof val === "number" && val >= 0) {
                      fulfillFieldError("costPrice", "costo");
                    }
                  }}
                  placeholder="Sin costo (Opcional)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold transition-all ${
                    fieldErrors.costPrice
                      ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900"
                      : "bg-slate-50 text-slate-900 border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500"
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Precio de Venta Minorista (ARS) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setPrice(val);
                    if (typeof val === "number" && val > 0) {
                      fulfillFieldError("price", "venta");
                    }
                  }}
                  placeholder="$ 0,00"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold transition-all ${
                    fieldErrors.price
                      ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900"
                      : "bg-slate-50 text-emerald-700 border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500"
                  }`}
                />
              </div>

              {/* Indicador de Margen Calculado */}
              {hasCost ? (
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                    Margen Estimado: +{marginPercentage}%
                  </span>
                  <span className="text-xs font-bold text-emerald-950 mt-0.5">
                    Utilidad: {formatCurrency(Math.max(0, profitMargin))}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Margen Estimado
                  </span>
                  <span className="text-xs font-medium text-slate-400 mt-0.5">
                    Sin costo asignado (Opcional)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Variantes de Talle y Color (Creación y Edición) */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Variantes de Producto (Talles, Colores, Precios y Stock)
                </h3>
                {variants.some(
                  (v) =>
                    v.price !== "" &&
                    v.price !== undefined &&
                    Number(v.price) > 0 &&
                    Number(v.price) !== priceNum
                ) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {
                      variants.filter(
                        (v) =>
                          v.price !== "" &&
                          v.price !== undefined &&
                          Number(v.price) > 0 &&
                          Number(v.price) !== priceNum
                      ).length
                    }{" "}
                    con precio diferencial
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={handleApplyMinStockToAll}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors shrink-0"
                    title="Copiar los umbrales de stock mínimo del primer talle a todos los demás"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar mínimos a todos</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Talle
                </button>
              </div>
            </div>

            {/* Banner Informativo: Precios Diferenciales y Alertas de Stock Mínimo por Ubicación (Plegable / Cerrado por defecto) */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl overflow-hidden text-xs text-emerald-950 transition-all shadow-2xs">
              {/* Header clicable con icono, título y botón estilo acordeón */}
              <button
                type="button"
                onClick={() => setIsInfoBannerExpanded((prev) => !prev)}
                className="w-full p-3 flex items-center justify-between gap-2.5 hover:bg-emerald-100/50 transition-colors text-left cursor-pointer select-none"
                aria-expanded={isInfoBannerExpanded}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-900 text-xs truncate">
                    Precios Diferenciales y Alertas de Stock Mínimo por Ubicación:
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] shrink-0 bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs transition-colors">
                  <span>{isInfoBannerExpanded ? "Ocultar ayuda" : "¿Cómo funciona?"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isInfoBannerExpanded ? "rotate-180 text-emerald-900" : "text-emerald-700"
                    }`}
                  />
                </div>
              </button>

              {/* Contenido desplegable (Cerrado por defecto) */}
              {isInfoBannerExpanded && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-emerald-200/50 mt-1 animate-in fade-in duration-150">
                  <p className="text-[11px] text-emerald-800 mt-2 leading-relaxed">
                    Todos los talles adoptan por defecto el <strong>Precio de Venta Base ({priceNum > 0 ? formatCurrency(priceNum) : "$ 0,00"})</strong>. Podés configurar umbrales de alerta independientes para cada ubicación física:
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-emerald-200/60">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      <div>
                        <strong className="text-emerald-900">Mín. Local (Salón):</strong> Alerta de reposición interna cuando el salón tiene existencias iguales o inferiores a este valor y aún queda stock en depósito.
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 bg-white/80 p-2 rounded-lg border border-amber-200/60">
                      <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                      <div>
                        <strong className="text-amber-900">Mín. Depósito (Proveedor):</strong> Alerta crítica de compra a proveedor cuando las existencias totales (Salón + Depósito) alcanzan o caen por debajo de este valor.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de Búsqueda y Filtros de Variantes (idéntica a ProductDetailView) */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-2.5 shadow-2xs select-none">
              {/* Fila 1: Input de Búsqueda Omnibox con soporte lector de barras USB */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={variantSearchQuery}
                  onChange={(e) => setVariantSearchQuery(e.target.value)}
                  placeholder="Buscar por talle, color, cód. de barra (pistola USB) o SKU..."
                  className="w-full text-xs text-slate-800 placeholder-slate-400 pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-white focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 transition-all shadow-2xs focus:outline-none"
                  aria-label="Buscar variantes"
                />
                {variantSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setVariantSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Fila 2: Filtros Facetados (Color, Talle, Stock) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Filtro por Color */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-2xs ${
                    selectedColorFilter !== "ALL"
                      ? "border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-400/40"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">Color:</span>
                  <select
                    value={selectedColorFilter}
                    onChange={(e) => setSelectedColorFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                    aria-label="Filtrar por color"
                  >
                    <option value="ALL">Todos ({filterAvailableColors.length})</option>
                    {filterAvailableColors.map((c) => (
                      <option key={c.color} value={c.color}>
                        {c.color} ({c.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Talle */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-2xs ${
                    selectedSizeFilter !== "ALL"
                      ? "border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-400/40"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">Talle:</span>
                  <select
                    value={selectedSizeFilter}
                    onChange={(e) => setSelectedSizeFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                    aria-label="Filtrar por talle"
                  >
                    <option value="ALL">Todos ({filterAvailableSizes.length})</option>
                    {filterAvailableSizes.map((s) => (
                      <option key={s.size} value={s.size}>
                        Talle {s.size} ({s.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Estado de Stock */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-2xs ${
                    selectedStockFilter !== "ALL"
                      ? "border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-400/40"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">Stock:</span>
                  <select
                    value={selectedStockFilter}
                    onChange={(e) =>
                      setSelectedStockFilter(
                        e.target.value as
                          | "ALL"
                          | "IN_STOCK"
                          | "STORE_STOCK"
                          | "WAREHOUSE_STOCK"
                          | "LOW_STOCK"
                          | "OUT_OF_STOCK"
                      )
                    }
                    className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                    aria-label="Filtrar por disponibilidad de stock"
                  >
                    <option value="ALL">Todos los estados</option>
                    <option value="IN_STOCK">🟢 Con stock (&gt;0)</option>
                    <option value="STORE_STOCK">🏬 Salón Saavedra</option>
                    <option value="WAREHOUSE_STOCK">📦 En depósito</option>
                    <option value="LOW_STOCK">⚠️ Stock crítico</option>
                    <option value="OUT_OF_STOCK">❌ Agotados (0)</option>
                  </select>
                </div>
              </div>

              {/* Fila 3: Resumen de Filtros Activos */}
              {hasActiveVariantFilters && (
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60 text-xs animate-in fade-in duration-150">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Mostrando <strong>{filteredIndexedVariants.length}</strong> de <strong>{variants.length}</strong> variantes
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVariantSearchQuery("");
                      setSelectedColorFilter("ALL");
                      setSelectedSizeFilter("ALL");
                      setSelectedStockFilter("ALL");
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] hover:underline cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {filteredIndexedVariants.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-300 text-xs space-y-2 select-none">
                  <Search className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-800">
                    No se encontraron variantes que coincidan con los filtros
                  </p>
                  <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                    Probá cambiando los términos de búsqueda o limpiá los filtros para volver a ver todas las variantes del producto.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setVariantSearchQuery("");
                      setSelectedColorFilter("ALL");
                      setSelectedSizeFilter("ALL");
                      setSelectedStockFilter("ALL");
                    }}
                    className="mt-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <>
                  {filteredIndexedVariants.map(({ variant, originalIndex: idx }, renderIdx) => (
                    <div
                      key={variant._clientId}
                      id={`variant-card-${variant._clientId}`}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all animate-in fade-in duration-150 ${
                        !variant.id
                          ? "bg-emerald-50/40 border-emerald-300 shadow-2xs"
                          : "bg-slate-50/80 border-slate-200/70"
                      }`}
                    >
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-start">
                        {/* 1. Talle */}
                        <div className="col-span-1 sm:col-span-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Talle <span className="text-rose-500">*</span>
                            </label>
                            {!variant.id && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Nuevo
                              </span>
                            )}
                          </div>
                          <input
                            id={`variant-size-${variant._clientId}`}
                            type="text"
                            value={variant.size}
                            onChange={(e) => handleSizeChange(variant._clientId, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const next = document.getElementById(
                                  `variant-color-${variant._clientId}`
                                ) as HTMLInputElement | null;
                                if (next) {
                                  next.focus();
                                  next.select();
                                }
                              }
                            }}
                            placeholder={isCrocsOrFootwear ? "Ej: 38, 40 o 4/6 (36)" : "41 / M / Único"}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              fieldErrors[`variant_${variant._clientId}_size`] ||
                              fieldErrors[`variant_${idx}_size`]
                                ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 text-slate-900"
                                : "bg-white border-slate-200 text-slate-900"
                            }`}
                          />
                        </div>

                        {/* 2. Color */}
                        <div className="col-span-1 sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                            Color <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id={`variant-color-${variant._clientId}`}
                            type="text"
                            value={variant.color}
                            onChange={(e) => handleVariantChange(variant._clientId, "color", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const next = document.getElementById(
                                  `variant-barcode-${variant._clientId}`
                                ) as HTMLInputElement | null;
                                if (next) {
                                  next.focus();
                                  next.select();
                                }
                              }
                            }}
                            placeholder="Negro / Azul"
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              fieldErrors[`variant_${variant._clientId}_color`] ||
                              fieldErrors[`variant_${idx}_color`]
                                ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 text-slate-900"
                                : "bg-white border-slate-200 text-slate-800"
                            }`}
                          />
                        </div>

                        {/* 3. Precio Variante (Opcional / Diferencial) */}
                        <div className="col-span-2 sm:col-span-2">
                          <label
                            className="text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between mb-0.5"
                            title="Precio diferencial para este talle. Dejar vacío para usar el precio base."
                          >
                            <span className="flex items-center gap-1 text-emerald-800">
                              <Tag className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>Precio Dif.</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-normal">Opcional</span>
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-2 text-[11px] font-bold text-slate-400 select-none">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={variant.price !== undefined && variant.price !== null ? variant.price : ""}
                              onChange={(e) =>
                                handleVariantChange(
                                  variant._clientId,
                                  "price",
                                  e.target.value === "" ? "" : Number(e.target.value)
                                )
                              }
                              placeholder={priceNum > 0 ? `${priceNum}` : "Base"}
                              className={`w-full pl-5 pr-2 py-1.5 rounded-lg border text-xs font-bold transition-all focus:outline-none ${
                                variant.price !== "" &&
                                variant.price !== undefined &&
                                Number(variant.price) > 0
                                  ? "bg-emerald-50/40 border-emerald-400 text-emerald-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20"
                                  : "bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 focus:border-emerald-500"
                              }`}
                            />
                          </div>
                          {/* Micro-indicador de estado del precio */}
                          <div className="min-h-[14px] mt-0.5">
                            {variant.price !== "" &&
                            variant.price !== undefined &&
                            Number(variant.price) > 0 ? (
                              <span
                                className="text-[9px] font-bold text-emerald-700 truncate block"
                                title={`Precio específico para este talle: ${formatCurrency(
                                  Number(variant.price)
                                )}`}
                              >
                                {Number(variant.price) === priceNum
                                  ? "Igual al base"
                                  : Number(variant.price) > priceNum
                                  ? `+${formatCurrency(Number(variant.price) - priceNum)} vs base`
                                  : `-${formatCurrency(priceNum - Number(variant.price))} vs base`}
                              </span>
                            ) : (
                              <span
                                className="text-[9px] text-slate-400 truncate block"
                                title="Hereda el precio de venta base configurado arriba"
                              >
                                Hereda base ({priceNum > 0 ? formatCurrency(priceNum) : "—"})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 4. Cód. Barra */}
                        <div className="col-span-2 sm:col-span-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Cód. Barra
                            </label>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              id={`variant-barcode-${variant._clientId}`}
                              type="text"
                              value={variant.barcode}
                              onChange={(e) => handleVariantChange(variant._clientId, "barcode", e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  // Si la pistola de código de barras escanea y envía Enter:
                                  // Saltar automáticamente al código de barra de la siguiente variante
                                  if (renderIdx + 1 < filteredIndexedVariants.length) {
                                    const nextKey = filteredIndexedVariants[renderIdx + 1].variant._clientId;
                                    const nextInput = document.getElementById(
                                      `variant-barcode-${nextKey}`
                                    ) as HTMLInputElement | null;
                                    if (nextInput) {
                                      nextInput.focus();
                                      nextInput.select();
                                    }
                                  } else {
                                    // Si es la última variante, enfocar el stock en salón
                                    const stockInput = document.getElementById(
                                      `variant-stockStore-${variant._clientId}`
                                    ) as HTMLInputElement | null;
                                    if (stockInput) {
                                      stockInput.focus();
                                      stockInput.select();
                                    }
                                  }
                                }
                              }}
                              placeholder="779... / 200..."
                              className="w-full bg-white pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 focus:border-emerald-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleGenerateInternalBarcode(variant._clientId)}
                              disabled={generatingBarcodeIndex === variant._clientId}
                              className="absolute right-1 p-0.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                              title="Generar código interno GS1 (Prefijo 200)"
                            >
                              <Wand2
                                className={`w-3.5 h-3.5 ${
                                  generatingBarcodeIndex === variant._clientId ? "animate-spin text-emerald-600" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* 5. Stock Salón */}
                        <div className="col-span-1 sm:col-span-1">
                          <label
                            className="text-[10px] font-bold text-slate-500 uppercase text-center block mb-0.5 truncate"
                            title="Stock actual en Salón Saavedra 241"
                          >
                            Salón
                          </label>
                          <input
                            id={`variant-stockStore-${variant._clientId}`}
                            type="number"
                            min="0"
                            value={variant.stockStore}
                            onChange={(e) =>
                              handleVariantChange(
                                variant._clientId,
                                "stockStore",
                                Math.max(0, parseInt(e.target.value, 10) || 0)
                              )
                            }
                            title="Existencias actuales en Salón comercial"
                            className="w-full bg-white px-1.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-emerald-800 text-center focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* 6. Mínimo Alerta Salón / Local */}
                        <div className="col-span-1 sm:col-span-1">
                          <label
                            className="text-[10px] font-bold text-emerald-800 uppercase text-center block mb-0.5 truncate"
                            title="Umbral de alerta para reposición interna de mostrador (Salón <= este valor y hay en depósito)"
                          >
                            Mín. Local
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.minStoreStock !== undefined && variant.minStoreStock !== null ? variant.minStoreStock : 1}
                            onChange={(e) =>
                              handleVariantChange(
                                variant._clientId,
                                "minStoreStock",
                                e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                              )
                            }
                            title="Alerta de Reposición Interna: se activa si stock en mostrador <= este valor y hay en depósito"
                            className="w-full bg-emerald-50/70 px-1.5 py-1.5 rounded-lg border border-emerald-300 text-xs font-extrabold text-emerald-950 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-center"
                          />
                        </div>

                        {/* 7. Stock Depósito */}
                        <div className="col-span-1 sm:col-span-1">
                          <label
                            className="text-[10px] font-bold text-slate-500 uppercase text-center block mb-0.5 truncate"
                            title="Stock actual en Depósito interno"
                          >
                            Depósito
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.stockWarehouse}
                            onChange={(e) =>
                              handleVariantChange(
                                variant._clientId,
                                "stockWarehouse",
                                Math.max(0, parseInt(e.target.value, 10) || 0)
                              )
                            }
                            title="Existencias actuales en Depósito interno"
                            className="w-full bg-white px-1.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 text-center focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* 8. Mínimo Alerta Depósito / Proveedor */}
                        <div className="col-span-1 sm:col-span-1">
                          <label
                            className="text-[10px] font-bold text-amber-900 uppercase text-center block mb-0.5 truncate"
                            title="Umbral de alerta de compra a proveedor cuando existencias totales (Salón + Depósito) <= este valor"
                          >
                            Mín. Dep.
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.minStock !== undefined && variant.minStock !== null ? variant.minStock : 2}
                            onChange={(e) =>
                              handleVariantChange(
                                variant._clientId,
                                "minStock",
                                e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                              )
                            }
                            title="Alerta de Stock Crítico: compra a proveedor si existencias totales <= este valor"
                            className="w-full bg-amber-50/70 px-1.5 py-1.5 rounded-lg border border-amber-300 text-xs font-extrabold text-amber-950 focus:border-amber-500 focus:bg-white focus:outline-none transition-all text-center"
                          />
                        </div>
                      </div>

                      {/* 9. Botón Eliminar Talle al extremo derecho */}
                      {variants.length > 1 && (
                        <div className="pt-4 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(variant._clientId)}
                            className="p-1.5 text-rose-500 hover:bg-rose-100/70 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar este talle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Botón rápido al pie para agregar otro talle al tope */}
                  {variants.length > 1 && (
                    <div className="pt-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-200/80 hover:border-emerald-300 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar otro talle</span>
                      </button>
                    </div>
                  )}
                </>
              )}
          </div>
          </div>

          {/* Footer del Formulario */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] active:scale-95 text-white font-bold text-xs px-6 py-2.5 rounded-2xl border border-emerald-400/40 shadow-[0_2px_4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2 select-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isUploadingImage ? "Subiendo imagen con Blob..." : "Guardando..."}
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Producto"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Diálogo de Confirmación de Cambios sin Guardar (Estilo Word) */}
      {showUnsavedChangesDialog && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setShowUnsavedChangesDialog(false);
          }}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Barra superior estilo ventana */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                Matacos Deportes — Guardar cambios
              </span>
              <button
                type="button"
                onClick={() => setShowUnsavedChangesDialog(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-md transition-colors"
                title="Cerrar (Cancelar)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Diálogo */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200/70 shrink-0">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    ¿Desea guardar los cambios en &ldquo;{name.trim() || productToEdit?.name || "este producto"}&rdquo;?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Si elige &ldquo;No guardar&rdquo;, se descartarán todas las modificaciones realizadas en este producto y se restaurará su estado anterior.
                  </p>
                </div>
              </div>
            </div>

            {/* Botonera de 3 opciones estilo Word */}
            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </button>

              <button
                type="button"
                onClick={handleDiscardAndClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all"
              >
                No guardar
              </button>

              <button
                type="button"
                onClick={() => setShowUnsavedChangesDialog(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

