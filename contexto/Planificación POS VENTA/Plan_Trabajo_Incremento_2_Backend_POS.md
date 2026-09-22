# Plan de Trabajo Técnico — Incremento 2: Módulo POS Venta, Preventa en Salón y Cobro en Caja
**Proyecto:** Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes (Saavedra 241, Formosa)  
**Institución:** Universidad de la Cuenca del Plata (Sede Formosa) — Práctica Profesional Supervisada I (PPS I)  
**Rol Responsable:** Fornari, Nahir Agustín (Backend Developer / Analista Funcional)  
**Colaboradores de Integración:** Dellagnolo, Ricardo (Arquitectura/Sync), Bordón, Lourdes (Frontend UI/UX), González, Eugenia (Zustand / IndexedDB / QA)  
**Plazo de Ejecución:** 21 de Septiembre de 2026 al 1–3 de Octubre de 2026  

---

## 1. Visión General y Objetivos del Incremento 2

El objetivo central de este incremento es implementar la **arquitectura desacoplada de Preventa y Cobro** para operar de forma fluida con **dos terminales en red local (LAN)** en el local físico de Saavedra 241:

1. **Terminal 1 (Salón de Ventas):** El vendedor asesora al cliente, prueba talles/colores, escanea con el lector USB, aplica descuentos autorizados y congela la preventa (**Ticket #042 - Juan**), reservando el stock de forma preventiva.
2. **Terminal 2 (Caja Mostrador):** El cajero recibe el pedido en tiempo real, puede editar ítems si el cliente decide sumar algo en mostrador, cobra combinando múltiples medios de pago (efectivo, posnet, QR, transferencia), calcula vuelto, emite el ticket térmico de 80mm e imputa el ingreso al turno de caja activo.
3. **Turnos y Arqueo de Caja:** Control digital del ciclo de caja (apertura con fondo inicial, retiros/gastos menores y cierre con arqueo discriminado por método de pago).
4. **Resiliencia Offline:** Venta ininterrumpida ante microcortes con persistencia en Dexie.js e idempotencia en sincronización.

---

## 2. Requerimientos Funcionales de Backend Asignados

| Requerimiento | Nombre | Responsabilidad Principal de Backend |
| :--- | :--- | :--- |
| **RF-07** | Búsqueda Ágil en Mostrador | Endpoint y Server Action de búsqueda predictiva ultraliviana (< 50ms) por código de barras USB y texto (SKU/nombre/talle/color). |
| **RF-08** | Descuentos Manuales en POS | Motor de cálculo y validación de descuentos (% o $ fijo) por ítem y global sobre el ticket, con validación de no negatividad. |
| **RF-09** | Cobro Multimétodo y Vuelto | Server Action atómica de cobranza mixta (efectivo, posnet débito/crédito, transferencias, QR MP) y cálculo automático de vuelto. |
| **RF-10** | Emisión e Impresión de Tickets | Generador de payload estructurado para ticket de preventa y ticket fiscal/comprobante térmico de 80mm (ESC/POS). |
| **RF-11** | Apertura, Arqueo y Cierre de Caja | Modelado y Server Actions para turnos (`CashShift`), movimientos de caja (`CashMovement`) y conciliación por medio de pago. |
| **RF-12** | Modo Offline y Sincronización | Protocolo de sincronización idempotente con `offlineId` (UUID) para evitar duplicación de ventas y descuadre de stock. |

---

## 3. Actualizaciones al Modelo de Datos (`prisma/schema.prisma`)

Para soportar el circuito completo de preventa, cobro y arqueo de caja sin romper el módulo de inventario ya desplegado, añadiremos los siguientes modelos y campos.

```prisma
// ==========================================
// 1. ENUMS EXTENDIDOS
// ==========================================

enum SaleStatus {
  PENDIENTE_PAGO   // Preventa congelada en salón de ventas (stock reservado)
  COMPLETADA       // Cobrada y facturada en caja (stockStore descontado)
  CANCELADA        // Cancelada por el cliente o cajero (stock reservado liberado)
}

enum DiscountType {
  PERCENTAGE       // Descuento porcentual (ej: 10%, 15%)
  FIXED            // Descuento en monto fijo (ej: $ 5.000,00)
}

enum CashShiftStatus {
  ABIERTA          // Turno de caja actualmente en operación
  CERRADA          // Turno arqueado y cerrado
}

enum CashMovementType {
  INGRESO_EXTRAORDINARIO // Aporte extra de efectivo o ajuste
  RETIRO_CAJA_FUERTE     // Retiro de seguridad durante el día
  GASTO_MENOR            // Pago de flete, viáticos, librería con comprobante
  AJUSTE_ARQUEO          // Ajuste de balance
}

// ==========================================
// 2. MODELO DE TURNO DE CAJA (ARQUEO - RF-11)
// ==========================================

model CashShift {
  id              String            @id @default(uuid())
  terminalId      String            // "TERMINAL_1_SALON" o "TERMINAL_2_CAJA"
  userId          String            // Cajero responsable que abrió el turno
  user            User              @relation(fields: [userId], references: [id])
  status          CashShiftStatus   @default(ABIERTA)
  openedAt        DateTime          @default(now())
  closedAt        DateTime?
  
  // Saldo inicial (Fondo de cambio en mostrador)
  initialAmount   Decimal           @db.Decimal(12, 2)
  
  // Valores esperados calculados por el sistema al cierre
  expectedCash    Decimal?          @db.Decimal(12, 2)
  expectedDebit   Decimal?          @db.Decimal(12, 2)
  expectedCredit  Decimal?          @db.Decimal(12, 2)
  expectedTransfer Decimal?         @db.Decimal(12, 2)
  expectedQr      Decimal?          @db.Decimal(12, 2)
  
  // Valores reales contados por el cajero en el arqueo
  actualCash      Decimal?          @db.Decimal(12, 2)
  actualDebit     Decimal?          @db.Decimal(12, 2)
  actualCredit    Decimal?          @db.Decimal(12, 2)
  actualTransfer  Decimal?          @db.Decimal(12, 2)
  actualQr        Decimal?          @db.Decimal(12, 2)
  
  // Diferencias (Sobrante > 0, Faltante < 0)
  differenceCash  Decimal?          @db.Decimal(12, 2)
  
  notes           String?           // Observaciones del cierre
  sales           Sale[]
  movements       CashMovement[]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model CashMovement {
  id              String            @id @default(uuid())
  cashShiftId     String
  cashShift       CashShift         @relation(fields: [cashShiftId], references: [id], onDelete: Cascade)
  type            CashMovementType
  amount          Decimal           @db.Decimal(12, 2)
  reason          String            // Detalle descriptivo obligatorio
  receiptNumber   String?           // Nro de factura o ticket de gasto si aplica
  performedBy     String            // Nombre o ID de quien ejecutó el egreso/ingreso
  createdAt       DateTime          @default(now())
}

// ==========================================
// 3. EXTENSIÓN DEL MODELO SALE Y SALEITEM
// ==========================================

model Sale {
  id              String            @id @default(uuid())
  invoiceNumber   String?           @unique // "TKT-00012345"
  ticketCode      String?           // Identificador corto de salón: "#042"
  offlineId       String?           @unique // UUID idempotente generado por Dexie.js
  
  // Trazabilidad de roles (Salón vs Caja)
  sellerId        String?           // Vendedor que armó la preventa
  seller          User?             @relation("SaleSeller", fields: [sellerId], references: [id])
  cashierId       String?           // Cajero que cobró la venta
  cashier         User?             @relation("SaleCashier", fields: [cashierId], references: [id])
  
  // Imputación a turno de caja
  cashShiftId     String?
  cashShift       CashShift?        @relation(fields: [cashShiftId], references: [id])
  
  customerName    String?           // Nombre o alias del cliente ("Juan Pérez")
  channel         String            @default("MOSTRADOR") // MOSTRADOR o WEB
  status          SaleStatus        @default(COMPLETADA)
  
  // Totales financieros
  subtotalGross   Decimal           @db.Decimal(12, 2) // Suma de ítems sin descuento
  discount        Decimal           @default(0) @db.Decimal(12, 2) // Descuento global
  discountType    DiscountType?
  discountValue   Decimal?          @db.Decimal(12, 2) // % o $ ingresado
  total           Decimal           @db.Decimal(12, 2) // Total neto a cobrar
  
  items           SaleItem[]
  payments        SalePayment[]
  
  syncedAt        DateTime?         // Fecha de sync si provino de offline
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model SaleItem {
  id              String            @id @default(uuid())
  saleId          String
  sale            Sale              @relation(fields: [saleId], references: [id], onDelete: Cascade)
  variantId       String
  variant         ProductVariant    @relation(fields: [variantId], references: [id])
  quantity        Int
  
  // Precios y descuentos a nivel renglón
  originalPrice   Decimal           @db.Decimal(12, 2) // Precio de lista
  discount        Decimal           @default(0) @db.Decimal(12, 2) // Descuento aplicado
  discountType    DiscountType?
  discountValue   Decimal?          @db.Decimal(12, 2)
  unitPrice       Decimal           @db.Decimal(12, 2) // Precio unitario final cobrado
  subtotal        Decimal           @db.Decimal(12, 2) // quantity * unitPrice
}

model SalePayment {
  id              String            @id @default(uuid())
  saleId          String
  sale            Sale              @relation(fields: [saleId], references: [id], onDelete: Cascade)
  method          PaymentMethod
  amount          Decimal           @db.Decimal(12, 2) // Monto imputado al total
  receivedAmount  Decimal?          @db.Decimal(12, 2) // Monto entregado (Efectivo)
  change          Decimal?          @db.Decimal(12, 2) // Vuelto entregado
  
  // Metadatos de conciliación
  cardBrand       String?           // "Visa", "Mastercard", etc.
  cardVoucher     String?           // Nro de cupón Posnet para arqueo
  installments    Int?              // Cantidad de cuotas
  referenceCode   String?           // Nro de transferencia bancaria o ID de MP
}
```

---

## 4. Diseño Detallado de Módulos Backend (con Código de Referencia)

### 4.1. RF-07: Búsqueda Ágil en Mostrador (Lector USB + Predictiva < 50ms)

* **Problema:** Un `findMany` con `include: { product: true }` y múltiples joins sobre cientos de variantes puede tardar entre 150ms y 400ms, generando lentitud cuando el vendedor tipea rápido o pasa códigos seguidos con el lector USB.
* **Solución:** Route Handler GET `/api/pos/search` con **proyección SQL mínima (SELECT específico)** e índice en memoria/PostgreSQL. Si el query coincide con un código de barra exacto, retorna un match directo de 1 solo elemento en < 20ms.

```typescript
// src/app/api/pos/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  try {
    // 1. Detección de Código de Barras USB (Match Exacto rápido)
    const exactBarcode = await prisma.productVariant.findFirst({
      where: {
        OR: [{ barcode: q }, { sku: q }],
        product: { active: true },
      },
      select: {
        id: true,
        size: true,
        color: true,
        sku: true,
        barcode: true,
        stockStore: true,
        stockWarehouse: true,
        stockReserved: true,
        price: true,
        product: {
          select: {
            id: true,
            name: true,
            brand: { select: { name: true } },
            price: true,
          },
        },
      },
    });

    if (exactBarcode) {
      const effectivePrice = exactBarcode.price ?? exactBarcode.product.price;
      const availableStore = Math.max(0, exactBarcode.stockStore - exactBarcode.stockReserved);
      return NextResponse.json({
        exactMatch: true,
        items: [
          {
            variantId: exactBarcode.id,
            productId: exactBarcode.product.id,
            name: exactBarcode.product.name,
            brand: exactBarcode.product.brand.name,
            size: exactBarcode.size,
            color: exactBarcode.color,
            barcode: exactBarcode.barcode,
            sku: exactBarcode.sku,
            price: Number(effectivePrice),
            stockStore: exactBarcode.stockStore,
            stockAvailable: availableStore,
          },
        ],
      });
    }

    // 2. Búsqueda Predictiva por Texto (Top 15 variantes con stock disponible)
    const results = await prisma.productVariant.findMany({
      where: {
        product: { active: true },
        OR: [
          { product: { name: { contains: q, mode: "insensitive" } } },
          { product: { brand: { name: { contains: q, mode: "insensitive" } } } },
          { sku: { contains: q, mode: "insensitive" } },
          { color: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 15,
      select: {
        id: true,
        size: true,
        color: true,
        sku: true,
        barcode: true,
        stockStore: true,
        stockReserved: true,
        price: true,
        product: {
          select: {
            id: true,
            name: true,
            brand: { select: { name: true } },
            price: true,
          },
        },
      },
    });

    const items = results.map((v) => ({
      variantId: v.id,
      productId: v.product.id,
      name: v.product.name,
      brand: v.product.brand.name,
      size: v.size,
      color: v.color,
      barcode: v.barcode,
      sku: v.sku,
      price: Number(v.price ?? v.product.price),
      stockStore: v.stockStore,
      stockAvailable: Math.max(0, v.stockStore - v.stockReserved),
    }));

    return NextResponse.json({ exactMatch: false, items });
  } catch (error) {
    console.error("Error en búsqueda POS:", error);
    return NextResponse.json({ error: "Error en búsqueda" }, { status: 500 });
  }
}
```

---

### 4.2. Preventa en Salón: `createPendingSale` (Reserva Atómica de Stock)

* **Circuito:** El vendedor arma el carrito, asigna alias del cliente y hace clic en "Enviar a Caja".
* **Lógica Atómica:**
  1. Verifica que `(variant.stockStore - variant.stockReserved) >= quantity`.
  2. Incrementa `stockReserved += quantity` en cada variante.
  3. Crea `Sale` con `status = "PENDIENTE_PAGO"` y genera `ticketCode = "#042"` (secuencial del día).
  4. Retorna el código correlativo para que el vendedor se lo entregue al cliente.

```typescript
// Fragmento de src/server/actions/posSaleActions.ts
export async function createPendingSale(input: CreatePendingSaleInput) {
  const validated = CreatePendingSaleSchema.parse(input);

  return await prisma.$transaction(async (tx) => {
    // 1. Obtener y bloquear variantes para verificar stock
    const variantIds = validated.items.map((i) => i.variantId);
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });
    const map = new Map(variants.map((v) => [v.id, v]));

    for (const item of validated.items) {
      const v = map.get(item.variantId);
      if (!v) throw new Error(`Variante no encontrada: ${item.variantId}`);
      
      const available = v.stockStore - v.stockReserved;
      if (available < item.quantity) {
        throw new Error(
          `Stock insuficiente en salón para ${v.product.name} (${v.size}/${v.color}). Disponible: ${available}, solicitado: ${item.quantity}`
        );
      }
    }

    // 2. Generar correlativo corto del día (#001, #002...)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const countToday = await tx.sale.count({
      where: { createdAt: { gte: todayStart } },
    });
    const ticketCode = `#${String(countToday + 1).padStart(3, "0")}`;

    // 3. Calcular montos y descuentos
    const { subtotalGross, discountAmount, total } = calculateSaleTotals(
      validated.items,
      validated.globalDiscount
    );

    // 4. Crear la preventa pendiente
    const sale = await tx.sale.create({
      data: {
        ticketCode,
        invoiceNumber: `PRE-${Date.now().toString().slice(-8)}`,
        sellerId: validated.sellerId,
        customerName: validated.customerName || "Cliente Mostrador",
        status: "PENDIENTE_PAGO",
        subtotalGross: new Prisma.Decimal(subtotalGross),
        discount: new Prisma.Decimal(discountAmount),
        discountType: validated.globalDiscount?.type,
        discountValue: validated.globalDiscount?.value ? new Prisma.Decimal(validated.globalDiscount.value) : null,
        total: new Prisma.Decimal(total),
      },
    });

    // 5. Crear ítems y reservar stock preventivo
    for (const item of validated.items) {
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          variantId: item.variantId,
          quantity: item.quantity,
          originalPrice: new Prisma.Decimal(item.originalPrice),
          discount: new Prisma.Decimal(item.discountAmount || 0),
          discountType: item.discountType,
          discountValue: item.discountValue ? new Prisma.Decimal(item.discountValue) : null,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          subtotal: new Prisma.Decimal(item.quantity * item.unitPrice),
        },
      });

      // Incrementar stock comprometido
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockReserved: { increment: item.quantity } },
      });
    }

    return { success: true, ticketCode, saleId: sale.id };
  });
}
```

---

### 4.3. RF-08: Motor de Validación de Descuentos Manuales (Zod & Server)

* **Reglas de Negocio:**
  - Descuento en Porcentaje: `0 <= value <= 100`.
  - Descuento Fijo en Pesos: `0 < value <= subtotal`.
  - El total neto **jamás puede ser negativo**.
  - Auditoría: Si el descuento supera el 20%, se puede requerir autorización de encargado/admin en un campo `authorizedBy`.

```typescript
// src/schemas/discount.ts
import { z } from "zod";

