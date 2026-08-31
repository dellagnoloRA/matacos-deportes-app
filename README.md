# Matacos Deportes — Sistema Integral de Gestión, POS Offline y E-commerce

[![Next.js 15](https://img.shields.io/badge/Next.js-15.x-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.x-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Package Manager](https://img.shields.io/badge/PNPM-Official-orange?logo=pnpm)](https://pnpm.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

Sistema desarrollado para **Matacos Deportes** (Saavedra 241, Formosa Capital, Argentina) en el marco de la **Práctica Profesional Supervisada I (PPS I)** de la carrera de Licenciatura en Sistemas de Información — **Universidad de la Cuenca del Plata (Sede Formosa)**.

---

## 👥 Equipo de Desarrollo y Asignación de Roles

* **Dellagnolo, Ricardo Agustín:** Líder de Proyecto / Desarrollador Backend *(Arquitectura, Docker, PostgreSQL/Prisma, APIs y Sincronización)*.
* **Fornari, Nahir Agustín:** Desarrollador Backend / Analista Funcional *(Lógica de inventario, reglas de stock, Server Actions y cálculo de ventas/arqueo)*.
* **Bordón Sbardella, Lourdes Antonella:** Desarrolladora Frontend / Diseñadora UI-UX *(Maquetación Next.js 15, Tailwind CSS, shadcn/ui, plantillas de tickets/etiquetas)*.
* **González, Eugenia Milagros:** Desarrolladora Frontend / Especialista UI & QA *(Estado con Zustand, persistencia IndexedDB con Dexie.js, formularios Zod y pruebas)*.

**Supervisión Académica:** Prof. Dr. Cerquand, Cristian Fernando (Docente Titular PPS I).

---

## 🛠️ Stack Tecnológico Oficial

* **Gestor de Paquetes:** **PNPM** (`pnpm install`, `pnpm dlx`, `pnpm prisma`, `pnpm dev`).
* **Frontend:** Next.js 15 (App Router), React 19, TypeScript (modo estricto), Tailwind CSS, componentes `shadcn/ui` y `lucide-react`.
* **Backend:** Next.js Server Actions y Route Handlers (`/app/api`), Zod (validaciones compartidas).
* **Base de Datos Principal:** PostgreSQL 16 con Prisma ORM (desplegado localmente con Docker Compose).
* **Punto de Venta Mostrador (Offline-First):** IndexedDB administrado con **Dexie.js** y estado reactivo con **Zustand**.
* **Infraestructura:** Docker Compose, Caddy Server (HTTPS automático con Let's Encrypt), VPS Linux.

---

## 📋 Requisitos Previos en tu Computadora

Antes de clonar el proyecto, cada desarrollador debe tener instalado en su máquina:

1. **Git:** Para control de versiones ([Descargar Git](https://git-scm.com/)).
2. **Node.js:** Versión **20 LTS o 22 LTS** ([Descargar Node.js](https://nodejs.org/)).
3. **Docker Desktop:** Para ejecutar PostgreSQL 16 localmente ([Descargar Docker](https://www.docker.com/products/docker-desktop/)).
   * *En Windows:* Asegurarse de tener activado el soporte para **WSL 2**.
4. **Visual Studio Code / Cursor IDE:** ([Descargar VS Code](https://code.visualstudio.com/)).

---

## 🧪 ¿Cómo comprobar que tu computadora está lista?

Abre una terminal (PowerShell, Git Bash o Terminal) y ejecuta el siguiente comando de verificación:

```bash
git --version && node -v && docker --version && docker compose version
```

Si todos devuelven su número de versión, tu entorno está listo.

A continuación, instala **PNPM** globalmente (método universal y recomendado):

```bash
npm install -g pnpm
pnpm -v
```

---

## 🚀 Guía de Puesta en Marcha Rápida (Flujo del Desarrollador)

Sigue estos 6 pasos para tener la aplicación y la base de datos funcionando localmente:

### 1. Clonar el repositorio y acceder a la carpeta
```bash
git clone <URL_DEL_REPOSITORIO_GITHUB>
cd matacos-deportes
```

### 2. Crear el archivo de variables de entorno
```bash
# En Windows (PowerShell / CMD) o Linux / macOS:
cp .env.example .env
```

### 3. Instalar las dependencias con PNPM
```bash
pnpm install
```

### 4. Levantar la base de datos PostgreSQL en Docker
```bash
docker compose up -d postgres
```
*(Esto descarga e inicia el contenedor de PostgreSQL 16 en el puerto 5432 con las credenciales de `.env`)*.

### 5. Aplicar migraciones y cargar productos iniciales de prueba
```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

### 6. Iniciar el servidor de desarrollo
```bash
pnpm dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 🤖 Agente de IA y Skills Estandarizadas

El repositorio cuenta con configuración nativa para agentes de Inteligencia Artificial (Antigravity CLI `agy`, Claude Code, Cursor, Copilot):

* **Directivas Maestras (`AGENTS.md` y `GEMINI.md`):** Contienen las directivas del proyecto, la asignación de roles y las reglas de formateo (moneda ARS, zona horaria Formosa, Offline-First).
* **Skills Compartidas (`.agents/skills/`):** Incluye 37 skills de desarrollo y la skill de dominio [`matacos-domain`](file:///.agents/skills/matacos-domain/SKILL.md) que enseña las reglas comerciales al agente.
* **Configuración del Editor (`.vscode/`):** Configura formateo automático con Prettier al guardar (`Ctrl + S`), soporte de Tailwind CSS y validaciones de TypeScript.

---

## 🛠️ Comandos de Uso Frecuente

| Comando | Acción |
| :--- | :--- |
| `pnpm dev` | Inicia el entorno de desarrollo Next.js |
| `pnpm build` | Compila la aplicación para producción |
| `pnpm dlx shadcn@latest add <componente>` | Añade un componente de interfaz shadcn/ui |
| `docker compose up -d postgres` | Levanta el contenedor de PostgreSQL |
| `docker compose down` | Detiene los contenedores de Docker |
| `pnpm prisma studio` | Abre el gestor visual de base de datos en el navegador |
| `pnpm prisma migrate dev` | Crea y aplica migraciones a la base de datos |
| `pnpm prisma db seed` | Recarga los datos iniciales de prueba |

---

## 🌿 Convenciones de Git y Ramas

Para conocer la estrategia completa de trabajo en paralelo, convención de nombres y flujo de Pull Requests, consulta la [**Guía de Estrategia de Ramas (GUIA_DE_RAMAS.md)**](file:///C:/Users/della/matacos-deportes-app/GUIA_DE_RAMAS.md).

* **Rama Principal:** `main` (código estable de producción / entregas de cátedra).
* **Rama de Desarrollo:** `develop` (integración diaria del equipo).
* **Ramas de Funcionalidad:** `feature/fe-<rf>-<tarea>` o `feature/be-<rf>-<tarea>`.
* **Mensajes de Commit (Conventional Commits):**
  * `feat:` Nueva funcionalidad (ej. `feat(pos): agregar buscador de productos por código de barras`).
  * `fix:` Corrección de error (ej. `fix(caja): corregir cálculo de vuelto en cobro en efectivo`).
  * `docs:` Documentación (ej. `docs: actualizar guía de desarrollo por ramas`).
  * `refactor:` Refactorización de código sin cambio de comportamiento.
  * `style:` Formateo, estilos o diseño de interfaz.
