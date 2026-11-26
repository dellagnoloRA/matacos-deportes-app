# Guía Integral de Despliegue en Producción — Hostinger VPS (KVM 2)
## Arquitectura Cloud Centralizada + POS Mostrador Offline-First (Dexie.js)
**Proyecto:** Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes (Saavedra 241, Formosa Capital)  
**Institución:** Universidad de la Cuenca del Plata (Sede Formosa) — Práctica Profesional Supervisada I (PPS I)  
**Equipo de Desarrollo:** Dellagnolo, Ricardo / Fornari, Nahir / Bordón, Lourdes / González, Eugenia  

---

## 1. Especificaciones del Servidor y Justificación Técnica

Para el despliegue oficial de **Matacos Deportes**, se selecciona el plan **Hostinger VPS KVM 2**, el cual provee la potencia, virtualización y aislamiento necesarios para soportar tanto la tienda online pública como la base de datos transaccional del negocio.

### Ficha Técnica de la Infraestructura en Hostinger
* **Procesador:** 2 Núcleos vCPU con procesadores de alto rendimiento **AMD EPYC** (vital para acelerar la compilación standalone de Next.js 15 y el procesamiento concurrente de PostgreSQL).
* **Memoria RAM:** **8 GB de RAM** (capacidad holgada para PostgreSQL 16 con buffer pools optimizados, la aplicación Next.js y Caddy Server consumiendo < 20 MB).
* **Almacenamiento:** **100 GB SSD NVMe** (lectura/escritura ultra rápida en bus PCIe, minimizando la latencia de I/O en transacciones ACID de Prisma y almacenamiento de backups).
* **Conectividad:** **8 TB de ancho de banda mensual** con puerto de red a **1 Gbps** simétrico y dirección IPv4 pública dedicada.
* **Seguridad y Gestión:** Firewall perimetral administrable desde hPanel, API pública, snapshots de recuperación instantánea y **Dominio gratis por 1 año**.

---

## 2. Arquitectura de Despliegue: Fuente Única de Verdad + Offline-First

El sistema opera bajo el principio de **Base de Datos Centralizada con Terminales Ligeras Resilientes a Fallas**:

```mermaid
flowchart TB
    subgraph Internet ["Acceso Global / Compradores"]
        ClienteWeb["Cliente Web (Móvil / Desktop)"]
        MP["Mercado Pago (Webhooks de Pago)"]
        AFIP["AFIP / ARCA (Web Services Fiscales)"]
    end

    subgraph HostingerVPS ["Hostinger VPS KVM 2 (São Paulo, Brasil - 1 Gbps)"]
        Firewall["Hostinger Firewall (Puertos 22, 80, 443 abiertos)"]
        
        subgraph DockerCompose ["Red Aislada Docker (matacos_network)"]
            Caddy["Caddy Server 2 (Reverse Proxy + SSL Let's Encrypt)"]
            NextApp["Next.js 15 Standalone (E-commerce + POS API)"]
            Postgres[("PostgreSQL 16 (Fuente Única de la Verdad)")]
            
            Caddy -->|Puerto 3000| NextApp
            NextApp -->|Prisma ORM (5432 interno)| Postgres
        end
        
        Firewall -->|HTTPS 443 / HTTP 80| Caddy
    end

    subgraph LocalComercial ["Local Físico (Saavedra 241, Formosa Capital)"]
        T1["Terminal 1 (Notebook Mostrador)"]
        T2["Terminal 2 (Notebook Mostrador)"]
        
        subgraph BrowserTerminal ["Navegador Chrome / Edge (PWA)"]
            DexieLocal[("IndexedDB / Dexie.js (Catálogo local + Cola de ventas)")]
        end
    end

    ClienteWeb -->|https://matacosdeportes.com| Firewall
    MP -->|Webhook IPN / Notification| Firewall
    NextApp <--> AFIP

    T1 -->|1. Con Internet: Operación fluida en tiempo real| Firewall
    T2 -->|1. Con Internet: Operación fluida en tiempo real| Firewall
    T1 -.->|2. Ante Microcorte: Cobro local contingente| DexieLocal
    DexieLocal -.->|3. Al volver la red: Sincronización atómica| NextApp
```

