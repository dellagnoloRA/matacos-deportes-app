# Matriz de Riesgo y Hojas de Información de Riesgo — Matacos Deportes
## Práctica Profesional Supervisada I (PPS I) — Universidad de la Cuenca del Plata
**Proyecto:** Sistema Integral de Gestión, POS Offline y E-commerce  
**Establecimiento:** Matacos Deportes (Saavedra 241, Formosa Capital, Argentina)  
**Etapa:** Mes 3 — E-commerce, Sincronización Dual y Seguridad  

---

## 1. Matriz de Priorización de Riesgos

La siguiente tabla presenta la priorización de los riesgos tecnológicos y operacionales identificados durante el Mes 3 del proyecto, ordenados por su nivel de exposición e impacto en la continuidad comercial de Matacos Deportes.

| Prioridad | ID de Riesgo | Título del Riesgo | Probabilidad | Impacto |
| :---: | :---: | :--- | :---: | :---: |
| 1 | **R-01** | Sobreventas concurrentes y quiebre de stock dual por desincronización Mostrador-Web | 75% | Alto |
| 2 | **R-02** | Parálisis operativa en mostrador por cortes de conectividad o energía en Saavedra 241 | 80% | Alto |
| 3 | **R-03** | Bloqueo de facturación electrónica por contingencias en Web Services de AFIP / ARCA | 70% | Alto |
| 4 | **R-04** | Abandono de carritos en el e-commerce por fricción en registro y desconfianza en pagos | 60% | Medio |
| 5 | **R-05** | Vulnerabilidad de privilegios y manipulación no autorizada de precios o stock en salón | 50% | Medio |

---

## 2. Hojas de Información de Riesgo y Plan de Contingencia

A continuación se desarrollan las hojas individuales de información de riesgo conforme a la estructura estandarizada de la cátedra de PPS I (basada en el modelo RMMM / SEI), diseñadas para su copia directa hacia Microsoft Word o informes académicos.

---

### Hoja de Información de Riesgo: R-01

<table border="1" cellpadding="6" cellspacing="0" width="100%">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th colspan="4" align="center"><strong>Hoja de información de riesgo</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="25%"><strong>Riesgo ID:</strong> R-01</td>
      <td width="25%"><strong>Fecha:</strong> 19/10/26</td>
      <td width="25%"><strong>Prob:</strong> 75%</td>
      <td width="25%"><strong>Impacto:</strong> Alto</td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Descripción:</strong><br/>
        La concurrencia entre ventas físicas en el mostrador de Saavedra 241 y compras online simultáneas en el e-commerce puede provocar que se venda la misma unidad de talle y color a dos clientes distintos. Esto generaría quiebres de inventario, cancelaciones forzosas de pedidos web, fricción comercial con reintegros monetarios y pérdida de reputación de la marca.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Refinamiento/Contexto:</strong><br/>
        <strong>Subcondición 1:</strong> Artículos de alta rotación (como zapatillas deportivas o líneas Crocs) poseen bajo stock físico en salón (1 a 3 pares por talle), elevando la probabilidad de colisión transaccional en horarios pico.<br/>
        <strong>Subcondición 2:</strong> Existencia de transacciones no atómicas o latencia en la actualización de la base de datos central PostgreSQL si no se implementa bloqueo de registros a nivel de fila (pessimistic / optimistic locking).<br/>
        <strong>Subcondición 3:</strong> Retención de carritos web sin reserva temporal (stockReserved), permitiendo que un usuario mantenga un artículo en su carrito indefinidamente mientras otro comprador lo abona presencialmente en caja.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Mitigación/monitoreo:</strong><br/>
        1. Implementar transacciones atómicas con Prisma ORM (<code>prisma.$transaction</code>) con bloqueo de fila para decrementos de stock tanto en la Server Action de venta POS como en la de Checkout web.<br/>
        2. Aplicar el mecanismo de reserva temporal (<code>stockReserved</code>) con expiración automática de 15 minutos en el checkout web y para preventas de salón (<code>PRV-XXXX</code>).<br/>
        3. Configurar revalidación bajo demanda (<code>revalidateTag('ecommerce-catalog')</code>) para deshabilitar en tiempo real el botón de compra en la ficha de producto (PDP) cuando el stock disponible llegue a cero.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Manejo/plan de contingencia/disparador:</strong><br/>
        <strong>Plan de contingencia:</strong><br/>
        &bull; Habilitar protocolo de reasignación inmediata de mercadería verificando disponibilidad de talle/color alternativo en depósito secundario o acordando cambio de modelo con el cliente vía WhatsApp en menos de 2 horas.<br/>
        &bull; En caso de rechazo del cliente web, disparar reembolso automático por pasarela de pago (Mercado Pago Refund API) y compensación comercial con cupón de 15% de descuento para su próxima compra.<br/>
        <strong>Disparador:</strong> Notificación de inventario disponible negativo (<code>stockAvailable &lt; 0</code>) en base de datos o colisión de concurrencia registrada en los logs del servidor al confirmar una venta.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Estado actual:</strong><br/>
        19/10/2026: Lógica de <code>stockReserved</code> y verificación atómica de stock implementadas y validadas con 25 pruebas unitarias/integración en RF-14 (<code>checkVariantStock</code>).
      </td>
    </tr>
    <tr>
      <td colspan="2"><strong>Originador:</strong> Analista Funcional (Nahir Fornari)</td>
      <td colspan="2"><strong>Asignado:</strong> Backend Developer (Ricardo Dellagnolo)</td>
    </tr>
  </tbody>
