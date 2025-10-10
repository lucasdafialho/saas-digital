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
    // CRÍTICO: Webhook secret é obrigatório
    if (!this.webhookSecret) {
      secureLogger.security('WEBHOOK_SECRET não configurado - webhook rejeitado', {
        source: 'mercadopago'
      })
      throw new Error("WEBHOOK_SECRET não configurado - webhook rejeitado por segurança")
    }

    const xSignature = headers['x-signature']
    const xRequestId = headers['x-request-id']

    if (!xSignature || !xRequestId) {
      secureLogger.security('Headers de assinatura ausentes', {
        hasSignature: !!xSignature,
        hasRequestId: !!xRequestId,
        availableHeaders: Object.keys(headers)
      })
      return false
    }

    // Extrair ts e v1 do header x-signature
    // Formato: "ts=1234567890,v1=hash"
    const signatureParts = xSignature.split(',')
    let ts = ''
    let v1 = ''
    
    for (const part of signatureParts) {
      const [key, value] = part.split('=')
      if (key === 'ts') {
        ts = value
      } else if (key === 'v1') {
        v1 = value
      }
    }

    if (!ts || !v1) {
      secureLogger.security('Formato de assinatura inválido', {
        xSignature,
        hasTimestamp: !!ts,
        hasV1: !!v1
      })
      return false
    }

    // VALIDAÇÃO DE TIMESTAMP (Prevenir replay attacks)
    const timestamp = parseInt(ts)
    const now = Math.floor(Date.now() / 1000)
    const maxAge = 300 // 5 minutos

    if (Math.abs(now - timestamp) > maxAge) {
      secureLogger.security('Webhook com timestamp inválido - possível replay attack', {
        timestamp,
        now,
        difference: Math.abs(now - timestamp)
      })
      return false
    }

    // Construir a string para validação
    // Formato: id:{dataId};request-id:{xRequestId};ts:{ts};
    const dataId = body.data?.id || ''
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    
    // Gerar HMAC SHA256
    const hmac = crypto.createHmac('sha256', this.webhookSecret)
    hmac.update(manifest)
    const calculatedSignature = hmac.digest('hex')

    // Comparar assinaturas de forma segura (timing-safe)
    let isValid = false
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(v1),
        Buffer.from(calculatedSignature)
      )
    } catch (error) {
      secureLogger.security('Erro ao comparar assinaturas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        v1Length: v1.length,
        calculatedLength: calculatedSignature.length
      })
      return false
    }

    if (!isValid) {
      secureLogger.security('Assinatura de webhook inválida', {
        expected: v1.substring(0, 10) + '...',
        calculated: calculatedSignature.substring(0, 10) + '...',
        manifest,
        dataId
      })
    }

    return isValid
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
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao buscar pagamento")
    }

    return response.json()
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

