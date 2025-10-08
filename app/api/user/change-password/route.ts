import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { validateAndSanitizePassword } from '@/lib/sanitize'

const changePasswordRateLimit = rateLimit({
  ...RATE_LIMITS.auth.changePassword,
  keyPrefix: 'change-password',
  message: 'Muitas tentativas de alteração de senha. Tente novamente mais tarde.'
})

export async function POST(request: NextRequest) {
  const rateLimitResult = await changePasswordRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'A senha atual é obrigatória' }, { status: 400 })
    }

    const passwordValidation = validateAndSanitizePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 })
    }

    const verifyClient = await createClient()
    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (signInError) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('Erro ao atualizar senha')
      return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Senha atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao alterar senha')
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