export const DiscountSchema = z.object({
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive("El descuento debe ser mayor a 0"),
  reason: z.string().optional(),
}).refine((data) => {
  if (data.type === "PERCENTAGE") {
    return data.value <= 100;
  }
  return true;
}, {
  message: "El porcentaje de descuento no puede ser superior al 100%",
  path: ["value"],
});

export function calculateDiscount(baseAmount: number, discount?: z.infer<typeof DiscountSchema> | null): number {
  if (!discount || discount.value <= 0) return 0;
  if (discount.type === "PERCENTAGE") {
    const rawDiscount = (baseAmount * discount.value) / 100;
    return Math.round(rawDiscount * 100) / 100; // Redondeo a 2 decimales
  }
  return Math.min(baseAmount, discount.value);
}
```

---

### 4.4. RF-09: Cobro en Caja, Métodos Mixtos y Vuelto (`completePendingSale`)

* **Circuito en Caja:**
  1. El cajero abre el ticket `#042`.
  2. Si el cliente agregó algo en el mostrador, se llama a `updatePendingSale` (reajusta `stockReserved`).
  3. El cajero ingresa los medios de pago (ej: `$ 20.000` con Débito y `$ 30.000` en Efectivo, pagó con `$ 35.000`, vuelto `$ 5.000`).
  4. Ejecución de `completePendingSale`:
     - Valida turno de caja abierto en esa terminal.
     - Valida que la suma de pagos cubra exactamente el total neto.
     - Cambia estado a `COMPLETADA`.
     - Descuenta `stockStore -= quantity` y libera `stockReserved -= quantity`.
     - Crea movimientos `InventoryMovement` (`VENTA_MOSTRADOR`).
     - Registra los pagos discriminados.
     - Retorna el objeto formateado para imprimir el ticket térmico.

