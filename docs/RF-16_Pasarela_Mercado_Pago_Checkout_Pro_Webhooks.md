# [RF-16] Pasarela de Pagos Online con Mercado Pago (Checkout Pro) y Webhooks de Confirmación

**Estado:** `ready-for-agent`  
**Módulo:** Módulo 3 — Tienda Web (E-Commerce) y Checkout  
**Requerimiento Relacionado:** RF-15 (Carrito y Guest Checkout), RF-19 (Opciones de Envío)  

---

## Problem Statement

Los clientes de la tienda online de Matacos Deportes que agregan productos a su carrito no disponen de una pasarela electrónica para abonar sus compras de manera digital, segura y en cuotas. Al intentar avanzar desde el carrito hacia el checkout, no existe una pantalla donde ingresar sus datos de entrega ni elegir un medio de pago, lo que impide concretar las ventas web. Además, el comercio carece de un mecanismo automático y desatendido que verifique la acreditación de los pagos electrónicos, obligando a verificaciones manuales propensas a errores o retrasos en la preparación de pedidos.

Por otra parte, los costos de envío y las promociones comerciales (como el beneficio de Envío Gratis a partir de determinado monto de compra) actualmente no cuentan con un cálculo automático ni con un umbral configurable que el administrador pueda ajustar frente a variaciones de tarifas o estrategias de ventas.

---

## Solution

Implementar la pantalla unificada de finalización de compra (*One-Page Checkout*) y la integración oficial con **Mercado Pago Checkout Pro**, acompañada de un endpoint de **Webhooks asíncronos** para la acreditación automática de pagos.

El comprador completa sus datos personales, selecciona su modalidad de entrega (Retiro en Saavedra 241, Cadetería local o Correo Argentino) y visualiza el cálculo inmediato del flete, beneficiándose con **Envío Gratis** si el subtotal de su compra alcanza o supera el umbral general configurado por el comercio. Al optar por Mercado Pago, el sistema reserva el inventario de forma atómica durante 15 minutos, genera una Preferencia oficial de pago y transfiere al comprador a la pantalla segura de Mercado Pago para abonar con tarjeta de crédito (con cuotas y promociones administradas por el dueño en su cuenta de MP), débito o dinero en cuenta.

Cuando Mercado Pago acredita el cobro, un webhook procesa la notificación de servidor a servidor de manera idempotente, confirmando la orden, asentando el pago y descontando definitivamente el stock físico del inventario.

---

## User Stories

