# [RF-08] Aplicación de Descuentos Manuales en Punto de Venta

## 1. Descripción y Objetivo
Permite a los operadores comerciales en el salón de ventas (Terminal 1) y en el mostrador de cobranza (Terminal 2) aplicar bonificaciones y descuentos manuales de manera flexible y segura. El sistema admite dos modalidades combinables:
1. **Descuento por Ítem / Renglón:** Aplicable a un producto específico, ya sea como un porcentaje (`PERCENTAGE`, ej: 10%, 20%) o como una rebaja fija en pesos (`FIXED`, ej: $ 5.000,00).
2. **Descuento Global sobre el Ticket:** Aplicable sobre el subtotal resultante de la venta (ej: 10% por pago en efectivo o promoción especial de fin de semana).

El objetivo es dotar de agilidad al mostrador de Saavedra 241 para cerrar ventas complejas o promociones personalizadas, blindando las operaciones contra errores humanos (como descuentos mayores al 100% o importes que generen totales negativos) y manteniendo una trazabilidad contable exacta entre el precio de lista original y el precio efectivamente cobrado.

---

## 2. Tecnologías, Herramientas y Librerías

- **TypeScript (Modo Estricto):** Módulo matemático determinista [`src/lib/discounts.ts`](file:///C:/Proyectos/matacos-deportes-app/src/lib/discounts.ts) con redondeo a 2 decimales en cada etapa para evitar discrepancias de centavos por coma flotante IEEE-754.
- **Zod (Validación de Esquemas):** [`DiscountSchema`](file:///C:/Proyectos/matacos-deportes-app/src/schemas/sale.ts) para validar tipos admitidos (`PERCENTAGE`, `FIXED`), rangos porcentuales válidos (0 a 100%) y montos estrictamente positivos.
- **PostgreSQL 16 & Prisma ORM 6:** Persistencia atómica de auditoría en `SaleItem` (`originalPrice`, `discount`, `discountType`, `discountValue`, `unitPrice`, `subtotal`) y en `Sale` (`subtotalGross`, `discount`, `total`).
- **Server Actions de Next.js 15:** `updatePendingSale` (rebalanceo atómico de stock reservado ante cambios de prendas o descuentos en caja) y `previewSaleTotals` (simulación reactiva para el frontend).

---

## 3. Archivos Involucrados en el Requerimiento

### Módulo de Cálculo y Lógica Pura
- [`src/lib/discounts.ts`](file:///C:/Proyectos/matacos-deportes-app/src/lib/discounts.ts): Funciones `calculateItemDiscount` y `calculateSaleTotals`, diseñadas para ser consumidas tanto en el backend como en el store de Zustand del frontend.

### Esquemas de Validación (Zod)
- [`src/schemas/sale.ts`](file:///C:/Proyectos/matacos-deportes-app/src/schemas/sale.ts):
  - `DiscountTypeEnum`: `"PERCENTAGE"` | `"FIXED"`.
  - `DiscountSchema`: Validación de reglas de no negatividad y techo del 100%.
  - `UpdatePendingSaleSchema`: Esquema para modificar prendas y descuentos en mostrador antes del cobro.

### Server Actions (Backend)
- [`src/server/actions/posSaleActions.ts`](file:///C:/Proyectos/matacos-deportes-app/src/server/actions/posSaleActions.ts):
  - `createPendingSale`: Genera la preventa en salón aplicando los descuentos validados y reservando stock.
  - `updatePendingSale`: Modifica ítems y descuentos en caja, reajustando automáticamente las unidades reservadas (`stockReserved`).
  - `previewSaleTotals`: Expone el cálculo de totales en tiempo real para la interfaz de usuario.

### Persistencia y Modelos (Prisma)
- [`prisma/schema.prisma`](file:///C:/Proyectos/matacos-deportes-app/prisma/schema.prisma): Modelos `Sale`, `SaleItem` y enum `DiscountType`.

---

## 4. Flujo de Datos y Control

### Diagrama de Cálculo y Rebalanceo
```mermaid
flowchart TD
    A[Vendedor/Cajero: Ingresa Descuento] --> B{Tipo de Descuento}
    
    B -->|Porcentaje %| C[unitDiscount = originalPrice * % / 100]
    B -->|Monto Fijo $| D[unitDiscount = min(originalPrice, valor)]
    
    C --> E[unitPrice = max(0, originalPrice - unitDiscount)]
    D --> E
    
    E --> F[Subtotal Renglón = unitPrice * cantidad]
    F --> G[Suma de Subtotales = subtotalAfterItems]
    
    G --> H{¿Hay Descuento Global?}
    H -->|No| I[totalNet = subtotalAfterItems]
    H -->|Sí % o $| J[Aplica descuento global sobre subtotalAfterItems]
    J --> K[totalNet = max(0, subtotalAfterItems - globalDiscountAmount)]
    
    K --> L[updatePendingSale: Rebalancea stockReserved en PostgreSQL]
    L --> M[Persistencia atómica en Sale y SaleItem]
```

### Detalle del Flujo de Control y Rebalanceo de Stock
1. **Validación de Límites:** Si el usuario ingresa un porcentaje mayor a 100%, Zod y la función pura lo restringen al 100%. Si se ingresa un monto fijo mayor al precio del producto, el descuento se acota exactamente al precio de lista, garantizando que `unitPrice >= 0`.
2. **Descuento en Cascada:**
   - Primero se aplican los descuentos individuales sobre cada producto.
   - El descuento global sobre el ticket se calcula sobre el subtotal neto resultante de los ítems, no sobre el importe bruto inflado.
3. **Edición Previa en Caja (`updatePendingSale`):**
   - Si el cliente en caja decide cambiar el talle, agregar una prenda o solicitar un descuento extra por pago contado, el cajero edita el ticket.
   - El backend compara la diferencia de cantidades de cada variante entre el ticket anterior y el nuevo: si una prenda aumentó en 1 unidad, verifica stock en mostrador e incrementa `stockReserved + 1`; si disminuyó, decrementa `stockReserved - 1`.
   - Se reemplazan atómicamente los `SaleItem` y se actualiza la cabecera `Sale` con los nuevos importes.

---

## 5. Pruebas y Validación (QA)

### Prueba 1: Descuento Porcentual por Ítem
1. **Precondición:** Producto con precio de lista de `$ 58.000,00`.
2. **Paso 1:** Aplicar descuento del 15% sobre el ítem.
3. **Resultado Esperado:** 
   - Descuento unitario: `$ 8.700,00`.
   - Precio unitario resultante: `$ 49.300,00`.
   - Si se compran 2 unidades, el subtotal de línea debe ser exactamente `$ 98.600,00`.

### Prueba 2: Descuento Fijo y Protección contra Negativos
1. **Paso 1:** Intentar aplicar un descuento fijo de `$ 70.000,00` sobre un artículo de `$ 58.000,00`.
2. **Resultado Esperado:** 
   - El descuento unitario se limita a `$ 58.000,00`.
   - El precio unitario queda en `$ 0,00`.
   - El total nunca arroja saldo negativo.

### Prueba 3: Descuentos Combinados (Ítem + Global)
1. **Paso 1:** Cargar 2 unidades de `$ 20.000` con 10% desc ($ 36.000) y 1 unidad de `$ 40.000` con $ 5.000 fijo ($ 35.000). Subtotal = `$ 71.000,00`.
2. **Paso 2:** Aplicar descuento global del 10% adicional.
3. **Resultado Esperado:**
   - Descuento global: `$ 7.100,00`.
   - Total Neto final: `$ 63.900,00`.
   - Descuento total registrado: `$ 16.100,00`.

### Prueba 4: Rebalanceo de Stock Reservado en Caja
1. **Paso 1:** Crear preventa con 2 unidades de la Variante A (`stockReserved += 2`).
2. **Paso 2:** Mediante `updatePendingSale`, reducir la Variante A a 1 unidad y agregar 1 unidad de la Variante B.
3. **Resultado Esperado:**
   - La Variante A pasa a tener `stockReserved - 1`.
   - La Variante B pasa a tener `stockReserved + 1`.
   - Los totales del ticket se recalculan y actualizan en la base de datos sin duplicar transacciones.
