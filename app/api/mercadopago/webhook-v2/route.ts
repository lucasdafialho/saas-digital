import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { MercadoPagoService } from "@/lib/mercadopago"
import { PaymentWebhookHandler, SubscriptionWebhookHandler } from "@/lib/services/webhook-handlers"
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
    // 0. VERIFICAR SUPABASE
    if (!supabaseAdmin) {
      secureLogger.error(" Supabase Admin não configurado")
      return NextResponse.json({
        error: "Database connection error"
      }, { status: 500 })
    }

    // 1. PARSE DO CORPO
    const body = await parseRequestBody(request)

    secureLogger.info("🔔 Webhook MercadoPago recebido", {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      webhookId: body.id
    })

    // 2. VALIDAR ESTRUTURA
    if (!body.type || !body.data?.id) {
      secureLogger.warn("⚠️ Webhook com estrutura inválida", { body })
      return NextResponse.json({
        error: "Invalid webhook structure"
      }, { status: 400 })
    }

    // 3. VALIDAR ASSINATURA
    const mpService = new MercadoPagoService()
    const headers = normalizeHeaders(request.headers)

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

    secureLogger.info('✅ Webhook validado com sucesso!')

    // 4. GERAR ID ÚNICO DO WEBHOOK
    webhookId = generateWebhookId(body, headers)

    // 5. VERIFICAR DUPLICAÇÃO (Idempotência)
    const isDuplicate = await checkDuplicateWebhook(webhookId)
    if (isDuplicate) {
      secureLogger.info("✅ Webhook já processado anteriormente", { webhookId })
      return NextResponse.json({
        received: true,
        status: "already_processed"
      })
    }

    // 6. REGISTRAR WEBHOOK (previne race conditions)
    const registered = await registerWebhook(webhookId, body)
    if (!registered) {
      secureLogger.info("⚠️ Webhook já em processamento por outra instância", { webhookId })
      return NextResponse.json({
        received: true,
        status: "already_processing"
      })
    }

    // 7. PROCESSAR WEBHOOK POR TIPO
    const result = await processWebhookByType(body)

    // 8. ATUALIZAR STATUS DO WEBHOOK
    await updateWebhookStatus(webhookId, result.success ? 'completed' : 'failed')

    // 9. RETORNAR RESPOSTA
    return NextResponse.json({
      received: true,
      ...result
    }, { status: result.success ? 200 : 500 })

  } catch (error) {
    secureLogger.error("❌ ERRO GERAL NO WEBHOOK", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      webhookId
    })

    // Marcar webhook como failed
    if (webhookId) {
      await updateWebhookStatus(webhookId, 'failed')
    }

    return NextResponse.json({
      error: "General processing error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Parse resiliente do corpo da requisição
 */
async function parseRequestBody(request: NextRequest): Promise<any> {
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      return await request.json()
    } else {
      const text = await request.text()
      return text ? JSON.parse(text) : {}
    }
  } catch {
    return {}
  }
}

/**
 * Normaliza headers para case-insensitive
 */
function normalizeHeaders(headers: Headers): Record<string, string> {
  const normalized: Record<string, string> = {}

  headers.forEach((value, key) => {
    normalized[key.toLowerCase()] = value
  })

  return {
    'x-signature': normalized['x-signature'] || '',
    'x-request-id': normalized['x-request-id'] || '',
  }
}

/**
 * Gera ID único para o webhook
 */
function generateWebhookId(body: any, headers: Record<string, string>): string {
  if (body.id) {
    return `mp_${body.id}`
  }

  const tsHeader = (headers['x-signature'] || '').split(',').find((p: string) => p.trim().startsWith('ts='))
  const ts = tsHeader ? tsHeader.split('=')[1] : Date.now()

  return `mp_${body.type}_${body.data.id}_${ts}`
}

/**
 * Verifica se o webhook já foi processado
 */
async function checkDuplicateWebhook(webhookId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('webhook_events')
    .select('id, status')
    .eq('webhook_id', webhookId)
    .maybeSingle()

  return !!data
}

/**
 * Registra webhook no banco (previne race conditions)
 */
async function registerWebhook(webhookId: string, body: any): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('webhook_events')
    .insert({
      webhook_id: webhookId,
      event_type: body.type,
      payment_id: body.data.id,
      status: 'processing',
      raw_data: body
    })

  // Se erro de duplicação, significa que outro processo já está processando
  if (error && error.code === '23505') {
    return false
  }

  if (error) {
    secureLogger.error("❌ Erro ao registrar webhook", {
      error: error.message,
      code: error.code,
      webhookId
    })
    throw error
  }

  return true
}

/**
 * Atualiza status do webhook no banco
 */
async function updateWebhookStatus(
  webhookId: string,
  status: 'processing' | 'completed' | 'failed'
): Promise<void> {
  await supabaseAdmin
    .from('webhook_events')
    .update({ status })
    .eq('webhook_id', webhookId)
}

/**
 * Processa webhook de acordo com o tipo
 */
async function processWebhookByType(body: any): Promise<any> {
  const { type, action, data } = body

  switch (type) {
    case "payment": {
      const handler = new PaymentWebhookHandler()
      return await handler.handlePaymentWebhook(data.id)
    }

    case "subscription_preapproval":
    case "subscription_authorized_payment": {
      const handler = new SubscriptionWebhookHandler()
      return await handler.handleSubscriptionWebhook(data.id, action)
    }

    default:
      secureLogger.info("📨 Tipo de webhook não processado", {
        type,
        action
      })
      return {
        success: true,
        status: "webhook_type_not_processed",
        message: `Tipo ${type} não requer processamento`
      }
  }
}