---

### 4.5. RF-10: Emisión e Impresión de Tickets (80mm ESC/POS)

* **Servicio:** `generateReceiptPayload(saleId)`
* **Estructura JSON lista para comanderas térmicas o el modal de impresión:**

```typescript
// src/server/services/receiptService.ts
export interface ReceiptData {
  company: {
    name: "MATACOS DEPORTES";
    address: "Saavedra 241, Formosa Capital";
    cuit: "20-XXXXXXXX-X";
    ivaCondition: "Resp. Inscripto / Monotributo";
    phone: "+54 370 4XXXXXX";
  };
  sale: {
    invoiceNumber: string;
    ticketCode: string;
    date: string; // "21/09/2026 18:45"
    sellerName: string;
    cashierName: string;
    customerName: string;
  };
  items: Array<{
    description: string; // "Zapatillas Crocs Classic (41/Negro)"
    qty: number;
    unitPrice: string; // "$ 58.000,00"
    discount?: string;
    subtotal: string;
  }>;
  totals: {
    subtotalGross: string;
    discountTotal: string;
    netTotal: string;
  };
  payments: Array<{
    methodName: string; // "Efectivo", "Posnet Débito", "QR Mercado Pago"
    amount: string;
    voucher?: string;
    received?: string;
    change?: string;
  }>;
  legalFooter: "Documento no fiscal / Comprobante de Entrega. Cambios dentro de los 30 días con ticket y etiquetas.";
}
```

