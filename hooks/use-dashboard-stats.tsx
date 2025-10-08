"use client"

import { useState, useEffect, useCallback } from "react"

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

  useEffect(() => {
    if (!userId) {
      return
    }

    let mounted = true
    let abortController = new AbortController()

    const fetchStats = async () => {
      try {
        if (mounted) {
          setIsLoading(true)
          setError(null)
        }
        
        const response = await fetch('/api/dashboard/stats', {
          signal: abortController.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error('Erro ao buscar estatísticas')
        }

        const data = await response.json()
        
        if (mounted) {
          setStats(data)
          setIsLoading(false)
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('Erro ao buscar estatísticas:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido')
          setIsLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      mounted = false
      abortController.abort()
    }
  }, [userId])

  const refresh = useCallback(async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/stats')
      
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

