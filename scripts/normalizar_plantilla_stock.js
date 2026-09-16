/**
 * Script de Normalización de Catálogo e Inventario para Matacos Deportes
 * 
 * Propósito:
 * 1. Unificar el campo "Nombre Producto" para que represente el modelo base (ej: "Crocband" en vez de "CrocBand - Black").
 * 2. Quitar guiones colgantes e inconsistencias ("Bandolera Wilson -", "Valija Mediana - ").
 * 3. Mantener intactas las columnas de Talle, Color, Código de Barra y Stock.
 * 4. Detectar anomalías y variantes duplicadas.
 * 5. Generar archivo Excel (.xlsx) y CSV (.csv) listos para importar en Google Sheets o el sistema.
 */

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// Rutas por defecto
const DEFAULT_INPUT = path.resolve(__dirname, "../plantilla_carga_stock_matacos (1).xlsx");
const DOWNLOADS_DIR = path.resolve(process.env.USERPROFILE || "C:\\Users\\della", "Downloads");
const DEFAULT_OUTPUT_XLSX = path.join(DOWNLOADS_DIR, "plantilla_carga_stock_matacos_normalizada.xlsx");
const DEFAULT_OUTPUT_CSV = path.join(DOWNLOADS_DIR, "plantilla_carga_stock_matacos_normalizada.csv");

/**
 * Función canónica de normalización para nombres de producto
 */
function normalizeProductName(rawName) {
  if (!rawName) return "";
  let name = String(rawName).trim().replace(/\s+/g, " ");

  // Normalización de modelos de Crocs
  if (/^CrocBand Kids\b/i.test(name)) return "Crocband Kids";
  if (/^CrocBand\b/i.test(name)) return "Crocband";
  if (/^Croc Classic Kids\b/i.test(name)) return "Croc Classic Kids";
  if (/^Croc Classic Crush Clog\b/i.test(name)) return "Croc Classic Crush Clog";
  if (/^Croc Classic Sandal\b/i.test(name)) return "Croc Classic Sandal";
  if (/^Croc Crush Sandal\b/i.test(name)) return "Croc Crush Sandal";
  if (/^Croc Classic\b/i.test(name)) return "Croc Classic";
  if (/^Croc Plataforma\b/i.test(name)) return "Croc Plataforma";
  if (/^Croc Santa Cruz 2 Luxe Leather\b/i.test(name)) return "Croc Santa Cruz 2 Luxe Leather";
  if (/^Croc Santa Cruz Clean Cut\b/i.test(name)) return "Croc Santa Cruz Clean Cut";
  if (/^Croc Santa Cruz Mens\b/i.test(name)) return "Croc Santa Cruz Mens";

  // Quitar guiones colgantes al final (ej: "Bandolera Wilson - " -> "Bandolera Wilson")
  name = name.replace(/\s*-\s*$/, "");

  return name;
}

