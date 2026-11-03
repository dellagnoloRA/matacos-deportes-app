"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  Package,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  User,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  CreditCard,
  Landmark,
  Store,
  Lock,
  Sparkles,
  XCircle,
} from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import {
  validateCartItems,
  createGuestOrder,
  cancelGuestOrder,
  getWebOrderForCheckoutPayment,
  processWebOrderPayment,
  type CartValidationResult,
  type GuestOrderCreatedResult,
  type WebOrderPaymentResult,
} from "@/server/actions/ecommerce/checkoutActions";
import { createMercadoPagoPreference } from "@/server/actions/ecommerce/mercadopagoActions";
import type { CustomerProfileDTO } from "@/server/actions/ecommerce/customerActions";
import type {
  ShippingMethod,
  WebPaymentOption,
  WebCardBrand,
} from "@/schemas/ecommerce";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useCustomerStore } from "@/store/customerStore";

const ACTIVE_CHECKOUT_SESSION_KEY = "matacos-active-checkout-order";

interface StoredCheckoutSession {
  orderCode: string;
  verification: string;
}

interface CheckoutViewProps {
  initialCustomer: CustomerProfileDTO | null;
  initialOrderCode?: string;
  initialVerification?: string;
}

const SHIPPING_OPTIONS: Array<{
  method: ShippingMethod;
  title: string;
  subtitle: string;
  cost: number;
  badge?: string;
}> = [
  {
    method: "RETIRO_LOCAL",
    title: "Retiro gratis en el local",
    subtitle: "Saavedra 241, Formosa Capital • Listo para retirar en el día",
    cost: 0,
    badge: "SIN CARGO",
  },
  {
    method: "CADETERIA_FORMOSA",
    title: "Cadetería / Moto-Mensajería",
    subtitle: "Entrega rápida a domicilio dentro de Formosa Capital (CP 3600)",
    cost: 2500,
  },
  {
    method: "CORREO_ARGENTINO",
    title: "Envío por Correo Argentino",
    subtitle: "Interior de Formosa y todo el país (tarifa plana de referencia)",
    cost: 7500,
  },
];

const CARD_BRANDS: Array<{ id: WebCardBrand; label: string }> = [
  { id: "VISA", label: "Visa" },
  { id: "MASTERCARD", label: "Mastercard" },
  { id: "NARANJA_X", label: "Naranja X" },
  { id: "CABAL", label: "Cabal" },
];

const CREDIT_INSTALLMENTS = [
  { count: 1, label: "1 pago sin interés" },
  { count: 3, label: "3 cuotas sin interés" },
  { count: 6, label: "6 cuotas sin interés" },
];

function formatCardNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
}

function formatCardExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCountdown(secondsRemaining: number): string {
  const safe = Math.max(0, secondsRemaining);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function CheckoutView({
  initialCustomer,
  initialOrderCode,
  initialVerification,
}: CheckoutViewProps) {
  const {
    items,
    hasHydrated,
    updateQuantity,
    removeItem,
    syncValidatedItems,
    clearCart,
  } = useCartStore();
  const { customer: storeCustomer, setCustomer } = useCustomerStore();

  const activeCustomer = storeCustomer ?? initialCustomer;

  useEffect(() => {
    if (initialCustomer && !storeCustomer) {
      setCustomer(initialCustomer);
    }
  }, [initialCustomer, storeCustomer, setCustomer]);

  // =========================================================================
  // PASO 1: DATOS DE CONTACTO Y MODALIDAD DE ENTREGA
  // =========================================================================
  const [customerName, setCustomerName] = useState(activeCustomer?.name ?? "");
  const [customerDni, setCustomerDni] = useState(activeCustomer?.dni ?? "");
  const [customerEmail, setCustomerEmail] = useState(
    activeCustomer?.email ?? ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    activeCustomer?.phone ?? ""
  );
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("RETIRO_LOCAL");
  const [shippingAddress, setShippingAddress] = useState(
    activeCustomer?.defaultAddress ?? ""
  );
  const [shippingCity, setShippingCity] = useState(
    activeCustomer?.defaultCity ?? "Formosa"
  );
  const [shippingPostalCode, setShippingPostalCode] = useState(
    activeCustomer?.defaultPostalCode ?? "3600"
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!activeCustomer) return;
    setCustomerName((prev) => prev || activeCustomer.name || "");
    setCustomerDni((prev) => prev || activeCustomer.dni || "");
    setCustomerEmail((prev) => prev || activeCustomer.email || "");
    setCustomerPhone((prev) => prev || activeCustomer.phone || "");
    setShippingAddress((prev) => prev || activeCustomer.defaultAddress || "");
    setShippingCity((prev) =>
      prev === "Formosa" && activeCustomer.defaultCity
        ? activeCustomer.defaultCity
        : prev
    );
    setShippingPostalCode((prev) =>
      prev === "3600" && activeCustomer.defaultPostalCode
        ? activeCustomer.defaultPostalCode
        : prev
    );
  }, [activeCustomer]);

  // Validación de stock y precios en vivo (Paso 1)
  const [validation, setValidation] = useState<CartValidationResult | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);
  const [priceChangeBanner, setPriceChangeBanner] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // =========================================================================
  // ESTADO DE RESERVA ACTIVA (PASO 2) Y RESULTADO DE PAGO (PASO 3)
  // =========================================================================
  const [isResumingOrder, setIsResumingOrder] = useState(
    Boolean(initialOrderCode && initialVerification)
  );
  const [isSubmittingReservation, startReservationTransition] = useTransition();
  const [isProcessingPayment, startPaymentTransition] = useTransition();
  const [isCancellingOrder, startCancelTransition] = useTransition();

  const [createdOrder, setCreatedOrder] =
    useState<GuestOrderCreatedResult | null>(null);
  const [paymentResult, setPaymentResult] =
    useState<WebOrderPaymentResult | null>(null);

  // Campos del Paso 2: Selección y Ejecución de Pago
  const [paymentOption, setPaymentOption] =
    useState<WebPaymentOption>("MERCADOPAGO");
  const [cardBrand, setCardBrand] = useState<WebCardBrand>("VISA");
  const [installments, setInstallments] = useState<number>(3);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [transferReference, setTransferReference] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Countdown en vivo de la reserva (en segundos)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = async (text: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldKey ? null : prev));
      }, 2200);
    } catch {
      // Fallback silencioso
    }
  };

  // =========================================================================
  // RECUPERAR ORDEN PENDIENTE POR URL (?orden=...&verificacion=...) O REFRESH
  // =========================================================================
  useEffect(() => {
    if (!hasHydrated) return;

    let targetCode = initialOrderCode?.trim();
    let targetVerif = initialVerification?.trim();

    // Si no viene por URL y el carrito está vacío (ej: refresh en Paso 2), buscar en sessionStorage
    if (!targetCode && items.length === 0 && !createdOrder) {
      try {
        const raw = window.sessionStorage.getItem(ACTIVE_CHECKOUT_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoredCheckoutSession;
          if (parsed.orderCode && parsed.verification) {
            targetCode = parsed.orderCode;
            targetVerif = parsed.verification;
          }
        }
      } catch {
        // Ignorar errores de sessionStorage
      }
    }

    if (!targetCode || !targetVerif) {
      setIsResumingOrder(false);
      return;
    }

    let cancelled = false;
    setIsResumingOrder(true);

    void (async () => {
      const res = await getWebOrderForCheckoutPayment(targetCode!, targetVerif!);
      if (cancelled) return;

      if (res.success && res.data) {
        setCreatedOrder(res.data.order);
        setCardHolderName(res.data.order.customer.name.toUpperCase());
        if (res.data.completedPayment) {
          setPaymentResult(res.data.completedPayment);
          try {
            window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
          } catch {
            // Ignorar
          }
        }
      } else {
        try {
          window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
        } catch {
          // Ignorar
        }
        if (initialOrderCode && res.error) {
          setFormError(res.error);
        }
      }
      setIsResumingOrder(false);
    })();

    return () => {
      cancelled = true;
    };
    // Solo ejecutar al hidratar o si cambian los query params iniciales
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, initialOrderCode, initialVerification]);

  // =========================================================================
  // COUNTDOWN EN VIVO DE LOS 15 MINUTOS DE RESERVA
  // =========================================================================
  useEffect(() => {
    if (!createdOrder || paymentResult?.status === "COMPLETADA") {
      setSecondsLeft(null);
      return;
    }

    const updateTimer = () => {
      const expiresMs = new Date(createdOrder.reservation.expiresAt).getTime();
      const diffSeconds = Math.max(
        0,
        Math.floor((expiresMs - Date.now()) / 1000)
      );
      setSecondsLeft(diffSeconds);
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [createdOrder, paymentResult]);

  // Ajustar opción de pago si el pedido no es RETIRO_LOCAL y estaba en PAGO_LOCAL
  useEffect(() => {
    if (
      createdOrder &&
      createdOrder.shipping.method !== "RETIRO_LOCAL" &&
      paymentOption === "PAGO_LOCAL"
    ) {
      setPaymentOption("TARJETA_CREDITO");
    }
  }, [createdOrder, paymentOption]);

  // =========================================================================
  // VALIDACIÓN DE CARRITO EN VIVO (PASO 1)
  // =========================================================================
  const runLiveValidation = useCallback(async () => {
    if (!hasHydrated || items.length === 0 || createdOrder) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    try {
      const res = await validateCartItems(
        items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          expectedUnitPrice: i.price,
        }))
      );

      if (res.success && res.data) {
        setValidation(res.data);
        if (res.data.hasPriceChanges) {
          setPriceChangeBanner(true);
          syncValidatedItems(res.data.items);
        }
      } else if (res.error) {
        setFormError(res.error);
      }
    } catch (err) {
      console.error("Error validando carrito en vivo:", err);
    } finally {
      setIsValidating(false);
    }
  }, [hasHydrated, items, createdOrder, syncValidatedItems]);

  useEffect(() => {
    void runLiveValidation();
  }, [runLiveValidation]);

  const selectedShippingOption =
    SHIPPING_OPTIONS.find((opt) => opt.method === shippingMethod) ??
    SHIPPING_OPTIONS[0]!;

  const subtotalProducts = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingCost = selectedShippingOption.cost;
  const totalOrder = subtotalProducts + shippingCost;

  const requiresAddress =
    shippingMethod === "CADETERIA_FORMOSA" ||
    shippingMethod === "CORREO_ARGENTINO";

  // =========================================================================
  // ACCIÓN PASO 1 -> PASO 2: CREAR ORDEN EN PENDIENTE_PAGO Y RESERVAR STOCK
  // =========================================================================
  const handleReserveAndGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError("Tu carrito está vacío.");
      return;
    }

    if (validation?.hasStockIssues) {
      setFormError(
        "Algunos artículos de tu carrito superan el stock disponible. Ajustá las cantidades antes de continuar al pago."
      );
      return;
    }

    if (requiresAddress && shippingAddress.trim().length < 5) {
      setFormError(
        "Por favor ingresá la calle y altura de entrega para el envío a domicilio."
      );
      return;
    }

    startReservationTransition(async () => {
      const res = await createGuestOrder({
        customerName: customerName.trim(),
        customerDni: customerDni.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        shippingMethod,
        shippingAddress: requiresAddress ? shippingAddress.trim() : null,
        shippingCity:
          shippingMethod === "CADETERIA_FORMOSA"
            ? "Formosa"
            : shippingCity.trim() || "Formosa",
        shippingPostalCode:
          shippingMethod === "CADETERIA_FORMOSA"
            ? "3600"
            : shippingPostalCode.trim() || "3600",
        shippingCost,
        customerId: activeCustomer?.id ?? null,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          expectedUnitPrice: i.price,
        })),
      });

      if (!res.success || !res.data) {
        setFormError(
          res.error ||
            "No pudimos reservar la orden. Revisá los datos e intentá nuevamente."
        );
        void runLiveValidation();
        return;
      }

      const order = res.data;
      setCreatedOrder(order);
      setPaymentResult(null);
      setPaymentError(null);
      setCardHolderName(order.customer.name.toUpperCase());

      try {
        const sessionPayload: StoredCheckoutSession = {
          orderCode: order.orderCode,
          verification: order.customer.dni || order.customer.email,
        };
        window.sessionStorage.setItem(
          ACTIVE_CHECKOUT_SESSION_KEY,
          JSON.stringify(sessionPayload)
        );
      } catch {
        // Ignorar errores de sessionStorage
      }

      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  // =========================================================================
  // HELPERS DE AUTOCOMPLETADO PARA PROBAR TARJETA APROBADA VS RECHAZADA
  // =========================================================================
  const handleFillApprovedDemoCard = () => {
    setPaymentError(null);
    setCardBrand("VISA");
    setCardNumber("4509 9535 6623 3704");
    setCardHolderName(
      (createdOrder?.customer.name || customerName || "JUAN PEREZ").toUpperCase()
    );
    setCardExpiry("12/29");
    setCardCvv("123");
    setSimulateDecline(false);
  };

  const handleFillDeclinedDemoCard = () => {
    setPaymentError(null);
    setCardBrand("VISA");
    setCardNumber("4509 9500 0000 0000");
    setCardHolderName(
      (createdOrder?.customer.name || customerName || "TARJETA RECHAZADA").toUpperCase()
    );
    setCardExpiry("08/28");
    setCardCvv("999");
    setSimulateDecline(true);
  };

  // =========================================================================
  // ACCIÓN PASO 2 -> PASO 3: EJECUTAR EL PAGO DE LA RESERVA
  // =========================================================================
  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;

    setPaymentError(null);

    if (secondsLeft !== null && secondsLeft <= 0) {
      setPaymentError(
        "El tiempo de reserva de 15 minutos expiró. Cancelá o volvé al catálogo para iniciar una nueva compra."
      );
      return;
    }

    if (paymentOption === "MERCADOPAGO") {
      startPaymentTransition(async () => {
        const prefRes = await createMercadoPagoPreference(
          createdOrder.orderCode
        );

        if (!prefRes.success || !prefRes.data) {
          setPaymentError(
            prefRes.error ||
              "No se pudo generar la preferencia en Mercado Pago. Revisá tus credenciales."
          );
          return;
        }

        const targetUrl =
          prefRes.data.initPoint || prefRes.data.sandboxInitPoint;

        if (!targetUrl) {
          setPaymentError(
            "No se obtuvo la URL de pago de Mercado Pago Sandbox."
          );
          return;
        }

        window.location.href = targetUrl;
      });
      return;
    }

    const isCard =
      paymentOption === "TARJETA_CREDITO" || paymentOption === "TARJETA_DEBITO";

    const cleanCardDigits = cardNumber.replace(/\D/g, "");
    const cleanExpiryDigits = cardExpiry.replace(/\D/g, "");
    const cleanCvvDigits = cardCvv.replace(/\D/g, "");

    if (isCard) {
      if (cleanCardDigits.length < 15) {
        setPaymentError(
          "Ingresá los 16 dígitos de la tarjeta (o usá los botones de prueba rápida arriba)."
        );
        return;
      }
      if (cardHolderName.trim().length < 3) {
        setPaymentError("Ingresá el nombre y apellido del titular de la tarjeta.");
        return;
      }
      if (cleanExpiryDigits.length !== 4) {
        setPaymentError("Ingresá el vencimiento en formato MM/AA (ej: 12/29).");
        return;
      }
      const expMonth = parseInt(cleanExpiryDigits.slice(0, 2), 10);
      if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
        setPaymentError("El mes de vencimiento de la tarjeta debe estar entre 01 y 12.");
        return;
      }
      if (cleanCvvDigits.length < 3) {
        setPaymentError("Ingresá el código de seguridad (CVV) de 3 o 4 dígitos.");
        return;
      }
    }

    const effectiveInstallments =
      paymentOption === "TARJETA_CREDITO" ? installments : 1;

    startPaymentTransition(async () => {
      const res = await processWebOrderPayment({
        orderCode: createdOrder.orderCode,
        verification: createdOrder.customer.dni || createdOrder.customer.email,
        paymentOption,
        cardBrand: isCard ? cardBrand : undefined,
        cardHolderName: isCard ? cardHolderName.trim() : undefined,
        cardLast4: isCard ? cleanCardDigits.slice(-4) : undefined,
        installments: effectiveInstallments,
        simulateDecline: isCard ? simulateDecline : false,
        transferReference:
          paymentOption === "TRANSFERENCIA"
            ? transferReference.trim() || null
            : null,
      });

      if (!res.success || !res.data) {
        setPaymentError(
          res.error ||
            "No pudimos procesar el pago. Tu stock continúa reservado para que intentes nuevamente."
        );
        if (res.code === "ORDER_EXPIRED") {
          try {
            window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
          } catch {
            // Ignorar
          }
        }
        return;
      }

      setPaymentResult(res.data);

      if (res.data.status === "COMPLETADA") {
        try {
          window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
        } catch {
          // Ignorar
        }
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  // =========================================================================
  // CANCELAR RESERVA DESDE EL PASO 2 Y LIBERAR STOCK INMEDIATAMENTE
  // =========================================================================
  const handleCancelReservation = () => {
    if (!createdOrder) return;
    setPaymentError(null);

    startCancelTransition(async () => {
      const res = await cancelGuestOrder(
        createdOrder.orderCode,
        "Reserva cancelada voluntariamente por el cliente en la pantalla de pago"
      );

      if (!res.success) {
        setPaymentError(res.error || "No se pudo cancelar la reserva.");
        return;
      }

      try {
        window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
      } catch {
        // Ignorar
      }

      setCreatedOrder(null);
      setPaymentResult(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  // Determinar paso actual para el Stepper visual (1, 2 o 3)
  const currentStep: 1 | 2 | 3 = paymentResult ? 3 : createdOrder ? 2 : 1;

  const renderCheckoutStepper = () => {
    const steps: Array<{ num: 1 | 2 | 3; title: string; subtitle: string }> = [
      {
        num: 1,
        title: "Contacto y Entrega",
        subtitle: "Validación de stock",
      },
      {
        num: 2,
        title: "Medio de Pago",
        subtitle: "Reserva por 15 min",
      },
      {
        num: 3,
        title: "Estado del Pedido",
        subtitle: "Comprobante final",
      },
    ];

    return (
      <nav
        aria-label="Progreso de compra"
        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
      >
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isActive = currentStep === step.num;

            return (
              <li
                key={step.num}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                  isActive
                    ? "border-[#00A811] bg-emerald-50/60"
                    : isCompleted
                      ? "border-emerald-200 bg-emerald-50/25"
                      : "border-slate-100 bg-slate-50/60 opacity-70"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? "bg-[#00D615] text-slate-950"
                      : isActive
                        ? "bg-slate-950 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-900 truncate">
                    {step.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {step.subtitle}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  // =========================================================================
  // ESTADOS DE CARGA INICIAL / HIDRATACIÓN
  // =========================================================================
  if (!hasHydrated || isResumingOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <EcommerceHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-2.5 text-sm font-bold text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin text-[#00A811]" />
            <span>
              {isResumingOrder
                ? "Recuperando tu reserva de compra..."
                : "Cargando tu carrito..."}
            </span>
          </div>
        </main>
        <EcommerceFooter />
      </div>
    );
  }

  // =========================================================================
  // PASO 3: PANTALLA FINAL DIFERENCIADA (PAGO APROBADO VS PAGO PENDIENTE)
  // =========================================================================
  if (createdOrder && paymentResult) {
    const isPaid = paymentResult.status === "COMPLETADA";

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
        <EcommerceHeader />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          {renderCheckoutStepper()}

          <div
            className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
              isPaid ? "border-emerald-200" : "border-amber-300"
            }`}
          >
            {/* Cabecera diferenciada: VERDE solo si el pago fue aprobado; ÁMBAR si está pendiente */}
            {isPaid ? (
              <div className="bg-[#06241d] text-white p-6 sm:p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#00D615] text-slate-950 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00D615] block">
                  ¡PAGO APROBADO • COMPRA CONFIRMADA!
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  ¡Gracias por tu compra, {createdOrder.customer.name}!
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/85 max-w-lg mx-auto">
                  Tu pago fue acreditado con éxito y descontamos las unidades de nuestro inventario. Nuestro equipo de Saavedra 241 ya está preparando tu pedido.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3">
                    <div className="text-left">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                        Código de Orden
                      </span>
                      <span className="text-xl font-black tracking-wider text-white">
                        {createdOrder.orderCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopyText(createdOrder.orderCode, "orderCode")
                      }
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Copiar código"
                    >
                      {copiedField === "orderCode" ? (
                        <Check className="w-4 h-4 text-[#00D615]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {paymentResult.voucherCode && (
                    <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-400/30 rounded-2xl px-4 py-3 text-left">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                          Cód. Autorización
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#00D615]">
                          {paymentResult.voucherCode}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-950 text-white p-6 sm:p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-400 text-slate-950 mx-auto flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 block">
                  PEDIDO RESERVADO • PAGO PENDIENTE DE ACREDITACIÓN
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Reservamos tus productos, {createdOrder.customer.name}
                </h1>
                <p className="text-xs sm:text-sm text-amber-100/90 max-w-xl mx-auto">
                  <strong>Importante:</strong> tu compra aún no registra pago acreditado. Mantenemos tus artículos separados hasta las{" "}
                  <strong>{formatDate(createdOrder.reservation.expiresAt)}</strong> para que completes la operación.
                </p>

                <div className="pt-2">
                  <div className="inline-flex items-center gap-3 bg-white/10 border border-amber-300/30 rounded-2xl px-5 py-3">
                    <div className="text-left">
                      <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
                        Código de Reserva Web
                      </span>
                      <span className="text-xl font-black tracking-wider text-white">
                        {createdOrder.orderCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopyText(createdOrder.orderCode, "orderCode")
                      }
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Copiar código"
                    >
                      {copiedField === "orderCode" ? (
                        <Check className="w-4 h-4 text-amber-300" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cuerpo del comprobante / instrucciones */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Bloque específico según resultado de pago */}
              {isPaid ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#00A811] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-extrabold">
                        Medio de pago:{" "}
                        {paymentResult.paymentOption === "TARJETA_CREDITO"
                          ? "Tarjeta de Crédito"
                          : "Tarjeta de Débito"}{" "}
                        {paymentResult.cardBrand ?? ""}{" "}
                        {paymentResult.cardLast4
                          ? `terminada en ${paymentResult.cardLast4}`
                          : ""}
                      </p>
                      <p className="text-emerald-800">
                        Plan:{" "}
                        {paymentResult.installments === 1
                          ? `1 pago de ${formatCurrency(paymentResult.totalAmount)}`
                          : `${paymentResult.installments} cuotas sin interés de ${formatCurrency(paymentResult.installmentAmount)}`}
                        {" • "}Estado logístico: <strong>EN PREPARACIÓN</strong>
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#00D615] text-slate-950 font-black text-[11px] uppercase self-start sm:self-center">
                    Pagado
                  </span>
                </div>
              ) : paymentResult.paymentOption === "TRANSFERENCIA" &&
                paymentResult.bankDetails ? (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 space-y-4 text-xs text-slate-800">
                  <div className="flex items-start gap-3">
                    <Landmark className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-amber-950">
                        Instrucciones para completar tu Transferencia Bancaria
                      </p>
                      <p className="text-amber-900">
                        Transferí exactamente{" "}
                        <strong>{formatCurrency(paymentResult.totalAmount)}</strong>{" "}
                        desde tu billetera virtual o homebanking a la cuenta oficial de Matacos Deportes y enviá el comprobante por WhatsApp para confirmar tu pedido:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white rounded-xl p-4 border border-amber-200/80">
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Alias CBU
                        </span>
                        <span className="font-black text-slate-950 text-sm">
                          {paymentResult.bankDetails.alias}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyText(
                            paymentResult.bankDetails!.alias,
                            "alias"
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === "alias" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#00A811]" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          CBU (22 dígitos)
                        </span>
                        <span className="font-black text-slate-950 text-xs sm:text-sm break-all">
                          {paymentResult.bankDetails.cbu}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyText(
                            paymentResult.bankDetails!.cbu,
                            "cbu"
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedField === "cbu" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#00A811]" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Titular / Razón Social
                      </span>
                      <span className="font-bold text-slate-900">
                        {paymentResult.bankDetails.accountHolder}
                      </span>
                    </div>

                    <div className="p-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        CUIT • Entidad
                      </span>
                      <span className="font-bold text-slate-900">
                        {paymentResult.bankDetails.cuit} •{" "}
                        {paymentResult.bankDetails.bankName}
                      </span>
                    </div>
                  </div>

                  {paymentResult.transferReference && (
                    <p className="text-[11px] font-bold text-amber-900">
                      Comprobante informado: {paymentResult.transferReference} (sujeto a verificación en administración)
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 space-y-2 text-xs text-amber-950">
                  <div className="flex items-start gap-3">
                    <Store className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-black">
                        Abonás al retirar en Caja — Saavedra 241, Formosa Capital
                      </p>
                      <p className="text-amber-900 leading-relaxed">
                        Presentate en mostrador indicando tu código{" "}
                        <strong>{createdOrder.orderCode}</strong> y DNI{" "}
                        <strong>{createdOrder.customer.dni}</strong> antes de las{" "}
                        <strong>
                          {formatDate(createdOrder.reservation.expiresAt)}
                        </strong>
                        . Al registrar el cobro en nuestra terminal POS tu compra pasará a confirmada.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Artículos del Pedido */}
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Detalle de Artículos ({createdOrder.items.length})
                </h2>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl px-4">
                  {createdOrder.items.map((item) => (
                    <div
                      key={item.variantId}
                      className="py-3 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {item.quantity}x {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Talle: {item.size} • Color: {item.color} • SKU:{" "}
                          {item.sku}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900 shrink-0">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comprador y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Comprador
                  </span>
                  <p className="font-bold text-slate-900">
                    {createdOrder.customer.name}
                  </p>
                  <p className="text-slate-600">
                    DNI/CUIT: {createdOrder.customer.dni}
                  </p>
                  <p className="text-slate-600">
                    {createdOrder.customer.email}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Modalidad de Entrega
                  </span>
                  <p className="font-bold text-slate-900">
                    {createdOrder.shipping.method === "RETIRO_LOCAL"
                      ? "Retiro en Sucursal Saavedra 241"
                      : createdOrder.shipping.method === "CADETERIA_FORMOSA"
                        ? "Cadetería en Formosa Capital"
                        : "Envío por Correo Argentino"}
                  </p>
                  <p className="text-slate-600">
                    {createdOrder.shipping.address}
                  </p>
                  <p className="text-slate-600">
                    {createdOrder.shipping.city} (CP{" "}
                    {createdOrder.shipping.postalCode})
                  </p>
                </div>
              </div>

              {/* Totales */}
              <div className="bg-slate-950 text-white rounded-2xl p-5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal productos</span>
                  <span>
                    {formatCurrency(createdOrder.totals.subtotalProducts)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Costo de entrega</span>
                  <span>
                    {createdOrder.totals.shippingCost === 0
                      ? "Gratis"
                      : formatCurrency(createdOrder.totals.shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-base font-black pt-2 border-t border-slate-800">
                  <span>{isPaid ? "TOTAL ABONADO" : "TOTAL A ABONAR"}</span>
                  <span
                    className={`text-xl ${
                      isPaid ? "text-[#00D615]" : "text-amber-400"
                    }`}
                  >
                    {formatCurrency(createdOrder.totals.total)}
                  </span>
                </div>
              </div>

              {/* Acciones Pos-Checkout */}
              <div className="space-y-3 pt-2">
                {!isPaid && (
                  <>
                    <a
                      href={paymentResult.whatsappActionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {paymentResult.paymentOption === "TRANSFERENCIA"
                          ? "Enviar Comprobante de Transferencia por WhatsApp"
                          : "Coordinar Retiro y Pago por WhatsApp"}
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentOption("TARJETA_CREDITO");
                        setPaymentResult(null);
                      }}
                      className="w-full py-3.5 px-5 rounded-xl border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        ¿Preferís confirmación inmediata? Pagar ahora con Tarjeta
                      </span>
                    </button>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeCustomer ? (
                    <Link
                      href="/cuenta?tab=pedidos"
                      className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Ver en Mis Pedidos</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/seguimiento?codigo=${encodeURIComponent(
                        createdOrder.orderCode
                      )}&verificacion=${encodeURIComponent(
                        createdOrder.customer.dni
                      )}`}
                      className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Seguir Estado del Pedido</span>
                    </Link>
                  )}

                  <Link
                    href="/catalogo"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Seguir Comprando</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        <EcommerceFooter />
      </div>
    );
  }

  // =========================================================================
  // PASO 2: SELECCIÓN Y EJECUCIÓN DEL MEDIO DE PAGO (CON STOCK RESERVADO)
  // =========================================================================
  if (createdOrder) {
    const isExpired = secondsLeft !== null && secondsLeft <= 0;
    const isPickup = createdOrder.shipping.method === "RETIRO_LOCAL";
    const isCardSelected =
      paymentOption === "TARJETA_CREDITO" ||
      paymentOption === "TARJETA_DEBITO";

    const effectiveInstallments =
      paymentOption === "TARJETA_CREDITO" ? installments : 1;
    const installmentAmount =
      createdOrder.totals.total / effectiveInstallments;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
        <EcommerceHeader />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {renderCheckoutStepper()}

          {/* Barra superior de Reserva Activa con Timer 15:00 */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isExpired
                ? "bg-red-50 border-red-300 text-red-950"
                : "bg-[#06241d] border-emerald-800 text-white"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black ${
                  isExpired
                    ? "bg-red-600 text-white"
                    : "bg-[#00D615] text-slate-950"
                }`}
              >
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {isExpired
                      ? "Tiempo de reserva vencido"
                      : `Stock reservado • Orden ${createdOrder.orderCode}`}
                  </span>
                  {!isExpired && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400/20 text-[#00D615] border border-[#00D615]/30">
                      Precio congelado
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs ${
                    isExpired ? "text-red-800" : "text-emerald-100/85"
                  }`}
                >
                  {isExpired
                    ? "La ventana de 15 minutos finalizó y las unidades volvieron a estar disponibles."
                    : "Tus productos ya están separados en inventario. Elegí cómo querés abonar para completar la operación."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
              {secondsLeft !== null && !isExpired && (
                <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                    Tiempo restante
                  </span>
                  <span className="text-lg font-black tabular-nums text-[#00D615]">
                    {formatCountdown(secondsLeft)}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCancelReservation}
                disabled={isCancellingOrder || isProcessingPayment}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isExpired
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                }`}
              >
                {isCancellingOrder ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>
                  {isExpired ? "Volver a empezar" : "Cancelar reserva"}
                </span>
              </button>
            </div>
          </div>

          {paymentError && (
            <div className="bg-red-50 border border-red-300 text-red-900 rounded-2xl p-4 flex items-start gap-3 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-red-950">
                  No se pudo confirmar el pago
                </p>
                <p>{paymentError}</p>
              </div>
            </div>
          )}

          {/* Layout de 2 Columnas para el Paso 2 */}
          <form
            onSubmit={handleExecutePayment}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
          >
            {/* Columna Izquierda: Selector y Formulario de Pago (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-950">
                      ¿Cómo querés pagar tu compra?
                    </h1>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <Lock className="w-3.5 h-3.5" />
                    Operación segura
                  </span>
                </div>

                {/* Opciones de Medio de Pago */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opción Destacada: Mercado Pago Checkout Pro (Sandbox) */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption("MERCADOPAGO");
                      setPaymentError(null);
                    }}
                    className={`sm:col-span-2 p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      paymentOption === "MERCADOPAGO"
                        ? "border-[#009ee3] bg-sky-50/70 ring-2 ring-[#009ee3]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#009ee3] text-white flex items-center justify-center font-black text-xs shrink-0">
                          MP
                        </span>
                        <div>
                          <p className="text-xs sm:text-sm font-black text-slate-900">
                            Mercado Pago Checkout Pro (Sandbox)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Tarjetas de prueba oficiales, dinero en cuenta o efectivo en puntos de cobro
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#009ee3]/15 text-[#0074a6] shrink-0">
                        Oficial Sandbox
                      </span>
                    </div>
                  </button>

                  {/* Opción 1: Tarjeta de Crédito */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption("TARJETA_CREDITO");
                      setPaymentError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      paymentOption === "TARJETA_CREDITO"
                        ? "border-[#00A811] bg-emerald-50/50 ring-1 ring-[#00A811]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-5 h-5 text-[#00A811]" />
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Hasta 6 sin interés
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      Tarjeta de Crédito Directa
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Acreditación instantánea • Confirmación en el acto
                    </p>
                  </button>

                  {/* Opción 2: Tarjeta de Débito */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption("TARJETA_DEBITO");
                      setPaymentError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      paymentOption === "TARJETA_DEBITO"
                        ? "border-[#00A811] bg-emerald-50/50 ring-1 ring-[#00A811]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-5 h-5 text-slate-800" />
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Inmediato
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      Tarjeta de Débito Directa
                    </p>
                    <p className="text-[11px] text-slate-500">
                      1 pago sin recargo • Confirmación en el acto
                    </p>
                  </button>

                  {/* Opción 3: Transferencia Bancaria */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption("TRANSFERENCIA");
                      setPaymentError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      paymentOption === "TRANSFERENCIA"
                        ? "border-[#00A811] bg-emerald-50/50 ring-1 ring-[#00A811]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Landmark className="w-5 h-5 text-blue-700" />
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        Requiere validación
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      Transferencia CBU / Alias
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Billeteras virtuales o banco • Reserva sujeta a comprobante
                    </p>
                  </button>

                  {/* Opción 4: Pago en Mostrador (solo RETIRO_LOCAL) */}
                  <button
                    type="button"
                    disabled={!isPickup}
                    onClick={() => {
                      if (!isPickup) return;
                      setPaymentOption("PAGO_LOCAL");
                      setPaymentError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 ${
                      !isPickup
                        ? "border-slate-100 bg-slate-50 opacity-55 cursor-not-allowed"
                        : paymentOption === "PAGO_LOCAL"
                          ? "border-[#00A811] bg-emerald-50/50 ring-1 ring-[#00A811] cursor-pointer"
                          : "border-slate-200 hover:border-slate-300 bg-white cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Store className="w-5 h-5 text-amber-700" />
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {isPickup ? "Saavedra 241" : "Solo retiro"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      Abonar al Retirar en Local
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isPickup
                        ? "Efectivo, tarjetas o QR en caja de Saavedra 241"
                        : "Disponible únicamente eligiendo Retiro en el local"}
                    </p>
                  </button>
                </div>

                {/* Formulario dinámico según medio de pago seleccionado */}
                {paymentOption === "MERCADOPAGO" && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-5 space-y-3.5 text-xs text-sky-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-black text-sm text-[#0074a6]">
                          <span>Pasarela Oficial Mercado Pago Checkout Pro</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#009ee3] text-white">
                          Sandbox
                        </span>
                      </div>
                      <p className="text-sky-900 leading-relaxed">
                        Al presionar <strong>PAGAR CON MERCADO PAGO</strong> se creará una preferencia oficial en tiempo real y te redirigiremos a la pasarela protegida de Mercado Pago.
                      </p>

                      {/* Tarjetas de prueba oficiales de la guía */}
                      <div className="bg-white rounded-2xl p-4 border border-sky-200/80 space-y-2.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                          Tarjetas de Prueba Oficiales para Sandbox (Argentina)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
                            <span className="font-black text-emerald-800 block text-[10px] uppercase">
                              Pago Aprobado (Éxito)
                            </span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              4000 0000 0000 0001
                            </span>
                            <p className="text-[10px] text-slate-500">
                              Vto: Futura (ej. 12/28) • CVV: 123 • Titular: APRO
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-0.5">
                            <span className="font-black text-red-800 block text-[10px] uppercase">
                              Rechazado (Fondos)
                            </span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              4000 0000 0000 0002
                            </span>
                            <p className="text-[10px] text-slate-500">
                              Vto: Futura (ej. 12/28) • CVV: 123 • Titular: RECH
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-0.5">
                            <span className="font-black text-amber-800 block text-[10px] uppercase">
                              Pendiente Acreditación
                            </span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              4000 0000 0000 0003
                            </span>
                            <p className="text-[10px] text-slate-500">
                              Vto: Futura (ej. 12/28) • CVV: 123 • Titular: PEND
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-sky-800">
                        Al completar el pago, Mercado Pago te retornará automáticamente a <strong>/checkout/resultado</strong> actualizando el estado de tu orden y vaciando el carrito.
                      </p>
                    </div>
                  </div>
                )}

                {isCardSelected && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    {/* Botonera de prueba rápida para entorno local sin Mercado Pago */}
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600">
                        <Sparkles className="w-3.5 h-3.5 text-[#00A811]" />
                        <span>Simulador de Pasarela Local (Modo Prueba)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleFillApprovedDemoCard}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Autocompletar Tarjeta Aprobada
                        </button>
                        <button
                          type="button"
                          onClick={handleFillDeclinedDemoCard}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Simular Tarjeta Rechazada
                        </button>
                      </div>
                    </div>

                    {/* Marca de Tarjeta */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Seleccioná la entidad / marca *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CARD_BRANDS.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setCardBrand(b.id)}
                            className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                              cardBrand === b.id
                                ? "border-slate-950 bg-slate-950 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cuotas (solo Crédito) */}
                    {paymentOption === "TARJETA_CREDITO" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Cantidad de cuotas *
                        </label>
                        <div className="space-y-2">
                          {CREDIT_INSTALLMENTS.map((plan) => {
                            const perInstallment =
                              createdOrder.totals.total / plan.count;
                            const isPlanSelected = installments === plan.count;
                            return (
                              <label
                                key={plan.count}
                                onClick={() => setInstallments(plan.count)}
                                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isPlanSelected
                                    ? "border-[#00A811] bg-emerald-50/40 font-bold"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name="installments"
                                    checked={isPlanSelected}
                                    onChange={() => setInstallments(plan.count)}
                                    className="text-[#00A811] cursor-pointer"
                                  />
                                  <span className="text-slate-900">
                                    {plan.label}
                                  </span>
                                </div>
                                <span className="font-black text-slate-950">
                                  {plan.count} x{" "}
                                  {formatCurrency(perInstallment)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Datos de la Tarjeta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Número de tarjeta *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardNumber}
                          onChange={(e) => {
                            const formatted = formatCardNumberInput(
                              e.target.value
                            );
                            setCardNumber(formatted);
                            setSimulateDecline(
                              formatted.replace(/\D/g, "").endsWith("0000")
                            );
                          }}
                          placeholder="4509 9535 6623 3704"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nombre y apellido como figura en la tarjeta *
                        </label>
                        <input
                          type="text"
                          value={cardHolderName}
                          onChange={(e) =>
                            setCardHolderName(e.target.value.toUpperCase())
                          }
                          placeholder="EJ: MARTÍN GÓMEZ"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm uppercase focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Vencimiento (MM/AA) *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardExpiry}
                          onChange={(e) =>
                            setCardExpiry(formatCardExpiryInput(e.target.value))
                          }
                          placeholder="12/29"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Código de seguridad (CVV) *
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          placeholder="123"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentOption === "TRANSFERENCIA" && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3 text-xs text-amber-950">
                      <p className="font-extrabold">
                        Datos oficiales de cuenta para transferir{" "}
                        {formatCurrency(createdOrder.totals.total)}:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white rounded-xl p-3 border border-amber-200/70">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Alias
                            </span>
                            <span className="font-black text-slate-900">
                              MATACOS.DEPORTES.FSA
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyText(
                                "MATACOS.DEPORTES.FSA",
                                "step2-alias"
                              )
                            }
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Copiar Alias"
                          >
                            {copiedField === "step2-alias" ? (
                              <Check className="w-3.5 h-3.5 text-[#00A811]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              CBU
                            </span>
                            <span className="font-black text-slate-900 text-[11px] break-all">
                              0110263720026300489124
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyText(
                                "0110263720026300489124",
                                "step2-cbu"
                              )
                            }
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0 cursor-pointer"
                            title="Copiar CBU"
                          >
                            {copiedField === "step2-cbu" ? (
                              <Check className="w-3.5 h-3.5 text-[#00A811]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Titular
                          </span>
                          <span className="font-bold text-slate-800">
                            MUJICA SANDRA ISABEL
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            CUIT
                          </span>
                          <span className="font-bold text-slate-800">
                            27-18036080-3
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Al continuar, tu pedido quedará en estado{" "}
                        <strong>Pago Pendiente</strong> (no confirmado aún) hasta verificar la acreditación del comprobante.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Número de comprobante / operación (opcional si ya transferiste)
                      </label>
                      <input
                        type="text"
                        value={transferReference}
                        onChange={(e) => setTransferReference(e.target.value)}
                        placeholder="Ej: COELSA-98441230"
                        maxLength={80}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                )}

                {paymentOption === "PAGO_LOCAL" && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-950">
                      <div className="flex items-center gap-2 font-extrabold">
                        <Store className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          Pago presencial al retirar en Saavedra 241, Formosa Capital
                        </span>
                      </div>
                      <p className="text-amber-900 leading-relaxed">
                        Tu pedido quedará registrado como{" "}
                        <strong>Reserva con Pago Pendiente</strong>. Al acercarte a nuestro local presentando el código{" "}
                        <strong>{createdOrder.orderCode}</strong> y tu DNI podrás abonar en caja con Efectivo, Tarjetas o QR.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Columna Derecha: Resumen Congelado de la Reserva y Botón de Pago (5 cols) */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                      Orden {createdOrder.orderCode}
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-950">
                      Resumen Reservado
                    </h2>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#00A811]" />
                </div>

                {/* Lista de ítems reservados */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {createdOrder.items.map((item) => (
                    <div
                      key={item.variantId}
                      className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {item.quantity}x {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Talle {item.size} • {item.color}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 shrink-0">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Entrega seleccionada */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Entrega configurada
                  </span>
                  <p className="font-bold text-slate-900">
                    {createdOrder.shipping.address}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Comprador: {createdOrder.customer.name} (DNI{" "}
                    {createdOrder.customer.dni})
                  </p>
                </div>

                {/* Desglose de importes */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Productos</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(createdOrder.totals.subtotalProducts)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Envío / Entrega</span>
                    <span className="font-bold text-emerald-700">
                      {createdOrder.totals.shippingCost === 0
                        ? "Gratis"
                        : formatCurrency(createdOrder.totals.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-base font-black text-slate-950 pt-3 border-t border-slate-200">
                    <span>TOTAL</span>
                    <span className="text-2xl text-[#00A811]">
                      {formatCurrency(createdOrder.totals.total)}
                    </span>
                  </div>
                  {paymentOption === "TARJETA_CREDITO" && installments > 1 && (
                    <p className="text-[11px] text-right font-bold text-emerald-700">
                      En {installments} cuotas sin interés de{" "}
                      {formatCurrency(installmentAmount)}
                    </p>
                  )}
                </div>

                {/* Botón de Ejecución del Pago */}
                <button
                  type="submit"
                  disabled={isProcessingPayment || isCancellingOrder || isExpired}
                  className={`w-full py-4 px-6 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed ${
                    paymentOption === "MERCADOPAGO"
                      ? "bg-[#009ee3] hover:bg-[#008ac7] text-white shadow-[#009ee3]/20 disabled:bg-slate-200 disabled:text-slate-400"
                      : "bg-[#00D615] hover:bg-[#00b812] text-slate-950 shadow-[#00D615]/20 disabled:bg-slate-200 disabled:text-slate-400"
                  }`}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {paymentOption === "MERCADOPAGO"
                          ? "Conectando con Mercado Pago Sandbox..."
                          : isCardSelected
                            ? "Autorizando pago con tarjeta..."
                            : "Registrando modalidad de pago..."}
                      </span>
                    </>
                  ) : paymentOption === "MERCADOPAGO" ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        PAGAR CON MERCADO PAGO ({formatCurrency(createdOrder.totals.total)})
                      </span>
                    </>
                  ) : isCardSelected ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        PAGAR {formatCurrency(createdOrder.totals.total)} AHORA
                      </span>
                    </>
                  ) : paymentOption === "TRANSFERENCIA" ? (
                    <>
                      <Landmark className="w-4 h-4" />
                      <span>REGISTRAR PAGO POR TRANSFERENCIA</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>MANTENER RESERVA PARA ABONAR EN CAJA</span>
                    </>
                  )}
                </button>
              </div>
            </aside>
          </form>
        </main>

        <EcommerceFooter />
      </div>
    );
  }

  // =========================================================================
  // CARRITO VACÍO (SIN RESERVA ACTIVA)
  // =========================================================================
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <EcommerceHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
            {formError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 text-xs font-semibold text-left">
                {formError}
              </div>
            )}
            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-slate-900">
              Tu carrito está vacío
            </h1>
            <p className="text-xs text-slate-500">
              Agregá productos desde nuestro catálogo para iniciar tu compra online.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explorar Catálogo</span>
            </Link>
          </div>
        </main>
        <EcommerceFooter />
      </div>
    );
  }

  // =========================================================================
  // PASO 1: CONTACTO, MODALIDAD DE ENTREGA Y RESERVA DE STOCK
  // =========================================================================
  const validatedMap = new Map(
    (validation?.items ?? []).map((v) => [v.variantId, v])
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <EcommerceHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Seguir comprando en el catálogo</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight">
              Iniciar Compra
            </h1>
          </div>

          <button
            type="button"
            onClick={() => void runLiveValidation()}
            disabled={isValidating}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isValidating ? "animate-spin text-[#00A811]" : ""}`}
            />
            <span>
              {isValidating ? "Verificando stock..." : "Stock verificado en vivo"}
            </span>
          </button>
        </div>

        {renderCheckoutStepper()}

        {/* Identity Banner: Logged-in vs Guest */}
        {activeCustomer ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-950">
              <div className="w-8 h-8 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center font-black shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold">
                  Sesión iniciada como {activeCustomer.name} ({activeCustomer.email})
                </p>
                <p className="text-emerald-800 text-[11px]">
                  Este pedido quedará vinculado automáticamente al historial de tu cuenta.
                </p>
              </div>
            </div>
            <Link
              href="/cuenta?tab=perfil"
              className="text-xs font-bold text-emerald-900 underline hover:text-emerald-700 shrink-0"
            >
              Editar perfil
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <User className="w-4 h-4 text-[#00A811] shrink-0" />
              <span>
                ¿Tenés cuenta en Matacos Deportes? Iniciá sesión para autocompletar tus datos o continuá abajo como{" "}
                <strong>invitado sin registrarte</strong>.
              </span>
            </div>
            <Link
              href="/cuenta?redirect=/checkout"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 text-center transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        )}

        {/* Alerts */}
        {priceChangeBanner && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Actualizamos el importe de uno o más artículos según la lista de precios vigente en tienda.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPriceChangeBanner(false)}
              className="text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start gap-2.5 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Main 2-Column Checkout Layout (Step 1) */}
        <form
          onSubmit={handleReserveAndGoToPayment}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
        >
          {/* Left Column: Customer Data & Delivery Options (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Datos del Comprador */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs font-black flex items-center justify-center">
                  A
                </span>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950">
                  Datos del Comprador
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Martín Gómez"
                    required
                    minLength={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    DNI o CUIT *
                  </label>
                  <input
                    type="text"
                    value={customerDni}
                    onChange={(e) => setCustomerDni(e.target.value)}
                    placeholder="Ej: 38999111"
                    required
                    minLength={7}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: 3704556677"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </section>

            {/* Modalidad de Entrega */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 text-white text-xs font-black flex items-center justify-center">
                  B
                </span>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950">
                  Modalidad de Entrega
                </h2>
              </div>

              <div className="space-y-3">
                {SHIPPING_OPTIONS.map((option) => {
                  const isSelected = shippingMethod === option.method;
                  return (
                    <label
                      key={option.method}
                      onClick={() => setShippingMethod(option.method)}
                      className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#00A811] bg-emerald-50/40 ring-1 ring-[#00A811]"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={option.method}
                          checked={isSelected}
                          onChange={() => setShippingMethod(option.method)}
                          className="mt-1 text-[#00A811] focus:ring-[#00A811] cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {option.title}
                            </span>
                            {option.badge && (
                              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {option.subtitle}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs sm:text-sm font-black text-slate-900 shrink-0">
                        {option.cost === 0
                          ? "Gratis"
                          : formatCurrency(option.cost)}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Campos condicionales de domicilio */}
              {requiresAddress ? (
                <div className="pt-3 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Calle, número y piso / departamento *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Ej: Av. 25 de Mayo 850, Piso 2 Depto B"
                      required
                      minLength={5}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  {shippingMethod === "CORREO_ARGENTINO" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Localidad / Provincia *
                        </label>
                        <input
                          type="text"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          placeholder="Ej: Clorinda, Formosa"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Código Postal *
                        </label>
                        <input
                          type="text"
                          value={shippingPostalCode}
                          onChange={(e) =>
                            setShippingPostalCode(e.target.value)
                          }
                          placeholder="Ej: 3610"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 flex items-center gap-2.5 text-xs text-slate-700">
                  <MapPin className="w-4 h-4 text-[#00A811] shrink-0" />
                  <span>
                    Retirás sin costo presentando tu DNI y código de orden en{" "}
                    <strong>Saavedra 241, Formosa Capital</strong> (Lun a Sáb 8:00–12:30 y 17:00–21:00).
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas adicionales sobre el pedido o entrega (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Retira un familiar / Timbre roto, llamar al llegar..."
                  maxLength={500}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900 resize-none"
                />
              </div>
            </section>

            {/* Información de cómo funciona la Reserva antes del Pago */}
            <section className="bg-emerald-50/70 rounded-3xl border border-emerald-200/90 p-5 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-extrabold text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-[#00A811] shrink-0" />
                <span>
                  ¿Cómo protegemos tu stock mientras pagás?
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Al hacer clic en <strong>Continuar al Pago y Reservar Stock</strong>, bloquearemos tus unidades durante{" "}
                <strong>15 minutos</strong> en nuestro inventario para que nadie más pueda comprarlas mientras completás el pago con Tarjeta (Crédito/Débito), Transferencia Bancaria o Pago en Mostrador.
              </p>
            </section>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-950">
                  Resumen de tu Carrito (
                  {items.reduce((s, i) => s + i.quantity, 0)})
                </h2>
                <Truck className="w-4 h-4 text-[#00A811]" />
              </div>

              {/* Cart Items in Checkout */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {items.map((item) => {
                  const vInfo = validatedMap.get(item.variantId);
                  const hasIssue = vInfo && !vInfo.hasEnoughStock;

                  return (
                    <div
                      key={item.variantId}
                      className={`p-3 rounded-2xl border space-y-2 ${
                        hasIssue
                          ? "border-red-300 bg-red-50/50"
                          : "border-slate-100 bg-slate-50/70"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 p-1.5 shrink-0 flex items-center justify-center">
                          <img
                            src={item.imageUrl || "/placeholder-product.svg"}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder-product.svg";
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase text-slate-400">
                                {item.brand}
                              </p>
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Talle {item.size} • {item.color}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.variantId)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                              title="Quitar artículo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.variantId, -1)
                                }
                                className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.variantId, 1)
                                }
                                disabled={item.quantity >= item.availableStock}
                                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-35 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="text-xs font-black text-slate-900">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {hasIssue && vInfo?.issueMessage && (
                        <p className="text-[11px] font-bold text-red-700 bg-red-100/80 px-2.5 py-1.5 rounded-lg">
                          {vInfo.issueMessage}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal productos</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(subtotalProducts)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>{selectedShippingOption.title}</span>
                  <span className="font-bold text-emerald-700">
                    {shippingCost === 0
                      ? "Gratis"
                      : formatCurrency(shippingCost)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-base font-black text-slate-950 pt-3 border-t border-slate-200">
                  <span>TOTAL</span>
                  <span className="text-2xl text-[#00A811]">
                    {formatCurrency(totalOrder)}
                  </span>
                </div>
              </div>

              {/* Submit Button -> Avanza a Paso 2 reservando stock */}
              <button
                type="submit"
                disabled={
                  isSubmittingReservation ||
                  isValidating ||
                  Boolean(validation?.hasStockIssues)
                }
                className="w-full py-4 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmittingReservation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Reservando stock por 15 min...</span>
                  </>
                ) : (
                  <>
                    <span>CONTINUAR AL PAGO Y RESERVAR STOCK</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                En el siguiente paso elegirás tu medio de pago • Matacos Deportes (Saavedra 241, Formosa).
              </p>
            </div>
          </aside>
        </form>
      </main>

      <EcommerceFooter />
    </div>
  );
}
