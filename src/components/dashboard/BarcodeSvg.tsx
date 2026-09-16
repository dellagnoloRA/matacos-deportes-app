"use client";

import React, { useMemo } from "react";
import { calculateEan13CheckDigit, validateEan13 } from "@/lib/barcodeGenerator";

export interface BarcodeSvgProps {
  value: string;
  className?: string;
  width?: number | string;
  height?: number;
  showText?: boolean;
  fontSize?: number;
}

// -------------------------------------------------------------
// PATRONES OFICIALES GS1 EAN-13 (95 módulos binarios)
// -------------------------------------------------------------
const L_PATTERNS: Record<number, string> = {
  0: "AAAAAA",
  1: "AABABB",
  2: "AABBAB",
  3: "AABBBA",
  4: "ABAABB",
  5: "ABBAAB",
  6: "ABBBAA",
  7: "ABABAB",
  8: "ABABBA",
  9: "ABBABA",
};

const DIGIT_PATTERNS: Record<string, Record<number, string>> = {
  A: {
    0: "0001101", 1: "0011001", 2: "0010011", 3: "0111101", 4: "0100011",
    5: "0110001", 6: "0101111", 7: "0111011", 8: "0110111", 9: "0001011",
  },
  B: {
    0: "0100111", 1: "0110011", 2: "0011011", 3: "0100001", 4: "0011101",
    5: "0111001", 6: "0000101", 7: "0010001", 8: "0001001", 9: "0010111",
  },
  C: {
    0: "1110010", 1: "1100110", 2: "1101100", 3: "1000010", 4: "1011100",
    5: "1001110", 6: "1010000", 7: "1000100", 8: "1001000", 9: "1110100",
  },
};

// -------------------------------------------------------------
// PATRONES CODE 128 (B) PARA CÓDIGOS ALFANUMÉRICOS O NO-EAN13
// -------------------------------------------------------------
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

function encodeCode128B(text: string): string {
  const startCode = 104; // Start B
  let checkSum = startCode;
  let weights: number[] = [startCode];

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      weights.push(code);
      checkSum += code * (i + 1);
    }
  }

  const checkDigit = checkSum % 103;
  weights.push(checkDigit);
  weights.push(106); // Stop code

  let bits = "";
  for (const w of weights) {
    const pattern = CODE128_PATTERNS[w] || "212222";
    let isBar = true;
    for (const char of pattern) {
      const runLength = parseInt(char, 10);
      bits += (isBar ? "1" : "0").repeat(runLength);
      isBar = !isBar;
    }
  }

  return bits;
}

