"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { PLANS } from "@/lib/mercadopago"
import { supabase } from "@/lib/supabase"

export function useGenerations() {
  const { user, refreshUser } = useAuth()
  const [generationsUsed, setGenerationsUsed] = useState(0)

  useEffect(() => {
    if (user) {
      setGenerationsUsed(user.generationsUsed || 0)
    }
  }, [user])

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
    if (!user) return

    const next = generationsUsed + 1
    
    // Atualizar no Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ generations_used: next })
      .eq('id', user.id)

    if (error) {
      console.error('Erro ao incrementar gerações:', error)
      return
    }

    setGenerationsUsed(next)
    await refreshUser()
  }

  const resetGenerations = async () => {
    if (!user) return

    // Atualizar no Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ generations_used: 0 })
      .eq('id', user.id)

    if (error) {
      console.error('Erro ao resetar gerações:', error)
      return
    }

    setGenerationsUsed(0)
    await refreshUser()
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

