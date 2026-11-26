# SPEC: Liberación Automática de Reservas, Notificaciones de Compra y Panel de Gestión de Órdenes Web

**Status:** `ready-for-agent`  
**Domain Area:** E-Commerce / Inventory & Logistics Management  
**Target Branch:** `feature/ecommerce-checkout-redesign`  
**Base Branch:** `develop`  

---

## Problem Statement

Actualmente, el flujo de compra online en Matacos Deportes presenta tres fricciones críticas que comprometen la operativa unificada del local físico de Saavedra 241 y la experiencia del cliente digital:

1. **Bloqueo indefinido de inventario por carritos abandonados:** Cuando un comprador web inicia el proceso de compra, el sistema incrementa `stockReserved` en las variantes correspondientes para evitar sobreventas concurrentes. Sin embargo, si el usuario abandona la pestaña, cierra el navegador o desiste de pagar en Mercado Pago, las prendas y calzados quedan comprometidos de forma indefinida. En una tienda con existencias limitadas (talles únicos en salón), esto bloquea e impide que los vendedores de mostrador vendan físicamente esa mercadería a clientes presentes en el local.
2. **Incertidumbre pospago y ausencia de confirmación omnicanal:** Tras completar el pago, el comprador no recibe una confirmación inmediata por correo electrónico con el resumen inmutable de los artículos adquiridos, el importe debitado ni su código correlativo de seguimiento (`WEB-2026-XXXX`). Asimismo, carece de un canal ágil y contextual de contacto por WhatsApp para consultar dudas inmediatas sobre la entrega o el retiro en sucursal.
3. **Falta de visibilidad y control logístico para el personal de salón:** Los vendedores y encargados de Saavedra 241 no disponen de una interfaz en el panel operativo del comercio para visualizar las órdenes web entrantes, conocer qué pedidos deben embalar, cambiar los estados del ciclo de despacho (`EN_PREPARACION`, `LISTO_RETIRO`, `EN_CAMINO`, `ENTREGADO`) ni vincular el código de seguimiento de Correo Argentino o coordinar por WhatsApp con el cliente.

---

## Solution

Implementar una solución integral dividida en tres módulos sincronizados con las reglas de negocio de Matacos Deportes:

1. **Ciclo de Vida de Reserva con TTL de 15 Minutos y Expiración Preventiva:**
   - Asignar una ventana de vigencia estricta de 15 minutos (`reservedUntil`) a toda orden web en estado `PENDIENTE_PAGO`.
   - Configurar la expiración nativa en la preferencia de Mercado Pago Checkout Pro (`expires: true` y `expiration_date_to`), bloqueando preventivamente el cobro al cliente si la reserva caducó.
   - Proveer un endpoint transaccional protegido (`/api/cron/release-expired-reservations`) para que un cron libere automáticamente el `stockReserved`, cancele órdenes vencidas y registre el movimiento de auditoría sin intervención humana.
   - Incorporar una salvaguarda reactiva (*fail-safe*) en el Webhook: si un pago ingresa tardíamente y el stock ya se vendió en el local, el sistema rechaza la venta, emite un reembolso automático vía API de Mercado Pago (`Payment.refund`) y notifica al cliente por correo.
2. **Confirmaciones de Compra Automáticas y Asistencia Contextual:**
   - Despacho automático de correo electrónico con plantilla de marca (`sendOrderConfirmationEmail`) en el momento exacto en que la orden pasa a `COMPLETADA`, incluyendo desglose de productos, total, método de entrega y enlace directo al portal de seguimiento.
   - Enlace interactivo contextual de WhatsApp (`wa.me`) con el número comercial de Saavedra 241 en la pantalla de éxito post-pago y en la vista de seguimiento, precargando el código del pedido y nombre del cliente.
3. **Panel Operativo de Órdenes Web y Despacho para Vendedores:**
   - Sección dedicada en el Dashboard del comercio (`WebOrdersView`) accesible para vendedores, encargados y administradores.
   - Filtros por estado de pago y estado logístico, visor de datos de contacto y detalle de variantes para picking en depósito/salón.
   - Acciones para actualizar el estado de envío, cargar el código de guía de Correo Argentino (con disparo de email al cliente), imprimir etiqueta térmica de empaque y abrir chat directo de WhatsApp con el comprador.

---

## User Stories