---

### 4.6. RF-11: Control de Caja: Apertura, Movimientos y Arqueo

* **Flujo Operativo:**
  1. `openCashShift({ terminalId, initialAmount, userId })`: No permite abrir si ya hay un turno activo en la misma terminal.
  2. `registerCashMovement({ cashShiftId, type, amount, reason })`: Para registrar retiros a caja de seguridad o pagos de fletes/gastos con comprobante.
  3. `closeCashShift({ cashShiftId, actualAmounts, notes })`:
     - Consolida todas las ventas del turno por método:
       - `expectedCash = initialAmount + sum(ventas efectivo) + sum(ingresos) - sum(egresos)`
       - `expectedDebit = sum(ventas débito)`
       - `expectedCredit = sum(ventas crédito)`
       - `expectedTransfer = sum(ventas transferencia)`
       - `expectedQr = sum(ventas QR)`
     - Compara con `actualCash` (conteo del cajero).
     - Calcula `differenceCash = actualCash - expectedCash`.
     - Cierra el turno e imprime el comprobante de Arqueo de Caja.

---

### 4.7. RF-12: Modo Offline y Sincronización Idempotente

* **Protocolo de Resiliencia en Saavedra 241:**
  1. En el frontend (Dexie.js), cada venta generada offline tiene un `offlineId` único (`crypto.randomUUID()`).
  2. Al restablecerse la red, el cliente dispara un POST a `/api/pos/sync-batch` con el lote de ventas.
  3. El backend procesa cada venta dentro de su propia transacción:
     - Si `offlineId` ya existe en la base de datos, **no la vuelve a procesar ni a descontar stock** (idempotencia pura).
     - Si no existe, la crea, descuenta stock de mostrador y emite el comprobante.
     - Si alguna variante se quedó sin stock físico durante la desconexión (caso extremo), la venta se registra igualmente para no frenar la caja, pero se genera una alerta automática de stock negativo para arqueo físico.

