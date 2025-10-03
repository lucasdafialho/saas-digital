"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, Loader2, Sparkles, Shield, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PLANS } from "@/lib/mercadopago"
import { useSearchParams, useRouter } from "next/navigation"

export default function PlanosPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard/planos")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const subscriptionSuccess = searchParams.get("subscription")
    const paymentId = searchParams.get("payment_id")
    const paymentStatus = searchParams.get("status")

    // Verificar retorno de pagamento do Checkout Pro
    if (paymentId && paymentStatus === "approved") {
      const checkPayment = async () => {
        try {
          const response = await fetch(`/api/mercadopago/check-payment?payment_id=${paymentId}`)
          if (response.ok) {
            const data = await response.json()
            console.log("Pagamento verificado:", data)
            
            if (data.status === "approved") {
              setIsNewUser(true)
              // Atualizar plano do usuário no localStorage
              const userData = localStorage.getItem("marketpro_user")
              if (userData) {
                const user = JSON.parse(userData)
                user.plan = data.planType
                localStorage.setItem("marketpro_user", JSON.stringify(user))
              }
              
              setTimeout(() => {
                window.location.href = "/dashboard?payment=success"
              }, 2000)
            }
          }
        } catch (error) {
          console.error("Erro ao verificar pagamento:", error)
        }
      }
      checkPayment()
    }

    // Verificar retorno de assinatura
    if (subscriptionSuccess === "success") {
      setIsNewUser(true)
      setTimeout(() => {
        window.location.href = "/dashboard?subscription=success"
      }, 2000)
    }
  }, [searchParams])

  const handleSelectPlan = async (planType: "starter" | "pro", paymentType: "subscription" | "single") => {
    if (!user?.email) {
      alert("Você precisa estar logado para assinar um plano")
      return
    }

    setLoading(planType)

    try {
      const endpoint = paymentType === "subscription" 
        ? "/api/mercadopago/create-subscription"
        : "/api/mercadopago/create-payment"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          userEmail: user.email,
          userName: user.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao processar pagamento")
      }

      const { initPoint } = await response.json()

      if (initPoint) {
        window.location.href = initPoint
      } else {
        throw new Error("Link de pagamento não encontrado")
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      alert("Erro ao processar seu pagamento. Tente novamente.")
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      id: "starter",
      name: PLANS.starter.name,
      price: PLANS.starter.price,
      description: "Ideal para começar com marketing digital",
      features: PLANS.starter.features,
      icon: Zap,
      color: "bg-primary/10",
      iconColor: "text-primary",
      buttonVariant: "outline" as const,
      popular: false,
      showButton: true,
    },
    {
      id: "pro",
      name: PLANS.pro.name,
      price: PLANS.pro.price,
      description: "Para profissionais que querem resultados máximos",
      features: PLANS.pro.features,
      icon: Crown,
      color: "bg-primary",
      iconColor: "text-white",
      buttonVariant: "default" as const,
      popular: true,
      showButton: true,
    },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20" data-animate>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {isNewUser && (
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-xl" data-animate>
            <CardHeader className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Pagamento confirmado! 🎉</CardTitle>
                  <CardDescription className="text-primary-foreground/90 mt-1">
                    Redirecionando para o dashboard...
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="text-center space-y-4">
          <Badge className="px-3 py-1.5 text-xs" variant="secondary">
            <TrendingUp className="w-3 h-3 mr-1.5" />
            Planos mensais flexíveis
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Escolha seu Plano
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Transforme seu marketing digital com o poder da inteligência artificial.
            Cancele quando quiser, sem compromisso.
          </p>
        </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isCurrentPlan = user?.plan === plan.id
          const isLoading = loading === plan.id

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 group ${
                plan.popular
                  ? "border-2 border-primary shadow-xl hover:shadow-2xl bg-gradient-to-br from-background to-primary/5"
                  : "border hover:shadow-xl hover:border-primary/50"
              }`}
              data-animate
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary"></div>
              )}
              {plan.popular && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 border-0 shadow-md px-2.5 py-0.5 text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4 pt-8">
                <div className={`w-16 h-16 ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className={`w-8 h-8 ${plan.iconColor}`} />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-muted-foreground font-medium">R$</span>
                    <span className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      {plan.price.toFixed(2).split('.')[0]}
                    </span>
                    <div className="flex flex-col items-start">
                      <span className="text-base font-bold text-foreground">,{plan.price.toFixed(2).split('.')[1]}</span>
                      <span className="text-xs text-muted-foreground">/mês</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 group/item">
                      <div className="w-5 h-5 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Check className="w-3 h-3 text-white font-bold" />
                      </div>
                      <span className="text-foreground text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-border">
                  {isCurrentPlan ? (
                    <Badge className="w-full justify-center py-3 text-sm font-semibold" variant="secondary">
                      <Check className="w-4 h-4 mr-2" />
                      Plano Atual
                    </Badge>
                  ) : plan.showButton ? (
                    <Button
                      className={`w-full py-5 text-base font-bold shadow-lg ${
                        plan.popular 
                          ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white" 
                          : ""
                      }`}
                      variant={plan.buttonVariant}
                      onClick={() => handleSelectPlan(plan.id as "starter" | "pro", "single")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          Assinar {plan.name}
                          <Sparkles className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="max-w-4xl mx-auto space-y-6 mt-12" data-animate>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl text-foreground">
              Métodos de Pagamento Aceitos
            </CardTitle>
            <CardDescription className="text-sm mt-1">Escolha como preferir pagar - 100% Seguro via Mercado Pago</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-background rounded-lg border border-primary/50 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-foreground text-center">PIX</span>
                <p className="text-xs text-muted-foreground mt-1 text-center">Pagamento instantâneo</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-background rounded-lg border border-primary/50 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-foreground text-center">Cartão de Crédito</span>
                <p className="text-xs text-muted-foreground mt-1 text-center">Até 12x sem juros</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-background rounded-lg border border-primary/50 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-foreground text-center">Cartão de Débito</span>
                <p className="text-xs text-muted-foreground mt-1 text-center">Aprovação imediata</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-background rounded-lg border border-primary/50 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-foreground text-center">Boleto Bancário</span>
                <p className="text-xs text-muted-foreground mt-1 text-center">Vence em 3 dias</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/30">
              <p className="text-sm text-center leading-relaxed">
                <span className="inline-flex items-center gap-1.5 text-primary font-bold">
                  <Shield className="w-4 h-4" />
                  Pagamento 100% Seguro
                </span>
                <br />
                <span className="text-muted-foreground text-xs">
                  Todos os pagamentos são processados pelo Mercado Pago com máxima segurança.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent to-background border shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">Perguntas Frequentes</CardTitle>
            <CardDescription className="text-sm mt-1">Tire suas dúvidas sobre nossos planos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background p-4 rounded-lg border-l-4 border-primary">
              <h4 className="font-bold text-foreground mb-2 text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Posso cancelar a qualquer momento?
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Sim! Sem multas ou taxas de cancelamento. Seu plano permanece ativo até o fim do período pago.
              </p>
            </div>
            <div className="bg-background p-4 rounded-lg border-l-4 border-primary">
              <h4 className="font-bold text-foreground mb-2 text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Como funciona a cobrança?
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                A cobrança é mensal. Você escolhe o método de pagamento e pode cancelar quando quiser.
              </p>
            </div>
            <div className="bg-background p-4 rounded-lg border-l-4 border-primary">
              <h4 className="font-bold text-foreground mb-2 text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Quais métodos de pagamento são aceitos?
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Aceitamos PIX, Cartão de Crédito (até 12x), Cartão de Débito e Boleto Bancário via Mercado Pago.
              </p>
            </div>
            <div className="bg-background p-4 rounded-lg border-l-4 border-primary">
              <h4 className="font-bold text-foreground mb-2 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                O pagamento é seguro?
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                100% seguro! Todos os pagamentos são processados pelo Mercado Pago, uma das plataformas mais confiáveis do Brasil. Seus dados estão protegidos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}

