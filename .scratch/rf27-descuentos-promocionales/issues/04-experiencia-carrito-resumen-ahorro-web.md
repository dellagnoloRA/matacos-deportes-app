# 04: Experiencia de Carrito y Resumen Visual de Ahorro Web

**What to build:**
Brindar una experiencia visual de alto impacto en el e-commerce para compras que contengan artículos en promoción:
1. El estado reactivo del carrito (`cartStore.ts`) almacena `originalPrice` y `discountPrice`.
2. El drawer lateral del carrito (`EcommerceCartDrawer`) y la pantalla de checkout exhiben el precio de lista tachado en cada renglón y el precio promocional destacado.
3. El pie del carrito y el resumen de orden exponen una fila destacada en color verde con el total monetario ahorrado (*"Ahorro en ofertas: - $ 12.500,00"*).

**Blocked by:**
- 03: Consumo Omnicanal, Inmutabilidad en Reserva Web (TTL) y Cobro Mostrador

**Status:** completed

- [x] Extender los ítems de `cartStore.ts` con campos de precio regular y precio de oferta.
- [x] Actualizar `EcommerceCartDrawer.tsx` para renderizar precios tachados y la fila consolidada de ahorro.
- [x] Actualizar la vista de checkout y detalle de pedido para mantener coherencia visual con la métrica de ahorro.
