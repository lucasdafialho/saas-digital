import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserActiveSubscription, cancelSubscription } from '@/lib/subscriptions'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar assinatura ativa
    const subscription = await getUserActiveSubscription(user.id)

    if (!subscription) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada' }, { status: 404 })
    }

    // Cancelar assinatura
    await cancelSubscription(subscription.id)

    // Atualizar plano do usuário para free
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ plan: 'free' })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
