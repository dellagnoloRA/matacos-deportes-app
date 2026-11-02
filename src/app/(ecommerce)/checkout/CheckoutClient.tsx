"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Truck,
  Store,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  Building2,
  Banknote,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createGuestOrder } from "@/server/actions/ecommerce/checkoutActions";
import { createMercadoPagoPreference } from "@/server/actions/ecommerce/mercadopagoActions";
import { ShippingMethod } from "@/schemas/ecommerce";
import { ShippingConfig } from "@/config/company";
import { useCartStore } from "@/stores/cartStore";

interface CheckoutVariant {
  id: string;
  name: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

interface CheckoutClientProps {
  availableVariants: CheckoutVariant[];
  shippingConfig: ShippingConfig;
}

export function CheckoutClient({
  availableVariants,
  shippingConfig,
}: CheckoutClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hidratación segura para sincronizar con Zustand persist (localStorage)
  const [hasMounted, setHasMounted] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Helper de prueba para desarrolladores en caso de que el carrito esté vacío
  const handleLoadDemoProduct = () => {
    if (availableVariants.length > 0) {
      const v = availableVariants[0];
      addItem(
        {
          id: v.id,
          name: v.name,
          brand: "Matacos",
          category: "Indumentaria",
          price: v.price,
          image: "/placeholder-product.svg",
          totalAvailableStock: v.stock,
          hasStock: true,
          variants: [
            {
              id: v.id,
              size: v.size,
              color: v.color,
              sku: "DEMO",
              barcode: null,
              price: v.price,
              availableStock: v.stock,
              inStock: true,
            },
          ],
        },
        v.id,
        1,
        v.size,
        v.color,
        v.price
      );
    }
  };

  // Datos del comprador (vacíos por defecto para compra real/invitado)
  const [customerName, setCustomerName] = useState("");
  const [customerDni, setCustomerDni] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Método de entrega
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("RETIRO_LOCAL");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");

  const handleSelectShippingMethod = (method: ShippingMethod) => {
    setShippingMethod(method);
    if (method === "CADETERIA_FORMOSA" && !shippingCity) {
      setShippingCity("Formosa Capital");
    }
  };

  // Método de pago
  const [paymentOption, setPaymentOption] = useState<
    "MERCADOPAGO" | "TRANSFERENCIA" | "EFECTIVO"
  >("MERCADOPAGO");

  // Ítems finales a comprar provenientes del carrito global
  const itemsInOrder = hasMounted ? cartItems : [];

  // Cálculo dinámico de totales basado en la configuración parametrizable
  const subtotalProducts = itemsInOrder.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const isFreeShipping =
    subtotalProducts >= shippingConfig.freeShippingThreshold;

  let baseShippingCost = 0;
  if (shippingMethod === "CADETERIA_FORMOSA") {
    baseShippingCost = shippingConfig.cadeteriaBaseFee;
  } else if (shippingMethod === "CORREO_ARGENTINO") {
    baseShippingCost = shippingConfig.correoArgentinoBaseFee;
  }

  const effectiveShippingCost =
    shippingMethod === "RETIRO_LOCAL" || isFreeShipping ? 0 : baseShippingCost;
  const totalAmount = subtotalProducts + effectiveShippingCost;

  // Manejador del submit de compra
  const handleProceedToPayment = () => {
    setErrorMessage(null);

    if (itemsInOrder.length === 0) {
      setErrorMessage("No hay productos en el carrito para procesar la compra.");
      return;
    }

    if (!customerName || !customerDni || !customerEmail || !customerPhone) {
      setErrorMessage("Por favor completá todos los datos de contacto.");
      return;
    }

    if (
      shippingMethod !== "RETIRO_LOCAL" &&
      (!shippingAddress || !shippingCity)
    ) {
      setErrorMessage("Por favor indicá tu dirección de entrega y localidad.");
      return;
    }

    startTransition(async () => {
      try {
        // 1. Crear la orden web en estado PENDIENTE_PAGO con costo de envío dinámico
        const orderRes = await createGuestOrder({
          customerName,
          customerDni,
          customerEmail,
          customerPhone,
          shippingMethod,
          shippingCost: effectiveShippingCost,
          shippingAddress:
            shippingMethod === "RETIRO_LOCAL" ? "Saavedra 241" : shippingAddress,
          shippingCity:
            shippingMethod === "RETIRO_LOCAL" ? "Formosa" : shippingCity,
          shippingPostalCode: shippingPostalCode || "3600",
          items: itemsInOrder.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        });

        if (!orderRes.success || !orderRes.data) {
          setErrorMessage(orderRes.error || "No se pudo generar la orden.");
          return;
        }

        const saleId = orderRes.data.saleId;

        // 2. Si eligió Mercado Pago, generar la preferencia y redirigir
        if (paymentOption === "MERCADOPAGO") {
          const prefRes = await createMercadoPagoPreference(saleId);

          if (!prefRes.success || !prefRes.data) {
            setErrorMessage(
              prefRes.error || "Error al conectar con la pasarela de Mercado Pago."
            );
            return;
          }

          const redirectUrl =
            prefRes.data.sandboxInitPoint || prefRes.data.initPoint;

          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          } else {
            setErrorMessage("No se obtuvo la URL de pago de Mercado Pago.");
            return;
          }
        }

        // Si eligió efectivo o transferencia (simulado en esta etapa)
        router.push(
          `/checkout/resultado?orderCode=${orderRes.data.orderCode}&status=pending`
        );
      } catch (err: any) {
        console.error("Error al procesar checkout:", err);
        setErrorMessage(err.message || "Ocurrió un error inesperado.");
      }
    });
  };

