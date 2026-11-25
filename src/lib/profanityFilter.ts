export type TextModerationStatus = "CLEAN" | "REVIEW" | "BLOCKED";

export interface ProfanityCheckResult {
  status: TextModerationStatus;
  reasons: string[];
  flaggedTerms: string[];
}

const BLOCKED_WORDS: readonly string[] = [
  "mierda",
  "puta",
  "puto",
  "pelotudo",
  "pelotuda",
  "boludo",
  "boluda",
  "forro",
  "forra",
  "garca",
  "estafa",
  "estafador",
  "estafadores",
  "hdp",
  "concha",
  "pija",
  "cagar",
  "cagada",
  "culiado",
  "culiada",
  "idiota",
  "imbecil",
  "tarado",
  "tarada",
  "gil",
  "choto",
  "chota",
  "verga",
  "sorongo",
  "lacra",
];

const LEET_CHAR_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "@": "a",
  "$": "s",
};

const URL_PATTERN =
  /(?:https?:\/\/|www\.|wa\.me\/|\b[a-z0-9-]+\.(?:com|net|org|ar|com\.ar|shop|store|site|xyz)\b)/i;
const EMAIL_PATTERN = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const PHONE_CANDIDATE_PATTERN = /(?:\+?\d[\d\s().-]{7,18}\d)/g;
const DATE_CANDIDATE_PATTERN = /^(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})$/;
const SPAM_PHRASE_PATTERN =
  /\b(?:visita\s+mi\s+tienda|seguime\s+en\s+ig|reventa\s+barat[ao]s?|hacemos\s+envios\s+al\s+por\s+mayor)\b/i;

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function replaceLeetspeak(value: string): string {
  return value.replace(/[01345@$]/g, (ch) => LEET_CHAR_MAP[ch] ?? ch);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTextVariants(rawText: string): string[] {
  const base = stripAccents(rawText.toLowerCase());
  const deleet = replaceLeetspeak(base);
  const collapseThreePlus = deleet.replace(/([a-z])\1{2,}/g, "$1");
  const collapseTwoPlus = deleet.replace(/([a-z])\1+/g, "$1");
  return Array.from(new Set([base, deleet, collapseThreePlus, collapseTwoPlus]));
}

function matchWordBoundaryWithOptionalPlural(variant: string, term: string): boolean {
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(term)}s?(?![a-z0-9])`, "i");
  return pattern.test(variant);
}

function hasPhoneNumber(text: string): boolean {
  const matches = text.match(PHONE_CANDIDATE_PATTERN);
  if (!matches) return false;
  return matches.some((candidate) => {
    const trimmed = candidate.trim();
    if (DATE_CANDIDATE_PATTERN.test(trimmed)) return false;
    const digitsCount = trimmed.replace(/\D/g, "").length;
    return digitsCount >= 8 && digitsCount <= 15;
  });
}

/**
 * Analiza el texto de una reseña para detectar insultos/ofensas graves (BLOCKED)
 * o señales de spam/datos de contacto/enlaces que ameritan revisión (REVIEW).
 */
export function analyzeReviewText(text: string): ProfanityCheckResult {
  const variants = buildTextVariants(text);
  const flaggedTerms: string[] = [];
  const reasons: string[] = [];

  for (const term of BLOCKED_WORDS) {
    if (variants.some((variant) => matchWordBoundaryWithOptionalPlural(variant, term))) {
      flaggedTerms.push(term);
    }
  }

  if (flaggedTerms.length > 0) {
    reasons.push("Contiene lenguaje ofensivo o no permitido.");
  }

  const baseNormalized = variants[0] ?? "";
  let needsReview = false;

  if (URL_PATTERN.test(text) || EMAIL_PATTERN.test(text)) {
    needsReview = true;
    reasons.push("Incluye enlaces externos o direcciones de correo electrónico.");
  }

  if (hasPhoneNumber(text)) {
    needsReview = true;
    reasons.push("Incluye números telefónicos o datos de contacto.");
  }

  if (SPAM_PHRASE_PATTERN.test(baseNormalized)) {
    needsReview = true;
    reasons.push("Posible contenido promocional o spam.");
  }

  if (flaggedTerms.length > 0) {
    return {
      status: "BLOCKED",
      reasons,
      flaggedTerms,
    };
  }

  if (needsReview) {
    return {
      status: "REVIEW",
      reasons,
      flaggedTerms,
    };
  }

  return {
    status: "CLEAN",
    reasons,
    flaggedTerms,
  };
}