---

## 5. Posibles Riesgos y Problemas Técnicos (y sus Soluciones)

| Riesgo Técnico | Impacto | Estrategia de Mitigación / Solución |
| :--- | :--- | :--- |
| **Bloqueo de DLL de Prisma en Windows** | `EPERM: operation not permitted` en `query_engine-windows.dll.node` al ejecutar `prisma generate`. | Seguir la directiva estricta: detener el servidor (`Ctrl + C`) antes de correr `pnpm prisma db push` o `generate`. |
| **Sobreventas concurrentes entre Salón y Web** | El cliente en salón y un usuario web compran la última unidad al mismo segundo. | Uso estricto de `stockReserved`. Al congelar la preventa en salón, la unidad ya no figura disponible para el carrito web. |
| **Pérdida de centavos por coma flotante** | Desfase de $ 0,01 o $ 0,02 entre suma de pagos y total neto. | Cálculos con centavos enteros o tipos `Prisma.Decimal`, con tolerancia estricta `<= 0.01` en validaciones Zod. |
| **Microcortes de red Wi-Fi en el local** | La notebook de caja pierde conexión al servidor local durante un cobro. | Persistencia instantánea previa en Dexie.js (IndexedDB) antes de disparar la Server Action; reintento automático en cola. |
| **Cierre de caja con diferencia sin justificar** | Descuadre en el arqueo al final del día. | Registro obligatorio de `differenceCash` y campo `notes` mandatorio si la diferencia supera los $ 500,00. |

