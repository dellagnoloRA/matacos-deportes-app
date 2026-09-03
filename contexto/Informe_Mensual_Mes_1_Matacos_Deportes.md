# Matacos Deportes - Informe Mensual - Mes 1 (Agosto 2026)

**Universidad de la Cuenca del Plata - Sede Formosa**  
**Facultad de Ingeniería, Tecnología y Arquitectura**  
**Carrera:** Licenciatura en Sistemas de Información  
**Cátedra:** Práctica Profesional Supervisada I  
**Docente a Cargo:** Prof. Dr. Cerquand, Cristian Fernando  
**Fecha:** Agosto de 2026  

**Equipo de Trabajo / Alumnos:**
* Dellagnolo, Ricardo Agustín – DNI: 45.817.894
* Fornari, Nahir Agustín – DNI: 46.154.364
* Bordón Sbardella, Lourdes – DNI: [Completar DNI]
* González, Eugenia Milagros – DNI: 46.254.327

---

# 1. Introducción

El presente documento constituye el **Informe Mensual correspondiente al Mes 1 (Agosto 2026)** de la **Práctica Profesional Supervisada I (PPS I)** de la carrera de Licenciatura en Sistemas de Información de la Universidad de la Cuenca del Plata (Sede Formosa). Su propósito fundamental es formalizar la etapa inicial de diagnóstico, elicitación de requerimientos, análisis de dominio y definición de la propuesta tecnológica para el proyecto de desarrollo e implementación del **Sistema Integral Web (E-commerce), Punto de Venta (POS) y Gestión Concurrente de Stock** para el comercio local **Matacos Deportes**.

Matacos Deportes es una tienda tradicional de indumentaria, calzado y accesorios deportivos con más de 25 años de trayectoria ininterrumpida en la ciudad de Formosa. A lo largo de su historia, el negocio ha operado bajo un **esquema 100% analógico**, basando el registro de sus operaciones diarias en cuadernos de ventas manuscritos, control de caja manual y remarcación artesanal de precios producto por producto. Si bien este modelo operativo permitió sostener la actividad comercial a lo largo de las décadas, el crecimiento del volumen de artículos, la dinámica inflacionaria que exige actualizaciones continuas de precios y la necesidad imperiosa de expandir las ventas hacia canales digitales han evidenciado las limitaciones estructurales del enfoque tradicional.

Frente a este escenario, el equipo de trabajo llevó a cabo durante este primer mes un exhaustivo proceso de relevamiento mediante entrevistas en profundidad con los dueños del establecimiento, análisis de procesos operativos actuales (*AS-IS*) y benchmarking de plataformas de comercio electrónico líderes del sector deportivo nacional (Rossetti Deportes y SoloDeportes). A partir de estos insumos, se definieron los objetivos del proyecto, el alcance y los límites del sistema a desarrollar, la metodología incremental de trabajo con Kanban y la especificación detallada de los requerimientos funcionales y no funcionales que guiarán las sucesivas etapas de diseño, arquitectura, desarrollo, pruebas y puesta en producción.

---

# 2. Contexto

## 2.1. Breve Descripción de la Empresa

**Matacos Deportes** es un emprendimiento comercial del rubro deportivo ubicado en la calle **Saavedra 241** de la ciudad de Formosa, Provincia de Formosa, Argentina. Fue fundado en **septiembre del año 1999** por **Sandra Mujica** (comerciante oriunda de Formosa) y su cónyuge **Miguel Ángel Marchi** (arquitecto).

### Origen y Evolución Histórica
El negocio inició sus actividades comerciales originalmente en el Paseo de Compras (calle San Martín, conocido popularmente como "el Mercadito") bajo el nombre de fantasía **"M y M"**, orientado a la indumentaria urbana unisex. Al poco tiempo, y a partir de la experiencia previa de Sandra en comercios deportivos en la ciudad de Resistencia (Chaco), los fundadores identificaron una demanda insatisfecha en la plaza local: mientras las casas de deportes tradicionales de Formosa centraban su oferta casi exclusivamente en el calzado de fútbol, los deportistas, profesores y practicantes de diversas disciplinas carecían de un proveedor local especializado en **accesorios deportivos técnicos** (vendas, bucales, mallas de entrenamiento para natación, medias térmicas, canilleras, rodilleras, artículos de gimnasio y mochilas técnicas como Wilson).

Esta oportunidad impulsó la reconversión del negocio hacia una tienda integral de deportes y su posterior traslado al microcentro formoseño, instalándose primero en calle Saavedra 238 (donde funcionó durante una década) y estableciéndose a partir de 2019 en su local definitivo de **Saavedra 241**.

### Identidad Institucional y Marca
Para diferenciarse de la proliferación de comercios con denominaciones similares a "M y M", los dueños decidieron renombrar el negocio como **"Matacos"**, en homenaje e identificación con las raíces culturales y pueblos originarios de la región del Gran Chaco. La marca se encuentra debidamente registrada como marca comercial. Su identidad gráfica evolucionó desde un logotipo inicial en tonos amarillos con una silueta representativa hacia una paleta centrada en tonalidades **verdes**, asociadas al aire libre, el fitness, la vida sana y las disciplinas de campo.

### Vínculo Comunitario y Diferenciación
A lo largo de su trayectoria de más de 25 años, Matacos Deportes ha superado hitos complejos de la economía provincial y nacional (como la crisis de 2001-2002 con la circulación de bonos provinciales Bocanfor y LECOP). Se ha consolidado como un referente del deporte formoseño, apoyando institucionalmente al Club Náutico Formosa y participando en acciones promocionales con deportistas de trascendencia como la voleibolista internacional formoseña **Mimí Sosa** y la boxeadora **Alejandra "Locomotora" Oliveras**.

El principal valor diferencial del comercio radica en la **atención personalizada y el asesoramiento técnico pre y post-venta brindado directamente por sus dueños**, generando una sólida relación de fidelidad y confianza con la comunidad deportiva local. En la actualidad, su oferta comercial destaca especialmente en accesorios de natación, artículos de entrenamiento y fitness (mancuernas, bandas, colchonetas), indumentaria y calzado recreativo tipo Crocs.

---

## 2.2. Necesidad / Problemática

Pese a su posicionamiento y volumen comercial, Matacos Deportes enfrenta una serie de restricciones y problemáticas operativas derivadas de su funcionamiento analógico:

1. **Inexistencia de una Base de Datos Centralizada y Control de Inventario Ciego:**  
   El comercio carece de un registro digital de su stock (estimado entre 100 y 200 artículos con múltiples variantes de talle y color). El control de existencias se realiza de manera visual o mediante anotaciones parciales en papel, lo que genera desconocimiento del inventario real, dificultades para planificar compras a proveedores y riesgo de quiebres de stock en artículos de alta rotación.

2. **Registro Manual de Ventas y Arqueo de Caja Ineficiente:**  
   Cada venta realizada en el mostrador se anota manualmente en un cuaderno manuscrito. Al finalizar la jornada, el cierre de caja requiere una conciliación artesanal entre el dinero en efectivo del cajón, los cupones de tarjetas/posnet y las transferencias bancarias recibidas, prestando atención minuciosa a las anotaciones del cuaderno. Este proceso es lento, propenso a errores humanos involuntarios y carece de trazabilidad.

3. **Remarcación de Precios Manual frente a la Inflación:**  
   Ante aumentos de listas de proveedores, los precios se actualizan remarcando a mano etiquetas adhesivas pegadas en cada prenda o caja y redactando nuevas listas de papel detrás del mostrador. La falta de un sistema digital unificado retrasa el traslado de costos a precios de venta, impactando negativamente en la rentabilidad del negocio.

