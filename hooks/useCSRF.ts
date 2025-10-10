"use client"

import { useState, useEffect } from 'react'

interface CSRFResponse {
  csrfToken: string
  expiresIn: number
}

/**
 * Hook para obter e gerenciar token CSRF
 *
 * @example
 * const { token, loading, error, refresh } = useCSRF()
 *
 * // Usar em requisição
 * fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'X-CSRF-Token': token
 *   }
 * })
 */
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchToken = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/csrf-token')

      if (!response.ok) {
        throw new Error('Erro ao obter token CSRF')
      }

      const data: CSRFResponse = await response.json()
      setToken(data.csrfToken)

      // Renovar token antes de expirar (55 minutos)
      setTimeout(() => {
        fetchToken()
      }, 55 * 60 * 1000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchToken()
  }, [])

  return {
    token,
    loading,
    error,
    refresh: fetchToken
  }
}

/**
 * Obter token CSRF de forma síncrona (para uso em funções)
 *
 * @example
 * const token = await getCSRFToken()
 */
export async function getCSRFToken(): Promise<string> {
  const response = await fetch('/api/csrf-token')

  if (!response.ok) {
    throw new Error('Erro ao obter token CSRF')
  }

  const data: CSRFResponse = await response.json()
  return data.csrfToken
}

/**
 * Helper para fazer requisições com CSRF automaticamente
 *
 * @example
 * const response = await fetchWithCSRF('/api/user/change-password', {
 *   method: 'POST',
 *   body: JSON.stringify({ currentPassword, newPassword })
 * })
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Obter token CSRF
  const csrfToken = await getCSRFToken()

  // Adicionar token aos headers
  const headers = new Headers(options.headers)
  headers.set('X-CSRF-Token', csrfToken)
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers
  })
}
