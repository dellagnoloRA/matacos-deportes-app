# SPEC: Descuentos Promocionales, Ofertas por Rubro y Salvaguarda de Costos (RF-27)

**Status:** `ready-for-agent`  
**Domain Area:** E-Commerce & POS / Pricing & Promotion Management  
**Target Branch:** `feature/be-rf27-descuentos-promocionales`  
**Base Branch:** `feature/ecommerce-checkout-redesign`  

---

## Problem Statement

Actualmente, Matacos Deportes no dispone de un mecanismo para fijar precios promocionales temporales ni ofertas especiales de temporada en su tienda online y mostrador físico. Esta carencia genera las siguientes dificultades operativas y comerciales:

1. **Falta de dinamismo promocional en fechas clave:** En campañas de alta rotación (ej. pretemporadas de vóley, inicio de clases o temporada de natación), el comercio no puede aplicar descuentos porcentuales atractivos a nivel de producto o rubro completo.
2. **Riesgo financiero de venta bajo costo:** Sin una salvaguarda automática que compare el precio bonificado contra el costo de reposición (`costPrice`), una rebaja porcentual indiscriminada puede provocar pérdidas de rentabilidad y comercialización a quebranto.
3. **Inconsistencias matemáticas y redondeo entre catálogo y checkout:** El pasaje entre el precio publicado, la cantidad en el carrito, la reserva atómica y la preferencia generada en Mercado Pago corre el riesgo de sufrir desvíos de centavos si no se unifica una fórmula determinista.
4. **Desconexión omnicanal:** Si un artículo se promociona en la web, el cliente que se acerca al local de Saavedra 241 espera encontrar el mismo precio de oferta en el mostrador físico sin que el cajero deba aplicar deducciones manuales improvisadas.
5. **Falta de visibilidad comercial para el comprador:** Los clientes no perciben el valor de la oferta al carecer de un precio de lista tachado y de una métrica clara del ahorro monetario obtenido en el carrito de compras.

---

## Solution

Implementar un sistema integral de **Descuentos Promocionales y Ofertas Temporales (RF-27)** con alcance omnicanal (tienda online y terminales físicas de Saavedra 241):

1. **Gestión Granular y Masiva de Ofertas:** Permitir la asignación de porcentajes de descuento individuales por producto o masivos por Categoría o Disciplina deportiva, con soporte para ventanas de vigencia exactas (fecha y hora en `America/Argentina/Buenos_Aires`) o duración indefinida.
2. **Salvaguarda de Costo de Reposición y Permiso RBAC:** Validar en tiempo real que ningún precio bonificado resulte inferior a `costPrice`. La operación se rechaza por defecto, requiriendo el permiso atómico `productos.descuento_bajo_costo` para liquidaciones de fin de temporada autorizadas.
3. **Consistencia Matemática Determinista al Centavo:** Integrar el motor de cálculo con redondeo a dos decimales, proyectando el porcentaje bonificado sobre el precio específico de cada variante (`variant.price ?? product.price`).
4. **Resguardo de Precio en Reserva Web (TTL 15 Minutos):** Si una orden web se inicia dentro de la vigencia de la oferta, el precio promocional queda garantizado durante los 15 minutos de la reserva transaccional, aun si la oferta finaliza mientras el cliente efectúa el pago en la pasarela.
5. **Módulo Administrativo Dedicado:** Proveer un panel operativo en `/admin?tab=promociones` para monitorear, pausar, editar y revertir masivamente promociones con un solo clic.
6. **Experiencia de Usuario de Alto Impacto:** Exponer precios de lista tachados, badges porcentuales destacados (`-20% OFF`) y el resumen del ahorro consolidado en el carrito de compras y la pantalla de checkout.

---

## User Stories