---

## 6. Requerimientos para el Equipo de Frontend (Lourdes y Milagros)

Para que la conexión entre Backend y Frontend sea inmediata, se acuerdan los siguientes contratos:

1. **Estado Global con Zustand (`useCartStore` y `usePendingSalesStore`):**
   - Manejo del carrito de salón (ítems, talles, selector de vendedor y campo de cliente).
   - Acciones de recálculo reactivo con selector de descuentos (% o $).
2. **Tablas Locales en IndexedDB (Dexie.js):**
   - Tabla `pendingSales`: Para consultar pedidos en espera en la notebook de caja.
   - Tabla `offlineQueue`: Cola de ventas confirmadas pendientes de sincronización.
   - Tabla `localProducts`: Caché del catálogo para búsqueda offline instantánea.
3. **Mecanismo de Notificación en Caja:**
   - Hook de polling con SWR cada 2–3 segundos a `/api/pos/pending-sales` (o Server-Sent Events).
   - Aviso visual (badge pulsante) y sonido sutil (*ding*) cuando ingresa un nuevo ticket de preventa.
4. **Vistas Maquetadas con `shadcn/ui`:**
   - Modal o pantalla completa de **Preventa de Salón** (optimizada para teclado y lector USB).
   - Pantalla de **Cobro en Caja** con panel dividido: lista de pedidos pendientes a la izquierda, detalle y cobro multimétodo a la derecha.
   - Modal de **Apertura y Cierre de Caja** (con inputs numéricos para contar billetes).