4. **Limitación Geográfica y Horaria (Falta de Canal Digital):**  
   Las operaciones comerciales dependen estrictamente de la apertura de las puertas del local físico (horario comercial cortado). El comercio no cuenta con un canal digital transaccional para atender consultas y ventas provenientes de clientes del interior de la provincia de Formosa ni para proyectarse al mercado nacional. Cuando se coordinan ventas por redes sociales (WhatsApp o Instagram), los productos se apartan manualmente en un rincón del mostrador con alto riesgo de que otro vendedor los comercialice presencialmente por falta de sincronización de stock.

5. **Desconexión con Servicios Fiscales y de Hardware:**  
   La emisión de comprobantes fiscales se realiza de forma aislada a través del portal "Comprobantes en Línea" de AFIP/ARCA o controladores fiscales físicos desconectados del registro de ventas, duplicando la carga de trabajo administrativo para los titulares (Responsables Inscriptos).

6. **Vulnerabilidad ante Microcortes de Conectividad y Energía:**  
   El contexto local presenta eventuales interrupciones del servicio eléctrico o caídas temporales de la red de internet en el microcentro de la ciudad. Cualquier solución de software implementada debe ser tolerante a fallos, garantizando que el punto de venta pueda seguir cobrando y emitiendo tickets en mostrador aun cuando no haya conexión a internet (*Offline-First*).

---

# 3. Técnicas de Elicitación

Para llevar a cabo el relevamiento y formalización de requerimientos, el equipo aplicó una combinación de técnicas cualitativas y de ingeniería de software estructuradas en dos ejes: una **Entrevista Estructurada de Dominio** y un **Benchmarking de Sistemas Competidores en Internet**.

## 3.1. Entrevista Estructurada y Cuestionario de Dominio

La técnica principal de elicitación consistió en una **entrevista presencial en profundidad** llevada a cabo el día **miércoles 26 de agosto de 2026** en las instalaciones del local comercial de Saavedra 241.

* **Entrevistadores:** Dellagnolo, Ricardo Agustín y Fornari, Nahir Agustín (Alumnos PPS I).
* **Entrevistados:** Sandra Mujica y Miguel Ángel Marchi (Socios Propietarios de Matacos Deportes).
* **Instrumento:** *Guía de Elicitación de Requerimientos de Matacos Deportes*, organizada formalmente en **7 bloques temáticos**.

A continuación se detalla la **función principal**, la **información esperada** y la **clase de preguntas formuladas** en cada uno de los bloques:

---

### Bloque 0: Historia, Identidad Institucional y Vínculo Comunitario
* **Función del Bloque:** Relevar la identidad corporativa, trayectoria histórica de 25 años, valores de marca y relación comunitaria del negocio, sirviendo como insumo directo para el diseño de la sección institucional *«Quiénes Somos»* de la tienda online y la definición del tono de comunicación de la marca.
* **Información que se esperaba obtener:** Año de fundación, fundadores, evolución de locaciones físicas, motivo cultural de la elección del nombre «Matacos», rediseños del logotipo y colores representativos, superación de crisis socioeconómicas (crisis de 2001 / bonos Bocanfor), vínculo y patrocinio de deportistas destacados (Mimí Sosa, Locomotora Oliveras, Club Náutico) y factores diferenciales de atención personalizada.
* **Clase de Preguntas Formuladas:** Preguntas abiertas cualitativas de reconstrucción histórica e identidad:
  * *¿En qué año abrió sus puertas Matacos Deportes y quiénes fueron sus fundadores?*
  * *¿Cómo y por qué surgió la idea de transicionar de indumentaria urbana a tienda deportiva especializada?*
  * *¿Cuál es el significado detrás del nombre «Matacos» y cómo evolucionó su logotipo y paleta de colores?*
  * *¿Qué momentos marcaron un antes y un después en la trayectoria del negocio y qué deportistas o clubes apoyaron?*
  * *¿Cuál consideran que es su valor diferencial frente a las grandes cadenas comerciales?*

---

### Bloque 1: Diagnóstico Operativo Actual (AS-IS Analógico)
* **Función del Bloque:** Mapear detalladamente los procesos operativos diarios vigentes en el plano manual para comprender cómo se ejecuta el negocio hoy en el papel, identificar cuellos de botella y diseñar interfaces digitales que minimicen la fricción de adopción tecnológica.
* **Información que se esperaba obtener:** Mecánica de registro de ventas en mostrador, procedimiento de arqueo y conciliación de caja al finalizar la jornada, método de consulta y remarcación de precios ante listas de proveedores con aumentos por inflación, y nivel de familiaridad digital del personal a cargo de la atención.
* **Clase de Preguntas Formuladas:** Preguntas cerradas de opción múltiple combinadas con preguntas descriptivas de hábitos de trabajo:
  * *¿Cómo anotan o registran hoy las ventas de mostrador? (Cuaderno manuscrito, talonario, planilla o de memoria).*
  * *¿Cómo realizan el cierre de caja diario y la conciliación entre efectivo, cupones de posnet y transferencias bancarias?*
  * *¿Cómo sabe el vendedor el precio de un artículo cuando un cliente consulta y cómo trasladan los aumentos de precios a los productos?*
  * *¿Qué nivel de manejo con sistemas informáticos tiene el personal y qué dispositivo prefieren físicamente para cobrar en mostrador (PC, Notebook o Tablet)?*

---

### Bloque 2: Catálogo, Inventario Inicial y Reglas de Negocio
* **Función del Bloque:** Dimensionar la magnitud del inventario físico, definir la estructura de datos para variantes de productos (talles, colores, disciplinas) y establecer las reglas comerciales de venta y catalogación.
* **Información que se esperaba obtener:** Estimación de la cantidad de SKUs físicos en el local (estimado en 100–200 productos), existencia de inventarios previos en papel, estrategia planificada para la carga inicial de datos (*onboarding* progresivo por marcas), categorización por disciplinas, variantes de talles (calzado, indumentaria, géneros), disponibilidad de fotografías digitales y políticas de listas de precios (confirmación de política 100% minorista).
* **Clase de Preguntas Formuladas:** Preguntas cuantitativas de dimensionamiento y clasificación de catálogo:
  * *¿Cuántos artículos distintos estiman tener físicamente en el local y cuentan con inventario en papel?*
  * *¿Cómo planifican realizar el primer inventario para alimentar la base de datos inicial (cierre total vs. carga progresiva)?*
  * *¿Cómo organizan las disciplinas deportivas y qué variantes específicas (talles, colores, géneros) maneja cada artículo?*
  * *¿Disponen de fotografías digitales de los productos para la tienda web o se tomarán con celular?*
  * *¿Manejan listas de precios mayoristas, promociones por combos o servicios de personalización/estampado?*

---

### Bloque 3: Operativa del Punto de Venta (POS), Hardware y Stock Concurrente
* **Función del Bloque:** Especificar los requerimientos de hardware del mostrador, evaluar la compatibilidad de códigos de barra y definir las reglas de concurrencia e integridad de inventario entre el local físico y las ventas remotas.
* **Información que se esperaba obtener:** Presencia de códigos EAN-13 de fábrica en la mercadería, necesidad de generar etiquetas térmicas con códigos propios, cantidad de terminales de cobro simultáneas (2 cajas), periféricos a integrar (lectores de código de barras USB, ticketera térmica comandera, cajón portamonedas), procedimiento actual de reserva de prendas por WhatsApp/Instagram y tolerancia mandatoria a cortes de internet (*Modo Offline*).
* **Clase de Preguntas Formuladas:** Preguntas técnicas sobre equipamiento y escenarios de concurrencia de stock:
  * *¿La mercadería comprada a proveedores ya posee código de barras EAN-13 o requieren imprimir etiquetas propias?*
  * *¿Cuántas cajas o terminales simultáneas funcionarán en el local y qué periféricos utilizarán en el puesto de cobro?*
  * *¿Cómo gestionan hoy cuando un cliente pide apartar un producto por redes para evitar que otro vendedor lo venda en mostrador?*
  * *¿Cómo debe comportarse la tienda web cuando un producto se queda sin stock?*
  * *¿Es indispensable que el mostrador pueda seguir cobrando y emitiendo tickets en modo offline ante cortes de internet?*

