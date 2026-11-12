# SPEC: Cumplimiento Legal Integral, Consentimiento Informado, Políticas de Privacidad y Defensa del Consumidor

**Status:** `ready-for-agent`  
**Domain Area:** E-Commerce / Legal & Regulatory Compliance  
**Target Branch:** `feature/legal-terminos-y-privacidad`  
**Base Branch:** `develop`  

---

## Problem Statement

Actualmente, la tienda online de Matacos Deportes opera sin un marco contractual y normativo formalmente publicado ni un mecanismo probatorio de consentimiento legal. Esto expone al negocio, a sus clientes y al equipo directivo a graves riesgos jurídicos, operativos y comerciales:

1. **Vulnerabilidad ante la Ley 25.326 de Protección de Datos Personales:** El sistema recolecta datos sensibles y personales (nombre, DNI, email, teléfono, dirección postal) en formularios como el checkout de invitados y el registro de clientes, sin brindar la información preceptiva exigida por la Agencia de Acceso a la Información Pública (AAIP) ni registrar fehacientemente la aceptación libre, expresa e informada de las Políticas de Privacidad.
2. **Inexistencia de Términos y Condiciones formales de contratación electrónica:** No existen reglas contractuales públicas que delimiten los derechos y obligaciones de las partes, los términos de las compras online, los tiempos de reserva transaccional (TTL 15 minutos), las responsabilidades ante demoras logísticas ni la jurisdicción judicial correspondiente a los tribunales de Formosa Capital.
3. **Falta de Botón de Arrepentimiento (Incumplimiento de la Resolución 271/2020 SCI y Ley 24.240):** En Argentina es mandatorio por ley exhibir en un lugar destacado y accesible de la web un "Botón de Arrepentimiento" que permita a los consumidores online revocar su compra dentro de los 10 días corridos de la entrega del bien, otorgando un código numérico o alfanumérico identificador en menos de 24 horas y garantizando el reintegro total del dinero sin costo de flete.
4. **Ausencia de Política y Banner de Cookies transparente:** El sitio utiliza almacenamiento web y tokens de sesión sin informar a los usuarios ni distinguir cookies esenciales de navegación técnica de cookies analíticas o de terceros, vulnerando el principio de privacidad por defecto.
5. **Incertidumbre en la Política de Reembolsos y Cambios:** La única regla documentada en mostrador estipulaba que "no se realizan devoluciones de dinero y solo se emite vale de compra", lo cual colisiona con el derecho legal irrenunciable del comprador web (art. 34 Ley 24.240 y art. 1110 CCCN) y no contemplaba la política comercial de salón que admite devoluciones monetarias presentando prendas en perfecto estado y con etiquetas intactas.
6. **Carencia de sellos de transparencia fiscal y defensa del consumidor en el pie de página:** El pie de página no exhibe el formulario interactivo 960/D (AFIP/ARCA Data Fiscal), la leyenda legal de la AAIP ni el enlace oficial a la Ventanilla Única Federal de Defensa del Consumidor.

---

## Solution

Implementar una solución de cumplimiento normativo y contractual de punta a punta que dote a Matacos Deportes de plena validez jurídica, protección al consumidor y trazabilidad probatoria inmutable:

1. **Rutas Públicas y Páginas Legales Formales:** Creación de páginas dedicadas y navegables para Términos y Condiciones, Políticas de Privacidad, Política de Cookies, Política de Reembolso y Cambios, y el formulario interactivo del Botón de Arrepentimiento.
2. **Registro Inmutable de Consentimiento (`LegalConsentLog`):** Estructura en base de datos PostgreSQL/Prisma que almacena de forma inalterable la fecha, tipo de formulario, versión de los términos aceptados, correo electrónico, documento, IP de origen y agente de usuario (`userAgent`) para cada transacción o envío de formulario.
3. **Mecanismo de Doble Checkbox Obligatorio e Independiente:** Incorporación en todos los formularios para usuarios no registrados (Guest Checkout, registro de cuenta, subida de comprobantes de transferencia y trámite de arrepentimiento) de dos casillas de verificación explícitas ("Acepto los Términos y Condiciones" y "Acepto las Políticas de Privacidad"), cuyos enlaces se abren en una pestaña nueva del navegador sin perder los datos cargados ni interrumpir el proceso de compra.
4. **Política Dual de Devoluciones y Garantías:**
   - *Canal Web:* Derecho irrenunciable de arrepentimiento dentro de los 10 días corridos desde la entrega, logística inversa sin costo a cargo de Matacos Deportes, verificación del estado inmaculado de la prenda en Saavedra 241 dentro de las 48 hs hábiles y posterior reintegro del 100% del dinero por el mismo medio abonado.
   - *Canal Físico (Saavedra 241):* Admisión de devoluciones de dinero o vales de compra sin límite de tiempo estricto, supeditada a la presentación del ticket original de compra y a que la prenda conserve su estado original y etiquetas adheridas.
   - *Protocolo de Rechazo por Deterioro o Abandono:* Constatación fotográfica formal si la prenda devuelta no cumple las condiciones originales y protocolo de guarda de 60 días para mercadería no retirada.
