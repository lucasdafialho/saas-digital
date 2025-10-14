import crypto from "crypto"
import secureLogger from './logger'

export interface MercadoPagoPreapprovalPlan {
  id?: string
  auto_recurring: {
    frequency: number
    frequency_type: "days" | "months"
    transaction_amount: number
    currency_id: "BRL"
  }
  back_url: string
  reason: string
  status?: string
}

export interface MercadoPagoSubscription {
  id?: string
  preapproval_plan_id: string
  reason: string
  auto_recurring: {
    frequency: number
    frequency_type: "days" | "months"
    transaction_amount: number
    currency_id: "BRL"
  }
  back_url: string
  payer_email?: string
  status?: string
  init_point?: string
}

export interface MercadoPagoWebhook {
  action: string
  api_version: string
  data: {
    id: string
  }
  date_created: string
  id: number
  live_mode: boolean
  type: string
  user_id: string
}

export interface MercadoPagoPayment {
  id: number
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  status_detail: string
  payment_type_id: string
  payment_method_id: string
  transaction_amount: number
  currency_id: string
  date_approved: string | null
  payer: {
    email: string
    first_name?: string
    last_name?: string
    identification?: {
      type: string
      number: string
    }
  }
  external_reference?: string
  description?: string
  metadata?: {
    plan_type?: string
    [key: string]: any
  }
}

const MERCADOPAGO_API = "https://api.mercadopago.com/preapproval_plan"
const MERCADOPAGO_SUBSCRIPTION_API = "https://api.mercadopago.com/preapproval"

export class MercadoPagoService {
  private accessToken: string
  private webhookSecret: string

  constructor() {
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ""
    this.webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || ""
    
    if (!this.accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado")
    }
  }

  validateWebhookSignature(headers: any, body: any): boolean {
    // Log detalhado do webhook secret
    secureLogger.info('🔍 Validando webhook signature', {
      secretConfigured: !!this.webhookSecret,
      environment: process.env.VERCEL ? 'vercel' : 'local',
      nodeEnv: process.env.NODE_ENV
    })

    // Se não há webhook secret configurado, sempre rejeitar
    if (!this.webhookSecret) {
      secureLogger.security('🚫 WEBHOOK_SECRET não configurado - REJEITANDO webhook', {
        source: 'mercadopago',
        environment: process.env.VERCEL ? 'vercel' : 'unknown',
        nodeEnv: process.env.NODE_ENV
      })
      return false
    }

    // Normalizar headers (case-insensitive)
    const normalizedHeaders: Record<string, string> = {}
    for (const key in headers) {
      if (headers[key]) {
        normalizedHeaders[key.toLowerCase()] = headers[key]
      }
    }

    const xSignature = normalizedHeaders['x-signature']
    const xRequestId = normalizedHeaders['x-request-id']

    secureLogger.info('🔍 Headers normalizados', {
      hasSignature: !!xSignature,
      hasRequestId: !!xRequestId,
      signaturePreview: xSignature ? xSignature.substring(0, 20) + '...' : 'NOT_SET',
      requestId: xRequestId,
      allHeaderKeys: Object.keys(normalizedHeaders)
    })

    if (!xSignature || !xRequestId) {
      secureLogger.security('🚫 Headers de assinatura ausentes - REJEITANDO webhook', {
        hasSignature: !!xSignature,
        hasRequestId: !!xRequestId,
        availableHeaders: Object.keys(normalizedHeaders)
      })
      return false
    }

    // Extrair ts e v1 do header x-signature
    // Formato: "ts=1234567890,v1=hash"
    const signatureParts = xSignature.split(',')
    let ts = ''
    let v1 = ''

    for (const part of signatureParts) {
      const [key, value] = part.trim().split('=')
      if (key?.trim() === 'ts') {
        ts = value?.trim() || ''
      } else if (key?.trim() === 'v1') {
        v1 = value?.trim() || ''
      }
    }

    secureLogger.info('🔍 Signature parts extraídas', {
      hasTimestamp: !!ts,
      hasV1: !!v1,
      timestampValue: ts,
      v1Preview: v1 ? v1.substring(0, 10) + '...' : 'NOT_SET'
    })

    if (!ts || !v1) {
      secureLogger.security('🚫 Formato de assinatura inválido', {
        xSignature,
        hasTimestamp: !!ts,
        hasV1: !!v1,
        signatureParts
      })
      return false
    }

    // VALIDAÇÃO DE TIMESTAMP (Prevenir replay attacks)
    const timestamp = parseInt(ts)
    const now = Math.floor(Date.now() / 1000)
    const maxAge = 7200 // 2 horas (aumentado para considerar diferenças de fuso)

    secureLogger.info('🔍 Validando timestamp', {
      timestamp,
      now,
      difference: Math.abs(now - timestamp),
      maxAge
    })

    if (isNaN(timestamp)) {
      secureLogger.security('🚫 Timestamp inválido', {
        ts,
        parsed: timestamp
      })
      return false
    }

    if (Math.abs(now - timestamp) > maxAge) {
      secureLogger.security('🚫 Webhook com timestamp antigo - REJEITADO', {
        timestamp,
        now,
        difference: Math.abs(now - timestamp),
        maxAge,
        timeDiffHours: Math.abs(now - timestamp) / 3600
      })
      return false
    }

    // Construir a string para validação
    // Formato: id:{dataId};request-id:{xRequestId};ts:{ts};
    const dataId = body.data?.id || ''
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

    secureLogger.info('🔍 Manifest construído', {
      manifest,
      dataId,
      requestId: xRequestId
    })

    // Gerar HMAC SHA256
    const hmac = crypto.createHmac('sha256', this.webhookSecret)
    hmac.update(manifest)
    const calculatedSignature = hmac.digest('hex')

    secureLogger.info('🔍 Assinatura calculada', {
      calculatedPreview: calculatedSignature.substring(0, 10) + '...',
      receivedPreview: v1.substring(0, 10) + '...',
      calculatedLength: calculatedSignature.length,
      receivedLength: v1.length
    })

    // Comparar assinaturas de forma segura (timing-safe)
    let isValid = false
    try {
      // Normalizar para lowercase antes de comparar
      const v1Lower = v1.toLowerCase()
      const calculatedLower = calculatedSignature.toLowerCase()

      isValid = crypto.timingSafeEqual(
        Buffer.from(v1Lower, 'hex'),
        Buffer.from(calculatedLower, 'hex')
      )
    } catch (error) {
      secureLogger.security('⚠️ Erro ao comparar assinaturas (tentando comparação simples)', {
        error: error instanceof Error ? error.message : 'Unknown error',
        v1Length: v1.length,
        calculatedLength: calculatedSignature.length
      })

      // Fallback: comparação simples (case-insensitive)
      isValid = v1.toLowerCase() === calculatedSignature.toLowerCase()
    }

    if (!isValid) {
      secureLogger.security('🚫 Assinatura de webhook inválida - REJEITADO', {
        expected: v1.substring(0, 10) + '...' + v1.substring(v1.length - 10),
        calculated: calculatedSignature.substring(0, 10) + '...' + calculatedSignature.substring(calculatedSignature.length - 10),
        manifest,
        dataId,
        match: v1.toLowerCase() === calculatedSignature.toLowerCase()
      })
      return false
    }

    secureLogger.info('✅ Webhook validado com sucesso', { dataId })
    return true
  }

