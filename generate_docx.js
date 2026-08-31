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
const MUTED_COLOR = '666666';      // Texto secundario / notas
const BG_CALLOUT = 'F2F7F2';       // Fondo claro para cajas
const BG_HEADER = 'E8F2E8';        // Fondo para encabezados de tabla
const ACCENT_BORDER = '2E7D32';    // Borde de acento
const CHECKED_COLOR = '0E6221';    // Verde oscuro para checkboxes marcados

function createTitle(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.TITLE,
    spacing: { before: 200, after: 200 },
    run: {
      size: 38, // 19pt
      bold: true,
      color: PRIMARY_COLOR,
      font: 'Arial'
    },
    alignment: AlignmentType.CENTER
  });
}

function createH2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
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
        space: 4,
        value: BorderStyle.SINGLE,
        size: 12
      }
    }
  });
}

function createH3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100 },
    run: {
      size: 24, // 12pt
      bold: true,
      color: SECONDARY_COLOR,
      font: 'Arial'
    }
  });
}

function createParagraph(text, options = {}) {
  const { bold = false, italic = false, color = TEXT_COLOR, size = 21, spaceAfter = 120, spaceBefore = 0, indent = 0 } = options;
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

function createQuestion(text, promptText = null) {
  const children = [
    new TextRun({
      text: "• " + text,
      bold: true,
      color: SECONDARY_COLOR,
      size: 21, // 10.5pt
      font: 'Arial'
    })
  ];

  if (promptText) {
    children.push(
      new TextRun({
        text: "\n  " + promptText,
        italics: true,
        color: MUTED_COLOR,
        size: 19, // 9.5pt
        font: 'Arial'
      })
    );
  }

  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children
  });
}

function createAnswer(prefix, text, options = {}) {
  const { isBullet = false, indent = 360 } = options;
  return new Paragraph({
    spacing: { before: 40, after: 120 },
    indent: { left: indent },
    children: [
      new TextRun({
        text: prefix ? `${prefix}: ` : (isBullet ? "• " : ""),
        bold: true,
        color: PRIMARY_COLOR,
        size: 21,
        font: 'Arial'
      }),
      new TextRun({
        text: text,
        color: TEXT_COLOR,
        size: 21,
        font: 'Arial'
      })
    ]
  });
}

function createCheckbox(checked, text, note = null) {
  const symbol = checked ? "☑ " : "☐ ";
  const children = [
    new TextRun({
      text: "   " + symbol,
      bold: checked,
      color: checked ? CHECKED_COLOR : MUTED_COLOR,
      size: 22,
      font: 'Arial'
    }),
    new TextRun({
      text: text,
      bold: checked,
      color: checked ? '111111' : MUTED_COLOR,
      size: 21,
      font: 'Arial'
    })
  ];

  if (note) {
    children.push(
      new TextRun({
        text: " " + note,
        color: TEXT_COLOR,
        size: 21,
        font: 'Arial'
      })
    );
  }

  return new Paragraph({
    spacing: { before: 40, after: 60 },
    children
  });
}

function createBulletItem(title, text, indent = 360) {
  const children = [];
  if (title) {
    children.push(
      new TextRun({
        text: "• " + title + ": ",
        bold: true,
        color: SECONDARY_COLOR,
        size: 21,
        font: 'Arial'
      })
    );
  } else {
    children.push(
      new TextRun({
        text: "• ",
        bold: true,
        color: SECONDARY_COLOR,
        size: 21,
        font: 'Arial'
      })
    );
  }
  children.push(
    new TextRun({
      text: text,
      color: TEXT_COLOR,
      size: 21,
      font: 'Arial'
    })
  );

  return new Paragraph({
    spacing: { before: 40, after: 80 },
    indent: { left: indent },
    children
  });
}

function createMetadataTable(metadata) {
  const rows = metadata.map(([label, value]) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 2600, type: WidthType.DXA },
          shading: { fill: 'EAF2EA', type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.SINGLE, size: 24, color: PRIMARY_COLOR },
            right: { style: BorderStyle.NONE }
          },
          margins: { top: 100, bottom: 100, left: 160, right: 140 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: label,
                  bold: true,
                  color: PRIMARY_COLOR,
                  size: 20,
                  font: 'Arial'
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 6600, type: WidthType.DXA },
          shading: { fill: BG_CALLOUT, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          margins: { top: 100, bottom: 100, left: 140, right: 160 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: value,
                  color: TEXT_COLOR,
                  size: 20,
                  font: 'Arial'
                })
              ]
            })
          ]
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

