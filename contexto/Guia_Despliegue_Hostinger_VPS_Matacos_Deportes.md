# Guía Práctica de Despliegue en Servidor en la Nube
## Hostinger VPS (KVM) + Docker Compose + Caddy Server (HTTPS)
**Proyecto:** Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes (Saavedra 241, Formosa)  
**Institución:** Universidad de la Cuenca del Plata (Sede Formosa) — Práctica Profesional Supervisada I (PPS I)  
**Equipo de Desarrollo:** Dellagnolo, Ricardo / Fornari, Nahir / Bordón, Lourdes / González, Eugenia  

---

## 1. ¿Por qué elegir Hostinger VPS (KVM) y no Hosting Compartido?

En Hostinger existen dos productos muy diferentes:

| Característica | Hosting Compartido (Web Hosting Tradicional) | Hostinger VPS KVM (Recomendado) |
| :--- | :--- | :--- |
| **Apto para este Proyecto** | ❌ **NO APTO** | ✅ **100% RECOMENDADO** |
| **Destinado a** | Sitios básicos en WordPress / PHP estático | Aplicaciones modernas (Next.js 15, React 19) |
| **Soporte de Docker** | No disponible | **Nativo y preinstalado de fábrica** |
| **Base de Datos** | MySQL compartido limitado | **PostgreSQL 16 dedicado y de alto rendimiento** |
| **Procesos en Background** | Se suspenden o bloquean por inactividad | **Ejecución 24/7/365 ininterrumpida** |
| **Costo Aproximado** | ~$3 a $5 USD / mes | **~$5 a $6 USD / mes (Plan KVM 1 o KVM 2)** |

> **Conclusión:** Para que la base de datos PostgreSQL, el motor de sincronización de stock y la tienda Next.js funcionen sin fallas, se debe contratar el plan **Hostinger VPS KVM**.

---

## 2. ¿Qué rol cumple Caddy Server dentro de Hostinger?

**Hostinger y Caddy no compiten, sino que trabajan juntos:**

* **Hostinger:** Es la empresa proveedora de la infraestructura (la computadora virtual en la nube y el enlace de fibra óptica).
* **Caddy Server:** Es el servidor web ultra-liviano que corre **dentro del VPS de Hostinger** para atender a los clientes que visitan la web:
  1. **Certificado SSL / HTTPS 100% Automático:** Se conecta con *Let's Encrypt* de forma transparente, obtiene el candado verde de seguridad para `matacosdeportes.com.ar` y **lo renueva automáticamente de por vida sin costo**.
  2. **Proxy Inverso:** Recibe el tráfico seguro en el puerto `443 (HTTPS)` y lo deriva internamente a Next.js (puerto `3000`) sin exponer puertos inseguros.
  3. **Seguridad y Blindaje:** Protege la base de datos PostgreSQL de accesos no autorizados desde internet.
  4. **Ultra Eficiente:** Consume apenas **15 MB de memoria RAM** (mucho más ligero y fácil de administrar que Apache o Nginx).

---

## 3. Paso a Paso: Cómo Desplegar la Web en Hostinger VPS (Menos de 10 Minutos)

Gracias a la arquitectura basada en **Docker Compose**, todo el sistema está paquetizado y listo para correr con 5 pasos simples:

```mermaid
flowchart LR
    A["1. Hostinger:<br>Plantilla Docker"] --> B["2. Conexión SSH:<br>git clone"]
    B --> C["3. Variables:<br>Configurar .env"]
    C --> D["4. Despliegue:<br>docker compose up -d"]
    D --> E["✅ SISTEMA ONLINE<br>con HTTPS"]
```

---

### Paso 1: Configurar el VPS en Hostinger (1 minuto)
1. Al contratar el plan **VPS KVM** en Hostinger, el asistente te pedirá seleccionar el sistema operativo.
2. Elige la plantilla oficial: **"Ubuntu 24.04 64bit with Docker"**.
3. Define una contraseña segura de acceso `root`.
4. Hostinger te entregará una **Dirección IP pública** (ejemplo: `185.190.140.25`).