1. As a store administrator, I want to assign a percentage discount (1% to 90%) to an individual product, so that I can launch promotional pricing on specific items.
2. As a store administrator, I want to set an optional start date and time for a promotion, so that the discount activates automatically at a scheduled future moment.
3. As a store administrator, I want to set an optional expiration date and time in Argentina timezone, so that the promotion automatically shuts down when the campaign ends.
4. As a store administrator, I want to create indefinite discounts without an end date, so that I can maintain permanent outlet or clearance sections until manually paused.
5. As a store administrator, I want the system to reject any discount that causes the final price to fall below the product's replacement cost (`costPrice`), so that the store does not lose money by mistake.
6. As a store manager with the `productos.descuento_bajo_costo` permission, I want to check an "Allow below cost" option, so that I can execute emergency liquidations of obsolete or out-of-curve merchandise.
7. As a store employee without the `productos.descuento_bajo_costo` permission, I want the system to forbid me from overriding cost safeguards, so that margins remain strictly protected by management.
8. As a store administrator, I want to apply a bulk percentage discount to an entire Category (e.g., all "Mallas"), so that I can set up season campaigns in seconds.
9. As a store administrator, I want to apply a bulk percentage discount to an entire Discipline (e.g., all "Natación"), so that I can launch sport-specific promotions with a single action.
10. As a store administrator running a bulk discount, I want the system to apply the promotion to all safe products and report an itemized list of any products skipped due to cost safeguard violations, so that I have complete transparency on the outcome.
11. As a store administrator, I want to revert a bulk discount from a Category or Discipline with a single click, so that regular prices are instantly restored across all affected products.
12. As a store administrator, I want to view a dedicated "Promociones & Descuentos" tab in the administrative panel, so that I can manage all campaigns in a centralized workspace without navigating individual product forms.
13. As a store administrator, I want to filter promotions in the admin table by status (Active, Scheduled, Paused, Expired), so that I can quickly audit current and past campaigns.
14. As a store administrator, I want to pause and resume active promotions with a toggle button, so that I can temporarily halt discounts without losing the percentage or date configuration.
15. As a store administrator, I want to see the estimated profit margin percentage for each discounted item in the admin table, with visual warning badges if the margin drops below 10%, so that I can monitor profitability.
16. As an online customer browsing the catalog, I want to see promotional badges (e.g., "-25% OFF") on discounted items, so that I can easily spot active deals.
17. As an online customer browsing the catalog, I want to see the regular price struck through next to the highlighted promotional price, so that I understand the savings being offered.
18. As an online customer viewing a product detail page (PDP), I want the prices to update dynamically when I select variants with price surcharges, so that the discounted price accurately reflects the specific size or color chosen.
19. As an online customer adding discounted products to my shopping cart, I want the cart drawer to display both the original price and the discounted price for each item, so that I can verify my savings.
20. As an online customer reviewing my cart, I want to see a highlighted summary line showing the total monetary amount saved across all promotional items, so that I feel confident about my purchase.
21. As an online customer completing a web order, I want the discounted unit prices to be exactly preserved through checkout and Mercado Pago, with zero cent rounding discrepancies.
22. As an online customer starting checkout at 23:59 for a sale ending at 00:00, I want my promotional price to be locked in for the full 15-minute reservation window, so that I am not charged full price while completing my payment.
23. As an online customer checking out after a sale has expired, I want the system to inform me that the promotion ended and recalculate the order with current regular prices, so that I am never charged unexpected amounts.
24. As a cashier at the Saavedra 241 store scanning a barcode, I want the POS terminal to automatically apply the active promotional price, so that in-store customers receive the exact same deals advertised online.
25. As a cashier at the Saavedra 241 store, I want to apply a manual cash discount on top of an already discounted promotional item, so that the manual percentage calculates successively over the reduced promotional price.
26. As a cashier at the Saavedra 241 store, I want the printed thermal receipt (80mm) to detail the regular price, the promotional discount, and the final net price on each item line, so that the customer has an itemized record of their discount.
27. As a business owner, I want the database `SaleItem` records to explicitly persist `originalPrice`, `discount`, and `unitPrice`, so that accounting reports can distinguish list revenue from promotional bonuses.
28. As a store administrator updating promotional discounts, I want the Next.js landing page cache to be immediately invalidated on demand, so that public visitors see updated prices without waiting for cache expiration.
29. As a store administrator, I want products without an assigned cost price (`costPrice: null`) to accept promotions without blocking the operation, so that legacy catalog items do not prevent store promotions.
30. As a store administrator editing a product that currently has a promotion, I want to see the active discount details preloaded, so that I can adjust the percentage or validity window smoothly.

---

## Implementation Decisions

### Data Model and Persistence Boundary