1. As an online shopper, I want my selected items to be temporarily reserved for 15 minutes during checkout, so that no one else buys them out from under me while I enter my payment details.
2. As an online shopper, I want to clearly see a countdown timer during checkout, so that I know exactly how much time I have left before my reservation expires.
3. As a physical store customer at Saavedra 241, I want items from abandoned online checkouts to return to available stock quickly, so that I can buy clothing that is physically present in the store.
4. As an in-store salesperson, I want abandoned online reservations to expire automatically after 15 minutes, so that I don't have to manually ask an administrator to release locked stock.
5. As an online shopper who takes longer than 15 minutes to pay, I want Mercado Pago to clearly inform me that the payment preference has expired, so that my card is not debited when the item is no longer guaranteed.
6. As an online shopper whose payment arrives after reservation expiration when the item is already sold out in store, I want an immediate full refund to my original payment method, so that I do not lose my money.
7. As an online shopper whose payment arrives after reservation expiration when the item is already sold out in store, I want to receive an immediate email explaining the situation and confirming my refund, so that I have peace of mind.
8. As an online shopper completing a payment, I want to receive an instant order confirmation email with my order code, items summary, shipping method, and tracking link, so that I have an official digital receipt.
9. As an online shopper completing a payment, I want to see a confirmation screen with a direct WhatsApp button to Saavedra 241 preloaded with my order code, so that I can immediately ask questions or coordinate delivery with store staff.
10. As an in-store salesperson, I want a dedicated "Órdenes Web" section in the local dashboard, so that I can see all incoming e-commerce orders in one organized place.
11. As an in-store salesperson, I want to filter web orders by payment status (Pendiente de Pago, Completada, Cancelada) and shipping status (Pendiente, En Preparación, Listo para Retiro, En Camino, Entregado), so that I can prioritize which orders need packing.
12. As an in-store salesperson, I want to view the full details of a web order (customer name, DNI, phone number, delivery address, notes, items, sizes, colors, and quantities), so that I can assemble the package accurately from store shelves or warehouse.
13. As an in-store salesperson, I want to change an order's status to "En Preparación" when I start picking items, so that the team knows someone is handling it.
14. As an in-store salesperson packing an order for in-store pickup, I want to mark it as "Listo para Retiro", so that the customer is notified that their order is waiting at Saavedra 241.
15. As an in-store salesperson shipping an order via Correo Argentino, I want to enter the package tracking code and mark it as "En Camino", so that the buyer receives their tracking number and direct tracking link.
16. As an online shopper, I want to receive an email notification whenever my order status changes (e.g. ready for pickup or shipped with tracking code), so that I stay informed of my package's journey.
17. As an in-store salesperson, I want a single-click WhatsApp button next to each web order that opens a chat with the customer's phone number, so that I can quickly reach out if a size is disputed or to coordinate a local delivery window.
18. As a store manager, I want to see an audit note on any order that was automatically cancelled due to expiration, so that I have complete transparency on why stock was returned to inventory.
19. As a system administrator, I want an authenticated cron endpoint that can be called periodically by Docker crond or host schedulers to release expired reservations, so that expired holds never accumulate in the database.
20. As a cashier balancing the cash register, I want online cancellations and automatic refunds to never touch physical store cash shifts or cause register discrepancies, so that the physical drawer remains 100% accurate.

---

## Implementation Decisions

### 1. Database Schema Extensions (Prisma)
- In entity `Sale`:
  - Add `reservedUntil DateTime?` column with an index `@@index([channel, status, reservedUntil])` to allow high-speed querying of expired unpaid web orders.
  - Notes field `notes` used to append structured audit trails (e.g. `[SISTEMA]: Reserva vencida automáticamente tras 15 minutos`).

### 2. Native Preference Expiration (Mercado Pago SDK v2)
- In the Mercado Pago preference creation module:
  - Set `expires: true`.
  - Set `expiration_date_to: reservedUntil.toISOString()`.
  - Disable cash payment methods with 48h delay (`ticket` / Rapipago / Pago Fácil) for express web reservations, prioritizing instant clearing methods (credit card, debit card, Mercado Pago balance) to honor the 15-minute inventory guarantee.

### 3. Expiration Worker / Route Handler (`/api/cron/release-expired-reservations`)
- Secured with `Authorization: Bearer <CRON_SECRET>`.
- Executes inside an atomic Prisma transaction (`prisma.$transaction`):
  1. Finds all sales with `channel: "WEB"`, `status: "PENDIENTE_PAGO"`, and `reservedUntil < now()`.
  2. Updates order status to `CANCELADA`.
  3. Decrements `stockReserved` by `item.quantity` (ensuring values never drop below zero with `Math.max(0, ...)`).
  4. Records `InventoryMovement` of type `RESERVA_EXPIRADA` with location and stock audit.
  5. Returns a JSON payload with counts of released orders and variants.