---

### Bloque 4: Pagos, Facturación, Envíos y Postventa
* **Función del Bloque:** Determinar los flujos monetarios, los métodos de pago aceptados, la situación fiscal ante los entes recaudadores, la logística de entregas y las políticas de postventa y cambios.
* **Información que se esperaba obtener:** Medios de cobro físicos (efectivo, tarjetas vía Posnet, transferencias) y digitales (Mercado Pago, transferencias con comprobante, pago al retirar), límites y promociones en cuotas, condición tributaria (Responsable Inscripto ante AFIP/ARCA), modalidad de comprobantes (Facturas electrónicas A y B con CAE vs comprobantes internos no fiscales), opciones de logística (retiro en local, cadetería en Formosa Capital, Correo Argentino a nivel nacional) y políticas de cambio (sin límite de tiempo con etiqueta, respeto de precio mano a mano frente a inflación y emisión de notas de crédito/vales).
* **Clase de Preguntas Formuladas:** Preguntas de definición impositiva, financiera y logística:
  * *¿Qué medios de pago reciben en el local y cuáles desean habilitar en la web? ¿Aplican recargos o límites de cuotas?*
  * *¿Cuál es su condición fiscal ante AFIP/ARCA y cómo emiten comprobantes actualmente?*
  * *¿El sistema debe emitir Factura Electrónica directa con AFIP/ARCA o comprobantes internos no fiscales?*
  * *¿Manejan cuentas corrientes ("fiados") o señas por trabajos especiales?*
  * *¿Cuáles serán las opciones de envío ofrecidas en la tienda online?*
  * *¿Cómo gestionan los cambios de talle/modelo y qué ocurre frente a aumentos de precios por inflación?*

---

### Bloque 5: Experiencia del Usuario (UX) y Canales de Atención
* **Función del Bloque:** Diseñar la interacción del comprador online con la tienda web para maximizar la facilidad de compra, reducir el abandono de carrito y optimizar la comunicación directa con el comercio.
* **Información que se esperaba obtener:** Preferencia entre registro obligatorio de usuario con contraseña versus compra rápida como invitado (*guest checkout*), canales preferidos para notificación de estados de pedidos (correo electrónico y WhatsApp) y requerimiento de un botón flotante contextual de WhatsApp vinculado al producto visto.
* **Clase de Preguntas Formuladas:** Preguntas de usabilidad y experiencia de cliente:
  * *¿La compra web requerirá registro obligatorio de usuario o se permitirá compra rápida como invitado solicitando solo datos de contacto?*
  * *¿Qué canales de comunicación prefieren para notificar al cliente sobre su compra y estado del pedido?*
  * *¿Desean un botón flotante de WhatsApp en la web que traslade automáticamente el enlace y nombre del producto que el usuario está viendo?*

---

### Bloque 6: Roles de Usuario, Reportes y Plan de Transición
* **Función del Bloque:** Definir los perfiles de acceso y seguridad del sistema, establecer los indicadores clave de rendimiento (KPIs) para la toma de decisiones gerenciales y acordar la estrategia de transición y capacitación del personal.
* **Información que se esperaba obtener:** Jerarquía de roles y permisos (Administrador con acceso a costos/finanzas, Cajero para mostrador y Despacho para catálogo/pedidos), reportes esenciales en el panel de control (totales por medio de pago, alertas de stock mínimo, ranking de más vendidos) y conformidad para implementar un período de marcha blanca de 1 a 2 semanas.
* **Clase de Preguntas Formuladas:** Preguntas de control de acceso, reportería gerencial y gestión del cambio:
  * *¿Qué roles operarán dentro de la plataforma y qué permisos tendrán asignados?*
  * *¿Qué información y reportes métricos necesitan visualizar en el panel de control al final del día o mes?*
  * *¿Están de acuerdo en realizar un período de prueba («marcha blanca») de 1 a 2 semanas donde el nuevo sistema conviva con el método tradicional antes del apagado definitivo del cuaderno?*

---

## 3.2. Análisis de Sistemas en Internet (Benchmarking de Competidores)

Como técnica complementaria de elicitación, se realizó un estudio comparativo y funcional de dos plataformas de referencia en el comercio electrónico deportivo en la República Argentina: **Rossetti Deportes** y **SoloDeportes**.

| Dimensión / Característica | Rossetti Deportes | SoloDeportes |
| :--- | :--- | :--- |
| **Modelo de Navegación** | Jerarquía por disciplina y marca. Enfoque regional multisede. | Búsqueda predictiva avanzada y navegación por filtros faceta. |
| **Ficha de Producto** | Galería responsiva, selector de talle con validación visual. | Guía de talles interactiva con equivalencias en cm (AR/US/EUR). |
| **Gestión de Stock** | Indicador de disponibilidad por sucursal física. | Bloqueo temporal en carrito para evitar sobreventas. |
| **Checkout y Pasarela** | Mercado Pago Checkout Pro y transferencias bancarias. | Checkout transparente con multi-pasarela y cuotas automáticas. |
| **Logística y Entrega** | Retiro en sucursal y convenios con empresas de transporte. | Integración con Correo Argentino y Andreani en tiempo real. |
| **Atención al Cliente** | Widget de contacto estándar. | Botón flotante de WhatsApp contextual al producto visto. |

### Lecciones Aprendidas e Incorporación a Matacos Deportes:
1. **Filtrado por Disciplinas Clave:** Adaptar la taxonomía del catálogo a la realidad de Matacos Deportes, destacando disciplinas de gran salida local (Natación, Vóley, Crocs/Urbano, Gimnasio/Fitness y Calzado/Indumentaria general).
2. **Botón Contextual de WhatsApp:** Implementar un botón directo que traslade automáticamente al chat del vendedor el enlace, nombre y talle del producto que el usuario está consultando en pantalla, reduciendo la fricción para clientes locales.
3. **Flujo de Compra sin Registro Obligatorio (*Guest Checkout*):** Permitir compras ágiles solicitando únicamente datos de contacto y entrega, ideal para compradores esporádicos en redes sociales.
4. **Sincronización de Stock Unificada:** Tomar el principio de consistencia de SoloDeportes para impedir la venta simultánea del mismo producto en mostrador y web mediante bloqueos transaccionales.

---

# 4. Propuesta de Desarrollo

La solución integral propuesta para Matacos Deportes se sustenta en una **Arquitectura de Software Híbrida** diseñada específicamente para responder a dos realidades complementarias del negocio: la necesidad de contar con una tienda web moderna y permanentemente disponible para clientes de todo el país, y la exigencia de disponer de un puesto de cobro físico en mostrador ultra rápido, confiable e inmune a las interrupciones del servicio de internet local.

## 4.1. Explicación Narrativa de la Arquitectura del Sistema

La arquitectura del sistema se organiza conceptualmente en dos grandes entornos operativos interconectados de manera inteligente:

