"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { PLANS } from "@/lib/mercadopago"

const GEN_KEY = "konvexy_generations"

export function useGenerations() {
  const { user } = useAuth()
  const [generationsUsed, setGenerationsUsed] = useState(0)

  useEffect(() => {
    if (!user) return
    const all = typeof window !== 'undefined' ? window.localStorage.getItem(GEN_KEY) : null
    if (!all) return setGenerationsUsed(0)
    try {
      const map = JSON.parse(all) as Record<string, number>
      setGenerationsUsed(map[user.id] || 0)
    } catch {
      setGenerationsUsed(0)
    }
  }, [user])

  const persist = (count: number) => {
    if (!user || typeof window === 'undefined') return
    const all = window.localStorage.getItem(GEN_KEY)
    let map: Record<string, number> = {}
    try { map = all ? JSON.parse(all) : {} } catch { map = {} }
    map[user.id] = count
    window.localStorage.setItem(GEN_KEY, JSON.stringify(map))
  }

  const getGenerationLimit = () => {
    if (!user) return 0
    const planType = user.plan as "free" | "starter" | "pro"
    return PLANS[planType]?.limit || 0
  }

  const getRemainingGenerations = () => {
    const limit = getGenerationLimit()
    if (limit === -1) return -1
    return Math.max(0, limit - generationsUsed)
  }

  const canGenerate = () => {
    const remaining = getRemainingGenerations()
    return remaining === -1 || remaining > 0
  }

  const incrementGenerations = async () => {
    const next = generationsUsed + 1
    setGenerationsUsed(next)
    persist(next)
  }

  const resetGenerations = async () => {
    setGenerationsUsed(0)
    persist(0)
  }

  return {
    limit: getGenerationLimit(),
    used: generationsUsed,
    remaining: getRemainingGenerations(),
    canGenerate: canGenerate(),
    incrementGenerations,
    resetGenerations,
    planName: user?.plan || "free",
  }
}

