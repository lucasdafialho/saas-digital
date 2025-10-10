import { createClient } from '@supabase/supabase-js'
import secureLogger from './logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type SecurityEventType =
  | 'login'
  | 'failed_login'
  | 'password_change'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'invalid_token'
  | 'webhook_validation_failed'
  | 'unauthorized_access'
  | 'account_deleted'
  | 'plan_changed'

export interface SecurityEvent {
  type: SecurityEventType
  userId?: string
  email?: string
  ip: string
  userAgent: string
  details?: Record<string, any>
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Registra evento de segurança no banco de dados
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const { type, userId, email, ip, userAgent, details, severity = 'low' } = event

    // Log no Winston
    secureLogger.security(`${type.toUpperCase()}`, {
      userId,
      email,
      ip,
      userAgent: userAgent.substring(0, 200), // Limitar tamanho
      severity
    })

    // Tentar salvar no banco (não bloquear se falhar)
    await supabase.from('security_audit_log').insert({
      event_type: type,
      user_id: userId,
      email,
      ip_address: ip,
      user_agent: userAgent.substring(0, 500),
      details,
      severity,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    // Não bloquear a aplicação se o log falhar
    secureLogger.error('Erro ao registrar evento de segurança', error)
  }
}

/**
 * Detecta tentativas de login suspeitas
 */
export async function detectSuspiciousLogin(
  email: string,
  ip: string
): Promise<{ suspicious: boolean; reason?: string }> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Buscar tentativas de login na última hora
    const { data: attempts } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('email', email)
      .in('event_type', ['login', 'failed_login'])
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!attempts || attempts.length === 0) {
      return { suspicious: false }
    }

    // Detectar múltiplos IPs
    const uniqueIPs = new Set(attempts.map(a => a.ip_address))
    if (uniqueIPs.size >= 3) {
      return {
        suspicious: true,
        reason: 'Múltiplos IPs detectados na última hora'
      }
    }

    // Detectar muitas tentativas falhadas
    const failedAttempts = attempts.filter(a => a.event_type === 'failed_login')
    if (failedAttempts.length >= 5) {
      return {
        suspicious: true,
        reason: 'Múltiplas tentativas de login falhadas'
      }
    }

    return { suspicious: false }
  } catch (error) {
    secureLogger.error('Erro ao detectar login suspeito', error)
    return { suspicious: false }
  }
}

/**
 * Obtém histórico de atividades de um usuário
 */
export async function getUserActivityHistory(
  userId: string,
  limit = 50
): Promise<any[]> {
  try {
    const { data } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return data || []
  } catch (error) {
    secureLogger.error('Erro ao buscar histórico de atividades', error)
    return []
  }
}

/**
 * Detecta anomalias em padrões de uso
 */
export async function detectAnomalies(userId: string): Promise<{
  hasAnomalies: boolean
  anomalies: string[]
}> {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: recentActivity } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', last24h)

    if (!recentActivity || recentActivity.length === 0) {
      return { hasAnomalies: false, anomalies: [] }
    }

    const anomalies: string[] = []

    // Detectar múltiplos IPs
    const uniqueIPs = new Set(recentActivity.map(a => a.ip_address))
    if (uniqueIPs.size >= 5) {
      anomalies.push(`${uniqueIPs.size} IPs diferentes nas últimas 24h`)
    }

    // Detectar horários incomuns (2h às 6h)
    const nightActivity = recentActivity.filter(a => {
      const hour = new Date(a.created_at).getHours()
      return hour >= 2 && hour <= 6
    })

    if (nightActivity.length >= 10) {
      anomalies.push('Atividade incomum em horário noturno')
    }

    // Detectar muitas requisições
    if (recentActivity.length >= 1000) {
      anomalies.push('Volume anormalmente alto de requisições')
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies
    }
  } catch (error) {
    secureLogger.error('Erro ao detectar anomalias', error)
    return { hasAnomalies: false, anomalies: [] }
  }
}

/**
 * Marca usuário como suspeito
 */
export async function flagSuspiciousUser(
  userId: string,
  reason: string
): Promise<void> {
  try {
    await logSecurityEvent({
      type: 'suspicious_activity',
      userId,
      ip: 'system',
      userAgent: 'automated-detection',
      details: { reason },
      severity: 'high'
    })

    // Você pode adicionar lógica adicional aqui, como:
    // - Enviar notificação para admin
    // - Bloquear conta temporariamente
    // - Exigir verificação adicional
  } catch (error) {
    secureLogger.error('Erro ao marcar usuário como suspeito', error)
  }
}