1. As a web buyer, I want to access a unified checkout page directly from my shopping cart, so that I can complete my purchase quickly without unnecessary page reloads.
2. As a guest buyer, I want to provide my contact information (name, DNI/CUIT, email, phone) without creating an account or password, so that I can purchase with zero friction.
3. As a registered customer, I want my shipping and contact details to be pre-filled automatically on the checkout page, so that I do not have to type them every time I shop.
4. As a web buyer, I want to choose between in-store pickup at Saavedra 241 and home delivery, so that I can receive my products in the most convenient way.
5. As a web buyer selecting home delivery, I want to enter my postal code, street address, city, and province, so that the store knows exactly where to ship my items.
6. As a web buyer, I want the system to calculate my shipping cost dynamically based on my selected delivery method, so that I know the exact final amount before paying.
7. As a web buyer, I want to receive 100% free shipping automatically when my order subtotal reaches or exceeds the store's free shipping threshold, so that I can take advantage of volume promotions.
8. As a store administrator, I want to modify the free shipping threshold amount and base shipping rates easily, so that the store can adapt its commercial promotions and freight costs at any time.
9. As a web buyer, I want to see a clear breakdown of product subtotal, shipping cost, and final total, so that there are no surprise fees before confirming my order.
10. As a web buyer, I want to choose between Mercado Pago, direct bank transfer, and in-store cash payment (when picking up locally), so that I can pay with my preferred payment method.
11. As a web buyer selecting Mercado Pago, I want to be redirected to Mercado Pago's official payment portal, so that I can pay using credit cards, debit cards, or Mercado Pago account balance safely.
12. As a web buyer paying with credit card, I want Mercado Pago to recognize my bank and display available installment plans, so that I can finance my purchase according to store promotions.
13. As a store owner, I want installment promotions (such as interest-free installments or buyer-paid financing) to be configured directly in my Mercado Pago seller account, so that our development team does not need to maintain bank promotion rules in code.
14. As a store owner, I want the system to reserve product stock for 15 minutes when a buyer proceeds to Mercado Pago, so that other buyers or counter customers cannot purchase the same items while payment is pending.
15. As a store owner, I want stock reservation to execute under atomic database locks, so that concurrent sales between the physical counter in Saavedra 241 and the online store never cause overselling.
16. As a store owner, I want Mercado Pago to notify our backend asynchronously via webhooks when a payment is approved, so that orders are confirmed automatically without manual staff intervention.
17. As an operations staff member, I want an approved payment to update the order status to paid, record the payment with transaction references, and physically deduct stock from inventory, so that warehouse picking can begin immediately.
18. As an operations staff member, I want webhook notifications to be processed idempotently, so that duplicate webhook deliveries from Mercado Pago never cause double stock deductions or duplicate payments.
19. As a web buyer completing my payment on Mercado Pago, I want to be redirected back to an order summary page, so that I can view my order confirmation code and purchase details.
20. As a web buyer whose payment was rejected on Mercado Pago, I want to see a clear explanation on the result page with an option to retry or contact customer support via WhatsApp, so that I do not lose my order.
21. As a web buyer whose payment is pending (such as cash payment coupons), I want to see instructions and expiration reminders on the result page, so that I can pay before the stock reservation expires.
22. As an operations staff member, I want orders with rejected or cancelled payments to release their reserved stock automatically, so that available inventory is immediately restored for other customers.
23. As a store accountant, I want online Mercado Pago payments to be categorized under a distinct payment method from counter physical QR payments, so that cash register closures and bank reconciliations remain clean.

---

## Implementation Decisions

### 1. Modules and Components
- **Checkout View Module:** A single-page checkout interface that orchestrates customer information collection, delivery selection, dynamic shipping cost calculation with free shipping promotion badges, payment method selection, and order confirmation.
- **Payment Gateway Integration Module:** Backend service responsible for creating Mercado Pago Preferences via the official Mercado Pago SDK, setting item descriptions, quantities, unit prices, shipping costs, customer information, back URLs, and external reference codes.
- **Asynchronous Webhook Ingestion Module:** API route handler that receives event notifications from Mercado Pago, validates security headers and event integrity, queries the Mercado Pago Payment API to verify the definitive status, and executes atomic state transitions.
- **Post-Payment Result View:** A unified outcome screen that parses return query parameters, confirms order status, and displays either a success voucher, pending payment instructions, or a retry workflow.
- **Developer Sandbox Governance Policy:**
  - **Segregación Estricta:** Queda terminantemente prohibido utilizar credenciales de producción (`PROD-...`) o cuentas reales de los dueños durante el desarrollo local.
  - **Credenciales Sandbox:** Los desarrolladores crean su aplicación en `mercadopago.com.ar/developers`, extraen las claves `TEST-...` y configuran usuarios de prueba (*Test Users*) con saldo ficticio y tarjetas de prueba oficiales (`APRO`, `CONT`, `CALL`).
  - **Pasaje a Producción:** Las credenciales de producción son provistas exclusivamente por el titular en el VPS final vía variables de entorno.

