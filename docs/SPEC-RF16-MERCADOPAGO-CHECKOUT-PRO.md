# SPEC: Pasarela de Pagos Online con Mercado Pago (Checkout Pro), Webhooks y Envíos con Umbral Bonificado (RF-16 / RF-19)

**Status:** `ready-for-agent`  
**Domain Area:** E-Commerce / Payment Gateway & Freight Logistics  
**Target Branch:** `feature/be-rf16-pasarela-mercadopago`  
**Base Branch:** `develop`  

---

## Problem Statement

Los clientes de la tienda online de Matacos Deportes que agregan productos a su carrito no disponen de un flujo operativo para concretar el pago de sus pedidos de manera digital, segura y en cuotas. Al intentar avanzar desde el carrito hacia el checkout, el botón de compra apunta a una ruta inexistente (`/checkout`), impidiendo que el comprador ingrese sus datos de contacto y entrega, o elija una modalidad de cobro.

Adicionalmente, el comercio carece de una integración de pasarela de pagos oficial que valide de forma desatendida la acreditación del dinero mediante notificaciones asíncronas seguras (Webhooks). Esto generaría fricción operativa, riesgo de errores humanos en la verificación de transferencias y retrasos en el despacho o entrega de artículos desde la sucursal de Saavedra 241.

Por último, los costos de flete logístico y las promociones comerciales de envío no cuentan con dinamismo: los costos de cadetería local o correo nacional no deben quedar fijos en el código, y el comercio requiere poder ofrecer **Envío Gratis** cuando el subtotal del pedido alcance o supere un umbral general de compra parametrizable que el administrador pueda ajustar frente a la inflación o campañas promocionales.

---

## Solution

Desarrollar la pantalla unificada de finalización de compra (**One-Page Checkout**) y la integración oficial del backend con **Mercado Pago Checkout Pro**, acompañada de un Route Handler de **Webhooks asíncronos** para la acreditación automática de pagos y una regla dinámica de **Envío Gratis General**:

1. **One-Page Checkout Reactivo (`/checkout`):** Vista de compra fluida estructurada en 3 bloques secuenciales:
   - *Datos de Contacto:* Identificación del comprador (Guest Checkout con nombre, DNI/CUIT, email y teléfono, o precarga automática si el cliente inició sesión según RF-29).
   - *Método y Dirección de Entrega:* Pestañas de selección entre *Retiro en Sucursal Saavedra 241* (gratis) y *Envío a Domicilio* (Cadetería Formosa o Correo Argentino), solicitando calle, número, código postal, localidad y destinatario.
   - *Medio de Pago y Resumen de Totales:* Selector de pago limpio entre Mercado Pago (tarjetas y cuotas), Transferencia Bancaria Directa (RF-17) y Efectivo en mostrador (habilitado únicamente si eligió retiro en local).
2. **Regla de Envío Gratis General Parametrizable:** Se define un umbral general configurable por el administrador (ej: `$ 100.000,00`). Si el subtotal de artículos en el carrito alcanza o supera dicho umbral, el costo de envío se bonifica automáticamente al 100% (`$ 0,00`) y se destaca el beneficio en la interfaz. Si la compra no alcanza el umbral, se aplica la tarifa base correspondiente a la modalidad elegida.
3. **Pasarela Oficial Mercado Pago (Checkout Pro):** Creación transaccional de la Preferencia de Mercado Pago (`Preference.create`) con congelamiento de importes, ítems, flete e información del pagador. Mercado Pago gestiona de forma delegada la tokenización de tarjetas de crédito (Visa, Mastercard, Cabal, Naranja) y débito, el cómputo de cuotas y promociones configuradas por el dueño en su cuenta de MP, y la autenticación bancaria (3D Secure), abstrayendo al comercio del manejo de datos sensibles (cero riesgo PCI-DSS).
4. **Reserva Atómica de Inventario (15 Minutos):** Al generar la orden para pagar, el sistema bloquea los registros de las variantes mediante `SELECT ... FOR UPDATE` en PostgreSQL, pasa la venta a estado `PENDIENTE_PAGO` e incrementa `stockReserved`. Si el pago no se completa en 15 minutos, la orden expira y el stock reservado se restituye al catálogo disponible.
5. **Acreditación Asíncrona e Idempotente por Webhook (`/api/webhooks/mercadopago`):** Notificación de servidor a servidor donde el backend verifica la firma de seguridad, consulta a la API de Mercado Pago la confirmación del pago (`status === "approved"`), transiciona la orden a pagada, asienta el comprobante en `SalePayment` con el método `MERCADOPAGO_ONLINE` y descuenta el stock físico de forma atómica e irreversible.
6. **Pantalla Unificada de Resultado Post-Pago (`/checkout/resultado`):** Interfaz que procesa los parámetros de retorno de Mercado Pago (`status`, `payment_id`, `external_reference`), ofreciendo confirmación de orden, instrucciones de cupón diferido o reintento de pago ante rechazos.

