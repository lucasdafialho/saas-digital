export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          plan: 'free' | 'starter' | 'pro'
          generations_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          plan?: 'free' | 'starter' | 'pro'
          generations_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          plan?: 'free' | 'starter' | 'pro'
          generations_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          plan_type: 'starter' | 'pro'
          status?: 'active' | 'cancelled' | 'expired'
          mercadopago_subscription_id?: string | null
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'starter' | 'pro'
          status?: 'active' | 'cancelled' | 'expired'
          mercadopago_subscription_id?: string | null
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          type: 'ads' | 'copy' | 'funnel' | 'canvas'
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'ads' | 'copy' | 'funnel' | 'canvas'
          content: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'ads' | 'copy' | 'funnel' | 'canvas'
          content?: Json
          created_at?: string
        }
      }
    }
  }
}
