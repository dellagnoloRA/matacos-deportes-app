/**
 * Módulo de Generación y Validación de Códigos de Barra EAN-13 y Formato de Etiquetas
 * Matacos Deportes — Backend (RF-05)
 */

export interface BarcodeLabelData {
  productName: string;
  discipline: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  sku: string;
  barcode: string;
  priceFormatted: string;
  priceNumeric: number;
}

/**
 * Prefijo oficial de circulación interna en el estándar GS1
 * Los prefijos 20 a 29 (y en particular 200 a 299) están reservados internacionalmente
 * para uso exclusivo interno dentro del comercio/establecimiento (Restricted Circulation Numbers).
 */
export const GS1_INTERNAL_PREFIX = "200";

/**
 * Calcula el Dígito Verificador oficial GS1 Módulo 10 para un código EAN.
 * Recibe una cadena de exactamente 12 dígitos numéricos y retorna el dígito 13.
 *
 * Algoritmo oficial GS1:
 *  1. Multiplicar dígitos en posiciones impares (índices 0, 2, 4, 6, 8, 10) por 1.
 *  2. Multiplicar dígitos en posiciones pares (índices 1, 3, 5, 7, 9, 11) por 3.
 *  3. Sumar todos los productos.
 *  4. El dígito verificador es el complemento a la decena superior: (10 - (suma % 10)) % 10.
 */
export function calculateEan13CheckDigit(digits12: string): number {
  if (!/^\d{12}$/.test(digits12)) {
    throw new Error(`Se requieren exactamente 12 dígitos numéricos para calcular el dígito verificador. Recibido: "${digits12}"`);
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits12[i], 10);
    // En EAN-13 (1-indexed de izquierda a derecha):
    // Posición 1 (índice 0): peso 1
    // Posición 2 (índice 1): peso 3
    // Posición 3 (índice 2): peso 1...
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Valida si un código de barras de 13 dígitos cumple estrictamente con el estándar EAN-13
 * verificando longitud numérica y el dígito verificador Módulo 10.
 */
export function validateEan13(barcode: string): boolean {
  if (!barcode || !/^\d{13}$/.test(barcode)) {
    return false;
  }

  const body12 = barcode.slice(0, 12);
  const expectedCheckDigit = calculateEan13CheckDigit(body12);
  const actualCheckDigit = parseInt(barcode[12], 10);

  return expectedCheckDigit === actualCheckDigit;
}

/**
 * Genera un código EAN-13 interno irrepetible a partir de un número de secuencia correlativo.
 *
 * Estructura del código (13 dígitos):
 *  - [0..2]  (3 dígitos): Prefijo interno GS1 (por defecto: "200")
 *  - [3..11] (9 dígitos): Secuencia correlativa con relleno de ceros a la izquierda (ej: "000000042")
 *  - [12]    (1 dígito):  Dígito verificador Módulo 10 calculado algorítmicamente
 *
 * Capacidad: Permite hasta 999.999.999 productos internos sin colisión matemática.
 *
 * @param sequenceNumber Número correlativo entero positivo (ej: 1, 2, 500)
 * @param prefix Prefijo interno (por defecto "200")
 */
export function generateEan13FromSequence(sequenceNumber: number, prefix = GS1_INTERNAL_PREFIX): string {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error("El número de secuencia debe ser un entero positivo mayor o igual a 1.");
  }

  if (sequenceNumber > 999999999) {
    throw new Error("El número de secuencia supera la capacidad máxima de 9 dígitos correlativos.");
  }

  // Rellenar secuencia a 9 dígitos: ej. 42 -> "000000042"
  const sequencePadded = sequenceNumber.toString().padStart(9, "0");
  const body12 = `${prefix}${sequencePadded}`;

  const checkDigit = calculateEan13CheckDigit(body12);
  return `${body12}${checkDigit}`;
}

/**
 * Genera un lote masivo de N códigos EAN-13 correlativos continuos garantizando 0 colisiones.
 *
 * @param startSequence Secuencia de inicio
 * @param count Cantidad de códigos a generar (ej: 500)
 * @param prefix Prefijo interno (default: "200")
 */
export function generateBatchEan13(
  startSequence: number,
  count: number,
  prefix = GS1_INTERNAL_PREFIX
): string[] {
  if (count <= 0) return [];
  const barcodes: string[] = new Array(count);

  for (let i = 0; i < count; i++) {
    barcodes[i] = generateEan13FromSequence(startSequence + i, prefix);
  }

  return barcodes;
}
