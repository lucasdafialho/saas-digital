import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { MercadoPagoService } from "@/lib/mercadopago"
import secureLogger from "@/lib/logger"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Cache simples para evitar processamento duplicado
const processedWebhooks = new Set<string>()

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-signature, x-request-id',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Parse do body
    const body = await request.json()
    
    // Log básico
    secureLogger.info("Webhook MercadoPago recebido", {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      liveMode: body.live_mode,
      userId: body.user_id
    })

    // Gerar ID único
    const webhookId = `${body.type}_${body.data?.id}_${body.id}`

    // Verificar se já foi processado
    if (processedWebhooks.has(webhookId)) {
      secureLogger.info("Webhook já processado", { webhookId })
      return NextResponse.json({ received: true, cached: true })
    }

    // Processar apenas webhooks de pagamento
    if (body.type === "payment" && body.action === "payment.updated") {
      const paymentId = body.data?.id

      if (!paymentId) {
        secureLogger.warn("Webhook sem payment ID", { body })
        processedWebhooks.add(webhookId)
        return NextResponse.json({ received: true })
      }

      try {
        // Buscar detalhes do pagamento
        const mpService = new MercadoPagoService()
        const payment = await mpService.getPayment(paymentId.toString())

        secureLogger.info("Pagamento obtido", {
          id: payment.id,
          status: payment.status,
          email: payment.payer?.email,
          amount: payment.transaction_amount,
          externalReference: payment.external_reference
        })

        // Processar apenas pagamentos aprovados
        if (payment.status === "approved") {
          const userEmail = payment.payer?.email
          const externalRef = payment.external_reference

          if (!userEmail || !externalRef) {
            secureLogger.warn("Dados insuficientes no pagamento", {
              hasEmail: !!userEmail,
              hasExternalRef: !!externalRef,
              paymentId
            })
            processedWebhooks.add(webhookId)
            return NextResponse.json({ received: true })
          }

          // Extrair tipo de plano da referência
          const [planType, ...userIdParts] = externalRef.split("_")
          const userIdentifier = userIdParts.join("_")

          if (!["starter", "pro"].includes(planType)) {
            secureLogger.warn("Tipo de plano inválido", {
              planType,
              externalRef,
              paymentId
            })
            processedWebhooks.add(webhookId)
            return NextResponse.json({ received: true })
          }

          secureLogger.info("Processando upgrade de plano", {
            email: userEmail,
            plan: planType,
            amount: payment.transaction_amount,
            paymentId
          })

          // Buscar usuário
          if (!supabaseAdmin) {
            secureLogger.error("Supabase Admin não configurado")
            processedWebhooks.add(webhookId)
            return NextResponse.json({ received: true })
          }

          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, plan, email')
            .eq('email', userEmail)
            .single()

          if (profileError || !profile) {
            secureLogger.error("Usuário não encontrado", {
              email: userEmail,
              error: profileError?.message
            })
            processedWebhooks.add(webhookId)
            return NextResponse.json({ received: true })
          }

          // Calcular data de expiração (30 dias)
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

          // Verificar assinatura existente
          const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id, plan_type, status')
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
                expires_at: expiresAt
              })
              .eq('id', existingSub.id)

            if (updateSubError) {
              secureLogger.error("Erro ao atualizar subscription", {
                error: updateSubError.message,
                subscriptionId: existingSub.id
              })
            } else {
              secureLogger.info("Subscription atualizada com sucesso", {
                subscriptionId: existingSub.id,
                plan: planType
              })
            }
          } else {
            // Criar nova assinatura
            const { error: createSubError } = await supabaseAdmin
              .from('subscriptions')
              .insert({
                user_id: profile.id,
                plan_type: planType,
                status: 'active',
                mercadopago_subscription_id: payment.id.toString(),
                started_at: new Date().toISOString(),
                expires_at: expiresAt
              })

            if (createSubError) {
              secureLogger.error("Erro ao criar subscription", {
                error: createSubError.message,
                userId: profile.id
              })
            } else {
              secureLogger.info("Nova subscription criada com sucesso", {
                userId: profile.id,
                plan: planType
              })
            }
          }

          // Atualizar plano no perfil do usuário
          const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({
              plan: planType,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)

          if (updateProfileError) {
            secureLogger.error("Erro ao atualizar perfil", {
              error: updateProfileError.message,
              userId: profile.id
            })
          } else {
            secureLogger.info("Plano atualizado com sucesso", {
              userId: profile.id,
              email: userEmail,
              oldPlan: profile.plan,
              newPlan: planType,
              paymentId: payment.id
            })
          }
        } else {
          secureLogger.info("Pagamento com status não aprovado", {
            status: payment.status,
            statusDetail: payment.status_detail,
            paymentId: payment.id
          })
        }
      } catch (paymentError) {
        secureLogger.error("Erro ao processar pagamento", {
          error: paymentError instanceof Error ? paymentError.message : 'Unknown',
          paymentId,
          webhookId
        })
        // Marcar como processado mesmo com erro para evitar loops
        processedWebhooks.add(webhookId)
        return NextResponse.json({ received: true })
      }
    }

    // Marcar webhook como processado
    processedWebhooks.add(webhookId)

    // Retornar sucesso
    return NextResponse.json({ received: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    secureLogger.error("Erro geral ao processar webhook", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // Retornar sucesso para evitar retries
    return NextResponse.json({
      received: true,
      error: "Processing error but webhook received"
    }, { status: 200 })
  }
}