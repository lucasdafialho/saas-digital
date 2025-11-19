import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { MercadoPagoService } from "@/lib/mercadopago"
import secureLogger from "@/lib/logger"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  let webhookId = ''

  try {
    // Parse resiliente do corpo (alguns envios vêm com content-type incorreto)
    let body: any
    const contentType = request.headers.get('content-type') || ''
    try {
      if (contentType.includes('application/json')) {
        body = await request.json()
      } else {
        const text = await request.text()
        body = text ? JSON.parse(text) : {}
      }
    } catch {
      body = {}
    }

    // Log detalhado do webhook recebido
    secureLogger.info("🔔 Webhook MercadoPago recebido", {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      liveMode: body.live_mode,
      userId: body.user_id,
      webhookId: body.id,
      dateCreated: body.date_created
    })

    // Validar estrutura básica do webhook
    if (!body.type || !body.data?.id) {
      secureLogger.warn("⚠️ Webhook com estrutura inválida", { body })
      return NextResponse.json({
        error: "Invalid webhook structure"
      }, { status: 400 })
    }

    // Verificar conexão com Supabase PRIMEIRO
    if (!supabaseAdmin) {
      secureLogger.error("❌ Supabase Admin não configurado")
      return NextResponse.json({
        error: "Database connection error"
      }, { status: 500 })
    }

    // VALIDAR ASSINATURA DO WEBHOOK
    let mpService: MercadoPagoService
    try {
      mpService = new MercadoPagoService()
    } catch (error) {
      secureLogger.error("❌ Erro ao inicializar MercadoPagoService", {
        error: error instanceof Error ? error.message : 'Unknown',
        hasAccessToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN
      })
      return NextResponse.json({
        error: "Service configuration error"
      }, { status: 500 })
    }

    const headers = {
      'x-signature': request.headers.get('x-signature') || request.headers.get('X-Signature') || undefined,
      'x-request-id': request.headers.get('x-request-id') || request.headers.get('X-Request-Id') || undefined,
    }

    // Log detalhado dos headers recebidos (incluindo valores parciais)
    secureLogger.info('🔍 Headers recebidos do webhook', {
      hasXSignature: !!headers['x-signature'],
      hasXRequestId: !!headers['x-request-id'],
      signaturePreview: headers['x-signature'] ? headers['x-signature'].substring(0, 30) + '...' : 'NOT_SET',
      requestId: headers['x-request-id'],
      allHeaderKeys: Array.from(request.headers.keys()),
      secretConfigured: !!process.env.MERCADOPAGO_WEBHOOK_SECRET
    })

    const isValid = mpService.validateWebhookSignature(headers, body)

    if (!isValid) {
      secureLogger.security('🚫 Webhook rejeitado - assinatura inválida', {
        dataId: body.data?.id,
        type: body.type,
        hasSecret: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL
      })
      return NextResponse.json({
        error: "Invalid signature"
      }, { status: 401 })
    }

    secureLogger.info('✅ Webhook validado com sucesso!')

    // Gerar um identificador consistente e sempre presente
    // Preferência: body.id (id do evento) -> fallback para combinação (type:data.id:ts)
    const tsHeader = (headers['x-signature'] || '').split(',').find((p: string) => p.trim().startsWith('ts='))
    const ts = tsHeader ? tsHeader.split('=')[1] : ''
    webhookId = body.id ? `mp_${body.id}` : `mp_${body.type}_${body.data.id}_${ts}`

    // Verificar se já foi processado (no banco de dados)
    const { data: existingWebhook } = await supabaseAdmin
      .from('webhook_events')
      .select('id, processed_at, status')
      .eq('webhook_id', webhookId)
      .maybeSingle()

    if (existingWebhook) {
      secureLogger.info("✅ Webhook já processado anteriormente", {
        webhookId,
        processedAt: existingWebhook.processed_at,
        status: existingWebhook.status
      })
      return NextResponse.json({
        received: true,
        status: "already_processed",
        previousStatus: existingWebhook.status
      })
    }

    // Registrar webhook no banco (marca como em processamento)
    // Usar INSERT para evitar race condition - se já existe, capturar erro
    const { error: insertError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        webhook_id: webhookId,
        event_type: body.type,
        payment_id: body.data.id,
        status: 'processing',
        raw_data: body
      })
      .select()
      .maybeSingle()

    // Se falhou ao inserir por duplicação, significa que outro processo já está processando
    if (insertError) {
      if (insertError.code === '23505') {
        secureLogger.info("⚠️ Webhook já em processamento por outra instância", {
          webhookId,
          errorCode: insertError.code
        })
        return NextResponse.json({
          received: true,
          status: "already_processing"
        })
      }

      // Outro tipo de erro de banco de dados
      secureLogger.error("❌ Erro ao registrar webhook no banco", {
        error: insertError.message,
        code: insertError.code,
        webhookId
      })
      return NextResponse.json({
        error: "Database error",
        details: insertError.message
      }, { status: 500 })
    }

    secureLogger.info("✅ Webhook registrado no banco", {
      webhookId,
      status: 'processing'
    })

    // Processar webhooks de pagamento
    if (body.type === "payment") {
      const paymentId = body.data.id

      secureLogger.info("💰 Processando pagamento", {
        paymentId,
        action: body.action
      })

      try {
        // Buscar detalhes completos do pagamento (reutilizando mpService já criado)
        secureLogger.info("🔍 Buscando detalhes do pagamento na API do MercadoPago", {
          paymentId: paymentId.toString()
        })

        let payment
        try {
          payment = await mpService.getPayment(paymentId.toString())
        } catch (paymentFetchError) {
          secureLogger.error("❌ Erro ao buscar pagamento na API do MercadoPago", {
            error: paymentFetchError instanceof Error ? paymentFetchError.message : 'Unknown',
            paymentId: paymentId.toString()
          })

          // Marcar webhook como failed
          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'failed' })
            .eq('webhook_id', webhookId)

          // Retornar 500 para o MercadoPago tentar novamente
          return NextResponse.json({
            error: "Failed to fetch payment details",
            details: paymentFetchError instanceof Error ? paymentFetchError.message : 'Unknown'
          }, { status: 500 })
        }

        secureLogger.info("📋 Detalhes do pagamento obtidos", {
          id: payment.id,
          status: payment.status,
          statusDetail: payment.status_detail,
          email: payment.payer?.email,
          amount: payment.transaction_amount,
          externalReference: payment.external_reference,
          dateApproved: payment.date_approved,
          paymentMethod: payment.payment_method_id
        })

        // Validar email primeiro (necessário para todos os estados)
        const userEmail = payment.payer?.email
        if (!userEmail) {
          secureLogger.error("❌ Email do pagador não encontrado", {
            paymentId,
            payer: payment.payer
          })

          // Marcar webhook como failed
          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'failed' })
            .eq('webhook_id', webhookId)

          return NextResponse.json({
            error: "Missing payer email"
          }, { status: 400 })
        }

        // PROCESSAR ESTADOS DO PAGAMENTO
        // 1. APROVADO - Ativar plano
        if (payment.status === "approved") {
          const externalRef = payment.external_reference

          // Identificar plano: prioridade metadata > external_reference > valor
          let planType = "starter" // Default

          // 1. Verificar metadata primeiro (mais confiável)
          if (payment.metadata?.plan_type) {
            planType = payment.metadata.plan_type
            secureLogger.info("✅ Plano identificado via metadata", {
              planType,
              metadata: payment.metadata
            })
          }
          // 2. Tentar external_reference
          else if (externalRef) {
            const [extractedPlan] = externalRef.split("_")
            if (["starter", "pro"].includes(extractedPlan)) {
              planType = extractedPlan
              secureLogger.info("✅ Plano identificado via external_reference", {
                planType,
                externalRef
              })
            }
          }
          // 3. Fallback: identificar pelo valor (menos confiável)
          else {
            secureLogger.warn("⚠️ Identificando plano pelo valor (fallback)", {
              amount: payment.transaction_amount
            })

            // Ajustar conforme seus valores de planos exatos
            const amount = payment.transaction_amount
            if (amount >= 149.9 - 5 && amount <= 149.9 + 5) {
              planType = "pro"
            } else if (amount >= 1.0 - 0.5 && amount <= 1.0 + 0.5) {
              planType = "starter"
            } else {
              // Valor não reconhecido - usar starter como padrão mas logar warning
              secureLogger.warn("⚠️ ATENÇÃO: Valor de pagamento não corresponde a nenhum plano conhecido", {
                amount: payment.transaction_amount,
                paymentId: payment.id,
                email: userEmail,
                fallbackPlan: "starter"
              })
              planType = "starter"
            }
          }

          secureLogger.info("🎯 Plano identificado", {
            planType,
            email: userEmail,
            amount: payment.transaction_amount,
            paymentId
          })

          // Buscar usuário pelo email
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, plan, email, updated_at')
            .eq('email', userEmail)
            .single()

          if (profileError || !profile) {
            secureLogger.error("❌ Usuário não encontrado", {
              email: userEmail,
              error: profileError?.message,
              code: profileError?.code
            })

            // Tentar criar um perfil básico se não existir
            if (profileError?.code === 'PGRST116') { // Not found
              secureLogger.info("📝 Tentando criar perfil para o usuário", {
                email: userEmail
              })

              // Você pode implementar a criação do perfil aqui se necessário
              // Ou retornar erro para investigação manual
            }

            return NextResponse.json({
              error: "User not found"
            }, { status: 404 })
          }

          secureLogger.info("👤 Usuário encontrado", {
            userId: profile.id,
            currentPlan: profile.plan,
            email: profile.email
          })

          // Calcular datas
          const now = new Date()
          const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias

          let subscriptionResult

          try {
            // Primeiro, buscar subscription ativa existente (e não expirada)
            const { data: existingActiveSub } = await supabaseAdmin
              .from('subscriptions')
              .select('id, expires_at')
              .eq('user_id', profile.id)
              .eq('status', 'active')
              .gt('expires_at', now.toISOString()) // Apenas subscriptions não expiradas
              .maybeSingle()

            let upserted

            if (existingActiveSub) {
              // Atualizar subscription existente
              const { data: updated, error: updateError } = await supabaseAdmin
                .from('subscriptions')
                .update({
                  plan_type: planType,
                  mercadopago_subscription_id: payment.id.toString(),
                  mercadopago_payment_id: payment.id.toString(),
                  expires_at: expiresAt.toISOString(),
                  last_payment_date: payment.date_approved || now.toISOString(),
                  last_payment_amount: payment.transaction_amount,
                  payment_method: payment.payment_method_id,
                  updated_at: now.toISOString()
                })
                .eq('id', existingActiveSub.id)
                .select()
                .single()

              if (updateError) {
                throw updateError
              }
              upserted = updated
            } else {
              // Criar nova subscription
              const { data: created, error: createError } = await supabaseAdmin
                .from('subscriptions')
                .insert({
                  user_id: profile.id,
                  plan_type: planType,
                  status: 'active',
                  mercadopago_subscription_id: payment.id.toString(),
                  mercadopago_payment_id: payment.id.toString(),
                  started_at: now.toISOString(),
                  expires_at: expiresAt.toISOString(),
                  last_payment_date: payment.date_approved || now.toISOString(),
                  last_payment_amount: payment.transaction_amount,
                  payment_method: payment.payment_method_id,
                  created_at: now.toISOString(),
                  updated_at: now.toISOString()
                })
                .select()
                .single()

              if (createError) {
                throw createError
              }
              upserted = created
            }

            subscriptionResult = upserted

            secureLogger.info("✅ Subscription criada/atualizada com sucesso", {
              subscriptionId: subscriptionResult.id,
              plan: planType,
              userId: profile.id
            })

            // Atualizar plano no perfil do usuário - CRÍTICO
            const { error: updateProfileError } = await supabaseAdmin
              .from('profiles')
              .update({
                plan: planType,
                updated_at: now.toISOString(),
                last_payment_id: payment.id.toString(),
                subscription_status: 'active'
              })
              .eq('id', profile.id)

            if (updateProfileError) {
              secureLogger.error("❌ ERRO CRÍTICO ao atualizar perfil", {
                error: updateProfileError.message,
                userId: profile.id
              })

              // ROLLBACK: Desativar a subscription se o profile falhou
              await supabaseAdmin
                .from('subscriptions')
                .update({ status: 'cancelled' })
                .eq('id', subscriptionResult.id)

              secureLogger.error("⚠️ Rollback executado - subscription desativada", {
                subscriptionId: subscriptionResult.id
              })

              throw new Error(`Falha ao atualizar perfil do usuário: ${updateProfileError.message}`)
            }

            secureLogger.info("✅ Perfil atualizado com sucesso", {
              userId: profile.id,
              newPlan: planType
            })

          } catch (dbError) {
            secureLogger.error("❌ Erro ao processar subscription/profile", {
              error: dbError instanceof Error ? dbError.message : 'Unknown',
              userId: profile.id
            })
            throw dbError
          }

          // Log de sucesso
          secureLogger.info("✅ PAGAMENTO PROCESSADO COM SUCESSO!", {
            userId: profile.id,
            email: userEmail,
            oldPlan: profile.plan,
            newPlan: planType,
            paymentId: payment.id,
            subscriptionId: subscriptionResult?.id,
            expiresAt: expiresAt.toISOString(),
            amount: payment.transaction_amount
          })

          // Atualizar status do webhook para 'completed'
          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'completed' })
            .eq('webhook_id', webhookId)

          // Retornar sucesso
          return NextResponse.json({
            received: true,
            status: "success",
            processed: {
              paymentId: payment.id,
              userId: profile.id,
              plan: planType,
              subscriptionId: subscriptionResult?.id
            }
          })

        }
        // 2. EM PROCESSAMENTO - PIX, boleto, etc
        else if (payment.status === "in_process" || payment.status === "pending") {
          secureLogger.info("⏳ Pagamento em processamento", {
            status: payment.status,
            statusDetail: payment.status_detail,
            paymentId: payment.id,
            email: userEmail,
            paymentMethod: payment.payment_method_id
          })

          // Atualizar webhook como completed (foi processado, só aguardando confirmação)
          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'completed' })
            .eq('webhook_id', webhookId)

          return NextResponse.json({
            received: true,
            status: "payment_pending",
            paymentStatus: payment.status,
            message: "Pagamento aguardando confirmação"
          })
        }
        // 3. REJEITADO/CANCELADO - Notificar usuário
        else if (payment.status === "rejected" || payment.status === "cancelled") {
          secureLogger.warn("⚠️ Pagamento rejeitado ou cancelado", {
            status: payment.status,
            statusDetail: payment.status_detail,
            paymentId: payment.id,
            email: userEmail
          })

          // Atualizar webhook como completed (processado, mas pagamento falhou)
          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'completed' })
            .eq('webhook_id', webhookId)

          return NextResponse.json({
            received: true,
            status: "payment_failed",
            paymentStatus: payment.status,
            statusDetail: payment.status_detail,
            message: "Pagamento não foi aprovado"
          })
        }
        // 4. REEMBOLSADO
        else if (payment.status === "refunded" || payment.status === "charged_back") {
          secureLogger.warn("💸 Pagamento reembolsado ou estornado", {
            status: payment.status,
            statusDetail: payment.status_detail,
            paymentId: payment.id,
            email: userEmail
          })

          // Buscar usuário e desativar plano se necessário
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, plan')
            .eq('email', userEmail)
            .single()

          if (profile) {
            // Desativar subscription
            await supabaseAdmin
              .from('subscriptions')
              .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', profile.id)
              .eq('mercadopago_payment_id', payment.id.toString())

            // Voltar para plano free
            await supabaseAdmin
              .from('profiles')
              .update({
                plan: 'free',
                subscription_status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.id)

            secureLogger.info("✅ Usuário retornado ao plano free após reembolso", {
              userId: profile.id,
              email: userEmail
            })
          }

          // Atualizar webhook como completed
          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'completed' })
            .eq('webhook_id', webhookId)

          return NextResponse.json({
            received: true,
            status: "payment_refunded",
            paymentStatus: payment.status
          })
        }
        // 5. OUTROS ESTADOS
        else {
          secureLogger.info("📨 Pagamento com status não tratado", {
            status: payment.status,
            statusDetail: payment.status_detail,
            paymentId: payment.id
          })

          // Atualizar webhook como completed
          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'completed' })
            .eq('webhook_id', webhookId)

          return NextResponse.json({
            received: true,
            status: "payment_other_status",
            paymentStatus: payment.status
          })
        }

      } catch (paymentError) {
        secureLogger.error("❌ Erro ao processar pagamento", {
          error: paymentError instanceof Error ? paymentError.message : 'Unknown',
          stack: paymentError instanceof Error ? paymentError.stack : undefined,
          paymentId,
          webhookId
        })

        // Marcar webhook como failed no banco
        await supabaseAdmin
          .from('webhook_events')
          .update({ status: 'failed' })
          .eq('webhook_id', webhookId)

        // Retornar erro HTTP 500 para permitir retry pelo MercadoPago
        return NextResponse.json({
          error: "Processing error",
          details: paymentError instanceof Error ? paymentError.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    // Processar webhooks de assinatura (preapproval)
    else if (body.type === "subscription_preapproval" || body.type === "subscription_authorized_payment") {
      const preapprovalId = body.data.id

      secureLogger.info("📋 Processando webhook de assinatura", {
        type: body.type,
        action: body.action,
        preapprovalId
      })

      try {
        // Buscar detalhes da assinatura
        const subscription = await mpService.getSubscription(preapprovalId.toString())

        secureLogger.info("📋 Detalhes da assinatura obtidos", {
          id: subscription.id,
          status: subscription.status,
          email: subscription.payer_email,
          externalReference: subscription.external_reference
        })

        // Extrair informações do external_reference ou usar dados da assinatura
        let planType = "starter"
        const externalRef = subscription.external_reference

        if (externalRef && externalRef.includes("subscription_")) {
          const parts = externalRef.split("_")
          if (parts.length >= 2 && ["starter", "pro"].includes(parts[1])) {
            planType = parts[1]
          }
        }

        const userEmail = subscription.payer_email
        if (!userEmail) {
          secureLogger.error("❌ Email do assinante não encontrado", {
            preapprovalId,
            subscription
          })

          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'failed' })
            .eq('webhook_id', webhookId)

          return NextResponse.json({
            error: "Missing payer email"
          }, { status: 400 })
        }

        // Processar ações da assinatura
        if (body.action === "created" || subscription.status === "authorized") {
          // Assinatura criada/autorizada - ativar plano
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, plan, email')
            .eq('email', userEmail)
            .single()

          if (!profile) {
            secureLogger.error("❌ Usuário não encontrado para assinatura", {
              email: userEmail,
              preapprovalId
            })

            await supabaseAdmin
              .from('webhook_events')
              .update({ status: 'failed' })
              .eq('webhook_id', webhookId)

            return NextResponse.json({
              error: "User not found"
            }, { status: 404 })
          }

          const now = new Date()
          const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias

          // Criar/atualizar subscription
          const { data: existingActiveSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .gt('expires_at', now.toISOString())
            .maybeSingle()

          if (existingActiveSub) {
            await supabaseAdmin
              .from('subscriptions')
              .update({
                plan_type: planType,
                mercadopago_subscription_id: preapprovalId.toString(),
                expires_at: expiresAt.toISOString(),
                updated_at: now.toISOString()
              })
              .eq('id', existingActiveSub.id)
          } else {
            await supabaseAdmin
              .from('subscriptions')
              .insert({
                user_id: profile.id,
                plan_type: planType,
                status: 'active',
                mercadopago_subscription_id: preapprovalId.toString(),
                started_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                created_at: now.toISOString(),
                updated_at: now.toISOString()
              })
          }

          // Atualizar perfil
          await supabaseAdmin
            .from('profiles')
            .update({
              plan: planType,
              subscription_status: 'active',
              updated_at: now.toISOString()
            })
            .eq('id', profile.id)

          secureLogger.info("✅ Assinatura processada com sucesso", {
            userId: profile.id,
            email: userEmail,
            plan: planType,
            preapprovalId
          })

          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'completed' })
            .eq('webhook_id', webhookId)

          return NextResponse.json({
            received: true,
            status: "subscription_activated",
            preapprovalId
          })
        }
        else if (body.action === "cancelled" || subscription.status === "cancelled") {
          // Assinatura cancelada - desativar plano
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .single()

          if (profile) {
            await supabaseAdmin
              .from('subscriptions')
              .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', profile.id)
              .eq('mercadopago_subscription_id', preapprovalId.toString())

            await supabaseAdmin
              .from('profiles')
              .update({
                plan: 'free',
                subscription_status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.id)

            secureLogger.info("✅ Assinatura cancelada processada", {
              userId: profile.id,
              email: userEmail,
              preapprovalId
            })
          }

          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'completed' })
            .eq('webhook_id', webhookId)

          return NextResponse.json({
            received: true,
            status: "subscription_cancelled"
          })
        }
        else {
          secureLogger.info("📨 Ação de assinatura não tratada", {
            action: body.action,
            status: subscription.status
          })

          await supabaseAdmin
            .from('webhook_events')
            .update({ status: 'completed' })
            .eq('webhook_id', webhookId)

          return NextResponse.json({
            received: true,
            status: "subscription_action_not_processed"
          })
        }

      } catch (subscriptionError) {
        secureLogger.error("❌ Erro ao processar assinatura", {
          error: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown',
          preapprovalId,
          webhookId
        })

        await supabaseAdmin
          .from('webhook_events')
          .update({ status: 'failed' })
          .eq('webhook_id', webhookId)

        return NextResponse.json({
          error: "Subscription processing error",
          details: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error'
        }, { status: 500 })
      }
    } else {
      // Log para outros tipos de webhook
      secureLogger.info("📨 Webhook de tipo não processado", {
        type: body.type,
        action: body.action
      })

      // Marcar como completed mesmo assim (não queremos retry para tipos desconhecidos)
      await supabaseAdmin
        .from('webhook_events')
        .update({ status: 'completed' })
        .eq('webhook_id', webhookId)

      return NextResponse.json({
        received: true,
        status: "webhook_type_not_processed"
      })
    }

  } catch (error) {
    secureLogger.error("❌ ERRO GERAL NO WEBHOOK", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      webhookId
    })

    // Marcar webhook como failed no banco se possível
    if (webhookId && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('webhook_events')
          .update({ status: 'failed' })
          .eq('webhook_id', webhookId)
      } catch (updateError) {
        secureLogger.error("❌ Erro ao atualizar status do webhook", {
          error: updateError instanceof Error ? updateError.message : 'Unknown'
        })
      }
    }

    // Retornar status HTTP 500 para permitir retry pelo MercadoPago
    return NextResponse.json({
      error: "General processing error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}