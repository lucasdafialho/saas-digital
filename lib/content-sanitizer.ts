import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitiza conteúdo gerado por IA para prevenir XSS
 * Remove scripts, eventos onclick, iframes e outros elementos perigosos
 */
export function sanitizeAIContent(content: string): string {
  if (!content) return ''

  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })

  return clean
}

/**
 * Sanitiza HTML mantendo mais tags (para conteúdo confiável)
 */
export function sanitizeHTML(html: string): string {
  if (!html) return ''

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'a', 'img', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true
  })

  return clean
}

/**
 * Remove todos os HTML tags, mantendo apenas texto
 */
export function stripHTML(html: string): string {
  if (!html) return ''

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  })

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
