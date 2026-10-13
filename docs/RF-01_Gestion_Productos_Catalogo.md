# [RF-01] Gestión de Productos y Catálogo Maestro

## 1. Descripción y Objetivo
Permite al Administrador del sistema dar de alta, consultar, modificar y dar de baja lógica (`active: false`) artículos dentro del catálogo de **Matacos Deportes**. El requerimiento resuelve la falta histórica de una base de datos centralizada de mercadería detectada durante la etapa de elicitación, donde el comercio operaba con cuadernos manuscritos y remarcación artesanal.

El módulo provee una clasificación taxonómica estricta en tres niveles:
1. **Disciplina Deportiva:** Natación, Vóley, Crocs/Urbano, Fitness, Running, etc.
2. **Categoría de Producto:** Indumentaria, Calzado, Accesorios Deportivos, Equipamiento.
3. **Marca Comercial:** Speedo, Arena, Crocs, Wilson, Dolfin, Topper, etc.

Adicionalmente, permite definir el nombre comercial, descripción enriquecida, código de modelo del fabricante (`modelCode`), precio de costo de referencia (protegido por rol), precio de venta sugerido base y galería de imágenes organizadas por orden y color.

---

## 2. Tecnologías, Herramientas y Librerías

- **Next.js 15 (Server Actions):** [`src/server/actions/productActions.ts`](file:///C:/Proyectos/matacos-deportes-app/src/server/actions/productActions.ts) y [`src/server/actions/categoryActions.ts`](file:///C:/Proyectos/matacos-deportes-app/src/server/actions/categoryActions.ts) para operaciones transaccionales seguras y reactivación de caché vía `revalidatePath`.
- **PostgreSQL 16 & Prisma ORM 6:** Modelos relacionales normalizados `Product`, `Discipline`, `Category`, `Brand` y `ProductImage` con integridad referencial.
- **Zod (Validación de Esquemas):** [`CreateProductSchema`](file:///C:/Proyectos/matacos-deportes-app/src/schemas/product.ts) y [`UpdateProductSchema`](file:///C:/Proyectos/matacos-deportes-app/src/schemas/product.ts) garantizando no negatividad de importes, unicidad de slugs y tipado estricto.
- **Lucide Icons & Tailwind CSS / shadcn/ui:** Componentes modales y formularios reactivos con validación instantánea.

---

## 3. Archivos Involucrados en el Requerimiento

### Backend & Server Actions
- [`src/server/actions/productActions.ts`](file:///C:/Proyectos/matacos-deportes-app/src/server/actions/productActions.ts): Server Actions para creación (`createProduct`), actualización (`updateProduct`), eliminación lógica (`deleteProduct`) y consultas paginadas con filtros (`getProducts`, `getProductById`).
- [`src/server/actions/categoryActions.ts`](file:///C:/Proyectos/matacos-deportes-app/src/server/actions/categoryActions.ts): Gestión ágil de disciplinas, marcas y categorías maestras.

### Esquemas de Validación (Zod)
- [`src/schemas/product.ts`](file:///C:/Proyectos/matacos-deportes-app/src/schemas/product.ts): Define `CreateProductSchema`, `UpdateProductSchema`, `DisciplineSchema`, `CategorySchema` y `BrandSchema`.

### Modelos y Persistencia (Prisma / PostgreSQL)
- [`prisma/schema.prisma`](file:///C:/Proyectos/matacos-deportes-app/prisma/schema.prisma):
  - `Product`: Campos `name`, `slug`, `description`, `modelCode`, `costPrice`, `price`, `active`, relaciones foráneas con `disciplineId`, `categoryId`, `brandId`.
  - `Discipline`, `Category`, `Brand`: Tablas maestras con `name` y `slug` indexados.
  - `ProductImage`: Galería con `url`, `color`, `isPrimary` y `order`.

### Componentes de Interfaz de Usuario (Frontend)
- [`src/components/dashboard/ProductFormModal.tsx`](file:///C:/Proyectos/matacos-deportes-app/src/components/dashboard/ProductFormModal.tsx): Modal reactivo para alta y edición de producto con carga dinámica de variantes e imágenes.
- [`src/components/dashboard/ProductDetailView.tsx`](file:///C:/Proyectos/matacos-deportes-app/src/components/dashboard/ProductDetailView.tsx): Ficha técnica completa de visualización de artículo, variantes y métricas de rotación.
- [`src/components/dashboard/MasterCategoriesManager.tsx`](file:///C:/Proyectos/matacos-deportes-app/src/components/dashboard/MasterCategoriesManager.tsx): Administrador en línea de marcas, categorías y disciplinas.

---

## 4. Flujo de Datos y Control

### Diagrama de Flujo del Requerimiento
```mermaid
flowchart TD
    A[Administrador: Clic en 'Nuevo Producto'] --> B[ProductFormModal: Carga Disciplinas, Marcas y Categorías]
    B --> C[Admin completa datos básicos: Nombre, Marca, Disciplina, Precios]
    C --> D[Admin define variantes mínimas requeridas]
    D --> E{Validación Zod en Frontend}
    E -->|Errores| F[Muestra alertas en campos específicos]
    E -->|Válido| G[Invoca Server Action: createProduct]
    G --> H[Validación Zod estricta en Servidor]
    H --> I[Prisma: Inserción en transacción de Product + Variants + Images]
    I --> J[PostgreSQL 16: Persistencia atómica y generación de IDs]
    J --> K[Server Action: revalidatePath('/admin') & Audit Log]
    K --> L[UI: Cierra Modal, muestra Toast exitoso y actualiza tabla]
```

### Detalle del Flujo de Control
1. **Apertura del Formulario:** La interfaz solicita en paralelo la lista de marcas, disciplinas y categorías disponibles mediante Server Actions livianas.
2. **Validación Dual:** Zod valida en cliente los formatos obligatorios y, al enviarse el payload, el servidor ejecuta `CreateProductSchema.parse()`, impidiendo inyecciones o datos inconsistentes.
3. **Persistencia Relacional Atómica:** Dentro de una transacción de Prisma, se crea la cabecera del producto y en cascada sus variantes iniciales con stock inicial registrado en auditoría.
4. **Baja Lógica (*Soft Delete*):** La eliminación de un producto no borra los registros históricos para no quebrar la integridad referencial de ventas pasadas ni el libro de movimientos de inventario (`active: false`).

---

## 5. Pruebas y Validación (QA)

1. **Precondición:** Contar con al menos una disciplina (ej: Natación), una marca (ej: Speedo) y una categoría (ej: Accesorios) dadas de alta en el sistema.
2. **Paso 1:** Abrir el panel de administración, pulsar en *"Nuevo Producto"*, e ingresar `"Antiparras Mariner Pro"`, seleccionando marca Speedo y disciplina Natación.
3. **Paso 2:** Intentar guardar sin variantes asociadas. Verificar que Zod bloquee el envío indicando: *"El producto debe tener al menos una variante de talle/color"*.
4. **Paso 3:** Agregar una variante (Talle: Único, Color: Azul Humo) y guardar.
5. **Resultado Esperado:** El modal se cierra, la tabla de catálogo refleja el nuevo producto con estado "Activo", y se puede consultar su ficha individual de inmediato.
