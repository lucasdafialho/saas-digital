import { supabase, supabaseAdmin, type Subscription as DBSubscription } from './supabase'
import { PLANS } from './mercadopago'

export interface Subscription {
  id: string
  userId: string
  planType: 'starter' | 'pro'
  status: 'active' | 'cancelled' | 'expired'
  mercadopagoSubscriptionId: string | null
  startedAt: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export async function getUserActiveSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_type, status, mercadopago_subscription_id, started_at, expires_at, created_at, updated_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  const sub = data as unknown as DBSubscription

  return {
    id: sub.id,
    userId: sub.user_id,
    planType: sub.plan_type,
    status: sub.status,
    mercadopagoSubscriptionId: sub.mercadopago_subscription_id,
    startedAt: sub.started_at,
    expiresAt: sub.expires_at,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at
  }
}

export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_type, status, mercadopago_subscription_id, started_at, expires_at, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.map(item => {
    const sub = item as unknown as DBSubscription
    return {
      id: sub.id,
      userId: sub.user_id,
      planType: sub.plan_type,
      status: sub.status,
      mercadopagoSubscriptionId: sub.mercadopago_subscription_id,
      startedAt: sub.started_at,
      expiresAt: sub.expires_at,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at
    }
  })
}

export async function createSubscription(
  userId: string,
  planType: 'starter' | 'pro',
  mercadopagoSubscriptionId?: string
): Promise<Subscription> {
  const plan = PLANS[planType]
  const expiresAt = plan ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_type: planType,
      status: 'active',
      mercadopago_subscription_id: mercadopagoSubscriptionId || null,
      started_at: new Date().toISOString(),
      expires_at: expiresAt
    } as any)
    .select('id, user_id, plan_type, status, mercadopago_subscription_id, started_at, expires_at, created_at, updated_at')
    .single()

  if (error || !data) {
    throw new Error('Erro ao criar assinatura')
  }

  const sub = data as unknown as DBSubscription

  return {
    id: sub.id,
    userId: sub.user_id,
    planType: sub.plan_type,
    status: sub.status,
    mercadopagoSubscriptionId: sub.mercadopago_subscription_id,
    startedAt: sub.started_at,
    expiresAt: sub.expires_at,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', subscriptionId)

  if (error) {
    throw new Error('Erro ao cancelar assinatura')
  }
}

export async function markSubscriptionExpired(subscriptionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', subscriptionId)

  if (error) {
    throw new Error('Erro ao expirar assinatura')
  }
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: 'active' | 'cancelled' | 'expired'
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', subscriptionId)

  if (error) {
    throw new Error('Erro ao atualizar status da assinatura')
  }
}

export async function validateUserPlan(userId: string): Promise<'free' | 'starter' | 'pro'> {
  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  if (!profile) {
    return 'free'
  }

  const typedProfile = profile as unknown as { plan: 'free' | 'starter' | 'pro' }
  const currentPlan = typedProfile.plan

  // Se o plano for pago, verificar se tem assinatura ativa
  if (currentPlan !== 'free') {
    const activeSubscription = await getUserActiveSubscription(userId)
    
    // Se não tem assinatura ativa, downgrade para free
    if (!activeSubscription) {
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free' } as any)
        .eq('id', userId)
      
      return 'free'
    }

    // Verificar se a assinatura expirou
    if (activeSubscription.expiresAt) {
      const expiresAt = new Date(activeSubscription.expiresAt)
      if (expiresAt < new Date()) {
        // Marcar assinatura como expirada
        await updateSubscriptionStatus(activeSubscription.id, 'expired')
        
        // Downgrade para free
        await supabaseAdmin
          .from('profiles')
          .update({ plan: 'free' } as any)
          .eq('id', userId)
        
        return 'free'
      }
    }

    return currentPlan
  }

  return 'free'
}
