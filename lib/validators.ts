import { z } from 'zod'

// Validação para geração de copy
export const generateCopySchema = z.object({
  type: z.enum(['headline', 'email', 'social', 'ad', 'description']),
  product: z.string().min(1, 'Produto é obrigatório').max(200, 'Produto muito longo'),
  audience: z.string().min(1, 'Público é obrigatório').max(200, 'Público muito longo'),
  benefit: z.string().min(1, 'Benefício é obrigatório').max(200, 'Benefício muito longo'),
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'urgent', 'friendly']),
  context: z.string().max(500, 'Contexto muito longo').optional()
})

export type GenerateCopyInput = z.infer<typeof generateCopySchema>

// Validação para geração de funil
export const generateFunnelSchema = z.object({
  product: z.string().min(1, 'Produto é obrigatório').max(200),
  audience: z.string().min(1, 'Público é obrigatório').max(200),
  goal: z.string().min(1, 'Objetivo é obrigatório').max(200),
  budget: z.number().min(0, 'Orçamento deve ser positivo').optional(),
  context: z.string().max(1000, 'Contexto muito longo').optional()
})

export type GenerateFunnelInput = z.infer<typeof generateFunnelSchema>

// Validação para geração de ads
export const generateAdsSchema = z.object({
  product: z.string().min(1, 'Produto é obrigatório').max(200),
  audience: z.string().min(1, 'Público é obrigatório').max(200),
  platform: z.enum(['facebook', 'google', 'instagram', 'tiktok', 'linkedin']),
  objective: z.enum(['awareness', 'consideration', 'conversion']),
  budget: z.number().min(0).optional(),
  context: z.string().max(500).optional()
})

export type GenerateAdsInput = z.infer<typeof generateAdsSchema>

// Validação para Canvas
export const generateCanvasSchema = z.object({
  product: z.string().min(1, 'Produto é obrigatório').max(200),
  audience: z.string().min(1, 'Público é obrigatório').max(200),
  value_proposition: z.string().max(300).optional(),
  context: z.string().max(500).optional()
})

export type GenerateCanvasInput = z.infer<typeof generateCanvasSchema>

// Validação para autenticação
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
})

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo')
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
})

// Validação para atualização de perfil
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo').optional(),
  email: z.string().email('Email inválido').optional(),
  avatar_url: z.string().url('URL inválida').optional().nullable()
})

// Validação para webhook MercadoPago
export const mercadoPagoWebhookSchema = z.object({
  action: z.string(),
  api_version: z.string(),
  data: z.object({
    id: z.string()
  }),
  date_created: z.string(),
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(),
  user_id: z.string()
})

// Validação para criação de pagamento
export const createPaymentSchema = z.object({
  plan: z.enum(['starter', 'pro']),
  email: z.string().email('Email inválido')
})

// Validação para atualização de plano
export const updatePlanSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido'),
  plan: z.enum(['free', 'starter', 'pro']),
  subscriptionId: z.string().optional(),
  paymentId: z.string().optional()
})

// Helper para validar entrada de forma segura
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true; data: T
} | {
  success: false; error: string; issues: z.ZodIssue[]
} {
  try {
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Erro de validação',
        issues: error.errors
      }
    }
    return {
      success: false,
      error: 'Erro desconhecido na validação',
      issues: []
    }
  }
}

// Helper para validar entrada de forma assíncrona
export async function validateInputAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{
  success: true; data: T
} | {
  success: false; error: string; issues: z.ZodIssue[]
}> {
  try {
    const parsed = await schema.parseAsync(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Erro de validação',
        issues: error.errors
      }
    }
    return {
      success: false,
      error: 'Erro desconhecido na validação',
      issues: []
    }
  }
}
