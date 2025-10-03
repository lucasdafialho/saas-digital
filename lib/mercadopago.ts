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

const MERCADOPAGO_API = "https://api.mercadopago.com/preapproval_plan"
const MERCADOPAGO_SUBSCRIPTION_API = "https://api.mercadopago.com/preapproval"

export class MercadoPagoService {
  private accessToken: string

  constructor() {
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ""
    if (!this.accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado")
    }
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
    price: 49.9,
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

