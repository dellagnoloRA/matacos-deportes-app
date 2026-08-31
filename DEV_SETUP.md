# Guía Rápida de Configuración del Entorno de Desarrollo (Dev Setup)

## Proyecto: Matacos Deportes — Sistema Web, POS Offline y Stock

Esta guía permite a cualquier miembro del equipo (**Dellagnolo, Fornari, Bordón, González**) levantar exactamente el mismo entorno de desarrollo en menos de 5 minutos utilizando **PNPM** como gestor de paquetes oficial por seguridad y eficiencia de almacenamiento.

---

## 📋 Requisitos Previos en tu Computadora

1. **Node.js:** Versión 20 LTS o superior ([nodejs.org](https://nodejs.org/)).
2. **PNPM:** Habilitado mediante `corepack` (ver paso abajo).
3. **Docker Desktop:** Instalado y en ejecución ([docker.com](https://www.docker.com/)).
4. **Git:** Instalado y configurado ([git-scm.com](https://git-scm.com/)).
5. **Visual Studio Code / Cursor IDE.**

---

## 🚀 Pasos de Instalación (El Flujo del Día 1)

### 1. Instalar PNPM en tu sistema operativo

La forma más directa y universal de tener PNPM en Windows/macOS/Linux:

```bash
npm install -g pnpm
```

Verifica la instalación con:

```bash
pnpm -v
```

### 2. Clonar el repositorio y entrar a la carpeta

```bash
git clone <URL_DEL_REPOSITORIO>
cd matacos-deportes
```

### 3. Copiar el archivo de variables de entorno

```bash
# En Windows PowerShell o Bash:
cp .env.example .env
```

### 4. Instalar las dependencias de Node con PNPM

```bash
pnpm install
```

### 5. Levantar la base de datos PostgreSQL en Docker

```bash
docker compose up -d postgres
```

*(Esto descarga e inicia PostgreSQL 16 automáticamente en el puerto 5432 sin instalaciones manuales).*

### 6. Sincronizar la base de datos y cargar datos iniciales de prueba

```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

### 7. Iniciar el servidor de desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Configuración del Agente de IA y Skills

Al clonar este repositorio, **todos los miembros del equipo ya tienen configurado el mismo agente de IA**:

1. **Directivas Maestras (`AGENTS.md` y `GEMINI.md`):** El agente conoce automáticamente los roles de Dellagnolo, Fornari, Bordón y González, el uso mandatorio de **`pnpm`**, el stack tecnológico y las reglas de negocio Offline-First.
2. **Skills Compartidas (`.agents/skills/`):** El repositorio incluye las 37 skills de desarrollo (code-review, codebase-design, diagnosing-bugs, tdd, matacos-domain). No necesitas instalar nada extra en tu máquina.
3. **Formateo Automático (`.vscode/`):** Al guardar cualquier archivo (`Ctrl + S`), Prettier y Tailwind CSS formatearán tu código con las mismas reglas que tus compañeros.

---

## Comandos Frecuentes con PNPM

| Comando                                   | Acción                                                |
|:----------------------------------------- |:----------------------------------------------------- |
| `pnpm dev`                                | Inicia Next.js en modo desarrollo                     |
| `pnpm build`                              | Compila la aplicación para producción                 |
| `pnpm add <paquete>`                      | Añade una dependencia al proyecto                     |
| `pnpm add -D <paquete>`                   | Añade una dependencia de desarrollo                   |
| `pnpm dlx shadcn@latest add <componente>` | Añade un componente shadcn/ui (ej. button, dialog)    |
| `docker compose up -d postgres`           | Levanta la base de datos PostgreSQL local             |
| `docker compose down`                     | Detiene los contenedores de Docker                    |
| `pnpm prisma studio`                      | Abre el panel visual de base de datos en el navegador |
| `pnpm prisma migrate dev`                 | Aplica nuevas migraciones de base de datos            |
| `pnpm prisma db seed`                     | Recarga los productos deportivos de prueba            |
