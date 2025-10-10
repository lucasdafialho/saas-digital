// Logger simplificado para funcionar no Vercel (sem winston)
// Winston usa 'fs' que não funciona no Edge Runtime

const logger = {
  log: (level: string, message: string, meta?: any) => {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      service: 'saas-digital',
      message,
      ...meta
    }

    if (process.env.NODE_ENV === 'production') {
      // Em produção, usar console.log estruturado (Vercel captura)
      console.log(JSON.stringify(logData))
    } else {
      // Em desenvolvimento, log mais legível
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta || '')
    }
  }
}

// Função para redação de dados sensíveis
function redactSensitiveData(data: any): any {
  if (!data) return data

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'api_key',
    'apiKey',
    'access_token',
    'accessToken',
    'refresh_token',
    'refreshToken',
    'authorization',
    'cookie',
    'session'
  ]

  if (typeof data === 'object') {
    const redacted = Array.isArray(data) ? [...data] : { ...data }

    for (const key in redacted) {
      const lowerKey = key.toLowerCase()

      // Redatar chaves sensíveis
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        redacted[key] = '[REDACTED]'
      }
      // Recursivamente redatar objetos aninhados
      else if (typeof redacted[key] === 'object') {
        redacted[key] = redactSensitiveData(redacted[key])
      }
    }

    return redacted
  }

  return data
}

// Wrapper seguro para logs
export const secureLogger = {
  info: (message: string, meta?: any) => {
    logger.log('info', message, meta ? redactSensitiveData(meta) : undefined)
  },

  warn: (message: string, meta?: any) => {
    logger.log('warn', message, meta ? redactSensitiveData(meta) : undefined)
  },

  error: (message: string, error?: any) => {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error

    logger.log('error', message, errorData ? redactSensitiveData(errorData) : undefined)
  },

  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.log('debug', message, meta ? redactSensitiveData(meta) : undefined)
    }
  },

  // Log específico para segurança
  security: (event: string, details?: any) => {
    logger.log('security', `[SECURITY] ${event}`, details ? redactSensitiveData(details) : undefined)
  }
}

export default secureLogger