---

## User Stories

1. As a web buyer, I want to click "Iniciar Compra" in the cart drawer, so that I am navigated to a clear and responsive checkout page.
2. As a guest buyer, I want to complete my name, DNI, email, and phone without mandatory account registration, so that I can finish my purchase in seconds.
3. As a registered customer logged into my account, I want my contact details and default shipping address to be automatically filled in on the checkout form, so that I don't waste time typing them again.
4. As a web buyer, I want to choose between in-store pickup at Saavedra 241 and home delivery, so that I can choose how I receive my goods.
5. As a web buyer selecting home delivery, I want to input my street address, house number, apartment/notes, city, and postal code, so that the store dispatches my order to the exact location.
6. As a web buyer, I want to see my shipping fee calculated dynamically before confirming the purchase, so that there are no hidden or unexpected charges.
7. As a web buyer, I want my shipping cost to automatically become $0 (Free Shipping) when my product subtotal reaches the store's minimum free shipping threshold, so that I am rewarded for buying more items.
8. As a store administrator, I want to configure the free shipping threshold and base shipping rates in the system, so that freight policies can be adjusted without rewriting code.
9. As a web buyer, I want to see a transparent summary showing subtotal, shipping cost, promotions applied, and final total in Argentine Pesos (ARS), so that I know exactly what I am paying.
10. As a web buyer, I want to select Mercado Pago as my payment method, so that I can pay using credit card, debit card, or Mercado Pago digital wallet.
11. As a web buyer, I want to select Direct Bank Transfer as an alternative, so that I can pay directly to the store's CBU/Alias and coordinate receipt verification.
12. As a web buyer selecting local pickup, I want the option to pay in cash upon collecting my order at the Saavedra 241 store, so that I have complete payment flexibility.
13. As a web buyer confirming my checkout with Mercado Pago, I want to be redirected to the official Mercado Pago portal, so that I can securely complete my payment without exposing card numbers to the store.
14. As a web buyer on the Mercado Pago payment portal, I want to see available installment options for my credit card according to store financing policies, so that I can choose my preferred installment plan.
15. As the store owner, I want to manage interest-free installments and financing absorption directly inside my Mercado Pago seller dashboard, so that bank promotions update automatically without code maintenance.
16. As the store owner, I want the inventory for purchased items to be atomically reserved for 15 minutes while the customer is on the payment gateway, so that in-store counter cashiers cannot oversell the same units.
17. As an operations staff member, I want an approved payment webhook from Mercado Pago to automatically update the sale status, record the transaction reference, and deduct physical stock, so that the order is immediately ready for packing.
18. As an operations staff member, I want duplicate webhook notifications from Mercado Pago to be processed idempotently, so that duplicate payments or double stock deductions never occur.
19. As a web buyer finishing payment on Mercado Pago, I want to be redirected back to the store's result page with an order confirmation code, so that I have proof of purchase and tracking details.
20. As a web buyer whose payment was denied by their bank, I want to see an explanatory error message on the result page with an immediate option to retry payment or switch payment methods, so that I can complete my order.
21. As a web buyer who chose an offline payment method (Pago Fácil/Rapipago), I want to see payment coupon instructions and the expiration deadline on the result page, so that I can pay before the reservation expires.
22. As an operations staff member, I want expired or rejected orders to automatically cancel and restore their reserved units to available stock, so that active inventory remains accurate.
23. As a store accountant, I want online Mercado Pago sales to be recorded under the `MERCADOPAGO_ONLINE` payment method, so that online revenue is cleanly segregated from in-store physical QR counter collections (`QR_MERCADOPAGO`).

