"use client";

import React, { useState, useEffect } from "react";
import { WizardFormState, SizeGuideItem } from "@/components/admin/ProductCreateWizard/types";
import { LiveProductPreview } from "@/components/admin/ProductCreateWizard/LiveProductPreview";

const INITIAL_FORM: WizardFormState = {
  name: "",
  skuModel: "",
  slug: "",
  brandId: "",
  gender: "UNISEX",
  disciplineId: "",
  categoryId: "",
  tags: ["Nuevo"],
  generalImages: [],
  colorImages: {},
  price: 0,
  listPrice: null,
  costPrice: null,
  vatRate: 21,
  installments: 6,
  shortDescription: "",
  description: "",
  highlights: [],
  specs: {},
  useSizeGuide: true,
  sizeGuideId: null,
  variants: [],
  weightGrams: 500,
  dimensions: { length: 30, width: 20, height: 12 },
  status: "PUBLISHED",
};

interface PreviewSyncPayload {
  form: WizardFormState;
  brandName?: string;
  categoryName?: string;
  selectedSizeGuide?: SizeGuideItem | null;
}

export default function ProductStandalonePreviewPage() {
  const [data, setData] = useState<PreviewSyncPayload>({
    form: INITIAL_FORM,
    brandName: "",
    categoryName: "",
    selectedSizeGuide: null,
  });

  useEffect(() => {
    // 1. Cargar estado inicial desde localStorage si existe
    try {
      const stored = localStorage.getItem("matacos_product_preview_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.form) {
          setData(parsed);
        }
      }
    } catch (err) {
      console.warn("No se pudo leer el borrador inicial de preview:", err);
    }

    // 2. Conectar canal de Broadcast en tiempo real (instantáneo entre pestañas y ventanas)
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("matacos_product_preview");

      channel.onmessage = (event) => {
        if (event.data && event.data.type === "PREVIEW_DATA_UPDATE" && event.data.payload) {
          setData(event.data.payload);
        }
      };

      // Solicitar sincronización inmediata al formulario padre
      channel.postMessage({ type: "REQUEST_INITIAL_SYNC" });
    } catch (err) {
      console.warn("BroadcastChannel no soportado, utilizando storage events:", err);
    }

    // 3. Fallback con StorageEvent (por si BroadcastChannel no está disponible)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "matacos_product_preview_data" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.form) {
            setData(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* Contenido en vivo con slider / scroll nativo completo */}
      <div className="flex-1 overflow-hidden">
        <LiveProductPreview
          form={data.form}
          brandName={data.brandName}
          categoryName={data.categoryName}
          selectedSizeGuide={data.selectedSizeGuide}
        />
      </div>
    </div>
  );
}
