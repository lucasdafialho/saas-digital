import { supabaseAdmin } from './supabase-client'

export interface DashboardMetrics {
  totalGenerations: number
  monthlyGenerations: number
  copyGenerations: number
  adsGenerations: number
  canvasGenerations: number
  funnelGenerations: number
  last7DaysGenerations: number
  monthlyGrowth: number
}

export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin não configurado')
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalResult,
    monthlyResult,
    lastMonthResult,
    last7DaysResult,
    copyResult,
    adsResult,
    canvasResult,
    funnelResult
  ] = await Promise.all([
    supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startOfMonth.toISOString()),
    supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', lastMonth.toISOString()).lte('created_at', endOfLastMonth.toISOString()),
    supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', last7Days.toISOString()),
    supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'copy'),
    supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'ads'),
    supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'canvas'),
    supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'funnel')
  ])

  const totalGenerations = totalResult.count || 0
  const monthlyGenerations = monthlyResult.count || 0
  const lastMonthGenerations = lastMonthResult.count || 0
  const last7DaysGenerations = last7DaysResult.count || 0

  const monthlyGrowth = lastMonthGenerations > 0
    ? Math.round(((monthlyGenerations - lastMonthGenerations) / lastMonthGenerations) * 100)
    : monthlyGenerations > 0 ? 100 : 0

  return {
    totalGenerations,
    monthlyGenerations,
    copyGenerations: copyResult.count || 0,
    adsGenerations: adsResult.count || 0,
    canvasGenerations: canvasResult.count || 0,
    funnelGenerations: funnelResult.count || 0,
    last7DaysGenerations,
    monthlyGrowth
  }
}

export async function getRecentActivities(userId: string, limit: number = 10) {
  if (!supabaseAdmin) {
    console.error('Supabase Admin não configurado')
    return []
  }

  const { data, error } = await supabaseAdmin
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Erro ao buscar atividades recentes:', error)
    return []
  }

  return data || []
}

export function getActivityLabel(type: string): string {
  const labels: Record<string, string> = {
    'copy': 'Copy gerada',
    'ads': 'Campanha de anúncios criada',
    'canvas': 'Canvas gerado',
    'funnel': 'Funil criado'
  }
  return labels[type] || 'Ação realizada'
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'Agora'
  if (diffInMinutes < 60) return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`
  if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`
  if (diffInDays === 1) return '1 dia atrás'
  if (diffInDays < 30) return `${diffInDays} dias atrás`
  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'} atrás`
}

