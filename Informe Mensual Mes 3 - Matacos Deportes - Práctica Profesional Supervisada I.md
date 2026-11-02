Informe Mensual Octubre 2026 - Matacos Deportes
Universidad de la Cuenca del Plata - Sede Formosa
Facultad de Ingeniería, Tecnología y Arquitectura
Lic. En Sistemas de Información
Práctica Profesional Supervisada I
Prof. Dr. Cerquand, Cristian Fernando
Octubre del 2026
Alumno:
Dellagnolo, Ricardo Agustín – DNI: 45.817.894
Fornari, Nahir Agustín - DNI: 46.154.364
Bordón Sbardella, Lourdes Antonella - DNI: 42.993.948
González, Eugenia Milagros - DNI: 46.254.327

Introducción
El presente documento constituye el Informe Mensual correspondiente al Mes 3
(Octubre 2026) de la Práctica Profesional Supervisada I (PPS I) de la carrera de
Licenciatura en Sistemas de Información de la Universidad de la Cuenca del Plata (Sede
Formosa).
Ya finalizadas las etapas de análisis inicial, gestión de Stock, Punto de Venta y Caja,
el trabajo para este mes se concentró en los módulos de E-Commerce y Seguridad y
Control de Acceso por Roles.
Para el apartado de E-Commerce, se desarrolló una tienda online a medida para
Matacos Deportes. El propósito general de esta etapa es proyectar y concretar la expansión
del comercio hacia las ventas por internet y envíos a nivel nacional. También se busca
conseguir un sistema donde la operatoria local diaria y las ventas online puedan existir
simultáneamente en un mismo inventario centralizado.
Para el módulo de Seguridad, se implementó un esquema de autenticación y
permisos de usuarios para proteger la información operativa del negocio a ciertos usuarios y
limitar las responsabilidades entre distintos perfiles de trabajo. Estos perfiles pueden ser
creados a medida por los denominados ‘administradores’ del sistema. Cada perfil tendrá sus
propios permisos como modificar precios y catálogo, consultar stock, ver tickets creados en
la caja, etcétera.
En conjunto con el desarrollo de estos módulos, se recibió la retroalimentación
correspondiente a las entregas realizadas en los incrementos anteriores, realizando ajustes
prácticos a los módulos anteriormente desarrollados para optimizar el funcionamiento de los
mismos.

Contexto
Breve Descripción de la Empresa
Matacos Deportes es un emprendimiento comercial del rubro deportivo ubicado en la
calle Saavedra 241 de la ciudad de Formosa, Provincia de Formosa, Argentina. Fue
fundado en septiembre del año 1999 por Sandra Mujica (comerciante) y su cónyuge
Miguel Ángel Marchi (arquitecto).
Origen y Evolución Histórica
El negocio inició sus actividades comerciales originalmente en el Paseo de Compras
(calle San Martín, conocido popularmente como "el Mercadito") bajo el nombre de "M y M",
orientado a la indumentaria urbana unisex. Al poco tiempo, debido a la experiencia previa
de Sandra en comercios deportivos en la ciudad de Resistencia (Chaco), los fundadores
identificaron una demanda insatisfecha en la plaza local: mientras las casas de deportes
tradicionales de Formosa centraban su oferta casi exclusivamente en el calzado de fútbol,
los deportistas, profesores y practicantes de diversas disciplinas carecían de un proveedor
local especializado en accesorios deportivos técnicos (vendas, bucales, mallas de
entrenamiento para natación, medias térmicas, canilleras, rodilleras, artículos de gimnasio y
mochilas técnicas como Wilson).
Esta oportunidad impulsó la reconversión del negocio hacia una tienda integral de
deportes y su posterior traslado al microcentro formoseño, instalándose primero en calle
Saavedra 238 (donde funcionó durante una década) y estableciéndose a partir de 2019 en
su local definitivo de Saavedra 241.
Identidad Institucional y Marca
Para diferenciarse de los locales con denominaciones similares a "M y M", los
dueños decidieron renombrar el negocio como "Matacos", en homenaje e identificación con
las raíces culturales y pueblos originarios de la región del Gran Chaco. La marca se
encuentra debidamente registrada como marca comercial. Su identidad gráfica evolucionó
desde un logotipo inicial en tonos amarillos con una silueta representativa hacia una paleta
centrada en tonalidades verdes, asociadas al aire libre, el fitness, la vida sana y las
disciplinas de campo

Vínculo Comunitario y Diferenciación
A lo largo de su trayectoria de más de 25 años, Matacos Deportes ha superado hitos
complejos de la economía provincial y nacional (como la crisis de 2001-2002 con la
circulación de bonos provinciales Bocanfor y LECOP). Se ha consolidado como un referente
del deporte formoseño, apoyando institucionalmente al Club Náutico Formosa y participando
en acciones promocionales con deportistas de trascendencia como la voleibolista
internacional formoseña Emilce “Mimí” Sosa y la boxeadora Alejandra "Locomotora"
Oliveras.
El principal valor diferencial del comercio radica en la atención personalizada y el
asesoramiento técnico pre y post-venta brindado directamente por sus dueños,
generando una sólida relación de fidelidad y confianza con la comunidad deportiva local. En
la actualidad, su oferta comercial destaca especialmente en accesorios de natación,
artículos de entrenamiento y fitness (mancuernas, bandas, colchonetas), indumentaria y
calzado recreativo tipo Crocs.
Necesidad/Problemática
1. Inexistencia de una Base de Datos Centralizada y Control de Inventario Ciego
El comercio carece de un registro digital de su stock (estimado entre 100 y 200 artículos con
múltiples variantes de talle y color). El control de existencias se realiza de manera visual o
mediante anotaciones parciales en papel, lo que genera desconocimiento del inventario
real, dificultades para planificar compras a proveedores y riesgo de quiebres de stock en
artículos de alta rotación.
2. Registro Manual de Ventas y Manejo de Caja Ineficiente
Cada venta realizada en el mostrador se anota manualmente en un cuaderno
manuscrito. Al finalizar la jornada, el cierre de caja requiere una sincronización entre el
dinero en efectivo del cajón, los cupones de tarjetas/posnet y las transferencias bancarias
recibidas, prestando atención minuciosa a las anotaciones del cuaderno. Este proceso es
lento, propenso a errores humanos involuntarios y carece de trazabilidad.
3. Remarcación de Precios Manual frente a la Inflación
Ante aumentos de listas de proveedores, los precios se actualizan remarcando a
mano etiquetas adhesivas pegadas en cada prenda o caja y redactando nuevas listas de
papel detrás del mostrador. La falta de un sistema digital unificado retrasa el traslado de
costos a precios de venta, impactando negativamente en la rentabilidad del negocio.

4. Limitación Geográfica, Horaria y Digital
Las operaciones comerciales dependen estrictamente de la apertura de las puertas
del local físico (horario comercial cortado). El comercio no cuenta con un canal digital
transaccional para atender consultas y ventas provenientes de clientes del interior de la
provincia de Formosa ni para proyectarse al mercado nacional. Cuando se coordinan ventas
por redes sociales (WhatsApp o Instagram), los productos se apartan manualmente en un
rincón del mostrador con alto riesgo de que otro vendedor los comercialice presencialmente
por falta de sincronización de stock.
5. Desconexión con Servicios Fiscales y de Hardware
La emisión de comprobantes fiscales se realiza de forma aislada a través del portal
"Comprobantes en Línea" de AFIP/ARCA o controladores fiscales físicos desconectados del
registro de ventas, duplicando la carga de trabajo administrativo para los titulares
(Responsables Inscriptos).
6. Vulnerabilidad ante Microcortes de Conectividad y Energía
El contexto local presenta eventuales interrupciones del servicio eléctrico o caídas
temporales de la red de internet en el microcentro de la ciudad. Cualquier solución de
software implementada debe ser tolerante a fallos, garantizando que el punto de venta
pueda seguir cobrando y emitiendo tickets en mostrador aun cuando no haya conexión a
internet (Offline-First).

Técnicas de Elicitación
Para llevar adelante el relevamiento para una posterior formalización de
requerimientos, el equipo aplicó una combinación de técnicas de elicitación
Entrevista/Cuestionario
Se llevó a cabo una entrevista en profundidad el día miércoles 26 de agosto de 2026
en las instalaciones del local comercial de Saavedra 241, en la cual se utilizó un
cuestionario con preguntas separadas en 7 bloques temáticos:
● Entrevistados: Sandra Mujica y Miguel Ángel Marchi (Dueños de Matacos
Deportes)
Bloque 0: Historia, Identidad Institucional y Vínculo Comunitario
Función del Bloque: Relevar la identidad corporativa, trayectoria histórica de 25
años, valores de marca y relación comunitaria del negocio, sirviendo como información
clave para el diseño de la sección de «Quiénes Somos» de la tienda online.
Clase de Preguntas Formuladas: Se realizaron preguntas abiertas cualitativas de
reconstrucción histórica.
Bloque 1: Diagnóstico Operativo Actual
Función del Bloque: Identificar los procesos operativos diarios vigentes en la
actualidad para comprender cómo se ejecuta el negocio hoy en el papel, identificar cuellos
de botella y diseñar interfaces digitales que minimicen la dificultad de adaptación
tecnológica.
Clase de Preguntas Formuladas: preguntas cerradas de opción múltiple,
combinadas con preguntas descriptivas de hábitos de trabajo.
Bloque 2: Catálogo, Inventario Inicial y Reglas de Negocio
Función del Bloque: Dimensionar la magnitud del inventario físico, definir la
estructura de datos para variantes de productos (talles, colores, disciplinas) y establecer las
reglas comerciales de venta y catalogación.
Clase de Preguntas Formuladas: preguntas cuantitativas de dimensionamiento y
clasificación de catálogo.

Bloque 3: Operativa del Punto de Venta, Hardware y Stock Actual
Función del Bloque: Especificar los requerimientos de hardware del mostrador,
evaluar la compatibilidad de códigos de barra y definir las reglas de concurrencia e
integridad de inventario entre el local físico y las ventas remotas.
Clase de Preguntas Formuladas: Preguntas técnicas sobre equipamiento y
escenarios de concurrencia de stock.
Bloque 4: Pagos, Facturación, Envíos y Postventa
Función del Bloque: Determinar los flujos monetarios, los métodos de pago
aceptados, la situación fiscal ante los entes recaudadores, la logística de entregas y las
políticas de postventa y cambios.
Clase de Preguntas Formuladas: Preguntas de definición impositiva, financiera y
logística
Bloque 5: Experiencia del Usuario (UX) y Canales de Atención
Función del Bloque: Diseñar la interacción del comprador online con la tienda web
para maximizar la facilidad de compra, reducir el abandono de carrito y optimizar la
comunicación directa con el comercio.
Clase de Preguntas Formuladas: Preguntas de usabilidad y experiencia de cliente.
Bloque 6: Roles de Usuario, Reportes y Plan de Transición
Función del Bloque: Definir los perfiles de acceso y seguridad del sistema,
establecer los indicadores clave de rendimiento para la toma de decisiones gerenciales y
acordar la estrategia de transición y capacitación del personal.
Clase de Preguntas Formuladas: Preguntas de control de acceso, reportería
gerencial y gestión del cambio.
Análisis de Sistemas en Internet
En conjunto con la entrevista, el equipo realizó un estudio comparativo y funcional de dos
plataformas de referencia en el comercio electrónico deportivo del país: Rossetti Deportes y
SoloDeportes

| Características  | Rossetti Deportes              | SoloDeportes              |
| ---------------- | ------------------------------ | ------------------------- |
| Navegación       | Navegación moderna y           | Menú estructurado por     |
|                  | limpia con filtros esenciales  | deporte, marca, género y  |
|                  | dinámicos orientados a una     | calzado/indumentaria.     |
|                  | navegación rápida.             | Filtros facetados         |
exhaustivos (talle, color,
disciplina, rango de precio).
Ficha de Producto  Información técnica completa: tabla de equivalencias de
talles (AR, US, UK), zoom detallado de imágenes y
promociones bancarias vigentes.
Gestión de Stock  Oculta o inhabilita directamente los talles agotados en
tiempo real.
| Pagos  | Pasarelas de pago digitales     | Integración principal a     |
| ------ | ------------------------------- | --------------------------- |
|        | (Mercado Pago / Getnet /        | través de pasarelas como    |
|        | Mobbex según campañas),         | Mercado Pago y              |
|        | con fuerte foco en              | promociones directas con    |
|        | promociones bancarias           | tarjetas bancarias (planes  |
|        | específicas (cuotas sin         | de cuotas sin interés).     |
|        | interés y reintegros con        | Admite débito, crédito y    |
|        | tarjetas locales/nacionales).   | transferencias/giros.       |
Logística y Entrega  Distribución nacional vía  Fuerte integración con
|     | operadores logísticos          | correos nacionales (ej.       |
| --- | ------------------------------ | ----------------------------- |
|     | (Andreani / OCA) con           | Andreani/Correo Argentino)    |
|     | cálculo por código postal.     | a domicilio o sucursal, con   |
|     | Retiro en tienda enfocado      | envíos gratis a partir de un  |
|     | en su red de locales físicos   | monto mínimo. Retiro          |
gratuito en su red de
sucursales
Atención al Cliente  Enfoque directo y  Canales tradicionales
|     | conversacional: botón         | consolidados: línea 0800,   |
| --- | ----------------------------- | --------------------------- |
|     | flotante de WhatsApp,         | correo electrónico de       |
|     | formulario de contacto web,   | soporte, botón flotante de  |
|     | redes sociales y gestión de   | WhatsApp y formulario de    |
|     | cambios en locales físicos.   | seguimiento de pedidos en   |
línea.

Características Importantes
Filtrado por Disciplinas. Desarrollar una interfaz con una división clara de los
productos por disciplina, marca y género
Botón Contextual de Whatsapp. Implementar un botón directo que traslade
automáticamente al chat del vendedor el nombre y talle del producto que el usuario está
consultando en pantalla, reduciendo la fricción para los clientes.

Propuesta de Desarrollo
La solución propuesta para Matacos Deportes se sustenta en un Software Híbrido
diseñada específicamente para responder a dos necesidades del negocio: la necesidad de
contar con una tienda web moderna y activa 24/7 para todo el país, y la exigencia de
disponer de un puesto de cobro físico en mostrador, confiable y tolerante a las
interrupciones del servicio de internet local.
El sistema se organiza en dos entornos operativos conectados de forma precisa:
Entorno en la Nube (Servidor activo 24/7/365)
En este entorno remoto se despliegan la Tienda Web y la Base de Datos Principal.
● Disponibilidad Permanente. La tienda online permanece abierta los 365 días del
año las 24 horas gracias a estar alojada en un centro de datos profesional con
suministro eléctrico ininterrumpido. Los clientes pueden explorar el catálogo, verificar
talles disponibles y comprar calzado o indumentaria durante la noche, feriados o
fines de semana, sin depender de una computadora del local encendida todo el
tiempo.
● Procesamiento de Pagos y Notificaciones. La nube aloja los servicios que reciben
las notificaciones de Mercado Pago al momento que un cliente realiza una compra
web o mediante QR, actualizando el estado de la compra de inmediato.
● Facturación Electrónica. La lógica central se comunica directamente con los
servidores de ARCA para solicitar los Códigos de Autorización Electrónico
reglamentarios, garantizando que los comprobantes fiscales se emitan de forma
transparente y legal.
Entorno Local en el Mostrador
En el local físico deberán funcionar dos computadoras dedicadas a la atención de
los clientes presenciales, equipadas con lectores de código de barra USB e impresoras
térmicas de tickets.
● Operación fluida y Ágil. El Punto de Venta está optimizado para cobrar utilizando
atajos de teclado o pasando la pistola lectora sobre la etiqueta del artículo.
● Modo sin conexión. Cada computadora almacena en su memoria local una copia
del inventario y de los precios vigentes. Si se produce un corte en el servicio de
Internet, el sistema no se detiene ni muestra pantallas de error;el cajero puede
continuar registrando ventas en efectivo, calculando vueltos y emitiendo tickets
normalmente.

Sincronización y Consistencia de Stock
La comunicación entre el mostrador y la nube opera mediante un esquema de
sincronización automática.
● En condiciones normales. Cada venta confirmada en el mostrador envía un
mensaje instantáneo a la nube para descontar esa unidad del stock disponible en la
web. De este modo, si un cliente en el local adquiere el último par de zapatillas de
determinado talle, la tienda online lo marca automáticamente como Agotado en
segundos, eliminando el riesgo de sobreventa.
● Ante un corte de Internet. Las ventas realizadas en el local físico se guardan de
manera segura en el almacenamiento local. En cuanto la conexión a internet se
restablece, el sistema detecta la red y transmite automáticamente todas las ventas
acumuladas hacia la base de datos central sin que el personal deba realizar alguna
acción manual.
Alcances del Sistema
El sistema cubrirá los siguientes módulos y funcionalidades:
1. Módulo E-Commerce (Tienda Web 24/7)
● Catálogo digital responsive optimizado para dispositivos móviles y computadoras.
● Filtros dinámicos por disciplina deportiva, categoría, marca, género y talles.
● Ficha de producto con fotos reales, descripción, selector de variantes y estado de
stock en tiempo real.
● Carrito de compras y proceso de checkout simplificado (compra como invitado o
usuario registrado).
● Pasarela de pagos online integrada con Mercado Pago (tarjetas de crédito/débito,
dinero en cuenta) y opción de transferencia bancaria con carga de comprobante.
● Botón flotante de WhatsApp con mensaje preconfigurado que incluye el producto
exacto navegado.
● Opciones de entrega: Retiro gratuito en el local (Saavedra 241), cadetería local
dentro de Formosa Capital y envíos a todo el país mediante Correo Argentino.
2. Módulo Punto de Venta (Mostrador)
● Interfaz optimizada para pantallas táctiles y teclado en 2 terminales tipo notebook.
● Búsqueda instantánea de artículos por lector de código de barras o buscador de
texto/categorías.

● Múltiples métodos de pago: Efectivo, tarjetas de débito/crédito vía Posnet,
transferencias y QR.
● Configuración de reglas de cuotas (ej. 3 cuotas en compras mayores a $30.000, 4
cuotas en compras mayores a $80.000, etcétera).
● Emisión e impresión rápida de tickets en impresoras térmicas.
● Disparo de apertura automática del cajón de dinero tras confirmar el cobro.
● Apertura, arqueo y cierre diario de caja con conciliación automática de importes por
medio de pago.
● Modo Offline: Capacidad de seguir vendiendo y emitiendo tickets ante caídas de
internet, guardando transacciones en la base local (IndexedDB) y sincronizándolas
automáticamente al restaurar la conexión.
3. Módulo de Gestión de Inventario y Stock
● Catálogo maestro de productos con variantes jerárquicas (Disciplina → Producto →
Variante: Talle / Color / Código de Barra / SKU).
● Módulo de carga inicial progresiva por categorías/marcas para facilitar el uso.
● Actualización centralizada de precios de costo y venta.
● Generador e impresión de etiquetas con código de barras propio para prendas sin
código de fábrica.
● Bloqueo transaccional de stock para prevenir sobreventas simultáneas entre
mostrador y web.
● Gestión de productos sin stock (muestra como «Agotado» y botón de aviso de
reingreso por WhatsApp/email).
4. Módulo de Facturación y Comprobantes
● Facturación electrónica integrada con AFIP / ARCA para emisión de Facturas A y B
con obtención automática de CAE (Código de Autorización Electrónico).
● Posibilidad de emitir comprobantes internos no fiscales (tickets de control o
presupuestos de mostrador).
● Emisión de Notas de Crédito / Vales de compra para cambios y devoluciones sin
reintegro de efectivo.
5. Módulo de Administración, Seguridad y Reportes
● Control de acceso basado en roles):
○ Administrador / Dueño: Acceso total a costos, márgenes, configuración y
reportes financieros.

○ Cajero / Vendedor: Operación del POS, cobro, consulta de stock y emisión
de tickets.
○ Operador de Despacho / Catálogo: Carga de fotos, actualización de
descripciones y cambio de estado de pedidos web.
● Reportes gerenciales: Total facturado por medio de pago, productos/marcas más
vendidas y alertas de stock mínimo.

Límites del Sistema
Para delimitar con precisión el alcance del proyecto, se establecen las siguientes
exclusiones:
1. Sin Gestión de Cuentas Corrientes ni Fiados
El sistema no contempla ventas a plazo ni registro de deudas, ya que la política
comercial del establecimiento es 100% minorista al contado o tarjeta.
2. Sin Módulo de Fabricación o Personalización Textil
No se contemplan procesos de corte, confección ni estampado de dorsales/nombres
a pedido, ya que el comercio opera exclusivamente con prendas de proveedores
3. Sin Contabilidad General ni Liquidación de Sueldos
El sistema no está destinado a la contabilidad digital, por lo que no confecciona
libros diarios, libros IVA digital ni liquidación de haberes de empleados.
4. Sin Aplicación Móvil Nativa para Tiendas de Apps
La solución se desarrollará como una aplicación web responsive y PWA, sin generar
aplicaciones para Apple App Store o Google Play Store

