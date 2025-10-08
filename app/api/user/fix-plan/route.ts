import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuração inválida' }, { status: 500 })
    }

    // Buscar perfil atual
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    // Verificar se tem assinatura ativa
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    let correctPlan = 'free'

    if (subscriptions && subscriptions.length > 0) {
      const activeSubscription = subscriptions[0] as any
      correctPlan = activeSubscription.plan_type
    }

    // Atualizar plano se estiver incorreto
    if (profile && (profile as any).plan !== correctPlan) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ plan: correctPlan })
        .eq('id', user.id)

      if (updateError) {
        return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true,
        message: `Plano corrigido de ${(profile as any).plan} para ${correctPlan}`,
        oldPlan: (profile as any).plan,
        newPlan: correctPlan
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Plano já está correto',
      currentPlan: correctPlan
    })
  } catch (error) {
    console.error('Erro ao corrigir plano:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
