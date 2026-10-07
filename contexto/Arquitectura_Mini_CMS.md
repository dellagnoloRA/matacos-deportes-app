# Arquitectura y Diseño del "Mini-CMS" Interno
**Proyecto:** Matacos Deportes
**Propósito:** Definir la estrategia para que los dueños administren el contenido dinámico del e-commerce (banners, productos destacados, promociones y descuentos) sin intervención técnica, de manera autogestionada y sin utilizar plataformas de terceros (Headless CMS externos).

---

## 1. Justificación de un CMS Interno (Integrado en el Dashboard)

En lugar de contratar servicios externos como Contentful o Sanity, se desarrollará un módulo "Marketing / Web" directamente en el panel administrativo (`src/app/admin/`) que ya utiliza el equipo. 

**Beneficios:**
* **Costo Cero mensual:** No hay que pagar licencias de terceros.
* **Integración Nativa:** Al estar en la misma base de datos PostgreSQL y usar Prisma, podemos relacionar un "Banner" directamente con un "Producto" o "Categoría" existente sin usar APIs lentas.
* **Curva de Aprendizaje:** Los administradores ya sabrán usar el sistema, ya que comparte el mismo diseño visual (shadcn/ui) que el Punto de Venta (POS).

---

## 2. Modelado de Base de Datos (Propuesta para Prisma)

Para soportar la carga dinámica de la web, se propone agregar las siguientes entidades al archivo `schema.prisma`.

### A. Gestión de Banners y Carrusel Principal
Los banners son imágenes grandes en la portada (Home) o páginas de categoría. Permiten destacar una campaña ("Vuelta al Cole", "Cyber Monday").

```prisma
model Banner {
  id        String   @id @default(uuid())
  title     String   // Ej: "Promo Día del Padre 2026"
  imageUrl  String   // URL de la imagen (subida a @vercel/blob)
  link      String?  // URL de destino al hacer clic (ej: "/productos?categoria=running")
  position  String   @default("HOME_HERO") // "HOME_HERO", "HOME_SECONDARY", "CHECKOUT_TOP"
  active    Boolean  @default(true)
  order     Int      @default(0) // Orden de aparición en el carrusel
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### B. Colecciones / Vitrinas Personalizadas
Permite agrupar productos bajo un título atractivo sin depender de las categorías estrictas. Ej: "Los más elegidos para Running", "Lanzamientos Exclusivos".

```prisma
model Collection {
  id          String    @id @default(uuid())
  title       String    // Ej: "Novedades Puma"
  slug        String    @unique // "novedades-puma"
  description String?
  active      Boolean   @default(true)
  order       Int       @default(0) // Orden de visualización en la Home
  
  // Relación N:M implícita o explícita con Product
  products    Product[] @relation("CollectionProducts")
}
```

### C. Motor Automático de Promociones (Reglas de Descuento)
Esencial para aplicar descuentos temporales masivos sin tener que cambiar el precio de cada zapatilla manualmente. El carrito de compras (E-commerce) consultará estas reglas activas.

```prisma
model GlobalPromotion {
  id            String    @id @default(uuid())
  name          String    // Ej: "Especial Fin de Semana 20% OFF"
  description   String?
  type          String    // "PERCENTAGE" o "FIXED_AMOUNT"
  value         Decimal   @db.Decimal(12, 2) // Ej: 20 para 20%
  
  // Condiciones y Filtros (Si son nulos, aplica a toda la tienda)
  brandId       String?   // Si se llena, aplica solo a "Nike"
  categoryId    String?   // Si se llena, aplica solo a "Calzado"
  minCartValue  Decimal?  @db.Decimal(12, 2) // Condición de monto mínimo de compra
  
  // Ventana de Tiempo (Vigencia programada)
  startDate     DateTime
  endDate       DateTime?
  
  active        Boolean   @default(true)
}
```

---

## 3. Experiencia de Administración (UI)

Dentro de la ruta `src/app/admin/`, se añadirá un menú lateral llamado **"Gestión Web"** con 3 subsecciones:

1. **Banners Promocionales:** Un CRUD simple donde el administrador sube la imagen (arrastrar y soltar), pega un link y lo activa/desactiva.
2. **Vitrinas de Inicio:** El usuario crea una nueva Colección, y un buscador inteligente le permite buscar y agregar productos (`ProductVariant`) que ya existen en el sistema.
3. **Reglas de Descuento:** Un formulario donde se programa un descuento (ej. "Empieza el Viernes a las 00:00 y termina el Lunes").

---

## 4. Impacto en el E-commerce (Frontend Web)

* **Server-Side Rendering (SSR):** La página principal (`/`) de la tienda web leerá los Banners y Colecciones activas directamente de la base de datos utilizando React Server Components. Si el dueño desactiva un banner desde el panel, desaparecerá de la web al instante (o al revalidar la caché ISR).
* **Cálculo de Precios Dinámico:** El carrito de compras iterará sobre los productos agregados. Antes de mostrar el total, consultará la tabla `GlobalPromotion` para ver si la fecha actual cae dentro de una promoción activa y calculará el descuento correspondiente ("Precio Original Tachado -> Precio Promo"), fundamental para gatillar la compra.
