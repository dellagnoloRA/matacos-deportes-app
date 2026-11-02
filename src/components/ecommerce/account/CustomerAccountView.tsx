"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  User,
  Heart,
  LogOut,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Truck,
  MessageCircle,
  XCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Trash2,
  CreditCard,
} from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import {
  updateCustomerProfileAction,
  cancelCustomerOrderAction,
  toggleCustomerFavoriteAction,
  getCustomerOrdersAction,
  type CustomerProfileDTO,
  type CustomerOrderDetailDTO,
  type CustomerFavoriteItemDTO,
} from "@/server/actions/ecommerce/customerActions";
import type { ShippingStatusType } from "@/schemas/customer";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useCustomerStore } from "@/store/customerStore";

export type AccountTab = "pedidos" | "perfil" | "favoritos";

interface CustomerAccountViewProps {
  initialCustomer: CustomerProfileDTO;
  initialOrders: CustomerOrderDetailDTO[];
  initialFavorites: CustomerFavoriteItemDTO[];
  initialTab?: AccountTab;
}

const SHIPPING_STATUS_INFO: Record<
  ShippingStatusType,
  { label: string; className: string }
> = {
  PENDIENTE: {
    label: "Pendiente de preparación",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  EN_PREPARACION: {
    label: "En preparación en local",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  LISTO_RETIRO: {
    label: "Listo para retirar en Saavedra 241",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  EN_CAMINO: {
    label: "En camino / Despachado",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  ENTREGADO: {
    label: "Entregado",
    className: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  CANCELADO: {
    label: "Envío cancelado",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

const SHIPPING_METHOD_LABELS: Record<string, string> = {
  RETIRO_LOCAL: "Retiro gratis en local (Saavedra 241)",
  CADETERIA_FORMOSA: "Cadetería en Formosa Capital",
  CORREO_ARGENTINO: "Envío por Correo Argentino",
};

export function CustomerAccountView({
  initialCustomer,
  initialOrders,
  initialFavorites,
  initialTab = "pedidos",
}: CustomerAccountViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [customer, setLocalCustomer] =
    useState<CustomerProfileDTO>(initialCustomer);
  const [orders, setOrders] =
    useState<CustomerOrderDetailDTO[]>(initialOrders);
  const [favorites, setFavorites] =
    useState<CustomerFavoriteItemDTO[]>(initialFavorites);

  const { items: cartItems, hasHydrated } = useCartStore();
  const { setCustomer: setGlobalCustomer, logout } = useCustomerStore();

  const [isPending, startTransition] = useTransition();
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState(initialCustomer.name);
  const [dni, setDni] = useState(initialCustomer.dni || "");
  const [phone, setPhone] = useState(initialCustomer.phone || "");
  const [defaultAddress, setDefaultAddress] = useState(
    initialCustomer.defaultAddress || ""
  );
  const [defaultCity, setDefaultCity] = useState(
    initialCustomer.defaultCity || "Formosa"
  );
  const [defaultPostalCode, setDefaultPostalCode] = useState(
    initialCustomer.defaultPostalCode || "3600"
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const cartUnits = hasHydrated
    ? cartItems.reduce((sum, i) => sum + i.quantity, 0)
    : 0;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const cleanDni = dni.replace(/[.\-\s]/g, "").trim();
      const res = await updateCustomerProfileAction({
        name: name.trim(),
        dni: cleanDni || null,
        phone: phone.trim() || null,
        defaultAddress: defaultAddress.trim() || null,
        defaultCity: defaultCity.trim() || "Formosa",
        defaultPostalCode: defaultPostalCode.trim() || "3600",
      });

      if (!res.success || !res.data) {
        setFeedback({
          type: "error",
          text: res.error || "No se pudo actualizar el perfil.",
        });
        return;
      }

      setLocalCustomer(res.data);
      setGlobalCustomer(res.data);
      setFeedback({
        type: "success",
        text: "¡Tus datos de contacto y entrega fueron guardados correctamente!",
      });
    });
  };

  const handleCancelOrder = (order: CustomerOrderDetailDTO) => {
    if (
      !window.confirm(
        `¿Querés cancelar el pedido ${order.orderCode}? Se liberarán las unidades reservadas.`
      )
    ) {
      return;
    }

    setFeedback(null);
    setCancelingOrderId(order.id);
    startTransition(async () => {
      try {
        const res = await cancelCustomerOrderAction(order.id);
        if (!res.success) {
          setFeedback({
            type: "error",
            text: res.error || "No se pudo cancelar el pedido.",
          });
          return;
        }

        const refreshed = await getCustomerOrdersAction();
        if (refreshed.success && refreshed.data) {
          setOrders(refreshed.data);
        }
        setFeedback({
          type: "success",
          text: `El pedido ${order.orderCode} fue cancelado y su reserva de stock liberada.`,
        });
      } finally {
        setCancelingOrderId(null);
      }
    });
  };

  const handleRemoveFavorite = (productId: string) => {
    startTransition(async () => {
      const res = await toggleCustomerFavoriteAction(productId);
      if (res.success && res.data) {
        setFavorites((prev) =>
          prev.filter((item) => item.productId !== productId)
        );
        const updatedProfile: CustomerProfileDTO = {
          ...customer,
          favoriteProductIds: res.data.favoriteProductIds,
        };
        setLocalCustomer(updatedProfile);
        setGlobalCustomer(updatedProfile);
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <EcommerceHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Hero Banner */}
        <div className="bg-[#06241d] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00D615]">
              PORTAL DE CLIENTES • MATACOS DEPORTES
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ¡Hola, {customer.name}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80">
              {customer.email}
              {customer.dni ? ` • DNI ${customer.dni}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {cartUnits > 0 ? (
              <Link
                href="/checkout"
                className="px-5 py-3 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Finalizar compra ({cartUnits})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/catalogo"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-[#00D615]" />
                <span>Explorar Catálogo</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="px-4 py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-200 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold opacity-70 hover:opacity-100 ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("pedidos")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "pedidos"
                ? "bg-slate-950 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Mis Pedidos ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("perfil")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "perfil"
                ? "bg-slate-950 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mis Datos y Dirección</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("favoritos")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "favoritos"
                ? "bg-slate-950 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Favoritos ({favorites.length})</span>
          </button>
        </div>

        {/* TAB 1: MIS PEDIDOS */}
        {activeTab === "pedidos" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                  <Package className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-900">
                    Todavía no registrás compras online
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Cuando realices un pedido en nuestra tienda web, vas a poder seguir su preparación, retiro o envío desde aquí.
                  </p>
                </div>
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  <span>Ir al Catálogo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const shipBadge =
                  SHIPPING_STATUS_INFO[order.shippingStatus] ||
                  SHIPPING_STATUS_INFO.PENDIENTE;
                const isCanceling = cancelingOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="p-5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-slate-950 tracking-tight">
                            Pedido {order.orderCode}
                          </span>

                          {order.status === "PENDIENTE_PAGO" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Pendiente de pago (Reserva activa)
                            </span>
                          )}
                          {order.status === "COMPLETADA" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Pago confirmado
                            </span>
                          )}
                          {order.status === "CANCELADA" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="w-3 h-3" />
                              Cancelada
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${shipBadge.className}`}
                          >
                            {shipBadge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Realizado el {order.createdAtFormatted}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-slate-400 uppercase font-bold block">
                          Total de la orden
                        </span>
                        <span className="text-lg font-black text-[#00A811]">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Order Body */}
                    <div className="p-5 space-y-4">
                      {/* Items */}
                      <div className="divide-y divide-slate-100">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-1.5 shrink-0 flex items-center justify-center">
                                <img
                                  src={item.imageUrl || "/placeholder-product.svg"}
                                  alt={item.productName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/placeholder-product.svg";
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/productos/${item.productId}`}
                                  className="text-xs font-bold text-slate-900 hover:text-[#00A811] truncate block"
                                >
                                  {item.quantity}x {item.productName}
                                </Link>
                                <p className="text-[11px] text-slate-500">
                                  {item.brandName} • Talle {item.size} •{" "}
                                  {item.color}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-slate-900 shrink-0">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Shipping & Totals Summary */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                          {order.shippingMethod === "RETIRO_LOCAL" ? (
                            <MapPin className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                          ) : (
                            <Truck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-bold text-slate-800">
                              {SHIPPING_METHOD_LABELS[order.shippingMethod] ||
                                order.shippingMethod}
                              {" • "}
                              {order.shippingCost === 0
                                ? "Sin cargo"
                                : formatCurrency(order.shippingCost)}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {order.shippingAddress}
                              {order.shippingCity ? `, ${order.shippingCity}` : ""}
                              {order.shippingPostalCode
                                ? ` (CP ${order.shippingPostalCode})`
                                : ""}
                            </p>
                            {order.shippingTrackingCode && (
                              <p className="text-[11px] font-bold text-emerald-700 mt-1">
                                Guía de seguimiento: {order.shippingTrackingCode}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {order.status === "PENDIENTE_PAGO" &&
                            (order.customerDni || order.customerEmail) && (
                              <Link
                                href={`/checkout?orden=${encodeURIComponent(
                                  order.orderCode
                                )}&verificacion=${encodeURIComponent(
                                  order.customerDni ||
                                    order.customerEmail ||
                                    ""
                                )}`}
                                className="px-3.5 py-2 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-black text-xs inline-flex items-center gap-1.5 transition-colors shadow-sm"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Completar Pago</span>
                              </Link>
                            )}

                          {order.correoArgentinoTrackingUrl && (
                            <a
                              href={order.correoArgentinoTrackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                            >
                              <span>Seguir en Correo Argentino</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <a
                            href={order.whatsappSupportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl border border-emerald-600/40 text-emerald-800 hover:bg-emerald-50 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Coordinar / Consultar</span>
                          </a>

                          {order.canSelfCancel && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order)}
                              disabled={isCanceling}
                              className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {isCanceling ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Cancelar pedido</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: MIS DATOS Y DIRECCIÓN */}
        {activeTab === "perfil" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl">
            <div className="space-y-1 mb-6">
              <h2 className="text-lg font-black text-slate-950">
                Datos de Contacto y Entrega Predeterminada
              </h2>
              <p className="text-xs text-slate-500">
                Estos datos se completarán automáticamente cada vez que inicies una compra en el Checkout.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    DNI (sin puntos)
                  </label>
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ej: 38999111"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 3704556677"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección de envío habitual (Calle, altura, piso/depto)
                </label>
                <input
                  type="text"
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                  placeholder="Ej: Av. 25 de Mayo 850"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Localidad
                  </label>
                  <input
                    type="text"
                    value={defaultCity}
                    onChange={(e) => setDefaultCity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={defaultPostalCode}
                    onChange={(e) => setDefaultPostalCode(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Guardar cambios</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: FAVORITOS */}
        {activeTab === "favoritos" && (
          <div>
            {favorites.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                  <Heart className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-900">
                    Tu lista de favoritos está vacía
                  </h2>
                  <p className="text-xs text-slate-500">
                    Explorá el catálogo para encontrar tus artículos deportivos ideales.
                  </p>
                </div>
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider"
                >
                  <span>Explorar Catálogo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {favorites.map((fav) => (
                  <div
                    key={fav.productId}
                    className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 items-center justify-between"
                  >
                    <Link
                      href={`/productos/${fav.productId}`}
                      className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 shrink-0 flex items-center justify-center"
                    >
                      <img
                        src={fav.imageUrl || "/placeholder-product.svg"}
                        alt={fav.name}
                        className="w-full h-full object-contain"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        {fav.brandName}
                      </span>
                      <Link
                        href={`/productos/${fav.productId}`}
                        className="text-xs font-bold text-slate-900 hover:text-[#00A811] line-clamp-2 block"
                      >
                        {fav.name}
                      </Link>
                      <span className="text-sm font-black text-[#00A811] block">
                        {formatCurrency(fav.price)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(fav.productId)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Quitar de favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <EcommerceFooter />
    </div>
  );
}
