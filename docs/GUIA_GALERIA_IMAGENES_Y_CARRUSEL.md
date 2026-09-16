# Documentación Técnica: Galería Multimedia y Carrusel de Imágenes por Color
## Proyecto: Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes
**Comercio:** Matacos Deportes (Saavedra 241, Formosa Capital, Argentina)  
**Institución:** Universidad de la Cuenca del Plata — Práctica Profesional Supervisada I (PPS I)  
**Fecha de Implementación:** 16 de Septiembre de 2026  

---

## 1. Resumen Ejecutivo y Propósito

Con la normalización del catálogo de stock —donde modelos como *Crocband* se consolidan en un único producto padre con múltiples variantes de talles y colores— surgió la necesidad técnica de **vincular fotografías específicas a cada colorway** sin volver a desarmar ni inflar el catálogo con 20 productos artificiales.

Para dar respuesta a este requerimiento, se implementó la **Solución A (Galería de Imágenes por Producto y Color)**, dotando al sistema de:
1. Una tabla relacional `ProductImage` en PostgreSQL para soportar múltiples imágenes por producto.
2. Atribución dinámica de cada foto a un color de variante (ej: `"Negro"`, `"Marino/Rojo"`, o `"Portada General"`).
3. Un gestor interactivo de subida múltiple en el modal de alta/edición de productos.
4. Un carrusel visual en la ficha de detalle que **sincroniza automáticamente la foto activa cuando el usuario interactúa con la tabla de talles y colores**.

---

## 2. Arquitectura de Base de Datos (Prisma ORM & PostgreSQL)

Se modificó el archivo [`prisma/schema.prisma`](file:///C:/Users/della/matacos-deportes-app/prisma/schema.prisma#L70-L88) introduciendo la relación 1-a-N y el nuevo modelo:

```prisma
model Product {
  id           String           @id @default(uuid())
  name         String
  description  String?
  imageUrl     String?          // 🛡️ Conservado intacto como Portada / Fallback
  disciplineId String
  discipline   Discipline       @relation(fields: [disciplineId], references: [id])
  costPrice    Decimal          @db.Decimal(12, 2)
  price        Decimal          @db.Decimal(12, 2)
  active       Boolean          @default(true)
  categoryId   String
  category     Category         @relation(fields: [categoryId], references: [id])
  brandId      String
  brand        Brand            @relation(fields: [brandId], references: [id])
  variants     ProductVariant[]
  images       ProductImage[]   // 🚀 Nueva relación de galería
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
}

model ProductImage {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String   // Ruta pública generada por /api/upload (Local o Vercel Blob)
  color     String?  // Ej: "Negro", "Marino/Rojo" o null para portada general
  isPrimary Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

> [!NOTE]
> **Compatibilidad Hacia Atrás:**  
> Se preservó el campo `imageUrl` en el modelo `Product`. Cuando se cargan fotos en la galería, la foto marcada con `isPrimary: true` (o la primera del lote) se asigna automáticamente a `imageUrl`, garantizando que cualquier componente existente que consuma `item.imageUrl` siga funcionando sin modificaciones.

---

## 3. Validación y Contratos de Datos (Zod & TypeScript)

En [`src/schemas/product.ts`](file:///C:/Users/della/matacos-deportes-app/src/schemas/product.ts#L67-L117) se crearon los esquemas de validación y tipos seguros:

```typescript
export const ProductImageSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().min(1, "La URL de la imagen es requerida"),
  color: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false),
  order: z.number().int().default(0),
});

