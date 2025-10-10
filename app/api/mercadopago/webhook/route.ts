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
    // Parse do body
    const body = await request.json()

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

    // VALIDAR ASSINATURA DO WEBHOOK
    const mpService = new MercadoPagoService()
    const headers = {
      'x-signature': request.headers.get('x-signature'),
      'x-request-id': request.headers.get('x-request-id')
    }

    const isValid = mpService.validateWebhookSignature(headers, body)

    if (!isValid) {
      secureLogger.security('🚫 Webhook rejeitado - assinatura inválida', {
        dataId: body.data?.id,
        type: body.type
      })
      return NextResponse.json({
        error: "Invalid signature"
      }, { status: 401 })
    }

    // Verificar conexão com Supabase
    if (!supabaseAdmin) {
      secureLogger.error("❌ Supabase Admin não configurado")
      return NextResponse.json({
        error: "Database connection error"
      }, { status: 500 })
    }

    // Gerar ID único mais robusto
    webhookId = `${body.id}_${body.data.id}_${Date.now()}`

    // Verificar se já foi processado (no banco de dados)
    const { data: existingWebhook } = await supabaseAdmin
      .from('webhook_events')
      .select('id, processed_at')
      .eq('webhook_id', webhookId)
      .maybeSingle()

    if (existingWebhook) {
      secureLogger.info("✅ Webhook já processado", {
        webhookId,
        processedAt: existingWebhook.processed_at
      })
      return NextResponse.json({
        received: true,
        status: "already_processed"
      })
    }

    // Registrar webhook no banco (marca como em processamento)
    await supabaseAdmin
      .from('webhook_events')
      .insert({
        webhook_id: webhookId,
        event_type: body.type,
        payment_id: body.data.id,
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
        // Inicializar serviço do MercadoPago
        const mpService = new MercadoPagoService()
        
        // Buscar detalhes completos do pagamento
        const payment = await mpService.getPayment(paymentId.toString())

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

        // Processar apenas pagamentos aprovados
        if (payment.status === "approved") {
          const userEmail = payment.payer?.email
          const externalRef = payment.external_reference

          // Validar dados essenciais
          if (!userEmail) {
            secureLogger.error("❌ Email do pagador não encontrado", {
              paymentId,
              payer: payment.payer
            })
            return NextResponse.json({
              error: "Missing payer email"
            }, { status: 400 })
          }

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
            }
          }

          secureLogger.info("🎯 Plano identificado", {
            planType,
            email: userEmail,
            amount: payment.transaction_amount,
            paymentId
          })

          // Verificar conexão com Supabase
          if (!supabaseAdmin) {
            secureLogger.error("❌ Supabase Admin não configurado")
            return NextResponse.json({
              error: "Database connection error"
            }, { status: 500 })
          }

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

          // Verificar assinatura existente
          const { data: existingSub, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .select('id, plan_type, status, expires_at')
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle() // Usar maybeSingle ao invés de single

          if (subError && subError.code !== 'PGRST116') {
            secureLogger.error("❌ Erro ao buscar subscription", {
              error: subError.message,
              userId: profile.id
            })
          }

          let subscriptionResult
          
          if (existingSub) {
            // Atualizar assinatura existente
            secureLogger.info("🔄 Atualizando assinatura existente", {
              subscriptionId: existingSub.id,
              oldPlan: existingSub.plan_type,
              newPlan: planType
            })

            const { data: updated, error: updateSubError } = await supabaseAdmin
              .from('subscriptions')
              .update({
                plan_type: planType,
                mercadopago_subscription_id: payment.id.toString(),
                mercadopago_payment_id: payment.id.toString(), // Adicionar ID do pagamento
                updated_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                last_payment_date: payment.date_approved || now.toISOString(),
                last_payment_amount: payment.transaction_amount,
                payment_method: payment.payment_method_id
              })
              .eq('id', existingSub.id)
              .select()
              .single()

            if (updateSubError) {
              secureLogger.error("❌ Erro ao atualizar subscription", {
                error: updateSubError.message,
                subscriptionId: existingSub.id
              })
              throw updateSubError
            }
            
            subscriptionResult = updated
          } else {
            // Criar nova assinatura
            secureLogger.info("✨ Criando nova assinatura", {
              userId: profile.id,
              plan: planType
            })

            const { data: created, error: createSubError } = await supabaseAdmin
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

            if (createSubError) {
              secureLogger.error("❌ Erro ao criar subscription", {
                error: createSubError.message,
                userId: profile.id,
                details: createSubError
              })
              throw createSubError
            }
            
            subscriptionResult = created
          }

          // Atualizar plano no perfil do usuário
          const { data: updatedProfile, error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({
              plan: planType,
              updated_at: now.toISOString(),
              last_payment_id: payment.id.toString(),
              subscription_status: 'active'
            })
            .eq('id', profile.id)
            .select()
            .single()

          if (updateProfileError) {
            secureLogger.error("❌ Erro ao atualizar perfil", {
              error: updateProfileError.message,
              userId: profile.id
            })
            // Não fazer throw aqui pois a subscription já foi criada/atualizada
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
          
        } else {
          // Log para pagamentos não aprovados
          secureLogger.info("⏳ Pagamento com status não aprovado", {
            status: payment.status,
            statusDetail: payment.status_detail,
            paymentId: payment.id
          })
          
          return NextResponse.json({ 
            received: true,
            status: "payment_not_approved",
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
    } else {
      // Log para outros tipos de webhook
      secureLogger.info("📨 Webhook de tipo não processado", {
        type: body.type,
        action: body.action
      })
      
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