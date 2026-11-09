# 03: Consumo Omnicanal, Inmutabilidad en Reserva Web (TTL) y Cobro Mostrador

**What to build:**
Conectar de extremo a extremo las ofertas con los canales de consumo del sistema:
1. En el catálogo público y PDP: exponer el precio tachado (`price`), el precio efectivo (`effectivePrice`) y recalcular en vivo ante variantes con sobreprecio (`variant.price`).
2. En Checkout Web: congelar el precio promocional durante los 15 minutos de reserva (`reservedUntil`) de la orden en `createGuestOrder`, garantizando que el comprador pague el valor promocional aun si la oferta vence durante el pago. Persistir explícitamente en `SaleItem` los valores `originalPrice`, `discount` y `unitPrice`.
3. En Mostrador de Saavedra 241: cobrar automáticamente al precio de oferta al escanear código de barras y soportar descuentos manuales adicionales en cascada (RF-27 + RF-08).

**Blocked by:**
- 01: Core de Descuentos Individuales y Salvaguarda de Costos con Permiso RBAC

**Status:** completed

- [x] Adaptar `catalogActions` y `productDetailActions` para integrar `resolveEffectiveProductPromo` en consultas públicas.
- [x] Adaptar `createGuestOrder` en `checkoutActions.ts` para respetar la oferta activa, congelar el total en la reserva de 15 minutos e imputar `originalPrice`, `discount` y `unitPrice` en `SaleItem`.
- [x] Adaptar la venta en mostrador (`posSaleActions.ts`) para reconocer el precio promocional y liquidar descuentos manuales de forma sucesiva.
- [x] Incorporar pruebas de extremo a extremo en la suite RF-27 verificando la consistencia contable de `SaleItem`.
