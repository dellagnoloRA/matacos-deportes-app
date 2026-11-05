# 02: Descuentos Masivos por Categoría o Disciplina con Reporte 2B y Reversión

**What to build:**
Permitir a los administradores aplicar una oferta porcentual masiva a la totalidad de artículos pertenecientes a una Categoría o Disciplina deportiva de forma atómica.
La operación adopta la estrategia 2B (aplicación parcial informada): aplica el descuento a todos los productos cuyo precio resultante cubra el costo de reposición (o a todos si se autoriza venta bajo costo), y devuelve un reporte discriminado con la lista de artículos omitidos por resguardo de margen.
Asimismo, provee la Server Action simétrica de reversión masiva (`removeCategoryDiscount`) para restablecer el precio de lista regular a todo el rubro con un solo clic.

**Blocked by:**
- 01: Core de Descuentos Individuales y Salvaguarda de Costos con Permiso RBAC

**Status:** ready-for-agent

- [ ] Crear esquema Zod `CategoryDiscountSchema` y `RemoveCategoryDiscountSchema` en `src/schemas/productDiscount.ts`.
- [ ] Implementar la Server Action `applyCategoryDiscount` con transacción atómica, reporte estructurado `{ appliedCount, skippedProducts }` e invalidación de caché.
- [ ] Implementar la Server Action `removeCategoryDiscount` restableciendo `discountActive = false`, `discountPercentage = null`, `discountPrice = null`, etc.
- [ ] Incorporar pruebas de aplicación y reversión masiva en `scripts/test-rf27-promotional-discounts.ts`.
