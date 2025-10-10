import { NextRequest, NextResponse } from 'next/server'
import { requireCSRF } from './csrf'
import { rateLimit, RateLimitConfig } from './rate-limit-redis'

export interface SecurityOptions {
  requireCsrf?: boolean
  rateLimit?: RateLimitConfig
}

/**
 * Valida requisição com CSRF e Rate Limiting
 * Retorna NextResponse se houver erro, null se tudo OK
 */
export async function validateRequest(
  request: NextRequest,
  options: SecurityOptions = {}
): Promise<NextResponse | null> {
  // 1. Validar CSRF para métodos que modificam dados
  if (options.requireCsrf) {
    const csrfToken = request.headers.get('x-csrf-token')
    const csrfCheck = requireCSRF(csrfToken)
    
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.error || 'Token CSRF inválido' },
        { status: 403 }
      )
    }
  }

  // 2. Aplicar rate limiting
  if (options.rateLimit) {
    const rateLimiter = rateLimit(options.rateLimit)
    const rateLimitResult = await rateLimiter(request)
    if (rateLimitResult) {
      return rateLimitResult
    }
  }

  return null // Tudo OK
}

/**
 * Helper para rotas que requerem autenticação
 */
export function getAuthHeader(request: NextRequest): string | null {
  return request.headers.get('authorization')
}

/**
 * Extrai IP do cliente considerando proxies
 */
export function getClientIp(request: NextRequest): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim()

  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  return 'unknown'
}
