import { supabase, supabaseAdmin } from './supabase'
import { checkGenerationLimit, incrementGenerationCount } from './generation-limits'

export interface Generation {
  id: string
  userId: string
  type: 'ads' | 'copy' | 'funnel' | 'canvas'
  content: any
  createdAt: string
}

export async function canUserGenerate(userId: string): Promise<{ canGenerate: boolean; reason?: string }> {
  try {
    const result = await checkGenerationLimit(userId, 'copy')
    return {
      canGenerate: result.allowed,
      reason: result.reason
    }
  } catch (error) {
    console.error('Erro ao verificar se usuário pode gerar:', error)
    return {
      canGenerate: false,
      reason: 'Erro ao verificar limites de geração'
    }
  }
}

export async function trackGeneration(params: {
  userId: string
  type: 'ads' | 'copy' | 'funnel' | 'canvas'
  metadata?: any
}): Promise<void> {
  try {
    await saveGeneration(params.userId, params.type, params.metadata || {})
    await incrementGenerationCount(params.userId)
  } catch (error) {
    console.error('Erro ao rastrear geração:', error)
  }
}

export async function saveGeneration(
  userId: string,
  type: 'ads' | 'copy' | 'funnel' | 'canvas',
  content: any
) {
  const { data, error } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      type,
      content
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar geração:', error)
    throw error
  }

  return data
}

export async function getUserGenerations(userId: string, type?: 'ads' | 'copy' | 'funnel' | 'canvas') {
  let query = supabase
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar gerações:', error)
    throw error
  }

  return data.map(gen => ({
    id: gen.id,
    userId: gen.user_id,
    type: gen.type,
    content: gen.content,
    createdAt: gen.created_at
  })) as Generation[]
}

export async function getGenerationById(id: string) {
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar geração:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    content: data.content,
    createdAt: data.created_at
  } as Generation
}
