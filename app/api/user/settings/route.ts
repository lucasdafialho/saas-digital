import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserActiveSubscription } from '@/lib/subscriptions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
    }

    // Buscar assinatura ativa
    const subscription = await getUserActiveSubscription(user.id)

    // Buscar contagem de gerações do mês atual
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: generationsCount } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    return NextResponse.json({
      profile,
      subscription,
      generationsThisMonth: generationsCount || 0
    })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email } = body

    // Atualizar perfil
    const updates: any = {}
    if (name) updates.name = name
    if (email && email !== user.email) {
      // Atualizar email no auth
      const { error: emailError } = await supabase.auth.updateUser({ email })
      if (emailError) {
        return NextResponse.json({ error: 'Erro ao atualizar email' }, { status: 400 })
      }
      updates.email = email
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (updateError) {
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