5. **Banner de Cookies con Privacidad por Defecto:** Banner no intrusivo en el pie del storefront que permite al usuario aceptar o mantener únicamente las cookies técnicas esenciales requeridas para el carrito y la sesión.
6. **Sellos Fiscales y de Defensa del Consumidor en el Footer:** Incorporación en el pie de página del Data Fiscal de AFIP/ARCA (Formulario 960/D QR), la leyenda legal exigida por la AAIP (órgano de control de la Ley 25.326), el enlace a Defensa de las y los Consumidores y el Botón de Arrepentimiento destacado.

---

## User Stories

1. As a visitor browsing the online store, I want to access the "Términos y Condiciones" page from the footer or any form link, so that I can understand my rights and contractual obligations before buying.
2. As a visitor browsing the online store, I want to access the "Políticas de Privacidad" page, so that I can review how my personal information is processed, stored, and protected under Argentine law.
3. As a visitor browsing the online store, I want to access the "Política de Cookies" page, so that I understand what technical identifiers are stored on my browser.
4. As a visitor browsing the online store, I want to access the "Política de Reembolso y Cambios" page, so that I know the clear rules for returning products online and at the physical store.
5. As a visitor visiting the website for the first time, I want to see a non-intrusive cookie consent banner at the bottom of the screen, so that I am notified of the use of essential and optional cookies.
6. As a visitor, I want to browse the product catalog normally without the cookie banner blocking my interaction, so that my shopping experience is not disrupted.
7. As a visitor, I want only strictly essential technical cookies (shopping cart storage and secure session tokens) to be active by default if I do not click "Aceptar todas", so that my privacy is respected by default.
8. As a visitor, I want to click "Aceptar todas" on the cookie banner, so that all analytical and performance enhancements are enabled and the banner is dismissed.
9. As an unauthenticated customer completing a guest checkout, I want to see two distinct, separate checkboxes: one for Terms and Conditions and one for Privacy Policy, so that I give explicit, informed consent for each legal aspect.
10. As an unauthenticated customer in the checkout form, I want to click the links to the Terms and Conditions and Privacy Policy and have them open in a new browser tab, so that I do not lose my filled shipping data or items in my active cart.
11. As an unauthenticated customer, I want the system to prevent form submission with clear validation errors if I forget to check either of the two mandatory legal checkboxes, so that I know exactly what is required to continue.
12. As a guest customer choosing "Retiro en local Saavedra 241", I want the form to hide street and postal address fields, so that the store only requests the minimum personal data strictly necessary for my purchase.
13. As a guest customer choosing delivery by cadetería or Correo Argentino, I want the form to require only my delivery address, DNI, email, and phone number, so that the store complies with tax invoicing and package delivery requirements without asking for unnecessary data.
14. As a visitor registering for a new customer account, I want to see the two separate checkboxes for Terms and Conditions and Privacy Policy, so that I can formally accept both documents before creating my profile.
15. As an unauthenticated customer paying via bank transfer, I want to see the legal terms acknowledgment when uploading my transfer proof slip, so that my transaction has full contractual validity.
16. As an online customer who received an order within the last 10 days, I want to find a visible, accessible "Botón de arrepentimiento" link in the footer and main navigation, so that I can easily exercise my statutory right of revocation under Argentine law.
17. As an online customer clicking the "Botón de arrepentimiento", I want to be taken to a dedicated revocation page with a clear, straightforward form, so that I can initiate my return without contacting a call center.
18. As an online customer submitting a revocation request, I want to enter my order code and email address, so that the system can verify my eligibility within the 10-day legal window.
19. As an online customer submitting a revocation request within the 10-day period, I want to receive an immediate unique claim tracking code (e.g., `REV-XXXX`) on screen and by email, so that I have formal proof of my timely revocation request.
20. As an online customer submitting a revocation request, I want to see two mandatory checkboxes to accept the Terms and Privacy Policy of the revocation procedure, so that my return request is legally auditable.
21. As an online customer whose revocation is accepted, I want Matacos Deportes to coordinate return logistics without charging me for return shipping, so that I do not bear the cost of the legal revocation.
22. As an online customer whose returned item is inspected and verified to be in pristine, unused condition with original tags intact, I want to receive a 100% refund of my money via the same payment method within 48 business hours, so that I get my money back quickly.
23. As a physical store customer shopping at Saavedra 241, I want to be able to return a purchased item for a full money refund or store credit without an arbitrary time limit, provided I present my purchase receipt and the garment is in pristine condition with its tags attached.
24. As a store manager inspecting a returned online garment at Saavedra 241, I want to record photographs and a technical rejection note if the garment arrives damaged, worn, washed, or without original tags, so that the store is legally protected against refunding degraded goods.
25. As an online customer whose returned garment was formally rejected due to damage or wear, I want to be notified by email and WhatsApp with photographic evidence, so that I understand why the refund was denied.
26. As an online customer with a rejected return, I want to choose between collecting my item at Saavedra 241 within 60 days or paying for reshipment to my address, so that I can retrieve my property.
27. As a store administrator, I want uncollected rejected garments to be deemed legally abandoned after a 60-day holding period following formal notice, so that the store can dispose of or donate the items without lingering liability.
28. As a compliance officer or auditor, I want every acceptance of terms and privacy policies to generate an immutable database record containing the form type, user email, DNI, IP address, user-agent string, document version, and timestamp, so that Matacos Deportes has undeniable evidence in case of consumer or regulatory audits.
29. As a site visitor, I want to see the AFIP/ARCA Formulario 960/D Data Fiscal QR code in the website footer, so that I can verify the tax standing and registered business data of Matacos Deportes.
30. As a site visitor, I want to see the mandatory regulatory notice from the Agencia de Acceso a la Información Pública (AAIP) in the footer, so that I know my rights to free access, correction, and deletion of my personal data.
31. As a site visitor, I want to see a direct link to the national "Defensa de las y los Consumidores" complaints portal in the footer, so that I know the store adheres to national consumer protection standards.