### 1. El Entorno en la Nube (Servidor Cloud / VPS 24/7/365)
En este entorno remoto se despliegan la **Tienda Web E-commerce**, la **API Central del Negocio** y la **Base de Datos Principal**.
* **Disponibilidad Permanente:** Al residir en un centro de datos profesional con suministro eléctrico ininterrumpido y enlaces de fibra óptica de alta velocidad, la tienda online permanece abierta los 365 días del año las 24 horas. Los clientes pueden explorar el catálogo, verificar talles disponibles y comprar calzado o indumentaria durante la noche, feriados o fines de semana, sin depender de que la computadora del local de Saavedra 241 se encuentre encendida.
* **Procesamiento de Pagos y Notificaciones:** La nube aloja los servicios que reciben las notificaciones automáticas (*webhooks*) de Mercado Pago al momento en que un cliente abona por la web o mediante QR, actualizando el estado de la compra de inmediato.
* **Facturación Electrónica:** La API central se comunica directamente con los servidores de AFIP/ARCA para solicitar los Códigos de Autorización Electrónico (CAE) reglamentarios, garantizando que los comprobantes fiscales se emitan de forma transparente y legal.

### 2. El Entorno Local en Mostrador (Local Físico Saavedra 241 - Punto de Venta POS)
En el local físico funcionan dos computadoras portátiles (notebooks) dedicadas a la atención de los clientes presenciales, equipadas con lectores de códigos de barra USB, impresoras térmicas de tickets y cajón portamonedas.
* **Operación Fluida y Ágil:** El Punto de Venta está optimizado para cobrar en cuestión de segundos utilizando atajos de teclado o pasando la pistola lectora sobre la etiqueta del artículo.
* **Modo Sin Conexión (Offline-First):** Cada notebook almacena en su memoria local (a través de la base de datos embebida en el navegador) una copia del inventario y de los precios vigentes. Si se produce un corte en el servicio de internet en la cuadra del local, el sistema no se detiene ni muestra pantallas de error: el cajero puede continuar registrando ventas en efectivo, calculando vueltos y emitiendo tickets normalmente.

### 3. Sincronización Inteligente y Consistencia de Stock
La comunicación entre el mostrador y la nube opera mediante un esquema de sincronización bidireccional automática:
* **En condiciones normales de red:** Cada venta confirmada en el mostrador envía un mensaje instantáneo a la nube para descontar esa unidad del stock disponible en la web. De este modo, si un cliente en el local adquiere el último par de zapatillas de determinado talle, la tienda online lo marca automáticamente como «Agotado» en fracciones de segundo, eliminando por completo el riesgo de sobreventa.
* **Ante un corte de internet:** Las ventas realizadas en el local físico se encolan de manera segura en el almacenamiento local. En cuanto la conexión a internet se restablece, el sistema detecta la red y transmite automáticamente todas las ventas acumuladas hacia la base de datos central sin que el personal deba realizar ninguna acción manual.

---

## 4.2. Alcances del Sistema

El sistema abarcará los siguientes módulos y funcionalidades operativas:

1. **Módulo E-commerce (Tienda Web Pública 24/7):**
   * Catálogo digital completamente responsive para celulares, tablets y computadoras.
   * Filtros dinámicos por disciplina deportiva (Natación, Vóley, Crocs/Urbano, Gimnasio/Fitness), marca, género y talles.
   * Ficha de producto detallada con fotos reales, guía de talles y selector de variantes con disponibilidad en tiempo real.
   * Carrito de compras y proceso de checkout simplificado (compra rápida como invitado o usuario registrado).
   * Pasarela de pagos online integrada con **Mercado Pago** (tarjetas de crédito/débito, dinero en cuenta) y opción de **transferencia bancaria** con carga de comprobante.
   * Botón flotante de WhatsApp que traslada automáticamente al chat del vendedor el enlace, nombre y talle exacto que el usuario está consultando en pantalla.
   * Opciones de entrega: Retiro gratuito en el local (Saavedra 241), cadetería local en Formosa Capital y envíos a todo el país mediante **Correo Argentino** y encomiendas.

2. **Módulo Punto de Venta (POS Mostrador):**
   * Interfaz de cobro rápido optimizada para 2 terminales tipo notebook.
   * Búsqueda instantánea de artículos mediante **lector de código de barras (EAN-13 e internos)** o buscador de texto/categorías.
   * Cobro multi-método: Efectivo (con cálculo automático de vuelto), tarjetas de débito/crédito vía Posnet, transferencias bancarias y QR.
   * Emisión e impresión rápida de tickets térmicos comanderas (58mm / 80mm).
   * Disparo de apertura automática del cajón de dinero al confirmar cobranzas en efectivo.
   * Apertura, arqueo y cierre diario de caja con conciliación automática de importes por medio de pago.
   * **Modo Offline-First:** Continuidad operativa de cobro y emisión de comprobantes locales ante interrupciones de internet, con sincronización automática en cola.

3. **Módulo de Gestión de Inventario y Stock Concurrente:**
   * Catálogo centralizado con variantes (Disciplina → Producto → Talle / Color / Código de Barra / SKU).
   * Asistente de carga inicial progresiva por marcas o categorías para facilitar el *onboarding*.
   * Actualización centralizada de precios de costo y precios de venta minorista.
   * Generador e impresión de etiquetas con código de barras propio para prendas sin código de fábrica.
   * Bloqueo transaccional de stock para evitar sobreventas entre mostrador y web.
   * Alertas automáticas de stock crítico y productos agotados.

4. **Módulo de Facturación y Comprobantes:**
   * Conexión con los Web Services de **AFIP / ARCA** para la emisión de Facturas Electrónicas Tipo A y B con obtención automática de CAE.
   * Posibilidad de emitir comprobantes internos no fiscales (tickets de control o presupuestos de mostrador).
   * Emisión de Notas de Crédito / Vales de compra para cambios y devoluciones sin reintegro de dinero en efectivo.

5. **Módulo de Administración, Seguridad y Reportes (Dashboard):**
   * Control de acceso basado en roles (RBAC): Administrador (acceso total a costos y finanzas), Cajero (ventas de mostrador) y Operador de Despacho (catálogo y pedidos web).
   * Reportes gerenciales: Total facturado por medio de pago, ranking de productos y disciplinas más vendidas.
   * Gestión de estados de pedidos online («Pendiente», «Pagado», «Empaquetado», «Enviado», «Entregado»).

---

## 4.3. Límites del Sistema

Para delimitar con precisión el alcance del proyecto dentro del marco de la PPS I, se establecen las siguientes exclusiones:

1. **Sin Gestión de Cuentas Corrientes ni Fiados:** El sistema no contempla ventas a plazo ni registro de deuda de clientes, dado que la política comercial de Matacos Deportes es 100% minorista al contado o tarjeta.
2. **Sin Módulo de Fabricación o Personalización Textil:** No se contemplan procesos de corte, confección ni estampado de dorsales/nombres a pedido, ya que el comercio opera exclusivamente con indumentaria terminada provista por fabricantes.
3. **Sin Contabilidad General ni Liquidación de Sueldos:** El sistema no es un ERP contable integral; no confecciona balances generales, libros IVA Digital ni liquidación de haberes de empleados.
4. **Sin Aplicación Móvil Nativa para Tiendas de Apps:** La solución se desarrollará como una aplicación web responsive y PWA, sin generar aplicaciones empaquetadas para Apple App Store o Google Play Store.

---

# 5. Objetivos

## 5.1. Objetivo General

**Diseñar, desarrollar e implementar un Sistema Web Integral, Punto de Venta (POS) y Gestión Concurrente de Inventario con capacidades offline para el comercio "Matacos Deportes", permitiendo modernizar y automatizar sus procesos de venta de mostrador, centralizar el control de stock en tiempo real y expandir su alcance comercial hacia el mercado digital local, provincial y nacional.**

---

## 5.2. Objetivos Específicos