### 4. Reactive Fail-Safe in Payment Webhook (`confirmOnlinePayment`)
- When a payment approval webhook arrives:
  1. If the sale is already `CANCELADA` or if current physical stock (`stockStore + stockWarehouse`) is lower than the order requirement:
     - Keep sale as `CANCELADA`.
     - Invoke `mpClient.payment.refund({ payment_id })`.
     - Log note: `[MERCADOPAGO]: Reembolso automático emitido por sobreventa / expiración`.
     - Dispatch cancellation email to buyer explaining stock unavailability and instant refund.
  2. If sufficient physical stock remains:
     - Deduct physical stock, set sale status to `COMPLETADA`, trigger confirmation email and record inventory movements.

### 5. Email Notification Integration
- Connect `sendOrderConfirmationEmail` directly into the post-payment completion pipeline.
- Connect `sendOrderShippingUpdateEmail` into the shipping status update action executed by store personnel.

### 6. Salesperson Web Orders Interface (`WebOrdersView`)
- Integrate a new "Órdenes Web" view into the dashboard layout.
- Interface capabilities:
  - Table of orders with columns: Código, Cliente, Teléfono/WhatsApp, Fecha, Total, Estado Pago, Estado Envío, Acciones.
  - Drawer / Modal with order items (photos, names, size, color, quantity).
  - Status transition select box (`PENDIENTE` $\rightarrow$ `EN_PREPARACION` $\rightarrow$ `LISTO_RETIRO` / `EN_CAMINO` $\rightarrow$ `ENTREGADO`).
  - Text input for `shippingTrackingCode` when selecting `EN_CAMINO` (automatically embedding Correo Argentino tracking URL).
  - One-click button to open WhatsApp chat with `https://wa.me/<customerPhone>?text=...`.
  - Printable packing slip with recipient name, address, and items list for box labeling.

---

## Testing Decisions

### What makes a good test
- Tests must verify external behavior through public entry points (Server Actions and Route Handlers) without relying on internal implementation details.
- Stock changes must be strictly verified before and after transactions.
- Concurrency and idempotency must be confirmed (calling the cron twice on the same expired order must not release stock twice).

### Modules Tested
1. **Reservation & Expiration Suite:**
   - Verify that creating a web order increases `stockReserved` and populates `reservedUntil`.
   - Verify that invoking the cron before `reservedUntil` does not touch the order.
   - Verify that invoking the cron after `reservedUntil` cancels the order and decrements `stockReserved`.
   - Verify that physical stock (`stockStore`, `stockWarehouse`) was never decremented.
2. **Late Payment & Refund Fail-Safe Suite:**
   - Simulate payment arrival on an expired order where physical stock was depleted $\rightarrow$ verify refund API called, status stays `CANCELADA`.
   - Simulate payment arrival on an expired order where physical stock is still available $\rightarrow$ verify stock deducted and order rescued to `COMPLETADA`.
3. **Salesperson Operations Suite:**
   - Verify status transitions and tracking code persistence.
   - Verify email trigger mock calls upon status change.

### Prior Art
- `scripts/test-rf16-mercadopago.ts`: Precedent for testing Mercado Pago preferences, webhooks, and transactional atomicity.
- `scripts/test-rf29-customer-portal.ts`: Precedent for customer orders, tracking codes, and email dispatchers.

---

## Out of Scope

1. **Meta WhatsApp Business Cloud API Integration:** Automated direct bot sending via WhatsApp server-side is out of scope; operations will use the approved `wa.me` contextual links.
2. **Automated Carrier API Dispatch:** Automatic generation of Correo Argentino airway bills (guías) via SOAP/REST API is out of scope; the salesperson pastes the tracking code provided by the postal branch.
3. **Physical POS Hardware Dispatch:** Printing packing slips to thermal receipt printers from the web browser is handled via standard browser print dialog, not raw ESC/POS network sockets.

---

## Further Notes

- The 15-minute reservation TTL applies exclusively to the `WEB` channel. In-store showroom pre-sales (`channel: "MOSTRADOR"`, Terminal 1) follow the daily shift lifecycle governed by cashier shift closures (`CashShift`).
