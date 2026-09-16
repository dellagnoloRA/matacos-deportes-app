"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  AlertTriangle,
  AlertOctagon,
  Store,
  Boxes,
  ArrowRightLeft,
  PackagePlus,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Building2,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { DetailedProductItem, ProductVariantItem } from "./types";
import { OperationType } from "./StockMovementModal";

export type DrawerAlertTab = "ALL" | "OUT_OF_STOCK" | "STORE_EMPTY" | "CRITICAL_LOW";

export interface EvaluatedVariantAlert {
  product: DetailedProductItem;
  variant: ProductVariantItem;
  variantId: string;
  sku: string;
  size: string;
  color: string;
  barcode: string;
  stockStore: number;
  stockWarehouse: number;
  stockTotal: number;
  minStock: number;
  alertLevel: "OUT_OF_STOCK" | "STORE_EMPTY_WAREHOUSE_AVAIL" | "CRITICAL_LOW" | "STORE_REPLENISHMENT";
  actionRequired: string;
}

export interface StockAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products?: DetailedProductItem[];
  onSelectProduct?: (productId: string) => void;
  onOpenStockMovement?: (
    product: DetailedProductItem,
    operation: OperationType,
    variantId?: string
  ) => void;
  onRefresh?: () => void;
}

export function StockAlertsDrawer({
  isOpen,
  onClose,
  products = [],
  onSelectProduct,
  onOpenStockMovement,
  onRefresh,
}: StockAlertsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerAlertTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Escuchar tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Manejador de recarga manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Evaluar todas las variantes en tiempo real a partir del catálogo
  const evaluatedAlerts = useMemo<EvaluatedVariantAlert[]>(() => {
    const alerts: EvaluatedVariantAlert[] = [];

    for (const product of products) {
      const minStock = product.minStock || 2;
      const variants = product.variants || [];

      if (variants.length === 0) {
        // Si el producto no tiene desglose de variantes, evaluar a nivel producto
        const store = product.stockLocal ?? 0;
        const warehouse = product.stockWeb ?? 0;
        const total = store + warehouse;

        let alertLevel: EvaluatedVariantAlert["alertLevel"] | null = null;
        let actionRequired = "";

        if (total === 0) {
          alertLevel = "OUT_OF_STOCK";
          actionRequired = "Agotado total. Generar orden de compra a proveedor.";
        } else if (store === 0 && warehouse > 0) {
          alertLevel = "STORE_EMPTY_WAREHOUSE_AVAIL";
          actionRequired = `Mostrador sin stock. Reponer urgente ${Math.min(warehouse, 4)} un. desde depósito.`;
        } else if (total <= minStock) {
          alertLevel = "CRITICAL_LOW";
          actionRequired = `Stock crítico (${total} un.). Solicitar compra preventiva a proveedor.`;
        }

        if (alertLevel) {
          alerts.push({
            product,
            variant: {
              size: "Único",
              color: "Estándar",
              barcode: product.barcode,
              stockStore: store,
              stockWarehouse: warehouse,
            },
            variantId: product.id,
            sku: product.sku,
            size: "Único",
            color: "Estándar",
            barcode: product.barcode,
            stockStore: store,
            stockWarehouse: warehouse,
            stockTotal: total,
            minStock,
            alertLevel,
            actionRequired,
          });
        }
      } else {
        // Evaluar cada variante individualmente
        for (const v of variants) {
          const store = v.stockStore ?? 0;
          const warehouse = v.stockWarehouse ?? 0;
          const total = store + warehouse;
          const variantMinStock = v.minStock ?? minStock;
          const variantMinStore = v.minStoreStock ?? (product.minStoreStock ?? 1);

          let alertLevel: EvaluatedVariantAlert["alertLevel"] | null = null;
          let actionRequired = "";

          if (total === 0) {
            alertLevel = "OUT_OF_STOCK";
            actionRequired = "Agotado total. Generar orden de compra a proveedor.";
          } else if (store === 0 && warehouse > 0) {
            alertLevel = "STORE_EMPTY_WAREHOUSE_AVAIL";
            actionRequired = `Mostrador sin stock. Reponer urgente ${Math.min(warehouse, Math.max(variantMinStore * 2, 2))} un. desde depósito.`;
          } else if (total <= variantMinStock) {
            alertLevel = "CRITICAL_LOW";
            actionRequired = `Stock crítico (${total} un.). Solicitar compra preventiva a proveedor.`;
          } else if (store <= variantMinStore && warehouse > 0) {
            alertLevel = "STORE_REPLENISHMENT";
            actionRequired = `Salón bajo (${store} un. <= mín. ${variantMinStore}). Trasladar unidades de depósito a salón.`;
          }

          if (alertLevel) {
            alerts.push({
              product,
              variant: v,
              variantId: v.id || `${product.id}-${v.size}-${v.color}`,
              sku: v.sku || product.sku,
              size: v.size,
              color: v.color,
              barcode: v.barcode || product.barcode,
              stockStore: store,
              stockWarehouse: warehouse,
              stockTotal: total,
              minStock,
              alertLevel,
              actionRequired,
            });
          }
        }
      }
    }

    // Orden de criticidad: 1) Agotados, 2) Mostrador Vacío, 3) Stock Crítico, 4) Reposición Preventiva
    const orderMap: Record<EvaluatedVariantAlert["alertLevel"], number> = {
      OUT_OF_STOCK: 1,
      STORE_EMPTY_WAREHOUSE_AVAIL: 2,
      CRITICAL_LOW: 3,
      STORE_REPLENISHMENT: 4,
    };

    return alerts.sort((a, b) => orderMap[a.alertLevel] - orderMap[b.alertLevel]);
  }, [products]);

  // Contadores por categoría de alerta
  const counters = useMemo(() => {
    let outOfStock = 0;
    let storeEmpty = 0;
    let criticalLow = 0;

    for (const a of evaluatedAlerts) {
      if (a.alertLevel === "OUT_OF_STOCK") outOfStock++;
      else if (a.alertLevel === "STORE_EMPTY_WAREHOUSE_AVAIL") storeEmpty++;
      else if (a.alertLevel === "CRITICAL_LOW" || a.alertLevel === "STORE_REPLENISHMENT") criticalLow++;
    }

    return {
      total: evaluatedAlerts.length,
      outOfStock,
      storeEmpty,
      criticalLow,
    };
  }, [evaluatedAlerts]);

  // Filtrar según la pestaña activa y el buscador de texto
  const filteredAlerts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return evaluatedAlerts.filter((item) => {
      // Filtro por pestaña
      let tabMatch = true;
      if (activeTab === "OUT_OF_STOCK") {
        tabMatch = item.alertLevel === "OUT_OF_STOCK";
      } else if (activeTab === "STORE_EMPTY") {
        tabMatch = item.alertLevel === "STORE_EMPTY_WAREHOUSE_AVAIL";
      } else if (activeTab === "CRITICAL_LOW") {
        tabMatch = item.alertLevel === "CRITICAL_LOW" || item.alertLevel === "STORE_REPLENISHMENT";
      }

      if (!tabMatch) return false;

      // Filtro por texto
      if (!q) return true;

      const matchName = item.product.name.toLowerCase().includes(q);
      const matchBrand = item.product.brand.toLowerCase().includes(q);
      const matchCategory = item.product.category.toLowerCase().includes(q);
      const matchDiscipline = item.product.discipline.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchBarcode = item.barcode.toLowerCase().includes(q);
      const matchSize = item.size.toLowerCase().includes(q);
      const matchColor = item.color.toLowerCase().includes(q);

      return (
        matchName ||
        matchBrand ||
        matchCategory ||
        matchDiscipline ||
        matchSku ||
        matchBarcode ||
        matchSize ||
        matchColor
      );
    });
  }, [evaluatedAlerts, activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Telón de fondo con blur */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer deslizante desde la derecha */}
      <aside className="fixed inset-y-0 right-0 w-full max-w-xl md:max-w-2xl bg-white shadow-2xl flex flex-col z-50 border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Cabecera del Drawer */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Alertas de Stock Crítico
                </h2>
                {counters.total > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500 text-white animate-pulse">
                    {counters.total} {counters.total === 1 ? "alerta" : "alertas"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Saavedra 241 y Depósito Central Formosa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Actualizar alertas"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Cerrar panel de alertas (Esc)"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación y Buscador Interno */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 bg-white space-y-3 shrink-0">
          {/* Pestañas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              Todas las Alertas ({counters.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("OUT_OF_STOCK")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === "OUT_OF_STOCK"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              Agotados ({counters.outOfStock})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("STORE_EMPTY")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === "STORE_EMPTY"
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200"
              }`}
            >
              Urgente Mostrador ({counters.storeEmpty})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CRITICAL_LOW")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === "CRITICAL_LOW"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              Stock Crítico ({counters.criticalLow})
            </button>
          </div>

          {/* Input de Búsqueda rápida dentro del drawer */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por producto, marca, talle, color o código de barra..."
              className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-8 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Alertas Desplazable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#f8fafc]">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 mt-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {searchQuery
                    ? "Sin resultados para la búsqueda"
                    : activeTab === "ALL"
                    ? "¡Inventario en estado óptimo!"
                    : "No hay artículos en esta categoría de alerta"}
                </h4>
                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No se encontraron variantes en alerta que coincidan con "${searchQuery}".`
                    : activeTab === "ALL"
                    ? "Todas las variantes en Saavedra 241 y Depósito Central cuentan con niveles de stock saludables."
                    : "No hay productos que cumplan con la condición seleccionada en este momento."}
                </p>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                  Limpiar filtro de búsqueda
                </button>
              )}
            </div>
          ) : (
            filteredAlerts.map((alert, index) => {
              const isOutOfStock = alert.alertLevel === "OUT_OF_STOCK";
              const isStoreEmpty = alert.alertLevel === "STORE_EMPTY_WAREHOUSE_AVAIL";
              const isCriticalLow = alert.alertLevel === "CRITICAL_LOW";

              return (
                <div
                  key={`${alert.variantId}-${index}`}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all space-y-3"
                >
                  {/* Fila 1: Cabecera con Distintivo de Nivel de Alerta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {alert.product.brand}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">
                          {alert.product.category}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {alert.product.discipline}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                        {alert.product.name}
                      </h4>
                    </div>

                    {/* Insignia de Criticidad según Código de Colores */}
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Agotado Total</span>
                      </span>
                    ) : isStoreEmpty ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-orange-100 text-orange-800 border border-orange-300 shrink-0">
                        <Store className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span>Mostrador Vacío</span>
                      </span>
                    ) : isCriticalLow ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Stock Crítico</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        <Boxes className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Reponer Salón</span>
                      </span>
                    )}
                  </div>

                  {/* Fila 2: Variante, Talle, Color y Códigos */}
                  <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Talle:</span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-xs">
                        {alert.size}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Color:</span>
                      <span className="font-semibold text-slate-700">
                        {alert.color}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto font-mono text-[11px] text-slate-500">
                      <span>Cód:</span>
                      <span className="font-semibold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {alert.barcode || alert.sku}
                      </span>
                    </div>
                  </div>

                  {/* Fila de Acción y Alerta de Stock Local */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    {/* Alerta de ubicación con poco stock */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {alert.stockStore === 0 ? (
                        <div className="px-2.5 py-1 rounded-lg border bg-rose-50 border-rose-200 text-rose-900 inline-flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 font-medium">Saavedra 241</span>
                          <span className="font-black text-rose-700">0 un.</span>
                          {alert.stockWarehouse > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-700 ml-0.5">
                              (Hay {alert.stockWarehouse} en dep.)
                            </span>
                          )}
                        </div>
                      ) : alert.stockStore <= (alert.variant.minStoreStock ?? 1) ? (
                        <div className="px-2.5 py-1 rounded-lg border bg-amber-50 border-amber-200 text-amber-900 inline-flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 font-medium">Saavedra 241</span>
                          <span className="font-black text-amber-700">{alert.stockStore} un.</span>
                          {alert.stockWarehouse > 0 && (
                            <span className="text-[11px] font-medium text-slate-600 ml-0.5">
                              (Dep: {alert.stockWarehouse} un.)
                            </span>
                          )}
                        </div>
                      ) : alert.stockWarehouse === 0 ? (
                        <div className="px-2.5 py-1 rounded-lg border bg-rose-50 border-rose-200 text-rose-900 inline-flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 font-medium">Depósito Central</span>
                          <span className="font-black text-rose-700">0 un.</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-lg border bg-amber-50 border-amber-200 text-amber-900 inline-flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 font-medium">Stock crítico</span>
                          <span className="font-black text-amber-700">{alert.stockTotal} un.</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de Acción Directa */}
                    <div className="flex items-center gap-2 ml-auto">
                      {/* Botón Ver Producto */}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectProduct?.(alert.product.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all active:scale-95 shadow-2xs"
                        title="Ver ficha completa de este producto"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver Producto</span>
                      </button>

                      {/* Botón Reponer / Trasladar */}
                      {isStoreEmpty || alert.alertLevel === "STORE_REPLENISHMENT" ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenStockMovement?.(
                              alert.product,
                              "TRANSFERENCIA_INTERNA",
                              alert.variant.id
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all"
                          title="Trasladar stock de depósito a salón de ventas"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Trasladar a Salón</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenStockMovement?.(
                              alert.product,
                              "INGRESO_COMPRA",
                              alert.variant.id
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-[#00D615] font-extrabold text-xs shadow-xs transition-all border border-slate-800"
                          title="Registrar orden de compra o ingreso a depósito"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>+ Ingreso / Compra</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del Drawer */}
        <div className="px-5 py-2.5 border-t border-slate-200 bg-white text-xs text-slate-500 flex items-center justify-between shrink-0">
          <span className="font-medium">
            Total en lista: <strong className="text-slate-900 font-bold">{filteredAlerts.length}</strong> variantes
          </span>
        </div>
      </aside>
    </div>
  );
}