Objetivos
Objetivo General
Diseñar, desarrollar e implementar un Sistema Web Integral, Punto de Venta y
Gestión de Inventario con capacidades offline para el comercio “Matacos Deportes”, con el
propósito de modernizar y automatizar sus procesos de venta de mostrador, centralizar el
control de stock y expandir su alcance comercial hacia el mercado digital local, provincial y
nacional.
Objetivos Específicos
1. Relevar, formalizar y validar los requerimientos de software a partir de
entrevistas en profundidad y del análisis del modelo operativo analógico actual.
2. Diseñar un software que garantice la disponibilidad ininterrumpida de la tienda web
en la nube y la operatividad tolerante a cortes de internet en el mostrador del local
físico.
3. Desarrollar la interfaz del Punto de Venta optimizada, con soporte para lectura de
códigos de barra, múltiples métodos de pago e impresión de tickets.
4. Desarrollar la plataforma de comercio electrónico con diseño responsive,
navegación por disciplinas, catálogo con variantes, pasarela de pagos y canal de
asistencia directa vía WhatsApp.
5. Implementar un mecanismo de control de stock para sincronizar en tiempo real el
inventario entre el local físico y la tienda online, evitando sobreventas.
6. Integrar el módulo de facturación electrónica con los servicios de ARCA para la
generación de facturas y la emisión de comprobantes internos y notas de crédito.
7. Configurar la infraestructura de hosting en servidor en la nube.
8. Ejecutar un plan de pruebas integrales, capacitación del personal y despliegue
piloto para garantizar una transición ordenada a la plataforma digital.

Planificación
Metodología de Desarrollo
Para la gestión y ejecución del proyecto se adopta una metodología de desarrollo
incremental apoyada en el marco Kanban, descartando esquemas rígidos como Scrum que
resultan poco prácticos para un equipo de 4 personas.
Justificación de la Elección
La metodología Scrum impone una sobrecarga de ceremonias formales y una
división estricta de roles (Product Owner, Scrum Master, etc.) que en un equipo reducido
genera una complejidad innecesaria. Por otro lado, este enfoque seleccionado nos permite:
Visualización clara del Flujo de Trabajo. Mediante un tablero visual estructurado
en columnas (Por Hacer, En Progreso, Pausado, Completado, En Revisión), el equipo
mantiene visibilidad en tiempo real del estado de cada funcionalidad.
Límite de Trabajo en Curso. Se restringe la cantidad de tareas simultáneas que
cada miembro puede abordar, reduciendo la multitarea, evitando cuellos de botella y
maximizando el rendimiento del equipo.
Entregas Incrementales Quincenales. El software evoluciona a través de
incrementos funcionales tangibles cada 15 días, permitiendo validar módulos con los
dueños de Matacos Deportes y realizar ajustes rápidos sin fricciones.
Flexibilidad Operativa. Facilita la reasignación de prioridades técnicas de forma
natural según los resultados de cada etapa.
Cronograma

Recursos
Stack Tecnológico
TypeScript
Es un superconjunto de JavaScript desarrollado por Microsoft que incorpora
comprobación estricta de tipos de datos en tiempo de compilación. En el proyecto, se
adopta como el lenguaje unificado para el Frontend, el Backend (Server Actions y API
Routes) y las definiciones de persistencia. Su incorporación elimina de raíz clases enteras
de errores en tiempo de ejecución (como accesos a propiedades inexistentes o desajustes
entre tipos de datos en importes numéricos y códigos de barras), acelerando el trabajo
colaborativo del equipo mediante autocompletado contextual y refactorizaciones seguras en
un dominio que maneja múltiples variantes (talles, colores, precios y SKUs).
https://www.typescriptlang.org/
Next.js 15 (con React 19)
Es el framework fullstack basado en React 19 que actúa como el núcleo de la
interfaz y la capa de servicios del sistema. Gracias a la arquitectura App Router, el sistema
aprovecha los React Server Components (RSC) para generar páginas optimizadas y con
carga ultrarrápida en la tienda online pública (minimizando el peso de JavaScript enviado al
navegador y optimizando el posicionamiento SEO), mientras que gestiona la lógica de
mutación de datos mediante Server Actions. Para el Punto de Venta (POS) en mostrador,
provee una experiencia tipo SPA (Single Page Application) altamente reactiva que no
requiere recargas de página para cobrar o buscar artículos.
https://nextjs.org/
Tailwind CSS
Es un entorno de diseño basado en clases utilitarias (utility-first) que permite
maquetar y estilizar pantallas de forma ágil y modular. Permite estructurar interfaces
completamente responsive y adaptadas tanto a pantallas de teléfonos celulares (para
compradores de la tienda web) como a computadoras portátiles de mostrador. Su uso
garantiza un diseño visual coherente alineado con la identidad corporativa de Matacos
Deportes (tonalidades verdes institucionales), optimizando el rendimiento final al purgar todo
el código CSS no utilizado durante el empaquetado de producción
https://tailwindcss.com/

PostgreSQL 16
Es el motor de base de datos relacional de código abierto adoptado como el
repositorio central y fuente única de la verdad del sistema en la nube. Ofrece estricto
cumplimiento del estándar ACID (Atomicidad, Consistencia, Aislamiento y Durabilidad),
garantizando la integridad de todas las operaciones comerciales, financieras y de inventario.
Su capacidad de bloqueo de registros a nivel de fila (row-level locking) dentro de
transacciones atómicas es el mecanismo clave para evitar sobreventas concurrentes entre
las compras efectuadas en mostrador y los pedidos concretados en la tienda web.
https://www.postgresql.org/
Prisma ORM
Es un mapeador objeto-relacional de nueva generación para Node.js y TypeScript.
Define el modelo relacional a través de un esquema declarativo claro (schema.prisma),
automatiza las migraciones del esquema en PostgreSQL y genera un cliente tipado a
medida. Esto previene desajustes de tipos entre la base de datos y la aplicación, simplifica
consultas complejas con relaciones jerárquicas (Disciplina → Producto →
Variante/Talle/Color → Stock) y neutraliza riesgos de inyección SQL.
https://www.prisma.io/
Zustand & Dexie.js
Zustand es una biblioteca ligera de administración de estado global para React
basada en el patrón de almacenes desacoplados (stores). Se utiliza para coordinar el
estado de la venta activa en el mostrador (artículos ingresados por pistola lectora, cálculo
de subtotales, descuentos y formas de pago combinadas), el carrito de compras en la tienda
web y el monitoreo de conectividad en tiempo real, todo ello con una huella de memoria
mínima y sin la sobrecarga de código de soluciones tradicionales como Redux.
Dexie es un envoltorio (wrapper) minimalista y tipado para IndexedDB, la base de
datos NoSQL transaccional embebida nativamente en los navegadores web. Esta
tecnología es el pilar del soporte Offline-First en las notebooks del local comercial:
almacena en el almacenamiento local una réplica del catálogo de productos, listas de
precios vigentes y una cola de transacciones pendientes. Si se interrumpe la conexión a
internet en el microcentro de la ciudad, el sistema continúa registrando ventas en mostrador,
emitiendo comprobantes locales y acumulando los movimientos en IndexedDB, para luego
sincronizarlos automáticamente contra el servidor central apenas se restablezca la
conectividad.
https://dexie.org/
https://zustand-demo.pmnd.rs/

Zod
Es una librería de declaración y validación de esquemas con inferencia estática de
tipos para TypeScript. Se implementa como la capa de validación compartida entre el cliente
y el servidor. Zod intercepta y sanea toda entrada de datos proveniente de formularios
(carga de artículos, datos de contacto en checkout, números de DNI/CUIT y comprobantes
fiscales) antes de que impacten en la lógica de negocio o en la base de datos. Esto
previene la persistencia de datos corruptos o incompletos y asegura que cualquier
inconsistencia sea informada de manera inmediata al usuario de forma clara.
https://zod.dev/
Mercado Pago SDK
Es el kit de desarrollo seleccionado para procesar cobros electrónicos en la tienda
web. Permite a los clientes abonar mediante tarjetas de crédito, tarjetas de débito, dinero en
cuenta de Mercado Pago y cuotas de manera segura. La integración incluye la recepción y
validación asíncrona de notificaciones automáticas (Webhooks) en la API central,
permitiendo que las compras queden confirmadas, pagadas y con stock reservado de forma
autónoma las 24 horas del día.
https://www.mercadopago.com.ar/developers
Docker
Es la plataforma de contenerización empleada para encapsular la aplicación Next.js,
el motor PostgreSQL y el servidor web en contenedores estandarizados y reproducibles.
Mediante docker-compose.yml, el equipo garantiza que el entorno de desarrollo en las
máquinas locales sea idéntico al entorno de producción en la nube, eliminando
inconsistencias por versiones de dependencias y facilitando tareas de despliegue, escalado
y copias de seguridad.
https://www.docker.com/
Servidor en la Nube (Cloud Hosting)
La infraestructura central se aloja en un Servidor Virtual Privado (VPS) en un centro
de datos profesional. Esto garantiza una disponibilidad continua superior al 99.5% anual con
conectividad de alta velocidad y respaldo energético, permitiendo que la tienda online y los
servicios de sincronización operen sin interrupciones y con un ahorro económico de más del
70% en comparación con la adquisición y mantenimiento de un servidor físico en el local
comercial.

Recursos Humanos
El proyecto es ejecutado por el siguiente equipo de alumnos:
● Dellagnolo, Ricardo Agustín: Líder de Proyecto / Desarrollador Backend.
● Fornari, Nahir Agustín: Desarrollador Backend / Analista Funcional.
● Bordón Sbardella, Lourdes Antonella: Desarrolladora Frontend / Diseñadora
UI-UX.
● González, Eugenia Milagros: Desarrolladora Frontend / Diseñadora UI-UX.
● Supervisión Académica: Prof. Dr. Cerquand, Cristian Fernando (Docente Titular
PPS I).
Recursos del Cliente
Para que Matacos Deportes pueda operar el sistema de forma fluida, rápida y sin
interrupciones (incluso ante cortes de luz o de internet en Formosa), necesitan un conjunto
de hardware y recursos físicos específicos.
Puestos de Cobro/Venta (En Mostrador)
En la entrevista se expresó el deseo de contar con 2 terminales de cobro
simultáneas basadas en Notebooks. Estas deben cumplir un mínimo de requisitos:
● Procesador: Intel Core i3 (10ma generación o superior); AMD Ryzen 5 de Serie
5000U o 7000U)
● Memoria RAM: Mínimo 8GB (para compaginar el uso de navegador web, sistema
local y demás funcionalidades sin trabas)
● Almacenamiento: Disco de Estado Sólido (SSD) de 256GB o 512GB.
● Puertos USB: Mínimo 3 puertos USB libres (para lector de código de barras,
impresora de tickets y mouse). En su defecto se puede utilizar un Hub USB.
● Batería: Mínimo 1 a 2 horas de autonomía real.
Periféricos de Mostrador
Para ambas terminales de cobro, se necesita:
● Lector de Código de Barras:
○ Tipo recomendado: Lector Láser o Imagen 1D (o 2D para leer también
códigos QR si quisieran en el futuro).
○ Conexión: USB Plug & Play (no requiere instalar drivers raros, la notebook lo
reconoce como un teclado).

○ Accesorio indispensable: Que incluya soporte de pie / base de apoyo con
modo de lectura continua o automática (permite al cajero pasar las zapatillas
o prendas con las dos manos libres sin tener que apretar el gatillo cada vez).
○ Marcas recomendadas en Argentina: Honeywell, Netmak, 3nStar,
Datalogic o genéricos tipo Eyoyo.
● Impresora de Tickets:
○ Tecnología: Térmica directa (no usa tinta ni cartuchos; solo usa rollos de
papel térmico sensible al calor).
○ Ancho de papel recomendado: 80 mm (porque permite imprimir tickets más
prolijos, con el logo de Matacos, detalle de prendas, talles, medios de pago y
el código de Nota de Crédito/Vale bien legible).
○ Velocidad y Corte: Con autocorte de papel (auto-cutter) para agilizar la
entrega del ticket al cliente.
○ Conexión: USB.
○ Marcas recomendadas en Argentina: Xprinter, Hasar, Epson TM-T20 o
3nStar.
Equipamiento de Etiquetado
Útil para aquellas prendas de oferta, indumentaria y accesorios en general que
vienen sin código de barras de fábrica:
● Impresora Térmica de Etiquetas Adhesivas: con tecnología térmica. Permite
imprimir etiquetas de tamaño ideal para las prendas (50mm x 30mm o 40mm x
25mm) donde se detalla el nombre de la marca, el producto, talle, precio y código de
barras.
○ Modelos recomendados: X-Printer, Zebra o HPRT.
Protección Eléctrica y de Conectividad
Dado el contexto de Formosa, donde en la mayoría del año predominan las altas
temperaturas y cortes de suministro eléctrico, se recomienda:
● UPS/Sistema de batería de respaldo: para conectar el router/módem de Internet y
las impresoras térmicas. En caso de un corte de luz, se puede seguir con las
notebooks encendidas, conexión a internet e impresión de tickets durante 30 a 60
minutos.
● Estabilizador de Tensión: para evitar sobretensiones o golpes de corrientes si
regresa la luz.