</table>

---

### Hoja de Información de Riesgo: R-02

<table border="1" cellpadding="6" cellspacing="0" width="100%">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th colspan="4" align="center"><strong>Hoja de información de riesgo</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="25%"><strong>Riesgo ID:</strong> R-02</td>
      <td width="25%"><strong>Fecha:</strong> 19/10/26</td>
      <td width="25%"><strong>Prob:</strong> 80%</td>
      <td width="25%"><strong>Impacto:</strong> Alto</td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Descripción:</strong><br/>
        Microcortes o caídas prolongadas del servicio de internet de fibra óptica o cortes de suministro eléctrico en el microcentro de Formosa Capital pueden bloquear la terminal de cobranza y consulta de precios en el mostrador del local, impidiendo la atención presencial, la facturación y la emisión de tickets si el sistema dependiera exclusivamente de la nube.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Refinamiento/Contexto:</strong><br/>
        <strong>Subcondición 1:</strong> La infraestructura de red local en Saavedra 241 experimenta fluctuaciones recurrentes del proveedor de telecomunicaciones local durante jornadas de alta temperatura o tormentas estivales.<br/>
        <strong>Subcondición 2:</strong> Dependencia de peticiones HTTP en tiempo real hacia la API del servidor para validar códigos de barra y calcular subtotales.<br/>
        <strong>Subcondición 3:</strong> Pérdida potencial de transacciones en efectivo si el cajero recurre a anotaciones en papel que luego no concilien con el arqueo ciego diario.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Mitigación/monitoreo:</strong><br/>
        1. Arquitectura Offline-First con IndexedDB y Dexie.js en el cliente web del navegador de las terminales de mostrador y salón.<br/>
        2. Sincronización bidireccional en segundo plano: precarga y cacheo local del catálogo completo de productos con códigos de barra en memoria del navegador al abrir la jornada.<br/>
        3. Cola de operaciones pendientes (sync queue) en IndexedDB que almacena las ventas efectuadas sin conexión y las transmite en lote al restablecerse la red.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Manejo/plan de contingencia/disparador:</strong><br/>
        <strong>Plan de contingencia:</strong><br/>
        &bull; Conmutación automática a modo contingencia offline en el POS: emisión de Comprobantes de Control Interno (Ticket X) numerados localmente en impresora térmica de 80 mm conectada vía USB local.<br/>
        &bull; Enlace de respaldo mediante router con módem 4G/LTE de contingencia para las terminales de punto de venta ante cortes de fibra óptica superiores a 30 minutos.<br/>
        <strong>Disparador:</strong> Detección del evento <code>navigator.onLine === false</code> o fallo de 3 peticiones consecutivas (timeout &gt; 3000 ms) al endpoint de healthcheck de la API.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Estado actual:</strong><br/>
        19/10/2026: Módulo IndexedDB con Dexie.js y encolador de transacciones desarrollado en RF-12; pruebas de desconexión física de cable de red superadas satisfactoriamente.
      </td>
    </tr>
    <tr>
      <td colspan="2"><strong>Originador:</strong> Especialista UI &amp; QA (Eugenia González)</td>
      <td colspan="2"><strong>Asignado:</strong> Frontend Developer / Backend Developer (Eugenia González / Ricardo Dellagnolo)</td>
    </tr>
  </tbody>
</table>

---

### Hoja de Información de Riesgo: R-03