---

## Implementation Decisions

### 1. Payment Integration Pattern: Mercado Pago Checkout Pro
The integration strictly utilizes **Mercado Pago Checkout Pro** via the official Node.js SDK (`mercadopago: ^2.3.0`):
- **Server Action Preference Generation:** The server action `createWebOrderAndPreference` validates the cart, creates the order in PostgreSQL (`SaleStatus: PENDIENTE_PAGO`), locks the requested variants via `SELECT ... FOR UPDATE`, increments `stockReserved`, and calls `new Preference(client).create({ body: preferenceData })`.
- **Preference Payload Composition:**
  - `items`: Title, unit_price, quantity, currency_id ("ARS").
  - `payer`: Name, surname, email, identification (type "DNI", number).
  - `shipments`: Mode, receiver_address, cost.
  - `back_urls`: Success, pending, and failure endpoints routed to `/checkout/resultado`.
  - `auto_return`: "approved".
  - `external_reference`: Matacos order code (`WEB-2026-XXXX`).
  - `notification_url`: The HTTPS webhook endpoint (`/api/webhooks/mercadopago`).
- **Security & Zero Card Data Handling:** No credit card numbers, expiration dates, or CVVs ever pass through our servers or frontend components, ensuring total compliance with PCI-DSS guidelines.

### 2. General Free Shipping Rule & Freight Configuration
- **Single General Threshold:** Configured via `company.ts` / environment variable (`FREE_SHIPPING_THRESHOLD`, default: `$ 100.000,00`).
- **Freight Rule Evaluation:**
  - `RETIRO_LOCAL`: Always `$ 0,00`.
  - `CADETERIA_FORMOSA`: Free (`$ 0,00`) if `subtotal >= FREE_SHIPPING_THRESHOLD`; otherwise base fee (`CADETERIA_BASE_FEE`).
  - `CORREO_ARGENTINO`: Free (`$ 0,00`) if `subtotal >= FREE_SHIPPING_THRESHOLD`; otherwise base fee (`CORREO_ARGENTINO_BASE_FEE`).
- **Dynamic Badge:** When `subtotal >= FREE_SHIPPING_THRESHOLD`, the UI renders a prominent badge: *"¡Tenés Envío Gratis!"*.

### 3. Asynchronous Webhook Route Handler & Atomic Processing
- **Route Handler:** Located at `POST /api/webhooks/mercadopago`.
- **Validation:** Verifies the webhook signature (`x-signature` header using `MERCADOPAGO_WEBHOOK_SECRET`) to protect against spoofing.
- **Event Extraction:** Extracts `data.id` from `type === "payment"` or `topic === "payment"`.
- **State Ingestion & Idempotency:**
  1. Queries the Mercado Pago Payment API via `new Payment(client).get({ id: paymentId })`.
  2. Wraps the database mutation inside `prisma.$transaction`.
  3. Checks if the payment was already recorded in `SalePayment` (matching `referenceCode == paymentId`). If already recorded, returns HTTP 200 immediately without redundant mutations.
  4. If payment status is `"approved"`:
     - Updates `Sale.status` to `COMPLETADA` (o `PAGADO`).
     - Inserts a `SalePayment` record with `method: "MERCADOPAGO_ONLINE"`, amount, card brand, installments, and reference code.
     - Decrements `ProductVariant.stockReserved` by item quantity.
     - Decrements physical stock (`stockStore` or `stockWarehouse`) by item quantity.
     - Inserts audit inventory movement logs (`StockMovement` type `"VENTA_WEB"`).
  5. If payment status is `"rejected"` or `"cancelled"`:
     - Updates `Sale.status` to `CANCELADA`.
     - Decrements `ProductVariant.stockReserved` to return units to available stock.

