# Guía de Despliegue en Producción — Hostinger VPS (KVM 2)
## Arquitectura Cloud Centralizada + POS Mostrador Offline-First (Dexie.js)
**Proyecto:** Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes (Saavedra 241, Formosa Capital)  
**Institución:** Universidad de la Cuenca del Plata (Sede Formosa) — Práctica Profesional Supervisada I (PPS I)  
**Equipo de Desarrollo:** Dellagnolo, Ricardo / Fornari, Nahir / Bordón, Lourdes / González, Eugenia  

---

> [!NOTE]
> Este documento representa la **Guía Oficial de Despliegue en la Nube (Producción)** para el servidor de Hostinger VPS KVM 2. La versión sincronizada de trabajo también se encuentra en [`contexto/Guia_Despliegue_Hostinger_VPS_Matacos_Deportes.md`](file:///C:/Users/della/matacos-deportes-app/contexto/Guia_Despliegue_Hostinger_VPS_Matacos_Deportes.md).

---

## 1. Especificaciones del Servidor Hostinger VPS KVM 2

Para el despliegue del sistema completo de **Matacos Deportes**, se utiliza el plan **Hostinger VPS KVM 2**:

* **Procesador:** 2 Núcleos vCPU **AMD EPYC** dedicados de alto rendimiento.
* **Memoria RAM:** **8 GB de RAM** (holgada para PostgreSQL 16, Next.js 15 y Caddy Server).
* **Almacenamiento:** **100 GB SSD NVMe** en bus PCIe de altísima velocidad de I/O.
* **Transferencia y Red:** **8 TB de ancho de banda mensual** sobre interfaz simétrica de **1 Gbps** con IP pública IPv4 fija.
* **Seguridad y Datacenter:** Firewall perimetral en hPanel, Datacenter en **São Paulo (Brasil)** para latencia mínima (<45 ms desde Formosa) y **Dominio gratis por 1 año**.

---

## 2. Arquitectura del Sistema (Fuente Única de Verdad + Offline-First)

```mermaid
flowchart TB
    subgraph Internet ["Clientes en Internet / Proveedores Externos"]
        ClienteWeb["Comprador Online"]
        MP["Mercado Pago (Webhooks)"]
        AFIP["AFIP / ARCA"]
    end

    subgraph HostingerVPS ["Hostinger VPS KVM 2 (São Paulo, Brasil)"]
        Firewall["Firewall hPanel (Puertos 22, 80, 443)"]
        
        subgraph DockerCompose ["Red Interna Docker (matacos_network)"]
            Caddy["Caddy Server (SSL Automático Let's Encrypt)"]
            NextApp["Next.js 15 Standalone (E-commerce + API)"]
            Postgres[("PostgreSQL 16 (Fuente Única de la Verdad)")]
            
            Caddy -->|Puerto 3000| NextApp
            NextApp -->|Prisma ORM (Puerto 5432)| Postgres
        end
        
        Firewall -->|HTTPS 443 / HTTP 80| Caddy
    end

    subgraph LocalComercial ["Local Comercial (Saavedra 241, Formosa)"]
        T1["Terminal 1 (Notebook Mostrador)"]
        T2["Terminal 2 (Notebook Mostrador)"]
        
        subgraph PWA ["Navegador Web Chrome / Edge"]
            DexieLocal[("IndexedDB / Dexie.js (Copia Local Catálogo + Cola Offline)")]
        end
    end

    ClienteWeb -->|https://matacosdeportes.com| Firewall
    MP --> Firewall
    NextApp <--> AFIP

    T1 -->|1. Con Internet: Conexión directa en tiempo real| Firewall
    T2 -->|1. Con Internet: Conexión directa en tiempo real| Firewall
    T1 -.->|2. Ante Microcorte: Cobro local contingente| DexieLocal
    DexieLocal -.->|3. Al volver la red: Sincronización idempotente| NextApp
```

---

## 3. Configuración del VPS en Hostinger (hPanel)

### 3.1. Selección de Data Center y Sistema Operativo
1. Al contratar el VPS KVM 2, elegir la región **São Paulo, Brasil** para lograr la menor latencia de red desde Formosa Capital.
2. Seleccionar la plantilla oficial de sistema operativo: **Ubuntu 24.04 64bit with Docker**.
3. Definir una contraseña maestra para el usuario `root` y anotar la dirección IP pública asignada.

### 3.2. Configuración del Firewall Perimetral de Hostinger
En el hPanel de Hostinger -> **Seguridad -> Firewall**, crear un perfil con las siguientes reglas de entrada (*Inbound Rules*):

* **Puerto 22 (TCP):** Permitido para administración remota por SSH.
* **Puerto 80 (TCP):** Permitido para HTTP y validaciones ACME de Let's Encrypt.
* **Puerto 443 (TCP):** Permitido para navegación y operaciones seguras en HTTPS.
* **Puertos 5432 y 3000:** **CERRADOS / NO EXPUESTOS**. PostgreSQL y la app Next.js se comunican de forma aislada dentro de la red interna de Docker (`matacos_network`).

### 3.3. Configuración del Dominio Gratis y Registros DNS
1. Reclamar el dominio gratuito otorgado por Hostinger (ej: `matacosdeportes.com`).
2. En la Zona DNS del dominio, configurar:
   * **Tipo A:** Host `@` -> IP pública del VPS (TTL: 300 seg).
   * **Tipo A:** Host `www` -> IP pública del VPS (TTL: 300 seg).

---

## 4. Puesta a Punto en el Servidor (SSH)

Conectarse por terminal:
```bash
ssh root@IP_DE_TU_VPS
```

### 4.1. Configuración de Memoria SWAP de Seguridad (4 GB en NVMe)
```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
sysctl vm.swappiness=10
echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf
```

### 4.2. Aceleración de Red con BBR (Google)
```bash
echo "net.core.default_qdisc=fq" | tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" | tee -a /etc/sysctl.conf
sysctl -p
```

---

## 5. Despliegue con Docker Compose

```bash
# 1. Clonar repositorio
cd /opt
git clone https://github.com/dellagnoloRA/matacos-deportes-app.git
cd matacos-deportes-app

# 2. Configurar variables de entorno de producción
cp .env.example .env
nano .env

# 3. Configurar el dominio real en Caddyfile
nano Caddyfile

# 4. Construir y levantar contenedores en segundo plano
docker compose up -d --build

# 5. Aplicar migraciones relacionales con Prisma
docker compose exec app pnpm prisma migrate deploy

# 6. Opcional: Cargar catálogo inicial de prueba
docker compose exec app pnpm prisma db seed
```

---

## 6. Backups Diarios Automatizados

Aprovechando los 100 GB NVMe, programar un dump automático diario de PostgreSQL:

```bash
mkdir -p /opt/backups
crontab -e
```

Agregar la siguiente línea:
```bash
0 3 * * * docker exec matacos_postgres pg_dump -U matacos_admin matacos_db | gzip > /opt/backups/matacos_db_$(date +\%Y\%m\%d).sql.gz && find /opt/backups -name "*.sql.gz" -mtime +14 -delete
```

---

## 7. Actualizaciones Continuas sin Interrupción (Zero Downtime)

Para desplegar nuevas versiones sin reiniciar la base de datos ni afectar las terminales de mostrador:

```bash
cd /opt/matacos-deportes-app
git pull origin main
docker compose up -d --build app
docker compose exec app pnpm prisma migrate deploy
```

---

## 8. Configuración de Terminales en Mostrador (Saavedra 241)

1. En las notebooks de mostrador (Terminal 1 y Terminal 2), abrir Chrome o Edge e ingresar a `https://matacosdeportes.com/pos`.
2. Instalar la aplicación como **PWA** desde la barra de direcciones para tener el icono en el Escritorio.
3. El catálogo se sincroniza automáticamente con **IndexedDB (Dexie.js)**.
4. Si se corta el internet en el local, el sistema activa el **Modo Desconectado** (RF-12), permitiendo continuar cobrando en efectivo e imprimiendo tiques térmicos. Al restablecerse la red, las ventas se sincronizan de forma atómica con el VPS.
