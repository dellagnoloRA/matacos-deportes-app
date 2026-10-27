# SPEC: Portal de Clientes, Autenticación Web, Lista de Favoritos y Seguimiento de Pedidos (RF-29)

**Status:** `ready-for-agent`  
**Domain Area:** E-Commerce / Customer Identity & Loyalty  
**Target Branch:** `feature/rf-29-portal-clientes`  
**Base Branch:** `develop`  

---

## Problem Statement

Actualmente, los clientes de la tienda online de Matacos Deportes solo pueden operar mediante compra anónima (*Guest Checkout*). Esta modalidad resolvió la inmediatez transaccional pero genera los siguientes inconvenientes críticos:

1. **Falta de persistencia de intención de compra:** Los clientes que exploran calzado, indumentaria o accesorios de natación no pueden guardar productos de su interés para comprarlos después o consultarlos desde otro dispositivo, perdiendo artículos en carritos efímeros.
2. **Incertidumbre en el estado del pedido:** Luego de pagar, el comprador no dispone de un panel propio para verificar si su paquete está en preparación en el local de Saavedra 241, si está listo para retiro en sucursal o si ya fue despachado con su código de guía de Correo Argentino.
3. **Fricción por reingreso repetitivo de datos:** Los compradores recurrentes deben volver a escribir manualmente su nombre, DNI, teléfono y dirección postal completa cada vez que realizan una nueva compra.
4. **Desconexión con el historial de compras:** El comprador no cuenta con un registro centralizado de sus comprobantes digitales, prendas y talles adquiridos anteriormente, dificultando recompras y consultas posventa.

---

## Solution

Desarrollar un **Portal de Clientes («Mi Cuenta»)** integrado a la tienda online de Matacos Deportes que centralice:

1. **Autenticación Híbrida y Segura:** Registro e inicio de sesión tradicional (email y contraseña cifrada con `bcryptjs`) y acceso en un toque con Google OAuth, utilizando sesiones JWT `HttpOnly` totalmente independientes del personal del local (`User`).
2. **Lista de Favoritos (Wishlist) con Persistencia Inteligente:** Posibilidad de marcar artículos con un icono de corazón desde cualquier card o ficha de producto, guardándose localmente en el navegador para visitantes no registrados y sincronizándose automáticamente en PostgreSQL al iniciar sesión.
3. **Centro de Trazabilidad y Seguimiento de Pedidos:** Visualización del progreso logístico en tiempo real con línea de tiempo y entrega del código de guía con enlace directo al portal oficial de Correo Argentino o aviso de cadetería en Formosa Capital.
4. **Historial de Compras y Libreta de Direcciones:** Consulta de todas las compras web históricas vinculadas y precarga automática de datos de contacto y entrega en el formulario de compra.

---

## User Stories