function runNormalization(inputPath = DEFAULT_INPUT, outXlsx = DEFAULT_OUTPUT_XLSX, outCsv = DEFAULT_OUTPUT_CSV) {
  console.log("================================================================================");
  console.log("🛠️ NORMALIZADOR DE PLANILLA DE STOCK — MATACOS DEPORTES");
  console.log("================================================================================");

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Archivo de entrada no encontrado: ${inputPath}`);
    process.exit(1);
  }

  console.log(`📖 Leyendo archivo original: ${inputPath}`);
  const workbook = xlsx.readFile(inputPath, { cellFormula: true, cellStyles: true });

  const sheetName = "Productos_y_Stock";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.error(`❌ No se encontró la hoja '${sheetName}' en el archivo.`);
    process.exit(1);
  }

  const range = xlsx.utils.decode_range(sheet["!ref"]);
  let updatedCount = 0;
  let totalDataRows = 0;
  const originalNames = new Set();
  const normalizedNames = new Set();

  // Mapeo para detección de duplicados (Producto + Talle + Color)
  const variantMatrix = new Map();
  const duplicateAlerts = [];

  for (let r = 1; r <= range.e.r; r++) {
    const nameCellAddr = xlsx.utils.encode_cell({ r, c: 3 }); // Columna D (Nombre Producto)
    const nameCell = sheet[nameCellAddr];

    const sizeCellAddr = xlsx.utils.encode_cell({ r, c: 5 }); // Columna F (Talle)
    const sizeCell = sheet[sizeCellAddr];

    const colorCellAddr = xlsx.utils.encode_cell({ r, c: 6 }); // Columna G (Color)
    const colorCell = sheet[colorCellAddr];

    // Ignorar filas sin nombre ni talle
    if (!nameCell || !nameCell.v) continue;

    totalDataRows++;
    const origVal = String(nameCell.v).trim();
    originalNames.add(origVal);

    const normVal = normalizeProductName(origVal);
    normalizedNames.add(normVal);

    if (origVal !== normVal) {
      nameCell.v = normVal;
      nameCell.w = normVal;
      if (nameCell.r) nameCell.r = `<t>${normVal}</t>`;
      updatedCount++;
    }

    // Comprobar colisión de variantes
    const sizeVal = sizeCell ? String(sizeCell.v).trim() : "";
    const colorVal = colorCell ? String(colorCell.v).trim() : "";
    const variantKey = `${normVal} | Talle: ${sizeVal} | Color: ${colorVal}`;

    if (variantMatrix.has(variantKey)) {
      duplicateAlerts.push({
        variantKey,
        previousRow: variantMatrix.get(variantKey),
        currentRow: r + 1,
        origName1: origVal,
      });
    } else {
      variantMatrix.set(variantKey, r + 1);
    }
  }

  console.log(`\n📊 Resumen del Procesamiento:`);
  console.log(`   - Filas de datos analizadas: ${totalDataRows}`);
  console.log(`   - Nombres de producto modificados: ${updatedCount}`);
  console.log(`   - Modelos de producto antes (inflados por color): ${originalNames.size}`);
  console.log(`   - Modelos de producto ahora (familias reales): ${normalizedNames.size}`);

  if (duplicateAlerts.length > 0) {
    console.log(`\n⚠️ ADVERTENCIAS DE VARIANTES DUPLICADAS (Revisión recomendada):`);
    duplicateAlerts.forEach((alert) => {
      console.log(`   • [Fila ${alert.currentRow}] colisiona con [Fila ${alert.previousRow}]:`);
      console.log(`     Clave: "${alert.variantKey}"`);
      console.log(`     (Revisar si en la fila original se copió mal el color, ej: 'Cuero Negro' en vez de 'Khaki')`);
    });
  }

  // Asegurar directorio de destino
  const outDir = path.dirname(outXlsx);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Guardar archivo Excel (.xlsx) con fórmulas y estructura preservada
  xlsx.writeFile(workbook, outXlsx);
  console.log(`\n✅ Archivo Excel generado: ${outXlsx}`);

  // 2. Guardar archivo CSV listo para importar en Google Sheets
  const csvContent = xlsx.utils.sheet_to_csv(sheet);
  fs.writeFileSync(outCsv, "\uFEFF" + csvContent, "utf8"); // UTF-8 con BOM para acentos en Excel/Sheets
  console.log(`✅ Archivo CSV generado (con BOM UTF-8): ${outCsv}`);

  console.log("\n================================================================================");
  console.log("🚀 ¡Proceso completado exitosamente!");
  console.log("================================================================================\n");
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const inputArg = args[0] || DEFAULT_INPUT;
  const outXlsxArg = args[1] || DEFAULT_OUTPUT_XLSX;
  const outCsvArg = args[2] || DEFAULT_OUTPUT_CSV;

  runNormalization(inputArg, outXlsxArg, outCsvArg);
}

module.exports = { normalizeProductName, runNormalization };
