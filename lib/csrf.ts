import crypto from 'crypto'

const SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex')
const TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hora

interface CSRFToken {
  token: string
  timestamp: number
}

/**
 * Gera um token CSRF válido por 1 hora
 */
export function generateCSRFToken(): string {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const data = `${randomBytes}:${timestamp}`

  const hmac = crypto.createHmac('sha256', SECRET)
  hmac.update(data)
  const signature = hmac.digest('hex')

  const token = Buffer.from(`${data}:${signature}`).toString('base64')
  return token
}

/**
 * Verifica se um token CSRF é válido
 */
export function verifyCSRFToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')

    if (parts.length !== 3) {
      return false
    }

    const [randomBytes, timestamp, signature] = parts
    const now = Date.now()
    const tokenTime = parseInt(timestamp)

    // Verificar expiração
    if (now - tokenTime > TOKEN_EXPIRY) {
      return false
    }

    // Verificar assinatura
    const data = `${randomBytes}:${timestamp}`
    const hmac = crypto.createHmac('sha256', SECRET)
    hmac.update(data)
    const expectedSignature = hmac.digest('hex')

    return signature === expectedSignature
  } catch {
    return false
  }
}

/**
 * Middleware helper para verificar CSRF em rotas
 */
export function requireCSRF(token: string | null): { valid: boolean; error?: string } {
  if (!token) {
    return { valid: false, error: 'Token CSRF ausente' }
  }

  if (!verifyCSRFToken(token)) {
    return { valid: false, error: 'Token CSRF inválido ou expirado' }
  }

  return { valid: true }
}
