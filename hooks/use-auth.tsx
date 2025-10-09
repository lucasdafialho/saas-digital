"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
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
  register: (name: string, email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const initializingRef = useRef(false)

  const loadUserProfile = useCallback(async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      const defaultUser = {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
        email: authUser.email || '',
        plan: 'free' as const,
        createdAt: authUser.created_at,
        generationsUsed: 0
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name, email, plan, created_at, generations_used')
        .eq('id', authUser.id)
        .maybeSingle()

      if (error || !profile) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            name: defaultUser.name,
            email: defaultUser.email,
            plan: 'free',
            generations_used: 0
          }, { onConflict: 'id' })

        if (upsertError) {
          console.error('Erro ao criar perfil:', upsertError)
        }

        return defaultUser
      }

      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        plan: (profile.plan || 'free') as "free" | "starter" | "pro",
        createdAt: profile.created_at,
        generationsUsed: profile.generations_used || 0
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      return {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
        email: authUser.email || '',
        plan: 'free',
        createdAt: authUser.created_at,
        generationsUsed: 0
      }
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const userProfile = await loadUserProfile(session.user)
        setUser(userProfile)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      setUser(null)
    }
  }, [loadUserProfile])

  useEffect(() => {
    if (initializingRef.current) return
    initializingRef.current = true

    let mounted = true
    let timeoutId: NodeJS.Timeout

    const initAuth = async () => {
      console.log('[AUTH] Iniciando autenticação...')
      
      timeoutId = setTimeout(() => {
        if (mounted && !isInitialized) {
          console.warn('[AUTH] Timeout atingido - forçando loading=false')
          setIsLoading(false)
          setIsInitialized(true)
        }
      }, 2000)

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[AUTH] Erro ao obter sessão:', error)
          throw error
        }

        if (!mounted) return

        if (session?.user) {
          console.log('[AUTH] Sessão encontrada, carregando perfil...')
          const userProfile = await loadUserProfile(session.user)
          if (mounted) {
            setUser(userProfile)
            setIsLoading(false)
            setIsInitialized(true)
            clearTimeout(timeoutId)
            console.log('[AUTH] Perfil carregado com sucesso')
          }
        } else {
          console.log('[AUTH] Nenhuma sessão encontrada')
          setUser(null)
          setIsLoading(false)
          setIsInitialized(true)
          clearTimeout(timeoutId)
        }
      } catch (err) {
        console.error('[AUTH] Erro ao inicializar auth:', err)
        if (mounted) {
          setUser(null)
          setIsLoading(false)
          setIsInitialized(true)
          clearTimeout(timeoutId)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH] Evento de autenticação:', event)
      
      if (!mounted || !isInitialized) {
        console.log('[AUTH] Ignorando evento - componente não montado ou não inicializado')
        return
      }

      if (event === 'SIGNED_OUT') {
        console.log('[AUTH] Usuário deslogado')
        setUser(null)
        return
      }

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        console.log('[AUTH] Atualizando perfil do usuário...')
        const userProfile = await loadUserProfile(session.user)
        if (mounted) {
          setUser(userProfile)
          console.log('[AUTH] Perfil atualizado')
        }
      } else if (!session?.user) {
        console.log('[AUTH] Sessão removida')
        setUser(null)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      initializingRef.current = false
    }
  }, [loadUserProfile, isInitialized])

  const login = useCallback(async (email: string, password: string) => {
    console.log('[AUTH] Iniciando login...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('[AUTH] Erro no login:', error)
      
      // Mensagens de erro amigáveis
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos. Verifique seus dados e tente novamente.')
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Por favor, confirme seu email antes de fazer login.')
      }
      if (error.message.includes('Too many requests')) {
        throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.')
      }
      
      throw new Error('Erro ao fazer login. Por favor, tente novamente.')
    }

    if (data.session?.user) {
      console.log('[AUTH] Login bem-sucedido, carregando perfil...')
      const userProfile = await loadUserProfile(data.session.user)
      setUser(userProfile)
      console.log('[AUTH] Perfil carregado após login')
    }
  }, [loadUserProfile])

  const register = useCallback(async (name: string, email: string, password: string) => {
    console.log('[AUTH] Iniciando registro...')
    
    // Usar URL de produção ou localhost baseado no ambiente
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
      : `${window.location.origin}/dashboard`
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: redirectUrl
      }
    })

    if (error) {
      console.error('[AUTH] Erro no registro:', error)
      
      // Mensagens de erro amigáveis
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        throw new Error('Este email já está cadastrado. Faça login ou recupere sua senha.')
      }
      if (error.message.includes('Password should contain at least one character of each') || 
          error.message.includes('Password should be at least') ||
          error.message.includes('Signup requires a valid password') ||
          error.message.includes('weak password')) {
        throw new Error('A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais (!@#$%...).')
      }
      if (error.message.includes('Invalid email')) {
        throw new Error('Por favor, insira um email válido.')
      }
      if (error.message.includes('Too many requests') || error.message.includes('rate limit')) {
        throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.')
      }
      
      throw new Error('Erro ao criar conta. Por favor, tente novamente.')
    }

    // Se tem sessão, o email não precisa de confirmação (auto-confirm está ativo)
    if (data.session?.user) {
      console.log('[AUTH] Registro bem-sucedido com sessão (sem confirmação de email)')
      const userProfile = await loadUserProfile(data.session.user)
      setUser(userProfile)
      return { needsEmailConfirmation: false }
    }
    
    // Se tem usuário mas não tem sessão, precisa confirmar email
    if (data.user && !data.session) {
      console.log('[AUTH] Registro bem-sucedido, aguardando confirmação de email')
      return { needsEmailConfirmation: true }
    }

    return { needsEmailConfirmation: false }
  }, [loadUserProfile])

  const logout = useCallback(async () => {
    try {
      console.log('[AUTH] Iniciando logout...')
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
        
        console.log('[AUTH] Logout concluído, redirecionando...')
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      }
    } catch (error) {
      console.error('[AUTH] Erro ao fazer logout:', error)
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/login'
      }
    }
  }, [])

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