  async createPlan(plan: MercadoPagoPreapprovalPlan): Promise<MercadoPagoPreapprovalPlan> {
    const response = await fetch(MERCADOPAGO_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(plan),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Erro ao criar plano: ${JSON.stringify(error)}`)
    }

    return response.json()
  }

  async getPlan(planId: string): Promise<MercadoPagoPreapprovalPlan> {
    const response = await fetch(`${MERCADOPAGO_API}/${planId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao buscar plano")
    }

    return response.json()
  }

  async createSubscription(subscription: MercadoPagoSubscription): Promise<MercadoPagoSubscription> {
    const response = await fetch(MERCADOPAGO_SUBSCRIPTION_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(subscription),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Erro ao criar assinatura: ${JSON.stringify(error)}`)
    }

    return response.json()
  }

  async getSubscription(subscriptionId: string): Promise<MercadoPagoSubscription> {
    const response = await fetch(`${MERCADOPAGO_SUBSCRIPTION_API}/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao buscar assinatura")
    }

    return response.json()
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${MERCADOPAGO_SUBSCRIPTION_API}/${subscriptionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
    })

    if (!response.ok) {
      throw new Error("Erro ao cancelar assinatura")
    }
  }

  async getPayment(paymentId: string): Promise<MercadoPagoPayment> {
    try {
      // Criar AbortController para timeout de 8 segundos
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        secureLogger.error("Erro na API do MercadoPago", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          paymentId
        })

        if (response.status === 404) {
          throw new Error(`Pagamento não encontrado: ${paymentId}`)
        }

        throw new Error(`Erro ao buscar pagamento: ${response.status} - ${errorText}`)
      }

      const payment = await response.json()

      if (!payment || !payment.id) {
        throw new Error("Resposta inválida da API do MercadoPago")
      }

      return payment
    } catch (error) {
      // Verificar se foi timeout
      if (error instanceof Error && error.name === 'AbortError') {
        secureLogger.error("Timeout ao buscar pagamento no MercadoPago", {
          paymentId,
          timeout: '8s'
        })
        throw new Error(`Timeout ao buscar pagamento: ${paymentId}`)
      }

      secureLogger.error("Erro ao buscar pagamento no MercadoPago", {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId
      })
      throw error
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<void> {
    const body = amount ? { amount } : {}
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Erro ao reembolsar pagamento: ${JSON.stringify(error)}`)
    }
  }
}

export const PLANS = {
  free: {
    name: "Gratuito",
    price: 0,
    limit: 5,
    features: [
      "5 gerações de copy",
      "Análise básica de produtos",
      "Acesso limitado às ferramentas",
    ],
  },
  starter: {
    name: "Starter",
    price: 1.0,
    limit: 100,
    features: [
      "100 copies geradas por mês",
      "Análise de produtos",
      "Gerador de funis básico",
      "Suporte por email",
    ],
  },
  pro: {
    name: "Pro",
    price: 149.9,
    limit: -1,
    features: [
      "Copies ilimitadas",
      "Análise avançada de produtos",
      "Gerador de funis completo",
      "Estratégias de Ads com IA",
      "Marketing Model Canvas",
      "Suporte prioritário",
      "Acesso antecipado a novas features",
    ],
  },
}

