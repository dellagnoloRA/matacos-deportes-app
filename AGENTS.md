# AGENTS.md — Directivas Maestras para Agentes de IA
## Proyecto: Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes
**Cliente:** Matacos Deportes (Saavedra 241, Formosa Capital, Argentina)  
**Institución:** Universidad de la Cuenca del Plata (Sede Formosa) — Práctica Profesional Supervisada I (PPS I)  

---

## 1. Equipo de Desarrollo y Asignación de Roles

* **Dellagnolo, Ricardo Agustín:** Líder de Proyecto / Backend Developer (Arquitectura, Docker, PostgreSQL/Prisma, APIs de integración y sincronización).
* **Fornari, Nahir Agustín:** Backend Developer / Analista Funcional (Lógica de inventario, reglas de stock, Server Actions, cálculo de ventas y arqueo de caja).
* **Bordón Sbardella, Lourdes Antonella:** Frontend Developer / Diseñadora UI-UX (Maquetación Next.js 15, Tailwind CSS, componentes shadcn/ui, plantillas de tickets/etiquetas).
* **González, Eugenia Milagros:** Frontend Developer / Especialista UI & QA (Manejo de estado Zustand, persistencia IndexedDB con Dexie.js, formularios Zod y pruebas).

---

## 2. Stack Tecnológico Estandarizado

* **Package Manager Oficial:** **PNPM** exclusivamente (`pnpm install`, `pnpm dlx`, `pnpm prisma`, `pnpm dev`). Prohibido el uso de `npm` o `yarn`.
* **Frontend:** Next.js 15 (App Router), React 19, TypeScript (modo estricto), Tailwind CSS, shadcn/ui, Lucide Icons.
* **Backend:** Next.js Server Actions y Route Handlers (/app/api), Zod (validaciones compartidas).
* **Base de Datos Principal:** PostgreSQL 16 con Prisma ORM (desplegado localmente con Docker Compose).
* **Modo Offline Mostrador:** IndexedDB administrado con Dexie.js y estado reactivo con Zustand.
* **Hardware & Periféricos:** Lectores de código de barras USB (1D/2D emulación teclado), Impresoras térmicas de tickets (80mm/58mm comandos ESC/POS).
* **Integraciones Externas:** Mercado Pago SDK (Checkout Pro y Webhooks), Facturación AFIP/ARCA (afip.js).
* **Infraestructura:** Docker Compose, Caddy Server (HTTPS automático con Let's Encrypt), VPS Linux.

---

## 3. Principios de Arquitectura y Reglas Críticas

### 1. Enfoque Offline-First en Punto de Venta (POS)
* En el mostrador de Saavedra 241, el sistema **nunca debe bloquearse ante caídas de internet o microcortes**.
* Las ventas en mostrador se persisten inmediatamente en **IndexedDB (Dexie.js)** y se encolan para sincronización en background con PostgreSQL cuando la red esté disponible.
* Toda operación de stock en el servidor debe ejecutarse bajo transacciones atómicas con Prisma (prisma.$transaction) y bloqueo de registros para evitar sobreventas concurrentes con la web.

### 2. Convenciones de Código y Formateo
* **Gestor de Paquetes:** Todo comando de instalación o ejecución de scripts debe utilizar **`pnpm`**.
* **Moneda:** Todos los importes monetarios deben formatearse con `formatCurrency(amount)` en Pesos Argentinos (ARS, formato `$ 45.000,00`).
* **Zona Horaria:** Todas las fechas y cierres de caja deben operar en `America/Argentina/Buenos_Aires`.
* **Tipado Estricto:** Prohibido el uso de `any`. Toda entidad y payload de Server Action debe estar tipado con TypeScript y validado con Zod.
* **Componentes UI:** Utilizar componentes de `shadcn/ui` reutilizables ubicados en `src/components/ui/`.
* **Commits:** Seguir el estándar *Conventional Commits* (`feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`).
* **Control de Commits (Regla Estricta):** El agente de IA **NUNCA** debe ejecutar `git commit` ni `git push` de manera automática. Solo debe realizar commits cuando el usuario lo solicite explícitamente.
