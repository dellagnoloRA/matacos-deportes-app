const ExcelJS = require("exceljs");
const path = require("path");

async function generateExcelTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Matacos Deportes - Equipo PPS I";
  workbook.lastModifiedBy = "Sistema Matacos Deportes";
  workbook.created = new Date();
  workbook.modified = new Date();

  // -------------------------------------------------------------
  // HOJA 1: PRODUCTOS Y STOCK (Hoja Principal)
  // -------------------------------------------------------------
  const ws = workbook.addWorksheet("Productos_y_Stock", {
    views: [{ state: "frozen", ySplit: 1, activeCell: "A2" }],
  });

  // Definición de columnas
  ws.columns = [
    { header: "Disciplina", key: "disciplina", width: 16 },
    { header: "Categoría", key: "categoria", width: 16 },
    { header: "Marca", key: "marca", width: 16 },
    { header: "Nombre Producto", key: "nombre", width: 32 },
    { header: "Descripción", key: "descripcion", width: 45 },
    { header: "Talle", key: "talle", width: 12 },
    { header: "Color", key: "color", width: 16 },
    { header: "Código de Barra", key: "barcode", width: 20 },
    { header: "SKU (Opcional)", key: "sku", width: 18 },
    { header: "Stock Salón", key: "stockStore", width: 14 },
    { header: "Stock Depósito", key: "stockWarehouse", width: 16 },
    { header: "Mínimo Salón", key: "minStoreStock", width: 15 },
    { header: "Mínimo Proveedor", key: "minStock", width: 18 },
    { header: "Precio Costo (ARS)", key: "costPrice", width: 20 },
    { header: "Precio Venta (ARS)", key: "price", width: 20 },
  ];

  // Estilo institucional para la fila de encabezado (Verde Matacos Deportes)
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E4620" }, // Verde oscuro institucional
    };
    cell.font = {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0D260E" } },
      bottom: { style: "medium", color: { argb: "FF0D260E" } },
      left: { style: "thin", color: { argb: "FF2E6B32" } },
      right: { style: "thin", color: { argb: "FF2E6B32" } },
    };
  });

  // Datos de ejemplo
  const rows = [
    {
      disciplina: "Natación",
      categoria: "Antiparras",
      marca: "Speedo",
      nombre: "Antiparras Mariner Pro",
      descripcion: "Lentes con protección UV y tratamiento antivaho",
      talle: "Único",
      color: "Azul",
      barcode: "7791234567890",
      sku: "",
      stockStore: 2,
      stockWarehouse: 5,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 12500.00,
      price: 24900.00,
    },
    {
      disciplina: "Natación",
      categoria: "Antiparras",
      marca: "Speedo",
      nombre: "Antiparras Mariner Pro",
      descripcion: "Lentes con protección UV y tratamiento antivaho",
      talle: "Único",
      color: "Negro",
      barcode: "7791234567891",
      sku: "",
      stockStore: 1,
      stockWarehouse: 4,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 12500.00,
      price: 24900.00,
    },
    {
      disciplina: "Natación",
      categoria: "Mallas",
      marca: "Arena",
      nombre: "Malla Competición Solid",
      descripcion: "Malla resistente al cloro y secado rápido",
      talle: "S",
      color: "Negro",
      barcode: "",
      sku: "",
      stockStore: 1,
      stockWarehouse: 2,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 18000.00,
      price: 36000.00,
    },
    {
      disciplina: "Natación",
      categoria: "Mallas",
      marca: "Arena",
      nombre: "Malla Competición Solid",
      descripcion: "Malla resistente al cloro y secado rápido",
      talle: "M",
      color: "Negro",
      barcode: "",
      sku: "",
      stockStore: 2,
      stockWarehouse: 3,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 18000.00,
      price: 36000.00,
    },
    {
      disciplina: "Natación",
      categoria: "Mallas",
      marca: "Arena",
      nombre: "Malla Competición Solid",
      descripcion: "Malla resistente al cloro y secado rápido",
      talle: "L",
      color: "Azul Marino",
      barcode: "",
      sku: "",
      stockStore: 1,
      stockWarehouse: 1,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 18000.00,
      price: 36000.00,
    },
    {
      disciplina: "Natación",
      categoria: "Gorras",
      marca: "Speedo",
      nombre: "Gorra Silicona Plain Moulded",
      descripcion: "Silicona ergonómica sin costuras",
      talle: "Único",
      color: "Verde Flúor",
      barcode: "7799876543210",
      sku: "",
      stockStore: 3,
      stockWarehouse: 10,
      minStoreStock: 2,
      minStock: 3,
      costPrice: 4500.00,
      price: 9500.00,
    },
    {
      disciplina: "Vóley",
      categoria: "Pelotas",
      marca: "Mikasa",
      nombre: "Pelota Vóley V200W",
      descripcion: "Balón oficial de competición en microfibra",
      talle: "5",
      color: "Amarillo/Azul",
      barcode: "4907225880001",
      sku: "",
      stockStore: 2,
      stockWarehouse: 3,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 65000.00,
      price: 115000.00,
    },
    {
      disciplina: "Vóley",
      categoria: "Pelotas",
      marca: "Wilson",
      nombre: "Pelota Vóley Soft Play",
      descripcion: "Tacto suave para entrenamiento y playa",
      talle: "5",
      color: "Blanco",
      barcode: "026388456123",
      sku: "",
      stockStore: 3,
      stockWarehouse: 6,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 22000.00,
      price: 42000.00,
    },
    {
      disciplina: "Vóley",
      categoria: "Rodilleras",
      marca: "Topper",
      nombre: "Rodilleras Acolchadas Pro",
      descripcion: "Protección de alto impacto con tejido elástico",
      talle: "M",
      color: "Negro",
      barcode: "",
      sku: "",
      stockStore: 2,
      stockWarehouse: 4,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 9500.00,
      price: 18500.00,
    },
    {
      disciplina: "Crocs",
      categoria: "Calzado",
      marca: "Crocs",
      nombre: "Zueco Classic Clog",
      descripcion: "Material Croslite ligero y resistente al agua",
      talle: "40",
      color: "Negro",
      barcode: "191448123401",
      sku: "",
      stockStore: 1,
      stockWarehouse: 3,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 28000.00,
      price: 58000.00,
    },
    {
      disciplina: "Crocs",
      categoria: "Calzado",
      marca: "Crocs",
      nombre: "Zueco Classic Clog",
      descripcion: "Material Croslite ligero y resistente al agua",
      talle: "41",
      color: "Negro",
      barcode: "191448123418",
      sku: "",
      stockStore: 2,
      stockWarehouse: 5,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 28000.00,
      price: 58000.00,
    },
    {
      disciplina: "Fitness",
      categoria: "Accesorios",
      marca: "Matacos",
      nombre: "Mancuernas Fundición Vinilo",
      descripcion: "Par de mancuernas engomadas de 2kg",
      talle: "2kg",
      color: "Rojo",
      barcode: "",
      sku: "",
      stockStore: 2,
      stockWarehouse: 6,
      minStoreStock: 1,
      minStock: 2,
      costPrice: 7000.00,
      price: 14000.00,
    },
  ];

  // Insertar filas
  rows.forEach((rowData) => {
    const row = ws.addRow(rowData);
    row.height = 20;
  });

  // -------------------------------------------------------------
  // HOJA 2: LISTAS DE VALIDACIÓN (Para alimentar los Dropdowns)
  // -------------------------------------------------------------
  const wsLists = workbook.addWorksheet("Listas_Validacion");
  
  const disciplinas = ["Natación", "Vóley", "Crocs", "Fitness", "Indumentaria", "Calzado", "Accesorios", "Básquet", "Fútbol", "Pádel", "Hockey"];
  const categorias = ["Antiparras", "Mallas", "Gorras", "Pelotas", "Rodilleras", "Calzado", "Remeras", "Shorts", "Mancuernas", "Bandas", "Bolsos", "Medias", "Protección", "Accesorios"];
  const marcas = ["Speedo", "Arena", "Wilson", "Mikasa", "Crocs", "Topper", "Matacos", "Molten", "Driza", "Nike", "Adidas", "Puma"];
  const talles = ["Único", "S", "M", "L", "XL", "XXL", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "1kg", "2kg", "3kg", "4kg", "5kg", "3", "4", "5"];
  const colores = ["Negro", "Azul", "Blanco", "Rojo", "Amarillo", "Verde", "Verde Flúor", "Azul Marino", "Rosa", "Gris", "Amarillo/Azul", "Blanco/Verde", "Multicolor"];

  // Escribir listas en la hoja auxiliar
  wsLists.getCell("A1").value = "Disciplinas";
  disciplinas.forEach((d, i) => { wsLists.getCell(`A${i + 2}`).value = d; });

  wsLists.getCell("B1").value = "Categorías";
  categorias.forEach((c, i) => { wsLists.getCell(`B${i + 2}`).value = c; });

  wsLists.getCell("C1").value = "Marcas";
  marcas.forEach((m, i) => { wsLists.getCell(`C${i + 2}`).value = m; });

  wsLists.getCell("D1").value = "Talles";
  talles.forEach((t, i) => { wsLists.getCell(`D${i + 2}`).value = t; });

  wsLists.getCell("E1").value = "Colores";
  colores.forEach((col, i) => { wsLists.getCell(`E${i + 2}`).value = col; });

  // Ocultar hoja de listas si se desea o dejarla protegida
  wsLists.state = "visible";

  // -------------------------------------------------------------
  // APLICACIÓN DE DATA VALIDATION (DROPDOWNS) A LA HOJA PRINCIPAL
  // (Aplicado desde la fila 2 hasta la 300 para soportar carga masiva)
  // -------------------------------------------------------------
  const maxRows = 300;

  for (let r = 2; r <= maxRows; r++) {
    // 1. Columna A (Disciplina): Dropdown con rango extendido y texto libre permitido
    ws.getCell(`A${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["Listas_Validacion!$A$2:$A$100"],
      showErrorMessage: false, // Permite escribir texto libre directamente
    };

    // 2. Columna B (Categoría): Dropdown con rango extendido y texto libre permitido
    ws.getCell(`B${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["Listas_Validacion!$B$2:$B$100"],
      showErrorMessage: false,
    };

    // 3. Columna C (Marca): Dropdown con rango extendido y texto libre permitido
    ws.getCell(`C${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["Listas_Validacion!$C$2:$C$100"],
      showErrorMessage: false,
    };

    // 4. Columna F (Talle): Dropdown con rango extendido y texto libre permitido
    ws.getCell(`F${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["Listas_Validacion!$D$2:$D$100"],
      showErrorMessage: false,
    };

    // 5. Columna G (Color): Dropdown con rango extendido y texto libre permitido
    ws.getCell(`G${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["Listas_Validacion!$E$2:$E$100"],
      showErrorMessage: false,
    };

    // Formato numérico y alineación para celdas de datos
    const row = ws.getRow(r);
    row.getCell("A").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("B").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("C").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("D").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("E").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("F").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("G").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("H").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("I").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("J").alignment = { vertical: "middle", horizontal: "right" };
    row.getCell("K").alignment = { vertical: "middle", horizontal: "right" };
    row.getCell("L").alignment = { vertical: "middle", horizontal: "right" };
    row.getCell("M").alignment = { vertical: "middle", horizontal: "right" };
    row.getCell("N").alignment = { vertical: "middle", horizontal: "right" };
    row.getCell("O").alignment = { vertical: "middle", horizontal: "right" };

    // Formatos numéricos de Moneda
    row.getCell("N").numFmt = '"$ "#,##0.00';
    row.getCell("O").numFmt = '"$ "#,##0.00';
    row.getCell("J").numFmt = '#,##0';
    row.getCell("K").numFmt = '#,##0';
    row.getCell("L").numFmt = '#,##0';
    row.getCell("M").numFmt = '#,##0';
  }

  // -------------------------------------------------------------
  // HOJA 3: GUÍA DE USO Y REGLAS
  // -------------------------------------------------------------
  const wsGuia = workbook.addWorksheet("Guía_de_Uso");
  wsGuia.columns = [
    { header: "Campo / Columna", key: "campo", width: 22 },
    { header: "Obligatorio", key: "obligatorio", width: 14 },
    { header: "Reglas de Negocio y Consejos para la Carga", key: "reglas", width: 85 },
  ];

  const guiaHeader = wsGuia.getRow(1);
  guiaHeader.height = 24;
  guiaHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E6B32" } };
    cell.font = { name: "Segoe UI", bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const guiaRows = [
    { campo: "Disciplina", obligatorio: "SÍ", reglas: "Área deportiva principal (dispone de menú desplegable). El sistema normaliza mayúsculas y tildes." },
    { campo: "Categoría", obligatorio: "SÍ", reglas: "Tipo de artículo (dispone de desplegable). Si la categoría no existe, se crea automáticamente." },
    { campo: "Marca", obligatorio: "SÍ", reglas: "Fabricante o marca (dispone de desplegable). Se normaliza por slug para evitar duplicados." },
    { campo: "Nombre Producto", obligatorio: "SÍ", reglas: "Denominación comercial. Debe escribirse IGUAL en todas las filas de talles/colores del mismo producto." },
    { campo: "Descripción", obligatorio: "NO", reglas: "Detalle técnico o de materiales visible en la tienda web." },
    { campo: "Talle", obligatorio: "SÍ", reglas: "Talle numérico (40, 41), textil (S, M, L) o 'Único' (dispone de menú desplegable o texto libre)." },
    { campo: "Color", obligatorio: "SÍ", reglas: "Color predominante o combinación (dispone de menú desplegable o texto libre)." },
    { campo: "Código de Barra", obligatorio: "NO", reglas: "EAN-13 impreso de fábrica. Si no tiene, dejar en blanco para imprimir etiqueta interna (RF-05)." },
    { campo: "SKU (Opcional)", obligatorio: "NO", reglas: "Código de control interno. Si se deja vacío, el sistema lo genera automáticamente." },
    { campo: "Stock Salón", obligatorio: "SÍ", reglas: "Unidades físicas exhibidas en estanterías o mostrador en Saavedra 241 (número entero >= 0)." },
    { campo: "Stock Depósito", obligatorio: "SÍ", reglas: "Unidades físicas guardadas en cajas del depósito interno (número entero >= 0)." },
    { campo: "Mínimo Salón", obligatorio: "NO", reglas: "Umbral para disparar la Alerta de Reposición Interna (Depósito -> Salón). Por defecto: 1." },
    { campo: "Mínimo Proveedor", obligatorio: "NO", reglas: "Umbral para disparar la Alerta de Compra a Proveedor. Por defecto: 2." },
    { campo: "Precio Costo (ARS)", obligatorio: "SÍ", reglas: "Precio de compra neto al distribuidor en pesos argentinos." },
    { campo: "Precio Venta (ARS)", obligatorio: "SÍ", reglas: "Precio final minorista al público en el local y tienda web." },
  ];

  guiaRows.forEach((g) => wsGuia.addRow(g));

  const outputPath = path.join(__dirname, "../docs/plantilla_carga_stock_matacos.xlsx");
  const fallbackPath = path.join(__dirname, "../docs/plantilla_carga_stock_matacos_con_desplegables.xlsx");
  
  try {
    await workbook.xlsx.writeFile(outputPath);
    console.log("Excel con desplegables nativos generado exitosamente en:", outputPath);
  } catch (err) {
    if (err.code === "EBUSY") {
      console.log("El archivo principal está abierto en Excel. Guardando en:", fallbackPath);
      await workbook.xlsx.writeFile(fallbackPath);
      console.log("Generado exitosamente en archivo alternativo:", fallbackPath);
    } else {
      throw err;
    }
  }
}

generateExcelTemplate().catch(console.error);
