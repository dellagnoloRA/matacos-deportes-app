# 03: Panel Operativo de Órdenes Web y Despacho para Salón (RF-19)

**What to build:**
Vista de gestión en el Dashboard del comercio (`WebOrdersView`) para que vendedores y administradores de Saavedra 241 supervisen y despachen órdenes de e-commerce. Incluye listado en tiempo real, filtros por estado de pago y envío, visor de artículos para picking, transiciones de ciclo logístico (`EN_PREPARACION` ➔ `LISTO_RETIRO` / `EN_CAMINO` ➔ `ENTREGADO`), asignación de código de seguimiento de Correo Argentino (con disparo de email al cliente), enlace directo a WhatsApp del comprador e impresión de remito de paquete.

**Blocked by:** 01: Expiración de Reservas con TTL, Expiración en Mercado Pago y Cron Autónomo

**Status:** closed

- [x] Crear Server Action para consulta y mutación de estados logísticos de órdenes web.
- [x] Desarrollar componente `WebOrdersView` e integrarlo en la navegación lateral del Dashboard.
- [x] Integrar modal de detalle de orden con visualización de artículos para picking y datos de entrega.
- [x] Implementar asignación de código de guía de Correo Argentino con notificación automática por correo.
- [x] Añadir modal/función de impresión de etiqueta térmica o remito de embalaje.
- [x] Crear suite de pruebas automatizadas `scripts/test-ticket03-web-orders-dashboard.ts` y verificar con `pnpm`.
