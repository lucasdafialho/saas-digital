import { MercadoPagoService, MercadoPagoPayment, MercadoPagoSubscription } from "@/lib/mercadopago"
import { PaymentService } from "./payment-service"
import { supabaseAdmin } from "@/lib/supabase-admin"
import secureLogger from "@/lib/logger"

export interface WebhookHandlerResult {
  success: boolean
  status: string
  message?: string
  error?: string
}

export class PaymentWebhookHandler {
  private mpService: MercadoPagoService
  private paymentService: PaymentService

  constructor() {
    this.mpService = new MercadoPagoService()
    this.paymentService = new PaymentService()
  }

  /**
   * Processa webhook de pagamento
   */
  async handlePaymentWebhook(paymentId: string): Promise<WebhookHandlerResult> {
    try {
      secureLogger.info("💰 Processando webhook de pagamento", { paymentId })

      // 1. Buscar detalhes do pagamento
      const payment = await this.mpService.getPayment(paymentId)

      secureLogger.info("📋 Detalhes do pagamento obtidos", {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        email: payment.payer?.email,
        amount: payment.transaction_amount,
        paymentMethod: payment.payment_method_id
      })

      // 2. Validar email do pagador
      const userEmail = payment.payer?.email
      if (!userEmail) {
        const error = "Email do pagador não encontrado"
        secureLogger.error("❌ " + error, { paymentId, payer: payment.payer })
        return { success: false, status: "missing_email", error }
      }

      // 3. Processar de acordo com o status
      return await this.processPaymentByStatus(payment, userEmail)

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown'
      secureLogger.error("❌ Erro ao processar webhook de pagamento", {
        error: errorMsg,
        paymentId
      })
      return { success: false, status: "error", error: errorMsg }
    }
  }

  /**
   * Processa pagamento de acordo com seu status
   */
  private async processPaymentByStatus(
    payment: MercadoPagoPayment,
    userEmail: string
  ): Promise<WebhookHandlerResult> {
    switch (payment.status) {
      case "approved":
        return await this.handleApprovedPayment(payment, userEmail)

      case "in_process":
      case "pending":
        return this.handlePendingPayment(payment)

      case "rejected":
      case "cancelled":
        return this.handleRejectedPayment(payment)

      case "refunded":
      case "charged_back":
        return await this.handleRefundedPayment(payment, userEmail)

      default:
        secureLogger.info("📨 Status de pagamento não tratado", {
          status: payment.status,
          paymentId: payment.id
        })
        return {
          success: true,
          status: "unhandled_status",
          message: `Status ${payment.status} não requer ação`
        }
    }
  }

  /**
   * Processa pagamento aprovado
   */
  private async handleApprovedPayment(
    payment: MercadoPagoPayment,
    userEmail: string
  ): Promise<WebhookHandlerResult> {
    // Identificar plano
    const planType = this.paymentService.identifyPlanType(
      payment.metadata,
      payment.external_reference,
      payment.transaction_amount
    )

    // Processar pagamento
    const result = await this.paymentService.processApprovedPayment(
      userEmail,
      planType,
      {
        paymentId: payment.id.toString(),
        amount: payment.transaction_amount,
        paymentMethod: payment.payment_method_id,
        dateApproved: payment.date_approved
      }
    )

    if (!result.success) {
      return {
        success: false,
        status: "processing_failed",
        error: result.error
      }
    }

    return {
      success: true,
      status: "payment_approved",
      message: `Plano ${planType} ativado para ${userEmail}`
    }
  }

  /**
   * Processa pagamento pendente
   */
  private handlePendingPayment(payment: MercadoPagoPayment): WebhookHandlerResult {
    secureLogger.info("⏳ Pagamento em processamento", {
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentId: payment.id,
      paymentMethod: payment.payment_method_id
    })

    return {
      success: true,
      status: "payment_pending",
      message: "Pagamento aguardando confirmação"
    }
  }

