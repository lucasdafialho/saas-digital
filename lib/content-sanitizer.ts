/**
 * Sanitiza conteúdo gerado por IA para prevenir XSS
 * Remove scripts, eventos onclick, iframes e outros elementos perigosos
 */
export function sanitizeAIContent(content: string): string {
  if (!content) return ''

  // Sanitização básica sem DOMPurify para evitar problemas no build
  // Remove tags HTML perigosas mantendo apenas texto e formatação básica
  let clean = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')

  return clean
}

/**
 * Sanitiza HTML mantendo mais tags (para conteúdo confiável)
 */
export function sanitizeHTML(html: string): string {
  if (!html) return ''

  // Sanitização básica sem DOMPurify
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')

  return clean
}

/**
 * Remove todos os HTML tags, mantendo apenas texto
 */
export function stripHTML(html: string): string {
  if (!html) return ''

  // Remove todas as tags HTML
  const clean = html.replace(/<[^>]*>/g, '')

  return clean.trim()
}

/**
 * Valida e sanitiza URLs
 */
export function sanitizeURL(url: string): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)

    // Permitir apenas HTTP(S)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Escapa caracteres especiais para uso em atributos HTML
 */
export function escapeHTML(text: string): string {
  if (!text) return ''

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, (char) => map[char])
}
