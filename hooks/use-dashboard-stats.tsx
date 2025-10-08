"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface DashboardStats {
  stats: {
    copiesGenerated: {
      value: number
      change: number
      changeType: 'positive' | 'negative'
    }
    productsAnalyzed: {
      value: number
      change: number
      changeType: 'positive' | 'negative'
    }
  }
  recentActivities: Array<{
    id: string
    action: string
    description: string
    time: string
    type: string
    icon: string
    createdAt: string
  }>
  performance: {
    copiesGenerated: number
    successRate: number
    productsAnalyzed: number
    change: number
  }
}

export function useDashboardStats(userId?: string) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!userId) {
      setStats(null)
      setIsLoading(false)
      return
    }

    if (fetchingRef.current) {
      console.log('[STATS] Requisição já em andamento, ignorando...')
      return
    }

    let mounted = true
    const debounceTimeout = setTimeout(() => {
      if (!mounted) return

      const fetchStats = async () => {
        if (fetchingRef.current) return
        
        try {
          fetchingRef.current = true
          
          if (abortControllerRef.current) {
            abortControllerRef.current.abort()
          }
          
          abortControllerRef.current = new AbortController()
          
          if (mounted) {
            setIsLoading(true)
            setError(null)
          }
          
          console.log('[STATS] Buscando estatísticas...')
          const response = await fetch('/api/dashboard/stats', {
            signal: abortControllerRef.current.signal,
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          
          if (!response.ok) {
            throw new Error('Erro ao buscar estatísticas')
          }

          const data = await response.json()
          
          if (mounted) {
            console.log('[STATS] Estatísticas carregadas com sucesso')
            setStats(data)
            setIsLoading(false)
          }
        } catch (err) {
          if ((err as any)?.name === 'AbortError') {
            console.log('[STATS] Requisição cancelada')
            if (mounted) setIsLoading(false)
            return
          }
          console.error('[STATS] Erro ao buscar estatísticas:', err)
          if (mounted) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido')
            setIsLoading(false)
          }
        } finally {
          fetchingRef.current = false
        }
      }

      fetchStats()
    }, 500)

    return () => {
      mounted = false
      clearTimeout(debounceTimeout)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      fetchingRef.current = false
    }
  }, [userId])

  const refresh = useCallback(async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  return {
    stats,
    isLoading,
    error,
    refresh
  }
}