  /**
   * Processa pagamento rejeitado
   */
  private handleRejectedPayment(payment: MercadoPagoPayment): WebhookHandlerResult {
    secureLogger.warn("⚠️ Pagamento rejeitado ou cancelado", {
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentId: payment.id
    })

    return {
      success: true,
      status: "payment_failed",
      message: "Pagamento não foi aprovado"
    }
  }

  /**
   * Processa pagamento reembolsado
   */
  private async handleRefundedPayment(
    payment: MercadoPagoPayment,
    userEmail: string
  ): Promise<WebhookHandlerResult> {
    secureLogger.warn("💸 Pagamento reembolsado ou estornado", {
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentId: payment.id,
      email: userEmail
    })

    // Buscar usuário e cancelar assinatura
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (profile) {
      await this.paymentService.cancelUserSubscription(profile.id)
    }

    return {
      success: true,
      status: "payment_refunded",
      message: "Assinatura cancelada devido a reembolso"
    }
  }
}

export class SubscriptionWebhookHandler {
  private mpService: MercadoPagoService
  private paymentService: PaymentService

  constructor() {
    this.mpService = new MercadoPagoService()
    this.paymentService = new PaymentService()
  }

  /**
   * Processa webhook de assinatura
   */
  async handleSubscriptionWebhook(
    subscriptionId: string,
    action: string
  ): Promise<WebhookHandlerResult> {
    try {
      secureLogger.info("📋 Processando webhook de assinatura", {
        subscriptionId,
        action
      })

      // Buscar detalhes da assinatura
      const subscription = await this.mpService.getSubscription(subscriptionId)

      secureLogger.info("📋 Detalhes da assinatura obtidos", {
        id: subscription.id,
        status: subscription.status,
        email: subscription.payer_email
      })

      const userEmail = subscription.payer_email
      if (!userEmail) {
        const error = "Email do assinante não encontrado"
        secureLogger.error("❌ " + error, { subscriptionId })
        return { success: false, status: "missing_email", error }
      }

      // Processar de acordo com a ação
      if (action === "created" || subscription.status === "authorized") {
        return await this.handleSubscriptionCreated(subscription, userEmail)
      } else if (action === "cancelled" || subscription.status === "cancelled") {
        return await this.handleSubscriptionCancelled(userEmail)
      }

      return {
        success: true,
        status: "unhandled_action",
        message: `Ação ${action} não requer processamento`
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown'
      secureLogger.error("❌ Erro ao processar webhook de assinatura", {
        error: errorMsg,
        subscriptionId
      })
      return { success: false, status: "error", error: errorMsg }
    }
  }

  /**
   * Processa assinatura criada/autorizada
   */
  private async handleSubscriptionCreated(
    subscription: MercadoPagoSubscription,
    userEmail: string
  ): Promise<WebhookHandlerResult> {
    // Identificar plano do external_reference
    let planType: "starter" | "pro" = "starter"

    if (subscription.external_reference?.includes("subscription_")) {
      const parts = subscription.external_reference.split("_")
      if (parts.length >= 2 && ["starter", "pro"].includes(parts[1])) {
        planType = parts[1] as "starter" | "pro"
      }
    }

    const result = await this.paymentService.processApprovedPayment(
      userEmail,
      planType,
      {
        paymentId: subscription.id || "subscription",
        amount: subscription.auto_recurring?.transaction_amount || 0,
        paymentMethod: "subscription",
        dateApproved: new Date().toISOString()
      }
    )

    if (!result.success) {
      return {
        success: false,
        status: "processing_failed",
        error: result.error
      }
    }

    return {
      success: true,
      status: "subscription_activated",
      message: `Assinatura ${planType} ativada para ${userEmail}`
    }
  }

  /**
   * Processa assinatura cancelada
   */
  private async handleSubscriptionCancelled(userEmail: string): Promise<WebhookHandlerResult> {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (profile) {
      await this.paymentService.cancelUserSubscription(profile.id)
    }

    return {
      success: true,
      status: "subscription_cancelled",
      message: "Assinatura cancelada com sucesso"
    }
  }
}