1. **Relevar, formalizar y validar los requerimientos de software** a partir de entrevistas en profundidad y del análisis del modelo operativo analógico actual (*AS-IS*) de Matacos Deportes.
2. **Diseñar una arquitectura de software híbrida y modular** que garantice la disponibilidad ininterrumpida de la tienda web en la nube y la operatividad tolerante a cortes de internet en el mostrador del local físico (*Offline-First*).
3. **Desarrollar la interfaz del Punto de Venta (POS)** optimizada para dos terminales tipo notebook, con soporte para lectura de códigos de barra, cobro multiforma de pago, apertura de cajón de dinero e impresión de tickets térmicos.
4. **Desarrollar la tienda web e-commerce** con diseño responsive, navegación por disciplinas, catálogo con variantes (talle/color), pasarela de pagos con Mercado Pago y canal de asistencia directa vía WhatsApp.
5. **Implementar un mecanismo de control de stock concurrente y transaccional** para sincronizar en tiempo real el inventario entre el local físico y la tienda online, evitando sobreventas.
6. **Integrar el módulo de facturación electrónica con los Web Services de AFIP / ARCA** para la generación de Facturas A y B con CAE y la emisión de comprobantes internos y notas de crédito.
7. **Configurar la infraestructura de despliegue en servidor VPS en la nube** utilizando contenedores Docker y Caddy Server con certificados SSL automáticos y copias de seguridad periódicas.
8. **Ejecutar un plan de pruebas integrales, capacitación del personal y marcha blanca (1 a 2 semanas)** para garantizar una transición ordenada del cuaderno manuscrito a la plataforma digital.

---

# 6. Planificación

## 6.1. Metodología de Desarrollo: Enfoque Incremental con Kanban

Para la gestión y ejecución del proyecto se adopta una **metodología de desarrollo incremental apoyada en el marco Kanban**, descartando esquemas rígidos como Scrum que resultan poco prácticos para un equipo de 4 personas.

### Justificación de la Elección
El marco Scrum impone una sobrecarga de ceremonias formales y una división estricta de roles (como Product Owner y Scrum Master dedicados) que en un equipo reducido de cuatro desarrolladores genera burocracia administrativa innecesaria. En contraste, el enfoque **Incremental con Kanban** ofrece:

* **Visualización Clara del Flujo de Trabajo:** Mediante un tablero visual estructurado en columnas (*Por Hacer*, *En Análisis*, *En Desarrollo*, *En Pruebas*, *Completado*), el equipo mantiene visibilidad en tiempo real del estado de cada funcionalidad.
* **Límite de Trabajo en Curso (WIP - Work In Progress):** Se restringe la cantidad de tareas simultáneas que cada miembro puede abordar, reduciendo la multitarea, evitando cuellos de botella y maximizando el rendimiento del equipo.
* **Entregas Incrementales Quincenales:** El software evoluciona a través de incrementos funcionales tangibles cada 15 días, permitiendo validar módulos con los dueños de Matacos Deportes y realizar ajustes rápidos sin fricciones.
* **Flexibilidad Operativa:** Facilita la reasignación de prioridades técnicas de forma natural según los resultados de cada etapa, adaptándose perfectamente al ritmo académico y técnico de la Práctica Profesional Supervisada.

---

## 6.2. Cronograma de Trabajo Quincenal (Incrementos cada 15 días)

El cronograma general del proyecto se estructura a lo largo de 4 meses, dividido en **8 incrementos quincenales (de 15 días cada uno)**, detallando para cada incremento las tareas específicas a desarrollar y su estimación horaria de dedicación:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    CRONOGRAMA DETALLADO POR INCREMENTOS QUINCENALES (15 DÍAS)                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MES 1: DIAGNÓSTICO, ELICITACIÓN Y DEFINICIÓN ARQUITECTÓNICA                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INCREMENTO 1 (Días 1 a 15): Relevamiento Inicial y Diagnóstico AS-IS [Total: 50 hs]              │
│  • Tarea 1.1: Reunión presencial y entrevista de elicitación con dueños del comercio      (15 hs)│
│  • Tarea 1.2: Diagnóstico y mapeo de procesos analógicos actuales (cuaderno/caja/precios) (15 hs)│
│  • Tarea 1.3: Benchmarking de tiendas online deportivas (Rossetti Deportes, SoloDeportes) (10 hs)│
│  • Tarea 1.4: Relevamiento y estimación del inventario físico inicial (100-200 SKUs)      (10 hs)│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INCREMENTO 2 (Días 16 a 30): Especificación Formal y Arquitectura de Software [Total: 50 hs]     │
│  • Tarea 1.5: Especificación formal de Requerimientos Funcionales y No Funcionales        (20 hs)│
│  • Tarea 1.6: Selección y justificación del Stack Tecnológico e infraestructura Cloud     (15 hs)│
│  • Tarea 1.7: Redacción, consolidación y revisión final del Informe Mensual Mes 1         (15 hs)│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MES 2: FUNDACIONES, BASE DE DATOS, GESTIÓN DE STOCK Y VENTAS OFFLINE                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INCREMENTO 3 (Días 31 a 45): Fundaciones, Base de Datos y Gestión de Stock [Total: 60 hs]        │
│  • Tarea 2.1: Configuración del repositorio Git, entorno base Next.js y Docker local      (10 hs)│
│  • Tarea 2.2: Modelado del esquema relacional en PostgreSQL y configuración con Prisma    (15 hs)│
│  • Tarea 2.3: Desarrollo del Módulo de Gestión de Inventario (productos, variantes, stock)(25 hs)│
│  • Tarea 2.4: Implementación de la herramienta de carga inicial progresiva de catálogo   (10 hs)│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INCREMENTO 4 (Días 46 a 60): Punto de Venta (POS) y Ventas en Modo Offline [Total: 70 hs]        │
│  • Tarea 2.5: Desarrollo de la interfaz de cobranza rápida de mostrador para notebooks    (20 hs)│
│  • Tarea 2.6: Integración con lector de código de barras USB e impresora térmica          (15 hs)│
│  • Tarea 2.7: Desarrollo del motor local (IndexedDB) para gestión de ventas sin conexión (20 hs)│
│  • Tarea 2.8: Módulo de apertura, arqueo y cierre de caja diario con soporte offline      (15 hs)│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MES 3: TIENDA E-COMMERCE, CATÁLOGO Y PASARELA DE PAGOS                                           │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INCREMENTO 5 (Días 61 a 75): Catálogo Web E-commerce y Navegación Responsive [Total: 60 hs]     │
│  • Tarea 3.1: Maquetación y diseño de la tienda online pública (Mobile-First)             (20 hs)│
│  • Tarea 3.2: Implementación de filtros dinámicos por disciplina, marca, género y talle   (15 hs)│
│  • Tarea 3.3: Ficha individual de producto con galería de imágenes y selector de variantes(15 hs)│
│  • Tarea 3.4: Integración del botón flotante de WhatsApp contextual al producto navegado  (10 hs)│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INCREMENTO 6 (Días 76 a 90): Carrito de Compras, Checkout y Mercado Pago [Total: 60 hs]          │
│  • Tarea 3.5: Desarrollo del carrito de compras y flujo de compra rápida (Guest Checkout) (20 hs)│
│  • Tarea 3.6: Integración con pasarela Mercado Pago y procesamiento de Webhooks           (20 hs)│
│  • Tarea 3.7: Módulo de pago por transferencia bancaria con carga de comprobante digital  (10 hs)│
│  • Tarea 3.8: Configuración de opciones de entrega (Retiro local, Cadetería, Correo Arg.) (10 hs)│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MES 4: FACTURACIÓN FISCAL, SINCRONIZACIÓN, DESPLIEGUE Y MARCHA BLANCA                            │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INCREMENTO 7 (Días 91 a 105): Facturación AFIP/ARCA, Sincronización y Dashboard [Total: 60 hs]   │
│  • Tarea 4.1: Integración con Web Services AFIP/ARCA (WSAA/WSFE) para Facturas A y B (CAE)(25 hs)│
│  • Tarea 4.2: Sincronización automática de ventas offline y bloqueo de stock concurrente  (20 hs)│
│  • Tarea 4.3: Panel administrativo gerencial y reportes de facturación por medio de pago  (15 hs)│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INCREMENTO 8 (Días 106 a 120): Despliegue en la Nube, Capacitación y Marcha Blanca [Total: 60 hs]│
│  • Tarea 4.4: Despliegue en servidor VPS en la Nube con Docker y Caddy Server (HTTPS)     (15 hs)│
│  • Tarea 4.5: Pruebas integrales de rendimiento, seguridad y políticas de backup          (10 hs)│
│  • Tarea 4.6: Capacitación presencial al personal y dueños en el local de Saavedra 241    (15 hs)│
│  • Tarea 4.7: Período de marcha blanca (1-2 semanas de convivencia con cuaderno) y cierre (20 hs)│
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 7. Recursos

