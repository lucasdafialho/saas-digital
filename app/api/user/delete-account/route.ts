import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-client'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 })
    }

    // Deletar perfil (cascade vai deletar subscriptions e generations)
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (deleteProfileError) {
      console.error('Erro ao deletar perfil:', deleteProfileError)
      return NextResponse.json({ error: 'Erro ao deletar perfil' }, { status: 500 })
    }

    // Deletar usuário do auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      console.error('Erro ao deletar usuário:', deleteUserError)
      return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
