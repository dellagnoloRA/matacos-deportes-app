/**
 * Sanitizador HTML liviano y determinístico para descripciones enriquecidas (SSR + Client).
 * Elimina etiquetas ejecutables/peligrosas, atributos `on*` y esquemas `javascript:`/`data:`.
 */
export function sanitizeRichHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  return rawHtml
    // Eliminar bloques completos de script, style, iframe, object, embed, form
    .replace(/<(script|style|iframe|object|embed|applet|form|meta|link|base)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|applet|form|meta|link|base)\b[^>]*\/?>/gi, "")
    // Eliminar atributos de eventos inline (onclick, onerror, onload, etc.)
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Neutralizar URLs javascript: o vbscript: o data:text/html en href/src
    .replace(/(href|src)\s*=\s*(["'])\s*(?:javascript|vbscript|data\s*:\s*text\/html):[\s\S]*?\2/gi, '$1=$2#$2')
    .replace(/(href|src)\s*=\s*(?:javascript|vbscript):[^\s>]*/gi, '$1="#"');
}