### 4. Database Schema Adjustments
- **Enum `PaymentMethod` Extension:** Extend `PaymentMethod` in `prisma/schema.prisma` with `MERCADOPAGO_ONLINE` to distinguish from counter `QR_MERCADOPAGO`.
- **Correlation Fields in `Sale`:** Ensure `invoiceNumber` (e.g. `WEB-2026-0001`), `shippingTrackingCode`, and customer snapshot fields remain immutable once paid.

### 5. Developer Sandbox Credentials & Governance Policy
- **Absolute Separation of Environments (Segregación de Entornos):**
  - **PROHIBIDO:** Utilizar credenciales de producción (`PROD-...`) o la cuenta comercial bancaria real de los dueños de Matacos Deportes durante el desarrollo y las pruebas locales.
  - El uso indebido de cuentas reales en staging causaría movimientos monetarios reales, inconsistencias en el libro fiscal y eventuales bloqueos de cuenta.

- **Guía Paso a Paso para Desarrolladores (Generación de Credenciales Sandbox):**
  1. **Creación de la App en Mercado Pago Developers:**
     - Ingresar a [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers) con una cuenta personal de desarrollo de Mercado Pago / Mercado Libre.
     - Ir a *Tus integraciones* ➔ *Crear aplicación* (Nombre sugerido: `Matacos Deportes - Dev Sandbox`, Tipo de solución: `Checkout Pro`).
  2. **Obtención de Claves de Prueba:**
     - En el menú lateral de la app, ingresar a *Credenciales de prueba*.
     - Copiar el `TEST-Access-Token` y la `TEST-Public-Key` e ingresarlos en el archivo local `.env`:
       ```env
       MERCADOPAGO_PUBLIC_KEY="TEST-00000000-0000-0000-0000-000000000000"
       MERCADOPAGO_ACCESS_TOKEN="TEST-0000000000000000-000000-00000000000000000000000000000000-000000000"
       MERCADOPAGO_WEBHOOK_SECRET="test_webhook_secret_sandbox"
       ```
  3. **Generación de Usuarios de Prueba (Test Users):**
     - En la sección *Cuentas de prueba*, crear con 1 clic dos usuarios simulados:
       - *Usuario Vendedor de Prueba:* Asociado a la aplicación para recibir las ventas sandbox.
       - *Usuario Comprador de Prueba:* Cuenta ficticia que viene provista con saldo simulado precargado en su billetera virtual para probar el flujo de checkout como cliente final sin desembolsar dinero.
  4. **Tarjetas de Crédito y Débito de Prueba Oficiales:**
     - Utilizar las tarjetas de prueba provistas por Mercado Pago para validar respuestas de la pasarela:
       - **Pago Aprobado:** Número de tarjeta Visa de prueba oficial de MP (prefijo `4023` o `4509`), cualquier fecha futura (ej: `12/29`), código CVV cualquiera (ej: `123`) y titular `APRO`.
       - **Pago Rechazado por Fondos Insuficientes:** Mismos datos de tarjeta con titular `CONT`.
       - **Pago Rechazado para Llamar al Banco:** Mismos datos de tarjeta con titular `CALL`.

- **Protocolo de Pasaje a Producción:**
  - El sistema no requiere ningún cambio de código para pasar a producción.
  - Al momento del despliegue oficial, el titular comercial de Saavedra 241 genera sus propias *Credenciales de producción* (`PROD-...`) desde su panel fiscal de Mercado Pago y las inyecta como variables de entorno protegidas en el servidor VPS.

