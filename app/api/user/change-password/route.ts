import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validar campos obrigatórios
    if (!currentPassword) {
      return NextResponse.json({ error: 'A senha atual é obrigatória' }, { status: 400 })
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres' }, { status: 400 })
    }

    // Validar senha atual com Supabase Auth
    const supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (signInError) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    // Atualizar senha no Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Senha atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
