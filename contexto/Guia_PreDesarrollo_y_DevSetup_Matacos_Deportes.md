# Guía Maestra: Preparación Pre-Desarrollo y Configuración del Entorno (Dev Setup)
**Proyecto:** Sistema Integral Web, Gestión de Stock y Punto de Venta (POS)  
**Cliente:** Matacos Deportes (Saavedra 241, Formosa, Argentina)  
**Destinatarios:** Equipo de Desarrollo, Líder Técnico y Gestión de Proyecto  
**Fecha:** Agosto 2026  

---

## 📌 Introducción
Este documento reúne todo lo necesario para arrancar el proyecto con bases sólidas, dividiéndose en dos grandes bloques:
1. **Parte 1 (Gestión y Negocio):** Checklist de insumos y acuerdos requeridos antes de programar.
2. **Parte 2 (Técnica / Dev Setup):** Configuración del entorno local del desarrollador, estructura de carpetas y comandos del Día 1.

---

# PARTE 1: Checklist de Preparación Pre-Desarrollo (Negocio y Gestión)

---

### 1️⃣ Paso 1: Entrevista de Elicitación y Acuerdos Comerciales
Realizar la reunión inicial con los dueños de **Matacos Deportes** utilizando el cuestionario de elicitación ([Elicitacion_Requerimientos_Matacos_Deportes.md](file:///C:/Users/della/matacos-deportes/Elicitacion_Requerimientos_Matacos_Deportes.md)).

**Puntos críticos a dejar cerrados:**
* [ ] **Inventario inicial:** ¿Cuántos productos estiman tener y qué estrategia usarán para el conteo? *(Cierre de fin de semana vs. carga progresiva)*.
* [ ] **Códigos de barra:** ¿La mercadería tiene código de fábrica (EAN-13) o se comprará una impresora de etiquetas para generar códigos propios?
* [ ] **Fotografía de catálogo:** ¿Quién se encargará de las fotos de los productos para la web?
* [ ] **Situación impositiva:** ¿Qué condición fiscal tienen ante AFIP/ARCA? *(¿Factura A/B/C automática desde el inicio o ticket interno de mostrador?)*.

---

### 2️⃣ Paso 2: Recopilación de Activos de Marca (*Branding Assets*)
Solicitar al cliente los siguientes archivos en una carpeta compartida de Google Drive:
* [ ] **Logotipo oficial:** En formato vectorial (SVG / AI) o PNG transparente en alta resolución.
* [ ] **Fotografías del local:** Fachada de Saavedra 241, interior del negocio y equipo humano (para la sección *Quiénes Somos*).
* [ ] **Paleta de colores:** Colores institucionales principales y secundarios para configurar Tailwind CSS.
* [ ] **Datos de contacto oficiales:** Número de WhatsApp de atención, correo electrónico y redes sociales.

---

### 3️⃣ Paso 3: Plantilla de Carga de Productos de Prueba (*Seed Data*)
Crear una planilla en Google Sheets o Excel para que el cliente cargue una muestra de **entre 20 y 50 productos reales** con la siguiente estructura de columnas:

| Nombre del Producto | Marca | Disciplina | Talle | Color | Código de Barras (EAN) | Precio Costo | Precio Venta | Stock Inicial |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Zapatillas Gondor | Topper | Running | 41 | Negro | 7791234567890 | $ 35.000 | $ 65.000 | 4 |
| Camiseta Titular | Umbro | Fútbol | L | Azul | 7799876543210 | $ 22.000 | $ 42.000 | 8 |

> 💡 **Objetivo:** Estos productos se utilizarán en el script de prueba (`seed.ts`) para programar y probar el buscador del mostrador y el carrito web con datos 100% reales desde el primer día.

---

### 4️⃣ Paso 4: Tramitar Cuentas y Accesos de Terceros
* [ ] **Mercado Pago Developers:** Crear la aplicación en [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers) para obtener las credenciales de prueba (`TEST-Access-Token` y `TEST-Public-Key`).
* [ ] **Dominio Web:** Gestionar el registro del dominio oficial (ej. `matacosdeportes.com.ar` en NIC Argentina).
* [ ] **AFIP / ARCA (si aplica):** Obtener certificado digital `.crt` y `.key` en el ambiente de homologación (Testing WSFE).
* [ ] **Cuenta en Hosting / VPS:** Crear cuenta en el proveedor de nube elegido (Hetzner, DigitalOcean o DonWeb).

---

### 5️⃣ Paso 5: Tablero de Tareas y Repositorio Git
* [ ] Crear el repositorio oficial en GitHub o GitLab.
* [ ] Invitar a todos los desarrolladores al repositorio con permisos de escritura.
* [ ] Configurar el tablero de tareas (GitHub Projects, Trello o Notion) volcando los 4 Sprints del roadmap:
  * **Sprint 1:** Modelo de datos, Prisma, Docker y Arquitectura base.
  * **Sprint 2:** Pantalla de Punto de Venta (POS mostrador), buscador de códigos y cobros.
  * **Sprint 3:** Tienda Web E-commerce, catálogo con filtros y checkout Mercado Pago.
  * **Sprint 4:** Sincronización atómica de stock, AFIP y despliegue en VPS.

---

# PARTE 2: Configuración Técnica del Entorno de Desarrollo (Dev Setup)

---

### 🛠️ 1. Herramientas y Extensiones del Desarrollador

#### A. Habilitar `pnpm` en el sistema operativo
Node.js incluye la herramienta `corepack` para activar `pnpm` sin instalaciones externas:
```bash
corepack enable
corepack prepare pnpm@latest --activate
```

#### B. Extensiones Imprescindibles para el Editor (VS Code / Cursor / IDE)
1. **Prisma (`Prisma.prisma`):** Autocompletado, resaltado de sintaxis y formateo del archivo `schema.prisma`.
2. **Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`):** Sugerencia en tiempo real de clases CSS.
3. **ESLint (`dbaeumer.vscode-eslint`):** Detección de errores de código y malas prácticas.
4. **Prettier (`esbenp.prettier-vscode`):** Formateador de código automático al guardar (`Ctrl + S`).
5. **Error Lens (`usernamehw.errorlens`):** Muestra los errores de TypeScript directamente en la línea de código.
6. **Docker (`ms-azuretools.vscode-docker`):** Monitoreo visual de contenedores y base de datos.

---

### 📁 2. Estructura Limpia de Carpetas (Clean Architecture)

Organización recomendada dentro de `src/` para Next.js 15 App Router:

```text
matacos-app/
├── prisma/
│   ├── schema.prisma          # Modelo relacional y tablas de la BD
│   └── seed.ts                # Script que puebla la BD con productos de prueba
├── src/
│   ├── app/
│   │   ├── (ecommerce)/       # Rutas públicas de la tienda online
│   │   │   ├── page.tsx       # Home / Inicio
│   │   │   ├── productos/
│   │   │   │   └── [slug]/page.tsx  # Ficha de producto con selector de talles
│   │   │   └── carrito/page.tsx     # Checkout de compra
│   │   ├── (dashboard)/       # Rutas privadas protegidas para el personal
│   │   │   ├── pos/page.tsx   # PANTALLA PRINCIPAL DE COBRO EN MOSTRADOR
│   │   │   ├── stock/page.tsx # Gestión de inventario, variantes y precios
│   │   │   └── caja/page.tsx  # Apertura, arqueo y cierre de caja diaria
│   │   └── api/
│   │       ├── webhooks/
│   │       │   └── mercadopago/route.ts  # Webhook de confirmación de pago
│   │       └── afip/route.ts             # Facturación electrónica
│   ├── components/
│   │   ├── ui/                # Componentes base de shadcn (Button, Dialog, Input, Table)
│   │   ├── pos/               # Componentes de mostrador (BarcodeScanner, TicketModal)
│   │   └── ecommerce/         # Componentes web (ProductCard, Navbar, CartDrawer)
│   ├── lib/
│   │   ├── prisma.ts          # Cliente singleton de base de datos
│   │   ├── mercadopago.ts     # Configuración del SDK de Mercado Pago
│   │   ├── afip.ts            # Cliente de facturación electrónica
│   │   └── utils.ts           # Funciones de formateo (moneda ARS, fechas)
│   ├── server/
│   │   └── actions/           # Server Actions (mutaciones: crearVenta, descontarStock)
│   └── schemas/               # Validaciones Zod compartidas (ProductSchema, SaleSchema)
├── docker-compose.yml         # Contenedores (PostgreSQL 16, App, Caddy)
├── Dockerfile                 # Multi-stage Dockerfile con PNPM
├── .env                       # Variables de entorno locales
└── .env.example               # Plantilla documentada de variables
```

---

### ⚙️ 3. Helpers y Utilidades Clave (`src/lib/utils.ts`)

Configurar las utilidades que todo el equipo utilizará para mantener consistencia:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combinador de clases Tailwind para componentes shadcn
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 1. Formateador oficial a Pesos Argentinos ($ 45.000,00)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

// 2. Formateador de fecha y hora local de Formosa
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}
```

---

### 🚀 4. Flujo de Comandos del "Día 1" (Paso a Paso del Programador)

Cuando el equipo esté listo para inicializar el proyecto:

```bash
# 1. Crear el proyecto Next.js con TypeScript, Tailwind y soporte para src/
pnpm create next-app matacos-app --typescript --tailwind --eslint --app --src-dir

# 2. Entrar a la carpeta del proyecto
cd matacos-app

# 3. Instalar componentes base de shadcn/ui
pnpm dlx shadcn@latest init

# 4. Instalar librerías principales de backend y UI
pnpm add @prisma/client mercadopago zod zustand dexie @tanstack/react-query lucide-react clsx tailwind-merge

# 5. Instalar herramientas de desarrollo
pnpm add -D prisma tsx

# 6. Levantar la base de datos PostgreSQL en Docker
docker compose up -d postgres

# 7. Inicializar Prisma y sincronizar el modelo de datos
pnpm prisma init
# (Definir los modelos en prisma/schema.prisma)
pnpm prisma db push

# 8. Abrir el gestor visual de base de datos en el navegador
pnpm prisma studio
```

---

### 🌱 5. Script de Carga Inicial de Prueba (`prisma/seed.ts`)

Para que el frontend no arranque vacío, configurar un script que cargue productos de prueba automáticamente:

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Cargando productos de prueba para Matacos Deportes...");

  const catCalzado = await prisma.category.upsert({
    where: { name: "Calzado" },
    update: {},
    create: { name: "Calzado", slug: "calzado" },
  });

  await prisma.product.create({
    data: {
      name: "Zapatillas Topper Gondor",
      brand: "Topper",
      discipline: "Running",
      costPrice: 35000,
      price: 65000,
      categoryId: catCalzado.id,
      variants: {
        create: [
          { size: "40", color: "Negro", barcode: "7791234567801", stockLocal: 3, stockWeb: 2 },
          { size: "41", color: "Negro", barcode: "7791234567802", stockLocal: 5, stockWeb: 3 },
          { size: "42", color: "Negro", barcode: "7791234567803", stockLocal: 2, stockWeb: 1 },
        ],
      },
    },
  });

  console.log("¡Seed completado con éxito!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

*Para ejecutar el seed en cualquier momento:*
```bash
pnpm prisma db seed
```

---

## 🌿 6. Convenciones de Git y Trabajo en Equipo

* **Ramas principales:**
  * `main`: Código en producción (estable y testeado).
  * `develop`: Rama de integración donde convergen las nuevas funciones.
  * `feature/nombre-tarea`: Ramas temporales creadas por cada desarrollador (ej. `feature/pos-barcode-scanner`, `feature/cart-checkout-mp`).
* **Mensajes de Commit (Conventional Commits):**
  * `feat: agregar buscador de productos por código de barras en POS`
  * `fix: corregir cálculo de vuelto en pago con efectivo`
  * `style: maquetar tarjeta de producto en catálogo web`