---

## Testing Decisions

### Seam Strategy
Testing will be conducted at two programmatic seams:
1. **Server Action Seam (`createWebOrderAndPreference`):** Evaluates input validation, freight cost calculation with free shipping threshold application, atomic row locking, stock reservation increment, and mocked/live Preference generation.
2. **Webhook Route Handler Seam (`POST /api/webhooks/mercadopago`):** Evaluates webhook payload parsing, signature verification, atomic stock deduction, idempotency against repeated calls, and cancellation/release on payment rejection.

### Test Suite Structure
A dedicated automated test suite following repository standards:
- Script: `scripts/test-rf16-mercadopago-checkout.ts`
- Registered in `package.json` under `test:rf16` and integrated into `run-all-backend-tests.ts`.

### Tested Scenarios
1. **Input Validation:** Validates that incomplete addresses reject guest checkout when home delivery is selected, but allow checkout for local pickup.
2. **Free Shipping Threshold Logic:**
   - Cart subtotal `< FREE_SHIPPING_THRESHOLD`: Asserts that base shipping cost is added to order total.
   - Cart subtotal `>= FREE_SHIPPING_THRESHOLD`: Asserts that shipping cost is exactly `$ 0,00` and `total == subtotal`.
3. **Atomic Stock Reservation:** Asserts that confirming an order increments `stockReserved` on each variant and sets `Sale.status == "PENDIENTE_PAGO"`.
4. **Preference Contract Shape:** Asserts that the generated Mercado Pago preference includes correct item lines, shipping fee line, payer details, external reference code, and HTTPS back URLs.
5. **Approved Payment Webhook Ingestion:** Simulates an approved payment event; asserts that `Sale.status` transitions to paid/completed, `SalePayment` is recorded with `method: "MERCADOPAGO_ONLINE"`, physical stock is decremented, and `stockReserved` is freed.
6. **Webhook Idempotency:** Submits the same approved payment webhook twice; asserts that stock is not deducted a second time and no duplicate `SalePayment` rows exist.
7. **Rejected Payment Ingestion:** Simulates a rejected payment event; asserts that `Sale.status` transitions to `CANCELADA` and `stockReserved` is released back to available inventory.

### What Makes a Good Test
Tests must never assert on internal variables or unexported helper functions. Tests must strictly assert on observable external behavior: API HTTP response status codes, JSON payload contracts, and resulting database mutations in PostgreSQL.

### Prior Art
- `scripts/test-rf15-guest-checkout.ts`: Baseline for atomic stock reservations and guest checkout validation.
- `scripts/test-pos-full-flow.ts`: Baseline for payment recording and stock deduction mechanics.

---

## Out of Scope

1. **Custom Card Form Tokenization (Mercado Pago Bricks):** In-page card capture forms are out of scope; all card entry is delegated to Checkout Pro.
2. **Bank Promotion Code Maintenance:** Local database tables for credit card installments and promotions are out of scope; financing is managed directly inside the owner's Mercado Pago dashboard.
3. **Automated Live Courier API Quotes:** Integration with live web services of Correo Argentino / Andreani for real-time dimensional weighing is out of scope; shipping is determined by base rates and the free shipping threshold.
4. **Multi-Seller Marketplace Splits:** Marketplace fee splitting is out of scope; 100% of the funds route to Matacos Deportes.

---

## Further Notes

- All monetary amounts displayed to the user must be formatted in Argentine Pesos using `formatCurrency(amount)` (format `$ 45.000,00`).
- All timestamps and expiration deadlines must operate in the `America/Argentina/Buenos_Aires` time zone.
- Development webhook testing utilizes tunneling (e.g. ngrok or local webhook forwarding) to allow Mercado Pago's cloud servers to post events to the local dev machine.
- In accordance with repository rules, no git commits or git pushes are executed automatically.
