import { supabaseAdmin as _supabaseAdmin } from './supabase'

/**
 * Retorna o cliente Supabase Admin com garantia de tipo
 * Lança erro se não estiver configurado
 */
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurado - verifique as variáveis de ambiente')
  }
  return _supabaseAdmin
}

// Export como supabaseAdmin para facilitar imports
export const supabaseAdmin = getSupabaseAdmin()
