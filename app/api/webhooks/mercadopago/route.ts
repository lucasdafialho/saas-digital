import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // MercadoPago envia notificações de diferentes tipos
    const { type, data } = body

    // Processar notificações de pagamento
    if (type === 'payment') {
      const paymentId = data.id
      
      // Aqui você pode buscar detalhes do pagamento na API do MercadoPago
      // e atualizar o status da assinatura conforme necessário
      
      console.log('Pagamento recebido:', paymentId)
    }

    // Processar notificações de assinatura
    if (type === 'subscription') {
      const subscriptionId = data.id
      
      // Buscar assinatura no banco
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('mercadopago_subscription_id', subscriptionId)
        .single()

      if (subscription) {
        // Atualizar status conforme a notificação do MercadoPago
        // Você precisará consultar a API do MercadoPago para obter o status atual
        console.log('Assinatura atualizada:', subscriptionId)
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    )
  }
}
