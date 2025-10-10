import { NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/csrf'

/**
 * Endpoint para gerar token CSRF
 *
 * GET /api/csrf-token
 *
 * Retorna:
 * {
 *   csrfToken: "string",
 *   expiresIn: 3600
 * }
 */
export async function GET() {
  try {
    const token = generateCSRFToken()

    return NextResponse.json({
      csrfToken: token,
      expiresIn: 3600 // 1 hora
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao gerar token CSRF' },
      { status: 500 }
    )
  }
}