<table border="1" cellpadding="6" cellspacing="0" width="100%">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th colspan="4" align="center"><strong>Hoja de información de riesgo</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="25%"><strong>Riesgo ID:</strong> R-03</td>
      <td width="25%"><strong>Fecha:</strong> 19/10/26</td>
      <td width="25%"><strong>Prob:</strong> 70%</td>
      <td width="25%"><strong>Impacto:</strong> Alto</td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Descripción:</strong><br/>
        La reestructuración institucional de la agencia tributaria nacional (disolución de AFIP y transición a ARCA) ha provocado demoras, cambios normativos en esquemas de autenticación y suspensiones temporales en los servidores de homologación y producción de los Web Services de Facturación Electrónica (WSAA / WSFE). Intentar forzar la emisión online de CAE en cada venta paralizaría el despacho y la entrega de productos en Saavedra 241.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Refinamiento/Contexto:</strong><br/>
        <strong>Subcondición 1:</strong> Los certificados digitales X.509 y autorizaciones fiscales en el entorno de pruebas de ARCA presentan tasas elevadas de error 500 y tiempos de respuesta mayores a 15 segundos.<br/>
        <strong>Subcondición 2:</strong> Exigencia legal de entregar comprobante válido al consumidor final en el acto de compra en el local comercial físico.<br/>
        <strong>Subcondición 3:</strong> Falta de soporte de facturación diferida o asíncrona si el diseño original del sistema pretendía obtener el CAE de manera síncrona durante el checkout.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Mitigación/monitoreo:</strong><br/>
        1. Desacoplamiento de la facturación fiscal: postergación del módulo directo con ARCA para el Mes 4 del proyecto, asegurando previamente la solidez del motor comercial.<br/>
        2. Implementación de Comprobantes de Control Interno (Ticket X de 80 mm) con validez comercial de 30 días para cambios y garantía, permitiendo el normal desenvolvimiento del negocio.<br/>
        3. Diseño de cola asíncrona para facturación por lotes (batch processing), separando la confirmación de la venta del timbrado fiscal ante el organismo recaudador.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Manejo/plan de contingencia/disparador:</strong><br/>
        <strong>Plan de contingencia:</strong><br/>
        &bull; Emisión manual complementaria de Facturas A y B a través del portal web oficial "Comprobantes en Línea" de ARCA para clientes mayoristas o con CUIT que soliciten factura discriminada urgente.<br/>
        &bull; Encolamiento de las ventas de consumidor final para facturación global diaria agrupada una vez estabilizado el servicio fiscal.<br/>
        <strong>Disparador:</strong> Tiempos de respuesta de los Web Services de ARCA superiores a 5.000 ms o recepción de errores de autenticación WSAA en más de 2 llamadas consecutivas.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Estado actual:</strong><br/>
        19/10/2026: Reprogramación formal del cronograma para Mes 4 documentada en el informe de avances; plantillas de Ticket X térmico de 80 mm operativas al 100%.
      </td>
    </tr>
    <tr>
      <td colspan="2"><strong>Originador:</strong> Analista Funcional (Nahir Fornari)</td>
      <td colspan="2"><strong>Asignado:</strong> Líder de Proyecto / Backend Developer (Ricardo Dellagnolo)</td>
    </tr>
  </tbody>
</table>

---

### Hoja de Información de Riesgo: R-04

<table border="1" cellpadding="6" cellspacing="0" width="100%">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th colspan="4" align="center"><strong>Hoja de información de riesgo</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="25%"><strong>Riesgo ID:</strong> R-04</td>
      <td width="25%"><strong>Fecha:</strong> 19/10/26</td>
      <td width="25%"><strong>Prob:</strong> 60%</td>
      <td width="25%"><strong>Impacto:</strong> Medio</td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Descripción:</strong><br/>
        Los compradores de indumentaria deportiva en Formosa y la región norte suelen desistir de compras en línea si se les impone la creación obligatoria de cuentas, confirmación de correos electrónicos con contraseñas complejas o si no encuentran medios de pago familiares o un canal directo para evacuar dudas sobre talles y calces.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Refinamiento/Contexto:</strong><br/>
        <strong>Subcondición 1:</strong> Compradores habituados a transaccionar de manera informal por redes sociales (WhatsApp/Instagram) rechazan formularios extensos de registro tradicional.<br/>
        <strong>Subcondición 2:</strong> Dificultad para calcular el costo y método de entrega (retiro gratuito en Saavedra 241 vs. cadetería local vs. encomienda provincial).<br/>
        <strong>Subcondición 3:</strong> Incertidumbre sobre el talle real de calzado e indumentaria sin una tabla de equivalencias clara en centímetros.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Mitigación/monitoreo:</strong><br/>
        1. Implementación del patrón Guest Checkout (compra directa como invitado) solicitando únicamente 4 campos esenciales (Nombre, Teléfono, DNI, Domicilio/Retiro) sin forzar registro ni contraseña.<br/>
        2. Integración de Checkout Pro de Mercado Pago (tarjetas, transferencias por CVU/alias, dinero en cuenta) garantizando confianza y familiaridad en la pasarela de pago.<br/>
        3. Incorporación de botón flotante interactivo de WhatsApp en la Ficha de Detalle de Producto (PDP) con mensaje precargado que incluye el nombre, talle y variante consultada para asistencia humana inmediata.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Manejo/plan de contingencia/disparador:</strong><br/>
        <strong>Plan de contingencia:</strong><br/>
        &bull; Habilitar opción de "Finalizar pedido por WhatsApp con retiro y pago en mostrador" si el cliente encuentra dificultades al procesar el pago digital.<br/>
        &bull; Enviar recordatorio amistoso vía WhatsApp a las órdenes con estado "Pendiente de Pago" tras 30 minutos de inactividad, ofreciendo ayuda con el medio de pago o cambio de talle.<br/>
        <strong>Disparador:</strong> Tasa de abandono en la pantalla de checkout superior al 65% del total de carritos iniciados en una semana.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Estado actual:</strong><br/>
        19/10/2026: Modelo de Base de Datos actualizado con soporte nativo de Guest Checkout en tabla Sale (<code>customerId = null</code>); botón de consulta WhatsApp operativo en prototipos y maquetación de RF-14.
      </td>
    </tr>
    <tr>
      <td colspan="2"><strong>Originador:</strong> Diseñadora UI-UX (Lourdes Bordón Sbardella)</td>
      <td colspan="2"><strong>Asignado:</strong> Frontend Developer (Lourdes Bordón Sbardella)</td>
    </tr>
  </tbody>
