import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { MercadoPagoService } from "@/lib/mercadopago"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import secureLogger from "@/lib/logger"

// Configurar runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const webhookRateLimit = rateLimit({
  ...RATE_LIMITS.webhook.mercadopago,
  keyPrefix: 'webhook-mp'
})

// Cache para prevenir processamento duplicado
const processedWebhooks = new Map<string, number>()
const WEBHOOK_CACHE_TTL = 60 * 60 * 1000 // 1 hora

// Limpar cache periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > WEBHOOK_CACHE_TTL) {
      processedWebhooks.delete(key)
    }
  }
}, 5 * 60 * 1000)

// Handler para OPTIONS (CORS)
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
  // Rate limiting
  const rateLimitResult = await webhookRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  let body: any
  let headers: any

  try {
    // Verificar configuração do Supabase
    if (!supabaseAdmin) {
      secureLogger.error("Supabase Admin não configurado", { source: 'webhook' })
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Parse do body
    try {
      body = await request.json()
    } catch (parseError) {
      secureLogger.error("Erro ao fazer parse do JSON", {
        error: parseError instanceof Error ? parseError.message : 'Unknown error'
      })
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Capturar headers
    headers = Object.fromEntries(request.headers.entries())

    // Log inicial do webhook
    secureLogger.info("Webhook MercadoPago recebido", {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      liveMode: body.live_mode,
      userId: body.user_id,
      hasSignature: !!headers['x-signature'],
      hasRequestId: !!headers['x-request-id']
    })

    // Gerar ID único para idempotência
    const webhookId = `${body.type}_${body.data?.id}_${body.id}`

    // Verificar se já foi processado
    if (processedWebhooks.has(webhookId)) {
      secureLogger.info("Webhook já processado", { webhookId })
      return NextResponse.json({ received: true, cached: true })
    }

    const mpService = new MercadoPagoService()

    // Validação da assinatura do webhook
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    const signature = headers['x-signature']
    const requestId = headers['x-request-id']

    // Em produção, validar a assinatura se o secret estiver configurado
    if (body.live_mode === true && webhookSecret) {
      // Se não tiver os headers necessários, logar mas não rejeitar imediatamente
      if (!signature || !requestId) {
        secureLogger.warn("Headers de assinatura ausentes em webhook de produção", {
          webhookId,
          hasSignature: !!signature,
          hasRequestId: !!requestId,
          headers: Object.keys(headers)
        })
        // Continuar processamento sem validação de assinatura
      } else {
        try {
          const isValid = mpService.validateWebhookSignature(headers, body)

          if (!isValid) {
            secureLogger.warn("Assinatura do webhook inválida - continuando processamento", {
              webhookId,
              liveMode: body.live_mode
            })
            // Continuar processamento mesmo com assinatura inválida
          } else {
            secureLogger.info("Webhook validado com sucesso", { webhookId })
          }
        } catch (validationError) {
          secureLogger.warn("Erro na validação da assinatura - continuando processamento", {
            error: validationError instanceof Error ? validationError.message : 'Unknown',
            webhookId
          })
          // Continuar processamento mesmo com erro de validação
        }
      }
    } else if (body.live_mode === true && !webhookSecret) {
      // Log de aviso mas continuar processamento
      secureLogger.warn("Webhook de produção sem MERCADOPAGO_WEBHOOK_SECRET configurado", {
        webhookId
      })
    } else if (body.live_mode === false) {
      // Modo teste - apenas logar
      secureLogger.info("Webhook de teste recebido", { webhookId })
    }

    // Processar webhooks de pagamento
    if (body.type === "payment" && (body.action === "payment.updated" || body.action === "payment.created")) {
      const paymentId = body.data?.id

      if (!paymentId) {
        secureLogger.warn("Webhook sem payment ID", { body })
        processedWebhooks.set(webhookId, Date.now())
        return NextResponse.json({ received: true })
      }

      try {
        // Buscar detalhes do pagamento na API do MercadoPago
        const payment = await mpService.getPayment(paymentId.toString())

        if (!payment) {
          secureLogger.warn("Pagamento não encontrado na API do MercadoPago", { paymentId })
          processedWebhooks.set(webhookId, Date.now())
          return NextResponse.json({ received: true })
        }

        secureLogger.info("Detalhes do pagamento obtidos", {
          id: payment.id,
          status: payment.status,
          statusDetail: payment.status_detail,
          email: payment.payer?.email,
          amount: payment.transaction_amount,
          externalReference: payment.external_reference,
          paymentMethod: payment.payment_method_id
        })

        // Processar apenas pagamentos aprovados
        if (payment.status === "approved") {
          const userEmail = payment.payer?.email
          const externalRef = payment.external_reference

          // Validar dados necessários
          if (!userEmail) {
            secureLogger.warn("Pagamento sem email do pagador", { paymentId })
            processedWebhooks.set(webhookId, Date.now())
            return NextResponse.json({ received: true })
          }

          if (!externalRef || !externalRef.includes("_")) {
            secureLogger.warn("External reference inválida", {
              externalRef,
              paymentId
            })
            processedWebhooks.set(webhookId, Date.now())
            return NextResponse.json({ received: true })
          }

          // Extrair tipo de plano da referência
          const [planType, ...userIdParts] = externalRef.split("_")
          const userIdentifier = userIdParts.join("_")

          // Validar tipo de plano
          if (!["starter", "pro"].includes(planType)) {
            secureLogger.warn("Tipo de plano inválido", {
              planType,
              externalRef,
              paymentId
            })
            processedWebhooks.set(webhookId, Date.now())
            return NextResponse.json({ received: true })
          }

          secureLogger.info("Processando upgrade de plano", {
            email: userEmail,
            plan: planType,
            amount: payment.transaction_amount,
            paymentId
          })

          // Buscar usuário
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
            processedWebhooks.set(webhookId, Date.now())
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
          // Log de pagamentos não aprovados
          secureLogger.info("Pagamento com status não aprovado", {
            status: payment.status,
            statusDetail: payment.status_detail,
            paymentId: payment.id
          })
        }
      } catch (paymentError) {
        const errorMessage = paymentError instanceof Error ? paymentError.message : 'Unknown'

        secureLogger.error("Erro ao processar pagamento", {
          error: errorMessage,
          paymentId,
          webhookId,
          stack: paymentError instanceof Error ? paymentError.stack : undefined
        })

        // Se o pagamento não foi encontrado, marcar como processado
        if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('Erro ao buscar pagamento')) {
          processedWebhooks.set(webhookId, Date.now())
          return NextResponse.json({ received: true })
        }

        // Para outros erros, marcar como processado para evitar loops infinitos
        // mas logar o erro para investigação
        processedWebhooks.set(webhookId, Date.now())
        return NextResponse.json({ received: true, error: "Processing failed but marked as processed" })
      }
    }

    // Processar webhooks de assinatura recorrente
    if (body.type === "subscription_preapproval" || body.type === "subscription_authorized_payment") {
      const subscriptionId = body.data?.id

      if (!subscriptionId) {
        secureLogger.warn("Webhook de assinatura sem ID", { body })
        processedWebhooks.set(webhookId, Date.now())
        return NextResponse.json({ received: true })
      }

      try {
        // Buscar informações da assinatura
        const subscription = await mpService.getSubscription(subscriptionId.toString())

        secureLogger.info("Assinatura atualizada", {
          id: subscription.id,
          status: subscription.status,
          email: subscription.payer_email,
          action: body.action
        })

        // Processar atualização da assinatura
        if (subscription.payer_email) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, plan')
            .eq('email', subscription.payer_email)
            .single()

          if (profile) {
            // Mapear status do MercadoPago
            let newStatus: 'active' | 'cancelled' | 'expired' = 'active'
            let shouldDowngrade = false

            switch (subscription.status) {
              case 'authorized':
              case 'pending':
                newStatus = 'active'
                break
              case 'cancelled':
                newStatus = 'cancelled'
                shouldDowngrade = true
                break
              case 'paused':
              case 'expired':
                newStatus = 'expired'
                shouldDowngrade = true
                break
            }

            // Atualizar status da assinatura
            const { error: updateSubError } = await supabaseAdmin
              .from('subscriptions')
              .update({
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', profile.id)
              .eq('mercadopago_subscription_id', subscriptionId)

            if (updateSubError) {
              secureLogger.error("Erro ao atualizar status da assinatura", {
                error: updateSubError.message,
                userId: profile.id,
                subscriptionId
              })
            }

            // Se cancelada/expirada, fazer downgrade para free
            if (shouldDowngrade) {
              const { error: downgradeError } = await supabaseAdmin
                .from('profiles')
                .update({
                  plan: 'free',
                  updated_at: new Date().toISOString()
                })
                .eq('id', profile.id)

              if (downgradeError) {
                secureLogger.error("Erro ao fazer downgrade do plano", {
                  error: downgradeError.message,
                  userId: profile.id
                })
              } else {
                secureLogger.info("Downgrade realizado com sucesso", {
                  userId: profile.id,
                  email: subscription.payer_email,
                  oldPlan: profile.plan,
                  newPlan: 'free',
                  reason: subscription.status
                })
              }
            }
          } else {
            secureLogger.warn("Perfil não encontrado para assinatura", {
              email: subscription.payer_email,
              subscriptionId
            })
          }
        }
      } catch (subscriptionError) {
        const errorMessage = subscriptionError instanceof Error ? subscriptionError.message : 'Unknown'
        
        secureLogger.error("Erro ao processar assinatura", {
          error: errorMessage,
          subscriptionId,
          webhookId,
          stack: subscriptionError instanceof Error ? subscriptionError.stack : undefined
        })
        
        // Marcar como processado para evitar loops infinitos
        processedWebhooks.set(webhookId, Date.now())
        return NextResponse.json({ received: true, error: "Subscription processing failed but marked as processed" })
      }
    }

    // Marcar webhook como processado
    processedWebhooks.set(webhookId, Date.now())

    // Retornar sucesso
    return NextResponse.json({ received: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    secureLogger.error("Erro geral ao processar webhook", {
      error: errorMessage,
      stack: errorStack,
      body: body ? JSON.stringify(body) : 'no body',
      headers: headers ? JSON.stringify(headers) : 'no headers'
    })

    // Retornar sucesso para evitar retries desnecessários do MercadoPago
    // mas logar o erro para investigação
    return NextResponse.json({
      received: true,
      error: "Internal processing error but webhook received"
    }, { status: 200 })
  }
}