"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { getErrorMessage, isValidEmail, isValidPassword } from "@/lib/error-messages"
import { useCSRF } from "@/hooks/use-csrf"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { login } = useAuth()
  const router = useRouter()
  const { token: csrfToken, loading: csrfLoading } = useCSRF()

  useEffect(() => {
    setIsLoading(false)
    setError("")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validações no frontend
    if (!email || !password) {
      setError("Por favor, preencha email e senha.")
      setIsLoading(false)
      return
    }

    if (!isValidEmail(email)) {
      setError("Por favor, insira um email válido.")
      setIsLoading(false)
      return
    }

    const passwordValidation = isValidPassword(password)
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || "Senha inválida.")
      setIsLoading(false)
      return
    }

    try {
      // Verifica se o token CSRF está disponível
      if (!csrfToken) {
        setError("Erro ao carregar página. Recarregue e tente novamente.")
        setIsLoading(false)
        return
      }

      // Verifica rate limit
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Muitas tentativas de login. Aguarde ${data.retryAfter || 60} segundos.`)
        } else {
          setError(getErrorMessage(data.error || 'Erro ao fazer login'))
        }
        setIsLoading(false)
        return
      }

      // Faz o login
      await login(email, password)
      router.replace("/dashboard")
    } catch (err) {
      console.error('Erro no login:', err)
      setError(getErrorMessage(err))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img src="/konvexy/konvexy-logo.png" alt="Konvexy" className="h-36 w-auto" />
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
            <CardDescription>Entre na sua conta para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Lembrar de mim
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading || csrfLoading}
              >
                {isLoading ? "Entrando..." : csrfLoading ? "Carregando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Criar conta
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  )
}