---

## Implementation Decisions

### 1. Dedicated Public Legal Routes
Create five dedicated, SEO-friendly, server-rendered public pages in the web application:
- `/terminos-y-condiciones`: Comprehensive e-commerce contractual framework under Argentine law.
- `/politicas-de-privacidad`: Data privacy declarations complying with Ley 25.326 and AAIP standards, detailing ARCO rights, processing purposes, and data retention.
- `/politica-de-cookies`: Clear technological explanation of essential session tokens and local storage vs optional cookies.
- `/politica-de-reembolso`: Dual return regime, sanitary exemptions (underwear, swimwear, socks), inspection protocol, and 60-day holding rules for abandoned items.
- `/arrepentimiento`: Interactive statutory revocation portal complying with Resolución 271/2020 SCI.

### 2. Immutable Legal Consent Audit Model (`LegalConsentLog`)
Add a new relational table to PostgreSQL via Prisma to record all affirmative consent events:

```prisma
model LegalConsentLog {
  id              String   @id @default(uuid())
  formType        String   // "GUEST_CHECKOUT", "CUSTOMER_REGISTER", "REVOCATION_REQUEST", "TRANSFER_PROOF"
  acceptedTerms   Boolean  @default(true)
  termsVersion    String   // "v1.0"
  acceptedPrivacy Boolean  @default(true)
  privacyVersion  String   // "v1.0"
  email           String
  dni             String?
  name            String?
  customerId      String?
  saleId          String?
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())

  @@index([email])
  @@index([createdAt])
  @@index([formType])
}
```

### 3. Server Action for Legal Consent Recording
Implement an internal server utility/action that:
- Receives the consent payload during form submission.
- Extracts incoming client IP address (from `x-forwarded-for`, `x-real-ip`) and the `user-agent` header from the Next.js request headers.
- Writes an immutable record to the `LegalConsentLog` table inside the same transaction or immediately upon validation.