● Plan B de Conectividad: si se sufre una caída de internet, se debe tener
configurado las notebooks el acceso rápido al internet del celular para poder seguir
operando.
Insumos y Consumibles Iniciales
● Rollos de papel térmico para tickets: Caja de rollos de 80mm o 58mm de ancho,
según la impresora elegida.
● Rollos de etiquetas adhesivas térmicas: 2 a 3 rollos de etiquetas 50x30mm para
comenzar a etiquetar prendas sin código.
Recursos de Software
Para que las computadoras portátiles (notebooks) asignadas al mostrador y
cobranza de Matacos Deportes (Saavedra 241) funcionen de forma óptima, segura y sin
fricciones, se detallan a continuación los recursos, requerimientos y configuraciones de
software necesarios a nivel de puesto de trabajo:
Sistema Operativo
Las terminales de venta requieren un sistema operativo moderno, estable y con
soporte oficial para controladores USB y navegadores de última generación:
Sistema Recomendado: Microsoft Windows 10 o Windows 11 (64 bits) en sus
ediciones Home, Pro o Enterprise. Es el entorno estándar presente en la gran mayoría de
notebooks comerciales y ofrece compatibilidad directa y sin configuraciones complejas (Plug
& Play) para impresoras térmicas chinas/genéricas (Xprinter, POS-58/80), lectores de
código de barras USB y dispositivos Posnet.
Alternativa Soportada: Linux (Ubuntu 22.04 LTS o Linux Mint. Totalmente viable si
se requiere reutilizar equipos más antiguos, ya que la aplicación corre 100% sobre
navegadores web modernos y el protocolo CUPS soporta impresoras de tickets térmicas.
Navegador Web
El Punto de Venta opera como una Aplicación Web Progresiva (PWA), por lo que el
navegador web es el software más crítico del equipo:
Navegadores: Google Chrome (Versión 120 o superior — Recomendada) o
Microsoft Edge (Versión 120 o superior, basado en Chromium
Capacidades Requeridas del Navegador (Nativas y Habilitadas):
IndexedDB: Motor de base de datos local donde Dexie.js https://dexie.org/
almacena el catálogo, precios y cola de ventas offline.

Service Workers & Cache Storage: Permite que la aplicación web cargue
instantáneamente incluso si la notebook se inicia sin conexión a internet.
Almacenamiento Local Persistente: Configurar el navegador para no borrar datos
de navegación/cookies al cerrar, evitando que se limpie la memoria de ventas pendientes de
sincronización.
Instalación como PWA (Acceso Directo de Escritorio): Se recomienda instalar el
POS como una Web App desde el navegador, generando un acceso directo independiente
en el escritorio y barra de tareas, ejecutándose en una ventana limpia sin barras de
navegación ni menús de URL.
Drivers
Lector de Código de Barras USB (Pistola 1D/2D. No requiere software ni drivers
adicionales: Opera bajo el estándar USB HID (Human Interface Device / Emulación de
Teclado) nativo del sistema operativo. Al conectar el lector, el sistema lo reconoce como un
teclado que escribe automáticamente la secuencia numérica del código y envía una tecla
Enter final.
Impresora Térmica de Tickets (58mm / 80mm): instalación del driver oficial del
fabricante del equipo (ej. Xprinter POS Driver, POS-80 Series, POS-58 Series o Generic /
Text Only).
Configuración del formato de papel: Configurar en las propiedades de la
impresora el tamaño de bobina continua correspondiente (ej. 58mm x 210mm o 80mm x
297mm), con márgenes en 0 mm.
Herramientas y Modos de Impresión Ágil
Modo Impresión Silenciosa (Kiosk Printing): Para que el cajero cobre en menos
de 2 segundos sin que el navegador abra la molesta ventana emergente de previsualización
de impresión de Windows en cada venta, se configura el acceso directo de Chrome/Edge
con el parámetro --kiosk-printing. Esto permite que al pulsar "Cobrar", el ticket térmico se
imprima de forma automática e instantánea por la impresora predeterminada.
Visor de Documentos PDF: Visor integrado del navegador o Adobe Acrobat Reader
/ Foxit PDF Reader para la apertura y descarga de Facturas Electrónicas oficiales A/B
emitidas por AFIP/ARCA o resúmenes de cierre de caja.

Herramientas de Seguridad
Seguridad de Windows (Windows Defender): Activado y con actualizaciones
automáticas al día. No se recomienda la instalación de antivirus de terceros pesados que
consumen memoria RAM o interfieran con las peticiones de red locales o WebSockets.
Configuraciones Críticas a Nivel de Sistema Operativo
Zona Horaria y Sincronización NTP: Configurar la zona horaria en UTC-03:00
(Buenos Aires / Argentina) con sincronización automática de hora mediante servidor NTP de
internet (time.windows.com). Esto es indispensable para la validez de los CAE de
AFIP/ARCA y la coherencia en las marcas de tiempo de los cierres de caja.
Planes de Energía y Suspensión: Configurar el plan de energía para desactivar la
suspensión automática cuando el equipo esté conectado a la corriente eléctrica, evitando
que la terminal entre en reposo durante el horario comercial y desconecte los puertos USB
del lector o impresora.
Prioridad de Red y Conectividad: Configuración de la red Wi-Fi/Ethernet del local
como Red Privada para permitir la comunicación fluida entre ambas terminales de cobro si
fue necesario compartir impresoras en red local.

Requerimientos
Requerimientos Funcionales
Los requerimientos funcionales especifican el comportamiento y los servicios que el
sistema debe proveer, organizados por módulos:
Módulo 1: Gestión de Catálogo e Inventario
ID Nombre Descripción Prioridad
El sistema debe permitir al Alta
Administrador dar de alta,
modificar, consultar y dar de baja
RF-01 Gestión de Productos
lógica productos del catálogo,
especificando nombre, descripción,
categoría, marca, disciplina
deportiva, precio de costo y precio
de venta base.
RF-01.1 Actualización Masiva y El sistema debe permitir al Alta
Porcentual de Precios Administrador aplicar incrementos
o decrementos porcentuales sobre
los precios de forma masiva,
filtrando por marca, disciplina
deportiva o selección manual de
artículos.
RF-02 Gestión de Variantes de El sistema debe permitir definir Alta
Producto múltiples variantes por cada
producto, combinando talle
(calzado o indumentaria), color,
código de barras (EAN-13 o
interno), SKU y precio de venta.
RF-03 Control de Stock por El sistema debe registrar y Alta
Variante descontar el stock disponible de
cada variante de forma unificada y
en tiempo real tanto para ventas de
mostrador como para ventas por la
web.
RF-04 Carga Inicial y Progresiva El sistema debe proveer un Alta
de Inventario mecanismo de importación masiva
y gradual de inventario mediante

planillas de cálculo estandarizadas
(Excel/CSV) o por lotes,
permitiendo dar de alta o acumular
stock por marcas y disciplinas con
sus variantes (talles y colores), sin
interrumpir la operatoria diaria del
comercio.
RF-05 Generación de Código de El sistema debe permitir generar e Media
Barra Propios imprimir etiquetas con códigos de
barras numéricos para aquellos
artículos que ingresen sin código
de barras de fábrica.
RF-06 Alertas de Stock Crítico El sistema debe emitir alertas Media
automáticas en el panel de control
cuando el stock de una variante
alcance un umbral mínimo
configurable o quede en cero
(«Agotado»)
Módulo 2: Punto de Venta
ID Nombre Descripción Prioridad
RF-07 Búsqueda Ágil en Mostrador El sistema debe permitir ingresar Alta
productos a la venta activa
mediante lectura con pistola de
código de barras o a través de un
buscador de texto predictivo por
nombre, marca o categoría.
RF-08 Aplicación de Descuentos El sistema debe permitir al Alta
en Punto de Venta operador aplicar descuentos
manuales sobre un producto
específico (o sobre el total) antes
de confirmar el cobro, pudiendo
ingresar el valor como porcentaje
(%) o como monto monetario fijo
($), recalculando y reflejando
inmediatamente el precio final en
la venta y en el ticket.
RF-09 Cobro Multi-Método El sistema debe permitir procesar Alta
ventas combinando múltiples
formas de pago en una misma
transacción: Efectivo (con cálculo
automático de vuelto), Tarjetas de

Débito/Crédito (Posnet),
Transferencias Bancarias y
Códigos QR.
RF-10 Emisión e Impresión de El sistema debe emitir Alta
Tickets de Venta comprobantes de venta con
formato térmico (58mm / 80mm),
detallando fecha, ítems,
cantidades, precios unitarios, total,
medio de pago y datos del
comercio.
RF-11 Apertura, Arqueo y Cierre El sistema debe registrar la Alta
de Caja apertura de caja con un monto
inicial, registrar las ventas del
turno y generar el reporte de cierre
diario con el desglose totalizado
por cada medio de pago.
RF-12 Operación Offline del El sistema de mostrador debe Alta
Mostrador permitir continuar realizando
ventas, cobrando en efectivo y
emitiendo tickets locales aun
cuando se interrumpa la conexión
a internet, encolando las
transacciones para su
sincronización automática una vez
restablecido el enlace.
Módulo 3: Tienda Web y Checkout
ID Nombre Descripción Prioridad
RF-13 Navegación y Catálogo El sistema debe exponer un Alta
Público catálogo web responsive y público,
con categorización jerárquica por
disciplinas (Natación, Vóley,
Crocs/Urbano, Gimnasio, etc.),
marcas, género y talles.
RF-14 Ficha de Detalle de El sistema debe mostrar la ficha Alta
Producto individual de cada producto con su
galería de imágenes, descripción,
guía de talles y selector dinámico
de variantes con disponibilidad en
tiempo real.
RF-15 Carrito de Compras y Guest El sistema debe permitir a los Alta
Checkout clientes añadir productos al carrito
y concretar la compra como
invitados (guest checkout)
ingresando únicamente datos de
contacto y entrega sin requerir

creación obligatoria de cuenta.
RF-16 Integración de Pagos con El sistema debe integrar la pasarela Alta
Mercado Pago de pago de Mercado Pago
(Checkout Pro y tarjetas) y
procesar webhooks asíncronos
para actualizar el estado del pedido
a «PAGADO» de forma automática.
RF-17 Pago por Transferencia El sistema debe permitir al Media
Bancaria comprador seleccionar
transferencia bancaria, mostrando
los datos de CBU/Alias del
comercio y permitiendo adjuntar el
comprobante de pago para su
posterior verificación.
RF-18 Botón Contextual de El sistema debe incluir un botón Alta
Whatsapp flotante de contacto que genere un
mensaje de WhatsApp directo
hacia el comercio, conteniendo el
enlace, nombre y talle del producto
navegado.
RF-19 Gestión de Opciones de El sistema debe permitir al Alta
Envío comprador seleccionar entre Retiro
gratuito en Saavedra 241,
Cadetería local dentro de Formosa
Capital o Envío por Correo
Argentino / Encomienda a nivel
nacional.
Módulo 4: Facturación Electrónica y Postventa
ID Nombre Descripción Prioridad
RF-20 Emisión de Factura El sistema debe conectarse con los Media
Electrónica ARCA Web Services de AFIP/ARCA
(WSAA/WSFE) para generar
Facturas Electrónicas Tipo A y B
obteniendo el Código de
Autorización Electrónico (CAE)
reglamentario.
RF-21 Comprobantes Internos de El cajero o administrador debe poder Alta
Control elegir al momento del cobro si emite
Factura Electrónica fiscal o un ticket
interno de control no fiscal.
RF-22 Gestión de Cambios y El sistema debe permitir procesar Media
Notas de Crédito cambios de mercadería por el mismo
producto sin recargo por inflación, o
emitir un vale de compra / Nota de
Crédito digital en caso de que el

cliente no seleccione un producto
sustituto en el momento.
Módulo 5: Administración, Seguridad y Reportes
ID Nombre Descripción Prioridad
RF-23 Control de Acceso por El sistema debe restringir el acceso Alta
Roles a las funciones según el rol del
usuario autenticado: Administrador
(acceso total y costos), Cajero (solo
mostrador y cobro) y Operador de
Despacho (catálogo y pedidos web).
RF-24 Reportes Gerenciales y El sistema debe generar reportes Media
Estadísticas visuales y descargables de volumen
de facturación por período, ventas
por medio de pago, ranking de
artículos y marcas más vendidas.
RF-25 Gestión de Estados de El sistema debe permitir al personal Alta
Pedidos actualizar el estado de los pedidos
online («Pendiente», «Pagado»,
«Empaquetado», «Enviado»,
«Entregado», «Cancelado») y
registrar el número de seguimiento
de envío.
Requerimientos No Funcionales
Los requerimientos no funcionales establecen los criterios de calidad, rendimiento,
seguridad y mantenibilidad del sistema:
ID Nombre Descripción Prioridad
RNF-01 Disponibilidad y La plataforma de comercio Alta
Confiabilidad electrónico y la lógica central alojadas
en la nube deben mantener una
disponibilidad mínima garantizada del
99% anual, operando de manera
continua e independiente de los
horarios o cortes de luz del local
físico
RNF-02 Rendimiento y Tiempos Alta
de Respuesta 1. En el Punto de Venta (POS),
la búsqueda de un producto
mediante lector de código de

barras o texto debe arrojar
resultados en menos de 1
segundo.
2.  La confirmación de una venta
y la emisión del ticket térmico
no debe demorar más de 3
segundos.
3.  En la tienda web, el tiempo de
carga de las páginas iniciales
y del catálogo no debe
exceder los 5 segundos en
conexiones móviles 4G.
RNF-03  Consistencia e Integridad  Las operaciones de descuento de  Alta
| de Datos  |     | stock deben ejecutarse bajo  |     |
| --------- | --- | ---------------------------- | --- |
transacciones atómicas y con
bloqueo de registros en la base de
datos PostgreSQL, asegurando que
nunca se produzca sobreventa de
una misma unidad entre la web y el
mostrador.
RNF-04  Tolerancia a Fallos y  El sistema de mostrador debe  Alta
Modo sin Conexión  garantizar la continuidad operativa de
cobro en efectivo ante caídas totales
del enlace de internet del local,
almacenando de forma segura las
ventas en la base local (IndexedDB) y
ejecutando la sincronización en
segundo plano al restablecerse la
red.
|     |     |                               | Alta  |
| --- | --- | ----------------------------- | ----- |
|     |     | 1.  Todas las comunicaciones  |       |
|     |     |                               |       |
web y conexiones de API
|                    |     |                           |     |
| ------------------ | --- | ------------------------- | --- |
|                    |     | deben viajar encriptadas  |     |
|   Seguridad de la  |     |                           |     |
mediante el protocolo seguro
|   Información  |     |                      |     |
| -------------- | --- | -------------------- | --- |
|                |     | HTTPS / TLS 1.3 con  |     |

certificados SSL gestionados
RNF-05
por el proveedor de servicios
en la nube.

2.  Las contraseñas de los
usuarios deben almacenarse
con algoritmos de hashing
robustos (bcrypt o Argon2).
3.  Los accesos al panel
administrativo deben estar
protegidos por tokens de
sesión seguros con expiración
automática.
|     |     |                                     | Alta  |
| --- | --- | ----------------------------------- | ----- |
|     |     | 1.  La interfaz del Punto de Venta  |       |
|     |     |                                     |       |
(POS) debe ser ergonómica,
|     |     |                              |     |
| --- | --- | ---------------------------- | --- |
|     |     | con botones de gran tamaño,  |     |
|     |     |                              |     |
alto contraste visual y
|     |     |                                |     |
| --- | --- | ------------------------------ | --- |
|     |     | optimizada para el uso rápido  |     |
|     |     |                                |     |
con teclado y atajos rápidos,
|         |               |                            |     |
| ------- | ------------- | -------------------------- | --- |
|         |               | pensada para personal con  |     |
| RNF-06  | Usabilidad y  |                            |     |
baja experiencia tecnológica
Accesibilidad
previa.
2.  La tienda online debe ser
completamente Responsive,
garantizando una navegación
táctil fluida y legible en
teléfonos o pantallas de
cualquier tipo de resolución.
|     |     |                                  | Media  |
| --- | --- | -------------------------------- | ------ |
|     |     | 1.  El código fuente debe estar  |        |
|     |     |                                  |        |
estructurado bajo una
|     |     |                          |     |
| --- | --- | ------------------------ | --- |
|     |     | arquitectura modular en  |     |
|     |     |                          |     |
TypeScript con tipado estricto,
|     |                  |                               |     |
| --- | ---------------- | ----------------------------- | --- |
|     | Mantenibilidad,  | facilitando el mantenimiento  |     |
  Portabilidad y Copias de
evolutivo.
|         | Seguridad  |                                    |     |
| ------- | ---------- | ---------------------------------- | --- |
| RNF-07  |            | 2.  Todo el entorno de producción  |     |
debe estar contenerizado

mediante Docker Compose
para garantizar portabilidad
inmediata entre diferentes
proveedores de hosting.
3. El sistema debe programar
copias de seguridad
(backups) automáticas diarias
de la base de datos
PostgreSQL.

Diagramas
Diagrama de contexto

Diagrama de caso de uso - Primera entrega

Modelo Relacional

Estructura del Proyecto
src/ (Código Fuente Principal)
Es la carpeta central donde vive todo el funcionamiento del sistema:
● app/: Contiene las páginas y pantallas visibles para el usuario mediante Next.js 15.
○ admin/: Pantalla de administración para consultar stock, catálogo,
proveedores y cambios masivos de precio.
○ pos/: Pantalla rápida para el mostrador de ventas, incluyendo la plantilla
especial para imprimir tickets térmicos de 80mm y 58mm.
○ api/: Enlaces internos que responden datos en formato JSON para
búsquedas rápidas de productos, alertas de stock y subida de fotos.
● components/dashboard/: Los bloques visuales con los que interactúa el usuario
(botones, tablas de stock, tarjetas de métricas y ventanas emergentes como la carga
masiva de Excel o ajustes manuales).
● server/: El "cerebro" del sistema que se ejecuta de forma segura en el servidor:
○ actions/: Acciones que guardan ventas o descuentan stock asegurando que
si ocurre un corte de luz o error a mitad de camino, la base de datos no
quede corrupta ni con stock negativo.
○ services/: Módulos para cálculos específicos, como apertura/cierre de turnos
de caja y cálculo de comprobantes fiscales.
● schemas/: Reglas escritas con Zod para garantizar que ningún dato llegue vacío o
con formato erróneo (por ejemplo: que un precio siempre sea un número positivo o
que un código de barras sea válido).
● lib/: Herramientas auxiliares y conexiones:
○ dexie.ts: Base de datos local que guarda las ventas en la computadora de
mostrador si se corta internet (enfoque Offline-First).
○ prisma.ts: Conexión con la base de datos principal PostgreSQL.
○ utils.ts: Funciones comunes, como dar formato de moneda en pesos
argentinos ($ 45.000,00) y manejar la hora oficial de Argentina.
● config/ y types/: Datos fijos del negocio (nombre del local, CUIT, dirección
Saavedra 241) y definiciones técnicas para que el código sea seguro y ordenado.
prisma/ (Base de Datos)
Administra la estructura de la base de datos PostgreSQL:
● schema.prisma: El plano donde se definen las tablas (productos, variantes por
talle/color, ventas, movimientos de stock y cajas).

● migrations/: El historial registrado de cada cambio hecho en las tablas de la base
de datos a lo largo del tiempo.
● seed.ts: Datos iniciales para que el sistema empiece a funcionar con categorías y
configuraciones de prueba.
public/ (Archivos Estáticos y Multimedia)
Almacena los recursos que no cambian o que se muestran directamente en pantalla:
● uploads/products/: Carpeta donde se guardan las fotografías de los productos y
zapatillas subidas por los usuarios.
● Logos y plantillas: El logo oficial de Matacos Deportes y las planillas Excel oficiales
de carga de stock descargables.
scripts/ (Pruebas y Mantenimiento)
Herramientas automáticas para el equipo técnico:
● Permiten probar que las ventas, los descuentos, el código de barras y el inventario
funcionen correctamente sin tener que probar todo a mano en la pantalla cada vez
que se hace un cambio.
contexto/ y docs/ (Documentación y Requerimientos)
Respaldan el trabajo académico y operativo del proyecto:
● contexto/: Requisitos solicitados por el dueño del comercio, actas de reuniones y
análisis de arquitectura.
● docs/: Manuales de uso sencillos para los empleados del local y guías paso a paso
para instalar o reparar el sistema en caso de cambiar de computadora.
Archivos en la Raíz (Infraestructura y Ejecución)
● docker-compose.yml y Dockerfile: Permiten que el sistema y su base de datos
arranquen en cualquier computadora de manera idéntica y aislada sin instalaciones
complicadas.
● iniciar-sistema.bat: Acceso directo para que el personal de mostrador pueda
encender todo el sistema con un solo doble clic en Windows.

Codificación del Proyecto
RF-01: Gestión y CRUD de Productos
Descripción y Objetivo
Permite al Administrador del sistema dar de alta, consultar, modificar y dar de baja
lógica (active: false) artículos dentro del catálogo de Matacos Deportes. El requerimiento
resuelve la falta histórica de una base de datos centralizada de mercadería detectada
durante la etapa de licitación, donde el comercio operaba con cuadernos manuscritos y
remarcación artesanal.
El módulo provee una clasificación taxonómica estricta en tres niveles:
1. Disciplina Deportiva: Natación, Vóley, Crocs/Urbano, Fitness, Running, etc.
2. Categoría de Producto: Indumentaria, Calzado, Accesorios Deportivos,
Equipamiento.
3. Marca Comercial: Speedo, Arena, Crocs, Wilson, Dolfin, Topper, etc.
Adicionalmente, permite definir el nombre comercial, descripción enriquecida, código
de modelo del fabricante (modelCode), precio de costo de referencia (protegido por rol),
precio de venta sugerido base y galería de imágenes organizadas por orden y color.
Tecnologías, Herramientas y Librerías
● Next.js 15 (Server Actions): src/server/actions/productActions.ts y
src/server/actions/categoryActions.ts para operaciones transaccionales seguras y
reactivación de caché vía revalidatePath.
● PostgreSQL 16 & Prisma ORM 6: Modelos relacionales normalizados Product,
Discipline, Category, Brand y ProductImage con integridad referencial.
● Zod (Validación de Esquemas): CreateProductSchema y UpdateProductSchema
garantizando no negatividad de importes, unicidad de slugs y tipado estricto.
● Lucide Icons & Tailwind CSS / shadcn/ui: Componentes modales y formularios
reactivos con validación instantánea.
Archivos Involucrados en el Requerimiento
Backend & Server Actions
● src/server/actions/productActions.ts: Server Actions para creación
(createProduct), actualización (updateProduct), eliminación lógica
(deleteProduct) y consultas paginadas con filtros (getProducts,
getProductById).

● src/server/actions/categoryActions.ts: Gestión ágil de disciplinas, marcas y
categorías maestras.
Esquemas de Validación (Zod)
src/schemas/product.ts: Define CreateProductSchema, UpdateProductSchema,
DisciplineSchema, CategorySchema y BrandSchema.
Modelos y Persistencia (Prisma / PostgreSQL)
prisma/schema.prisma:
● Product: Campos name, slug, description, modelCode, costPrice, price,
active, relaciones foráneas con disciplineId, categoryId, brandId.
● Discipline, Category, Brand: Tablas maestras con name y slug indexados.
● ProductImage: Galería con url, color, isPrimary y order.
Componentes de Interfaz de Usuario (Frontend)
● src/components/dashboard/ProductFormModal.tsx: Modal reactivo para alta y
edición de producto con carga dinámica de variantes e imágenes.
● src/components/dashboard/ProductDetailView.tsx: Ficha técnica completa de
visualización de artículo, variantes y métricas de rotación.
● src/components/dashboard/MasterCategoriesManager.tsx: Administrador en
línea de marcas, categorías y disciplinas.

Flujo de Datos y Control

1. Apertura del Formulario: La interfaz solicita en paralelo la lista de marcas, disciplinas
y categorías disponibles mediante Server Actions livianas.
2. Validación Dual: Zod válida en cliente los formatos obligatorios y, al enviarse el
payload, el servidor ejecuta CreateProductSchema.parse(), impidiendo inyecciones o
datos inconsistentes.
3. Persistencia Relacional Atómica: Dentro de una transacción de Prisma, se crea la
cabecera del producto y en cascada sus variantes iniciales con stock inicial
registrado en auditoría.
4. Baja Lógica (Soft Delete): La eliminación de un producto no borra los registros
históricos para no quebrar la integridad referencial de ventas pasadas ni el libro de
movimientos de inventario (active: false).
Pruebas Realizadas
1. Precondición: Contar con al menos una disciplina (ej: Natación), una marca (ej:
Speedo) y una categoría (ej: Accesorios) dadas de alta en el sistema.
2. Paso 1: Abrir el panel de administración, pulsar en "Nuevo Producto", e ingresar
"Antiparras Mariner Pro", seleccionando marca Speedo y disciplina Natación.
3. Paso 2: Intentar guardar sin variantes asociadas. Verificar que Zod bloquee el envío
indicando: "El producto debe tener al menos una variante de talle/color".
4. Paso 3: Agregar una variante (Talle: Único, Color: Azul Humo) y guardar.
5. Resultado Esperado: El modal se cierra, la tabla de catálogo refleja el nuevo
producto con estado "Activo", y se puede consultar su ficha individual de inmediato.

Diseño del Frontend

RF-02: Gestión de Variantes de Producto
Descripción y Objetivo
Permite modelar y administrar la matriz dimensional de variantes asociadas a cada
producto de Matacos Deportes, reflejando la complejidad real de una tienda de indumentaria
y calzado deportivo donde un mismo modelo existe en múltiples talles y colores.
El requerimiento resuelve:
1. Matriz de Talles y Colores: Soporte para rangos de calzado (ej: 35 al 45),
indumentaria (ej: XS al XXL), pesos para entrenamiento (ej: 1kg, 2kg, 5kg) y
accesorios de talle único, combinados con una paleta estandarizada de colores
comerciales.
2. Identificación Unívoca: Asignación obligatoria de código SKU (Stock Keeping Unit) y
código de barras (EAN-13 estándar o interno de circulación local).
3. Precios Diferenciados y Sobreprecio: Capacidad de definir un precio de venta
específico por variante (útil cuando talles especiales o pesos mayores tienen costos
diferenciales), tomando por defecto el precio general del producto si no se
especifica.
4. Actualización Masiva y Porcentual de Precios: Módulo para aplicar variaciones
porcentuales (ej: incremento del 8.5% en toda la marca Speedo o rubro Calzado)
con redondeo automático e historial de auditoría de precios.

Tecnologías, Herramientas y Librerías
● Next.js 15 (Server Actions): src/server/actions/productActions.ts (createVariant,
updateVariant, deleteVariant) y src/server/actions/priceActions.ts
(batchUpdatePrices, getPriceHistory).
● PostgreSQL 16 & Prisma ORM 6: Modelo relacional ProductVariant y tabla histórica
PriceHistory con trazabilidad del usuario responsable y fecha del cambio.
● Zod (Validación de Esquemas): ProductVariantSchema, PriceUpdateBatchSchema y
PriceUpdateRuleSchema.
● TypeScript (Matemática Determinista): Redondeo contable a 2 decimales para
importes monetarios en ARS.
Archivos Involucrados en el Requerimiento
Backend & Server Actions
● src/server/actions/productActions.ts: Creación, edición y baja de variantes
dentro de la transacción de producto.
● src/server/actions/priceActions.ts: Actualización masiva de precios por
alcance (marca, categoría, disciplina o producto) y consulta del historial.
Esquemas de Validación (Zod)
● src/schemas/product.ts: Define ProductVariantSchema (talle, color, SKU,
barcode, stockStore, stockWarehouse, price).
● src/schemas/priceUpdate.ts: Reglas para actualización por porcentaje o
monto fijo (PriceUpdateRuleSchema).
Modelos y Persistencia (Prisma / PostgreSQL)
prisma/schema.prisma:
● ProductVariant: Atributos id, productId, size, color, sku (índice único), barcode
(indexado), price (Decimal nullable), stockStore, stockWarehouse,
minStoreStock, minStock.
● PriceHistory: Auditoría histórica con oldPrice, newPrice, percentageChange,
reason, updatedBy y createdAt.
Componentes de Interfaz de Usuario (Frontend)
● src/components/dashboard/ProductFormModal.tsx: Grilla interactiva de
definición de variantes por talle/color con autogeneración de SKUs.
● src/components/dashboard/BatchPriceUpdateModal.tsx: Modal de simulación
y aplicación masiva de aumentos/descuentos con vista previa del impacto
financiero.

● src/components/dashboard/PriceHistoryModal.tsx: Visor cronológico de
variaciones de precios para auditoría y control de márgenes.
Flujo de Datos y Control
Detalle del Flujo de Control
1. Generación Predictiva de SKU: Al tipear talle y color en la interfaz, el sistema
propone automáticamente un formato estandarizado (ej: SPE-ANT-AZU-UNI).
2. Prioridad de Precios: Al momento de consultar el precio de un artículo (tanto
en POS como en catálogo), la regla de negocio evalúa: variante.price ??
producto.price.
3. Persistencia Histórica Inmutable: Toda modificación de precios que supere $
0 genera un registro en PriceHistory, asegurando que no se pierda la
trazabilidad ante aumentos inflacionarios.
Pruebas Realizadas
1. Precondición: Existe un producto "Gorra Natación Silicona" con precio base de $
12.000,00 y dos variantes: Color Negro y Color Dorado.
2. Paso 1: Asignar a la variante "Color Dorado" un precio específico de $ 14.500,00,
dejando la variante "Color Negro" con precio vacío.
3. Paso 2: Verificar en el mostrador del POS que al escanear la variante Negra se
cobre $ 12.000,00 y al escanear la variante Dorada se cobre $ 14.500,00.

4. Paso 3: Aplicar una actualización masiva del 10% sobre la categoría Natación con
motivo "Ajuste inflacionario".
5. Resultado Esperado: La variante Negra se actualiza a $ 13.200,00 y la Dorada a $
15.950,00. El modal de historial refleja ambos movimientos con fecha y usuario
responsable.
Diseño del Frontend

RF-03: Control de Stock y Movimientos
Descripción y Objetivo
Permite administrar de forma unificada, atómica y en tiempo real el inventario de
Matacos Deportes, implementando una arquitectura de Stock Dual Diferenciado por
ubicación física en Saavedra 241:
1. Stock en Salón / Mostrador (stockStore): Unidades físicas exhibidas en las
estanterías del local listas para la venta presencial inmediata.
2. Stock en Depósito Central (stockWarehouse): Unidades almacenadas en el depósito
de reserva del local, destinadas a la reposición de salón o al despacho de pedidos
de e-commerce.
3. Stock Reservado (stockReserved): Unidades congeladas preventivamente durante
una preventa activa de mostrador (RF-07) o un checkout web en curso, impidiendo
sobreventas concurrentes.
El requerimiento proporciona un Libro Diario de Movimientos de Inventario inmutable
(InventoryMovement) que audita cada modificación de stock categorizada en 9 tipos de
eventos obligatorios, requiriendo justificación contable para ajustes y devoluciones, y
soportando transferencias internas y cambios de talle simultáneos.
Tecnologías, Herramientas y Librerías
● Next.js 15 (Server Actions): src/server/actions/inventoryActions.ts
(recordInventoryMovement, transferStockBetweenLocations, processSizeExchange,
getInventoryMovements).
● PostgreSQL 16 & Prisma ORM 6: Transacciones ACID con prisma.$transaction y
bloqueo de registros para garantizar consistencia estricta en decrementos e
incrementos cruzados.
● Zod (Validación de Esquemas): InventoryMovementSchema, StockTransferSchema
y SizeExchangeSchema.
● Control de Concurrencia: Verificación estricta de saldo positivo (stockStore - quantity
>= 0) antes de confirmar cualquier egreso.
Archivos Involucrados en el Requerimiento
Backend & Server Actions
● src/server/actions/inventoryActions.ts: Lógica de negocio para registro de
movimientos manuales, transferencias de depósito a salón, cambios de talle y
auditoría.

Esquemas de Validación (Zod)
● src/schemas/inventory.ts:
○ MovementTypeEnum: Tipos de eventos admitidos (INGRESO_INICIAL,
INGRESO_COMPRA, VENTA_MOSTRADOR, VENTA_WEB,
DEVOLUCION_CLIENTE, ANULACION_VENTA, AJUSTE_INGRESO,
AJUSTE_EGRESO, TRANSFERENCIA_INTERNA).
○ InventoryMovementSchema: Validación de cantidades enteras positivas,
ubicación objetivo (STORE | WAREHOUSE) y justificación obligatoria en
mermas o ajustes.
○ StockTransferSchema: Validación de traslados de reposición.
○ SizeExchangeSchema: Validación de cambios de talle (impide cambiar una
variante por sí misma).
Modelos y Persistencia (Prisma / PostgreSQL)
● prisma/schema.prisma:
○ ProductVariant: Campos stockStore, stockWarehouse, stockReserved,
minStoreStock, minStock.
○ InventoryMovement: Tabla inmutable con variantId, type, quantity, location,
reason, userId, previousStockStore, newStockStore,
previousStockWarehouse, newStockWarehouse, createdAt.
Componentes de Interfaz de Usuario (Frontend)
● src/components/dashboard/InventoryView.tsx: Panel integral con visualización en
dos columnas de existencias (Salón vs Depósito) y totalizador.
● src/components/dashboard/StockMovementModal.tsx: Modal para ingresar compras
o registrar mermas.
● src/components/dashboard/StockAdjustmentModal.tsx: Modal de ajuste rápido por
conteo físico con motivo obligatorio.
● src/components/dashboard/StockMovementHistoryView.tsx: Visor cronológico del
libro de auditoría de movimientos con filtros por tipo de evento y variante.

Flujo de Datos y Control
Detalle del Flujo de Control y Reglas de Negocio
1. Validación de Motivo: Todo movimiento de tipo AJUSTE_EGRESO,
AJUSTE_INGRESO o DEVOLUCION_CLIENTE exige un texto descriptivo no vacío
en el campo reason (ej: "Conteo de inventario quincenal" o "Ticket #083-00012457").
2. Cambio de Talle 1 a 1: Al procesar un cambio de talle (processSizeExchange), el
sistema ejecuta en la misma transacción:
a. Incremento de 1 unidad en la variante devuelta (DEVOLUCION_CLIENTE).
b. Decremento de 1 unidad en la variante entregada (VENTA_MOSTRADOR o
CAMBIO_TALLE).
c. Generación cruzada de los dos movimientos en el libro de auditoría.
3. Cálculo de Stock Disponible: La cantidad real disponible para la venta inmediata en
mostrador se evalúa mediante:
𝑆𝑡𝑜𝑐𝑘𝐷𝑖𝑠𝑝𝑜𝑛𝑖𝑏𝑙𝑒𝑀𝑜𝑠𝑡𝑟𝑎𝑑𝑜𝑟 = 𝑠𝑡𝑜𝑐𝑘𝑆𝑡𝑜𝑟𝑒 − 𝑠𝑡𝑜𝑐𝑘𝑅𝑒𝑠𝑒𝑟𝑣𝑒𝑑
Pruebas Realizadas
1. Precondición: Una variante tiene 2 unidades en Salón y 10 en Depósito.
2. Paso 1: Intentar registrar un egreso manual de 3 unidades en Salón. Verificar que el
sistema rechace la operación por saldo insuficiente (stockStore < quantity).
3. Paso 2: Ejecutar una transferencia interna de 4 unidades desde Depósito hacia
Salón.
4. Resultado Esperado: Salón pasa a 6 unidades y Depósito a 6 unidades. El historial
registra un evento TRANSFERENCIA_INTERNA de 4 unidades.
5. Paso 3: Intentar hacer un ajuste manual sin escribir motivo. Verificar que Zod
bloquee el botón indicando "Debe especificar el motivo o ticket para este tipo de
movimiento".

Diseño del Frontend

RF-04: Carga Inicial Progresiva de Stock
Descripción y Objetivo
Permite la digitalización e importación masiva de artículos, variantes, precios y
existencias en Matacos Deportes a través de planillas tabulares Excel (.xlsx) y archivos CSV
normalizados.
El requerimiento resuelve el cuello de botella crítico de la puesta en marcha inicial
del sistema y el reabastecimiento recurrente de mercadería proveniente de distribuidores
oficiales (Speedo, Wilson, Arena, Topper):
1. Resolución de Entidades al Vuelo: Si la disciplina, marca o categoría especificada en
una fila de la planilla no existe aún en la base de datos, el procesador la da de alta
automáticamente con su nombre y slug canónico.
2. Tres Modos de Ingestión Configurables:
○ CREATE_ONLY: Modo seguro para altas iniciales; rechaza la fila si el
producto o código de barras ya existe para prevenir duplicaciones
accidentales.
○ ACCUMULATE_STOCK: Modo estándar para reabastecimiento periódico de
mercadería; si el producto y la variante ya existen, suma el stock ingresado a
las existencias existentes (stockStore y stockWarehouse) y genera el
movimiento de auditoría INGRESO_COMPRA.
○ OVERWRITE: Modo de sincronización integral; actualiza nombres,
descripciones y precios sobreescribiendo los valores previos.
3. Resiliencia y Prevalidación: Valida íntegramente el archivo antes de impactar en la
base de datos, reportando los números de fila específicos que contengan
inconsistencias o campos faltantes.
Tecnologías, Herramientas y Librerías
● Next.js 15 (Server Actions): src/server/actions/bulkImportActions.ts
(validateBulkImportBatch, processBulkImport).
● Librería de Ingestión Tabular (xlsx): Procesamiento en memoria de buffers binarios
de libros de cálculo y streams tabulares sin persistencia temporal en disco.
● PostgreSQL 16 & Prisma ORM 6: Inserciones en lotes optimizadas
(prisma.$transaction) con mapeo en memoria de marcas y categorías para reducir
los accesos a disco.
● Zod (Validación de Esquemas): BulkImportPayloadSchema, BulkProductItemSchema
y BulkVariantItemSchema.

Archivos Involucrados en el Requerimiento
Backend & Server Actions
● src/server/actions/bulkImportActions.ts: Orquestador de la validación por lotes,
resolución taxonómica, desduplicación por SKU/barcode e ingestión atómica.
Esquemas de Validación (Zod)
● src/schemas/bulkImport.ts:
○ BulkImportModeEnum: "CREATE_ONLY" | "ACCUMULATE_STOCK" |
"OVERWRITE".
○ BulkProductItemSchema: Reglas de validación para producto padre (nombre,
disciplina, categoría, marca, precio de lista).
○ BulkVariantItemSchema: Reglas de validación para talle, color, SKU, código
de barras y stock dual inicial.
○ BulkImportResultSchema: Contrato de respuesta con métricas de productos
creados, variantes actualizadas y log de advertencias.
Modelos y Persistencia (Prisma / PostgreSQL)
● prisma/schema.prisma: Modelos Product, ProductVariant, Discipline, Category,
Brand e InventoryMovement.
Componentes de Interfaz de Usuario y Plantillas
● src/components/dashboard/BulkImportModal.tsx: Interfaz de arrastrar y soltar (drag
& drop) de archivos .xlsx y .csv, selector de modo de importación, barra de progreso
y visualizador de errores.
● docs/rf-04-especificacion-tecnica-carga-stock.md: Especificación técnica exhaustiva
del requerimiento.
● docs/ESTRUCTURA_PLANTILLA_EXCEL.md: Guía de columnas y formatos
requeridos para el usuario.
● docs/plantilla_carga_stock_matacos.xlsx: Plantilla oficial de carga distribuida a los
encargados del local.

Flujo de Datos y Control

Detalle del Flujo de Control y Desduplicación
1. Normalización de Texto: Los nombres de marcas y disciplinas se limpian de espacios
sobrantes y se capitalizan formalmente (ej: " speedo " → "Speedo").
2. Generación Automática de Variantes: Si en la planilla se repite el mismo nombre de
producto con distintos talles y colores, el motor los consolida automáticamente bajo
un único registro de Product y múltiples registros hijos en ProductVariant.
3. Trazabilidad de Movimientos: En modo ACCUMULATE_STOCK, cada fila que
incrementa existencias genera de forma automática un registro en
InventoryMovement con el tipo INGRESO_COMPRA y motivo "Carga masiva por
planilla Excel".
Pruebas Realizadas
1. Precondición: Descargar la plantilla oficial docs/plantilla_carga_stock_matacos.xlsx.
2. Paso 1: Completar 3 filas con una disciplina nueva no existente en el sistema (ej:
"Crossfit") y una marca nueva (ej: "Reebok"), con 2 talles distintos del mismo
modelo.
3. Paso 2: Arrastrar el archivo en el modal de importación seleccionando el modo
"Acumular Stock".
4. Resultado Esperado: El sistema valida la estructura sin errores, da de alta la
disciplina "Crossfit" y la marca "Reebok", crea el producto padre con sus dos
variantes y suma las existencias en stockStore. El panel de inventario refleja los
nuevos artículos inmediatamente.

Diseño del Frontend

RF-05: Generador e Impresión de Etiquetas con Código de Barra
Descripción y Objetivo
Resuelve la problemática operativa detectada en Matacos Deportes respecto a los
artículos que ingresan al comercio sin código de barras de fábrica (prendas de indumentaria
textil suelta, accesorios de natación, vendas, bucales o pesas de gimnasio).
El requerimiento provee:
1. Generador Determinista de Códigos EAN-13 Internos: Emplea el estándar
internacional GS1 con prefijo 200 (reservado mundialmente para circulación interna
dentro de comercios / Restricted Circulation Numbers), garantizando que los códigos
generados jamás colisionen con artículos comerciales de marcas internacionales ni
requieran compra de rangos GS1 adicionales.
2. Cálculo Oficial Módulo 10: Calcula el dígito verificador número 13 mediante el
algoritmo oficial ponderado de GS1:

3. Módulo de Renderizado SVG: Dibuja los patrones de barras normalizados en
pantalla y en formatos vectoriales sin pérdida de calidad.
4. Impresión Térmica de Etiquetas Autoadhesivas: Formato optimizado para
impresoras térmicas de etiquetas (50x30mm o rollos continuos de 80mm) con
nombre del producto, marca, disciplina, talle, color, SKU, precio formateado en ARS
y código de barras legible con escáner USB.
Tecnologías, Herramientas y Librerías
● Algoritmo GS1 Módulo 10 Puro: Módulo matemático TypeScript en
src/lib/barcodeGenerator.ts (calculateEan13CheckDigit, validateEan13).
● Next.js 15 (Server Actions): src/server/actions/barcodeActions.ts
(generateInternalBarcode, generateBarcodeBatch, assignBarcodeToVariant,
getPrintLabelsPayload).
● Zod (Validación de Esquemas): GenerateBarcodesSchema,
AssignBarcodeToVariantSchema y PrintLabelsPayloadSchema.
● PostgreSQL 16 & Prisma ORM 6: Campo indexado ProductVariant.barcode con
verificación de unicidad para evitar duplicados en el mostrador.
Archivos Involucrados en el Requerimiento
Lógica Pura y Generador
● src/lib/barcodeGenerator.ts: Algoritmo de cálculo de dígito verificador, formateo de
etiquetas térmicas y constante GS1_INTERNAL_PREFIX = "200".
Backend & Server Actions
● src/server/actions/barcodeActions.ts: Server Actions para asignación directa a
variantes, creación de lotes no asignados y preparación de cargas de impresión.

Esquemas de Validación (Zod)
● src/schemas/barcode.ts: Esquemas de validación de cantidad de copias de etiquetas
(1 a 100), prefijos numéricos de 3 dígitos y validación estricta de códigos EAN-13 o
Code-128.
Modelos y Persistencia (Prisma / PostgreSQL)
● prisma/schema.prisma: ProductVariant.barcode (tipo String, indexado para
búsquedas rápidas en POS).
Componentes de Interfaz de Usuario (Frontend)
● src/components/dashboard/BarcodeSvg.tsx: Componente visual que renderiza las
barras y números del código en pantalla con alta nitidez.
● src/components/dashboard/ThermalLabelPrintModal.tsx: Modal de configuración de
impresión de etiquetas con vista previa en vivo, selección de número de copias por
talle/color y disparo a impresora de etiquetas.
Flujo de Datos y Control
Detalle del Flujo de Control y Compatibilidad con Hardware
1. Garantía Anticolisión: El generador verifica en la base de datos que el código
numérico de 13 dígitos resultante no esté ya asignado a otra variante antes de
confirmarlo.
2. Compatibilidad con Lectores USB: Al cumplir con el estándar EAN-13, cualquier
lector de pistola láser o escáner omnidireccional USB decodifica instantáneamente el
código emulando teclado sin requerir configuración adicional de firmware.
3. Formato Térmico Compacto: El layout CSS @media print oculta encabezados del
navegador, suprime márgenes y ajusta el tamaño a las dimensiones de etiquetas
estándar de poliamida o papel térmico autoadhesivo.

Pruebas Realizadas
1. Precondición: Tener una variante creada sin código de barras asociado.
2. Paso 1: En la tabla de inventario, presionar el botón "Generar Etiqueta" sobre la
variante.
3. Paso 2: Verificar que se genere un código de 13 dígitos que comience con 200 y
cuyo último dígito satisfaga el algoritmo Módulo 10.
4. Paso 3: Abrir el modal de impresión, seleccionar 2 copias y disparar la vista previa
de impresión.
5. Resultado Esperado: La etiqueta muestra el nombre del producto, talle, color, precio
con formato $ XX.XXX,XX y el código de barras legible. Al escanear con la pistola
USB en el buscador del POS (RF-07), el producto se carga de forma inmediata (<
50ms).
Diseño del Frontend
RF-06: Alertas de Stock Mínimo y Productos Agotados
Descripción y Objetivo
Permite a los administradores y encargados de Matacos Deportes monitorear en
tiempo real los niveles de existencias del inventario comercial para prevenir quiebres de
stock en el salón de Saavedra 241 y optimizar la planificación de compras a proveedores.

El requerimiento resuelve:
1. Clasificación Semántica en 5 Niveles de Alerta:
○ OUT_OF_STOCK: Stock total igual a cero (agotado total en salón y depósito;
quiebre inminente).
○ CRITICAL_LOW: Stock total menor o igual al umbral mínimo global
(minStock); alerta prioritaria para emisión de orden de compra a proveedores.
○ STORE_EMPTY_WAREHOUSE_AVAIL: Salón de ventas con stock cero
(stockStore == 0), pero con existencias disponibles en depósito central
(stockWarehouse > 0); alerta crítica de reposición inmediata a mostrador.
○ STORE_REPLENISHMENT: Salón de ventas por debajo del umbral mínimo
(stockStore <= minStoreStock), pero con unidades en depósito; alerta
preventiva de reposición interna.
○ NORMAL: Existencias suficientes tanto en mostrador como en depósito.
2. Supresión de Falsas Alarmas: Algoritmo que discrimina si una prenda que falta en la
estantería del salón realmente requiere una compra externa o si simplemente
amerita un traslado interno desde el depósito (RF-03).
3. Umbrales Configurables por Alcance: Permite fijar mínimos globales (minStock) y de
mostrador (minStoreStock) a nivel de Categoría, Producto o individualmente por
Variante.
Tecnologías, Herramientas y Librerías
● Next.js 15 (Server Actions & Route Handlers):
○ Server Actions en src/server/actions/stockAlertActions.ts
(getStockAlertsSummary, getStockAlertsList, configureStockThresholds).
○ Endpoint REST GET /api/stock/alerts para polling ligero o paneles
informativos secundarios.
● PostgreSQL 16 & Prisma ORM 6: Consultas optimizadas con filtros de agregación y
conteos en memoria para mantener tiempos de respuesta < 50ms.
● Zod (Validación de Esquemas): StockAlertsQuerySchema y
ConfigureStockThresholdSchema.
● Zustand & Lucide Icons: Notificaciones dinámicas en el panel de control con
indicadores visuales de colores (Rojo: Crítico / Naranja: Reposición / Verde: Óptimo).

Archivos Involucrados en el Requerimiento
Backend & Server Actions
● src/server/actions/stockAlertActions.ts: Server Actions para cálculo en tiempo real de
métricas, clasificación semántica de variantes y ajuste de umbrales en cascada.
● src/app/api/stock/alerts/route.ts: Endpoint Route Handler para consulta pública o
sincronización ligera.
Esquemas de Validación (Zod)
● src/schemas/stockAlerts.ts:
○ StockAlertLevelEnum: Definición exhaustiva de los 5 estados de alerta.
○ StockAlertFilterEnum: Filtros de panel (ALL, OUT_OF_STOCK,
CRITICAL_LOW, STORE_REPLENISHMENT).
○ ConfigureStockThresholdSchema: Reglas para actualizar minStock y
minStoreStock por alcance (CATEGORY, PRODUCT, VARIANT).
Modelos y Persistencia (Prisma / PostgreSQL)
● prisma/schema.prisma:
○ ProductVariant: Campos minStoreStock (mínimo salón, default 1) y minStock
(mínimo total, default 2).
Componentes de Interfaz de Usuario (Frontend)
● src/components/dashboard/StockAlertsDrawer.tsx: Panel lateral desplegable
(Drawer) accesible desde la barra superior, con lista de artículos en riesgo, botón de
"Reponer a Salón" directo y selector de filtros rápidos.
● src/components/dashboard/KpiCard.tsx: Tarjetas métricas superiores con badges de
conteo en tiempo real (ej: "4 variantes críticas").

Flujo de Datos y Control
Detalle del Flujo de Control y Acción Directa
1. Acción en un Clic desde el Drawer: Cuando una variante cae en
STORE_EMPTY_WAREHOUSE_AVAIL o STORE_REPLENISHMENT, el panel
lateral ofrece un botón directo que abre el modal de transferencia interna (RF-03),
precargando la cantidad sugerida para llenar el salón hasta el umbral de seguridad.
2. Propagación en Cascada de Umbrales: Si un administrador ajusta el stock mínimo a
nivel de "Categoría: Calzado" a 3 unidades, el sistema actualiza en un único lote
todas las variantes pertenecientes a dicha categoría que no tengan una
configuración específica previa.

Pruebas Realizadas
1. Precondición: Existe una variante con stockStore = 0, stockWarehouse = 8,
minStoreStock = 2 y minStock = 4.
2. Paso 1: Abrir el panel de control y pulsar el ícono de campana en el encabezado
para desplegar el StockAlertsDrawer.
3. Paso 2: Verificar que la variante se clasifique con la etiqueta "Reposición a Salón
Urgente" (STORE_EMPTY_WAREHOUSE_AVAIL) y no como "Agotado Total".
4. Paso 3: Pulsar el botón de acción rápida "Reponer a Salón", transferir 3 unidades
desde el modal y volver al panel.
5. Resultado Esperado: La variante pasa a tener 3 unidades en salón y 5 en depósito,
cambiando su estado a NORMAL y desapareciendo de la lista de reposición urgente.

Diseño del Frontend

RF-07: Búsqueda Ágil en Mostrador
Descripción y Objetivo
Permite al vendedor en el salón de ventas (Terminal 1) y al cajero en el mostrador
(Terminal 2) buscar y cargar productos de forma ultrarrápida (tiempo de respuesta < 50 ms),
soportando tanto la lectura instantánea de códigos de barras mediante lectores USB
(emulación teclado) como la búsqueda predictiva por texto (nombre de producto, marca,
categoría, SKU, talle o color).
El objetivo principal es eliminar los cuellos de botella en la atención física de
Saavedra 241: el vendedor escanea las prendas mientras el cliente se las prueba y congela
el pedido como preventa (Ticket #042 - Juan), reservando el stock de forma preventiva
(stockReserved) en la base de datos para impedir sobreventas con la web o con otra
terminal.
Tecnologías, Herramientas y Librerías
● Next.js 15 (Route Handlers & Server Actions): Endpoint liviano GET /api/pos/search
para lecturas de alta frecuencia y Server Action createPendingSale para
transacciones atómicas de reserva.
● PostgreSQL 16 & Prisma ORM 6: Consultas optimizadas con proyección estricta
(select acotado de campos esenciales) evitando joins innecesarios; transacciones
ACID (prisma.$transaction) con incremento atómico de reservas.
● Zod (Validación de Esquemas): Esquema CreatePendingSaleSchema para
garantizar la integridad y no negatividad de los datos ingresados en el carrito de
preventa.

● Performance API (Nativa de Node.js / Web): Medición de latencia en milisegundos
inyectada en las cabeceras HTTP Server-Timing para auditar el cumplimiento del
RNF de respuesta ágil.
Archivos Involucrados en el Requerimiento
● src/app/api/pos/search/route.ts: Endpoint GET optimizado para escaneo de códigos
de barra USB y búsqueda predictiva con respuesta JSON mínima.
● src/server/actions/posSaleActions.ts: Server Actions para la creación de preventas
(createPendingSale), consulta de cola de espera en caja (getPendingSales) y
cancelación con liberación de reservas (cancelPendingSale).
Flujo de Datos y Control
Detalle del Flujo de Control
1. Detección USB o Predictiva: El lector USB emula teclado y envía el código de barras
seguido de un Enter. El endpoint /api/pos/search evalúa si hay coincidencia unívoca
en barcode o sku. Si existe, devuelve el ítem en menos de 20 ms con el cálculo
stockAvailable = stockStore - stockReserved.
2. Validación de Disponibilidad: createPendingSale comprueba que la cantidad
solicitada no supere el stock real en mostrador disponible en ese instante.
3. Reserva Atómica: Se incrementa el contador stockReserved de cada variante dentro
de una transacción PostgreSQL, bloqueando que el stock sea vendido
concurrentemente por la tienda web o por otra notebook.
4. Generación de Ticket Corto: Se cuenta la cantidad de preventas generadas en el día
en curso para emitir un identificador amigable correlativo (ej: #001, #002... #042).

5. Visibilidad Inmediata: La terminal de caja consulta las ventas con status:
"PENDIENTE_PAGO" ordenadas por antigüedad (FIFO), permitiendo al cajero abrir
directamente el pedido escaneando o ingresando el número #042.
Pruebas Realizadas
Prueba 1: Búsqueda Ágil y Respuesta en < 50ms
1. Precondición: Servidor Next.js y base de datos PostgreSQL activos con catálogo
cargado.
2. Paso 1: Enviar petición GET /api/pos/search?q=Crocs y verificar tiempo de
respuesta en encabezado Server-Timing.
3. Paso 2: Enviar petición con código de barras exacto GET
/api/pos/search?q=779123456701.
4. Resultado Esperado: Retorno en formato JSON ultraliviano con exactMatch: true
para código de barras en menos de 30 ms, y lista de hasta 20 resultados con orden
de stock para texto libre.
Prueba 2: Reserva Preventiva de Stock
1. Precondición: Identificar un producto con stockStore = 8 y stockReserved = 0.
2. Paso 1: Invocar createPendingSale solicitando 1 unidad para el cliente "Juan Test".
3. Resultado Esperado:
○ La venta se crea con estado PENDIENTE_PAGO y código correlativo (ej:
#001).
○ La variante en la base de datos pasa a tener stockReserved = 1.
○ La búsqueda ágil subsiguiente muestra stockAvailable = 7.
Prueba 3: Cola de Espera en Caja y Cancelación
1. Paso 1: Ejecutar getPendingSales() y verificar que el ticket #001 figure en la lista con
su detalle completo.
2. Paso 2: Invocar cancelPendingSale(saleId).
3. Resultado Esperado:
○ La venta pasa a estado CANCELADA.
○ El stock reservado vuelve a stockReserved = 0, quedando inmediatamente
disponible nuevamente para salón.

Diseño del Frontend
RF-08: Aplicación de Descuentos Manuales en Puntos de Venta
Descripción y Objetivo
Permite a los operadores comerciales en el salón de ventas (Terminal 1) y en el
mostrador de cobranza (Terminal 2) aplicar bonificaciones y descuentos manuales de
manera flexible y segura. El sistema admite dos modalidades combinables:
1. Descuento por Ítem / Renglón: Aplicable a un producto específico, ya sea como un
porcentaje (PERCENTAGE, ej: 10%, 20%) o como una rebaja fija en pesos (FIXED,
ej: $ 5.000,00).
2. Descuento Global sobre el Ticket: Aplicable sobre el subtotal resultante de la venta
(ej: 10% por pago en efectivo o promoción especial de fin de semana).
El objetivo es dotar de agilidad al mostrador de Saavedra 241 para cerrar ventas
complejas o promociones personalizadas, blindando las operaciones contra errores
humanos (como descuentos mayores al 100% o importes que generen totales negativos) y
manteniendo una trazabilidad contable exacta entre el precio de lista original y el precio
efectivamente cobrado.

Tecnologías, Herramientas y Librerías
● TypeScript (Modo Estricto): Módulo matemático determinista src/lib/discounts.ts con
redondeo a 2 decimales en cada etapa para evitar discrepancias de centavos por
coma flotante IEEE-754.
● Zod (Validación de Esquemas): DiscountSchema para validar tipos admitidos
(PERCENTAGE, FIXED), rangos porcentuales válidos (0 a 100%) y montos
estrictamente positivos.
● PostgreSQL 16 & Prisma ORM 6: Persistencia atómica de auditoría en SaleItem
(originalPrice, discount, discountType, discountValue, unitPrice, subtotal) y en Sale
(subtotalGross, discount, total).
● Server Actions de Next.js 15: updatePendingSale (rebalanceo atómico de stock
reservado ante cambios de prendas o descuentos en caja) y previewSaleTotals
(simulación reactiva para el frontend).
Archivos Involucrados en el Requerimiento
Módulo de Cálculo y Lógica Pura
● src/lib/discounts.ts: Funciones calculateItemDiscount y calculateSaleTotals,
diseñadas para ser consumidas tanto en el backend como en el store de Zustand del
frontend.
Esquemas de Validación (Zod)
● src/schemas/sale.ts:
○ DiscountTypeEnum: "PERCENTAGE" | "FIXED".
○ DiscountSchema: Validación de reglas de no negatividad y techo del 100%.
○ UpdatePendingSaleSchema: Esquema para modificar prendas y descuentos
en mostrador antes del cobro.
Server Actions (Backend)
● src/server/actions/posSaleActions.ts:
○ createPendingSale: Genera la preventa en salón aplicando los descuentos
validados y reservando stock.
○ updatePendingSale: Modifica ítems y descuentos en caja, reajustando
automáticamente las unidades reservadas (stockReserved).
○ previewSaleTotals: Expone el cálculo de totales en tiempo real para la
interfaz de usuario.

Persistencia y Modelos (Prisma)
● prisma/schema.prisma: Modelos Sale, SaleItem y enum DiscountType.
Flujo de Datos y Control

Detalle del Flujo de Control y Rebalanceo de Stock
1. Validación de Límites: Si el usuario ingresa un porcentaje mayor a 100%, Zod y la
función pura lo restringen al 100%. Si se ingresa un monto fijo mayor al precio del
producto, el descuento se acota exactamente al precio de lista, garantizando que
unitPrice >= 0.
2. Descuento en Cascada:
○ Primero se aplican los descuentos individuales sobre cada producto.
○ El descuento global sobre el ticket se calcula sobre el subtotal neto resultante
de los ítems, no sobre el importe bruto inflado.
3. Edición Previa en Caja (updatePendingSale):
○ Si el cliente en caja decide cambiar el talle, agregar una prenda o solicitar un
descuento extra por pago contado, el cajero edita el ticket.
○ El backend compara la diferencia de cantidades de cada variante entre el
ticket anterior y el nuevo: si una prenda aumentó en 1 unidad, verifica stock
en mostrador e incrementa stockReserved + 1; si disminuyó, decrementa
stockReserved - 1.
○ Se reemplazan atómicamente los SaleItem y se actualiza la cabecera Sale
con los nuevos importes.
Pruebas Realizadas
Prueba 1: Descuento Porcentual por Ítem
1. Precondición: Producto con precio de lista de $ 58.000,00.
2. Paso 1: Aplicar descuento del 15% sobre el ítem.
3. Resultado Esperado:
○ Descuento unitario: $ 8.700,00.
○ Precio unitario resultante: $ 49.300,00.
○ Si se compran 2 unidades, el subtotal de línea debe ser exactamente $
98.600,00.
Prueba 2: Descuento Fijo y Protección contra Negativos
1. Paso 1: Intentar aplicar un descuento fijo de $ 70.000,00 sobre un artículo de $
58.000,00.
2. Resultado Esperado:
○ El descuento unitario se limita a $ 58.000,00.
○ El precio unitario queda en $ 0,00.
○ El total nunca arroja saldo negativo.

Prueba 3: Descuentos Combinados (Ítem + Global)
1. Paso 1: Cargar 2 unidades de $ 20.000 con 10% desc ($ 36.000) y 1 unidad de $
40.000 con $ 5.000 fijo ($ 35.000). Subtotal = $ 71.000,00.
2. Paso 2: Aplicar descuento global del 10% adicional.
3. Resultado Esperado:
○ Descuento global: $ 7.100,00.
○ Total Neto final: $ 63.900,00.
○ Descuento total registrado: $ 16.100,00.
Prueba 4: Rebalanceo de Stock Reservado en Caja
1. Paso 1: Crear preventa con 2 unidades de la Variante A (stockReserved += 2).
2. Paso 2: Mediante updatePendingSale, reducir la Variante A a 1 unidad y agregar 1
unidad de la Variante B.
3. Resultado Esperado:
○ La Variante A pasa a tener stockReserved - 1.
○ La Variante B pasa a tener stockReserved + 1.
○ Los totales del ticket se recalculan y actualizan en la base de datos sin
duplicar transacciones.

Diseño del Frontend

RF-09: Cobro con Varios Medios de Pago y Cálculo de Vuelto
Descripción y Objetivo
Permite al operador de la caja (Terminal 2 en Saavedra 241) concretar la venta
cobrando el importe neto total mediante la combinación simultánea de múltiples medios de
pago admitidos en el comercio:
● Efectivo: Con ingreso del monto abonado por el cliente y cálculo automático e
instantáneo del vuelto a entregar.
● Tarjetas de Débito y Crédito (Posnet): Con registro del nombre de la tarjeta, número
de cupón de la terminal y cantidad de cuotas.
● QR Mercado Pago y Transferencias Bancarias: Con captura del número de
comprobante o código de referencia de la operación.
El objetivo es agilizar la atención en mostrador eliminando errores humanos de
cálculo manual de vuelto y dotar al negocio de una conciliación financiera fidedigna para el
arqueo de caja (RF-11), vinculando cada cobro de forma atómica con la baja definitiva del
stock en salón de ventas y la liberación de la reserva preventiva.
Tecnologías, Herramientas y Librerías
● Next.js 15 (Server Actions): completePendingSale (para cerrar preventas de salón) y
createDirectSale (para ventas express de mostrador).
● PostgreSQL 16 & Prisma ORM 6: Transacción ACID (prisma.$transaction) que
descuenta definitivamente stockStore, libera stockReserved, registra la auditoría en
InventoryMovement (VENTA_MOSTRADOR) y crea los renglones en SalePayment.
● Zod (Validación de Pagos): CompletePendingSaleSchema y SalePaymentSchema
para asegurar que los importes ingresados cubran exactamente el total de la venta
(tolerancia estricta de $ 0,05 por redondeo decimal) y que los billetes entregados en
efectivo cubran el monto a imputar.
Archivos Involucrados en el Requerimiento
Backend & Server Actions
● src/server/actions/posSaleActions.ts: Funciones completePendingSale (cobro de
preventa en caja) y createDirectSale (cobro directo de mostrador).
Esquemas de Validación (Zod)
● src/schemas/sale.ts:

○ PaymentMethodEnum: "EFECTIVO" | "DEBITO" | "CREDITO" |
"TRANSFERENCIA" | "QR_MERCADOPAGO".
○ SalePaymentSchema: Validación de montos, monto entregado
(receivedAmount), vuelto (change), marca de tarjeta (cardBrand), cupón
(cardVoucher) y referencia (referenceCode).
○ CompletePendingSaleSchema: Validación del payload de confirmación de
cobranza.
Persistencia y Modelos (Prisma)
● prisma/schema.prisma:
○ Sale: Cambio de estado a COMPLETADA, asignación de cashierId,
cashShiftId y generación de invoiceNumber (ej: TKT-98034586).
○ SalePayment: Registro discriminado de cada medio de pago asociado a la
venta.
○ ProductVariant: Actualización atómica de stockStore y stockReserved.
○ InventoryMovement: Creación del movimiento VENTA_MOSTRADOR.
Flujo de Datos y Control
Detalle del Flujo de Control
1. Validación de Pagos: El sistema suma el importe de todos los medios de pago
ingresados. Si la suma es inferior al total neto de la venta (fuera del margen de
tolerancia de $ 0,05), rechaza la operación informando la diferencia faltante.
2. Cálculo de Vuelto en Efectivo: Si el método es EFECTIVO y se especifica
receivedAmount, el backend calcula:
3. 𝑐ℎ𝑎𝑛𝑔𝑒 = max(0,𝑟𝑒𝑐𝑒𝑖𝑣𝑒𝑑𝐴𝑚𝑜𝑢𝑛𝑡 − 𝑎𝑚𝑜𝑢𝑛𝑡)

4. Este valor queda registrado en la base de datos para la posterior conciliación de
efectivo en el arqueo de caja (RF-11).
5. Transacción Atómica de Inventario:
○ Se descuenta definitivamente la cantidad física del salón: stockStore -=
quantity.
○ Se libera la reserva preventiva que se había congelado en la preventa:
stockReserved -= quantity.
○ Se inserta un registro en InventoryMovement con tipo
"VENTA_MOSTRADOR", garantizando la trazabilidad histórica del stock.
6. Cierre de Venta: La venta cambia su estado de "PENDIENTE_PAGO" a
"COMPLETADA", se le asigna el cajero responsable y el número definitivo de
comprobante, saliendo automáticamente de la cola de pedidos pendientes de la
caja.
Pruebas Realizadas
Prueba 1: Rechazo por Fondos Insuficientes
1. Precondición: Venta pendiente con total neto de $ 104.400,00.
2. Paso 1: Intentar cobrar ingresando un único pago en efectivo por $ 52.200,00.
3. Resultado Esperado: La Server Action rechaza la operación con el mensaje
explicativo: "Los pagos ingresados ($ 52200.00) no cubren el total de la venta ($
104400.00)". El stock permanece reservado y la venta sigue pendiente.
Prueba 2: Cobro Mixto y Cálculo Automático de Vuelto
1. Paso 1: Registrar Pago 1: Débito por $ 52.200,00 con tarjeta "Visa Débito" y cupón
"009841".
2. Paso 2: Registrar Pago 2: Efectivo por $ 52.200,00, ingresando un billete entregado
de $ 57.200,00.
3. Resultado Esperado:
○ La venta se completa exitosamente.
○ Se genera el comprobante (ej: TKT-98034586).
○ El vuelto de $ 5.000,00 queda registrado en la tabla SalePayment.
Prueba 3: Integridad Atómica del Stock
1. Paso 1: Inspeccionar la variante en PostgreSQL antes del cobro (stockStore: 5,
stockReserved: 2).
2. Paso 2: Ejecutar completePendingSale.
3. Resultado Esperado:

○ La variante pasa a tener stockStore: 3 y stockReserved: 0.
○ Se genera el movimiento de inventario VENTA_MOSTRADOR con quantity: 2
y stockAfter: 3 + depósito.

Diseño del Frontend

RF-11: Apertura, Arqueo y Cierre de caja
Descripción y Objetivo
Permite gestionar de manera digital, segura e inmutable el ciclo de vida de los turnos
de caja en el mostrador de Matacos Deportes (Saavedra 241, Formosa), reemplazando el
tradicional cuaderno manuscrito de caja por un subsistema integrado al Punto de Venta
(POS).
El requerimiento resuelve:
1. Apertura de Turno con Fondo Inicial: Registro formal de la apertura de caja vinculada
a una terminal física (terminalId), un cajero responsable y un monto de cambio inicial
en efectivo (initialAmount) para dar vuelto a los clientes.

2. Bloqueo Estricto de Ventas sin Turno Abierto: Impide procesar cobros en el
mostrador si la terminal no cuenta con un turno activo en estado ABIERTA,
blindando la recaudación contra ingresos no custodiados. (Las preventas de salón
en Terminal 1 continúan operando libremente sin requerir caja abierta).
3. Movimientos Intermedios de Caja: Registro en tiempo real de ingresos
extraordinarios y egresos (gastos menores de librería/limpieza, fletes o retiros de
seguridad a caja fuerte), exigiendo motivo obligatorio, comprobante analógico de
respaldo y validación estricta de saldo de efectivo en cajón para evitar balances
negativos irreales.
4. Consolidación Multimétodo Automática: Agrupación atómica de todas las ventas del
turno imputadas por Efectivo, Débito, Crédito, Transferencia Bancaria y QR Mercado
Pago.
5. Arqueo Ciego (Blind Audit): Al finalizar la jornada o turno, el cajero declara los
montos reales contados físicamente en el cajón (asistido opcionalmente por una
calculadora de billetes de denominaciones argentinas: $20.000, $10.000, $2.000,
$1.000, etc.) y los cupones de tarjetas/transferencias sin ver en pantalla las cifras
esperadas por el sistema. Al confirmar, el sistema calcula automáticamente las
diferencias (sobrante/faltante) y exige justificación obligatoria ante desvíos mayores
a la tolerancia ($ 500,00).
6. Comprobante Térmico de Arqueo (80mm): Emisión instantánea del ticket de cierre
de turno listo para imprimir en la comandera térmica y grapar al sobre físico de
recaudación.
7. Historial y Auditoría: Visor administrativo para consulta, reimpresión y control de
turnos históricos con filtros por fecha, terminal y cajero.
Tecnologías, Herramientas y Librerías
● Next.js 15 (Server Actions): src/server/actions/cashShiftActions.ts (openCashShift,
closeCashShift, createCashMovement, getActiveCashShift, getCashShiftHistory,
getCashShiftReport).
● Servicio de Consolidación Matemática Pura: src/server/services/cashShiftService.ts
con cálculo determinista de efectivo esperado:
𝑒𝑥𝑝𝑒𝑐𝑡𝑒𝑑𝐶𝑎𝑠ℎ = 𝑖𝑛𝑖𝑡𝑖𝑎𝑙𝐴𝑚𝑜𝑢𝑛𝑡 + ∑𝐸𝑓𝑒𝑐𝑡𝑖𝑣𝑜𝐶𝑜𝑏𝑟𝑎𝑑𝑜 + ∑𝐼𝑛𝑔𝑟𝑒𝑠𝑜𝑠 − ∑𝐸𝑔𝑟𝑒𝑠𝑜𝑠
𝑑𝑖𝑓𝑓𝑒𝑟𝑒𝑛𝑐𝑒𝐶𝑎𝑠ℎ = 𝑎𝑐𝑡𝑢𝑎𝑙𝐶𝑎𝑠ℎ − 𝑒𝑥𝑝𝑒𝑐𝑡𝑒𝑑𝐶𝑎𝑠ℎ

● PostgreSQL 16 & Prisma ORM 6: Modelos relacionales CashShift y CashMovement,
relaciones foráneas con User y Sale bajo transacciones ACID (prisma.$transaction).
● Zod (Validación de Esquemas): OpenCashShiftSchema,
CreateCashMovementSchema y CloseCashShiftSchema.
● Formateo y Zona Horaria: Moneda ARS ($ 45.000,00) y zona horaria
America/Argentina/Buenos_Aires.
Archivos Involucrados en el Requerimiento
Backend & Servicios
● src/server/actions/cashShiftActions.ts: Server Actions para apertura, cierre, auditoría,
consulta y validaciones de caja.
● src/server/services/cashShiftService.ts: Motor de consolidación de ventas, arqueo
ciego, validación de retiros y generación de ticket térmico.
● src/server/actions/posSaleActions.ts: Validación de turno abierto antes de concretar
cobros (completePendingSale, createDirectSale) y vinculación atómica con
cashShiftId.
Esquemas de Validación (Zod)
● src/schemas/cashShift.ts: Contratos para apertura (OpenCashShiftSchema),
movimientos de caja (CreateCashMovementSchema) y arqueo ciego
(CloseCashShiftSchema).
Modelos y Persistencia (Prisma / PostgreSQL)
● prisma/schema.prisma:
○ CashShift: Atributos terminalId, userId, status (ABIERTA | CERRADA),
initialAmount, expectedCash, actualCash, differenceCash, expectedDebit,
actualDebit, openedAt, closedAt, notes.
○ CashMovement: Atributos cashShiftId, type (INGRESO_EXTRAORDINARIO,
RETIRO_CAJA_FUERTE, GASTO_MENOR, AJUSTE_ARQUEO), amount,
reason, receiptNumber, performedBy.
○ Sale: Campo cashShiftId que vincula de manera obligatoria cada venta
completada a su turno activo.
Componentes de Interfaz de Usuario (Frontend)
● src/components/dashboard/CashShiftModals.tsx:
○ OpenCashShiftModal: Apertura de caja con selección rápida de cajero y
fondo inicial.

○ CloseCashShiftModal: Arqueo ciego con calculadora interactiva de
denominaciones de billetes argentinos.
○ CashMovementModal: Registro de ingresos y egresos con indicador de saldo
actual disponible.
○ CashShiftReceiptModal: Visualizador e impresión de ticket térmico de cierre
de 80mm.
● src/components/dashboard/PosView.tsx: Encabezado con estado del turno en
tiempo real (abierta/cerrada, cajero, duración), alertas visuales y bloqueo reactivo de
cobro.
● src/components/dashboard/CashShiftHistoryView.tsx: Panel administrativo de
auditoría histórica de turnos y reimpresión de comprobantes.
Pruebas Automatizadas (QA)
● scripts/test-rf11-cash-shifts.ts: Suite integral con 38 casos de prueba automatizados
que validan apertura, bloqueo de ventas, retiro con saldo, consolidación multimétodo
y arqueo ciego.
Flujo de Datos y Control
Pruebas Realizadas
1. Precondición: Terminal 2 sin turno de caja abierto (caja cerrada).
2. Paso 1 (Bloqueo de Cobro): Intentar completar una venta en el mostrador. Verificar
que el sistema muestre la advertencia: "Debe abrir la caja antes de registrar cobros
en mostrador" y deshabilite la confirmación.
3. Paso 2 (Apertura): Abrir caja con un fondo inicial de $ 10.000,00 a nombre del cajero
"Nahir Fornari".

4. Paso 3 (Validación de Retiro): Intentar registrar un retiro por $ 15.000,00. Verificar
que el sistema rechace la operación indicando "Saldo de efectivo insuficiente en
cajón ($ 10.000,00 disponible)".
5. Paso 4 (Venta y Cobro): Procesar una venta cobrando $ 20.000,00 en efectivo.
6. Paso 5 (Arqueo Ciego): Iniciar el cierre de turno. Declarar $ 29.500,00 en efectivo en
la calculadora de billetes.
7. Resultado Esperado: El sistema calcula un faltante de $ 500,00 (Esperado: $
30.000,00 vs Real: $ 29.500,00), exige nota justificativa por encontrarse en el límite
de tolerancia, cierra el turno e imprime el comprobante térmico de arqueo de 80mm
con el balance desglosado.

Diseño del Frontend

RF-12: Operación del Mostrador en Offline y Sincronización
Descripción y Objetivo
Garantiza la continuidad operativa ininterrumpida del Punto de Venta (POS) en el
mostrador de Matacos Deportes (Saavedra 241, Formosa) ante caídas de internet,
microcortes o fallas temporales de enlace con la nube o la red local.
Bajo la filosofía Offline-First, el mostrador jamás bloquea una venta presencial:
1. Catálogo Local Espejo en IndexedDB: Mantiene una réplica sincronizada en el
almacenamiento persistente del navegador con el catálogo de artículos, variantes,
códigos de barra, talles, colores y precios vigentes.
2. Cobro y Registro Desconectado: Permite registrar cobros en mostrador
(especialmente pagos en efectivo), calcular vuelto de forma instantánea y generar
identificadores universales únicos temporales (clientTempId / offlineId).
3. Emisión de Tickets Locales Contingentes: Permite imprimir el comprobante térmico
de control y entrega al cliente de forma inmediata utilizando el renderizador del
navegador sin depender de respuestas de APIs remotas.
4. Cola de Sincronización Idempotente en Background: Las ventas concretadas sin
conexión se encolan con el estado synced: false. Al restablecerse la red, un
despachador asíncrono envía las transacciones al servidor PostgreSQL central
mediante transacciones atómicas (prisma.$transaction), descontando el stock físico
real y actualizando synced: true sin duplicar operaciones.
Tecnologías, Herramientas y Librerías
● IndexedDB & Dexie.js 4: Módulo de base de datos local en el navegador
src/lib/dexie.ts que implementa MatacosOfflineDatabase con tablas indexadas
products y sales.
● Next.js 15 (Server Actions): src/server/actions/posSaleActions.ts con soporte para
ingestión atómica de ventas con offlineId.
● PostgreSQL 16 & Prisma ORM 6: Campo indexado Sale.offlineId con restricción de
unicidad para garantizar idempotencia estricta (si un paquete se reintenta por
microcortes, no genera doble cobro ni doble baja de stock).
● Zod (Validación de Esquemas): SaleSchema con validación del atributo opcional
offlineId.
● Web Connection APIs: navigator.onLine, window.addEventListener('online') y
window.addEventListener('offline') con monitoreo reactivo de latencia.

Archivos Involucrados en el Requerimiento
Persistencia Local y Cliente (IndexedDB)
● src/lib/dexie.ts: Base de datos Dexie con contratos tipados LocalProduct, LocalSale,
LocalSaleItem e índices de búsqueda por barcode, variantId y estado synced.
Backend & Server Actions (Sincronización Idempotente)
● src/server/actions/posSaleActions.ts: Server Actions createDirectSale y
completePendingSale preparadas para recibir offlineId y ejecutar la baja de stock en
prisma.$transaction.
Esquemas de Validación (Zod)
● src/schemas/sale.ts: Define el identificador offlineId:
z.string().uuid().optional().nullable().
Modelos y Persistencia Central (Prisma / PostgreSQL)
● prisma/schema.prisma:
○ Sale: Atributos offlineId (UUID indexado único) y createdAt original de la
transacción desconectada.
○ ProductVariant: Descuento atómico de existencias físicas (stockStore) al
consolidar la venta offline.
○ InventoryMovement: Creación del movimiento VENTA_MOSTRADOR con
fecha histórica de la venta real.
Componentes de Interfaz de Usuario (Frontend)
● src/components/dashboard/PosView.tsx: Selector automático de motor (API Online
vs IndexedDB Local) según el estado de red, banner de alerta de modo offline y
contador de ventas pendientes de sincronización.
● src/components/dashboard/SidebarRight.tsx: Indicador global de estado de red
(Online / Offline).
Flujo de Datos y Control

Detalle de Reglas Críticas de Sincronización
1. Idempotencia Garantizada: Si el navegador envía la venta offline, la red sufre un
microcorte antes de recibir la confirmación y el navegador vuelve a reintentar el
envío, PostgreSQL detecta el offlineId ya existente y retorna éxito sin duplicar los
cobros ni descontar doble stock.
2. Preservación Temporal Fidedigna: La venta sincronizada preserva en el campo
createdAt la fecha y hora exacta en la que se cobró físicamente en el mostrador,
garantizando que el arqueo de caja de dicho turno (RF-11) compute el dinero en el
momento en que efectivamente ingresó al cajón.
3. Consistencia de Stock Negativo: Si durante el período offline se vendió una prenda
cuyo stock físico era la última unidad en salón, la transacción de sincronización
actualiza el stock a 0 e inserta la auditoría correspondiente sin interrumpir el lote.
Pruebas Realizadas
1. Precondición: Cargar el Punto de Venta (POS) con catálogo sincronizado.
2. Paso 1 (Simulación Desconectada): En las herramientas de desarrollador del
navegador (DevTools -> pestaña Network), seleccionar el perfil "Offline".
3. Paso 2: Verificar que en la interfaz aparezca el indicador ámbar "Modo Offline Activo
(Operando sobre almacenamiento local)".
4. Paso 3: Escanear un producto de muestra mediante código de barras o buscador
omnibox. Verificar que la búsqueda responda en menos de 20ms desde IndexedDB.

5. Paso 4: Cobrar una venta en efectivo por $ 10.000,00 con $ 12.000,00 entregados.
Verificar el cálculo de $ 2.000,00 de vuelto y la emisión del ticket local de
contingencia.
6. Paso 5 (Reconexión): En DevTools, volver a seleccionar "No throttling" (restablecer
conexión).
7. Resultado Esperado: El sistema detecta el evento de reconexión, dispara la
sincronización en segundo plano, la venta impacta en PostgreSQL con su offlineId,
la tabla local marca synced = true y el contador de ventas pendientes vuelve a 0.

Entrega Mes 3 (Octubre 2026)
Retraso del Módulo de Facturación
Para este mes, originalmente se esperaba realizar la tienda online e integrar la
facturación con AFIP/ARCA para poder emitir facturas electrónicas automáticas. Luego de
un análisis de viabilidad y diversas conversaciones con gente especializada en el apartado
de facturación, se decidió postergar dicha funcionalidad para una etapa final, justificando
dicha decisión principalmente por tres motivos:
Responsabilidad Legal y Tributaria
Matacos Deportes es un comercio en funcionamiento y sus titulares son
Responsables Inscriptos. Emitir comprobantes fiscales reales desde un software que está
en etapa de desarrollo y prueba conlleva un riesgo legal innecesario: cualquier error de
conexión o prueba fallida generaría facturas fiscales válidas, pudiendo provocar
complicaciones contables o multas económicas para los propietarios.
Complejidad de Trámites y Certificados Digitales
La conexión con ARCA exige tramitar certificados fiscales delegados, como también
programar protocolos técnicos antiguos y complejos que requieren mucho tiempo de
análisis, desarrollo y homologación previa.
Prioridad en lo que el Negocio Realmente Necesita hoy
Lo más urgente para el local era garantizar que el mostrador pueda cobrar siempre y
llevar un registro digital para control interno del sistema y tener la tienda web lista para
vender online. Debido a que el local ya cuenta con métodos habituales para emitir facturas
(una controladora fiscal o el facturador web de AFIP), el sistema solamente emite un ticket
interno de control y entrega que no es válido como factura.
Por estos motivos, la integración directa con ARCA queda planificada para una
implementación a futuro, una vez que el sistema esté publicado en la nube y probado en su
totalidad.

Actualización de la Estructura de Carpetas del Proyecto
Para incorporar la tienda web sin desordenar la pantalla de mostrador ni el panel
administrativo, se decidió por reorganizar la carpeta principal src/ utilizando nuevos grupos
de rutas. Esto nos permite tener diseños visuales totalmente distintos (teniendo el menú
administrativo por un lado, el punto de venta por otro y la tienda online por otro).
¿Qué aporta cada Nueva Carpeta?
app/dashboard/: Agrupa las pantallas que usan exclusivamente los empleados y los
dueños (Stock, POS y Caja), con espacios protegidos por contraseñas y roles.
app/ecommerce/: Contiene las páginas públicas que ven los clientes en internet al
entrar a la página web.
components/ecommerce/: Guarda los componentes visuales de la tienda: la
cabecera, carrusel de imágenes, tarjetas de artículos deportivos y el pie de página con
información.
api/webhooks/mercadopago/: Es el aviso cuando un cliente pagó con Mercado
Pago, para así poder descontar el stock automáticamente.

Nuevos Requerimientos Funcionales Agregados
Para atender las necesidades comerciales de la tienda web y permitir a los dueños
realizar diversas funcionalidades sin depender de la presencia de alguno de los
desarrolladores, se agregaron tres nuevos requerimientos:

| ID     | Nombre               | Descripción           | Prioridad  |
| ------ | -------------------- | --------------------- | ---------- |
|        |                      | El sistema debe       | Media      |
|        |                      | permitir cargar,      |            |
|        |                      | cambiar y ordenar     |            |
|        |                      | imágenes de           |            |
|        |                      | publicidad en la      |            |
| RF-26  | Carrusel de Banners  | parte superior de la  |            |
página web desde el
panel de
administración sin
tener que modificar
código
|        |                    | El sistema debe   | Alta  |
| ------ | ------------------ | ----------------- | ----- |
|        |                    | permitir aplicar  |       |
|        |                    | promociones y     |       |
|        |                    | porcentajes de    |       |
|        |                    | descuento a       |       |
|        | Descuentos y       | productos         |       |
| RF-27  | Ofertas en la Web  | específicos o     |       |
categorías enteras.
Se debe mostrar el
precio anterior
tachado y el cartel
de oferta.
|          |                      | El sistema debe      | Alta  |
| -------- | -------------------- | -------------------- | ----- |
|          |                      | calcular en vivo y   |       |
|          |                      | avisar a los dueños  |       |
|          |                      | para que ningún      |       |
| RF-27.1  | Regla de Seguridad   | descuento deje el    |       |
|          | para los descuentos  | precio final por     |       |
debajo del costo de
compra, protegiendo
las ganancias.
| RF-28  | Landing Page  | El sistema debe  | Alta  |
| ------ | ------------- | ---------------- | ----- |
tener una portada
principal de la
tienda, organizando
toda la información
en una sola pantalla
rápida y atractiva
| RF-29  | Portal de Clientes, Favoritos y Seguimiento de Pedidos | El sistema debe proveer a los clientes de la tienda online un área personal («Mi Cuenta») para iniciar sesión y registrarse de forma segura, marcar productos como favoritos en una lista de deseos con persistencia en base de datos y localStorage, seguir el estado de sus pedidos web en tiempo real con línea de tiempo y consultar su historial completo de compras con sus datos de entrega guardados para compras ágiles. | Alta  |

Detalle del Requerimiento RF-29: Portal de Clientes, Autenticación y Fidelización Web
Para complementar la modalidad de compra ágil como invitado (Guest Checkout — RF-15), se incorporó el portal personal de clientes («Mi Cuenta»). Este módulo traslada la relación histórica de cercanía y asesoramiento que Matacos Deportes mantiene desde hace más de 25 años en su local de Saavedra 241 hacia el entorno digital, ofreciendo a los clientes de la tienda online las siguientes prestaciones esenciales:

● Autenticación e Identidad Ágil (Credenciales y Google OAuth):
El sistema permite a cualquier visitante registrarse e iniciar sesión utilizando su correo electrónico y una contraseña segura (cifrada con bcryptjs), o autenticarse de manera instantánea mediante el botón de «Continuar con Google». La sesión se gestiona a través de tokens cifrados e independientes (JWT HttpOnly), garantizando que las cuentas de los clientes web no tengan ninguna clase de acceso a las pantallas administrativas ni operativas del punto de venta (POS).

● Lista de Deseos / Favoritos (Wishlist):
Los usuarios pueden marcar productos como favoritos haciendo clic en el icono de corazón disponible en las tarjetas del catálogo, las vitrinas de ofertas y la ficha de detalle del producto. Para maximizar la usabilidad y no generar barreras de entrada, si el cliente aún no inició sesión, sus favoritos se preservan localmente en su navegador; al momento de registrarse o iniciar sesión, dichos productos se migran y sincronizan automáticamente en la base de datos centralizada de su cuenta. Desde su panel, el comprador puede consultar la disponibilidad en tiempo real de sus prendas favoritas y acceder directamente a elegir su talle para comprar.

● Seguimiento de Pedidos en Tiempo Real (Order Tracking):
El cliente dispone de un área de trazabilidad donde consulta el avance de sus órdenes web mediante una línea de tiempo progresiva que refleja los estados operativos del negocio (Pendiente de Pago, Pago Confirmado / En Preparación en el local, Listo para Retiro o Despachado). Para envíos nacionales, el sistema expone el código de guía asignado y un botón con acceso directo al rastreo oficial de Correo Argentino; para entregas locales en Formosa Capital, informa el despacho por cadetería y facilita la coordinación por WhatsApp. Asimismo, se envía una notificación automática por correo electrónico al comprador al momento del despacho del paquete.

● Historial de Compras y Libreta de Direcciones:
El portal conserva el registro histórico completo de las compras web realizadas por el usuario, permitiéndole consultar qué talles, colores y modelos adquirió en transacciones anteriores y tener sus comprobantes digitales a mano. A su vez, el cliente puede almacenar su domicilio habitual de entrega (calle, número, localidad y código postal), logrando que en futuras compras sus datos se autocompleten en el formulario en un solo clic.

Diseño de FrontEnd / Prototipos (Diseños en canva)
Previo a la codificación de las páginas del e-commerce, se realizó una etapa
de diseño y prototipado mediante la herramienta canva, con el objetivo de obtener la
aprobación por parte de la dueña del negocio para definir la estructura, la jerarquía visual y
los flujos de interacción del cliente.
Criterios Claves de Diseño
● Identidad de marca: Se respetó la paleta institucional centrada en verdes
deportivos oscuros (#06241d), verdes intensos (#00D615) y acentos lima
(#c2f25b), complementados con fondos claros y limpios para asegurar el
contraste de los productos.
● Componentes principales:
a. Portada / Landing Page: Carrusel superior de campañas (hero
banner), barra de búsqueda visible, accesos directos a las 5
disciplinas estratégicas (Natación, Vóley, Crocs/Urbano, Fitness,
Calzado) y vitrinas destacadas.
b. Catálogo Facetado: Grilla responsiva con tarjetas de producto que
exponen imagen, marca, título, precio en Pesos Argentinos (ARS) y
talles disponibles, acompañada de un panel lateral de filtros rápidos.
c. Ficha de Detalle de Producto (PDP): Selector visual de color asociado
a la galería de fotos, matriz interactiva de talles (con visualización de
talles agotados deshabilitados), indicador de stock restante y botón de
consulta directa por WhatsApp.
d. Proceso de Compra (Checkout de Invitado): Formulario de un solo
paso enfocado en la simplicidad, permitiendo seleccionar entre retiro
gratuito o envío a domicilio.
e. Portal de Mi Cuenta y Fidelización: Interfaz de usuario con pestañas para inicio de sesión, registro ágil con Google, lista de favoritos con disponibilidad de stock en vivo, historial de compras y panel de seguimiento visual de pedidos en curso.

Prototipos

Sistemas Parecidos
Para el diseño funcional y comercial de la tienda se llevó a cabo un proceso de
benchmarking analizando plataformas representativas de la industria deportiva: dos
comercios multimarca consolidados en el mercado argentino (Rossetti Deportes y
SoloDeportes) y dos tiendas de marcas líderes internacionales con presencia local
(Adidas Argentina y Puma Argentina).
Rosetti
Rossetti es una cadena deportiva argentina con fuerte implantación física en el
interior del país y una estructura multimarca comparable a Matacos Deportes.
● Aspectos Analizados: Su tienda online destaca por una categorización por
disciplinas deportivas claras y la visibilidad de promociones bancarias y
cuotas en la cabecera.
● Lecciones Aprendidas para Matacos: La organización del menú principal por
disciplinas técnicas (Natación, Vóley, Fitness) en lugar de divisiones
genéricas tradicionales, y la inclusión de banners dinámicos con llamadas a
la acción directas.
Figura. Landing Page [Captura de referencia - Navegación y estructura de
Rossetti Deportes]

Figura. Búsqueda de productos [Captura de referencia - Botines]
Figura. Búsqueda avanzada [Captura de referencia - Categorías]
SoloDeportes
SoloDeportes constituye uno de los referentes nacionales de mayor volumen de
ventas digitales en indumentaria y calzado deportivo.
● Aspectos Analizados: Destaca por la velocidad de respuesta de su catálogo y la
precisión de sus filtros facetados, permitiendo al usuario filtrar simultáneamente por
talle, marca y género sin recargar la página.

● Lecciones Aprendidas para Matacos: La implementación de la búsqueda predictiva
instantánea (< 50 ms) y la decisión de mostrar los talles agotados visualmente
deshabilitados en lugar de eliminarlos, evitando frustración en el usuario al navegar.
Figura [Captura de referencia - Catálogo Solo Deportes]
Figura. Footer [Captura de referencia - Footer con contactos - Solo Deportes]

Figura. Búsqueda por categoria [Captura de referencia - Categorias - Solo Deportes]
Figura. Página de producto.
Adidas
Como líder global, el sitio de Adidas ofrece el estándar de oro en cuanto a
experiencia inmersiva en la ficha de producto.
● Aspectos Analizados: Excelente fotografía de producto en múltiples ángulos,
asociación directa entre el color seleccionado y las fotos de la galería, y una
presentación clara de políticas de devolución y cambio.

● Lecciones Aprendidas para Matacos: La estructura de la galería de fotos donde cada
variante de color carga su conjunto específico de imágenes, y la inclusión visible de
las políticas de cambio de Saavedra 241 en el pie de la ficha técnica.
Figura [Captura de referencia - Ficha de producto y selector de talles de Adidas]
Figura [Captura de referencia - Ficha de producto y selector de talles de Adidas]

Figura. Guia de talles
Puma
Puma se caracteriza por un diseño moderno, ágil y orientado al público joven y
urbano, nicho muy afín a las líneas de calzado urbano y tiempo libre de Matacos.
Aspectos Analizados: Destaca por su carrusel hero de alto impacto visual, sus
vitrinas temáticas ("Novedades", "Lanzamientos") y un checkout simplificado que no
obliga al usuario a crear una cuenta antes de pagar.
Lecciones Aprendidas para Matacos: La adopción del modelo Guest Checkout
(compra como invitado) para reducir el abandono de carrito, y la utilización de un
carrusel principal administrable desde el panel de control.
Figura [Captura de referencia - Portada y carrusel hero de Puma]

Justificación de Roles
En las primeras etapas del proyecto, la seguridad y el control de acceso se
modelaron mediante un enumerador estático en código (enum Role { ADMIN,
CAJERO, DESPACHO }). Este enfoque fue efectivo en los primeros avances del
proyecto, pero con la implementación de un sistema más grande, trabajando con el
e-commerce, fue necesario pensar en una gestión más avanzada que roles fijos por las
siguientes razones:
Inflexibilidad Operativa: En el local del negocio, las responsabilidades no son
estáticas. Un cajero del turno tarde puede necesitar autorización para registrar egresos
de caja chica (pagar fletes), mientras que un cajero nuevo no debería tener ese
permiso. Un enum fijo obliga a modificar el código fuente y redesplegar el software ante
cualquier cambio administrativo.
Principio de Mínimo Privilegio: Cada integrante del personal debe contar
únicamente con las autorizaciones estrictamente necesarias para su labor. El modelo
anterior no permitía, por ejemplo, que un vendedor de salón aplicará descuentos
manuales sin tener que otorgarle acceso total al inventario o a los costos de compra.
Adopción del Modelo de Perfiles Jerárquicos y Permisos Atómicos:
Permisos Atómicos: Unidades mínimas de autorización ligadas al código
(pos.cobrar, caja.cerrar_arqueo, inventario.precios, etc.).

Perfiles Gestionables: Plantillas creadas y editadas por el Administrador desde la
interfaz de usuario, donde tilda casillas de verificación según las necesidades
operativas.
Jerarquía Reflexiva: Un perfil superior (ej. El Encargado) puede heredar
automáticamente los permisos de un perfil inferior (ej. Cajero) sin requerir configuración
redundante.
Independencia Total de Clientes Web: El modelo de roles internos queda 100%
aislado del e-commerce. Los clientes web no poseen perfiles de seguridad interna ni
acceden a la tabla de personal, blindando el sistema contra accesos no autorizados al
mostrador o a las métricas del negocio.
Organigrama
Figura [Organigrama operativo y funcional de Matacos Deportes]
Solución / Estructura de Base de Datos
Profile y Permission :
El administrador define registros en Profile (ej: "Cajero", "Encargado").

La tabla intermedia ProfilePermission vincula los permisos habilitados.
El campo parentProfileId permite herencia reflexiva entre perfiles.
User (Personal del Local):
Contiene a los empleados del comercio con credenciales de acceso y un profileId
asignado.
Customer (Cuenta Opcional de Cliente Web):
Almacena clientes que deciden registrarse con contraseña en la tienda para no
reescribir sus datos en compras futuras. No posee relación con Profile ni con
Permission.
Sale (Snapshot Inmutable y Soporte de Invitados):
Si el cliente compra como invitado: customerId se guarda en null y sus datos
(customerName, customerEmail, customerPhone, customerDni, shippingAddress)
quedan asentados directamente en las columnas de la venta.
Si el cliente compra iniciando sesión: se guardan los mismos datos inmutables y
adicionalmente se completa customerId para que la orden aparezca en su panel de
"Mis Compras".

Gestión de Riesgos
La evolución del proyecto durante el Mes 3 demandó la identificación, análisis y
mitigación de cuatro riesgos operacionales y tecnológicos críticos:
Riesgo 1: Contingencia e Inestabilidad de Web Services de AFIP / ARCA
Naturaleza del Riesgo: Externo y regulatorio. La transformación del organismo
tributario nacional generó suspensiones y cambios en los ambientes de homologación
(WSAA / WSFE) para la autorización electrónica de comprobantes con CAE.
Impacto: Bloqueo o retraso en la emisión automática de Facturas A y B
electrónicas.
Mitigación: Se postergó la conexión fiscal con ARCA para el Mes 4 y se fortaleció
el módulo de mostrador con Comprobantes de Control Interno (Ticket X) con validez
comercial de cambio de 30 días y arqueos de turno blindados. El local opera legal y
contablemente sin verse paralizado por contingencias de servidores fiscales externos.
Riesgo 2: Sobrevantas Concurrentes (Local vs. Tienda Web)
Naturaleza del Riesgo: Operativo y transaccional. La posibilidad de que una
prenda exhibida en el local sea vendida presencialmente en el mismo momento en que
un cliente digital la compra por la web.
Impacto: Quiebre de stock, necesidad de cancelar pedidos web, reintegros
forzados y descontento del cliente.
Mitigación: Principio de Single Source of Truth (única base de datos PostgreSQL
unificada) y transacciones atómicas de Prisma con bloqueo a nivel de fila
(prisma.$transaction). Las preventas de mostrador y los checkouts web incrementan el
contador stockReserved, restando disponibilidad inmediatamente del catálogo público
antes de que se confirme el pago definitivo.
Riesgo 3: Caídas de Conectividad a Internet en el local fisico
Naturaleza del Riesgo: Infraestructura local. Microcortes de fibra óptica o
suministro eléctrico en el microcentro de la ciudad de Formosa.

Impacto: Imposibilidad de consultar precios o cobrar ventas presenciales en
mostrador si el sistema fuera 100% dependiente de la nube.
Mitigación: Enfoque Offline-First en el Punto de Venta implementado con
IndexedDB y Dexie.js en los navegadores de las terminales del local. El mostrador
puede continuar registrando ventas en efectivo y emitiendo tickets en contingencia,
encolando las transacciones para su sincronización automática al restablecerse la red.
Riesgo 4: Fricción en el Proceso de Pago y Abandono de Carrito
Naturaleza del Riesgo: Usabilidad y conversión comercial. Exigir la creación
obligatoria de cuenta, validación de correo o contraseñas complejas ahuyenta a los
compradores de la provincia que buscan una compra rápida.
Impacto: Altas tasas de abandono en la pantalla de pago y pérdida de ingresos
potenciales.
Mitigación: Implementación del patrón Guest Checkout (compra como invitado)
que solicita únicamente 4 datos indispensables para el despacho y facturación,
complementado con un botón flotante de atención directa por WhatsApp para resolver
dudas en tiempo real.
Figura [Matriz de Evaluación de Riesgos y Acciones de Mitigación]
Matriz de Evaluación de Riesgos
La siguiente tabla presenta la priorización de los riesgos tecnológicos y
operacionales identificados durante el Mes 3 del proyecto, ordenados por su nivel de
exposición e impacto en la continuidad comercial de Matacos Deportes.
Prioridad ID de Título del Riesgo Probabilidad Impacto
Riesgo
1 R-01 Sobreventas 75% Alto
concurrentes y quiebre de
stock dual por
desincronización
Mostrador-Web

2 R-02 Parálisis operativa en 80% Alto
mostrador por cortes de
conectividad o energía en
Saavedra 241
3 R-03 Bloqueo de facturación 70% Alto
electrónica por
contingencias en Web
Services de AFIP / ARCA
4 R-04 Abandono de carritos en 60% Medio
el e-commerce por
fricción en registro y
desconfianza en pagos
5 R-05 Vulnerabilidad de 50% Medio
privilegios y manipulación
no autorizada de precios
o stock en salón
Hoja de Información de Riesgo: R-01
Hoja de información de riesgo
Riesgo ID: R-01 Fecha: 19/10/26 Prob: 75% Impacto: Alto
Descripción:
La concurrencia entre ventas físicas en el mostrador de Saavedra 241 y compras online
simultáneas en el e-commerce puede provocar que se venda la misma unidad de talle y
color a dos clientes distintos. Esto generaría quiebres de inventario, cancelaciones
forzosas de pedidos web, fricción comercial con reintegros monetarios y pérdida de
reputación de la marca.
Refinamiento/Contexto:
Subcondición 1: Artículos de alta rotación (como zapatillas deportivas o líneas Crocs)
poseen bajo stock físico en salón (1 a 3 pares por talle), elevando la probabilidad de
colisión transaccional en horarios pico.
Subcondición 2: Existencia de transacciones no atómicas o latencia en la actualización
de la base de datos central PostgreSQL si no se implementa bloqueo de registros a
nivel de fila (pessimistic / optimistic locking).
Subcondición 3: Retención de carritos web sin reserva temporal (stockReserved),
permitiendo que un usuario mantenga un artículo en su carrito indefinidamente mientras
otro comprador lo abona presencialmente en caja.

Mitigación/monitoreo:
1. Implementar transacciones atómicas con Prisma ORM (prisma.$transaction) con
bloqueo de fila para decrementos de stock tanto en la Server Action de venta POS
como en la de Checkout web.
2. Aplicar el mecanismo de reserva temporal (stockReserved) con expiración
automática de 15 minutos en el checkout web y para preventas de salón (PRV-XXXX).
3. Configurar revalidación bajo demanda (revalidateTag('ecommerce-catalog')) para
deshabilitar en tiempo real el botón de compra en la ficha de producto (PDP) cuando el
stock disponible llegue a cero.
Manejo/plan de contingencia/disparador:
Plan de contingencia:
• Habilitar protocolo de reasignación inmediata de mercadería verificando disponibilidad
de talle/color alternativo en depósito secundario o acordando cambio de modelo con el
cliente vía WhatsApp en menos de 2 horas.
• En caso de rechazo del cliente web, disparar reembolso automático por pasarela de
pago (Mercado Pago Refund API) y compensación comercial con cupón de 15% de
descuento para su próxima compra.
Disparador: Notificación de inventario disponible negativo (stockAvailable < 0) en base
de datos o colisión de concurrencia registrada en los logs del servidor al confirmar una
venta.
Estado actual:
19/10/2026: Lógica de stockReserved y verificación atómica de stock implementadas y
validadas con 25 pruebas unitarias/integración en RF-14 (checkVariantStock).
Originador: Analista Funcional (Nahir Asignado: Backend Developer (Ricardo
Fornari) Dellagnolo)
Hoja de Información de Riesgo: R-02
Hoja de información de riesgo
Riesgo ID: R-02 Fecha: 19/10/26 Prob: 80% Impacto: Alto
Descripción:
Microcortes o caídas prolongadas del servicio de internet de fibra óptica o cortes de
suministro eléctrico en el microcentro de Formosa Capital pueden bloquear la terminal
de cobranza y consulta de precios en el mostrador del local, impidiendo la atención
presencial, la facturación y la emisión de tickets si el sistema dependiera
exclusivamente de la nube.

Refinamiento/Contexto:
Subcondición 1: La infraestructura de red local en Saavedra 241 experimenta
fluctuaciones recurrentes del proveedor de telecomunicaciones local durante jornadas
de alta temperatura o tormentas estivales.
Subcondición 2: Dependencia de peticiones HTTP en tiempo real hacia la API del
servidor para validar códigos de barra y calcular subtotales.
Subcondición 3: Pérdida potencial de transacciones en efectivo si el cajero recurre a
anotaciones en papel que luego no concilien con el arqueo ciego diario.
Mitigación/monitoreo:
1. Arquitectura Offline-First con IndexedDB y Dexie.js en el cliente web del navegador
de las terminales de mostrador y salón.
2. Sincronización bidireccional en segundo plano: precarga y cacheo local del catálogo
completo de productos con códigos de barra en memoria del navegador al abrir la
jornada.
3. Cola de operaciones pendientes (sync queue) en IndexedDB que almacena las
ventas efectuadas sin conexión y las transmite en lote al restablecerse la red.
Manejo/plan de contingencia/disparador:
Plan de contingencia:
• Conmutación automática a modo contingencia offline en el POS: emisión de
Comprobantes de Control Interno (Ticket X) numerados localmente en impresora
térmica de 80 mm conectada vía USB local.
• Enlace de respaldo mediante router con módem 4G/LTE de contingencia para las
terminales de punto de venta ante cortes de fibra óptica superiores a 30 minutos.
Disparador: Detección del evento navigator.onLine === false o fallo de 3 peticiones
consecutivas (timeout > 3000 ms) al endpoint de healthcheck de la API.
Estado actual:
19/10/2026: Módulo IndexedDB con Dexie.js y encolador de transacciones desarrollado
en RF-12; pruebas de desconexión física de cable de red superadas satisfactoriamente.
Originador: Especialista UI & QA Asignado: Frontend Developer /
(Eugenia González) Backend Developer (Eugenia González /
Ricardo Dellagnolo)

Hoja de Información de Riesgo: R-03
Hoja de información de riesgo
Riesgo ID: R-03 Fecha: 19/10/26 Prob: 70% Impacto: Alto
Descripción:
La reestructuración institucional de la agencia tributaria nacional (disolución de AFIP y
transición a ARCA) ha provocado demoras, cambios normativos en esquemas de
autenticación y suspensiones temporales en los servidores de homologación y
producción de los Web Services de Facturación Electrónica (WSAA / WSFE). Intentar
forzar la emisión online de CAE en cada venta paralizaría el despacho y la entrega de
productos en Saavedra 241.
Refinamiento/Contexto:
Subcondición 1: Los certificados digitales X.509 y autorizaciones fiscales en el entorno
de pruebas de ARCA presentan tasas elevadas de error 500 y tiempos de respuesta
mayores a 15 segundos.
Subcondición 2: Exigencia legal de entregar comprobante válido al consumidor final en
el acto de compra en el local comercial físico.
Subcondición 3: Falta de soporte de facturación diferida o asíncrona si el diseño original
del sistema pretendía obtener el CAE de manera síncrona durante el checkout.
Mitigación/monitoreo:
1. Desacoplamiento de la facturación fiscal: postergación del módulo directo con ARCA
para el Mes 4 del proyecto, asegurando previamente la solidez del motor comercial.
2. Implementación de Comprobantes de Control Interno (Ticket X de 80 mm) con
validez comercial de 30 días para cambios y garantía, permitiendo el normal
desenvolvimiento del negocio.
3. Diseño de cola asíncrona para facturación por lotes (batch processing), separando la
confirmación de la venta del timbrado fiscal ante el organismo recaudador.
Manejo/plan de contingencia/disparador:
Plan de contingencia:
• Emisión manual complementaria de Facturas A y B a través del portal web oficial
"Comprobantes en Línea" de ARCA para clientes mayoristas o con CUIT que soliciten
factura discriminada urgente.
• Encolamiento de las ventas de consumidor final para facturación global diaria
agrupada una vez estabilizado el servicio fiscal.
Disparador: Tiempos de respuesta de los Web Services de ARCA superiores a 5.000
ms o recepción de errores de autenticación WSAA en más de 2 llamadas consecutivas.
Estado actual:
19/10/2026: Reprogramación formal del cronograma para Mes 4 documentada en el
informe de avances; plantillas de Ticket X térmico de 80 mm operativas al 100%.

Originador: Analista Funcional (Nahir Asignado: Líder de Proyecto / Backend
Fornari) Developer (Ricardo Dellagnolo)
Hoja de Información de Riesgo: R-04
Hoja de información de riesgo
Riesgo ID: R-04 Fecha: 19/10/26 Prob: 60% Impacto: Medio
Descripción:
Los compradores de indumentaria deportiva en Formosa y la región norte suelen
desistir de compras en línea si se les impone la creación obligatoria de cuentas,
confirmación de correos electrónicos con contraseñas complejas o si no encuentran
medios de pago familiares o un canal directo para evacuar dudas sobre talles y calces.
Refinamiento/Contexto:
Subcondición 1: Compradores habituados a transaccionar de manera informal por redes
sociales (WhatsApp/Instagram) rechazan formularios extensos de registro tradicional.
Subcondición 2: Dificultad para calcular el costo y método de entrega (retiro gratuito en
Saavedra 241 vs. cadetería local vs. encomienda provincial).
Subcondición 3: Incertidumbre sobre el talle real de calzado e indumentaria sin una
tabla de equivalencias clara en centímetros.
Mitigación/monitoreo:
1. Implementación del patrón Guest Checkout (compra directa como invitado)
solicitando únicamente 4 campos esenciales (Nombre, Teléfono, DNI, Domicilio/Retiro)
sin forzar registro ni contraseña.
2. Integración de Checkout Pro de Mercado Pago (tarjetas, transferencias por
CVU/alias, dinero en cuenta) garantizando confianza y familiaridad en la pasarela de
pago.
3. Incorporación de botón flotante interactivo de WhatsApp en la Ficha de Detalle de
Producto (PDP) con mensaje precargado que incluye el nombre, talle y variante
consultada para asistencia humana inmediata.
Manejo/plan de contingencia/disparador:
Plan de contingencia:
• Habilitar opción de "Finalizar pedido por WhatsApp con retiro y pago en mostrador" si
el cliente encuentra dificultades al procesar el pago digital.
• Enviar recordatorio amistoso vía WhatsApp a las órdenes con estado "Pendiente de
Pago" tras 30 minutos de inactividad, ofreciendo ayuda con el medio de pago o cambio
de talle.
Disparador: Tasa de abandono en la pantalla de checkout superior al 65% del total de
carritos iniciados en una semana.

Estado actual:
19/10/2026: Modelo de Base de Datos actualizado con soporte nativo de Guest
Checkout en tabla Sale (customerId = null); botón de consulta WhatsApp operativo en
prototipos y maquetación de RF-14.
Originador: Diseñadora UI-UX (Lourdes Asignado: Frontend Developer (Lourdes
Bordón Sbardella) Bordón Sbardella)
Hoja de Información de Riesgo: R-05
Hoja de información de riesgo
Riesgo ID: R-05 Fecha: 19/10/26 Prob: 50% Impacto: Medio
Descripción:
En terminales compartidas o de salón de ventas, personal con perfil de venta podría
acceder indebidamente a funciones críticas de administración, modificar precios de
venta al público, alterar costos de compra a proveedores o aplicar descuentos
arbitrarios fuera de los límites comerciales fijados por la dirección de Matacos Deportes.
Refinamiento/Contexto:
Subcondición 1: Terminales físicas del salón utilizadas por múltiples vendedoras sin
bloqueo de sesión ante inactividad.
Subcondición 2: Existencia previa de roles rígidos sin granularidad de permisos a nivel
de Server Actions.
Subcondición 3: Falta de registro de auditoría (audit logs) sobre quién modificó un
precio o aplicó una bonificación manual en el punto de venta.
Mitigación/monitoreo:
1. Modelo RBAC dinámico con Perfiles Jerárquicos y Permisos Atómicos en base de
datos (Profile, Permission, ProfilePermission), deshabilitando de raíz rutas protegidas y
Server Actions no autorizadas.
2. Validación estricta en servidor de márgenes máximos permitidos para descuentos
manuales en el mostrador (máximo 10% por vendedor; descuentos mayores requieren
PIN supervisor).
3. Registro inmutable en cada venta de userId del vendedor/cajero y bloqueo estricto de
visualización de costPrice en las interfaces públicas y de salón.
Manejo/plan de contingencia/disparador:
Plan de contingencia:
• Bloqueo instantáneo del perfil comprometido desde el panel central de administración
por parte de la titular de la empresa.
• Reversión automática de listas de precios mediante el histórico de auditoría y revisión
forzosa de arqueo de caja con presencia del encargado general.
Disparador: Detección de intentos de acceso a rutas administrativas (/admin/*) por
usuarios con perfil de salón o aplicación de descuentos manuales superiores al umbral
autorizado.

Estado actual:
19/10/2026: Esquema relacional de perfiles jerárquicos y permisos atómicos migrado a
PostgreSQL 16 con Prisma; validación de costPrice = 0 probada en Server Actions
públicas.
Originador: Backend Developer / Asignado: Líder de Proyecto (Ricardo
Analista Funcional (Nahir Fornari) Dellagnolo)

Conclusión
Durante el transcurso de este primer mes de Práctica Profesional Supervisada I, se
alcanzaron satisfactoriamente todos los objetivos propuestos para la etapa de inicio y
concepción del proyecto:
1. Se estableció un vínculo institucional sólido con los propietarios de Matacos
Deportes, logrando una comprensión profunda de su historia, identidad comercial y
problemáticas operativas analógicas.
2. Se formalizó la especificación completa de requerimientos funcionales y no
funcionales, validando las prioridades de negocio (cobro ágil en mostrador, lector de
códigos, modo offline, sincronización de stock y venta web con Mercado Pago y
WhatsApp).
3. Se seleccionó y justificó una arquitectura de software híbrida moderna y
económicamente viable (Nube para el e-commerce y soporte Offline-First para el
POS mostrador).
4. Se adoptó una metodología incremental con Kanban y un cronograma quincenal
detallado de 8 incrementos para optimizar el flujo de trabajo del equipo de 4
personas.
Próximos Pasos para el Mes 2
● Incremento 3: Configuración del repositorio base en Next.js con Docker, modelado
relacional en PostgreSQL/Prisma y desarrollo del módulo de Gestión de Inventario y
Catálogo con carga progresiva.
● Incremento 4: Desarrollo de la interfaz del Punto de Venta (POS) de mostrador,
integración de periféricos (lector de código de barras e impresora térmica) e
implementación del motor de persistencia local en IndexedDB para ventas en modo
offline y cierre de caja.

Anexo
Guía de Preguntas de Elicitación
Bloque 0: Historia, Identidad Institucional y Vínculo Comunitario
(Importante para la sección «Quiénes Somos» de la tienda online y el posicionamiento de
marca)
1. Origen y Fundación
● ¿En qué año abrió sus puertas Matacos Deportes y quién o quiénes fueron sus
fundadores?
Respuesta: Comenzó en septiembre del año 1999 en el Paseo de Compras (Por la
San Martín Mercadito). Fundado por Sandra Mujica (Comerciante - Oriunda de
Formosa) y Miguel Angel Marchi (Arquitecto) (Matrimonio desde Resistencia)
● ¿Cómo y por qué surgió la idea de abrir una tienda deportiva en la ciudad?
(¿Proyecto familiar, pasión por un deporte específico, falta de oferta especializada en
la zona?)
Respuesta (Sandra): Comenzó como una Tienda de Indumentaria Urbana unisex por
el paseo de compras, la transición a tienda de ropa deportiva ocurrió después.
Anteriormente había trabajado en una tienda deportiva en Resistencia. Cuando vine
acá con mi tienda de ropa se comenzó a solicitar accesorios deportivos (Medias,
vendas, bucales, mallas de entrenamiento de natación, etc.), al ver el tipo de ropa que
se vendía. Las tiendas deportivas se dedicaban principalmente al calzado, por lo que
no estos productos no se encontraban en la provincia, detectando así una especial
demanda de accesorios deportivos.
● ¿El local siempre estuvo en Saavedra 241 o tuvieron otras ubicaciones
históricas antes?
Respuesta: Primero estuve por la San Martín en el paseo de Compras.
Seguidamente alquilé un local por la Calle Saavedra al frente del Local actual
(Saavedra 238 - se mantuvo en dicho lugar por 10 años), actualmente en este local
desde el año 2019 previo a la Pandemia.
2. Identidad y Elección del Nombre
● ¿Cuál es el significado o la historia detrás de la elección del nombre
«Matacos»?
[X] Homenaje e identificación con las raíces culturales y pueblos originarios de la
región del Gran Chaco. El primer nombre fue: M y M (Por los apellidos de los dueños -
Marchi y Mujica), pero estos se repetían de a montones entre todos los locales, por lo
que se decidió realizar este cambio.
[ ] Vínculo con algún equipo, club o apodo histórico de la zona.
[ ] Otra razón específica:
● ¿El logotipo actual ha tenido rediseños a lo largo de los años o conserva su
diseño fundacional?
Respuesta: El logotipo y la marca pasó por 2 evoluciones principales. Al principio el
color inicial era el Amarillo, con un logo de un aborigen. A la hora de transicionar al
deporte cambiaron los colores a verde (En relación al aire libre - césped - fitness).
Matacos Deportes es marca registrada.

3. Hitos, Evolución y Comunidad
● ¿Qué momentos o etapas marcaron un antes y un después en la trayectoria
del negocio?
(Ampliaciones del local, incorporación de marcas líderes, superación de crisis,
cambios generacionales en la administración).
Respuesta:
○ Ampliación del local: Pasar del Paseo de Compras al microcentro de la
ciudad.
○ Superación de la crisis de 2001-02: Bonos en Formosa (Bocanfor), teniendo
que cambiarlo por LECOP. Si no había dinero para alimentos, la gente no iba
a comprar indumentaria deportiva ni mucho menos.
○ Registro de la Marca: En la llegada a Formosa, superaron irregularidades
fiscales de márgenes impositivos (inscripción en Rentas, municipalidad, AFIP,
actualmente ARCA) para inscripción de aportes legales. Obtuvo préstamos
bancarios para armar un depósito de distintos accesorios deportivos.
● ¿Qué disciplinas o productos eran los más vendidos en los comienzos y cómo
cambió la demanda hoy?
(Ej. antes predominaba el fútbol tradicional; hoy se sumaron running, pádel, hockey,
indumentaria urbana o entrenamiento funcional).
Respuesta: En el comienzo, lo más vendido eran los accesorios deportivos
(Indumentaria deportiva para gimnasios y profesores; pelotas, medias, vendas,
bucales, protección en general -canilleras, rodilleras-. Luego se añadieron las mallas
de natación. Mochilas Wilson, destacadas por su resistencia)
• Actualmente, los productos más vendidos son las Crocs y los productos de gimnasio
(Mancuernas, colchonetas, etc.)
● ¿Qué relación histórica ha tenido el local con clubes, ligas, escuelas o atletas
de Formosa?
[ ] Proveedor de indumentaria / equipamiento para clubes o colegios locales.
[ ] Auspiciante / sponsor de torneos barriales, maratones o eventos deportivos
provinciales.
[X] Apoyo a deportistas destacados de la provincia.
Detalles / Nombres: Llegaron a hacer fotos con una deportista (Mimí Sosa - Voley). Se
apoyó al club Náutico en los eventos y las acciones del mismo.
● ¿Tienen alguna anécdota destacada o visita memorable de algún deportista o
referente en el local?
Respuesta: Lo más marcado fue un spot publicitario con Locomotora Oliveras. A
nivel local una jugadora de vóley Emilce “Mimi” Sosa.
4. Filosofía de Marca y Mirada al Futuro (Misión y Visión)
● ¿Cuál consideran que es el principal valor que los diferencia de las grandes
cadenas o tiendas departamentales?
(Ej. atención personalizada y asesoramiento técnico por sus propios dueños,
conocimiento del cliente local, trayectoria y confianza).
Respuesta: Un poco de todo: la atención de los propios dueños, la trayectoria de más
de 25 años. La confianza y la atención personalizada de los clientes, donde se busca
ofrecer un servicio a la hora de vender un producto. Se destacan por ofrecer una

atención personalizada y detallada de cada uno de los deportes (asesoramiento
pre-venta y post-venta)
● ¿Cómo describirían la misión del negocio hoy?
Respuesta: Apuntamos hacia una modernización/sistematización de todas las áreas
del negocio (ventas, movimiento de caja, stock. E-commerce)
● ¿Qué representa este salto a la plataforma web dentro de la historia del
negocio?
(Ej. llegar a clientes del interior provincial que antes debían viajar a la capital,
modernización, agilizar la atención).
Respuesta: Este salto nos representa un cambio importante en la dinámica del
negocio: buscamos llegar a nivel nacional, modernizar nuestro funcionamiento
operacional y agilizar los procesos operativos que ocurren en el local a nivel diario
Bloque 1: Diagnóstico Operativo Actual
(Comprender cómo opera el negocio hoy en el papel para diseñar un sistema intuitivo y sin
fricciones)
1. Registro Diario de Operaciones
● ¿Cómo anotan o registran hoy las ventas del mostrador?
[X] Cuaderno de ventas manuscrito.
[ ] Talonario de papel / boletas manuales.
[ ] Planilla de cálculo básica (Excel/Sheets sin automatizar).
[ ] De memoria / solo conteo final de dinero.
● ¿Cómo realizan el cierre de caja diario al finalizar la jornada?
(¿Cómo concilian el efectivo del cajón con los cupones de tarjetas/Posnet y los
comprobantes de transferencias recibidas?)
Respuesta: Se anota tarjeta, efectivo haciendo el cierre de en la caja, posnet,
prestando detalle en las anotaciones y si coincide el registro del libro con lo demás.
● ¿Registran salidas de dinero de la caja chica durante el día?
(Pagos a cadetes, fletes, viáticos, artículos de limpieza, retiros particulares de los
dueños).
Respuesta: Generalmente no.
2. Consulta y Actualización de Precios en Mostrador
● ¿Cómo sabe hoy el vendedor el precio de un artículo cuando un cliente
consulta?
[X] Etiqueta adhesiva pegada en la prenda o caja.
[ ] Lista de precios impresa en papel detrás del mostrador.
[ ] Preguntándole verbalmente al dueño o encargado.
[ ] De memoria.
● Cuando los proveedores envían aumentos de precios, ¿cómo trasladan el
aumento a los productos?
(¿Remarcan etiquetas una por una a mano, aplican un recargo mental al momento de
cobrar, etc.?)
Respuesta: Se realiza un remarcó mano a mano de cada uno de los productos.

3. Nivel de Adopción Tecnológica y Dispositivos
● ¿Qué nivel de manejo y familiaridad tiene el personal que estará a cargo del
mostrador con el uso de PCs, tablets o celulares?
Respuesta: Se tiene un manejo básico de los sistemas de gestión de stock, ventas,
etc., prácticamente nada.
● ¿Qué dispositivo prefieren físicamente para cobrar en el mostrador?
[X] Computadora de escritorio (PC) con teclado y mouse.
[ ] Notebook.
[ ] Tablet táctil.
Bloque 2: Catálogo, Inventario Inicial y Reglas de Negocio
1. Estimación de Inventario y Carga Inicial (Onboarding)
● ¿Cuántos productos o artículos distintos (SKUs) estiman que tienen físicamente
en el local?
[X] Menos de 500 artículos. (entre 100 y 200 productos)
[ ] Entre 500 y 2.000 artículos.
[ ] Más de 2.000 artículos.
● ¿Cuenta con un inventario en papel con todos los productos anotados?
Respuesta: Se cuenta con un inventario en papel de algunos productos, no la
mayoría.
● ¿Cómo planifican realizar el primer inventario físico para alimentar la base de
datos inicial?
[ ] Cerrar el local un fin de semana completo para conteo total y carga masiva.
[X] Carga progresiva por marcas o categorías (ej. primero Calzado, luego
Indumentaria).
[ ] Carga sobre la marcha a medida que ingresa nueva mercadería.
2. Estructura y Variantes de Productos
● ¿Cómo se organizan las categorías y disciplinas deportivas?
(Fútbol, Running, Pádel, Básquet, Vóley, Hockey, Natación, Gimnasio / Training,
Urbano).
Respuesta: Se cuentan con productos de todos los deportes, dándole prioridad lo
que tiene más salida (natación, voley y crocs y artículos de gimnasio)
● ¿Qué variantes específicas maneja cada artículo?
[ ] Talles de calzado: [] Tabla AR [] Tabla US [] Tabla EUR [] Equivalencias
centímetros.
[ ] Talles de indumentaria: [] S, M, L, XL, XXL [] Talles numéricos infantiles (4 al 16).
[ ] Género: [] Hombre [] Mujer [] Niño/a [] Unisex.
• Color y combinaciones.
• Se divide por talle y por color de ropa.
3. Material Fotográfico para la Web

● ¿Disponen de fotos digitales de los productos para la tienda online?
[ ] Fotos oficiales provistas por los catálogos de marcas (Nike, Adidas, Topper, Umbro,
etc.).
[X] Fotos propias tomadas con teléfono celular para redes sociales.
[ ] Será necesario realizar una sesión de fotos de productos antes del lanzamiento.
4. Listas de Precios, Promociones y Personalizaciones
● ¿Manejan listas de precios diferenciadas o convenios especiales?
[ ] Precios minoristas vs. precios mayoristas.
[ ] Descuentos por cantidad a clubes, escuelas o ligas deportivas.
[ ] Combos y promociones por paquete (ej. conjunto completo camiseta + short +
medias).
[X] No manejamos ninguna lista de precios diferenciados. Todo es precio minorista.
● ¿Ofrecen servicios de personalización? (Estampado de nombres, dorsales,
números o sponsors en camisetas).
Respuesta: NO
Bloque 3: Operativa del Punto de Venta (POS), Hardware y Stock Concurrente
1. Identificación de Artículos y Códigos de Barra
● ¿La mercadería que compran a proveedores ya viene con código de barras de
fábrica?
[ ] Sí, la gran mayoría posee código EAN-13 estándar.
[X] No, muchos artículos vienen sin código (artículos genéricos, accesorios sueltos,
etc.). Algunas prendas de oferta están sin código de barra
● ¿Desean incorporar una impresora térmica de etiquetas para generar códigos
de barra propios del local, o prefieren buscar los artículos en pantalla mediante
buscador de texto/categorías?
Respuesta: Preferimos ambas opciones.
2. Equipamiento Físico del Mostrador
● ¿Cuántas cajas o terminales de cobro simultáneas funcionarán en el local?
Respuesta: 2 cajas
● ¿Qué periféricos planean utilizar en el puesto de cobro?
[X] Lector de código de barras (USB o inalámbrico).
[X] Impresora térmica de tickets comandera (58mm o 80mm).
[X] Gaveta / cajón de dinero con apertura automática al cobrar.
3. Gestión de Stock Concurrente (Local Físico vs. Web / Redes)
● ¿Cómo gestionan hoy cuando un cliente pide apartar un producto por
WhatsApp/Instagram mientras el local está abierto al público?
(¿Cómo evitan que otro vendedor lo venda en el mostrador en ese lapso?)
Respuesta: Lo separan del resto de los productos teniendo en cuenta el tiempo en el
que se cree que se va a retirar.
● En el nuevo sistema: ¿Desean una función de "Reserva Temporal" (ej. bloquear

stock por 2 horas para un cliente de WhatsApp hasta que envíe el comprobante
de transferencia)?
Respuesta: No es importante pero sería bueno tenerlo.
● ¿Cómo debe comportarse la tienda web cuando un producto se queda sin
stock?
[ ] Ocultar el producto automáticamente.
[X] Mostrarlo como «Agotado» impidiendo la compra.
[ ] Permitir dejar un correo / WhatsApp con aviso de reingreso («Avisarme cuando
haya stock»).
4. Tolerancia a Cortes de Conectividad (Modo Offline)
● Ante un corte temporal del servicio de internet en el local físico, ¿es
indispensable que el mostrador pueda seguir cobrando y emitiendo tickets en
modo offline para luego sincronizarse automáticamente al volver la red?
Respuesta: Es obligatorio tener un modo offline para seguir procesando ventas
Bloque 4: Pagos, Facturación, Envíos y Postventa
1. Métodos de Cobro y Promociones
● En el local: ¿Qué medios reciben actualmente?
[X] Efectivo.
[X] Tarjetas de débito / crédito (POSNET tradicional / Mercado Pago Point).
[X] Transferencias bancarias (Alias / CBU).
[X] QR de billeteras virtuales (Mercado Pago, Cuenta DNI, MODO, etc.).
● En la web: ¿Qué opciones desean habilitar para los clientes online?
[X] Pasarela online (Mercado Pago Checkout / Tarjetas / Dinero en cuenta).
[X] Transferencia bancaria directa con carga de comprobante.
[X] Pago al retirar en el local físico.
● ¿Aplican promociones o recargos según el método de pago? (Descuento en
efectivo, recargo en cuotas con tarjeta, etc.)
Respuesta: No se realizan recargos, pero se tiene un límite de compra respecto a las
cuotas dependiendo del precio (3 cuotas si la compra es superior a $30.000, 4 cuotas
si es superior a 80.000)
2. Facturación y Aspectos Impositivos (AFIP / ARCA)
● ¿Cuál es la condición fiscal del comercio ante AFIP/ARCA?
[ ] Monotributo.
[X] Responsable Inscripto.
● ¿Cómo emiten comprobantes actualmente?
[ ] Facturación manual en talonario de papel.
[X] Portal web "Comprobantes en Línea" de AFIP.
[X] Controlador fiscal físico de vieja/nueva generación.
● ¿El nuevo sistema debe emitir Factura Electrónica (Facturas A, B, C)

conectándose directamente con AFIP/ARCA, o emitirá comprobantes internos
no fiscales (tickets de control / presupuestos)?
Respuesta: Debería tener la opción de decidir el tipo de comprobante según la venta.
3. Cuentas Corrientes, Fiados y Señas
● ¿Manejan ventas a Cuenta Corriente ("fiado" o pago a fin de mes) con clubes,
instituciones o clientes de confianza?
¿El sistema debe llevar el saldo adeudado y el historial de pagos de cada
cliente?
Respuesta: NO
● Al encargar trabajos especiales (ej. indumentaria personalizada), ¿cobran señas
o anticipos (ej. 50%)? ¿El sistema debe emitir un comprobante de seña y
descontar el saldo restante contra entrega?
Respuesta: NO (Porque no se realiza este tipo de trabajo)
4. Logística y Modalidades de Entrega
● ¿Cuáles serán las opciones de envío ofrecidas en la tienda online?
[X] Retiro gratuito en el local (Saavedra 241).
[X] Cadetería local / moto-mensajería dentro de la ciudad de Formosa.
[X] Envíos al interior de la provincia y a todo el país (Correo Argentino, Andreani,
encomiendas por micro).
5. Políticas de Postventa, Cambios y Garantías
● ¿Cómo gestionan hoy los cambios de talle o modelo?
(¿Qué plazo se le otorga al cliente? ¿Debe presentar el ticket/comprobante
obligatoriamente?)
Respuesta: Se le obliga que la prenda tenga la etiqueta y esté en buen estado, sin
límite de tiempo y sin necesidad de presentar un ticket.
● Si un cliente compra por la tienda web, ¿puede realizar el cambio físicamente en
el local?
Respuesta: Sí, se puede realizar un cambio en el local. El problema es a nivel
nacional, donde inicialmente se cobraría el envío.
● Si un cliente devuelve un producto y no elige otro en el momento:
[X] Se le emite una Nota de Crédito / Vale de compra para usar a futuro.
[ ] Se le reintegra el dinero por el mismo medio que pagó.
● Frente a aumentos de precios por inflación entre la fecha de compra y la fecha
del cambio de talle:
¿Se le respeta el cambio mano a mano del mismo producto, o debe abonar la
diferencia de precio?
Respuesta: Se le respeta el cambio del mismo producto. Existen complicaciones de
llevar registro si se lleva algo de oferta (mayormente son prendas no tienen cambio, al
ser únicas)
Bloque 5: Experiencia del Usuario (UX) y Canales de Atención
1. Flujo de Compra en la Web
● ¿La compra requerirá registro obligatorio de usuario con contraseña, o se

permitirá compra rápida como invitado (guest checkout) solicitando solo datos
de contacto y envío?
Respuesta: Se necesita que sea lo más fácil para el cliente
2. Canales de Notificación y Asistencia
● ¿Qué canales de comunicación prefieren para notificar al cliente sobre su
compra y estado del pedido?
[ ] Correo electrónico automático.
[ ] Mensaje directo por WhatsApp.
[X] Ambos.
● ¿Desean un botón flotante de WhatsApp en la web que incluya el enlace y
nombre exacto del producto que el usuario está viendo en pantalla al iniciar la
conversación?
Respuesta: Sí, me gustaría tener esa opción.

Bloque 6: Roles de Usuario, Reportes y Plan de Transición
1. Permisos y Perfiles de Acceso al Sistema
● ¿Qué roles operarán dentro de la plataforma y qué permisos tendrán?
○ Administrador / Dueño: Acceso total a precios de costo, márgenes de
ganancia, reportes financieros y configuración general.
○ Cajero / Vendedor de mostrador: Permisos para consultar stock, registrar
ventas, cobrar y emitir tickets (sin acceso a costos del negocio).
○ Operador de Despacho / Catálogo: Permisos para actualizar
fotos/descripciones y marcar pedidos web como "empaquetados / enviados".
○ Cualquier otro ROL necesario que sirva para el funcionamiento del sistema.
2. Reportes Clave y Métricas para los Dueños
● ¿Qué información necesitan ver en su panel de control al final del día o mes?
[X] Total facturado por medio de pago (Efectivo vs. Mercado Pago vs. Transferencias).
[X] Alertas automáticas de productos con stock bajo o agotado.
[X] Ranking de productos, marcas y disciplinas más vendidas.
[X] Rendimiento de ventas web vs. ventas físicas del local.
[X] Ganancia bruta estimada del período.
3. Plan de Capacitación y Marcha Blanca
● ¿Están de acuerdo en realizar un período de prueba (marcha blanca) de 1 a 2
semanas donde el nuevo sistema conviva con el método tradicional antes del
apagado definitivo del cuaderno?
Respuesta: Sí.

Configuración Inicial de Github
Carga Inicial en el Trello