### 2. Architectural and Schema Decisions
- **Mercado Pago Integration Mode:** Exclusively **Checkout Pro**. The customer completes credit/debit card data and installments inside Mercado Pago's hosted interface or modal. The application never collects, tokenizes, or stores credit card numbers, avoiding PCI-DSS overhead and legal liability.
- **Payment Method Differentiation:** A dedicated payment method identifier is added to distinguish online Mercado Pago gateway payments from in-store physical QR counter payments in the database.
- **Order Lifecycle States:** Web orders transition through an explicit lifecycle:
  - Initial creation with stock reservation: Pending Payment (`PENDIENTE_PAGO`)
  - Webhook payment approved: Paid (`PAGADO` / `COMPLETADA`)
  - Order packaging and dispatch: In Preparation (`EN_PREPARACION`) ➔ In Transit / Ready for Pickup (`EN_CAMINO` / `LISTO_RETIRO`) ➔ Delivered (`ENTREGADO`)
  - Expiration after 15 minutes or gateway rejection: Cancelled (`CANCELADA`)
- **Configurable Free Shipping Threshold:** A single general free shipping threshold is maintained in the business configuration. Any order whose product subtotal meets or exceeds this threshold receives free shipping regardless of destination, while orders below the threshold apply the standard base rate for the chosen delivery method.
- **Atomic Stock Reservation and Idempotent Confirmation:** Order creation reserves stock using pessimistic database row locking. When the payment webhook arrives, processing is wrapped in an atomic transaction that checks whether the payment was already recorded, ensuring idempotency.

### 3. API and Payload Contracts

```typescript
// Input contract for creating an order with payment preference
interface CreateWebOrderPreferenceInput {
  customerName: string;
  customerDni: string;
  customerEmail: string;
  customerPhone: string;
  shippingMethod: "RETIRO_LOCAL" | "CADETERIA_FORMOSA" | "CORREO_ARGENTINO";
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  paymentMethod: "MERCADOPAGO" | "TRANSFERENCIA" | "EFECTIVO_LOCAL";
  notes?: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
}

// Output contract returned to the checkout interface
interface CreateWebOrderPreferenceResult {
  orderCode: string;
  saleId: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  isFreeShipping: boolean;
  initPoint?: string; // URL to open Mercado Pago Checkout Pro
  reservationExpiresAt: string;
}
```

---

## Testing Decisions

### What Makes a Good Test
Tests must verify external behavioral contracts, data integrity, and atomic guarantees without asserting on private internal implementations:
- Verifying that an order subtotal reaching the threshold automatically sets shipping cost to zero.
- Verifying that creating a web order with Mercado Pago increments reserved stock and establishes a 15-minute expiration window.
- Verifying that an incoming approved payment webhook marks the order as paid, decrements physical store stock, and decrements reserved stock.
- Verifying that duplicate webhook calls for the same payment ID do not duplicate payments or deduct stock twice (idempotency).
- Verifying that an order cancellation releases reserved stock back to available stock.

### Modules to Test
- **Checkout Preference Action:** Validation of input payloads, dynamic freight calculation, threshold promotion rules, and preference generation.
- **Webhook Route Handler:** Signature verification, payment status ingestion, transactional order transition, and stock deduction.
- **Expiration and Rejection Logic:** Automatic stock restitution upon gateway rejection or timeout.

### Prior Art
- Existing automated test suite for guest checkout and stock reservation (`test-rf15-guest-checkout.ts`).
- Transaction and stock deduction integration tests (`test-stock-and-sales.ts`, `test-pos-full-flow.ts`).

---

## Out of Scope

- **Custom / Transparent Card Tokenization (Bricks):** Custom credit card input fields directly on our website are excluded; all card data collection is handled by Mercado Pago Checkout Pro.
- **Direct Merchant Bank Agreements:** Managing custom installment tables or bank discounts in local database tables is excluded; all financing is managed through the owner's Mercado Pago account.
- **Multi-Vendor or Split Payments:** Payments are routed exclusively to the single Mercado Pago merchant account of Matacos Deportes.
- **Automated Carrier API Integration:** Live real-time pricing queries via Correo Argentino / Andreani web services are out of scope; freight is computed via configurable base rates and free shipping rules.

---

## Further Notes

- The Mercado Pago public key and access token are read from environment variables and must be configured with test credentials (`TEST-...`) during staging and production credentials for live launch.
- The webhook endpoint must be publicly accessible via HTTPS in production, or tunneled via local tools during development.
