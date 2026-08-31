const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberOfPages,
  convertInchesToTwip
} = require('docx');

const PRIMARY_COLOR = '1E5128';    // Verde institucional Matacos
const SECONDARY_COLOR = '2C3E50';  // Azul oscuro / Gris pizarra
const TEXT_COLOR = '222222';       // Texto principal
const MUTED_COLOR = '555555';      // Texto secundario / notas
const LINK_COLOR = '0B66C3';       // Azul enlaces
const BG_CALLOUT = 'F2F7F2';       // Fondo claro para cajas
const BG_HEADER = 'E8F2E8';        // Fondo para encabezados de tabla
const ACCENT_BORDER = '2E7D32';    // Borde de acento

function createDocTitle(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.TITLE,
    spacing: { before: 240, after: 140 },
    run: {
      size: 38, // 19pt
      bold: true,
      color: PRIMARY_COLOR,
      font: 'Arial'
    },
    alignment: AlignmentType.CENTER
  });
}

function createSubTitle(text) {
  return new Paragraph({
    text: text,
    spacing: { before: 0, after: 220 },
    run: {
      size: 24, // 12pt
      bold: true,
      color: SECONDARY_COLOR,
      font: 'Arial'
    },
    alignment: AlignmentType.CENTER
  });
}

function createH1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    run: {
      size: 28, // 14pt
      bold: true,
      color: PRIMARY_COLOR,
      font: 'Arial'
    },
    border: {
      bottom: {
        color: PRIMARY_COLOR,
        space: 6,
        value: BorderStyle.SINGLE,
        size: 14
      }
    }
  });
}

function createH2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    run: {
      size: 24, // 12pt
      bold: true,
      color: SECONDARY_COLOR,
      font: 'Arial'
    }
  });
}

function createH3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 60 },
    run: {
      size: 21, // 10.5pt
      bold: true,
      color: '333333',
      font: 'Arial'
    }
  });
}

function createP(text, options = {}) {
  const { bold = false, italic = false, color = TEXT_COLOR, size = 20, spaceAfter = 100, spaceBefore = 0, indent = 0 } = options;
  return new Paragraph({
    spacing: { before: spaceBefore, after: spaceAfter },
    indent: indent ? { left: indent } : undefined,
    children: [
      new TextRun({
        text,
        bold,
        italics: italic,
        color,
        size,
        font: 'Arial'
      })
    ]
  });
}

function createBullet(title, text, indent = 360) {
  const children = [];
  if (title) {
    children.push(
      new TextRun({
        text: "• " + title + ": ",
        bold: true,
        color: SECONDARY_COLOR,
        size: 20,
        font: 'Arial'
      })
    );
  } else {
    children.push(
      new TextRun({
        text: "• ",
        bold: true,
        color: SECONDARY_COLOR,
        size: 20,
        font: 'Arial'
      })
    );
  }
  children.push(
    new TextRun({
      text: text,
      color: TEXT_COLOR,
      size: 20,
      font: 'Arial'
    })
  );

  return new Paragraph({
    spacing: { before: 30, after: 70 },
    indent: { left: indent },
    children
  });
}

function createInterviewBlock(title, func, expected, questions) {
  return [
    createH3(title),
    createBullet("Función del Bloque", func, 360),
    createBullet("Información Esperada", expected, 360),
    createBullet("Clase de Preguntas Formuladas", questions, 360),
    new Paragraph({ spacing: { before: 20, after: 80 } })
  ];
}

function createTechItem(name, desc, layer, businessValue, url) {
  return [
    createH3(name),
    createBullet("¿Qué es?", desc, 360),
    createBullet("Capa de Uso", layer, 360),
    createBullet("Valor para el Negocio", businessValue, 360),
    new Paragraph({
      spacing: { before: 20, after: 120 },
      indent: { left: 360 },
      children: [
        new TextRun({
          text: "• Fuente Oficial: ",
          bold: true,
          color: SECONDARY_COLOR,
          size: 20,
          font: 'Arial'
        }),
        new TextRun({
          text: url,
          color: LINK_COLOR,
          underline: {},
          size: 19,
          font: 'Arial'
        })
      ]
    })
  ];
}

function createMetadataTable(metadata) {
  const rows = metadata.map(([label, value]) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: 'EAF2EA', type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.SINGLE, size: 24, color: PRIMARY_COLOR },
            right: { style: BorderStyle.NONE }
          },
          margins: { top: 80, bottom: 80, left: 140, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: label,
                  bold: true,
                  color: PRIMARY_COLOR,
                  size: 19,
                  font: 'Arial'
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 6200, type: WidthType.DXA },
          shading: { fill: BG_CALLOUT, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          margins: { top: 80, bottom: 80, left: 120, right: 140 },
          children: value.split('\n').map(line => new Paragraph({
            spacing: { before: 15, after: 15 },
            children: [
              new TextRun({
                text: line,
                color: TEXT_COLOR,
                size: 19,
                font: 'Arial'
              })
            ]
          }))
        })
      ]
    });
  });

  return new Table({
    width: { size: 9200, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    rows: rows
  });
}

function createCustomTable(headers, rowsData, widths) {
  const headerRow = new TableRow({
    children: headers.map((headerText, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: BG_HEADER, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 10, color: PRIMARY_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 14, color: PRIMARY_COLOR },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'D0D0D0' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'D0D0D0' }
      },
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: headerText,
              bold: true,
              color: PRIMARY_COLOR,
              size: 19,
              font: 'Arial'
            })
          ]
        })
      ]
    }))
  });

  const contentRows = rowsData.map((row, rIdx) => new TableRow({
    children: row.map((cellText, cIdx) => new TableCell({
      width: { size: widths[cIdx], type: WidthType.DXA },
      shading: { fill: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FBF8', type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' }
      },
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: cellText.split('\n').map(line => new Paragraph({
        spacing: { before: 15, after: 15 },
        children: [
          new TextRun({
            text: line,
            size: 18,
            font: 'Arial',
            color: TEXT_COLOR
          })
        ]
      }))
    }))
  }));

  return new Table({
    width: { size: 9200, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    rows: [headerRow, ...contentRows]
  });
}