### 4. Interactive Revocation & Arrepentimiento Model
Add a model to track statutory revocation requests under Resolución 271/2020:

```prisma
model RevocationRequest {
  id              String    @id @default(uuid())
  code            String    @unique // Formato "REV-XXXXXX"
  saleId          String?
  sale            Sale?     @relation(fields: [saleId], references: [id])
  orderCode       String
  customerEmail   String
  customerPhone   String?
  reason          String?
  status          String    @default("PENDIENTE_REVISION") // PENDIENTE_REVISION, RECEPCIONADA, APROBADA_REEMBOLSADA, RECHAZADA_DETERIORO, ABANDONADA
  rejectionReason String?
  rejectionProof  String?   // URL con fotos de constatación técnica
  resolvedAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([orderCode])
  @@index([customerEmail])
}
```

### 5. Mandatory Dual Checkbox UI Component
Create a reusable, accessible React component encapsulating the two mandatory checkboxes:
- Checkbox 1: *"He leído y acepto los Términos y Condiciones"* with link opening `/terminos-y-condiciones` in a new tab (`target="_blank" rel="noopener noreferrer"`).
- Checkbox 2: *"He leído y acepto las Políticas de Privacidad"* with link opening `/politicas-de-privacidad` in a new tab (`target="_blank" rel="noopener noreferrer"`).
- Both checkboxes are required (`checked === true`) before enabling form submission or passing Zod schema validation.

### 6. Cookie Consent Banner Component
Implement a floating, non-intrusive banner on the ecommerce storefront:
- Persists user decision in browser storage with key `matacos_cookie_consent: "accepted" | "essential"`.
- Adheres to Privacy by Default: if no interaction occurs, only essential cookies remain active.
- Offers direct link to `/politica-de-cookies`.

### 7. Footer Redesign with Trust & Legal Badges
Update the storefront footer to include:
- A dedicated "Legal & Transparencia" column.
- The prominent "Botón de arrepentimiento" badge linking to `/arrepentimiento`.
- Links to `/terminos-y-condiciones`, `/politicas-de-privacidad`, `/politica-de-cookies`, and `/politica-de-reembolso`.
- Official Formulario 960/D (AFIP/ARCA Data Fiscal) interactive component.
- The statutory AAIP legal notice and link.
- Direct link to the national "Defensa de las y los Consumidores" portal.

---

## Testing Decisions

### What Makes a Good Test
Tests must verify externally observable behavior and contract invariants rather than implementation details:
- Submitting a guest order without accepting terms or privacy MUST fail schema validation and reject the order.
- Submitting a guest order with both checkboxes accepted MUST succeed and persist an entry in `LegalConsentLog` containing client IP, user-agent, and document version.
- Customer registration without both checkboxes MUST fail; with both checkboxes MUST create the profile and the consent audit record.
- A revocation request for an order placed within 10 calendar days MUST succeed and issue a `REV-XXXX` code.
- A revocation request for an order exceeding 10 calendar days MUST return an eligibility error citing the statutory expiration.
- Rejecting a damaged returned garment MUST require rejection notes and update status without issuing a financial refund.

### Modules Tested
- E-Commerce Checkout Server Actions (`createGuestOrder` with consent payload).
- Customer Registration Server Actions (`registerCustomerAction` with consent payload).
- Revocation Server Actions (`submitRevocationRequestAction` with order validation and consent logging).
- Zod Validation Schemas for guest checkout, customer registration, and revocation.

### Prior Art
- Automated test script following the pattern of `scripts/test-rf29-customer-portal.ts` and `scripts/test-rf16-mercadopago-checkout.ts`, creating test records, asserting invariants, and cleaning up afterward.

---

## Out of Scope

1. Automatic robotic physical mail dispatch for reverse logistics (Correo Argentino reverse logistics labels are generated manually or via existing merchant account).
2. Payment gateway automated credit card dispute arbitration (chargeback disputes remain in Mercado Pago merchant dashboard).
3. Third-party marketing trackers (Google Analytics 4, Meta Pixel) integration (the cookie architecture is laid out to support them in the future, but no marketing pixels are installed in this scope).

---

## Further Notes

- All monetary transactions and refund records remain formatted in Argentine Pesos (ARS).
- All timestamps and statutory 10-day limits operate in the `America/Argentina/Buenos_Aires` timezone.
- Abandoned garments holding period is set to 60 calendar days following documented formal rejection notice.