---

### Paso 2: Conectarte al Servidor por SSH (30 segundos)
Abre la terminal de tu computadora (PowerShell en Windows, Terminal en Mac/Linux) y escribe:

```bash
ssh root@IP_DE_TU_VPS
```
*(Ingresas la contraseña de root que configuraste en Hostinger).*

---

### Paso 3: Clonar el Repositorio de GitHub (1 minuto)
Dentro del servidor, descarga el código del proyecto:

```bash
git clone https://github.com/dellagnoloRA/matacos-deportes-app.git
cd matacos-deportes-app
```

---

### Paso 4: Configurar las Variables de Entorno de Producción (2 minutos)
Copia la plantilla y edita los valores con el editor `nano`:

```bash
cp .env.example .env
nano .env
```

Configura tus credenciales reales:
* `DATABASE_URL="postgresql://matacos_admin:TU_PASSWORD_SUPER_SEGURA@postgres:5432/matacos_db?schema=public"`
* `NEXT_PUBLIC_APP_URL="https://tudominio.com.ar"`
* `MP_ACCESS_TOKEN="TU_TOKEN_MERCADO_PAGO"`

*(Para guardar en nano: presiona `Ctrl + O`, luego `Enter` y sal con `Ctrl + X`).*

---

### Paso 5: Levantar Todo el Sistema con 1 Solo Comando (3 minutos)
Ejecuta:

```bash
docker compose up -d --build
```

**¿Qué hace Docker automáticamente?**
1. Descarga y levanta el contenedor de **PostgreSQL 16**.
2. Compila la aplicación de **Next.js 15** con TypeScript y Tailwind.
3. Levanta **Caddy Server**, tramita el certificado SSL con Let's Encrypt y activa el protocolo HTTPS.

A continuación, aplica las migraciones y carga los datos de prueba:
```bash
docker compose exec app pnpm prisma migrate deploy
docker compose exec app pnpm prisma db seed
```

**¡Listo! La web, el catálogo y la base de datos ya están 100% operativos en internet.**

---

## 4. ¿Cómo Vincular el Dominio de Matacos Deportes?

Si compran el dominio en **NIC Argentina (.com.ar)** o en **Hostinger (.com)**:

1. Ve al panel de control de tu dominio (DNS).
2. Agrega dos registros de tipo **A**:
   * **Host:** `@` | **Tipo:** `A` | **Valor / Destino:** `IP_DE_TU_VPS`
   * **Host:** `www` | **Tipo:** `A` | **Valor / Destino:** `IP_DE_TU_VPS`
3. En el archivo `Caddyfile` de tu proyecto, pon el nombre del dominio:
   ```caddy
   matacosdeportes.com.ar, www.matacosdeportes.com.ar {
       reverse_proxy app:3000
   }
   ```
4. Caddy se encargará de todo el resto automáticamente.

---

## 5. Mantenimiento y Actualizaciones Futuras

### Para actualizar la web cuando suban cambios a GitHub (30 segundos):
```bash
cd matacos-deportes-app
git pull origin main
docker compose up -d --build app
```
*(Este comando compila la nueva versión sin apagar la base de datos ni provocar caídas en el servicio).*

### Para ver el estado de los servicios:
```bash
docker compose ps
```

### Para ver los logs en tiempo real si surge una duda:
```bash
docker compose logs -f app
```

---

## 6. Resumen de Costos y Recursos

* **Servidor en la Nube:** Hostinger VPS KVM 1 / KVM 2 (~$5 a $7 USD / mes).
* **Certificados SSL (HTTPS):** **$0 USD** (Gratis e ilimitado con Caddy + Let's Encrypt).
* **Motor de Base de Datos:** **$0 USD** (PostgreSQL 16 Open Source en Docker).
* **Disponibilidad:** **24 horas al día, los 365 días del año**, inmune a cortes de luz o de internet en el local de Saavedra 241.
