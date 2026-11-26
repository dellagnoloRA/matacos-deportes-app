/**
 * Mapeo inteligente y diccionario de colores deportivos a hexadecimal
 */
export const COLOR_PALETTE_MAP: Record<string, string> = {
  // Básicos
  negro: "#111827",
  black: "#111827",
  blanco: "#FFFFFF",
  white: "#FFFFFF",
  gris: "#64748B",
  grey: "#64748B",
  gray: "#64748B",

  // Azules y derivados
  "azul marino": "#0F172A",
  "azul oscuro": "#1E293B",
  "azul noche": "#0F172A",
  "azul francia": "#2563EB",
  "azul rey": "#1D4ED8",
  "azul electrico": "#3B82F6",
  "azul aero": "#38BDF8",
  azul: "#2563EB",
  blue: "#2563EB",
  navy: "#0F172A",
  marino: "#1E3A8A",
  "celeste y blanco": "#38BDF8",
  celeste: "#38BDF8",
  cyan: "#06B6D4",
  turquesa: "#14B8A6",
  aqua: "#2DD4BF",

  // Rojos y Burdeos
  bordo: "#7F1D1D",
  granate: "#881337",
  vino: "#581C87",
  borgona: "#701A75",
  "rojo fuego": "#DC2626",
  "rojo vivo": "#EF4444",
  rojo: "#DC2626",
  red: "#DC2626",
  carmesi: "#BE123C",

  // Verdes
  "verde militar": "#3F6212",
  "verde oliva": "#4D7C0F",
  "verde musgo": "#365314",
  "verde fluor": "#00D615",
  fluor: "#00D615",
  "verde neon": "#22C55E",
  "verde manzana": "#84CC16",
  "verde lima": "#A3E635",
  "verde esmeralda": "#059669",
  "verde botella": "#14532D",
  verde: "#16A34A",
  green: "#16A34A",
  oliva: "#4D7C0F",
  menta: "#6EE7B7",

  // Amarillos y Naranjas
  "amarillo oro": "#EAB308",
  "amarillo fluor": "#FACC15",
  amarillo: "#EAB308",
  yellow: "#EAB308",
  mostaza: "#CA8A04",
  "naranja fluor": "#F97316",
  naranja: "#EA580C",
  orange: "#EA580C",
  coral: "#FB7185",
  salmon: "#F43F5E",
  durazno: "#FDBA74",

  // Rosas y Violetas
  "rosa chicle": "#F472B6",
  "rosa pastel": "#FBCFE8",
  rosa: "#EC4899",
  pink: "#EC4899",
  fucsia: "#D946EF",
  magenta: "#C026D3",
  lila: "#C084FC",
  lavanda: "#DDD6FE",
  violeta: "#7C3AED",
  morado: "#6D28D9",
  purpura: "#7E22CE",

  // Grises y neutros
  "gris melange": "#CBD5E1",
  "gris topo": "#78716C",
  "gris claro": "#E2E8F0",
  "gris plomo": "#475569",
  "gris oscuro": "#334155",
  grafito: "#1E293B",
  antracita: "#1E293B",
  plata: "#94A3B8",
  plateado: "#94A3B8",
  silver: "#94A3B8",

  // Marrones y tierras
  "marron oscuro": "#451A03",
  marron: "#78350F",
  brown: "#78350F",
  chocolate: "#451A03",
  cafe: "#713F12",
  terracota: "#9A3412",
  canela: "#B45309",
  caramelo: "#D97706",
  beige: "#D4B996",
  nude: "#F5E6D3",
  arena: "#E7D8C9",
  crema: "#FEF3C7",
  hueso: "#F8FAFC",
  marfil: "#FFFBEB",
  kaki: "#78716C",
  khaki: "#78716C",

  // Metálicos y especiales
  dorado: "#D97706",
  oro: "#EAB308",
  gold: "#EAB308",
  bronce: "#B45309",
  cobre: "#9A3412",
  petroleo: "#0E7490",
};

/**
 * Detecta e interpreta automáticamente el color hexadecimal (#HEX)
 * según el nombre o descripción ingresado por el usuario.
 */
export function guessColorHexFromName(colorName: string): string | null {
  if (!colorName || colorName.trim() === "") return null;

  const raw = colorName.trim();

  // 1. Código hexadecimal directo escrito por el usuario
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
    return raw;
  }

  // Normalizar: minúsculas, sin tildes ni diacríticos
  const clean = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // 2. Coincidencia exacta en el diccionario
  if (COLOR_PALETTE_MAP[clean]) {
    return COLOR_PALETTE_MAP[clean];
  }

  // 3. Separadores de combinaciones (ej: "Negro / Blanco", "Azul y Oro", "Rojo-Negro")
  const parts = clean.split(/[\/\-\+y\s]+/).filter(Boolean);
  if (parts.length > 0) {
    const firstTwo = `${parts[0]} ${parts[1] || ""}`.trim();
    if (COLOR_PALETTE_MAP[firstTwo]) {
      return COLOR_PALETTE_MAP[firstTwo];
    }
    if (COLOR_PALETTE_MAP[parts[0]]) {
      return COLOR_PALETTE_MAP[parts[0]];
    }
  }

  // 4. Búsqueda por subcadena si no hubo coincidencia directa
  for (const [key, hex] of Object.entries(COLOR_PALETTE_MAP)) {
    if (clean.includes(key)) {
      return hex;
    }
  }

  return null;
}