async function buildDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 20,
            color: TEXT_COLOR
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1)
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Matacos Deportes  |  Informe Mensual Mes 1  |  PPS I",
                    size: 16,
                    color: MUTED_COLOR,
                    italics: true,
                    font: 'Arial'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Página ",
                    size: 18,
                    color: MUTED_COLOR,
                    font: 'Arial'
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: MUTED_COLOR,
                    font: 'Arial'
                  }),
                  new TextRun({
                    text: " de ",
                    size: 18,
                    color: MUTED_COLOR,
                    font: 'Arial'
                  }),
                  new TextRun({
                    children: [NumberOfPages],
                    size: 18,
                    color: MUTED_COLOR,
                    font: 'Arial'
                  })
                ]
              })
            ]
          })
        },
        children: [
          // PORTADA / ENCABEZADO
          createDocTitle("Matacos Deportes - Informe Mensual Mes 1"),
          createSubTitle("Práctica Profesional Supervisada I - Agosto 2026"),

          createMetadataTable([
            ["Institución", "Universidad de la Cuenca del Plata - Sede Formosa"],
            ["Facultad / Carrera", "Facultad de Ingeniería, Tecnología y Arquitectura - Lic. en Sistemas de Información"],
            ["Cátedra", "Práctica Profesional Supervisada I"],
            ["Docente a Cargo", "Prof. Dr. Cerquand, Cristian Fernando"],
            ["Alumnos / Integrantes", "Dellagnolo, Ricardo Agustín (DNI: 45.817.894)\nFornari, Nahir Agustín (DNI: 46.154.364)\nBordón Sbardella, Lourdes (DNI: [Completar DNI])\nGonzález, Eugenia Milagros (DNI: 46.254.327)"],
            ["Organización / Cliente", "Matacos Deportes (Saavedra 241, Formosa, Argentina)"],
            ["Referentes del Cliente", "Sandra Mujica y Miguel Ángel Marchi (Socios Propietarios)"]
          ]),

          new Paragraph({ spacing: { before: 180, after: 80 } }),

          // 1. INTRODUCCIÓN
          createH1("1. Introducción"),
          createP("El presente documento constituye el Informe Mensual correspondiente al Mes 1 (Agosto 2026) de la Práctica Profesional Supervisada I (PPS I) de la carrera de Licenciatura en Sistemas de Información de la Universidad de la Cuenca del Plata (Sede Formosa)."),
          createP("Su propósito fundamental es formalizar la etapa inicial de diagnóstico, elicitación de requerimientos, análisis de dominio y definición de la propuesta tecnológica para el proyecto de desarrollo e implementación del Sistema Integral Web (E-commerce), Punto de Venta (POS) y Gestión Concurrente de Stock para el comercio local Matacos Deportes."),
          createP("Matacos Deportes es una tienda tradicional de indumentaria, calzado y accesorios deportivos con más de 25 años de trayectoria ininterrumpida en la ciudad de Formosa. A lo largo de su historia, el negocio ha operado bajo un esquema 100% analógico, basando el registro de sus operaciones diarias en cuadernos de ventas manuscritos, control de caja manual y remarcación artesanal de precios producto por producto."),
          createP("Frente a este escenario, el equipo de trabajo llevó a cabo durante este primer mes un exhaustivo proceso de relevamiento mediante entrevistas en profundidad con los dueños del establecimiento, análisis de procesos operativos actuales (AS-IS) y benchmarking de plataformas de comercio electrónico líderes del sector deportivo nacional (Rossetti Deportes y SoloDeportes). A partir de estos insumos, se definieron los objetivos del proyecto, el alcance y los límites del sistema a desarrollar, la metodología incremental de trabajo con Kanban y la especificación detallada de los requerimientos funcionales y no funcionales que guiarán las sucesivas etapas de diseño, arquitectura, desarrollo, pruebas y puesta en producción."),

          // 2. CONTEXTO
          createH1("2. Contexto"),
          createH2("2.1. Breve Descripción de la Empresa"),
          createP("Matacos Deportes es un emprendimiento comercial del rubro deportivo ubicado en la calle Saavedra 241 de la ciudad de Formosa, Provincia de Formosa, Argentina. Fue fundado en septiembre del año 1999 por Sandra Mujica (comerciante oriunda de Formosa) y su cónyuge Miguel Ángel Marchi (arquitecto)."),
          createH3("Origen y Evolución Histórica"),
          createP("El negocio inició sus actividades comerciales originalmente en el Paseo de Compras (calle San Martín, conocido popularmente como 'el Mercadito') bajo el nombre de fantasía 'M y M', orientado a la indumentaria urbana unisex. Al poco tiempo, y a partir de la experiencia previa de Sandra en comercios deportivos en la ciudad de Resistencia (Chaco), los fundadores identificaron una demanda insatisfecha en la plaza local: mientras las casas de deportes tradicionales de Formosa centraban su oferta casi exclusivamente en el calzado de fútbol, los deportistas y profesores de diversas disciplinas carecían de un proveedor local especializado en accesorios deportivos técnicos (vendas, bucales, mallas de entrenamiento para natación, medias térmicas, canilleras, rodilleras, artículos de gimnasio y mochilas técnicas Wilson)."),
          createP("Esta oportunidad impulsó la reconversión del negocio hacia una tienda integral de deportes y su posterior traslado al microcentro formoseño, instalándose primero en calle Saavedra 238 (donde funcionó durante una década) y estableciéndose a partir de 2019 en su local definitivo de Saavedra 241."),
          createH3("Identidad Institucional y Marca"),
          createP("Para diferenciarse de la proliferación de comercios con denominaciones similares, los dueños decidieron renombrar el negocio como 'Matacos', en homenaje e identificación con las raíces culturales y pueblos originarios de la región del Gran Chaco. La marca se encuentra debidamente registrada como marca comercial. Su identidad gráfica evolucionó desde un logotipo inicial en tonos amarillos con una silueta representativa hacia una paleta centrada en tonalidades verdes, asociadas al aire libre, el fitness, la vida sana y las disciplinas de campo."),
          createH3("Vínculo Comunitario y Diferenciación"),
          createP("A lo largo de su trayectoria de más de 25 años, Matacos Deportes ha superado hitos complejos de la economía provincial y nacional (como la crisis de 2001-2002 con la circulación de bonos provinciales Bocanfor y LECOP). Se ha consolidado como un referente del deporte formoseño, apoyando institucionalmente al Club Náutico Formosa y participando en acciones promocionales con deportistas de trascendencia como la voleibolista internacional formoseña Mimí Sosa y la boxeadora Alejandra 'Locomotora' Oliveras."),
          createP("El principal valor diferencial del comercio radica en la atención personalizada y el asesoramiento técnico pre y post-venta brindado directamente por sus dueños, generando una sólida relación de fidelidad y confianza con la comunidad deportiva local."),

          createH2("2.2. Necesidad / Problemática"),
          createP("Pese a su posicionamiento y volumen comercial, Matacos Deportes enfrenta una serie de restricciones y problemáticas operativas derivadas de su funcionamiento analógico:"),
          createBullet("Inexistencia de Base de Datos Centralizada y Control Ciego de Inventario", "El comercio carece de un registro digital de su stock (estimado entre 100 y 200 artículos con múltiples variantes de talle y color). El control se realiza de manera visual o en papel, generando desconocimiento del inventario real y riesgo de quiebres de stock."),
          createBullet("Registro Manual de Ventas y Arqueo de Caja Ineficiente", "Cada venta se anota a mano en un cuaderno. Al finalizar la jornada, el cierre de caja requiere una conciliación artesanal entre el efectivo del cajón, los cupones de tarjetas/posnet y las transferencias bancarias, proceso lento y propenso a errores humanos."),
          createBullet("Remarcación de Precios Manual frente a la Inflación", "Ante aumentos de proveedores, los precios se actualizan remarcando a mano etiquetas adhesivas producto por producto y redactando listas en papel, lo que retrasa el traslado de costos e impacta en la rentabilidad."),
          createBullet("Limitación Geográfica y Horaria (Falta de Canal Digital)", "Las operaciones dependen del horario comercial presencial en Saavedra 241. Cuando se apartan productos por WhatsApp/Instagram, se colocan en un rincón del mostrador con alto riesgo de que otro vendedor los venda por falta de sincronización."),
          createBullet("Desconexión con Servicios Fiscales y de Hardware", "La facturación fiscal se realiza de forma aislada mediante el portal de AFIP o controladores fiscales físicos desconectados del registro de ventas, duplicando la carga administrativa de los dueños (Responsables Inscriptos)."),
          createBullet("Vulnerabilidad ante Cortes de Conectividad y Energía", "Los cortes temporales de red o microcortes eléctricos exigen que cualquier solución digital soporte trabajo sin conexión (Offline-First) en mostrador."),

          // 3. TÉCNICAS DE ELICITACIÓN (DETALLADA CON BLOQUES)
          createH1("3. Técnicas de Elicitación"),
          createP("Para el relevamiento y especificación de requerimientos se aplicaron técnicas cualitativas y de análisis comparativo articuladas en dos metodologías: la Entrevista Estructurada de Dominio y el Benchmarking de Plataformas Competidoras en Internet."),
          
          createH2("3.1. Entrevista Estructurada y Cuestionario de Dominio"),
          createP("La técnica central consistió en una entrevista presencial en profundidad realizada el miércoles 26 de agosto de 2026 en el local de Saavedra 241 con los propietarios Sandra Mujica y Miguel Ángel Marchi, coordinada por los alumnos Dellagnolo Ricardo y Fornari Nahir."),
          createP("El cuestionario se estructuró en 7 bloques temáticos específicos, diseñados para cubrir desde la identidad de marca hasta la arquitectura operativa del software:"),

          ...createInterviewBlock(
            "Bloque 0: Historia, Identidad Institucional y Vínculo Comunitario",
            "Relevar la identidad corporativa, trayectoria de 25 años, hitos, filosofía de negocio y vínculos deportivos locales para nutrir el branding y la sección «Quiénes Somos» de la tienda online.",
            "Año de fundación (1999), fundadores, evolución de locaciones, motivo cultural del nombre «Matacos», rediseños del logo y colores (verde fitness), superación de la crisis 2001 (Bocanfor/LECOP), relación con atletas (Mimí Sosa, Locomotora Oliveras, Club Náutico) y factores de diferenciación.",
            "Preguntas abiertas cualitativas de reconstrucción histórica: ¿En qué año abrió y quiénes fundaron el local? ¿Cómo surgió la idea de transicionar a tienda deportiva? ¿Cuál es el significado del nombre y la evolución del logo? ¿Qué hitos marcaron la trayectoria? ¿Qué valor los diferencia de las grandes cadenas?"
          ),

          ...createInterviewBlock(
            "Bloque 1: Diagnóstico Operativo Actual (AS-IS Analógico)",
            "Mapear los procesos operativos manuales vigentes para comprender cómo funciona el negocio en el papel, detectar cuellos de botella y diseñar pantallas intuitivas sin fricción.",
            "Registro manuscrito de ventas en cuaderno, procedimiento artesanal de arqueo y cierre de caja (conciliación cuaderno vs. posnet/efectivo), método de consulta y remarcación manual de precios por inflación y nivel de alfabetización digital del personal.",
            "Preguntas de opción múltiple y descriptivas de hábitos operativos: ¿Cómo anotan las ventas en mostrador? ¿Cómo realizan el cierre de caja diario y la conciliación de medios de cobro? ¿Cómo saben los precios y cómo trasladan aumentos de proveedores? ¿Qué dispositivo prefieren para cobrar (PC, notebook o tablet)?"
          ),

          ...createInterviewBlock(
            "Bloque 2: Catálogo, Inventario Inicial y Reglas de Negocio",
            "Dimensionar la magnitud del inventario físico, definir la estructura de datos para variantes (talles, colores, disciplinas) y establecer las reglas comerciales de comercialización.",
            "Volumen estimado de SKUs físicos (100–200 artículos), existencia de inventario parcial en papel, estrategia de carga inicial progresiva por marcas, taxonomía de disciplinas, variantes de talles (calzado/indumentaria/géneros), disponibilidad de fotos y política de precios 100% minorista.",
            "Preguntas cuantitativas y de clasificación: ¿Cuántos artículos distintos estiman tener físicamente? ¿Cómo planifican realizar el primer inventario para la base de datos? ¿Cómo organizan disciplinas y variantes? ¿Disponen de fotos digitales para la web? ¿Manejan precios mayoristas o promociones?"
          ),

          ...createInterviewBlock(
            "Bloque 3: Operativa del Punto de Venta (POS), Hardware y Stock Concurrente",
            "Especificar el equipamiento físico de mostrador, evaluar códigos de barra y definir las reglas de concurrencia e integridad de inventario entre el local y los canales remotos.",
            "Presencia de códigos EAN-13 en mercadería, necesidad de imprimir etiquetas propias, cantidad de terminales de cobro simultáneas (2 notebooks), periféricos (lector de barras USB, impresora térmica, gaveta automática), manejo de reservas por WhatsApp y necesidad mandatoria de modo offline.",
            "Preguntas técnicas de hardware y concurrencia: ¿La mercadería viene con código de barras de fábrica? ¿Cuántas cajas simultáneas funcionarán y qué periféricos usarán? ¿Cómo gestionan productos apartados por redes para evitar sobreventa? ¿Cómo debe actuar la web ante artículos agotados? ¿Es indispensable el modo offline?"
          ),

          ...createInterviewBlock(
            "Bloque 4: Pagos, Facturación, Envíos y Postventa",
            "Determinar los flujos monetarios, métodos de pago aceptados, situación impositiva ante AFIP/ARCA, logística de despachos y políticas de postventa y cambios.",
            "Medios de cobro físicos (efectivo, posnet, transferencias) y web (Mercado Pago, transferencias, retiro), límites de cuotas, condición fiscal (Responsable Inscripto), modalidad de comprobantes (Facturas A y B con CAE vs tickets internos), logística (local, cadetería Formosa, Correo Argentino) y cambios con etiqueta respetando precio mano a mano.",
            "Preguntas tributarias, financieras y logísticas: ¿Qué medios de pago reciben en local y web? ¿Cuál es su condición fiscal ante AFIP/ARCA? ¿El sistema debe emitir Factura Electrónica directa o tickets internos? ¿Cuáles serán las opciones de envío? ¿Cómo gestionan cambios de talle o devoluciones?"
          ),

          ...createInterviewBlock(
            "Bloque 5: Experiencia del Usuario (UX) y Canales de Atención",
            "Diseñar la interacción del comprador con la tienda web para facilitar la compra, reducir el abandono y optimizar la comunicación directa con el vendedor.",
            "Preferencia por compra rápida como invitado (Guest Checkout) sin registro obligatorio con contraseña, canales de notificación (WhatsApp y correo) y requerimiento de botón flotante de WhatsApp vinculado al producto visto en pantalla.",
            "Preguntas de usabilidad y experiencia de cliente: ¿La compra web requerirá registro obligatorio o compra como invitado? ¿Por qué canales prefieren notificar estados de pedido? ¿Desean un botón flotante de WhatsApp que incluya el enlace y nombre exacto del producto visto?"
          ),

          ...createInterviewBlock(
            "Bloque 6: Roles de Usuario, Reportes y Plan de Transición",
            "Definir los perfiles de acceso y seguridad, establecer los reportes gerenciales para toma de decisiones y acordar la estrategia de transición y capacitación.",
            "Jerarquía de roles (Administrador con costos, Cajero para POS, Despacho para catálogo/pedidos), métricas en panel de control (facturación por medio de pago, alertas de stock mínimo, ranking de más vendidos) y acuerdo de marcha blanca de 1 a 2 semanas.",
            "Preguntas de gobernanza, reportería y gestión del cambio: ¿Qué roles operarán en la plataforma y qué permisos tendrán? ¿Qué métricas necesitan ver en su panel de control al final del día o mes? ¿Están de acuerdo en realizar una marcha blanca de 1 a 2 semanas de convivencia con el cuaderno?"
          ),

          createH2("3.2. Análisis de Sistemas en Internet (Benchmarking de Competidores)"),
          createP("Se realizó un análisis funcional y de experiencia de usuario sobre plataformas líderes del retail deportivo argentino: Rossetti Deportes y SoloDeportes."),

          createCustomTable(
            ["Dimensión / Característica", "Rossetti Deportes", "SoloDeportes"],
            [
              ["Navegación y Catálogo", "Jerarquía por disciplina y marcas con enfoque multisede.", "Búsqueda predictiva avanzada y navegación por facetas."],
              ["Ficha de Producto", "Galería responsiva y selector de talles con validación visual.", "Guía de talles interactiva con equivalencias AR/US/EUR/cm."],
              ["Gestión de Stock", "Indicador de disponibilidad por sucursal física.", "Bloqueo temporal en carrito para evitar sobreventas."],
              ["Checkout y Pasarela", "Mercado Pago Checkout Pro y transferencias bancarias.", "Checkout transparente con multi-pasarela y cuotas automáticas."],
              ["Logística y Entrega", "Retiro en sucursal y convenios de transporte regional.", "Integración con Correo Argentino y Andreani en tiempo real."],
              ["Atención al Cliente", "Formularios de contacto y soporte estándar.", "Botón flotante de WhatsApp contextual al producto visto."]
            ],
            [2600, 3300, 3300]
          ),
          new Paragraph({ spacing: { before: 80, after: 80 } }),

          createP("De este análisis se adoptaron: navegación por disciplinas clave de Formosa (Natación, Vóley, Crocs, Gym), botón contextual de WhatsApp con enlace al producto en pantalla, compra como invitado (Guest Checkout) y sincronización atómica de stock."),

          // 4. PROPUESTA DE DESARROLLO (NARRATIVA EXPANDIDA)
          createH1("4. Propuesta de Desarrollo"),
          createH2("4.1. Explicación Narrativa de la Arquitectura del Sistema"),
          createP("La solución integral propuesta para Matacos Deportes se sustenta en una Arquitectura de Software Híbrida diseñada específicamente para responder a dos realidades complementarias del negocio: la necesidad de contar con una tienda web moderna y permanentemente disponible para clientes de todo el país, y la exigencia de disponer de un puesto de cobro físico en mostrador ultra rápido, confiable e inmune a las interrupciones del servicio de internet local."),
          
          createH3("1. El Entorno en la Nube (Servidor Cloud / VPS 24/7/365)"),
          createP("En este entorno remoto se despliegan la Tienda Web E-commerce, la API Central del Negocio y la Base de Datos Principal."),
          createBullet("Disponibilidad Permanente", "Al residir en un centro de datos profesional con suministro eléctrico ininterrumpido y enlaces de fibra óptica de alta velocidad, la tienda online permanece abierta los 365 días del año las 24 horas. Los clientes pueden explorar el catálogo, verificar talles disponibles y comprar calzado o indumentaria durante la noche, feriados o fines de semana, sin depender de que la computadora del local de Saavedra 241 se encuentre encendida."),
          createBullet("Procesamiento de Pagos y Notificaciones", "La nube aloja los servicios que reciben las notificaciones automáticas (webhooks) de Mercado Pago al momento en que un cliente abona por la web o mediante QR, actualizando el estado de la compra de inmediato."),
          createBullet("Facturación Electrónica", "La API central se comunica directamente con los servidores de AFIP/ARCA para solicitar los Códigos de Autorización Electrónico (CAE) reglamentarios, garantizando que los comprobantes fiscales se emitan de forma transparente y legal."),

          createH3("2. El Entorno Local en Mostrador (Local Físico Saavedra 241 - Punto de Venta POS)"),
          createP("En el local físico funcionan dos computadoras portátiles (notebooks) dedicadas a la atención de los clientes presenciales, equipadas con lectores de códigos de barra USB, impresoras térmicas de tickets y cajón portamonedas."),
          createBullet("Operación Fluida y Ágil", "El Punto de Venta está optimizado para cobrar en cuestión de segundos utilizando atajos de teclado o pasando la pistola lectora sobre la etiqueta del artículo."),
          createBullet("Modo Sin Conexión (Offline-First)", "Cada notebook almacena en su memoria local (a través de la base de datos embebida en el navegador) una copia del inventario y de los precios vigentes. Si se produce un corte en el servicio de internet en la cuadra del local, el sistema no se detiene ni muestra pantallas de error: el cajero puede continuar registrando ventas en efectivo, calculando vueltos y emitiendo tickets normalmente."),

          createH3("3. Sincronización Inteligente y Consistencia de Stock"),
          createP("La comunicación entre el mostrador y la nube opera mediante un esquema de sincronización bidireccional automática:"),
          createBullet("En condiciones normales de red", "Cada venta confirmada en el mostrador envía un mensaje instantáneo a la nube para descontar esa unidad del stock disponible en la web. De este modo, si un cliente en el local adquiere el último par de zapatillas de determinado talle, la tienda online lo marca automáticamente como «Agotado» en fracciones de segundo, eliminando por completo el riesgo de sobreventa."),
          createBullet("Ante un corte de internet", "Las ventas realizadas en el local físico se encolan de manera segura en el almacenamiento local. En cuanto la conexión a internet se restablece, el sistema detecta la red y transmite automáticamente todas las ventas acumuladas hacia la base de datos central sin que el personal deba realizar ninguna acción manual."),

          createH2("4.2. Alcances del Sistema"),
          createBullet("Módulo E-commerce (Tienda Web Pública 24/7)", "Catálogo responsivo en la nube, filtros avanzados por disciplina/marca/talles, ficha con variantes dinámicas, carrito de compras, guest checkout, pasarela Mercado Pago, transferencias con comprobante, botón flotante de WhatsApp y opciones de envío (Retiro en Saavedra 241, Cadetería local, Correo Argentino)."),
          createBullet("Módulo Punto de Venta (POS Mostrador)", "Operación en 2 notebooks, búsqueda instantánea por lector de código de barras (EAN-13/internos) o texto, cobro multiforma de pago, emisión de tickets térmicos (58/80mm), apertura de cajón de dinero, arqueo/cierre de caja y soporte Offline-First con IndexedDB."),
          createBullet("Módulo de Gestión de Inventario y Stock Concurrente", "Catálogo unificado con variantes (talle/color), carga progresiva inicial, actualización de precios, generador de etiquetas de código de barras y bloqueo transaccional para evitar sobreventas simultáneas."),
          createBullet("Módulo de Facturación y Comprobantes", "Conexión con Web Services AFIP/ARCA (WSAA/WSFE) para Facturas A y B con CAE, opción de comprobantes internos no fiscales y emisión de notas de crédito / vales de compra para cambios."),
          createBullet("Módulo de Administración, Seguridad y Reportes", "Control de acceso RBAC (Administrador, Cajero, Despacho), dashboard gerencial de ventas por medio de pago, ranking de artículos y gestión de pedidos web."),

          createH2("4.3. Límites del Sistema"),
          createBullet("Sin Cuentas Corrientes ni Fiados", "El sistema no gestiona deudas de clientes ni compras a plazo (política 100% minorista al contado/tarjeta)."),
          createBullet("Sin Módulo de Fabricación o Estampado Textil", "No contempla producción ni estampados personalizados a pedido, ya que el comercio opera solo con indumentaria terminada."),
          createBullet("Sin Contabilidad General ni Sueldos", "No confecciona balances generales, libros IVA Digital ni liquidación de haberes."),
          createBullet("Sin Aplicación Móvil Nativa de Tienda", "Se implementa como Web Responsive y Progressive Web App (PWA), sin publicar en Play Store / App Store."),

          // 5. OBJETIVOS
          createH1("5. Objetivos"),
          createH2("5.1. Objetivo General"),
          createP("Diseñar, desarrollar e implementar un Sistema Web Integral, Punto de Venta (POS) y Gestión Concurrente de Inventario con capacidades offline para el comercio 'Matacos Deportes', permitiendo modernizar y automatizar sus procesos de venta de mostrador, centralizar el control de stock en tiempo real y expandir su alcance comercial hacia el mercado digital local, provincial y nacional.", { bold: true, color: PRIMARY_COLOR }),

          createH2("5.2. Objetivos Específicos"),
          createBullet("1. Relevar y validar requerimientos", "Formalizar las necesidades funcionales y no funcionales a partir del diagnóstico operativo analógico actual."),
          createBullet("2. Diseñar arquitectura híbrida", "Garantizar disponibilidad 24/7 en la nube para el e-commerce y operación tolerante a cortes de red en mostrador (Offline-First)."),
          createBullet("3. Desarrollar Punto de Venta (POS)", "Crear interfaz ágil para 2 notebooks con lectura de códigos de barra, cobro multimetodopago, cajón de dinero y tickets."),
          createBullet("4. Desarrollar Tienda E-commerce", "Implementar catálogo responsive con variantes talle/color, checkout rápido, Mercado Pago y botón directo de WhatsApp."),
          createBullet("5. Sincronización Transaccional de Stock", "Implementar motor de consistencia en PostgreSQL para evitar sobreventas cruzadas entre local y web."),
          createBullet("6. Integrar Facturación AFIP/ARCA", "Conectar el sistema con Web Services fiscales para emisión de Facturas A y B con CAE y vales de cambio."),
          createBullet("7. Infraestructura y Despliegue en la Nube", "Configurar servidor VPS con contenedores Docker, Caddy Server (HTTPS automático) y backups diarios."),
          createBullet("8. Capacitación y Marcha Blanca", "Entrenar al personal y ejecutar un período de prueba de 1 a 2 semanas para garantizar una transición sin fricciones."),

          // 6. PLANIFICACIÓN (INCREMENTAL CON KANBAN Y CRONOGRAMA 15 DÍAS)
          createH1("6. Planificación"),
          createH2("6.1. Metodología de Desarrollo: Enfoque Incremental con Kanban"),
          createP("Para la gestión y ejecución del proyecto se adopta una metodología de desarrollo incremental apoyada en el marco Kanban, descartando esquemas rígidos como Scrum que imponen una sobrecarga de roles y ceremonias innecesaria para un equipo de cuatro integrantes."),
          createBullet("Visualización del Flujo de Trabajo", "Mediante un tablero visual (Por Hacer, En Análisis, En Desarrollo, En Pruebas, Completado), se mantiene visibilidad clara del estado de cada requerimiento."),
          createBullet("Límite de Trabajo en Curso (WIP)", "Se restringe la cantidad de tareas simultáneas en desarrollo para evitar cuellos de botella y maximizar el rendimiento."),
          createBullet("Entregas Incrementales Quincenales", "El software evoluciona en incrementos funcionales tangibles cada 15 días, permitiendo validaciones continuas con los dueños del comercio."),
          createBullet("Flexibilidad Operativa", "Permite reasignar prioridades de forma ágil según los resultados de cada etapa, adaptándose perfectamente al contexto de la PPS I."),

          createH2("6.2. Cronograma Detallado por Incrementos Quincenales (15 días)"),
          createCustomTable(
            ["Período / Incremento", "Foco Principal del Incremento", "Tareas Específicas y Estimación Horaria"],
            [
              [
                "Mes 1 (Agosto)\nIncremento 1\n(Días 1 a 15)",
                "Relevamiento Inicial y Diagnóstico AS-IS\n[Total: 50 hs]",
                "• Tarea 1.1: Reunión presencial y entrevista de elicitación con dueños (15 hs)\n• Tarea 1.2: Diagnóstico de procesos analógicos actuales (15 hs)\n• Tarea 1.3: Benchmarking de tiendas deportivas online (10 hs)\n• Tarea 1.4: Relevamiento y estimación del inventario físico (10 hs)"
              ],
              [
                "Mes 1 (Agosto)\nIncremento 2\n(Días 16 a 30)",
                "Especificación y Arquitectura\n[Total: 50 hs]",
                "• Tarea 1.5: Especificación formal de Requerimientos Funcionales y No Funcionales (20 hs)\n• Tarea 1.6: Selección y justificación del Stack Tecnológico e infraestructura Cloud (15 hs)\n• Tarea 1.7: Redacción, consolidación y revisión final del Informe Mensual Mes 1 (15 hs)"
              ],
              [
                "Mes 2 (Septiembre)\nIncremento 3\n(Días 31 a 45)",
                "Fundaciones, Base de Datos y Gestión de Stock\n[Total: 60 hs]",
                "• Tarea 2.1: Configuración de repositorio Git, entorno base Next.js y Docker local (10 hs)\n• Tarea 2.2: Modelado del esquema relacional en PostgreSQL con Prisma (15 hs)\n• Tarea 2.3: Desarrollo del Módulo de Gestión de Inventario y Stock (25 hs)\n• Tarea 2.4: Herramienta de carga inicial progresiva de catálogo (10 hs)"
              ],
              [
                "Mes 2 (Septiembre)\nIncremento 4\n(Días 46 a 60)",
                "Punto de Venta (POS) y Ventas Offline\n[Total: 70 hs]",
                "• Tarea 2.5: Desarrollo de interfaz de cobranza rápida de mostrador para notebooks (20 hs)\n• Tarea 2.6: Integración con lector de código de barras USB e impresora térmica (15 hs)\n• Tarea 2.7: Motor local (IndexedDB) para gestión de ventas sin conexión (20 hs)\n• Tarea 2.8: Módulo de apertura, arqueo y cierre de caja diario con soporte offline (15 hs)"
              ],
              [
                "Mes 3 (Octubre)\nIncremento 5\n(Días 61 a 75)",
                "Catálogo Web E-commerce y Responsive\n[Total: 60 hs]",
                "• Tarea 3.1: Maquetación y diseño visual de la tienda online (Mobile-First) (20 hs)\n• Tarea 3.2: Implementación de filtros dinámicos por disciplina, marca y talles (15 hs)\n• Tarea 3.3: Ficha individual de producto con variantes dinámicas (15 hs)\n• Tarea 3.4: Integración del botón flotante de WhatsApp contextual al producto (10 hs)"
              ],
              [
                "Mes 3 (Octubre)\nIncremento 6\n(Días 76 a 90)",
                "Carrito, Checkout y Pasarela Mercado Pago\n[Total: 60 hs]",
                "• Tarea 3.5: Desarrollo del carrito de compras y flujo de compra rápida Guest Checkout (20 hs)\n• Tarea 3.6: Integración con pasarela Mercado Pago y procesamiento de Webhooks (20 hs)\n• Tarea 3.7: Módulo de pago por transferencia bancaria con carga de comprobante (10 hs)\n• Tarea 3.8: Configuración de opciones de entrega (Retiro local, Cadetería, Correo Arg.) (10 hs)"
              ],
              [
                "Mes 4 (Noviembre)\nIncremento 7\n(Días 91 a 105)",
                "Facturación AFIP/ARCA, Sincronización y Dashboard\n[Total: 60 hs]",
                "• Tarea 4.1: Integración con Web Services AFIP/ARCA para Facturas A y B con CAE (25 hs)\n• Tarea 4.2: Sincronización automática de ventas offline y bloqueo de stock concurrente (20 hs)\n• Tarea 4.3: Panel administrativo gerencial y reportes de ventas por medio de pago (15 hs)"
              ],
              [
                "Mes 4 (Noviembre)\nIncremento 8\n(Días 106 a 120)",
                "Despliegue Cloud, Capacitación y Marcha Blanca\n[Total: 60 hs]",
                "• Tarea 4.4: Despliegue en servidor VPS en la Nube con Docker y Caddy Server HTTPS (15 hs)\n• Tarea 4.5: Pruebas integrales de rendimiento, seguridad y políticas de backup (10 hs)\n• Tarea 4.6: Capacitación presencial al personal y dueños en Saavedra 241 (15 hs)\n• Tarea 4.7: Período de marcha blanca (1-2 semanas de convivencia con cuaderno) y cierre (20 hs)"
              ]
            ],
            [2200, 2600, 4400]
          ),
          new Paragraph({ spacing: { before: 80, after: 80 } }),

          // 7. RECURSOS (STACK TECNOLÓGICO CON URLs Y EXPLICACIÓN ACCESIBLE)
          createH1("7. Recursos"),
          createH2("7.1. Stack Tecnológico (Explicación Conceptual, Capas y Fuentes Oficiales)"),

          ...createTechItem(
            "1. TypeScript",
            "Lenguaje de programación desarrollado por Microsoft que amplía JavaScript añadiendo comprobación estricta de tipos de datos para detectar errores antes de que lleguen a producción.",
            "Frontend (Tienda y POS) y Backend (Servidor y Base de Datos).",
            "Reduce drásticamente fallos al cobrar o registrar mercadería, garantizando que precios, cantidades y datos de clientes sean siempre consistentes.",
            "https://www.typescriptlang.org/"
          ),

          ...createTechItem(
            "2. Next.js 15 (con React 19)",
            "Framework líder para construir aplicaciones web modernas, combinando la interfaz visual con la lógica del servidor de forma organizada.",
            "Frontend (E-commerce y POS) y Backend (Server Actions y APIs).",
            "Carga instantánea de la tienda en celulares y PCs, mejorando el posicionamiento en Google y evitando que clientes abandonen compras por lentitud.",
            "https://nextjs.org/"
          ),

          ...createTechItem(
            "3. Tailwind CSS",
            "Herramienta moderna de diseño visual para construir estilos personalizados rápidos y limpios.",
            "Frontend (Diseño y maquetación de pantallas).",
            "Permite una apariencia visual profesional y 100% adaptable a celulares, notebooks y tablets, alineada a los colores verdes de Matacos.",
            "https://tailwindcss.com/"
          ),

          ...createTechItem(
            "4. shadcn/ui & Lucide Icons",
            "Colección de componentes de interfaz reutilizables (botones, modales, tablas, menús e iconos) con altos estándares de accesibilidad.",
            "Frontend (Componentes visuales de mostrador y web).",
            "Acelera el desarrollo con elementos probados, elegantes e intuitivos para el personal de mostrador.",
            "https://ui.shadcn.com/ | https://lucide.dev/"
          ),

          ...createTechItem(
            "5. PostgreSQL 16",
            "Motor de base de datos relacional potente, seguro y confiable para almacenar artículos, variantes, precios, clientes, ventas y cajas.",
            "Base de Datos / Persistencia Central.",
            "Garantiza transacciones seguras (ACID) y bloqueos momentáneos de stock para evitar vender la misma prenda al mismo tiempo en local y web.",
            "https://www.postgresql.org/"
          ),

          ...createTechItem(
            "6. Prisma ORM",
            "Puente de comunicación que conecta el código de programación con la base de datos PostgreSQL mediante modelos tipados.",
            "Backend / Persistencia.",
            "Facilita la actualización segura de datos, previniendo pérdidas de información durante modificaciones del sistema.",
            "https://www.prisma.io/"
          ),

          ...createTechItem(
            "7. Zustand & Dexie.js (IndexedDB)",
            "Librerías para gestión de estado en memoria y base de datos local embebida en la notebook.",
            "Frontend / Persistencia Local del POS.",
            "Hacen posible el Modo Offline: ante cortes de internet en el local, se sigue cobrando y emitiendo tickets sin perder ventas.",
            "https://zustand-demo.pmnd.rs/ | https://dexie.org/"
          ),

          ...createTechItem(
            "8. Zod",
            "Librería de validación de datos que revisa que DNIs, CUITs, importes y talles cumplan el formato correcto antes de procesarse.",
            "Frontend y Backend (Validación compartida).",
            "Previene errores humanos al cobrar o cargar productos, impidiendo datos incompletos o corruptos.",
            "https://zod.dev/"
          ),

          ...createTechItem(
            "9. Mercado Pago SDK",
            "Kit oficial de integración de la pasarela de pagos electrónicos líder de Argentina.",
            "Integración Externa / Pasarela de Pagos.",
            "Permite cobrar en la web con tarjetas, débito, dinero en cuenta y cuotas, confirmando pagos automáticamente las 24 hs.",
            "https://www.mercadopago.com.ar/developers"
          ),

          ...createTechItem(
            "10. Web Services AFIP / ARCA (afip.js)",
            "Módulo de conexión con servidores fiscales de ARCA (ex AFIP) para la autorización de comprobantes fiscales electrónicos.",
            "Backend / Integración Fiscal.",
            "Automatiza la emisión de Facturas A y B con CAE legal, ahorrando tiempo administrativo a los propietarios.",
            "https://www.afip.gob.ar/ws/ | https://afip.js.org/"
          ),

          ...createTechItem(
            "11. Docker & Docker Compose",
            "Plataforma que empaqueta la aplicación y la base de datos dentro de contenedores estandarizados.",
            "Infraestructura y DevOps.",
            "Garantiza que el sistema funcione exactamente igual en desarrollo que en producción, facilitando backups y migraciones.",
            "https://www.docker.com/"
          ),

          ...createTechItem(
            "12. Caddy Server",
            "Servidor web moderno que gestiona automáticamente certificados de seguridad SSL (candado verde HTTPS).",
            "Infraestructura / Servidor Web y Seguridad.",
            "Otorga navegación encriptada y segura sin costos adicionales por certificados, protegiendo datos de clientes.",
            "https://caddyserver.com/"
          ),

          ...createTechItem(
            "13. Servidor VPS Linux en la Nube (Cloud Hosting)",
            "Servidor virtual privado en centro de datos profesional conectado permanentemente a internet.",
            "Hosting / Infraestructura Global.",
            "Mantiene la tienda activa 24/7 los 365 días del año con un ahorro de más del 70% frente a un servidor físico propio en el local.",
            "https://www.hetzner.com/cloud | https://www.digitalocean.com/ | https://donweb.com/"
          ),

          createH2("7.2. Recursos Humanos"),
          createBullet("Dellagnolo, Ricardo Agustín (DNI: 45.817.894)", "Líder Técnico / Desarrollador Full-Stack (Arquitectura, backend, base de datos PostgreSQL, integración POS y DevOps)."),
          createBullet("Fornari, Nahir Agustín (DNI: 46.154.364)", "Desarrollador Full-Stack / Analista Funcional (Elicitación, desarrollo frontend Next.js, lógica de inventario e integración de pagos)."),
          createBullet("Bordón Sbardella, Lourdes (DNI: [Completar DNI])", "Desarrolladora Frontend / Especialista UI-UX y Documentación (Diseño de interfaces con shadcn/ui, experiencia de usuario y manuales)."),
          createBullet("González, Eugenia Milagros (DNI: 46.254.327)", "Desarrolladora Backend / QA Tester (Esquemas de datos, validaciones Zod, diseño de casos de prueba y soporte AFIP)."),
          createBullet("Supervisión Académica", "Prof. Dr. Cerquand, Cristian Fernando (Docente Titular de Cátedra - UCP Sede Formosa)."),

          createH2("7.3. Recursos del Cliente"),
          createBullet("Equipamiento Físico", "2 Notebooks para cajas de mostrador, lector de código de barras USB, impresora térmica de tickets (58/80mm), cajón de dinero automático y conexión a internet."),
          createBullet("Insumos de Negocio", "Planilla preliminar de 100-200 productos con precios y talles, fotos con celular, credenciales AFIP/ARCA (Responsable Inscripto) y cuenta de Mercado Pago."),
          createBullet("Disponibilidad", "Compromiso de los dueños (Sandra Mujica y Miguel Ángel Marchi) para revisiones periódicas y período de marcha blanca."),

          // 8. REQUERIMIENTOS
          createH1("8. Requerimientos"),
          createH2("8.1. Requerimientos Funcionales (RF)"),
          createH3("Módulo 1: Gestión de Catálogo e Inventario"),
          createBullet("RF-01", "Alta, baja lógica, modificación y consulta de productos (nombre, descripción, marca, disciplina, género, costo)."),
          createBullet("RF-02", "Gestión de variantes de producto por talle, color, código de barras (EAN-13/interno), SKU y precio de venta."),
          createBullet("RF-03", "Control y descuento de stock por variante unificado en tiempo real para mostrador y web."),
          createBullet("RF-04", "Herramienta de carga inicial progresiva por marcas o categorías para el onboarding de mercadería."),
          createBullet("RF-05", "Generación e impresión de etiquetas con código de barras propio para prendas sin código de fábrica."),
          createBullet("RF-06", "Alertas automáticas de stock crítico y productos agotados en panel de control."),

          createH3("Módulo 2: Punto de Venta (POS Mostrador)"),
          createBullet("RF-07", "Búsqueda instantánea en mostrador por lectura de código de barras o buscador predictivo de texto."),
          createBullet("RF-08", "Cobro multiforma de pago: Efectivo (con vuelto), Tarjetas (Posnet), Transferencias bancarias y QR."),
          createBullet("RF-09", "Emisión e impresión de tickets térmicos de venta (58mm/80mm) con detalle de ítems y totales."),
          createBullet("RF-10", "Apertura electrónica automática del cajón de dinero al confirmar cobro en efectivo."),
          createBullet("RF-11", "Apertura, arqueo y cierre diario de caja con desglose totalizado por medio de pago."),
          createBullet("RF-12", "Operación en modo Offline para seguir cobrando ante cortes de internet con sincronización en cola."),

          createH3("Módulo 3: Tienda Web (E-commerce) y Checkout"),
          createBullet("RF-13", "Catálogo público responsive estructurado por disciplinas deportivas, marcas, género y talles."),
          createBullet("RF-14", "Ficha de producto con galería de fotos, descripción, selector de talles y stock dinámico."),
          createBullet("RF-15", "Carrito de compras y compra rápida como invitado (Guest Checkout) sin registro obligatorio."),
          createBullet("RF-16", "Pasarela de pagos online con Mercado Pago y confirmación de pedidos vía Webhooks."),
          createBullet("RF-17", "Pago por transferencia bancaria directa con carga de comprobante."),
          createBullet("RF-18", "Botón flotante contextual de WhatsApp con enlace y datos del producto consultado."),
          createBullet("RF-19", "Selección de modalidades de entrega: Retiro en Saavedra 241, Cadetería en Formosa o Correo Argentino."),

          createH3("Módulo 4: Facturación Electrónica y Postventa"),
          createBullet("RF-20", "Emisión de Facturas Electrónicas A y B conectándose con Web Services de AFIP/ARCA (obtención de CAE)."),
          createBullet("RF-21", "Opción de emitir comprobante interno de control no fiscal a criterio del cajero/administrador."),
          createBullet("RF-22", "Gestión de cambios de mercadería y emisión de notas de crédito / vales de compra."),

          createH3("Módulo 5: Administración y Seguridad"),
          createBullet("RF-23", "Control de accesos basado en roles (RBAC): Administrador (total), Cajero (mostrador), Despacho (pedidos)."),
          createBullet("RF-24", "Reportes gerenciales de facturación por medio de pago, ranking de artículos y marcas más vendidas."),
          createBullet("RF-25", "Gestión de estados de pedidos web (Pendiente, Pagado, Empaquetado, Enviado, Entregado)."),

          createH2("8.2. Requerimientos No Funcionales (RNF)"),
          createBullet("RNF-01 (Disponibilidad)", "Disponibilidad del 99.5% para el E-commerce y API en la nube (24/7/365)."),
          createBullet("RNF-02 (Rendimiento)", "Respuesta de búsqueda y cobro POS menor a 1 seg; carga web menor a 2 seg en 4G."),
          createBullet("RNF-03 (Consistencia ACID)", "Bloqueos transaccionales a nivel de fila en PostgreSQL para evitar sobreventas cruzadas."),
          createBullet("RNF-04 (Tolerancia a Fallos)", "Modo Offline-First en POS con persistencia local en IndexedDB y resincronización automática."),
          createBullet("RNF-05 (Seguridad)", "Conexiones HTTPS/TLS 1.3 con certificados SSL, contraseñas con hash seguro y tokens de sesión."),
          createBullet("RNF-06 (Usabilidad)", "Interfaz POS ergonómica optimizada para teclado y atajos; catálogo web 100% Mobile-First."),
          createBullet("RNF-07 (Mantenibilidad y Backups)", "Arquitectura modular en TypeScript, contenedores Docker y copias de seguridad automáticas diarias."),

          // 9. CONCLUSIONES
          createH1("9. Conclusiones y Próximos Pasos"),
          createP("Durante el Mes 1 se completó exitosamente la etapa de diagnóstico, relevamiento y fundamentación técnica para Matacos Deportes. Se definieron los requerimientos clave, la arquitectura híbrida (Nube + POS Offline-First) y el cronograma de trabajo para los meses subsiguientes."),
          createP("Para el Mes 2, el equipo avanzará en el Incremento 3 (fundaciones, base de datos y gestión de stock) y el Incremento 4 (desarrollo del punto de venta en mostrador y motor de ventas offline).")
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, 'Informe_Mensual_Mes_1_Matacos_Deportes.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Documento Word generado exitosamente en: ${outputPath}`);
}

buildDocx().catch(err => {
  console.error('Error generando documento DOCX:', err);
  process.exit(1);
});