export type ProductImageInput = z.infer<typeof ProductImageSchema>;
```

Y en [`src/components/dashboard/types.ts`](file:///C:/Users/della/matacos-deportes-app/src/components/dashboard/types.ts#L100-L125) se amplió la interfaz [`DetailedProductItem`](file:///C:/Users/della/matacos-deportes-app/src/components/dashboard/types.ts#L90-L115):

```typescript
export interface ProductImageItem {
  id?: string;
  url: string;
  color?: string | null;
  isPrimary?: boolean;
  order?: number;
}
```

---

## 4. Backend y Server Actions (`productActions.ts`)

En [`src/server/actions/productActions.ts`](file:///C:/Users/della/matacos-deportes-app/src/server/actions/productActions.ts):

1. **Consultas (`getProducts`, `getProductById`, `getDetailedInventoryProducts`):**  
   Se añadió `images: { orderBy: { order: "asc" } }` al `include` de Prisma.
2. **Creación Atómica (`createProduct`):**  
   Inserta el producto, sus variantes y su colección `images` dentro de una única transacción de base de datos (`prisma.$transaction`), resolviendo la imagen principal de portada automáticamente.
3. **Actualización Atómica (`updateProduct`):**  
   Sincroniza la lista de imágenes reemplazando o actualizando registros con `tx.productImage.deleteMany` y `tx.productImage.createMany` en la misma transacción, actualizando en paralelo la portada del producto.

---

## 5. Modal de Carga y Edición Multimedia (`ProductFormModal.tsx`)

En [`src/components/dashboard/ProductFormModal.tsx`](file:///C:/Users/della/matacos-deportes-app/src/components/dashboard/ProductFormModal.tsx#L1050-L1160):

* **Selección Múltiple y Drag & Drop:** El input de archivo cuenta con atributo `multiple` y la zona de arrastre acepta lotes de imágenes simultáneas.
* **Detección Automática de Colores:** A través de un `useMemo` reactivo (`availableColors`), el modal inspecciona los colores ingresados en la tabla de variantes y los ofrece en un menú desplegable debajo de cada foto.
* **Marcador de Portada Principal (⭐):** Un botón interactivo permite alternar con 1 clic cuál imagen representa la portada principal (`isPrimary`).
* **Subida Asíncrona Integrada:** Antes de enviar los datos al Server Action, el formulario envía los archivos binarios pendientes al endpoint [`/api/upload`](file:///C:/Users/della/matacos-deportes-app/src/app/api/upload/route.ts) y recupera sus URLs públicas optimizadas.

---

## 6. Ficha de Detalle y Carrusel Reactivo (`ProductDetailView.tsx`)

En [`src/components/dashboard/ProductDetailView.tsx`](file:///C:/Users/della/matacos-deportes-app/src/components/dashboard/ProductDetailView.tsx#L670-L760):

* **Carrusel con Navegación:** Flechas flotantes de retroceso y avance con soporte cíclico y contador en tiempo real (`1 / N`).
* **Etiqueta de Color Activo:** Chip traslúcido en la esquina inferior izquierda que indica el color asociado a la fotografía actual (ej. `Color: Marino/Rojo` con punto verde esmeralda).
* **Cinta de Miniaturas (Ribbon):** Fila inferior deslizante con vistas previas pequeñas y etiquetas de color para cambiar de foto manualmente.
* **Sincronización Bidireccional con la Tabla de Variantes:** Al hacer clic en cualquier fila de la tabla de stock o en un talle específico (ej. un par talle 41 color *"Negro"*), el visor dispara `selectImageByColor("Negro")`, enfocando instantáneamente la imagen de ese color en el carrusel principal.

---

## 7. Garantías de Estabilidad y Pruebas Realizadas

| Control de Calidad | Comando / Herramienta | Resultado |
| :--- | :--- | :---: |
| **Sincronización DB** | `pnpm prisma db push` |  Exitoso (174ms) |
| **Tipado Estricto** | `pnpm tsc --noEmit` |  0 Errores |
| **Build de Producción** | `pnpm build` |  Compilación exitosa Next.js 15.5 |
| **POS Offline (Dexie.js)** | [`src/lib/dexie.ts`](file:///C:/Users/della/matacos-deportes-app/src/lib/dexie.ts) |  Aislado (0 consumo de imágenes) |
| **Control de Versiones** | Regla Estricta |  Sin commits automáticos |
