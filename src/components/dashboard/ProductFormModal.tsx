"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Palette,
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
  getColorsWithStats,
} from "@/server/actions/categoryActions";
import { formatCurrency } from "@/lib/utils";
import { slugify } from "@/lib/textUtils";

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
  minStock: number;
  price?: number;
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

  // Estados para imagen con Blob
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Opciones cargadas desde la BD
  const [disciplines, setDisciplines] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [availableColors, setAvailableColors] = useState<{ id: string; name: string; hexCode?: string }[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>(["Negro"]);

  // Variantes
  const [variants, setVariants] = useState<FormVariant[]>([
    {
      size: "Único",
      color: "Negro",
      sku: "",
      barcode: "",
      stockStore: 1,
      stockWarehouse: 0,
      minStock: 2,
    },
  ]);

  // Estados de control y feedback
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Procesar archivo seleccionado
  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("La imagen no debe superar los 5 MB de tamaño");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Cargar disciplinas, categorías y marcas de la BD
    // Cargar disciplinas, categorías y marcas de la BD
  const loadSelectOptions = useCallback(async () => {
    setIsLoadingOptions(true);
    setErrorMessage(null);
    try {
      const [discRes, catRes, brandRes, colorRes] = await Promise.all([
        getDisciplines(),
        getCategories(),
        getBrands(),
        getColorsWithStats(),
      ]);

      if (discRes.success && discRes.data) setDisciplines(discRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (brandRes.success && brandRes.data) setBrands(brandRes.data);
      if (colorRes.success && colorRes.data) {
        setAvailableColors(colorRes.data);
      }

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
      setCostPrice(productToEdit.costPrice);
      setPrice(productToEdit.price);
      setImageUrl(productToEdit.imageUrl || null);
      setImagePreview(productToEdit.imageUrl || null);
      setImageFile(null);

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
            minStock: 2,
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
      setImagePreview(null);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setVariants([
        {
          size: "Único",
          color: "Negro",
          sku: "",
          barcode: "",
          stockStore: 1,
          stockWarehouse: 0,
          minStock: 2,
        },
      ]);
      setErrorMessage(null);
    }
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

  // Calcular margen en tiempo real
  const costNum = typeof costPrice === "number" ? costPrice : 0;
  const priceNum = typeof price === "number" ? price : 0;
  const profitMargin = priceNum - costNum;
  const marginPercentage =
    costNum > 0 ? ((profitMargin / costNum) * 100).toFixed(1) : "0.0";

  // Manejar variantes

  // Manejar alternancia de colores en el checklist
  const handleToggleColor = (colorName: string) => {
    const isSelected = selectedColors.includes(colorName);

    if (isSelected) {
      if (selectedColors.length <= 1) {
        // Al menos debe quedar un color
        return;
      }
      const updated = selectedColors.filter((c) => c !== colorName);
      setSelectedColors(updated);

      // Eliminar variantes de ese color si quedan otras variantes
      setVariants((currentVars) => {
        const remaining = currentVars.filter((v) => v.color !== colorName);
        return remaining.length > 0 ? remaining : currentVars;
      });
    } else {
      const updated = [...selectedColors, colorName];
      setSelectedColors(updated);

      // Agregar automáticamente una variante con este nuevo color
      setVariants((currentVars) => {
        const firstSize = currentVars[0]?.size || "Único";
        const newVar: FormVariant = {
          size: firstSize,
          color: colorName,
          sku: "",
          barcode: "",
          stockStore: 1,
          stockWarehouse: 0,
          minStock: 2,
        };
        return [...currentVars, newVar];
      });
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        size: "M",
        color: "Negro",
        sku: "",
        barcode: "",
        stockStore: 1,
        stockWarehouse: 0,
        minStock: 2,
      },
    ]);
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
  };

  // Enviar formulario (Guardar o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validaciones básicas antes de enviar
    if (!name.trim()) {
      setErrorMessage("Ingresa el nombre del producto.");
      return;
    }
    if (!disciplineId) {
      setErrorMessage("Selecciona una disciplina deportiva.");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Selecciona una categoría.");
      return;
    }
    if (!brandId) {
      setErrorMessage("Selecciona una marca.");
      return;
    }
    if (costNum <= 0) {
      setErrorMessage("El precio de costo debe ser mayor a $ 0.");
      return;
    }
    if (priceNum <= 0) {
      setErrorMessage("El precio de venta debe ser mayor a $ 0.");
      return;
    }
    if (priceNum < costNum) {
      setErrorMessage("El precio de venta no debería ser inferior al precio de costo.");
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = imageUrl;

    try {
      // 1. Subir imagen con Blob si hay un nuevo archivo seleccionado
      if (imageFile) {
        setIsUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append("file", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Fallo al subir la imagen con Blob");
        }

        const uploadJson = await uploadRes.json();
        finalImageUrl = uploadJson.url;
      }

      // 2. Formatear variantes (conservando ID si existía)
      const nameClean = slugify(name).replace(/-/g, "").slice(0, 3).toUpperCase() || "MAT";
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

      const formattedVariants = variants.map((v, i) => {
        const sizeClean = slugify(v.size).replace(/-/g, "").toUpperCase() || "UNI";
        const autoSku =
          v.sku && v.sku.trim() !== ""
            ? v.sku.trim()
            : `MAT-${nameClean}-${sizeClean}-${randomSuffix}${i > 0 ? `-${i + 1}` : ""}`;

        return {
          id: v.id,
          size: v.size.trim(),
          color: v.color.trim(),
          sku: autoSku,
          barcode: v.barcode && v.barcode.trim() !== "" ? v.barcode.trim() : null,
          stockStore: Number(v.stockStore) || 0,
          stockWarehouse: Number(v.stockWarehouse) || 0,
          minStoreStock: 1,
          minStock: Number(v.minStock) || 2,
        };
      });

      if (isEditing && productToEdit) {
        // Modo Actualización con Variantes e Imagen
        const res = await updateProduct({
          id: productToEdit.id,
          name: name.trim(),
          description: description.trim() || null,
          disciplineId,
          categoryId,
          brandId,
          costPrice: costNum,
          price: priceNum,
          imageUrl: finalImageUrl,
          variants: formattedVariants,
        });

        if (!res.success) {
          setErrorMessage(res.error || "No se pudo actualizar el producto");
          setIsSubmitting(false);
          setIsUploadingImage(false);
          return;
        }
      } else {
        // Modo Creación con Variantes e Imagen
        const res = await createProduct({
          name: name.trim(),
          description: description.trim() || null,
          disciplineId,
          categoryId,
          brandId,
          costPrice: costNum,
          price: priceNum,
          imageUrl: finalImageUrl,
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
        className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Alerta de Error */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium text-xs">{errorMessage}</span>
            </div>
          )}

          {/* 1. Datos Principales */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 text-[11px]">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Información General
            </h3>

            {/* Imagen del Producto (Blob Storage) */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Fotografía del Producto <span className="text-slate-400 font-normal">(Blob Storage)</span>
              </label>

              {imagePreview ? (
                <div className="relative group w-full sm:w-64 h-44 bg-slate-50 rounded-2xl border-2 border-emerald-200 overflow-hidden flex items-center justify-center p-3 shadow-2xs">
                  <img
                    src={imagePreview}
                    alt="Previsualización del producto"
                    className="max-h-full max-w-full object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Cambiar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/70 scale-[1.01]"
                      : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Haz clic para subir una foto
                    </span>
                    <span className="text-xs text-slate-500"> o arrastra la imagen aquí</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400">
                    Soporta PNG, JPG, WEBP o SVG (máximo 5 MB)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
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
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Antiparras Cobra Ultra Mirror / Zapatilla Gel-Rocket"
                className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                required
              />
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
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold">
                    Disciplina <span className="text-rose-500">*</span>
                  </label>
                  {isLoadingOptions && (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cargando...
                    </span>
                  )}
                </div>
                <select
                  value={disciplineId}
                  onChange={(e) => setDisciplineId(e.target.value)}
                  disabled={isLoadingOptions}
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium disabled:opacity-60 transition-opacity"
                  required
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold">
                    Categoría <span className="text-rose-500">*</span>
                  </label>
                  {isLoadingOptions && (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cargando...
                    </span>
                  )}
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isLoadingOptions}
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium disabled:opacity-60 transition-opacity"
                  required
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold">
                    Marca <span className="text-rose-500">*</span>
                  </label>
                  {isLoadingOptions && (
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Cargando...
                    </span>
                  )}
                </div>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  disabled={isLoadingOptions}
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium disabled:opacity-60 transition-opacity"
                  required
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
                  Precio de Costo (ARS) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={costPrice}
                  onChange={(e) =>
                    setCostPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="$ 0,00"
                  className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 font-bold"
                  required
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
                  onChange={(e) =>
                    setPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="$ 0,00"
                  className="w-full bg-slate-50 text-emerald-700 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              {/* Indicador de Margen Calculado */}
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 flex flex-col justify-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                  Margen Estimado: +{marginPercentage}%
                </span>
                <span className="text-xs font-bold text-emerald-950 mt-0.5">
                  Utilidad: {formatCurrency(Math.max(0, profitMargin))}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Asignación de Múltiples Colores con Checklist */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 text-[11px]">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  Asignar Colores al Producto (Checklist)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Marca las casillas de los colores disponibles. Cada color creará su variante para control de stock individual.
                </p>
              </div>

              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 w-fit">
                {selectedColors.length} {selectedColors.length === 1 ? "color asignado" : "colores asignados"}
              </span>
            </div>

            {/* Checklist interactivo con muestras de color */}
            <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex flex-wrap items-center gap-2 max-h-40 overflow-y-auto custom-scrollbar p-0.5">
                {availableColors.map((col) => {
                  const isChecked = selectedColors.includes(col.name);
                  return (
                    <label
                      key={col.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none active:scale-95 ${
                        isChecked
                          ? "bg-[#06241d] text-white border-emerald-500/60 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleColor(col.name)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer accent-emerald-500"
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-white/50 shadow-2xs shrink-0"
                        style={{ backgroundColor: col.hexCode || "#10b981" }}
                      />
                      <span>{col.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Variantes de Talle, Color y Stock Resultantes */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Variantes de Producto (Talles, Colores y Stock)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Administra las combinaciones de talle, color, código de barra y stock en salón/depósito.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Talle
              </button>
            </div>

            <div className="space-y-2.5">
              {variants.map((variant, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end"
                >
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Talle
                    </label>
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                      placeholder="41 / M / Único"
                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <span>Color</span>
                      {(() => {
                        const matchedCol = availableColors.find(
                          (c) => c.name.toLowerCase() === variant.color.toLowerCase()
                        );
                        if (matchedCol?.hexCode) {
                          return (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block"
                              style={{ backgroundColor: matchedCol.hexCode }}
                            />
                          );
                        }
                        return null;
                      })()}
                    </label>
                    <select
                      value={variant.color}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        handleVariantChange(idx, "color", newColor);
                        if (!selectedColors.includes(newColor)) {
                          setSelectedColors((prev) => [...prev, newColor]);
                        }
                      }}
                      className="w-full bg-white px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 cursor-pointer"
                      required
                    >
                      {availableColors.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      {!availableColors.some((c) => c.name === variant.color) && (
                        <option value={variant.color}>{variant.color}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Cód. Barra
                    </label>
                    <input
                      type="text"
                      value={variant.barcode}
                      onChange={(e) => handleVariantChange(idx, "barcode", e.target.value)}
                      placeholder="779..."
                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Salón
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={variant.stockStore}
                      onChange={(e) =>
                        handleVariantChange(idx, "stockStore", Number(e.target.value))
                      }
                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Depósito
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={variant.stockWarehouse}
                      onChange={(e) =>
                        handleVariantChange(idx, "stockWarehouse", Number(e.target.value))
                      }
                      className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"
                    />
                  </div>

                  <div className="flex justify-end">
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar este talle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
              className="bg-[#c2f25b] hover:bg-[#b0e838] active:scale-95 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
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

