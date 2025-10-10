import winston from 'winston'

// Configuração do logger seguro
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'saas-digital' },
  transports: [
    // Logs de erro em arquivo (em produção)
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ] : []),

    // Console para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

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
    logger.info(message, meta ? redactSensitiveData(meta) : undefined)
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, meta ? redactSensitiveData(meta) : undefined)
  },

  error: (message: string, error?: any) => {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error

    logger.error(message, errorData ? redactSensitiveData(errorData) : undefined)
  },

  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(message, meta ? redactSensitiveData(meta) : undefined)
    }
  },

  // Log específico para segurança
  security: (event: string, details?: any) => {
    logger.warn(`[SECURITY] ${event}`, details ? redactSensitiveData(details) : undefined)
  }
}

export default secureLogger
