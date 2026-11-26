import React from "react";
import {
  Zap,
  Activity,
  Feather,
  Wind,
  Shield,
  Droplets,
  Flame,
  Layers,
  Target,
  Leaf,
  Award,
  Sparkles,
  Heart,
  Sun,
} from "lucide-react";

export interface AvailableIcon {
  key: string;
  label: string;
  component: React.ComponentType<{ className?: string }>;
}

export const AVAILABLE_HIGHLIGHT_ICONS: AvailableIcon[] = [
  { key: "shield", label: "Resistencia / Durabilidad", component: Shield },
  { key: "activity", label: "Amortiguación / Pisada", component: Activity },
  { key: "feather", label: "Ligereza / Peso Pluma", component: Feather },
  { key: "wind", label: "Ventilación / Respirable", component: Wind },
  { key: "droplets", label: "Impermeable / Natación", component: Droplets },
  { key: "zap", label: "Velocidad / Reactividad", component: Zap },
  { key: "flame", label: "Potencia / Térmico", component: Flame },
  { key: "layers", label: "Elasticidad / Soporte", component: Layers },
  { key: "target", label: "Precisión / Agarre / Grip", component: Target },
  { key: "leaf", label: "Sustentable / Eco", component: Leaf },
  { key: "award", label: "Garantía / Calidad", component: Award },
  { key: "sparkles", label: "Novedad / Especial", component: Sparkles },
  { key: "heart", label: "Ergonomía / Cardio", component: Heart },
  { key: "sun", label: "Protección UV / Sol", component: Sun },
];

export const HIGHLIGHT_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  shield: Shield,
  activity: Activity,
  feather: Feather,
  wind: Wind,
  droplets: Droplets,
  zap: Zap,
  flame: Flame,
  layers: Layers,
  target: Target,
  leaf: Leaf,
  award: Award,
  sparkles: Sparkles,
  heart: Heart,
  sun: Sun,
};

/**
 * Evalúa una cadena de texto contra las palabras clave deportivas
 */
function matchKeywords(text: string): string | null {
  if (!text || text.trim() === "") return null;

  const norm = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Resistencia / Protección / Durabilidad (escudo)
  if (
    /resist|durab|protec|escud|segur|blind|reforz|antidesgarro|desgaste|roce|antiroce|irrompible|fuerte|tenaz/.test(
      norm
    )
  ) {
    return "shield";
  }

  // 2. Amortiguación / Pisada / Confort / Impacto
  if (
    /amortigua|impact|pisad|confort|rebot|suela|suave|cloud|react|gel|comodidad|descans|almohad|camara/.test(
      norm
    )
  ) {
    return "activity";
  }

  // 3. Ligereza / Peso pluma / Liviano
  if (
    /pluma|livian|liger|peso|ultralig|feather|light|gramaj|liviano|ligero/.test(
      norm
    )
  ) {
    return "feather";
  }

  // 4. Ventilación / Transpirable / Aire / Fresco
  if (
    /vient|aire|respir|transpir|ventil|fresc|malla|mesh|dry|dri-fit|aerodin|flujo|clima/.test(
      norm
    )
  ) {
    return "wind";
  }

  // 5. Agua / Impermeable / Natación / Repelente
  if (
    /agua|hidro|lluvi|cloro|natac|pilet|piscin|gota|waterproof|impermeab|secad|aquat|hidrofug/.test(
      norm
    )
  ) {
    return "droplets";
  }

  // 6. Potencia / Fuego / Térmico / Energía
  if (
    /fueg|calor|potenc|termic|energi|quema|flame|explosiv|abrig|invern/.test(
      norm
    )
  ) {
    return "flame";
  }

  // 7. Elasticidad / Capas / Flexibilidad / Lycra
  if (
    /capa|elast|flex|stretch|lycra|anatom|ajust|soport|textil|compres|maleab/.test(
      norm
    )
  ) {
    return "layers";
  }

  // 8. Agarre / Grip / Tracción / Precisión
  if (
    /precis|punter|control|agarr|grip|tacto|target|objetiv|tracc|adher|antidesliz/.test(
      norm
    )
  ) {
    return "target";
  }

  // 9. Ecológico / Sustentable / Reciclado / Natural
  if (/eco|recicl|sustent|verd|organ|algod|natur|bio/.test(norm)) {
    return "leaf";
  }

  // 10. Calidad / Garantía / Oficial / Premium
  if (/prem|calidad|certif|garant|oficial|oro|trofe|award|ganad|patent|profes/.test(norm)) {
    return "award";
  }

  // 11. Ergonomía / Salud / Cardio / Corazón
  if (/coraz|salud|cardio|vital|ritm|puls|pech|postur|ergonom/.test(norm)) {
    return "heart";
  }

  // 12. Sol / UV / Verano
  if (/sol|uv|veran|solar|rayos/.test(norm)) {
    return "sun";
  }

  // 13. Novedad / Especial / Exclusivo
  if (/estrell|destac|especial|magi|brill|sparkle|noved|exclusiv/.test(norm)) {
    return "sparkles";
  }

  // 14. Velocidad / Rapidez / Rayo
  if (/rapid|veloc|aceler|rayo|turbo|speed|propuls|reactiv|sprint/.test(norm)) {
    return "zap";
  }

  return null;
}

/**
 * Detecta intuitivamente el ícono más representativo:
 * - Prioridad 1: Palabras clave en el TÍTULO de la característica.
 * - Prioridad 2: Palabras clave en el TEXTO de la descripción.
 * - Fallback: "zap" (Rayo por defecto).
 */
export function getSmartHighlightIcon(
  title: string = "",
  text: string = ""
): string {
  // 1. Evaluar primero el título (prioridad absoluta)
  const fromTitle = matchKeywords(title);
  if (fromTitle) {
    return fromTitle;
  }

  // 2. Si el título no coincide, evaluar la explicación
  const fromText = matchKeywords(text);
  if (fromText) {
    return fromText;
  }

  // 3. Fallback
  return "zap";
}

export function HighlightIcon({
  icon,
  className = "w-4 h-4",
}: {
  icon?: string;
  className?: string;
}) {
  const IconComp = HIGHLIGHT_ICON_MAP[icon?.toLowerCase() || ""] || Zap;
  return <IconComp className={className} />;
}