1. As a visitor browsing the online store, I want to click a heart icon on any product card, so that I can save products I like to my wishlist without being forced to create an account first.
2. As a visitor with items in my local wishlist, I want my saved products to be remembered when I close and reopen the browser, so that I don't lose my selection.
3. As a visitor, I want to see the total count of my favorite products in the top navigation header, so that I know at a glance how many items I have saved.
4. As a visitor, I want to click on the favorites icon in the navigation header, so that I can review all the products I have saved.
5. As a visitor, I want to click a "Continuar con Google" button on the login screen, so that I can create an account and sign in immediately with a single click.
6. As a visitor, I want to create an account with my full name, email, phone number, and a secure password, so that I can have a persistent profile in the store.
7. As a new customer registering for the first time, I want any favorite items saved locally on my device to be automatically migrated to my database account, so that I can access them from any computer or mobile phone.
8. As a customer who previously made purchases as a guest using my email, I want those past web orders to be automatically linked to my account when I register, so that I can see my complete purchase history immediately.
9. As a registered customer, I want to log in using my email and password, so that I can access my private account portal.
10. As a registered customer, I want my session to remain securely active for up to 30 days via an HttpOnly cookie, so that I don't have to re-enter my credentials every time I visit the store.
11. As a registered customer, I want to log out from any device with a single click, so that my account remains secure on shared computers.
12. As a registered customer, I want to view my profile details (name, email, phone, DNI, shipping address) in my account dashboard, so that I can review what information the store has on file.
13. As a registered customer, I want to edit my default shipping address (street, number, city, postal code), so that future deliveries are sent to my current residence.
14. As a registered customer, I want my saved contact and address details to be automatically filled into the checkout form, so that I can complete orders in seconds without retyping my data.
15. As a guest customer checking out, I want to see an optional callout encouraging me to log in or create an account, so that I can choose whether to link the order to a profile or proceed as a guest.
16. As a registered customer, I want to access a "Mis Pedidos" section in my account portal, so that I can see a chronological list of all web purchases I have made.
17. As a customer with active orders, I want to see a visual progress timeline for each order, so that I know whether it is pending payment, in preparation at the Saavedra 241 store, in transit, ready for pickup, or delivered.
18. As a customer whose order is being shipped via Correo Argentino, I want to see the tracking code and a direct link to the Correo Argentino tracking page, so that I can trace the shipment on the carrier's platform with a single tap.
19. As a customer whose order is being delivered via local cadetería in Formosa Capital, I want to see a clear status indicating local delivery in progress and a WhatsApp contact button, so that I can coordinate the delivery window.
20. As a customer whose order is marked for store pickup, I want to see when it is ready for collection at Saavedra 241, so that I know exactly when to visit the store.
21. As a customer, I want to receive an email notification when my order is dispatched, containing my order code, tracking number, and tracking link, so that I am alerted without having to manually check the portal.
22. As a customer with an unpaid order in "PENDIENTE_PAGO" status, I want to be able to cancel the order myself from my account, so that I can release the stock immediately if I changed my mind.
23. As a customer with an order that is already paid and in preparation, I want to see a direct WhatsApp assistance button with the order code prefilled, so that I can request a change or refund directly from store management.
24. As a registered customer, I want to view the full itemized breakdown of any past order (product name, size, color, quantity, price paid, and shipping cost), so that I have an immutable record of my transaction.
25. As a customer looking at an out-of-stock item in my favorites, I want to see a clear "Agotado" indicator and an inquiry button, so that I know the item is currently unavailable before trying to buy it.
26. As a customer viewing a favorite product that is in stock, I want a "Ver producto" button that takes me to the detail page, so that I can review the size chart and select my variant with confidence.
27. As a logged-in customer, I want to see a user menu in the top header displaying my name, with direct links to "Mis Pedidos", "Mis Favoritos", "Mi Perfil", and "Cerrar Sesión", so that I can navigate my account quickly from any page.
28. As a store employee or administrator, I want customer authentication to be strictly isolated from internal management routes, so that a customer account cannot under any circumstances access POS, cash shift, or inventory administration screens.
29. As a customer who forgot my password, I want an assistance link that opens an official WhatsApp conversation with the store containing my registered email, so that the staff can securely reset my access.
30. As a customer who registered with Google, I want the system to progressively ask for my missing details (DNI, phone, address) only when I reach checkout or visit my profile, so that my initial signup remains instantaneous and frictionless.

---

## Implementation Decisions

### Module Boundaries and Architecture

1. **Autonomous Customer Entity:**
   The `Customer` entity remains fully separated from the internal `User` entity. Customers do not belong to the RBAC `Profile` / `Permission` hierarchy. They possess no roles, cannot initiate POS shifts, and have no access to administrative dashboards.

2. **Session and Security Isolation:**
   - Customer authentication issues an independent JWT token signed with HS256, stored in a dedicated `matacos_customer_token` cookie.
   - The cookie is marked `HttpOnly`, `SameSite=Lax`, and `Secure` in production environments, with a 30-day lifetime.
   - Internal employees use `matacos_session` (12-hour lifetime). The presence of a customer token grants zero access to protected internal routes (`/pos`, `/admin`).

3. **Data Schema Additions:**
   - The `Customer` model is extended with optional `googleId` (unique), optional `avatarUrl`, and nullable `password` (to support Google OAuth accounts).
   - A new `Favorite` model is created representing a Many-to-Many relation between `Customer` and `Product`, with a composite unique constraint `@@unique([customerId, productId])`.
   - The `Sale` model is extended with `shippingStatus` (`PENDIENTE`, `EN_PREPARACION`, `LISTO_RETIRO`, `EN_CAMINO`, `ENTREGADO`, `CANCELADO`) and `shippingTrackingCode` (optional string for carrier tracking).

```prisma
// Target Data Model Representation
model Customer {
  id                String     @id @default(uuid())
  email             String     @unique
  password          String?    // Nullable for Google OAuth accounts
  googleId          String?    @unique
  avatarUrl         String?
  name              String
  phone             String?
  dni               String?
  defaultAddress    String?
  defaultCity       String?    @default("Formosa")
  defaultPostalCode String?    @default("3600")
  favorites         Favorite[]
  sales             Sale[]
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([email])
}

model Favorite {
  id         String   @id @default(uuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([customerId, productId])
  @@index([customerId])
  @@index([productId])
}
```

4. **Wishlist Granularity at Base Product Level:**
   Favorites are stored against `Product` rather than `ProductVariant`. This allows visitors and customers to bookmark an item directly from catalog cards without selecting size/color upfront. Variant selection takes place upon visiting the product detail page or moving the item to the cart.

