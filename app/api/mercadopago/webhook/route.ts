import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { MercadoPagoService } from "@/lib/mercadopago"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import secureLogger from "@/lib/logger"

// Configurar CORS para aceitar webhooks do Mercado Pago
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const webhookRateLimit = rateLimit({
  ...RATE_LIMITS.webhook.mercadopago,
  keyPrefix: 'webhook-mp'
})

// Cache para prevenir processamento duplicado (idempotência)
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
}, 5 * 60 * 1000) // A cada 5 minutos

// Handler para OPTIONS (CORS preflight)
export async function OPTIONS(request: NextRequest) {
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
  const rateLimitResult = await webhookRateLimit(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  let body: any
  let headers: any

  try {
    if (!supabaseAdmin) {
      secureLogger.error("Supabase Admin não configurado", { source: 'webhook' })
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Parse do body com tratamento de erro
    try {
      body = await request.json()
    } catch (parseError) {
      secureLogger.error("Erro ao fazer parse do JSON do webhook", {
        error: parseError instanceof Error ? parseError.message : 'Unknown error'
      })
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    headers = Object.fromEntries(request.headers.entries())
    
    // Log completo do webhook recebido para debug
    secureLogger.info("Webhook payload completo", {
      body: JSON.stringify(body),
      contentType: headers['content-type'],
      userAgent: headers['user-agent']
    })

    // Gerar chave única para idempotência
    const webhookId = `${body.type}_${body.data?.id}_${body.id}`
    
    // Verificar se já processamos este webhook
    if (processedWebhooks.has(webhookId)) {
      secureLogger.info("Webhook já processado (idempotência)", { webhookId })
      return NextResponse.json({ received: true, cached: true })
    }

    secureLogger.info("Webhook MercadoPago recebido", {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      webhookId,
      hasSignature: !!headers['x-signature'],
      hasRequestId: !!headers['x-request-id']
    })

    const mpService = new MercadoPagoService()
    
    // Validar assinatura do webhook (apenas em produção e se não for modo teste)
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isTestMode = body.live_mode === false
    const hasWebhookSecret = !!process.env.MERCADOPAGO_WEBHOOK_SECRET
    const hasSignatureHeaders = headers['x-signature'] && headers['x-request-id']
    
    // Pular validação em modo de teste ou desenvolvimento
    if (!isTestMode && hasWebhookSecret && hasSignatureHeaders) {
      let isValid = false
      try {
        isValid = mpService.validateWebhookSignature(headers, body)
      } catch (error) {
        secureLogger.security("Erro ao validar assinatura do webhook", {
          error: error instanceof Error ? error.message : 'Unknown error',
          webhookId
        })
        return NextResponse.json({ error: "Webhook validation failed" }, { status: 401 })
      }

      if (!isValid) {
        secureLogger.security("Assinatura do webhook inválida", { webhookId })
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } else {
      // Log do motivo de pular validação
      const reason = isTestMode ? 'modo teste' : !hasSignatureHeaders ? 'sem headers de assinatura' : 'desenvolvimento'
      secureLogger.info(`Webhook processado sem validação de assinatura (${reason})`, { 
        webhookId,
        isTestMode,
        isDevelopment,
        hasSignatureHeaders
      })
    }

    // Processar pagamentos do Checkout Pro (PIX, Cartão, Boleto)
    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id
      
      if (!paymentId) {
        secureLogger.warn("Webhook de pagamento sem ID", { 
          type: body.type,
          action: body.action,
          webhookId 
        })
        processedWebhooks.set(webhookId, Date.now())
        return NextResponse.json({ received: true, warning: "No payment ID" })
      }

      try {
        // Buscar informações do pagamento
        const payment = await mpService.getPayment(paymentId.toString())
        
        secureLogger.info("Pagamento recebido", {
          id: payment.id,
          status: payment.status,
          email: payment.payer?.email,
          amount: payment.transaction_amount,
          external_reference: payment.external_reference,
          payment_method: payment.payment_method_id
        })

        // Processar apenas pagamentos aprovados
        if (payment.status === "approved") {
          const userEmail = payment.payer?.email
          const externalRef = payment.external_reference
          
          // Validar formato da referência externa (deve ser "planType_userId" ou "planType_email")
          if (!externalRef || !externalRef.includes("_")) {
            secureLogger.warn("External reference inválida", { 
              externalRef,
              paymentId: payment.id 
            })
            processedWebhooks.set(webhookId, Date.now())
            return NextResponse.json({ received: true, warning: "Invalid external reference" })
          }

          const [planType, ...userIdentifierParts] = externalRef.split("_")
          const userIdentifier = userIdentifierParts.join("_") // Reconstrói caso o email tenha "_"

          // Validar tipo de plano
          if (!["starter", "pro"].includes(planType)) {
            secureLogger.warn("Tipo de plano inválido", { 
              planType,
              paymentId: payment.id 
            })
            processedWebhooks.set(webhookId, Date.now())
            return NextResponse.json({ received: true, warning: "Invalid plan type" })
          }

          secureLogger.info("Pagamento aprovado - processando upgrade", {
            email: userEmail,
            plan: planType,
            amount: payment.transaction_amount,
            paymentId: payment.id
          })

          // Buscar usuário pelo email
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, plan, email')
            .eq('email', userEmail)
            .single()

          if (profileError || !profile) {
            secureLogger.error("Usuário não encontrado para pagamento", {
              email: userEmail,
              paymentId: payment.id,
              error: profileError?.message
            })
            processedWebhooks.set(webhookId, Date.now())
            return NextResponse.json({ received: true, error: "User not found" })
          }

          // Verificar se já existe uma assinatura ativa para este plano
          const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id, plan_type, status')
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .single()

          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

          if (existingSub) {
            // Atualizar assinatura existente
            const { error: updateSubError } = await supabaseAdmin
              .from('subscriptions')
              .update({
                plan_type: planType,
                mercadopago_subscription_id: payment.id.toString(),
                updated_at: new Date().toISOString(),
                expires_at: expiresAt
              } as any)
              .eq('id', existingSub.id)

            if (updateSubError) {
              secureLogger.error("Erro ao atualizar assinatura", {
                error: updateSubError.message,
                userId: profile.id,
                subscriptionId: existingSub.id
              })
            } else {
              secureLogger.info("Assinatura atualizada", {
                userId: profile.id,
                subscriptionId: existingSub.id,
                oldPlan: existingSub.plan_type,
                newPlan: planType
              })
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
                expires_at: expiresAt
              } as any)

            if (subscriptionError) {
              secureLogger.error("Erro ao criar assinatura", {
                error: subscriptionError.message,
                userId: profile.id
              })
            } else {
              secureLogger.info("Nova assinatura criada", {
                userId: profile.id,
                plan: planType
              })
            }
          }

          // Atualizar plano do usuário no perfil
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ 
              plan: planType,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)

          if (updateError) {
            secureLogger.error("Erro ao atualizar plano do perfil", {
              error: updateError.message,
              userId: profile.id
            })
          } else {
            secureLogger.info("Plano atualizado com sucesso", {
              userId: profile.id,
              email: userEmail,
              oldPlan: profile.plan,
              newPlan: planType,
              paymentId: payment.id,
              amount: payment.transaction_amount
            })
          }
        } else {
          // Log de pagamentos não aprovados
          secureLogger.info("Pagamento não aprovado", {
            status: payment.status,
            statusDetail: payment.status_detail,
            paymentId: payment.id,
            email: payment.payer?.email
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        secureLogger.error("Erro ao processar pagamento", {
          error: errorMessage,
          paymentId,
          webhookId,
          type: body.type,
          action: body.action
        })
        
        // Se for erro de pagamento não encontrado, marcar como processado
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          secureLogger.warn("Pagamento não encontrado - marcando como processado", { paymentId, webhookId })
          processedWebhooks.set(webhookId, Date.now())
          return NextResponse.json({ received: true, warning: "Payment not found" })
        }
        
        // Outros erros: não marcar como processado para permitir retry
        return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
      }
    }

    // Processar assinaturas recorrentes
    if (body.type === "subscription_preapproval" || body.type === "subscription_authorized_payment") {
      const subscriptionId = body.data.id

      try {
        // Buscar informações da assinatura
        const subscription = await mpService.getSubscription(subscriptionId)
        
        secureLogger.info("Assinatura atualizada", {
          id: subscription.id,
          status: subscription.status,
          email: subscription.payer_email,
          action: body.action
        })

        // Atualizar status da assinatura no banco
        if (subscription.payer_email) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, plan')
            .eq('email', subscription.payer_email)
            .single()

          if (profile) {
            // Mapear status do Mercado Pago para nosso sistema
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
              } as any)
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
                } as any)
                .eq('id', profile.id)

              if (downgradeError) {
                secureLogger.error("Erro ao fazer downgrade do plano", {
                  error: downgradeError.message,
                  userId: profile.id
                })
              } else {
                secureLogger.info("Downgrade realizado", {
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
      } catch (error) {
        secureLogger.error("Erro ao processar assinatura", {
          error: error instanceof Error ? error.message : 'Unknown error',
          subscriptionId,
          webhookId
        })
        // Não marcar como processado em caso de erro
        return NextResponse.json({ error: "Subscription processing failed" }, { status: 500 })
      }
    }

    // Marcar webhook como processado (idempotência)
    processedWebhooks.set(webhookId, Date.now())

    return NextResponse.json({ received: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    secureLogger.error("Erro ao processar webhook", {
      error: errorMessage,
      stack: errorStack,
      body: body ? JSON.stringify(body) : 'no body',
      headers: headers ? JSON.stringify(headers) : 'no headers'
    })
    
    // Retornar 200 para evitar reenvios do Mercado Pago
    // O erro já foi logado para investigação
    return NextResponse.json({ 
      received: true, 
      error: errorMessage 
    }, { status: 200 })
  }
}