  // Estado de carga antes de hidratar el cliente
  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#00D615]" />
          <span>Cargando checkout seguro...</span>
        </div>
      </div>
    );
  }

  // Si el carrito está vacío
  if (itemsInOrder.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
        <header className="bg-slate-950 text-white border-b border-slate-800 py-4 px-6 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la tienda</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">
                MATACOS
              </span>
              <span className="text-[#00D615] font-black text-lg tracking-wider">
                DEPORTES
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#00D615]" />
              <span>Compra 100% Segura</span>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-16 text-center">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-900 mb-2">
                Tu carrito está vacío
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                No tenés productos seleccionados para iniciar el checkout. Explorá
                nuestro catálogo y sumá tus prendas y calzados favoritos.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/catalogo"
                className="w-full py-3.5 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all text-center"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explorar Catálogo</span>
              </Link>

              {availableVariants.length > 0 && (
                <button
                  type="button"
                  onClick={handleLoadDemoProduct}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Cargar producto de prueba ({availableVariants[0].name})</span>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header simple */}
      <header className="bg-slate-950 text-white border-b border-slate-800 py-4 px-6 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la tienda</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-wider text-white">
              MATACOS
            </span>
            <span className="text-[#00D615] font-black text-lg tracking-wider">
              DEPORTES
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#00D615]" />
            <span>Compra 100% Segura</span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Finalizar Compra
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Completá tus datos para coordinar la entrega y proceder al pago seguro.
        </p>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold">No pudimos procesar la orden:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Formulario (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Bloque 1: Contacto */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center text-xs font-black">
                  1
                </span>
                Datos del Comprador (Guest Checkout)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    DNI / CUIT
                  </label>
                  <input
                    type="text"
                    value={customerDni}
                    onChange={(e) => setCustomerDni(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                    placeholder="Ej: 38.123.456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                    placeholder="Ej: juan@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                    placeholder="Ej: 3704 556677"
                  />
                </div>
              </div>
            </div>

            {/* Bloque 2: Entrega */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center text-xs font-black">
                  2
                </span>
                Forma de Entrega
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {/* Opción Retiro */}
                <button
                  type="button"
                  onClick={() => handleSelectShippingMethod("RETIRO_LOCAL")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    shippingMethod === "RETIRO_LOCAL"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Retiro Local
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Saavedra 241</span>
                  <span className="text-xs font-black text-[#00A811] mt-1">
                    GRATIS
                  </span>
                </button>

                {/* Opción Cadetería */}
                <button
                  type="button"
                  onClick={() => handleSelectShippingMethod("CADETERIA_FORMOSA")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    shippingMethod === "CADETERIA_FORMOSA"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Cadetería
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Formosa Capital</span>
                  <span className="text-xs font-black text-slate-900 mt-1">
                    {isFreeShipping
                      ? "¡GRATIS!"
                      : formatCurrency(shippingConfig.cadeteriaBaseFee)}
                  </span>
                </button>

                {/* Opción Correo */}
                <button
                  type="button"
                  onClick={() => handleSelectShippingMethod("CORREO_ARGENTINO")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    shippingMethod === "CORREO_ARGENTINO"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Correo Arg.
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Nacional</span>
                  <span className="text-xs font-black text-slate-900 mt-1">
                    {isFreeShipping
                      ? "¡GRATIS!"
                      : formatCurrency(shippingConfig.correoArgentinoBaseFee)}
                  </span>
                </button>
              </div>

              {shippingMethod !== "RETIRO_LOCAL" && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Dirección (Calle y Número)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                      placeholder="Ej: Av. 25 de Mayo 450"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Ciudad / Localidad
                    </label>
                    <input
                      type="text"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                      placeholder={
                        shippingMethod === "CADETERIA_FORMOSA"
                          ? "Formosa Capital"
                          : "Ej: Clorinda"
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      C. Postal
                    </label>
                    <input
                      type="text"
                      value={shippingPostalCode}
                      onChange={(e) => setShippingPostalCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                      placeholder="3600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bloque 3: Medio de Pago */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center text-xs font-black">
                  3
                </span>
                Medio de Pago
              </h2>

              <div className="space-y-3">
                {/* Opción Mercado Pago */}
                <label
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentOption === "MERCADOPAGO"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === "MERCADOPAGO"}
                      onChange={() => setPaymentOption("MERCADOPAGO")}
                      className="w-4 h-4 text-[#00D615] focus:ring-[#00D615]"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Mercado Pago Checkout Pro
                        <span className="text-[10px] font-black uppercase tracking-wider bg-[#00D615] text-slate-950 px-2 py-0.5 rounded-full">
                          Oficial
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Tarjetas de crédito (cuotas), débito o dinero en cuenta.
                      </p>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-slate-600" />
                </label>

                {/* Opción Transferencia */}
                <label
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentOption === "TRANSFERENCIA"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === "TRANSFERENCIA"}
                      onChange={() => setPaymentOption("TRANSFERENCIA")}
                      className="w-4 h-4 text-[#00D615] focus:ring-[#00D615]"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Transferencia Bancaria Directa
                        <span className="text-[10px] font-semibold text-slate-500">
                          (RF-17)
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Pago a CBU/Alias y carga de comprobante.
                      </p>
                    </div>
                  </div>
                  <Building2 className="w-5 h-5 text-slate-400" />
                </label>

                {/* Opción Efectivo */}
                {shippingMethod === "RETIRO_LOCAL" && (
                  <label
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentOption === "EFECTIVO"
                        ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentOption"
                        checked={paymentOption === "EFECTIVO"}
                        onChange={() => setPaymentOption("EFECTIVO")}
                        className="w-4 h-4 text-[#00D615] focus:ring-[#00D615]"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Efectivo al Retirar en Mostrador
                        </p>
                        <p className="text-xs text-slate-500">
                          Abonás al momento de retirar en Saavedra 241.
                        </p>
                      </div>
                    </div>
                    <Banknote className="w-5 h-5 text-slate-400" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Resumen de Compra (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-24 space-y-5">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Resumen de Compra
              </h2>

              {/* Lista de productos */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {itemsInOrder.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs py-2.5 border-b border-slate-100 last:border-0 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Talle {item.size} • {item.color}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          title="Disminuir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs text-slate-800 min-w-[14px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                          title="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="ml-2 text-slate-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                          title="Eliminar del carrito"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-slate-900 text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-slate-400">
                          {formatCurrency(item.price)} c/u
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner Envío Gratis Dinámico */}
              {isFreeShipping ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Tu compra califica para Envío Gratis!</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  Agregá{" "}
                  <strong className="text-slate-900">
                    {formatCurrency(
                      shippingConfig.freeShippingThreshold - subtotalProducts
                    )}
                  </strong>{" "}
                  más para obtener envío gratis general.
                </div>
              )}

              {/* Totales */}
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal productos:</span>
                  <span>{formatCurrency(subtotalProducts)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Costo de envío:</span>
                  <span
                    className={
                      effectiveShippingCost === 0 ? "text-[#00A811] font-bold" : ""
                    }
                  >
                    {effectiveShippingCost === 0
                      ? "GRATIS"
                      : formatCurrency(effectiveShippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-100">
                  <span>Total Final:</span>
                  <span className="text-base text-slate-950">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Botón de acción */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={isPending || itemsInOrder.length === 0}
                className="w-full py-4 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : paymentOption === "MERCADOPAGO" ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pagar con Mercado Pago</span>
                  </>
                ) : (
                  <span>Confirmar Pedido</span>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Al confirmar tu compra, el inventario quedará reservado por 15
                minutos mientras completás el pago.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