</table>

---

### Hoja de Información de Riesgo: R-05

<table border="1" cellpadding="6" cellspacing="0" width="100%">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th colspan="4" align="center"><strong>Hoja de información de riesgo</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="25%"><strong>Riesgo ID:</strong> R-05</td>
      <td width="25%"><strong>Fecha:</strong> 19/10/26</td>
      <td width="25%"><strong>Prob:</strong> 50%</td>
      <td width="25%"><strong>Impacto:</strong> Medio</td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Descripción:</strong><br/>
        En terminales compartidas o de salón de ventas, personal con perfil de venta podría acceder indebidamente a funciones críticas de administración, modificar precios de venta al público, alterar costos de compra a proveedores o aplicar descuentos arbitrarios fuera de los límites comerciales fijados por la dirección de Matacos Deportes.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Refinamiento/Contexto:</strong><br/>
        <strong>Subcondición 1:</strong> Terminales físicas del salón utilizadas por múltiples vendedoras sin bloqueo de sesión ante inactividad.<br/>
        <strong>Subcondición 2:</strong> Existencia previa de roles rígidos sin granularidad de permisos a nivel de Server Actions.<br/>
        <strong>Subcondición 3:</strong> Falta de registro de auditoría (audit logs) sobre quién modificó un precio o aplicó una bonificación manual en el punto de venta.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Mitigación/monitoreo:</strong><br/>
        1. Modelo RBAC dinámico con Perfiles Jerárquicos y Permisos Atómicos en base de datos (<code>Profile</code>, <code>Permission</code>, <code>ProfilePermission</code>), deshabilitando de raíz rutas protegidas y Server Actions no autorizadas.<br/>
        2. Validación estricta en servidor de márgenes máximos permitidos para descuentos manuales en el mostrador (máximo 10% por vendedor; descuentos mayores requieren PIN supervisor).<br/>
        3. Registro inmutable en cada venta de <code>userId</code> del vendedor/cajero y bloqueo estricto de visualización de <code>costPrice</code> en las interfaces públicas y de salón.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Manejo/plan de contingencia/disparador:</strong><br/>
        <strong>Plan de contingencia:</strong><br/>
        &bull; Bloqueo instantáneo del perfil comprometido desde el panel central de administración por parte de la titular de la empresa.<br/>
        &bull; Reversión automática de listas de precios mediante el histórico de auditoría y revisión forzosa de arqueo de caja con presencia del encargado general.<br/>
        <strong>Disparador:</strong> Detección de intentos de acceso a rutas administrativas (<code>/admin/*</code>) por usuarios con perfil de salón o aplicación de descuentos manuales superiores al umbral autorizado.
      </td>
    </tr>
    <tr>
      <td colspan="4">
        <strong>Estado actual:</strong><br/>
        19/10/2026: Esquema relacional de perfiles jerárquicos y permisos atómicos migrado a PostgreSQL 16 con Prisma; validación de <code>costPrice = 0</code> probada en Server Actions públicas.
      </td>
    </tr>
    <tr>
      <td colspan="2"><strong>Originador:</strong> Backend Developer / Analista Funcional (Nahir Fornari)</td>
      <td colspan="2"><strong>Asignado:</strong> Líder de Proyecto (Ricardo Dellagnolo)</td>
    </tr>
  </tbody>
</table>