### ¿Por qué este modelo y no bases de datos separadas?
1. **Fuente Única de la Verdad:** Solo existe una instancia central de PostgreSQL 16 en el VPS. Si un cliente compra una prenda por la tienda web, el stock físico se descuenta de forma atómica en el mismo registro que consultan los vendedores en el salón.
2. **Cero Mantenimiento en Mostrador:** Las notebooks de Saavedra 241 no requieren tener Docker ni PostgreSQL instalados en Windows. Operan como clientes web livianos (PWA).
3. **Resiliencia ante Cortes de Fibra Óptica (RF-12):** Si se interrumpe la conexión en Saavedra 241, el mostrador no se bloquea. Gracias a **IndexedDB ([`src/lib/dexie.ts`](file:///C:/Users/della/matacos-deportes-app/src/lib/dexie.ts))**, el cajero sigue escaneando con código de barras USB y cobrando en efectivo. Al regresar la red, las transacciones retenidas se sincronizan de forma idempotente mediante el identificador único `offlineId`.

---

## 3. Configuración Inicial del VPS en Hostinger (Paso a Paso)

### Paso 1: Elección de Data Center y Sistema Operativo
1. Iniciar sesión en el **hPanel de Hostinger**.
2. Al momento de activar el VPS KVM 2, seleccionar la ubicación del centro de datos:
   * **Ubicación Recomendada:** **São Paulo, Brasil**. Al ser el nodo más cercano a Argentina, la latencia de red desde Formosa es de apenas **~35 a 45 ms** (frente a >140 ms si se selecciona EE.UU. o Europa).
3. En la sección de **Sistema Operativo / Plantilla**, seleccionar:
   * **Categoría:** *Aplicaciones / Docker*.
   * **Plantilla oficial:** **Ubuntu 24.04 64bit with Docker**.
   *(Esta plantilla ya viene con el kernel actualizado, Docker Engine y Docker Compose preinstalados y optimizados)*.
4. Establecer una contraseña maestra sólida para el usuario `root` y guardar la **Dirección IP pública** asignada (ejemplo: `185.190.140.25`).

---

### Paso 2: Configuración del Firewall Perimetral de Hostinger (Seguridad Crítica)
Hostinger incluye un firewall perimetral por hardware que filtra los paquetes antes de que toquen el servidor.

1. En el menú lateral del VPS en hPanel, ingresar a **Seguridad -> Firewall**.
2. Crear un nuevo perfil de firewall (ej: `matacos-firewall`) y definir **únicamente** las siguientes reglas de entrada (*Inbound Rules*):

| Prioridad | Protocolo | Puerto | Origen (IP) | Propósito / Servicio |
| :---: | :---: | :---: | :---: | :--- |
| **1** | TCP | `22` | Cualquier IP (o tu IP fija) | Acceso de administración remota por SSH |
| **2** | TCP | `80` | Cualquier IP (`0.0.0.0/0`) | Tráfico web HTTP y emisión de certificados Let's Encrypt |
| **3** | TCP | `443` | Cualquier IP (`0.0.0.0/0`) | Tráfico seguro HTTPS (E-commerce y POS de Mostrador) |

> [!CAUTION]
> **REGLA DE SEGURIDAD ABSOLUTA:** El puerto `5432` (PostgreSQL) y el puerto `3000` (Next.js) **NUNCA DEBEN ABRIRSE EN EL FIREWALL DE HOSTINGER**. La base de datos y la aplicación interna quedan encapsuladas dentro de la red privada virtual de Docker (`matacos_network`). Solo Caddy expone los puertos seguros 80 y 443 al exterior.

---

### Paso 3: Configuración del Dominio Gratuito y DNS
El plan KVM 2 incluye 1 año de dominio gratis (ej. `matacosdeportes.com`):

1. **Reclamar el dominio:** En hPanel -> *Dominios* -> Reclamar dominio gratuito y registrarlo a nombre de la empresa.
2. **Configurar los Registros DNS (Zona DNS):**
   Crear o editar los siguientes registros apuntando a la IP pública del VPS:
   * **Tipo:** `A` | **Nombre:** `@` | **Contenido / Destino:** `IP_DE_TU_VPS` | **TTL:** `300` (5 minutos)
   * **Tipo:** `A` | **Nombre:** `www` | **Contenido / Destino:** `IP_DE_TU_VPS` | **TTL:** `300`
3. *(Opcional para dominio nacional `.com.ar`):* Si se utiliza un dominio gestionado en **NIC Argentina**, delegar los DNS hacia los servidores de Hostinger (`ns1.dns-parking.com` y `ns2.dns-parking.com`) o apuntar directamente el registro A de NIC Argentina a la IP del VPS.

---

## 4. Puesta a Punto del Servidor por SSH

Abre la terminal de tu computadora (PowerShell en Windows o Terminal en Linux/Mac) y conéctate al servidor:

```bash
ssh root@IP_DE_TU_VPS
```

### 4.1. Configurar Memoria SWAP de Respaldo (4 GB en NVMe)
Aunque el servidor dispone de 8 GB de RAM física, configurar un archivo SWAP en el disco NVMe garantiza que los procesos de compilación de Next.js (`docker build`) nunca se detengan por agotamiento repentino de memoria (*Out of Memory*):

```bash
# 1. Crear archivo swap de 4 GB
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 2. Hacer permanente el swap al reiniciar
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# 3. Ajustar la agresividad del swap a valores óptimos para servidores (swappiness = 10)
sysctl vm.swappiness=10
echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf
```

### 4.2. Habilitar el Algoritmo BBR de Google (Acelera la conexión de 1 Gbps)
El algoritmo BBR optimiza la congestión TCP, reduciendo drásticamente la latencia y acelerando la carga de imágenes del catálogo:

```bash
echo "net.core.default_qdisc=fq" | tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" | tee -a /etc/sysctl.conf
sysctl -p
```

---

## 5. Clonación del Repositorio y Despliegue de la Aplicación

### 5.1. Clonar el Código del Proyecto
```bash
cd /opt
git clone https://github.com/dellagnoloRA/matacos-deportes-app.git
cd matacos-deportes-app
```

### 5.2. Crear el Archivo de Variables de Entorno (`.env`)
Crear el archivo de producción con el editor `nano`:

```bash
nano .env
```

Pegar y completar las variables de entorno oficiales del proyecto:

```env
# =========================================================================
# ENTORNO DE PRODUCCIÓN — MATACOS DEPORTES (HOSTINGER VPS)
# =========================================================================
NODE_ENV=production

# Base de Datos PostgreSQL 16 (Interna en Docker)
POSTGRES_USER=matacos_admin
POSTGRES_PASSWORD=Definir_Un_Password_Muy_Seguro_Alfanumerico_2026
POSTGRES_DB=matacos_db
POSTGRES_PORT=5432
DATABASE_URL="postgresql://matacos_admin:Definir_Un_Password_Muy_Seguro_Alfanumerico_2026@postgres:5432/matacos_db?schema=public"

# Autenticación y Sesiones (NextAuth / JWT)
# Generar una clave segura con: openssl rand -base64 32
NEXTAUTH_URL="https://matacosdeportes.com"
NEXTAUTH_SECRET="f6c8d7e9a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a"

# Configuración Regional y Punto de Venta
POS_POINT_OF_SALE="00008"
NEXT_PUBLIC_STORE_NAME="Matacos Deportes"
NEXT_PUBLIC_STORE_ADDRESS="Saavedra 241, Formosa Capital"

# Pasarela de Pagos Mercado Pago (Producción)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-TU_ACCESS_TOKEN_REAL"
MERCADOPAGO_PUBLIC_KEY="APP_USR-TU_PUBLIC_KEY_REAL"

# Facturación Electrónica AFIP / ARCA
AFIP_CUIT="20345678901"
AFIP_PRODUCTION="false" # Cambiar a true cuando se presenten certificados de producción
```
*(Para guardar en nano: presiona `Ctrl + O`, pulsa `Enter` y sal con `Ctrl + X`)*.

---

### 5.3. Configurar el Archivo `Caddyfile` con el Dominio Real
Abrir el archivo [Caddyfile](file:///C:/Users/della/matacos-deportes-app/Caddyfile):

```bash
nano Caddyfile
```

Reemplazar `localhost` por el dominio real registrado:

```caddy
matacosdeportes.com, www.matacosdeportes.com {
    # Redirigir tráfico seguro a la aplicación Next.js
    reverse_proxy app:3000

    # Compresión automática de alto rendimiento
    encode gzip zstd

    # Cabeceras de seguridad
    header {
        X-Robots-Tag "all"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Registro de logs de acceso
    log {
        output file /data/access.log {
            roll_size 10MB
            roll_keep 5
        }
        format console
    }
}
```

---

### 5.4. Construir y Levantar el Sistema con Docker Compose
Ejecutar el comando de construcción y arranque en segundo plano:

```bash
docker compose up -d --build
```

**¿Qué ejecuta Docker automáticamente?**
1. Levanta el contenedor `matacos_postgres` con almacenamiento persistente en el volumen `postgres_data`.
2. Espera a que la base de datos supere el *healthcheck* interno (`pg_isready`).
3. Compila la imagen standalone optimizada de Next.js 15 en `matacos_app`.
4. Levanta `matacos_caddy`, quien negocia de forma transparente el certificado SSL/TLS con *Let's Encrypt* y abre el candado HTTPS.

### 5.5. Aplicar Migraciones de Prisma y Cargar Datos Iniciales
Una vez levantados los contenedores, ejecutar las migraciones pendientes en PostgreSQL:

```bash
# Aplicar migraciones estructurales del esquema relacional
docker compose exec app pnpm prisma migrate deploy

# Opcional: Cargar catálogo inicial de prueba / semillas
docker compose exec app pnpm prisma db seed
```

---

## 6. Automatización de Backups Diarios (Aprovechando los 100 GB NVMe)

Para que los datos de ventas, clientes y stock nunca se pierdan ante ninguna eventualidad, se programa un volcado automático diario a las 03:00 AM (hora argentina):

1. Crear el directorio de copias de seguridad:
   ```bash
   mkdir -p /opt/backups
   ```

2. Abrir el programador de tareas del servidor:
   ```bash
   crontab -e
   ```

3. Agregar la siguiente instrucción al final del archivo:
   ```bash
   # Backup diario de PostgreSQL a las 03:00 AM con rotación de 14 días
   0 3 * * * docker exec matacos_postgres pg_dump -U matacos_admin matacos_db | gzip > /opt/backups/matacos_db_$(date +\%Y\%m\%d).sql.gz && find /opt/backups -name "*.sql.gz" -mtime +14 -delete
   ```

Adicionalmente, desde el **hPanel de Hostinger**, ve a **VPS -> Snapshots** para generar una captura completa del disco NVMe antes de cualquier actualización mayor.

---

## 7. Mantenimiento y Actualizaciones sin Caída de Servicio

Cuando el equipo suba nuevas funcionalidades o correcciones a GitHub:

```bash
# 1. Ingresar a la carpeta del proyecto
cd /opt/matacos-deportes-app

# 2. Descargar los últimos cambios
git pull origin main

# 3. Recompilar y actualizar únicamente el contenedor de la aplicación
docker compose up -d --build app

# 4. Si el cambio incluyó modificaciones en schema.prisma, aplicar la migración:
docker compose exec app pnpm prisma migrate deploy
```
> [!NOTE]
> Este procedimiento actualiza la aplicación web en caliente **sin apagar ni reiniciar PostgreSQL**, preservando la continuidad de la base de datos y de las terminales activas en mostrador.

---

## 8. Configuración de las Terminales de Mostrador en Saavedra 241

En el local comercial de Formosa Capital no se requiere instalar software servidor:

1. Abrir **Google Chrome** o **Microsoft Edge** en las notebooks del mostrador.
2. Ingresar a: `https://matacosdeportes.com/pos`
3. En la barra del navegador, hacer clic en el ícono de **Instalar aplicación (PWA)** para colocar el acceso directo en el Escritorio.
4. **Validación del Modo Offline:**
   * Al cargar la pantalla por primera vez, el sistema descarga automáticamente el catálogo completo a **IndexedDB**.
   * Si se desconecta el cable de red o el Wi-Fi, la interfaz mostrará el distintivo ámbar de **Modo Desconectado**.
   * El cajero puede seguir escaneando con el lector de códigos de barra USB, cobrar en efectivo e imprimir tiques térmicos de 80 mm.
   * Al restablecerse la conexión, el indicador cambiará a verde y las ventas se sincronizarán solas contra el PostgreSQL del VPS.
