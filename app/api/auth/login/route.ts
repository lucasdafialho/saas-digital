import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeEmail } from '@/lib/sanitize'

const loginRateLimit = rateLimit({
  ...RATE_LIMITS.auth.login,
  keyPrefix: 'login',
  message: 'Muitas tentativas de login. Tente novamente mais tarde.'
})

export async function POST(request: NextRequest) {
  const rateLimitResult = await loginRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    let sanitizedEmail: string
    try {
      sanitizedEmail = sanitizeEmail(email)
    } catch {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro no login')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

