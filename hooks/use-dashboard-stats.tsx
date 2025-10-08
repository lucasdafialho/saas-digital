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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

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

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const refresh = useCallback(() => {
    return fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refresh
  }
}