1. **Reutilización del Esquema Existente en `Product`:**
   Se conservan de forma inmutable los campos ya existentes en la entidad `Product` de Prisma:
   - `discountActive: Boolean @default(false)`
   - `discountPercentage: Decimal? @db.Decimal(5, 2)` (soporte de 2 decimales para porcentajes)
   - `discountPrice: Decimal? @db.Decimal(12, 2)` (precio promocional base precalculado)
   - `discountStartDate: DateTime?` (inicio programado opcional)
   - `discountEndDate: DateTime?` (expiración temporal opcional)
   No se ejecutarán migraciones de renombramiento destructivas, asegurando compatibilidad con los índices existentes (`Product_active_discountActive_idx`).

2. **Permiso Atómico RBAC para Venta Bajo Costo:**
   Se incorpora en la tabla `Permission` el código atómico:
   `code: "productos.descuento_bajo_costo"`, perteneciente al módulo `PRODUCTOS`.
   Este permiso se asigna por defecto al perfil `Administrador` y se audita en la Server Action para validar la bandera `{ allowBelowCost: true }`.

3. **Imputación Contable en Renglones de Venta (`SaleItem`):**
   Tanto en órdenes web (`channel: "WEB"`) como en mostrador (`channel: "MOSTRADOR"`):
   - `originalPrice`: almacena el precio de lista original de la variante (`variant.price ?? product.price`).
   - `discount`: almacena el importe monetario total descontado por promoción (`(originalPrice - unitPrice)`).
   - `unitPrice` / `price`: almacena el precio unitario neto efectivamente cobrado.
   - `subtotal`: `unitPrice * quantity`.

### Motor de Cálculo y Reglas de Negocio

4. **Cálculo Determinista por Variante (`resolveEffectiveProductPromo`):**
   El cálculo monetario se realiza al centavo mediante la fórmula:
   $$\text{discountAmount} = \text{round}\left( \frac{\text{effectiveListPrice} \times \text{discountPercentage}}{100}, 2 \right)$$
   $$\text{finalUnitPrice} = \max\left(0, \text{round}(\text{effectiveListPrice} - \text{discountAmount}, 2)\right)$$
   donde $\text{effectiveListPrice} = \text{variant.price} \ ?? \ \text{product.price}$.

5. **Salvaguarda de Costo de Reposición:**
   - Si `product.costPrice !== null` y `finalUnitPrice < product.costPrice`, la acción falla con código de error `DISCOUNT_BELOW_COST`, a menos que la petición incluya `{ allowBelowCost: true }` y la sesión posea el permiso `productos.descuento_bajo_costo` o rol `ADMIN`.
   - Si `product.costPrice === null`, la validación de costo se considera satisfecha por defecto.

6. **Descuento Masivo con Reporte Discriminado (2B):**
   Al invocar `applyCategoryDiscount({ categoryId?, disciplineId?, discountPercentage, startDate?, endDate?, allowBelowCost? })`:
   - Se ejecuta una transacción que actualiza los productos cuyo precio resultante sea mayor o igual al costo (o todos si se autorizó venta bajo costo).
   - Retorna una carga útil estructurada: `{ success: true, appliedCount: number, skippedProducts: Array<{ id, name, price, costPrice, attemptedPrice }> }`.

7. **Descuentos Sucesivos en Mostrador Local (RF-27 + RF-08):**
   En terminales de mostrador, el precio promocional RF-27 actúa como el nuevo precio base de venta. Si el cajero aplica un descuento manual por pago en efectivo o cupón (RF-08), dicho descuento se liquida en cascada sobre el precio promocional ya bonificado.

8. **Inmutabilidad TTL en Órdenes Web:**
   La verificación de vigencia de la oferta se produce al momento exacto de invocar la Server Action de creación de orden web. Al confirmarse la orden preliminar (`PENDIENTE_PAGO`), el precio bonificado queda inmutablemente asentado en el registro de la orden por 15 minutos (`reservedUntil`), permitiendo al usuario completar la preferencia de Mercado Pago sin incrementos intempestivos.

### Arquitectura de Frontend y Gestión

9. **Módulo Administrativo `/admin?tab=promociones`:**
   Se implementa una vista operativa independiente en el panel administrativo que incluye:
   - Resumen de métricas (total promociones activas, próximas a vencer, margen promedio).
   - Tabla interactiva con badge de estado calculado al vuelo (`ACTIVA`, `PROGRAMADA`, `EXPIRADA`, `PAUSADA`).
   - Modales guiados para "Nueva Promoción por Producto" y "Descuento Masivo por Rubro".
   - Acciones inmediatas de Pausa/Reanudación y Reversión masiva.

