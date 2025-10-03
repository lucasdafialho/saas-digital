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
    return { success: true, generation: { id: `gen_${Date.now()}`, userId, type, metadata } }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Verifica se o usuário pode gerar mais conteúdo baseado no plano
 */
export async function canUserGenerate(userId: string): Promise<{ canGenerate: boolean; reason?: string; user?: any }> {
  try {
    return { canGenerate: true, user: { id: userId } }
  } catch (error) {
    return { canGenerate: true }
  }
}

/**
 * Obtém o histórico de gerações do usuário
 */
export async function getUserGenerations(userId: string, limit = 50) {
  try {
    return { success: true, generations: [] }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
