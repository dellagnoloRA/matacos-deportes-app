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
  { key: "activity", label: "Amortiguación / Confort", component: Activity },
  { key: "feather", label: "Ligereza / Peso Pluma", component: Feather },
  { key: "wind", label: "Ventilación / Transpirable", component: Wind },
  { key: "shield", label: "Resistencia / Protección", component: Shield },
  { key: "droplets", label: "Impermeable / Natación", component: Droplets },
  { key: "zap", label: "Velocidad / Reactividad", component: Zap },
  { key: "flame", label: "Potencia / Térmico", component: Flame },
  { key: "layers", label: "Elasticidad / Soporte", component: Layers },
  { key: "target", label: "Precisión / Agarre", component: Target },
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
  activity: Activity,
  feather: Feather,
  wind: Wind,
  shield: Shield,
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
 * Detecta intuitivamente el ícono más representativo analizando
 * las palabras clave del título y de la descripción de la característica.
 */
export function getSmartHighlightIcon(
  title: string = "",
  text: string = ""
): string {
  const combined = `${title} ${text}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Amortiguación, pisada, confort
  if (
    /amortigua|impacto|pisada|confort|rebote|suela|suave|cloud|react|gel|comodidad|descanso|almohad|camara/.test(
      combined
    )
  ) {
    return "activity";
  }

  // 2. Peso y ligereza
  if (
    /pluma|liviano|ligero|peso|ultraligero|feather|light|liviandad|gramaje/.test(
      combined
    )
  ) {
    return "feather";
  }

  // 3. Ventilación y transpiración
  if (
    /viento|aire|respirable|transpir|ventil|fresc|malla|mesh|dry|dri-fit|aerodin|flujo/.test(
      combined
    )
  ) {
    return "wind";
  }

  // 4. Agua, natación, pileta, repelente de agua
  if (
    /agua|hidro|lluvia|cloro|nataci|pileta|piscina|gota|waterproof|impermeable|secado|aquat|hidrofug/.test(
      combined
    )
  ) {
    return "droplets";
  }

  // 5. Durabilidad, protección y resistencia
  if (
    /protec|escudo|durab|resist|segur|blind|reforz|anti|desgaste|roce|reforzad/.test(
      combined
    )
  ) {
    return "shield";
  }

  // 6. Potencia, energía, calor o térmico
  if (
    /fuego|calor|potencia|termic|energia|quema|flame|explosiv|abrigo|invern/.test(
      combined
    )
  ) {
    return "flame";
  }

  // 7. Elasticidad, capas, flexibilidad y ajuste
  if (
    /capas|elast|flex|stretch|lycra|anatom|ajuste|soporte|textil|compres/.test(
      combined
    )
  ) {
    return "layers";
  }

  // 8. Agarre, tracción, precisión y control
  if (
    /precision|punteria|control|agarre|grip|tacto|target|objetiv|traccion|adherenc|antidesliz/.test(
      combined
    )
  ) {
    return "target";
  }

  // 9. Ecológico, sustentable, natural
  if (
    /eco|recicla|sustent|verde|organ|algod|natur|bio|sustentab/.test(combined)
  ) {
    return "leaf";
  }

  // 10. Calidad, garantía, pro, oficial
  if (
    /prem|calidad|certif|garant|oficial|oro|trofeo|award|ganad|patent|profesion/.test(
      combined
    )
  ) {
    return "award";
  }

  // 11. Ergonomía, cardio, salud
  if (
    /corazon|salud|cardio|vital|ritmo|pulso|pecho|postur|ergonom/.test(combined)
  ) {
    return "heart";
  }

  // 12. Sol, rayos UV
  if (/sol|uv|verano|solar|rayos/.test(combined)) {
    return "sun";
  }

  // 13. Innovación, especial, magia
  if (
    /estrell|destac|especial|magia|brillo|sparkle|novedad|exclusiv/.test(combined)
  ) {
    return "sparkles";
  }

  // 14. Velocidad, dinamismo, reacción
  if (
    /rapidez|veloc|aceler|rayo|turbo|speed|propulsi|reactiv|sprint/.test(combined)
  ) {
    return "zap";
  }

  // Fallback por defecto
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
