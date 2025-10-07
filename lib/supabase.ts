// Re-export do cliente Supabase
export { supabase, supabaseAdmin } from './supabase-client'

// Tipos para as tabelas
export interface Profile {
  id: string
  email: string
  name: string
  plan: 'free' | 'starter' | 'pro'
  generations_used: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_type: 'starter' | 'pro'
  status: 'active' | 'cancelled' | 'expired'
  mercadopago_subscription_id: string | null
  started_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Generation {
  id: string
  user_id: string
  type: 'ads' | 'copy' | 'funnel' | 'canvas'
  content: any
  created_at: string
}
