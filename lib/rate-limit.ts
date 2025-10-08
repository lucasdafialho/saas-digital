import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitStore>()

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
    const ip = getClientIp(request)
    const key = `${keyPrefix}:${ip}`
    const now = Date.now()

    const record = store.get(key)

    if (!record || now > record.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return null
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      
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
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
          }
        }
      )
    }

    record.count++
    store.set(key, record)

    return null
  }
}

export function rateLimitByUserId(config: RateLimitConfig & { userId: string }) {
  const {
    maxRequests,
    windowMs,
    userId,
    keyPrefix = 'rl-user',
    message = 'Limite de requisições atingido. Tente novamente mais tarde.'
  } = config

  const key = `${keyPrefix}:${userId}`
  const now = Date.now()

  const record = store.get(key)

  if (!record || now > record.resetTime) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    
    return { 
      allowed: false, 
      remaining: 0,
      retryAfter,
      message 
    }
  }

  record.count++
  store.set(key, record)

  return { 
    allowed: true, 
    remaining: maxRequests - record.count 
  }
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIp) return cfConnectingIp
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp
  
  return 'unknown'
}

setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key)
    }
  }
}, 60000)

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