function createArchitectureDiagramBox() {
  const cells = [
    [
      "☁ NUBE (Hosting / VPS 24/7)",
      "• Tienda Web & E-commerce (Catálogo, carrito, consultas)\n• API Central & Base de Datos (Node.js / PostgreSQL)\n• Pasarela de Pagos (Mercado Pago Checkout Pro / API)"
    ],
    [
      "🏢 LOCAL FÍSICO (Saavedra 241)",
      "• POS Mostrador (Offline-First, base local SQLite/IndexedDB)\n• Lector Códigos Barra (USB / Inalámbrico)\n• Impresora Térmica de Tickets Comandera (58mm / 80mm)\n• Cajón de Dinero con apertura automática"
    ],
    [
      "🔌 INTEGRACIONES EXTERNAS",
      "• AFIP / ARCA Facturación Electrónica (Facturas A, B, C / Comprobantes internos)\n• Notificaciones WhatsApp (Confirmación pedidos, estados de entrega)"
    ],
    [
      "🔄 SINCRONIZACIÓN BIDIRECCIONAL",
      "• Sincronización en tiempo real vía Webhooks / REST API.\n• Cola de eventos offline: ventas locales sin conexión se sincronizan al restablecerse internet para evitar sobreventa."
    ]
  ];

  const rows = cells.map(([title, content], idx) => {
    const isSpecial = idx === 3;
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: isSpecial ? 'DDEEDD' : 'E6F0E6', type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: 'B0CBB0' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'B0CBB0' },
            left: { style: BorderStyle.SINGLE, size: 16, color: PRIMARY_COLOR },
            right: { style: BorderStyle.SINGLE, size: 6, color: 'B0CBB0' }
          },
          margins: { top: 120, bottom: 120, left: 160, right: 140 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  color: PRIMARY_COLOR,
                  size: 20,
                  font: 'Arial'
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 6200, type: WidthType.DXA },
          shading: { fill: isSpecial ? 'F4FAF4' : 'FAFCFA', type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: 'B0CBB0' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'B0CBB0' },
            left: { style: BorderStyle.SINGLE, size: 6, color: 'B0CBB0' },
            right: { style: BorderStyle.SINGLE, size: 6, color: 'B0CBB0' }
          },
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: content.split('\n').map(line => new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [
              new TextRun({
                text: line,
                size: 19,
                font: 'Arial',
                color: TEXT_COLOR
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

async function buildDocument() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 21,
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
                    text: "Matacos Deportes  |  Guía de Elicitación de Requerimientos",
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
          // TÍTULO
          createTitle("Guía de Elicitación de Requerimientos: Matacos Deportes"),
          new Paragraph({ spacing: { before: 60, after: 120 } }),

          // METADATOS
          createMetadataTable([
            ["Proyecto", "Sistema Integral Web, Gestión de Stock y Punto de Venta (POS)"],
            ["Cliente", "Matacos Deportes (Saavedra 241, Formosa, Argentina)"],
            ["Fecha de Relevamiento", "Miércoles 26 de Agosto de 2026"],
            ["Entrevistador(es)", "Dellagnolo, Ricardo y Fornari, Nahir"],
            ["Entrevistado(s) / Rol", "Sandra Mujica y Marchi Miguel Angel (Dueña del Local)"]
          ]),

          new Paragraph({ spacing: { before: 180, after: 100 } }),

          // CONTEXTO Y OBJETIVO
          createH2("Contexto y Objetivo del Documento"),
          createParagraph("El presente documento tiene como finalidad relevar en profundidad las necesidades funcionales, operativas, comerciales y de identidad institucional para el desarrollo e implementación del nuevo sistema integral de Matacos Deportes.", { spaceAfter: 100 }),
          createParagraph("Dado que el comercio parte de un esquema 100% analógico (sin base de datos previa ni software de gestión digital), este cuestionario hace especial foco en el proceso de onboarding inicial, simplificación operativa en mostrador y gestión concurrente de stock.", { spaceAfter: 160 }),

          // BLOQUE 0
          createH2("Bloque 0: Historia, Identidad Institucional y Vínculo Comunitario"),
          createParagraph("(Insumo clave para la sección «Quiénes Somos» de la tienda online y el posicionamiento de marca)", { italic: true, color: MUTED_COLOR, spaceAfter: 140 }),

          createH3("1. Origen y Fundación"),
          createQuestion("¿En qué año abrió sus puertas Matacos Deportes y quién o quiénes fueron sus fundadores?"),
          createAnswer("Respuesta", "Comenzó en Septiembre del año 1999 en el Paseo de Compras (Por la San Martin - Mercadito). Fundado por Sandra Mujica (Comerciante - Oriunda de Formosa) y Miguel Angel Marchi (Arquitecto) (Matrimonio desde Resistencia)"),

          createQuestion("¿Cómo y por qué surgió la idea de abrir una tienda deportiva en la ciudad?", "(¿Proyecto familiar, pasión por un deporte específico, falta de oferta especializada en la zona?)"),
          createAnswer("Respuesta (Sandra)", "Comenzó como una Tienda de Indumentaria Urbana unisex por el paseo de compras, la transición a tienda de ropa deportiva ocurrió después. Anteriormente había trabajado en una tienda deportiva en Resistencia. Cuando vine acá con mi tienda de ropa se comenzó a solicitar accesorios deportivos (Medias, vendas, bucales, mallas de entrenamiento de natación, etc.), al ver el tipo de ropa que se vendía. Las tiendas deportivas se dedicaban principalmente al calzado, por lo que no estos productos no se encontraban en la provincia, detectando así una especial demanda de accesorios deportivos."),

          createQuestion("¿El local siempre estuvo en Saavedra 241 o tuvieron otras ubicaciones históricas antes?"),
          createAnswer("Respuesta", "Primero estuve por la San Martin en el paseo de Compras. Seguidamente alquilé un local por la Calle Saavedra al frente del Local actual (Saavedra 238 - se mantuvo en dicho lugar por 10 años), actualmente en este local desde el año 2019 previo a la Pandemia."),

          createH3("2. Identidad y Elección del Nombre"),
          createQuestion("¿Cuál es el significado o la historia detrás de la elección del nombre «Matacos»?"),
          createCheckbox(true, "Homenaje e identificación con las raíces culturales y pueblos originarios de la región del Gran Chaco. El primer nombre fue: M y M (Por los apellidos de los dueños - Marchi y Mujica), pero estos se repetían de a montones entre todos los locales, por lo que se decidió realizar este cambio."),
          createCheckbox(false, "Vínculo con algún equipo, club o apodo histórico de la zona."),
          createCheckbox(false, "Otra razón específica:"),

          createQuestion("¿El logotipo actual ha tenido rediseños a lo largo de los años o conserva su diseño fundacional?"),
          createAnswer("Respuesta", "El logotipo y la marca pasó por 2 evoluciones principales. Al principio el color inicial era el Amarillo, con un logo de un aborigen. A la hora de transicionar al deporte cambiaron los colores a verde (En relación al aire libre - césped - fitness). Matacos Deportes es marca registrada."),

          createH3("3. Hitos, Evolución y Comunidad"),
          createQuestion("¿Qué momentos o etapas marcaron un antes y un después en la trayectoria del negocio?", "(Ampliaciones del local, incorporación de marcas líderes, superación de crisis, cambios generacionales en la administración)."),
          createAnswer("Respuesta", ""),
          createBulletItem("Ampliación del local", "Pasar del Paseo de Compras al microcentro de la ciudad.", 540),
          createBulletItem("Superación de la crisis de 2001-02", "Bonos en Formosa (Bocanfor), teniendo que cambiarlo por LECOP. Si no había dinero para alimentos, la gente no iba a comprar indumentaria deportiva ni mucho menos.", 540),
          createBulletItem("Registro de la Marca", "En la llegada a Formosa, superaron irregularidades fiscales de márgenes impositivos (inscripción en Rentas, municipalidad, AFIP, actualmente ARCA) para inscripción de aportes legales. Obtuvo préstamos bancarios para armar un depósito de distintos accesorios deportivos.", 540),

          createQuestion("¿Qué disciplinas o productos eran los más vendidos en los comienzos y cómo cambió la demanda hoy?", "(Ej. antes predominaba el fútbol tradicional; hoy se sumaron running, pádel, hockey, indumentaria urbana o entrenamiento funcional)."),
          createAnswer("Respuesta", "En el comienzo, lo más vendido eran los accesorios deportivos (Indumentaria deportiva para gimnasios y profesores; pelotas, medias, vendas, bucales, protección en general -canilleras, rodilleras-. Luego se añadieron las mallas de natación. Mochilas Wilson, destacadas por su resistencia)."),
          createBulletItem(null, "Actualmente, los productos más vendidos son las Crocs y los productos de gimnasio (Mancuernas, colchonetas, etc.)", 540),

          createQuestion("¿Qué relación histórica ha tenido el local con clubes, ligas, escuelas o atletas de Formosa?"),
          createCheckbox(false, "Proveedor de indumentaria / equipamiento para clubes o colegios locales."),
          createCheckbox(false, "Auspiciante / sponsor de torneos barriales, maratones o eventos deportivos provinciales."),
          createCheckbox(false, "Apoyo a deportistas destacados de la provincia."),
          createBulletItem("Detalles / Nombres", "Llegaron a hacer fotos con una deportista (Mimí Sosa - Vóley).", 540),
          createBulletItem(null, "Se apoyó al club Náutico en los eventos y las acciones del mismo.", 540),

          createQuestion("¿Tienen alguna anécdota destacada o visita memorable de algún deportista o referente en el local?"),
          createAnswer("Respuesta", "Lo más remarcado fue un spot publicitario con Locomotora Oliveras. A nivel local una jugadora de vóley Mimí Sosa. Promoción de Maravilla Martínez?"),

          createH3("4. Filosofía de Marca y Mirada al Futuro (Misión y Visión)"),
          createQuestion("¿Cuál consideran que es el principal valor que los diferencia de las grandes cadenas o tiendas departamentales?", "(Ej. atención personalizada y asesoramiento técnico por sus propios dueños, conocimiento del cliente local, trayectoria y confianza)."),
          createAnswer("Respuesta", "Un poco de todo: la atención de los propios dueños, la trayectoria de más de 25 años. La confianza y la atención personalizada de los clientes, donde se busca ofrecer un servicio a la hora de vender un producto. Se destacan por ofrecer una atención personalizada y detallada de cada uno de los deportes (asesoramiento pre-venta y post-venta)."),

          createQuestion("¿Cómo describirían la misión del negocio hoy?"),
          createAnswer("Respuesta", "Apuntamos hacia una modernización/sistematización de todas las áreas del negocio (ventas, movimiento de caja, stock. E-commerce)."),

          createQuestion("¿Qué representa este salto a la plataforma web dentro de la historia del negocio?", "(Ej. llegar a clientes del interior provincial que antes debían viajar a la capital, modernización, agilizar la atención)."),
          createAnswer("Respuesta", "Este salto nos representa un cambio importante en la dinámica del negocio: buscamos llegar a nivel nacional, modernizar nuestro funcionamiento operacional y agilizar los procesos operativos que ocurren en el local a nivel diario."),

          // BLOQUE 1
          createH2("Bloque 1: Diagnóstico Operativo Actual (AS-IS Analógico)"),
          createParagraph("(Comprender cómo opera el negocio hoy en el papel para diseñar un sistema intuitivo y sin fricciones)", { italic: true, color: MUTED_COLOR, spaceAfter: 140 }),

          createH3("1. Registro Diario de Operaciones"),
          createQuestion("¿Cómo anotan o registran hoy las ventas del mostrador?"),
          createCheckbox(true, "Cuaderno de ventas manuscrito."),
          createCheckbox(false, "Talonario de papel / boletas manuales."),
          createCheckbox(false, "Planilla de cálculo básica (Excel/Sheets sin automatizar)."),
          createCheckbox(false, "De memoria / solo conteo final de dinero."),

          createQuestion("¿Cómo realizan el cierre de caja diario al finalizar la jornada?", "(¿Cómo concilian el efectivo del cajón con los cupones de tarjetas/Posnet y los comprobantes de transferencias recibidas?)"),
          createAnswer("Respuesta", "Se anota tarjeta, efectivo haciendo el cierre de en la caja, posnet, prestando detalle en las anotaciones y si coincide el registro del libro con lo demás."),

          createQuestion("¿Registran salidas de dinero de la caja chica durante el día?", "(Pagos a cadetes, fletes, viáticos, artículos de limpieza, retiros particulares de los dueños)."),
          createAnswer("Respuesta", "Generalmente no."),

          createH3("2. Consulta y Actualización de Precios en Mostrador"),
          createQuestion("¿Cómo sabe hoy el vendedor el precio de un artículo cuando un cliente consulta?"),
          createCheckbox(true, "Etiqueta adhesiva pegada en la prenda o caja."),
          createCheckbox(true, "Lista de precios impresa en papel detrás del mostrador."),
          createCheckbox(false, "Preguntándole verbalmente al dueño o encargado."),
          createCheckbox(false, "De memoria."),

          createQuestion("Cuando los proveedores envían aumentos de precios, ¿cómo trasladan el aumento a los productos?", "(¿Remarcan etiquetas una por una a mano, aplican un recargo mental al momento de cobrar, etc.?)"),
          createAnswer("Respuesta", "Se realiza un remarco mano a mano de cada uno de los productos."),

          createH3("3. Nivel de Adopción Tecnológica y Dispositivos"),
          createQuestion("¿Qué nivel de manejo y familiaridad tiene el personal que estará a cargo del mostrador con el uso de PCs, tablets o celulares?"),
          createAnswer("Respuesta", "Se tiene un manejo básico de los sistemas de gestión de stock, ventas, etc., prácticamente nada."),

          createQuestion("¿Qué dispositivo prefieren físicamente para cobrar en el mostrador?"),
          createCheckbox(false, "Computadora de escritorio (PC) con teclado y mouse."),
          createCheckbox(true, "Notebook."),
          createCheckbox(false, "Tablet táctil."),

          // BLOQUE 2
          createH2("Bloque 2: Catálogo, Inventario Inicial y Reglas de Negocio"),

          createH3("1. Estimación de Inventario y Carga Inicial (Onboarding)"),
          createQuestion("¿Cuántos productos o artículos distintos (SKUs) estiman que tienen físicamente en el local?"),
          createCheckbox(true, "Menos de 500 artículos. (entre 100 y 200 productos)"),
          createCheckbox(false, "Entre 500 y 2.000 artículos."),
          createCheckbox(false, "Más de 2.000 artículos."),

          createQuestion("¿Cuenta con un inventario en papel con todos los productos anotados?"),
          createAnswer("Respuesta", "Se cuenta con un inventario en papel de algunos productos, no la mayoría."),

          createQuestion("¿Cómo planifican realizar el primer inventario físico para alimentar la base de datos inicial?"),
          createCheckbox(false, "Cerrar el local un fin de semana completo para conteo total y carga masiva."),
          createCheckbox(true, "Carga progresiva por marcas o categorías (ej. primero todo Calzado, luego Indumentaria)."),
          createCheckbox(false, "Carga sobre la marcha a medida que ingresa nueva mercadería."),

          createH3("2. Estructura y Variantes de Productos"),
          createQuestion("¿Cómo organizan las categorías y disciplinas deportivas?", "(Fútbol, Running, Pádel, Básquet, Vóley, Hockey, Natación, Gimnasio / Training, Urbano)."),
          createAnswer("Respuesta", "Se cuentan con productos de todos los deportes, dándole prioridad a lo que tiene más salida (natación, vóley, crocs y artículos de gimnasio)."),

          createQuestion("¿Qué variantes específicas maneja cada artículo?"),
          createBulletItem("Talles de calzado", "[ ] Tabla AR  [ ] Tabla US  [ ] Tabla EUR  [ ] Equivalencias centímetros.", 540),
          createBulletItem("Talles de indumentaria", "[ ] S, M, L, XL, XXL  [ ] Talles numéricos infantiles (4 al 16).", 540),
          createBulletItem("Género", "[ ] Hombre  [ ] Mujer  [ ] Niño/a  [ ] Unisex.", 540),
          createBulletItem("Color", "Color y combinaciones.", 540),
          createBulletItem("Criterio actual", "Se divide por talle y por color de ropa.", 540),

          createH3("3. Material Fotográfico para la Web"),
          createQuestion("¿Disponen de fotos digitales de los productos para la tienda online?"),
          createCheckbox(false, "Fotos oficiales provistas por los catálogos de marcas (Nike, Adidas, Topper, Umbro, etc.)."),
          createCheckbox(true, "Fotos propias tomadas con teléfono celular para redes sociales."),
          createCheckbox(false, "Será necesario realizar una sesión de fotos de productos antes del lanzamiento."),

          createH3("4. Listas de Precios, Promociones y Personalizaciones"),
          createQuestion("¿Manejan listas de precios diferenciadas o convenios especiales?"),
          createCheckbox(false, "Precios minoristas vs. precios mayoristas."),
          createCheckbox(false, "Descuentos por cantidad a clubes, escuelas o ligas deportivas."),
          createCheckbox(false, "Combos y promociones por paquete (ej. conjunto completo camiseta + short + medias)."),
          createCheckbox(true, "TODO MINORISTA"),

          createQuestion("¿Ofrecen servicios de personalización? (Estampado de nombres, dorsales, números o sponsors en camisetas).", "Respuesta: NO"),
          createParagraph("¿Cómo debe solicitarse esto desde la web o registrarse en el mostrador?", { italic: true, indent: 360, color: MUTED_COLOR }),
          createAnswer("Respuesta", "____________________________________________________________________"),

          // BLOQUE 3
          createH2("Bloque 3: Operativa del Punto de Venta (POS), Hardware y Stock Concurrente"),

          createH3("1. Identificación de Artículos y Códigos de Barra"),
          createQuestion("¿La mercadería que compran a proveedores ya viene con código de barras de fábrica?"),
          createCheckbox(true, "Sí, la gran mayoría posee código EAN-13 estándar."),
          createCheckbox(false, "No, muchos artículos vienen sin código (artículos genéricos, accesorios sueltos, etc.)."),
          createParagraph("Nota: Algunas prendas de oferta están sin código de barra.", { italic: true, indent: 540, color: MUTED_COLOR }),

          createQuestion("¿Desean incorporar una impresora térmica de etiquetas para generar códigos de barra propios del local, o prefieren buscar los artículos en pantalla mediante buscador de texto/categorías?"),
          createAnswer("Respuesta", "Preferimos ambas opciones."),

          createH3("2. Equipamiento Físico del Mostrador"),
          createQuestion("¿Cuántas cajas o terminales de cobro simultáneas funcionarán en el local?"),
          createAnswer("Respuesta", "2 cajas"),

          createQuestion("¿Qué periféricos planean utilizar en el puesto de cobro?"),
          createCheckbox(true, "Lector de código de barras (USB o inalámbrico)."),
          createCheckbox(true, "Impresora térmica de tickets comandera (58mm o 80mm)."),
          createCheckbox(true, "Gaveta / cajón de dinero con apertura automática al cobrar."),

          createH3("3. Gestión de Stock Concurrente (Local Físico vs. Web / Redes)"),
          createQuestion("¿Cómo gestionan hoy cuando un cliente pide apartar un producto por WhatsApp/Instagram mientras el local está abierto al público?", "(¿Cómo evitan que otro vendedor lo venda en el mostrador en ese lapso?)"),
          createAnswer("Respuesta", "Lo separan del resto de los productos teniendo en cuenta el tiempo en el que se cree que se va a retirar."),

          createQuestion("En el nuevo sistema: ¿Desean una función de \"Reserva Temporal\" (ej. bloquear stock por 2 horas para un cliente de WhatsApp hasta que envíe el comprobante de transferencia)?"),
          createAnswer("Respuesta", "No es importante pero sería bueno tenerlo."),

          createQuestion("¿Cómo debe comportarse la tienda web cuando un producto se queda sin stock?"),
          createCheckbox(false, "Ocultar el producto automáticamente."),
          createCheckbox(true, "Mostrarlo como «Agotado» impidiendo la compra."),
          createCheckbox(true, "Permitir dejar un correo / WhatsApp con aviso de reingreso («Avisarme cuando haya stock»)."),

          createH3("4. Tolerancia a Cortes de Conectividad (Modo Offline)"),
          createQuestion("Ante un corte temporal del servicio de internet en el local físico, ¿es indispensable que el mostrador pueda seguir cobrando y emitiendo tickets en modo offline para luego sincronizarse automáticamente al volver la red?"),
          createAnswer("Respuesta", "Es obligatorio tener un modo offline para seguir procesando ventas."),

          // BLOQUE 4
          createH2("Bloque 4: Pagos, Facturación, Envíos y Postventa"),

          createH3("1. Métodos de Cobro y Promociones"),
          createQuestion("En el local: ¿Qué medios reciben actualmente?"),
          createCheckbox(true, "Efectivo."),
          createCheckbox(true, "Tarjetas de débito / crédito (POSNET tradicional / Mercado Pago Point)."),
          createCheckbox(true, "Transferencias bancarias (Alias / CBU)."),
          createCheckbox(false, "QR de billeteras virtuales (Mercado Pago, Cuenta DNI, MODO, etc.)."),

          createQuestion("En la web: ¿Qué opciones desean habilitar para los clientes online?"),
          createCheckbox(true, "Pasarela online (Mercado Pago Checkout / Tarjetas / Dinero en cuenta)."),
          createCheckbox(true, "Transferencia bancaria directa con carga de comprobante."),
          createCheckbox(true, "Pago al retirar en el local físico."),

          createQuestion("¿Aplican promociones o recargos según el método de pago?", "(Descuento en efectivo, recargo en cuotas con tarjeta, etc.)"),
          createAnswer("Respuesta", "No se realizan recargos, pero se tiene un límite de compra respecto a las cuotas dependiendo del precio (3 cuotas si la compra es superior a $30.000, 4 cuotas si es superior a $80.000)."),

          createH3("2. Facturación y Aspectos Impositivos (AFIP / ARCA)"),
          createQuestion("¿Cuál es la condición fiscal del comercio ante AFIP/ARCA?"),
          createCheckbox(false, "Monotributo."),
          createCheckbox(true, "Responsable Inscripto."),

          createQuestion("¿Cómo emiten comprobantes actualmente?"),
          createCheckbox(false, "Facturación manual en talonario de papel."),
          createCheckbox(true, "Portal web \"Comprobantes en Línea\" de AFIP."),
          createCheckbox(true, "Controlador fiscal físico de vieja/nueva generación."),

          createQuestion("¿El nuevo sistema debe emitir Factura Electrónica (Facturas A, B, C) conectándose directamente con AFIP/ARCA, o emitirá comprobantes internos no fiscales (tickets de control / presupuestos)?"),
          createAnswer("Respuesta", "Debería tener la opción de decidir el tipo de comprobante según la venta."),

          createH3("3. Cuentas Corrientes, Fiados y Señas"),
          createQuestion("¿Manejan ventas a Cuenta Corriente (\"fiado\" o pago a fin de mes) con clubes, instituciones o clientes de confianza?", "¿El sistema debe llevar el saldo adeudado y el historial de pagos de cada cliente?"),
          createAnswer("Respuesta", "NO"),

          createQuestion("Al encargar trabajos especiales (ej. indumentaria personalizada), ¿cobran señas o anticipos (ej. 50%)?", "¿El sistema debe emitir un comprobante de seña y descontar el saldo restante contra entrega?"),
          createAnswer("Respuesta", "NO (Porque no se realiza este tipo de trabajo)"),

          createH3("4. Logística y Modalidades de Entrega"),
          createQuestion("¿Cuáles serán las opciones de envío ofrecidas en la tienda online?"),
          createCheckbox(true, "Retiro gratuito en el local (Saavedra 241)."),
          createCheckbox(true, "Cadetería local / moto-mensajería dentro de la ciudad de Formosa."),
          createCheckbox(true, "Envíos al interior de la provincia y a todo el país (Correo Argentino, Andreani, encomiendas por micro)."),

          createH3("5. Políticas de Postventa, Cambios y Garantías"),
          createQuestion("¿Cómo gestionan hoy los cambios de talle o modelo?", "(¿Qué plazo se le otorga al cliente? ¿Debe presentar el ticket/comprobante obligatoriamente?)"),
          createAnswer("Respuesta", "Se le obliga que la prenda tenga la etiqueta y esté en buen estado, sin límite de tiempo y sin necesidad de presentar un ticket."),

          createQuestion("Si un cliente compra por la tienda web, ¿puede realizar el cambio físicamente en el local?"),
          createAnswer("Respuesta", "Sí, se puede realizar un cambio en el local. El problema es a nivel nacional, donde inicialmente se cobraría el envío."),

          createQuestion("Si un cliente devuelve un producto y no elige otro en el momento:"),
          createCheckbox(true, "Se le emite una Nota de Crédito / Vale de compra para usar a futuro."),
          createCheckbox(false, "Se le reintegra el dinero por el mismo medio que pagó."),

          createQuestion("Frente a aumentos de precios por inflación entre la fecha de compra y la fecha del cambio de talle:", "¿Se le respeta el cambio mano a mano del mismo producto, o debe abonar la diferencia de precio?"),
          createAnswer("Respuesta", "Se le respeta el cambio del mismo producto. Existen complicaciones de llevar registro si se lleva algo de oferta (mayormente son prendas que no tienen cambio, al ser únicas)."),

          // BLOQUE 5
          createH2("Bloque 5: Experiencia del Usuario (UX) y Canales de Atención"),

          createH3("1. Flujo de Compra en la Web"),
          createQuestion("¿La compra requerirá registro obligatorio de usuario con contraseña, o se permitirá compra rápida como invitado (guest checkout) solicitando solo datos de contacto y envío?"),
          createAnswer("Respuesta", "Se necesita que sea lo más fácil para el cliente."),

          createH3("2. Canales de Notificación y Asistencia"),
          createQuestion("¿Qué canales de comunicación prefieren para notificar al cliente sobre su compra y estado del pedido?"),
          createCheckbox(false, "Correo electrónico automático."),
          createCheckbox(true, "Mensaje directo por WhatsApp."),
          createCheckbox(true, "Ambos."),

          createQuestion("¿Desean un botón flotante de WhatsApp en la web que incluya el enlace y nombre exacto del producto que el usuario está viendo en pantalla al iniciar la conversación?"),
          createAnswer("Respuesta", "Sí, me gustaría tener esa opción."),

          // BLOQUE 6
          createH2("Bloque 6: Roles de Usuario, Reportes y Plan de Transición"),

          createH3("1. Permisos y Perfiles de Acceso al Sistema"),
          createQuestion("¿Qué roles operarán dentro de la plataforma y qué permisos tendrán?"),
          createBulletItem("Administrador / Dueño", "Acceso total a precios de costo, márgenes de ganancia, reportes financieros y configuración general.", 540),
          createBulletItem("Cajero / Vendedor de mostrador", "Permisos para consultar stock, registrar ventas, cobrar y emitir tickets (sin acceso a costos del negocio).", 540),
          createBulletItem("Operador de Despacho / Catálogo", "Permisos para actualizar fotos/descripciones y marcar pedidos web como \"empaquetados / enviados\".", 540),
          createBulletItem("Otros roles", "Cualquier otro ROL necesario que sirva para el funcionamiento del sistema.", 540),

          createH3("2. Reportes Clave y Métricas para los Dueños"),
          createQuestion("¿Qué información necesitan ver en su panel de control al final del día o mes?"),
          createCheckbox(true, "Total facturado por medio de pago (Efectivo vs. Mercado Pago vs. Transferencias)."),
          createCheckbox(true, "Alertas automáticas de productos con stock bajo o agotado."),
          createCheckbox(true, "Ranking de productos, marcas y disciplinas más vendidas."),
          createCheckbox(false, "Rendimiento de ventas web vs. ventas físicas del local."),
          createCheckbox(false, "Ganancia bruta estimada del período."),

          createH3("3. Plan de Capacitación y Marcha Blanca"),
          createQuestion("¿Están de acuerdo en realizar un período de prueba («marcha blanca») de 1 a 2 semanas donde el nuevo sistema conviva con el método tradicional antes del apagado definitivo del cuaderno?"),
          createAnswer("Respuesta", "Sí."),

          // ARQUITECTURA
          createH2("Resumen de Arquitectura Técnica Recomendada"),
          createParagraph("(Guía de referencia para el equipo de desarrollo)", { italic: true, color: MUTED_COLOR, spaceAfter: 140 }),

          createParagraph("Diagrama de Integración y Flujo de Datos:", { bold: true, color: SECONDARY_COLOR, spaceAfter: 100 }),
          createArchitectureDiagramBox(),
          new Paragraph({ spacing: { before: 140, after: 100 } }),

          createBulletItem("1. Capa Web Pública (E-commerce)", "Alojada en la nube, disponible 24/7 para consultas, catálogo y compras sin depender de la luz o conectividad del local físico.", 360),
          createBulletItem("2. Capa de Mostrador (POS Offline-First)", "Aplicación de mostrador optimizada para ventas ultra rápidas, capaz de seguir operando y cobrando con base de datos local ante microcortes de internet.", 360),
          createBulletItem("3. Módulo de Sincronización", "Actualiza el stock en tiempo real entre el mostrador y la web para evitar ventas duplicadas del mismo artículo.", 360),

          createH3("Arquitectura Recomendada: Esquema Híbrido"),

          createParagraph("1. Capa Web y E-commerce (Hosting / VPS en la Nube)", { bold: true, color: PRIMARY_COLOR, spaceBefore: 120, spaceAfter: 60 }),
          createBulletItem("Rol", "Alojar el catálogo online, el carrito de compras, el módulo de consultas por WhatsApp, pasarelas de pago y la recepción de pedidos web las 24/7.", 540),
          createBulletItem("Ventaja", "Garantiza disponibilidad ininterrumpida para los clientes, sin depender de la conectividad ni de la estabilidad eléctrica del local físico.", 540),

          createParagraph("2. Capa de Mostrador / Punto de Venta (Cliente Local / POS Offline-First)", { bold: true, color: PRIMARY_COLOR, spaceBefore: 120, spaceAfter: 60 }),
          createBulletItem("Rol", "Gestionar las ventas presenciales en el local, cobranza rápida de mostrador y emisión de tickets.", 540),
          createBulletItem("Ventaja", "Permite que los vendedores sigan cobrando y emitiendo comprobantes aunque se corte internet momentáneamente, operando con una base de datos local (ej. SQLite, IndexedDB en el navegador, o un servicio local ligero).", 540),

          createParagraph("3. Módulo de Sincronización (Webhooks / API REST)", { bold: true, color: PRIMARY_COLOR, spaceBefore: 120, spaceAfter: 60 }),
          createBulletItem("Rol", "Sincronizar el inventario entre el local físico y la web.", 540),
          createBulletItem("Mecánica", "Cuando se vende una prenda o par de zapatillas en el local, el sistema local envía un evento a la API de la web para descontar esa unidad. Si el local se queda sin internet, los cambios se encolan y se envían de forma automática al restablecerse la conexión.", 540)
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, 'contexto', 'Elicitacion_Requerimientos_Matacos_Deportes_Respuestas.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Documento Word generado exitosamente en: ${outputPath}`);
}

buildDocument().catch(err => {
  console.error('Error generando documento DOCX:', err);
  process.exit(1);
});
