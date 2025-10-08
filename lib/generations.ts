import { getSupabaseAdmin } from './supabase-admin'
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
    console.log('📝 Iniciando tracking de geração:', { userId: params.userId, type: params.type })
    
    const saved = await saveGeneration(params.userId, params.type, params.metadata || {})
    console.log('✅ Geração salva, ID:', saved?.id)
    
    await incrementGenerationCount(params.userId)
    console.log('✅ Contador incrementado')
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao rastrear geração:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    throw error
  }
}

export async function saveGeneration(
  userId: string,
  type: 'ads' | 'copy' | 'funnel' | 'canvas',
  content: any
) {
  const supabaseAdmin = getSupabaseAdmin()
  
  console.log('💾 Salvando geração:', { userId, type, hasContent: !!content })
  
  const { data, error } = await supabaseAdmin
    .from('generations')
    .insert({
      user_id: userId,
      type,
      content
    })
    .select()

  if (error) {
    console.error('❌ Erro ao salvar geração no banco:', error)
    throw error
  }

  if (!data || data.length === 0) {
    console.error('❌ Nenhum dado retornado após insert')
    throw new Error('Falha ao salvar geração - nenhum dado retornado')
  }

  console.log('✅ Geração salva com sucesso:', data[0]?.id)
  return data[0]
}

export async function getUserGenerations(userId: string, type?: 'ads' | 'copy' | 'funnel' | 'canvas') {
  const supabaseAdmin = getSupabaseAdmin()
  let query = supabaseAdmin
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
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
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
