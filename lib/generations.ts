import { supabase, supabaseAdmin } from './supabase'

export type GenerationType = 'copy' | 'funnel' | 'ads' | 'canvas'

interface TrackGenerationParams {
  userId: string
  type: GenerationType
  metadata?: any
}

/**
 * Registra uma nova geração e incrementa o contador do usuário
 */
export async function trackGeneration({ userId, type, metadata }: TrackGenerationParams) {
  try {
    if (!supabaseAdmin) {
      console.error('❌ Supabase Admin não configurado')
      return { success: false, error: 'Configuração do servidor incompleta' }
    }

    // Registrar a geração
    const { data: generation, error: genError } = await supabaseAdmin
      .from('generations')
      .insert({
        user_id: userId,
        type,
        metadata,
      })
      .select()
      .single()

    if (genError) {
      console.error('❌ Erro ao registrar geração:', genError)
      return { success: false, error: genError.message }
    }

    // Incrementar contador do usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('generations_used')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return { success: false, error: userError.message }
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        generations_used: (user.generations_used || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Erro ao atualizar contador:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log('✅ Geração registrada com sucesso:', generation.id)
    return { success: true, generation }
  } catch (error) {
    console.error('❌ Erro ao rastrear geração:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Verifica se o usuário pode gerar mais conteúdo baseado no plano
 */
export async function canUserGenerate(userId: string): Promise<{ canGenerate: boolean; reason?: string; user?: any }> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('plan, generations_used')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Erro ao verificar limite:', error)
      return { canGenerate: false, reason: 'Erro ao verificar usuário' }
    }

    const limits = {
      free: 5,
      starter: 50,
      pro: Infinity
    }

    const limit = limits[user.plan as keyof typeof limits] || 0
    const used = user.generations_used || 0

    if (used >= limit) {
      return { 
        canGenerate: false, 
        reason: `Limite de ${limit} gerações atingido. Faça upgrade do seu plano.`,
        user 
      }
    }

    return { canGenerate: true, user }
  } catch (error) {
    console.error('❌ Erro ao verificar limite:', error)
    return { canGenerate: false, reason: 'Erro ao verificar limite' }
  }
}

/**
 * Obtém o histórico de gerações do usuário
 */
export async function getUserGenerations(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Erro ao buscar gerações:', error)
      return { success: false, error: error.message }
    }

    return { success: true, generations: data }
  } catch (error) {
    console.error('❌ Erro ao buscar gerações:', error)
    return { success: false, error: String(error) }
  }
}