export function BarcodeSvg({
  value,
  className = "",
  width = "100%",
  height = 50,
  showText = true,
  fontSize = 11,
}: BarcodeSvgProps) {
  const cleanVal = (value || "").trim();

  // Determinar si califica para estándar EAN-13 numérico (exactamente 13 dígitos)
  const isEan13Candidate = /^\d{13}$/.test(cleanVal);

  const ean13FullCode = useMemo(() => {
    if (!isEan13Candidate) return null;
    if (cleanVal.length === 13) {
      return validateEan13(cleanVal)
        ? cleanVal
        : `${cleanVal.slice(0, 12)}${calculateEan13CheckDigit(cleanVal.slice(0, 12))}`;
    }
    return null;
  }, [cleanVal, isEan13Candidate]);

  // Codificación EAN-13
  const ean13Data = useMemo(() => {
    if (!ean13FullCode) return null;

    const firstDigit = parseInt(ean13FullCode[0], 10);
    const parityPattern = L_PATTERNS[firstDigit];
    const guardSet = new Set<number>();
    let bitString = "";

    // 1. Start Guard (101)
    guardSet.add(bitString.length);
    guardSet.add(bitString.length + 1);
    guardSet.add(bitString.length + 2);
    bitString += "101";

    // 2. Left 6 digits
    for (let i = 1; i <= 6; i++) {
      const digit = parseInt(ean13FullCode[i], 10);
      const set = parityPattern[i - 1];
      bitString += DIGIT_PATTERNS[set][digit];
    }

    // 3. Center Guard (01010)
    for (let g = 0; g < 5; g++) {
      guardSet.add(bitString.length + g);
    }
    bitString += "01010";

    // 4. Right 6 digits (Set C)
    for (let i = 7; i <= 12; i++) {
      const digit = parseInt(ean13FullCode[i], 10);
      bitString += DIGIT_PATTERNS["C"][digit];
    }

    // 5. End Guard (101)
    guardSet.add(bitString.length);
    guardSet.add(bitString.length + 1);
    guardSet.add(bitString.length + 2);
    bitString += "101";

    return {
      bits: bitString,
      guardSet,
      firstDigit: ean13FullCode[0],
      leftDigits: ean13FullCode.slice(1, 7),
      rightDigits: ean13FullCode.slice(7, 13),
    };
  }, [ean13FullCode]);

  // Si no es EAN-13, codificar con Code 128 B
  const code128Bits = useMemo(() => {
    if (ean13Data || !cleanVal) return null;
    return encodeCode128B(cleanVal);
  }, [ean13Data, cleanVal]);

  if (!cleanVal) {
    return (
      <div className={`flex items-center justify-center text-[10px] text-slate-400 font-mono border border-dashed border-slate-300 py-2 rounded ${className}`}>
        [Sin código asignado]
      </div>
    );
  }

  // RENDER EAN-13
  if (ean13Data) {
    const quietZoneLeft = 10; // Espacio para el primer dígito a la izquierda
    const quietZoneRight = 6;
    const totalModules = quietZoneLeft + 95 + quietZoneRight;
    const barHeight = showText ? height - fontSize - 4 : height;
    const guardExtraHeight = showText ? 5 : 0;

    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        <svg
          viewBox={`0 0 ${totalModules} ${height}`}
          style={{ width, height }}
          className="overflow-visible"
          shapeRendering="crispEdges"
        >
          {/* Barras verticales */}
          {ean13Data.bits.split("").map((bit, idx) => {
            if (bit !== "1") return null;
            const isGuard = ean13Data.guardSet.has(idx);
            const x = quietZoneLeft + idx;
            const h = isGuard ? barHeight + guardExtraHeight : barHeight;

            return (
              <rect
                key={idx}
                x={x}
                y={0}
                width={1}
                height={h}
                fill="black"
              />
            );
          })}

          {/* Dígitos EAN-13 en formato estándar GS1 */}
          {showText && (
            <>
              {/* Primer dígito (a la izquierda de la primera guarda) */}
              <text
                x={quietZoneLeft - 2}
                y={height - 1}
                textAnchor="end"
                fontSize={fontSize}
                fontFamily="monospace, ui-monospace, sans-serif"
                fontWeight="bold"
                fill="black"
              >
                {ean13Data.firstDigit}
              </text>

              {/* 6 dígitos izquierdos */}
              <text
                x={quietZoneLeft + 24}
                y={height - 1}
                textAnchor="middle"
                fontSize={fontSize}
                letterSpacing="0.8"
                fontFamily="monospace, ui-monospace, sans-serif"
                fontWeight="bold"
                fill="black"
              >
                {ean13Data.leftDigits}
              </text>

              {/* 6 dígitos derechos */}
              <text
                x={quietZoneLeft + 71}
                y={height - 1}
                textAnchor="middle"
                fontSize={fontSize}
                letterSpacing="0.8"
                fontFamily="monospace, ui-monospace, sans-serif"
                fontWeight="bold"
                fill="black"
              >
                {ean13Data.rightDigits}
              </text>
            </>
          )}
        </svg>
      </div>
    );
  }

  // RENDER CODE 128 (Fallback alfanumérico)
  if (code128Bits) {
    const quietZone = 10;
    const totalModules = quietZone * 2 + code128Bits.length;
    const barHeight = showText ? height - fontSize - 3 : height;

    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        <svg
          viewBox={`0 0 ${totalModules} ${height}`}
          style={{ width, height }}
          className="overflow-visible"
          shapeRendering="crispEdges"
        >
          {code128Bits.split("").map((bit, idx) => {
            if (bit !== "1") return null;
            return (
              <rect
                key={idx}
                x={quietZone + idx}
                y={0}
                width={1}
                height={barHeight}
                fill="black"
              />
            );
          })}

          {showText && (
            <text
              x={totalModules / 2}
              y={height - 1}
              textAnchor="middle"
              fontSize={fontSize}
              letterSpacing="0.5"
              fontFamily="monospace, ui-monospace, sans-serif"
              fontWeight="bold"
              fill="black"
            >
              {cleanVal}
            </text>
          )}
        </svg>
      </div>
    );
  }

  return null;
}

