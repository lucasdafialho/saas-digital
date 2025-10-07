import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase Admin não configurado')
      return NextResponse.json(
        { error: "Configuração do servidor inválida" },
        { status: 500 }
      )
    }

    const apiSecret = request.headers.get('x-api-secret')
    const expectedSecret = process.env.INTERNAL_API_SECRET
    
    if (!expectedSecret) {
      console.error('INTERNAL_API_SECRET não configurado')
      return NextResponse.json(
        { error: "Configuração de segurança inválida" },
        { status: 500 }
      )
    }

    if (apiSecret !== expectedSecret) {
      console.error('Tentativa de acesso não autorizado à rota update-plan')
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, userEmail, planType, mercadopagoSubscriptionId } = body

    if ((!userId && !userEmail) || !planType) {
      return NextResponse.json(
        { error: "ID/Email do usuário e tipo de plano são obrigatórios" },
        { status: 400 }
      )
    }

    if (!["free", "starter", "pro"].includes(planType)) {
      return NextResponse.json(
        { error: "Tipo de plano inválido" },
        { status: 400 }
      )
    }

    // Buscar usuário por ID ou email
    let profile
    if (userId) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, email, plan')
        .eq('id', userId)
        .single()
      profile = data
    } else {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, email, plan')
        .eq('email', userEmail)
        .single()
      profile = data
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar plano do usuário
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        plan: planType,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', profile.id)

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError)
      return NextResponse.json(
        { error: "Erro ao atualizar plano do usuário" },
        { status: 500 }
      )
    }

    // Se for um plano pago, criar/atualizar assinatura
    if (planType !== 'free') {
      // Verificar se já existe uma assinatura ativa
      const { data: existingSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('id, user_id, plan_type, status')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .single()

      if (existingSubscription) {
        // Atualizar assinatura existente
        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_type: planType,
            mercadopago_subscription_id: mercadopagoSubscriptionId,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', existingSubscription.id)
      } else {
        // Criar nova assinatura
        await supabaseAdmin
          .from('subscriptions')
          .insert({
            user_id: profile.id,
            plan_type: planType,
            status: 'active',
            mercadopago_subscription_id: mercadopagoSubscriptionId,
            started_at: new Date().toISOString(),
            // Assinatura mensal expira em 30 dias
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          } as any)
      }
    } else {
      // Se mudou para free, cancelar assinaturas ativas
      await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        } as any)
        .eq('user_id', profile.id)
        .eq('status', 'active')
    }

    return NextResponse.json({ 
      success: true,
      userId: profile.id,
      email: profile.email,
      plan: planType
    })

  } catch (error) {
    console.error('Erro ao atualizar plano:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
