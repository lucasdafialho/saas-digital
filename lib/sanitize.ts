export interface SanitizeOptions {
  maxLength?: number
  allowHtml?: boolean
  allowUrls?: boolean
  stripScripts?: boolean
}

export function sanitizeInput(
  input: string,
  options: SanitizeOptions = {}
): string {
  const {
    maxLength = 1000,
    allowHtml = false,
    allowUrls = true,
    stripScripts = true
  } = options

  if (typeof input !== 'string') {
    return ''
  }

  let sanitized = input.slice(0, maxLength)

  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')

  if (!allowHtml) {
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  if (stripScripts) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    sanitized = sanitized.replace(/javascript:/gi, '')
    sanitized = sanitized.replace(/data:text\/html/gi, '')
  }

  sanitized = sanitized.replace(/(?:ignore|disregard)\s+all\s+previous[^\n]*/gi, '')
  sanitized = sanitized.replace(/reveal|show\s+(?:the\s+)?(?:system|developer)\s+(?:prompt|message)/gi, '')
  sanitized = sanitized.replace(/jailbreak|ignore\s+instructions|do\s+anything\s+now/gi, '')

  sanitized = sanitized.replace(/[<>`{}\[\]\\]/g, ' ')

  return sanitized.trim()
}

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  
  const sanitized = email.trim().toLowerCase().slice(0, 254)
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Email inválido')
  }
  
  return sanitized
}

export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return ''
  
  const sanitized = url.trim().slice(0, 2048)
  
  if (sanitized.match(/^(javascript|data|vbscript|file|about):/i)) {
    throw new Error('URL inválida')
  }
  
  try {
    const parsed = new URL(sanitized)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Protocolo não permitido')
    }
    return parsed.toString()
  } catch {
    throw new Error('URL malformada')
  }
}

export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, SanitizeOptions>
): T {
  const sanitized = {} as T
  
  for (const key in schema) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value, schema[key]) as T[typeof key]
      } else if (typeof value === 'number') {
        sanitized[key] = value as T[typeof key]
      } else if (typeof value === 'boolean') {
        sanitized[key] = value as T[typeof key]
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeInput(item, schema[key]) : item
        ) as T[typeof key]
      } else {
        sanitized[key] = value
      }
    }
  }
  
  return sanitized
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

export function unescapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
  }
  
  return text.replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, (entity) => map[entity] || entity)
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return ''
  
  let sanitized = filename.trim().slice(0, 255)
  
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
  
  sanitized = sanitized.replace(/^\.+/, '')
  
  const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  if (reserved.includes(sanitized.toUpperCase())) {
    sanitized = `_${sanitized}`
  }
  
  return sanitized || 'unnamed'
}

export function validateAndSanitizePassword(password: string): { valid: boolean; error?: string; sanitized?: string } {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Senha deve ser uma string' }
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Senha deve ter no mínimo 8 caracteres' }
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Senha muito longa (máximo 128 caracteres)' }
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra minúscula' }
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos uma letra maiúscula' }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, error: 'Senha deve conter pelo menos um número' }
  }
  
  return { valid: true, sanitized: password }
}

