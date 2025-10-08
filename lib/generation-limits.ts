import { supabase } from './supabase'
import { getSupabaseAdmin } from './supabase-admin'
import { PLANS } from './mercadopago'
import { validateUserPlan } from './subscriptions'

export interface GenerationLimit {
  plan: 'free' | 'starter' | 'pro'
  monthlyLimit: number
  dailyLimit?: number
}

export const GENERATION_LIMITS: Record<string, GenerationLimit> = {
  free: {
    plan: 'free',
    monthlyLimit: PLANS.free.limit,
    dailyLimit: 5
  },
  starter: {
    plan: 'starter',
    monthlyLimit: PLANS.starter.limit,
    dailyLimit: 10
  },
  pro: {
    plan: 'pro',
    monthlyLimit: -1,
    dailyLimit: -1
  }
}

export async function checkGenerationLimit(userId: string, type: 'ads' | 'copy' | 'funnel' | 'canvas'): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const currentPlan = await validateUserPlan(userId)
    const limits = GENERATION_LIMITS[currentPlan]

    if (!limits) {
      return { allowed: false, reason: 'Plano inválido' }
    }

    if (limits.monthlyLimit === -1) {
      return { allowed: true }
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { count: monthlyCount } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    if ((monthlyCount || 0) >= limits.monthlyLimit) {
      return { 
        allowed: false, 
        reason: `Limite mensal de ${limits.monthlyLimit} gerações atingido`,
        remaining: 0
      }
    }

    const remaining = limits.monthlyLimit - (monthlyCount || 0)
    return { allowed: true, remaining }

  } catch (error) {
    console.error('Erro ao verificar limite de gerações:', error)
    return { allowed: false, reason: 'Erro ao verificar limites' }
  }
}

export async function incrementGenerationCount(userId: string): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('generations_used')
      .eq('id', userId)
      .single()

    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          generations_used: (profile.generations_used || 0) + 1,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', userId)
    }
  } catch (error) {
    console.error('Erro ao incrementar contador de gerações:', error)
  }
}

export async function resetMonthlyGenerations(): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    await supabaseAdmin
      .from('profiles')
      .update({ 
        generations_used: 0,
        updated_at: new Date().toISOString()
      } as any)
      .not('plan', 'eq', 'pro')

    console.log('Contadores mensais resetados com sucesso')
  } catch (error) {
    console.error('Erro ao resetar contadores mensais:', error)
  }
}

export async function getGenerationStats(userId: string): Promise<{
  used: number
  limit: number
  remaining: number
  percentage: number
  plan: string
}> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, generations_used')
      .eq('id', userId)
      .single()

    if (!profile) {
      throw new Error('Perfil não encontrado')
    }

    const typedProfile = profile as any
    const limits = GENERATION_LIMITS[typedProfile.plan]
    const used = typedProfile.generations_used || 0
    const limit = limits.monthlyLimit

    if (limit === -1) {
      return {
        used,
        limit: -1,
        remaining: -1,
        percentage: 0,
        plan: typedProfile.plan
      }
    }

    const remaining = Math.max(0, limit - used)
    const percentage = Math.min(100, (used / limit) * 100)

    return {
      used,
      limit,
      remaining,
      percentage,
      plan: typedProfile.plan
    }
  } catch (error) {
    console.error('Erro ao obter estatísticas de geração:', error)
    throw error
  }
}
