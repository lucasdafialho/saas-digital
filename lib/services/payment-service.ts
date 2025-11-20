import { supabaseAdmin } from "@/lib/supabase-admin"
import secureLogger from "@/lib/logger"

export type PlanType = "free" | "starter" | "pro"
export type SubscriptionStatus = "active" | "cancelled" | "expired"

export interface ProcessPaymentResult {
  success: boolean
  userId?: string
  plan?: PlanType
  error?: string
}

export class PaymentService {
  /**
   * Processa um pagamento aprovado e ativa o plano do usuário
   */
  async processApprovedPayment(
    userEmail: string,
    planType: PlanType,
    paymentData: {
      paymentId: string
      amount: number
      paymentMethod: string
      dateApproved: string | null
    }
  ): Promise<ProcessPaymentResult> {
    try {
      secureLogger.info("💰 Iniciando processamento de pagamento aprovado", {
        email: userEmail,
        plan: planType,
        paymentId: paymentData.paymentId
      })

      // 1. Buscar usuário
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, plan, email, subscription_status')
        .eq('email', userEmail)
        .single()

      if (profileError || !profile) {
        const error = `Usuário não encontrado: ${userEmail}`
        secureLogger.error("❌ " + error, { profileError })
        return { success: false, error }
      }

      const now = new Date()
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias

      // 2. Criar/Atualizar subscription
      await this.upsertSubscription(profile.id, planType, {
        paymentId: paymentData.paymentId,
        startedAt: now,
        expiresAt,
        lastPaymentDate: paymentData.dateApproved || now.toISOString(),
        lastPaymentAmount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod
      })

      // 3. Atualizar perfil do usuário
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          plan: planType,
          subscription_status: 'active',
          updated_at: now.toISOString(),
          last_payment_id: paymentData.paymentId
        })
        .eq('id', profile.id)

      if (updateError) {
        // Rollback: desativar subscription se perfil falhou
        await this.cancelUserSubscription(profile.id)
        throw new Error(`Falha ao atualizar perfil: ${updateError.message}`)
      }

      secureLogger.info("✅ Pagamento processado com sucesso!", {
        userId: profile.id,
        email: userEmail,
        oldPlan: profile.plan,
        newPlan: planType,
        paymentId: paymentData.paymentId
      })

      return {
        success: true,
        userId: profile.id,
        plan: planType
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      secureLogger.error("❌ Erro ao processar pagamento", { error: errorMsg, userEmail })
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Cancela a assinatura de um usuário (reembolso, cancelamento)
   */
  async cancelUserSubscription(userId: string): Promise<void> {
    const now = new Date()

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: now.toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')

    await supabaseAdmin
      .from('profiles')
      .update({
        plan: 'free',
        subscription_status: 'cancelled',
        updated_at: now.toISOString()
      })
      .eq('id', userId)

    secureLogger.info("✅ Assinatura cancelada", { userId })
  }

  /**
   * Identifica o tipo de plano a partir de múltiplas fontes
   */
  identifyPlanType(
    metadata?: { plan_type?: string },
    externalReference?: string,
    amount?: number
  ): PlanType {
    // 1. Prioridade: metadata (mais confiável)
    if (metadata?.plan_type && ['starter', 'pro'].includes(metadata.plan_type)) {
      secureLogger.info("✅ Plano identificado via metadata", { plan: metadata.plan_type })
      return metadata.plan_type as PlanType
    }

    // 2. Fallback: external_reference
    if (externalReference) {
      const [extractedPlan] = externalReference.split("_")
      if (['starter', 'pro'].includes(extractedPlan)) {
        secureLogger.info("✅ Plano identificado via external_reference", {
          plan: extractedPlan,
          ref: externalReference
        })
        return extractedPlan as PlanType
      }
    }

    // 3. Último recurso: valor
    if (amount !== undefined) {
      secureLogger.warn("⚠️ Identificando plano pelo valor (fallback)", { amount })

      if (amount >= 144.9 && amount <= 154.9) { // Pro: R$ 149,90 ± 5
        return "pro"
      } else if (amount >= 0.5 && amount <= 1.5) { // Starter: R$ 1,00 ± 0.5
        return "starter"
      }

      secureLogger.warn("⚠️ Valor não corresponde a nenhum plano", {
        amount,
        fallback: "starter"
      })
    }

    return "starter" // Default
  }

  /**
   * Cria ou atualiza uma subscription
   */
  private async upsertSubscription(
    userId: string,
    planType: PlanType,
    data: {
      paymentId: string
      startedAt: Date
      expiresAt: Date
      lastPaymentDate: string
      lastPaymentAmount: number
      paymentMethod: string
      subscriptionId?: string
    }
  ): Promise<void> {
    const now = new Date()

    // Verificar se já existe subscription ativa
    const { data: existingActiveSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', now.toISOString())
      .maybeSingle()

    if (existingActiveSub) {
      // Atualizar existente
      await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_type: planType,
          mercadopago_payment_id: data.paymentId,
          mercadopago_subscription_id: data.subscriptionId,
          expires_at: data.expiresAt.toISOString(),
          last_payment_date: data.lastPaymentDate,
          last_payment_amount: data.lastPaymentAmount,
          payment_method: data.paymentMethod,
          updated_at: now.toISOString()
        })
        .eq('id', existingActiveSub.id)

      secureLogger.info("✅ Subscription atualizada", {
        subscriptionId: existingActiveSub.id,
        plan: planType
      })
    } else {
      // Criar nova
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          mercadopago_payment_id: data.paymentId,
          mercadopago_subscription_id: data.subscriptionId,
          started_at: data.startedAt.toISOString(),
          expires_at: data.expiresAt.toISOString(),
          last_payment_date: data.lastPaymentDate,
          last_payment_amount: data.lastPaymentAmount,
          payment_method: data.paymentMethod,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })

      secureLogger.info("✅ Subscription criada", { userId, plan: planType })
    }
  }
}
