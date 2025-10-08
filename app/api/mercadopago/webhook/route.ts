import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { MercadoPagoService } from "@/lib/mercadopago"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

const webhookRateLimit = rateLimit({
  ...RATE_LIMITS.webhook.mercadopago,
  keyPrefix: 'webhook-mp'
})

export async function POST(request: NextRequest) {
  const rateLimitResult = await webhookRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    if (!supabaseAdmin) {
      console.error("❌ Supabase Admin não configurado")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())

    console.log("🔔 Webhook MercadoPago recebido")

    const mpService = new MercadoPagoService()
    const isValid = mpService.validateWebhookSignature(headers, body)

    if (!isValid) {
      console.error("⚠️ Assinatura do webhook inválida")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Processar pagamentos do Checkout Pro (PIX, Cartão, Boleto)
    if (body.type === "payment") {
      const paymentId = body.data.id
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

      // Buscar informações do pagamento
      const payment = await mpService.getPayment(paymentId)
      
      console.log(" Pagamento recebido:", {
        id: payment.id,
        status: payment.status,
        email: payment.payer?.email,
        amount: payment.transaction_amount,
        external_reference: payment.external_reference,
      })

      // Se o pagamento foi aprovado
      if (payment.status === "approved") {
        const userEmail = payment.payer?.email
        const externalRef = payment.external_reference // Ex: "starter_user123" ou "pro_user123"
        const planType = externalRef?.split("_")[0] // "starter" ou "pro"

        console.log("✅ Pagamento aprovado:", {
          email: userEmail,
          plan: planType,
          amount: payment.transaction_amount,
        })

        // Atualizar o plano do usuário no Supabase
        if (userEmail && planType && ["starter", "pro"].includes(planType)) {
          try {
            // Buscar usuário pelo email
            const { data: profile, error: profileError } = await supabaseAdmin
              .from('profiles')
              .select('id, plan')
              .eq('email', userEmail)
              .single()

            if (profileError || !profile) {
              console.error("❌ Usuário não encontrado:", userEmail)
              return NextResponse.json({ received: true })
            }

            // Atualizar plano do usuário
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({ 
                plan: planType,
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.id)

            if (updateError) {
              console.error("❌ Erro ao atualizar plano:", updateError)
              return NextResponse.json({ received: true })
            }

            // Verificar se já existe uma assinatura ativa
            const { data: existingSub } = await supabaseAdmin
              .from('subscriptions')
              .select('id')
              .eq('user_id', profile.id)
              .eq('status', 'active')
              .single()

            if (existingSub) {
              // Atualizar assinatura existente
              const { error: updateSubError } = await supabaseAdmin
                .from('subscriptions')
                .update({
                  plan_type: planType,
                  mercadopago_subscription_id: payment.id.toString(),
                  updated_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                } as any)
                .eq('id', existingSub.id)

              if (updateSubError) {
                console.error("⚠️ Erro ao atualizar assinatura:", updateSubError)
              }
            } else {
              // Criar nova assinatura
              const { error: subscriptionError } = await supabaseAdmin
                .from('subscriptions')
                .insert({
                  user_id: profile.id,
                  plan_type: planType,
                  status: 'active',
                  mercadopago_subscription_id: payment.id.toString(),
                  started_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                } as any)

              if (subscriptionError) {
                console.error("⚠️ Erro ao criar assinatura:", subscriptionError)
              }
            }

            console.log("🎉 Plano atualizado com sucesso:", {
              userId: profile.id,
              email: userEmail,
              plan: planType
            })
            
          } catch (error) {
            console.error("❌ Erro ao processar atualização:", error)
          }
        }
      }
    }

    // Processar assinaturas recorrentes
    if (body.type === "subscription_preapproval") {
      const subscriptionId = body.data.id
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

      // Buscar informações da assinatura
      const subscriptionResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (subscriptionResponse.ok) {
        const subscription = await subscriptionResponse.json()
        
        console.log("🔄 Assinatura atualizada:", {
          id: subscription.id,
          status: subscription.status,
          email: subscription.payer_email,
        })

        // Atualizar status da assinatura no banco
        if (subscription.payer_email) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', subscription.payer_email)
            .single()

          if (profile) {
            // Atualizar status da assinatura
            await supabaseAdmin
              .from('subscriptions')
              .update({
                status: subscription.status === 'authorized' ? 'active' : 
                        subscription.status === 'cancelled' ? 'cancelled' : 'expired',
                updated_at: new Date().toISOString()
              } as any)
              .eq('user_id', profile.id)
              .eq('mercadopago_subscription_id', subscriptionId)

            // Se cancelada, downgrade para free
            if (subscription.status === 'cancelled') {
              await supabaseAdmin
                .from('profiles')
                .update({ plan: 'free' } as any)
                .eq('id', profile.id)
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error)
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }
}

