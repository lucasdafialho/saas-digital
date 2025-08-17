"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  name: string
  email: string
  plan: "starter" | "pro"
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = () => {
      const userData = localStorage.getItem("marketpro_user")
      if (userData) {
        setUser(JSON.parse(userData))
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    console.log("[v0] Função login chamada com:", email, password)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock authentication - in real app, this would be an API call
    if (email === "demo@marketpro.com" && password === "demo123") {
      const userData: User = {
        id: "1",
        name: "Usuário Demo",
        email: email,
        plan: "pro",
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem("marketpro_user", JSON.stringify(userData))
      setUser(userData)
      console.log("[v0] Login demo realizado com sucesso")
    } else if (email === "zshotbr@gmail.com" && password === "admin123") {
      const userData: User = {
        id: "2",
        name: "Admin User",
        email: email,
        plan: "pro",
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem("marketpro_user", JSON.stringify(userData))
      setUser(userData)
      console.log("[v0] Login admin realizado com sucesso")
    } else {
      console.log("[v0] Credenciais inválidas:", email, password)
      throw new Error("Credenciais inválidas")
    }
  }

  const register = async (name: string, email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const userData: User = {
      id: Date.now().toString(),
      name,
      email,
      plan: "starter",
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem("marketpro_user", JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("marketpro_user")
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
