"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Session, User as SupabaseUser } from "@supabase/supabase-js"
import { AuthApiError } from "@supabase/supabase-js"

interface User {
  id: string
  name: string
  email: string
  plan: "free" | "starter" | "pro"
  createdAt: string
  generationsUsed: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('📊 Carregando perfil do usuário:', authUser.id)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.warn('⚠️ Erro ao buscar perfil, usando dados do auth:', error.message)
      }

      if (error || !profile) {
        const fallbackUser = {
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
          email: authUser.email || '',
          plan: 'free' as const,
          createdAt: authUser.created_at,
          generationsUsed: 0
        }
        console.log('✅ Usando perfil fallback:', fallbackUser.email)
        return fallbackUser
      }

      const typedProfile = profile as any

      const userProfile = {
        id: typedProfile.id,
        name: typedProfile.name,
        email: typedProfile.email,
        plan: (typedProfile.plan || 'free') as "free" | "starter" | "pro",
        createdAt: typedProfile.created_at,
        generationsUsed: typedProfile.generations_used || 0
      }
      console.log('✅ Perfil carregado:', userProfile.email, 'plano:', userProfile.plan)
      return userProfile
    } catch (err) {
      console.error('❌ Exceção ao carregar perfil:', err)
      return {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
        email: authUser.email || '',
        plan: 'free',
        createdAt: authUser.created_at,
        generationsUsed: 0
      }
    }
  }

  const refreshUser = async () => {
    try {
      console.log("🔄 Atualizando dados do usuário...")
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error("❌ Erro ao atualizar usuário:", error)
        return
      }

      if (session?.user) {
        console.log("👤 Sessão encontrada, recarregando perfil...")
        const userProfile = await loadUserProfile(session.user)
        setUser(userProfile)
        console.log("✅ Usuário atualizado")
      } else {
        console.log("⚠️ Nenhuma sessão encontrada")
        setUser(null)
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar usuário:', err)
    }
  }

  useEffect(() => {
    let mounted = true

    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('⏱️ Auth timeout - forçando loading = false')
        setIsLoading(false)
      }
    }, 8000)

    const initAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticação...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Erro ao obter sessão:', error)
          if (mounted) {
            setUser(null)
            setIsLoading(false)
            clearTimeout(safetyTimeout)
          }
          return
        }

        if (mounted) {
          if (session?.user) {
            console.log('✅ Sessão encontrada:', session.user.email)
            const userProfile = await loadUserProfile(session.user)
            setUser(userProfile)
          } else {
            console.log('ℹ️ Nenhuma sessão ativa')
            setUser(null)
          }
          setIsLoading(false)
          clearTimeout(safetyTimeout)
        }
      } catch (err) {
        console.error('❌ Erro ao inicializar auth:', err)
        if (mounted) {
          setUser(null)
          setIsLoading(false)
          clearTimeout(safetyTimeout)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user')
      if (!mounted) return

      if (session?.user) {
        const userProfile = await loadUserProfile(session.user)
        setUser(userProfile)
      } else {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    if (data.session?.user) {
      const userProfile = await loadUserProfile(data.session.user)
      setUser(userProfile)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (signInError) throw signInError
        
        if (signInData.session?.user) {
          const userProfile = await loadUserProfile(signInData.session.user)
          setUser(userProfile)
        }
        return
      }
      throw error
    }

    if (data.session?.user) {
      const userProfile = await loadUserProfile(data.session.user)
      setUser(userProfile)
    } else if (data.user && !data.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (signInError) throw signInError
      
      if (signInData.session?.user) {
        const userProfile = await loadUserProfile(signInData.session.user)
        setUser(userProfile)
      }
    }
  }

  const logout = async () => {
    try {
      setUser(null)
      setIsLoading(true)
      
      await supabase.auth.signOut({ scope: 'global' })
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        const allCookies = document.cookie.split(';')
        for (const cookie of allCookies) {
          const cookieName = cookie.split('=')[0].trim()
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
        }
        
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/login'
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