## 7.1. Stack Tecnológico (Explicación Conceptual, Capas y Fuentes Oficiales)

Para garantizar un entendimiento claro y accesible, se detalla a continuación qué es cada tecnología elegida, en qué capa del sistema se utiliza, su valor directo para el negocio y el enlace a su sitio web oficial:

### 1. TypeScript
* **¿Qué es?:** Es un lenguaje de programación desarrollado por Microsoft que amplía JavaScript añadiendo comprobación estricta de tipos de datos. Permite detectar errores de código mientras se está programando, antes de que lleguen a producción.
* **Capa:** Se utiliza de forma unificada tanto en el **Frontend** como en el **Backend**.
* **Valor para el Negocio:** Reduce drásticamente la aparición de fallos inesperados al cobrar o registrar mercadería, garantizando que los datos de precios, cantidades y clientes sean siempre consistentes.
* **Fuente Oficial:** [https://www.typescriptlang.org/](https://www.typescriptlang.org/)

### 2. Next.js 15 (con React 19)
* **¿Qué es?:** Es el entorno de trabajo (*framework*) líder para construir aplicaciones web completas y modernas. Combina la creación de interfaces visuales con la programación de la lógica del servidor en una sola estructura organizada.
* **Capa:** **Frontend** (Tienda E-commerce y Punto de Venta) y **Backend** (Server Actions y rutas de conexión API).
* **Valor para el Negocio:** Hace que la tienda online cargue de forma instantánea en teléfonos celulares y computadoras, lo cual mejora el posicionamiento en Google y evita que los clientes abandonen la compra por demoras.
* **Fuente Oficial:** [https://nextjs.org/](https://nextjs.org/)

### 3. Tailwind CSS
* **¿Qué es?:** Es una herramienta moderna de diseño visual que permite construir estilos y apariencias personalizadas de forma rápida mediante clases utilitarias directas.
* **Capa:** **Frontend** (Diseño y maquetación de pantallas).
* **Valor para el Negocio:** Permite crear una apariencia profesional, limpia y 100% adaptable a pantallas de celulares, notebooks y tablets, alineada a los colores institucionales verdes de Matacos Deportes.
* **Fuente Oficial:** [https://tailwindcss.com/](https://tailwindcss.com/)

### 4. shadcn/ui & Lucide Icons
* **¿Qué es?:** Es una colección de componentes de interfaz reutilizables (botones, ventanas modales, tablas, menús desplegables e iconos) construidos con altos estándares de accesibilidad.
* **Capa:** **Frontend** (Componentes visuales del mostrador y la tienda web).
* **Valor para el Negocio:** Acelera el desarrollo al contar con elementos visuales probados, elegantes y de manejo intuitivo para el personal de mostrador.
* **Fuentes Oficiales:** [https://ui.shadcn.com/](https://ui.shadcn.com/) | [https://lucide.dev/](https://lucide.dev/)

### 5. PostgreSQL 16
* **¿Qué es?:** Es uno de los motores de base de datos relacionales más potentes, seguros y confiables del mundo. Almacena toda la información del comercio (artículos, variantes, precios, clientes, ventas y cierres de caja).
* **Capa:** **Base de Datos / Persistencia Central**.
* **Valor para el Negocio:** Garantiza que las operaciones con dinero y stock sean 100% seguras (cumpliendo con el estándar ACID). Permite bloquear registros de stock momentáneamente para que no se venda la misma prenda al mismo tiempo en el local y en internet.
* **Fuente Oficial:** [https://www.postgresql.org/](https://www.postgresql.org/)

### 6. Prisma ORM
* **¿Qué es?:** Es un puente (*Object-Relational Mapping*) que conecta el código de programación con la base de datos PostgreSQL mediante modelos claros y tipados.
* **Capa:** **Backend / Persistencia**.
* **Valor para el Negocio:** Facilita la creación y actualización segura de tablas de datos, evitando que se pierdan datos durante modificaciones del sistema.
* **Fuente Oficial:** [https://www.prisma.io/](https://www.prisma.io/)

### 7. Zustand & Dexie.js (IndexedDB)
* **¿Qué es?:** Son librerías dedicadas al manejo de memoria en el navegador. Zustand administra el carrito de compras y la venta activa, mientras que Dexie.js gestiona una base de datos local embebida dentro de la propia notebook (*IndexedDB*).
* **Capa:** **Frontend / Persistencia Local del POS**.
* **Valor para el Negocio:** Hacen posible el **Modo Offline**: si se corta internet en el local, la computadora puede seguir cobrando y guardando tickets localmente sin perder ninguna venta.
* **Fuentes Oficiales:** [https://zustand-demo.pmnd.rs/](https://zustand-demo.pmnd.rs/) | [https://dexie.org/](https://dexie.org/)

### 8. Zod
* **¿Qué es?:** Es una librería de validación de datos que revisa que toda información ingresada por un usuario (números de DNI, CUIT, importes, talles, correos) cumpla con el formato correcto antes de ser procesada.
* **Capa:** **Frontend y Backend** (Validación compartida).
* **Valor para el Negocio:** Previene errores humanos al momento de cargar productos o cobrar, impidiendo el ingreso de datos incompletos o corruptos.
* **Fuente Oficial:** [https://zod.dev/](https://zod.dev/)

### 9. Mercado Pago SDK
* **¿Qué es?:** Es el kit oficial de integración de la pasarela de pagos electrónicos más utilizada en Argentina.
* **Capa:** **Integración Externa / Pasarela de Pagos**.
* **Valor para el Negocio:** Permite cobrar en la web con tarjetas de crédito, débito, dinero en cuenta de Mercado Pago y cuotas, confirmando las operaciones automáticamente las 24 horas.
* **Fuente Oficial:** [https://www.mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)

### 10. Web Services AFIP / ARCA (afip.js)
* **¿Qué es?:** Es el módulo que conecta la aplicación con los servidores fiscales de la Agencia de Recaudación y Control Aduanero (ARCA, ex AFIP) para la autorización de comprobantes fiscales.
* **Capa:** **Backend / Integración Fiscal**.
* **Valor para el Negocio:** Automatiza la emisión de Facturas A y B con CAE legal, evitando que los dueños tengan que ingresar manualmente al portal web de AFIP a cargar cada comprobante por separado.
* **Fuentes Oficiales:** [https://www.afip.gob.ar/ws/](https://www.afip.gob.ar/ws/) | [https://afip.js.org/](https://afip.js.org/)

### 11. Docker & Docker Compose
* **¿Qué es?:** Es una plataforma de contenerización que empaqueta todo el software (la aplicación web, la base de datos y sus dependencias) dentro de "contenedores" aislados y estandarizados.
* **Capa:** **Infraestructura y DevOps**.
* **Valor para el Negocio:** Permite que el sistema funcione exactamente igual en las computadoras de desarrollo que en el servidor de internet final, evitando fallos de compatibilidad y facilitando traslados o copias de respaldo.
* **Fuente Oficial:** [https://www.docker.com/](https://www.docker.com/)

### 12. Caddy Server
* **¿Qué es?:** Es un servidor web moderno y proxy inverso que se encarga de recibir las visitas de internet y administrar automáticamente los certificados de seguridad SSL (candado verde HTTPS).
* **Capa:** **Infraestructura / Servidor Web y Seguridad**.
* **Valor para el Negocio:** Otorga navegación 100% segura y encriptada sin costos adicionales por certificados SSL, protegiendo los datos personales y de compras de los clientes.
* **Fuente Oficial:** [https://caddyserver.com/](https://caddyserver.com/)

### 13. Servidor VPS Linux en la Nube (Cloud Hosting)
* **¿Qué es?:** Es un servidor virtual privado alojado en un centro de datos profesional conectado a internet de forma ininterrumpida.
* **Capa:** **Hosting / Infraestructura Global**.
* **Valor para el Negocio:** Mantiene la tienda online activa los 365 días del año sin requerir la compra de costosos servidores físicos para el local, con un ahorro económico superior al 70% frente a un servidor propio.
* **Fuentes de Proveedores Recomendados:** [Hetzner Cloud](https://www.hetzner.com/cloud) | [DigitalOcean](https://www.digitalocean.com/) | [DonWeb Cloud Argentina](https://donweb.com/)

---

## 7.2. Recursos Humanos

El proyecto es ejecutado por el equipo de alumnos de la cátedra de Práctica Profesional Supervisada I de la Universidad de la Cuenca del Plata:

* **Dellagnolo, Ricardo Agustín (DNI: 45.817.894):** Líder de Proyecto / Desarrollador Backend (Arquitectura de software, DevOps, diseño y modelado de base de datos PostgreSQL, APIs centrales y motor de sincronización).
* **Fornari, Nahir Agustín (DNI: 46.154.364):** Desarrollador Backend / Analista Funcional (Lógica de negocio del servidor, servicios de inventario, reglas de stock, transacciones y persistencia).
* **Bordón Sbardella, Lourdes Antonella (DNI: [Completar DNI]):** Desarrolladora Frontend / Diseñadora UI-UX (Diseño y maquetación de interfaces con Next.js/shadcn/ui, pantallas del POS de mostrador y experiencia de usuario).
* **González, Eugenia Milagros (DNI: 46.254.327):** Desarrolladora Frontend / Especialista UI y Pruebas de Interfaz (Componentes visuales, gestión de estado en cliente con Zustand/IndexedDB, formularios validados y pruebas de usabilidad).

**Supervisión Académica:** Prof. Dr. Cerquand, Cristian Fernando (Docente Titular de Cátedra - UCP Sede Formosa).

---

## 7.3. Recursos del Cliente

Para la puesta en marcha e implementación del sistema, **Matacos Deportes** dispone y compromete los siguientes recursos físicos, operativos y de información:

1. **Equipamiento de Hardware en Local (Saavedra 241):**
   * 2 computadoras portátiles (Notebooks) asignadas a los puestos de cobro y caja de mostrador.
   * Lector de códigos de barra USB (emulación de teclado).
   * Impresora térmica comandera de tickets (58mm / 80mm) con conexión USB/Red.
   * Gaveta / cajón de dinero con interfaz de apertura automática vinculada a la impresora de tickets.
   * Conexión a internet mediante enlace de banda ancha comercial.
2. **Insumos de Negocio e Información:**
   * Lista física y digital preliminar del inventario inicial (entre 100 y 200 SKUs con sus talles, colores y precios).
   * Material fotográfico de productos tomado con dispositivos móviles para el catálogo web inicial.
   * Acceso a datos fiscales y credenciales ante AFIP/ARCA (ambiente de homologación y producción) bajo la titularidad de Responsable Inscripto.
   * Cuenta activa en Mercado Pago para la vinculación de credenciales de cobro y recepción de fondos.
3. **Disponibilidad para Capacitación:**
   * Participación activa de Sandra Mujica y Miguel Ángel Marchi en las revisiones periódicas y durante la etapa de marcha blanca (1 a 2 semanas de convivencia del sistema con el método manual).

---

# 8. Requerimientos

## 8.1. Requerimientos Funcionales (RF)

Los requerimientos funcionales especifican el comportamiento y los servicios que el sistema debe proveer, organizados por módulos:

### Módulo 1: Gestión de Catálogo e Inventario
* **RF-01 (Gestión de Productos):** El sistema debe permitir al Administrador dar de alta, modificar, visualizar y dar de baja lógica productos, especificando nombre, descripción, marca, disciplina deportiva, género y precio de costo.
* **RF-02 (Gestión de Variantes de Producto):** El sistema debe permitir definir múltiples variantes por cada producto, combinando talle (calzado o indumentaria), color, código de barras (EAN-13 o interno), SKU y precio de venta.
* **RF-03 (Control de Stock por Variante):** El sistema debe registrar y descontar el stock disponible de cada variante de forma unificada y en tiempo real tanto para ventas de mostrador como para ventas por la web.
* **RF-04 (Carga Inicial y Progresiva de Inventario):** El sistema debe proveer una herramienta para la carga gradual de mercadería por lotes, marcas o disciplinas para facilitar la puesta en marcha inicial del comercio.
* **RF-05 (Generación de Códigos de Barra Propios):** El sistema debe permitir generar e imprimir etiquetas con códigos de barras numéricos para aquellos artículos que ingresen sin código de barras de fábrica.
* **RF-06 (Alertas de Stock Crítico):** El sistema debe emitir alertas automáticas en el panel de control cuando el stock de una variante alcance un umbral mínimo configurable o quede en cero («Agotado»).

### Módulo 2: Punto de Venta (POS Mostrador)
* **RF-07 (Búsqueda Ágil en Mostrador):** El sistema debe permitir ingresar productos a la venta activa mediante lectura con pistola de código de barras o a través de un buscador de texto predictivo por nombre, marca o categoría.
* **RF-08 (Cobro Multi-Método de Pago):** El sistema debe permitir procesar ventas combinando múltiples formas de pago en una misma transacción: Efectivo (con cálculo automático de vuelto), Tarjetas de Débito/Crédito (Posnet), Transferencias Bancarias y Códigos QR.
* **RF-09 (Emisión e Impresión de Tickets de Venta):** El sistema debe emitir comprobantes de venta con formato térmico (58mm / 80mm), detallando fecha, ítems, cantidades, precios unitarios, total, medio de pago y datos del comercio.
* **RF-10 (Apertura de Cajón de Dinero):** El sistema debe disparar la señal de apertura electrónica del cajón portamonedas automáticamente al completarse una venta que involucre pago en efectivo.
* **RF-11 (Apertura, Arqueo y Cierre de Caja):** El sistema debe registrar la apertura de caja con un monto inicial, registrar las ventas del turno y generar el reporte de cierre diario con el desglose totalizado por cada medio de pago.
* **RF-12 (Operación Offline del Mostrador):** El sistema de mostrador debe permitir continuar realizando ventas, cobrando en efectivo y emitiendo tickets locales aun cuando se interrumpa la conexión a internet, encolando las transacciones para su sincronización automática una vez restablecido el enlace.

### Módulo 3: Tienda Web (E-commerce) y Checkout
* **RF-13 (Navegación y Catálogo Público):** El sistema debe exponer un catálogo web responsive y público, con categorización jerárquica por disciplinas (Natación, Vóley, Crocs/Urbano, Gimnasio, etc.), marcas, género y talles.
* **RF-14 (Ficha de Detalle de Producto):** El sistema debe mostrar la ficha individual de cada producto con su galería de imágenes, descripción, guía de talles y selector dinámico de variantes con disponibilidad en tiempo real.
* **RF-15 (Carrito de Compras y Guest Checkout):** El sistema debe permitir a los clientes añadir productos al carrito y concretar la compra como invitados (*guest checkout*) ingresando únicamente datos de contacto y entrega sin requerir creación obligatoria de cuenta.
* **RF-16 (Integración de Pagos con Mercado Pago):** El sistema debe integrar la pasarela de pago de Mercado Pago (Checkout Pro y tarjetas) y procesar webhooks asíncronos para actualizar el estado del pedido a «PAGADO» de forma automática.
* **RF-17 (Pago por Transferencia Bancaria):** El sistema debe permitir al comprador seleccionar transferencia bancaria, mostrando los datos de CBU/Alias del comercio y permitiendo adjuntar el comprobante de pago para su posterior verificación.
* **RF-18 (Botón Contextual de WhatsApp):** El sistema debe incluir un botón flotante de contacto que genere un mensaje de WhatsApp directo hacia el comercio, conteniendo el enlace, nombre y talle del producto navegado.
* **RF-19 (Gestión de Opciones de Envío):** El sistema debe permitir al comprador seleccionar entre Retiro gratuito en Saavedra 241, Cadetería local dentro de Formosa Capital o Envío por Correo Argentino / Encomienda a nivel nacional.

### Módulo 4: Facturación Electrónica y Postventa
* **RF-20 (Emisión de Factura Electrónica AFIP/ARCA):** El sistema debe conectarse con los Web Services de AFIP/ARCA (WSAA/WSFE) para generar Facturas Electrónicas Tipo A y B obteniendo el Código de Autorización Electrónico (CAE) reglamentario.
* **RF-21 (Comprobantes Internos de Control):** El cajero o administrador debe poder elegir al momento del cobro si emite Factura Electrónica fiscal o un ticket interno de control no fiscal.
* **RF-22 (Gestión de Cambios y Notas de Crédito):** El sistema debe permitir procesar cambios de mercadería por mismo producto sin recargo por inflación, o emitir un vale de compra / Nota de Crédito digital en caso de que el cliente no seleccione un producto sustituto en el momento.

### Módulo 5: Administración, Seguridad y Reportes
* **RF-23 (Control de Accesos por Roles - RBAC):** El sistema debe restringir el acceso a las funciones según el rol del usuario autenticado: Administrador (acceso total y costos), Cajero (solo mostrador y cobro) y Operador de Despacho (catálogo y pedidos web).
* **RF-24 (Reportes Gerenciales y Estadísticas):** El sistema debe generar reportes visuales y descargables de volumen de facturación por período, ventas por medio de pago, ranking de artículos y marcas más vendidas.
* **RF-25 (Gestión de Estados de Pedidos Web):** El sistema debe permitir al personal actualizar el estado de los pedidos online («Pendiente», «Pagado», «Empaquetado», «Enviado», «Entregado», «Cancelado») y registrar el número de seguimiento de envío.

---

## 8.2. Requerimientos No Funcionales (RNF)

Los requerimientos no funcionales establecen los criterios de calidad, rendimiento, seguridad y mantenibilidad del sistema:

* **RNF-01 (Disponibilidad y Confiabilidad 24/7):** La plataforma de comercio electrónico y la API central alojadas en la nube deben mantener una disponibilidad mínima garantizada del 99.5% anual, operando de manera continua e independiente de los horarios o cortes de luz del local físico.
* **RNF-02 (Rendimiento y Tiempos de Respuesta):**
  * En el Punto de Venta (POS), la búsqueda de un producto mediante lector de código de barras o texto debe arrojar resultados en menos de 300 milisegundos.
  * La confirmación de una venta y la emisión del ticket térmico no debe demorar más de 1.5 segundos.
  * En la tienda web, el tiempo de carga de las páginas iniciales y del catálogo no debe exceder los 2.0 segundos en conexiones móviles 4G.
* **RNF-03 (Consistencia e Integridad de Datos Transaccional - ACID):** Las operaciones de descuento de stock deben ejecutarse bajo transacciones atómicas y con bloqueo de registros (*row-level locking*) en la base de datos PostgreSQL, asegurando que nunca se produzca sobreventa de una misma unidad entre la web y el mostrador.
* **RNF-04 (Tolerancia a Fallos y Modo Offline-First):** El sistema de mostrador debe garantizar la continuidad operativa de cobro en efectivo ante caídas totales del enlace de internet del local, almacenando de forma segura las ventas en la base local (IndexedDB) y ejecutando la sincronización en segundo plano al restablecerse la red.
* **RNF-05 (Seguridad de la Información y Comunicaciones):**
  * Todas las comunicaciones web y conexiones de API deben viajar encriptadas mediante el protocolo seguro **HTTPS / TLS 1.3** con certificados SSL gestionados por Caddy Server.
  * Las contraseñas de los usuarios deben almacenarse con algoritmos de hashing robustos (*bcrypt* o *Argon2*).
  * Los accesos al panel administrativo deben estar protegidos por tokens de sesión seguros con expiración automática.
* **RNF-06 (Usabilidad y Accesibilidad - UX/UI):**
  * La interfaz del Punto de Venta (POS) debe ser ergonómica, con botones de gran tamaño, alto contraste visual y optimizada para el uso rápido con teclado y atajos rápidos, pensada para personal con baja experiencia tecnológica previa.
  * La tienda online debe ser completamente *Mobile-First*, garantizando una navegación táctil fluida y legible en teléfonos inteligentes.
* **RNF-07 (Mantenibilidad, Portabilidad y Copias de Seguridad):**
  * El código fuente debe estar estructurado bajo una arquitectura modular en TypeScript con tipado estricto, facilitando el mantenimiento evolutivo.
  * Todo el entorno de producción debe estar contenerizado mediante Docker Compose para garantizar portabilidad inmediata entre diferentes proveedores de hosting.
  * El sistema debe programar copias de seguridad (*backups*) automáticas diarias de la base de datos PostgreSQL.

---

# 9. Conclusiones y Próximos Pasos

Durante el transcurso de este primer mes de Práctica Profesional Supervisada I, se alcanzaron satisfactoriamente todos los objetivos propuestos para la etapa de inicio y concepción del proyecto:

1. Se estableció un vínculo institucional sólido con los propietarios de **Matacos Deportes**, logrando una comprensión profunda de su historia, identidad comercial y problemáticas operativas analógicas.
2. Se formalizó la especificación completa de requerimientos funcionales y no funcionales, validando las prioridades de negocio (cobro ágil en mostrador, lector de códigos, modo offline, sincronización de stock y venta web con Mercado Pago y WhatsApp).
3. Se seleccionó y justificó una arquitectura de software híbrida moderna y económicamente viable (Nube para el e-commerce y soporte Offline-First para el POS mostrador).
4. Se adoptó una metodología incremental con Kanban y un cronograma quincenal detallado de 8 incrementos para optimizar el flujo de trabajo del equipo de 4 personas.

### Próximos Pasos para el Mes 2:
* **Incremento 3:** Configuración del repositorio base en Next.js con Docker, modelado relacional en PostgreSQL/Prisma y desarrollo del módulo de Gestión de Inventario y Catálogo con carga progresiva.
* **Incremento 4:** Desarrollo de la interfaz del Punto de Venta (POS) de mostrador, integración de periféricos (lector de código de barras e impresora térmica) e implementación del motor de persistencia local en IndexedDB para **ventas en modo offline** y cierre de caja.
