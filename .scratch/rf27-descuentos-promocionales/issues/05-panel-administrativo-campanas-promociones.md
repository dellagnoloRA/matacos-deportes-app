# 05: Panel Administrativo de Campañas y Promociones

**What to build:**
Proveer una interfaz de usuario dedicada en el panel administrativo (`/admin?tab=promociones`) análoga a la de Banners Web:
1. Resumen de métricas superiores (promociones activas, programadas, expiradas y margen promedio).
2. Tabla de campañas con filtros por estado (`ACTIVA`, `PROGRAMADA`, `EXPIRADA`, `PAUSADA`) y alerta visual de margen (< 10%).
3. Botones para pausar/reanudar promociones individuales con un clic.
4. Modal interactivo para fijar promoción individual en un producto.
5. Modal interactivo para aplicar descuento masivo por Categoría o Disciplina con reporte en vivo de productos actualizados vs omitidos.
6. Botón de reversión masiva para limpiar promociones de un rubro.

**Blocked by:**
- 01: Core de Descuentos Individuales y Salvaguarda de Costos con Permiso RBAC
- 02: Descuentos Masivos por Categoría o Disciplina con Reporte 2B y Reversión

**Status:** completed

- [x] Crear el componente `PromotionManagementView.tsx` e integrarlo en la barra lateral y pestañas de `DashboardView.tsx` (`/admin?tab=promociones`).
- [x] Desarrollar la tabla de promociones con badge de estado, margen de ganancia y acciones rápidas.
- [x] Desarrollar los modales de asignación individual y masiva con previsualización de impacto financiero.
- [x] Conectar con las Server Actions de `setProductDiscount`, `applyCategoryDiscount` y `removeCategoryDiscount`.
