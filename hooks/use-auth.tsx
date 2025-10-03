"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  name: string
  email: string
  plan: "free" | "starter" | "pro"
  createdAt: string
  generationsUsed?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "konvexy_user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      try {
        const parsed: User = JSON.parse(raw)
        setUser(parsed)
      } catch {}
    }
    setIsLoading(false)
  }, [])

  const persist = (u: User | null) => {
    if (typeof window === 'undefined') return
    if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    else window.localStorage.removeItem(STORAGE_KEY)
  }

  const login = async (email: string, password: string) => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (!raw) throw new Error('Email ou senha inválidos')
    const existing: User = JSON.parse(raw)
    if (existing.email !== email) throw new Error('Email ou senha inválidos')
    setUser(existing)
  }

  const register = async (name: string, email: string, password: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      plan: 'free',
      createdAt: new Date().toISOString(),
      generationsUsed: 0,
    }
    persist(newUser)
    setUser(newUser)
  }

  const logout = async () => {
    persist(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