---

## 7. Cronograma Detallado de Trabajo (21 de Septiembre al 3 de Octubre)

```mermaid
gantt
    title Cronograma Incremento 2: Backend POS Venta y Caja
    dateFormat  YYYY-MM-DD
    section Fase 1: Schema & DB
    Migración schema.prisma (CashShift, Sale, SaleItem) :2026-09-21, 2026-09-22
    Seeders y pruebas de integridad relacional           :2026-09-22, 2026-09-23
    section Fase 2: Preventa & Búsqueda
    RF-07: Endpoint predictivo rápido (<50ms)           :2026-09-23, 2026-09-25
    createPendingSale & reserva preventiva de stock      :2026-09-24, 2026-09-26
    section Fase 3: Descuentos & Cobro
    RF-08: Motor y validación de descuentos (% / $)      :2026-09-26, 2026-09-27
    RF-09: completePendingSale multimétodo & vuelto      :2026-09-27, 2026-09-29
    section Fase 4: Caja & Arqueo
    RF-11: Apertura, egresos/ingresos y cierre de caja   :2026-09-29, 2026-09-30
    RF-10: Payload estructurado para ticket 80mm         :2026-09-30, 2026-10-01
    section Fase 5: Offline & QA
    RF-12: syncOfflineSalesBatch (Idempotencia)         :2026-10-01, 2026-10-02
    Pruebas integradas con Front y entrega final         :2026-10-02, 2026-10-03
```

* **Días 1–2 (21–22 Sept):** Extensión de `schema.prisma`, creación de tablas de caja y relaciones de preventa. Push seguro a PostgreSQL.
* **Días 3–4 (23–24 Sept):** Implementación de búsqueda predictiva liviana (RF-07) y Server Action `createPendingSale` con reserva atómica de stock.
* **Días 5–6 (25–26 Sept):** Motor de descuentos Zod (RF-08) y actualización de preventas pendientes desde mostrador.
* **Días 7–8 (27–28 Sept):** Cobro multimétodo y vuelto (RF-09) con transacción atómica de stock y comprobantes.
* **Días 9–10 (29–30 Sept):** Módulo de Arqueo y Cierre de Caja (RF-11) y servicio generador de ticket térmico 80mm (RF-10).
* **Días 11–12 (1–2 Oct):** Endpoint de sincronización idempotente offline (RF-12) y pruebas de carga y concurrencia.
* **Día 13 (3 Oct):** Congelamiento de código backend, entrega de contratos definitivos a Frontend y validación con los requerimientos de cátedra.
