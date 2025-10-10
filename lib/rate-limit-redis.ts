import Redis from 'ioredis'
import { NextRequest, NextResponse } from 'next/server'

// Inicializar Redis Cloud
let redis: Redis | null = null

try {
  const redisUrl = process.env.REDIS_STORAGE_REDIS_URL

  if (redisUrl) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    })

    redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    redis.on('connect', () => {
      console.log('✅ Redis Cloud conectado com sucesso')
    })
  } else {
    console.warn('⚠️ REDIS_STORAGE_REDIS_URL não configurado')
  }
} catch (error) {
  console.error('Erro ao inicializar Redis:', error)
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
  message?: string
}

export function rateLimit(config: RateLimitConfig) {
  const {
    maxRequests,
    windowMs,
    keyPrefix = 'rl',
    message = 'Muitas requisições. Tente novamente mais tarde.'
  } = config

  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Fallback para implementação em memória se Redis não estiver disponível
    if (!redis) {
      console.warn('⚠️ Redis não configurado - usando rate limiting em memória (não recomendado para produção)')
      const { rateLimit: memoryRateLimit } = await import('./rate-limit')
      return memoryRateLimit(config)(request)
    }

    const ip = getClientIp(request)
    const key = `${keyPrefix}:${ip}`
    const now = Date.now()

    try {
      // Incrementar contador
      const current = await redis.incr(key)

      // Definir TTL apenas na primeira requisição
      if (current === 1) {
        await redis.expire(key, Math.floor(windowMs / 1000))
      }

      // Verificar se excedeu o limite
      if (current > maxRequests) {
        const ttl = await redis.ttl(key)
        const retryAfter = ttl > 0 ? ttl : Math.ceil(windowMs / 1000)

        return NextResponse.json(
          {
            error: message,
            retryAfter
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(now + (retryAfter * 1000)).toISOString()
            }
          }
        )
      }

      return null
    } catch (error) {
      console.error('Erro no rate limiting:', error)
      // Em caso de erro no Redis, permitir a requisição (fail-open)
      return null
    }
  }
}

export async function rateLimitByUserId(config: RateLimitConfig & { userId: string }) {
  const {
    maxRequests,
    windowMs,
    userId,
    keyPrefix = 'rl-user',
    message = 'Limite de requisições atingido. Tente novamente mais tarde.'
  } = config

  // Fallback para implementação em memória se Redis não estiver disponível
  if (!redis) {
    console.warn('⚠️ Redis não configurado - usando rate limiting em memória (não recomendado para produção)')
    const { rateLimitByUserId: memoryRateLimitByUserId } = await import('./rate-limit')
    return memoryRateLimitByUserId(config)
  }

  const key = `${keyPrefix}:${userId}`
  const now = Date.now()

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, Math.floor(windowMs / 1000))
    }

    if (current > maxRequests) {
      const ttl = await redis.ttl(key)
      const retryAfter = ttl > 0 ? ttl : Math.ceil(windowMs / 1000)

      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        message
      }
    }

    return {
      allowed: true,
      remaining: maxRequests - current
    }
  } catch (error) {
    console.error('Erro no rate limiting por usuário:', error)
    // Em caso de erro, permitir a requisição
    return { allowed: true, remaining: maxRequests }
  }
}

function getClientIp(request: NextRequest): string {
  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // Vercel
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim()

  // Outros proxies
  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  return 'unknown'
}

export const RATE_LIMITS = {
  auth: {
    login: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
    register: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
    changePassword: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  },
  api: {
    generation: { maxRequests: 10, windowMs: 60 * 1000 },
    profile: { maxRequests: 30, windowMs: 60 * 1000 },
    general: { maxRequests: 100, windowMs: 60 * 1000 },
  },
  webhook: {
    mercadopago: { maxRequests: 100, windowMs: 60 * 1000 },
  }
}

// Função para verificar saúde do Redis
export async function checkRedisHealth(): Promise<boolean> {
  if (!redis) return false

  try {
    await redis.ping()
    return true
  } catch {
    return false
  }
}