10. **Presentación Visual en Catálogo, PDP y Carrito:**
    - Catálogo y PDP: Componentes reutilizables de precio que muestran el importe regular con `line-through text-muted-foreground` y el precio bonificado en tipografía bold destacada.
    - Carrito y Checkout: Desglose explícito de ítems con ahorro total consolidado visible.

---

## Testing Decisions

### Criterio de Pruebas de Calidad
Las pruebas deben validar **únicamente el comportamiento observable externo** (contratos de Server Actions, persistencia en base de datos, protección financiera de costo y coherencia matemática al centavo). Prohibido testear detalles internos de implementación o mocks frágiles de Prisma.

### Módulos y Suites a Desarrollar
Se creará la suite automatizada unificada `scripts/test-rf27-promotional-discounts.ts` (ejecutable vía `pnpm test:rf27` e integrada a `pnpm test:backend`).

Casos de prueba obligatorios:
1. **Asignación individual válida:** Aplicación de 20% a un producto con cálculo exacto de `discountPrice`.
2. **Salvaguarda de costo rechazada:** Rechazo estricto con error `DISCOUNT_BELOW_COST` al intentar fijar un precio inferior a `costPrice` sin autorización.
3. **Salvaguarda de costo autorizada:** Aceptación exitosa de precio bajo costo cuando se envía `{ allowBelowCost: true }` con perfil administrador.
4. **Descuento masivo por Categoría con reporte:** Aplicación parcial informada donde productos válidos se actualizan y productos con costo comprometido se omiten detalladamente.
5. **Reversión masiva atómica:** Restauración de precios regulares al invocar `removeCategoryDiscount`.
6. **Vigencia temporal programada:** Productos con fecha de inicio futura no exponen el precio promocional hasta alcanzada la fecha.
7. **Expiración automática:** Consultas públicas devuelven el precio regular tan pronto como se supera `discountEndDate`.
8. **Variantes con sobreprecio:** Proyección matemática exacta del porcentaje sobre variantes con precio específico.
9. **Descuentos sucesivos en mostrador:** Validación de liquidación en cascada (promocional + manual en efectivo) con importes auditados en `SaleItem`.
10. **Inmutabilidad en reserva web (TTL):** Creación de orden web en estado de oferta y verificación de que el total se preserva durante los 15 minutos de reserva.
11. **Invalidación de caché:** Verificación de que la llamada a la acción invalida inmediatamente la etiqueta `landing-data`.

### Prior Art
- `scripts/test-rf17-bank-transfer.ts` (pruebas de auditoría de pagos y transacciones Prisma).
- `scripts/test-rf28-landing-page.ts` (pruebas de caché ISR e invalidación bajo demanda).
- `scripts/test-rf11-cash-shifts.ts` (pruebas de validación estricta de saldo y tolerancias monetarias).

---

## Out of Scope

1. **Cupones de Descuento por Código Alfanumérico (ej. "MATACOS10"):** Quedan reservados para una etapa posterior de marketing digital; esta especificación cubre ofertas y precios de lista promocionales directos.
2. **Promociones complejas tipo "2x1" o "Segunda unidad al 50%":** Requieren un motor de reglas de carrito avanzado; las ofertas actuales operan estrictamente a nivel porcentual sobre variantes y rubros.
3. **Descuentos segmentados por cliente o nivel de fidelidad:** El precio promocional rige para todo comprador mientras la oferta esté activa.
4. **Migraciones destructivas de esquema:** Prohibido renombrar o eliminar columnas preexistentes en la base de datos de producción.

---

## Further Notes

- **Huso Horario:** Todo cálculo de fechas (`discountStartDate`, `discountEndDate`) debe ser interpretado en `America/Argentina/Buenos_Aires`.
- **Formateo Monetario:** Todas las respuestas de cara al usuario deben utilizar el formateador estándar `formatCurrency(amount)` en Pesos Argentinos (formato `$ 45.000,00`).
- **Control de Versiones:** La implementación se realizará exclusivamente en la rama de trabajo `feature/be-rf27-descuentos-promocionales`.
