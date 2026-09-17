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
  HelpCircle,
  Upload,
  Image as ImageIcon,
  Camera,
  RefreshCw,
  Check,
  Wand2,
  Star,
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
  const [generatingBarcodeIndex, setGeneratingBarcodeIndex] = useState<number | null>(null);

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
          productToEdit.variants.map((v) => ({
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
    const lastColor = variants[variants.length - 1]?.color || "Negro";
    const lastMinStore = variants[variants.length - 1]?.minStoreStock ?? 1;
    const lastMinStock = variants[variants.length - 1]?.minStock ?? 2;

    setVariants((prev) => [
      ...prev,
      {
        size: "",
        color: lastColor,
        sku: "",
        barcode: "",
        stockStore: 1,
        stockWarehouse: 0,
        minStoreStock: lastMinStore,
        minStock: lastMinStock,
        price: "", // Por defecto hereda el precio base general configurado arriba
      },
    ]);
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

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      setErrorMessage("El producto debe tener al menos una variante de talle/color.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof FormVariant,
    value: string | number
  ) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (typeof value === "string" && value.trim().length > 0) {
      fulfillFieldError(`variant_${index}_${field}`, field === "size" ? "talle" : "color");
    }
  };

  // Generar código EAN-13 correlativo oficial con prefijo GS1 200 (Circulación interna)
  const handleGenerateInternalBarcode = async (variantIndex: number) => {
    try {
      setGeneratingBarcodeIndex(variantIndex);

      // 1. Analizar códigos internos que ya existen en el formulario (React state) para evitar colisiones
      let maxFormSequence = 0;
      const assignedBarcodesInForm = new Set<string>();

      variants.forEach((v, idx) => {
        const b = v.barcode ? v.barcode.trim() : "";
        if (b) {
          if (idx !== variantIndex) {
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
        const fallbackSeed = (Math.floor(Date.now() / 1000) + variantIndex) % 900000000;
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

      handleVariantChange(variantIndex, "barcode", codeToUse);
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
  const handleSizeChange = (index: number, rawValue: string) => {
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

    handleVariantChange(index, "size", cleanValue);
  };

  // Enviar formulario (Guardar o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
      if (!v.size.trim()) errors[`variant_${idx}_size`] = true;
      if (!v.color.trim()) errors[`variant_${idx}_color`] = true;
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

      // Éxito: cerrar y refrescar tabla
      onSuccess(Boolean(isEditing && productToEdit));
      onClose();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setErrorMessage("Ocurrió un error inesperado al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-5xl rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-emerald-950 text-[#c2f25b] flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? "Actualiza los datos del catálogo y precios"
                  : "Carga un nuevo artículo al catálogo de Matacos Deportes"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
        <form noValidate onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
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
                  {isLoadingOptions ? (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cargando...
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCreateType("discipline");
                        setQuickCreateValue("");
                      }}
                      className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Nueva...</span>
                    </button>
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
                  {isLoadingOptions ? (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cargando...
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCreateType("category");
                        setQuickCreateValue("");
                      }}
                      className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Nueva...</span>
                    </button>
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
                  {isLoadingOptions ? (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cargando...
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCreateType("brand");
                        setQuickCreateValue("");
                      }}
                      className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Nueva...</span>
                    </button>
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

            {/* Banner Informativo: Precios Diferenciales y Alertas de Stock Mínimo por Ubicación */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-950">
              <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs">
                    Precios Diferenciales y Alertas de Stock Mínimo por Ubicación:
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  Todos los talles adoptan por defecto el <strong>Precio de Venta Base ({priceNum > 0 ? formatCurrency(priceNum) : "$ 0,00"})</strong>. Podés configurar umbrales de alerta independientes para cada ubicación física:
                </p>
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
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
            </div>

            <div className="space-y-2.5">
              {variants.map((variant, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-start gap-2.5"
                >
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-start">
                    {/* 1. Talle */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Talle <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.size}
                        onChange={(e) => handleSizeChange(idx, e.target.value)}
                        placeholder={isCrocsOrFootwear ? "Ej: 38, 40 o 4/6 (36)" : "41 / M / Único"}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          fieldErrors[`variant_${idx}_size`]
                            ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 text-slate-900"
                            : "bg-white border-slate-200 text-slate-900"
                        }`}
                      />
                    </div>

                    {/* 2. Color */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Color <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.color}
                        onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                        placeholder="Negro / Azul"
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          fieldErrors[`variant_${idx}_color`]
                            ? "bg-rose-50/40 border-rose-400 focus:bg-white focus:border-rose-500 text-slate-900"
                            : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    {/* 3. Precio Variante (Opcional / Diferencial) */}
                    <div className="col-span-2 sm:col-span-2">
                      <label
                        className="text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between"
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
                              idx,
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
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Cód. Barra
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={variant.barcode}
                          onChange={(e) => handleVariantChange(idx, "barcode", e.target.value)}
                          placeholder="779... / 200..."
                          className="w-full bg-white pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateInternalBarcode(idx)}
                          disabled={generatingBarcodeIndex === idx}
                          className="absolute right-1 p-0.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                          title="Generar código interno GS1 (Prefijo 200)"
                        >
                          <Wand2
                            className={`w-3.5 h-3.5 ${
                              generatingBarcodeIndex === idx ? "animate-spin text-emerald-600" : ""
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
                        type="number"
                        min="0"
                        value={variant.stockStore}
                        onChange={(e) =>
                          handleVariantChange(idx, "stockStore", Math.max(0, parseInt(e.target.value, 10) || 0))
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
                            idx,
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
                          handleVariantChange(idx, "stockWarehouse", Math.max(0, parseInt(e.target.value, 10) || 0))
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
                            idx,
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
                        onClick={() => handleRemoveVariant(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100/70 hover:text-rose-700 rounded-lg transition-colors"
                        title="Eliminar este talle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer del Formulario */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
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
    </div>
  );
}