5. **Retroactive Order Association:**
   When a new customer account is created (via email registration or Google OAuth), the system executes a database query matching previously completed web orders where `customerEmail` matches the new customer's verified email and `customerId` is null, updating them to link to the new `Customer.id`.

6. **Strict Channel Filtering for Customer Orders:**
   The customer portal strictly queries sales where `customerId == currentCustomer.id` AND `channel == "WEB"`. In-store purchases at Saavedra 241 (`channel == "MOSTRADOR"`) are excluded from the web portal; physical store sales are evidenced exclusively by the thermal receipt handed to the buyer at the counter.

7. **Carrier Tracking Integration Contract:**
   For national shipments via Correo Argentino, when `shippingTrackingCode` is populated, the customer portal constructs a direct action button pointing to the official tracking endpoint: `https://www.correoargentino.com.ar/formularios/ondt`.

8. **Transactional Email Engine:**
   Dispatch notifications utilize standard SMTP configured via environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) mapped to the store's official Google account, incurring zero external subscription costs.

9. **Google OAuth Credential Governance:**
   Development and local testing utilize client credentials managed in a developer Google Cloud project with `http://localhost:3000` redirect URIs. Production deployment transitions to credentials generated under the official Matacos Deportes Google account.

---

## Testing Decisions

### Seam Strategy
Testing will be conducted at the **Server Action Boundary** (the highest backend programmatic seam). Testing at this boundary exercises input validation (Zod), authorization and session token extraction, database atomicity (Prisma/PostgreSQL), and output serialization in a single end-to-end integration call.

### Test Suite Structure
A dedicated test script will be added following the repository's convention:
- Suite: `scripts/test-rf29-customer-portal.ts`
- Registered in `package.json` under `test:rf29` and included in `test:backend`.

### Tested Scenarios
1. **Customer Registration & Password Hashing:** Verify valid payload creates a `Customer` record, enforces unique email constraint, and stores an unrecoverable `bcryptjs` hash.
2. **Session Lifecycle:** Verify encryption and decryption of `matacos_customer_token`, ensuring session claims are correctly populated and expired tokens are rejected.
3. **Privilege Boundary:** Verify that a valid customer session token fails authorization checks when passed to internal POS/cash shift actions.
4. **Wishlist Operations:**
   - Toggle favorite adds record when missing.
   - Toggle favorite deletes record when present.
   - Duplicate addition on the same product is prevented by database unique constraint.
5. **Guest Wishlist Migration:** Verify that an array of product IDs from local guest browsing is atomically upserted into the `Favorite` table upon customer login.
6. **Retroactive Web Order Linking:** Create a guest sale with `customerEmail = "test@cliente.com"`; register a customer with that email; verify the sale's `customerId` is automatically populated.
7. **Order Tracking Query:** Verify `getCustomerOrders` returns only orders belonging to the authenticated customer and with `channel == "WEB"`.
8. **Customer Self-Cancellation:** Verify an order in `PENDIENTE_PAGO` can be cancelled by the owner, immediately decrementing `stockReserved`, while an order in `PAGADO` rejects customer self-cancellation.

### What Makes a Good Test
Tests must never assert on internal implementation variables or intermediate helper functions. Tests must strictly verify observable external behavior: return payload shapes (`success: boolean`, `data`, `error`), HTTP cookie headers, and resulting database state.

### Prior Art
- `scripts/test-rf15-guest-checkout.ts`: Benchmark for transactional sales, stock reservations, and order cancellation.
- `scripts/test-rf23-rbac.ts`: Benchmark for session decryption, password comparison, and permission isolation.

---

## Out of Scope

1. **In-Store POS Customer Loyalty / Terminal Lookup:** Real-time customer identification on in-store POS touchscreens (Terminal 1 and Terminal 2) is out of scope for this increment; counter sales remain anonymous or Consumer Final.
2. **Automated Third-Party Courier Webhook Sync:** Direct API webhooks from Correo Argentino to auto-update tracking status are out of scope; tracking updates rely on manual tracking code entry by staff and customer verification on the carrier's public portal.
3. **Social Logins Other Than Google:** Facebook, Apple ID, or Twitter logins are not in scope.
4. **Self-Service Automated Returns / RMA Portal:** Return merchandise authorization workflows remain handled personally at Saavedra 241 or via WhatsApp assistance.

---

## Further Notes

- **Language and Formatting:** All customer-facing timestamps must be rendered in `America/Argentina/Buenos_Aires` and monetary values formatted in Argentine Pesos (ARS) using `formatCurrency()`.
- **Git Commit Compliance:** Under strict repository rules, no git commits or pushes are executed automatically. The branch `feature/rf-29-portal-clientes` is prepared for manual review and staged implementation.
