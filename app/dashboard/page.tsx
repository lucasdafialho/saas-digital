"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useGenerations } from "@/hooks/use-generations"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  Zap,
  Target,
  Users,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  Activity,
  Sparkles,
  Clock,
  Layers3,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, refreshUser, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { used, remaining, limit, planName } = useGenerations()
  const { stats: dashboardStats, isLoading: isLoadingStats, refresh: refreshStats } = useDashboardStats(user?.id)

  useEffect(() => {
    const subscriptionSuccess = new URLSearchParams(window.location.search).get("subscription")
    if (subscriptionSuccess === "success") {
      localStorage.removeItem("marketpro_pending_payment")
    }
  }, [router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const stats = useMemo(() => {
    if (!dashboardStats) {
      return [
        {
          title: "Copies Geradas",
          value: "0",
          change: "+0%",
          changeType: "positive" as const,
          icon: Zap,
          color: "bg-primary",
          comingSoon: false,
        },
        {
          title: "Taxa de Conversão",
          value: "Em breve",
          change: "",
          changeType: "positive" as const,
          icon: TrendingUp,
          color: "bg-muted",
          comingSoon: true,
        },
        {
          title: "Produtos Analisados",
          value: "0",
          change: "+0",
          changeType: "positive" as const,
          icon: Target,
          color: "bg-primary",
          comingSoon: false,
        },
        {
          title: "ROI Médio",
          value: "Em breve",
          change: "",
          changeType: "positive" as const,
          icon: DollarSign,
          color: "bg-muted",
          comingSoon: true,
        },
      ]
    }

    return [
      {
        title: "Copies Geradas",
        value: dashboardStats.stats.copiesGenerated.value.toString(),
        change: `${dashboardStats.stats.copiesGenerated.change >= 0 ? '+' : ''}${dashboardStats.stats.copiesGenerated.change}%`,
        changeType: dashboardStats.stats.copiesGenerated.changeType,
        icon: Zap,
        color: "bg-primary",
        comingSoon: false,
      },
      {
        title: "Taxa de Conversão",
        value: "Em breve",
        change: "",
        changeType: "positive" as const,
        icon: TrendingUp,
        color: "bg-muted",
        comingSoon: true,
      },
      {
        title: "Produtos Analisados",
        value: dashboardStats.stats.productsAnalyzed.value.toString(),
        change: `+${dashboardStats.stats.productsAnalyzed.change}`,
        changeType: dashboardStats.stats.productsAnalyzed.changeType,
        icon: Target,
        color: "bg-primary",
        comingSoon: false,
      },
      {
        title: "ROI Médio",
        value: "Em breve",
        change: "",
        changeType: "positive" as const,
        icon: DollarSign,
        color: "bg-muted",
        comingSoon: true,
      },
    ]
  }, [dashboardStats])

  const recentActivities = useMemo(() => {
    if (!dashboardStats || !dashboardStats.recentActivities.length) {
      return []
    }

    return dashboardStats.recentActivities.slice(0, 4).map(activity => ({
      action: activity.action,
      description: activity.description,
      time: activity.time,
      type: activity.type,
      icon: getIconForType(activity.type),
    }))
  }, [dashboardStats])

  function getIconForType(type: string) {
    switch (type) {
      case 'copy': return Zap
      case 'ads': return Target
      case 'canvas': return Layers3
      case 'funnel': return BarChart3
      default: return Activity
    }
  }

  const quickActions = [
    {
      title: "Gerar Copy",
      description: "Crie textos persuasivos com IA",
      icon: Zap,
      href: "/dashboard/copy-generator",
      color: "bg-primary",
      textColor: "text-white",
    },
    {
      title: "Explorar Produtos",
      description: "Descubra produtos nichados validados",
      icon: Target,
      href: "/dashboard/products",
      color: "bg-primary",
      textColor: "text-white",
    },
    {
      title: "Ver Analytics",
      description: "Em breve",
      icon: BarChart3,
      href: "/dashboard/analytics",
      color: "bg-muted",
      textColor: "text-muted-foreground",
    },
  ]

  return (
    <div className="min-h-screen space-y-8 pb-12" data-animate>
      <div className="border-b border-border pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Bem-vindo, {user?.name?.split(" ")[0] || "Usuário"}
            </h1>
            <p className="text-lg text-muted-foreground">
              Gerencie suas campanhas de marketing digital e acompanhe seus resultados
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {user?.plan === "pro" && (
              <Badge className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground">
                PLANO PRO
              </Badge>
            )}
            {user?.plan === "starter" && (
              <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold">
                PLANO STARTER
              </Badge>
            )}
            {(!user?.plan || user?.plan === "free") && (
              <Badge variant="outline" className="px-4 py-2 text-sm font-semibold border-muted-foreground text-muted-foreground">
                PLANO GRATUITO
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Card className="border-l-4 border-l-primary bg-card shadow-lg hover:shadow-xl transition-shadow" data-animate>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Status da Conta</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {user?.plan === "pro"
                  ? "Você tem acesso completo a todas as funcionalidades premium"
                  : user?.plan === "free"
                  ? "Você está no plano gratuito. Assine um plano para ter mais gerações!"
                  : "Faça upgrade para Pro e desbloqueie recursos avançados de IA"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {user?.plan !== "pro" && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">
                  {user?.plan === "free" ? "Gerações gratuitas utilizadas" : "Copies utilizadas este mês"}
                </span>
                <span className="text-foreground">
                  {used}/{limit === -1 ? "∞" : limit}
                </span>
              </div>
              <Progress value={limit > 0 ? (used / limit) * 100 : 0} className="h-3" />
              {remaining === 0 && limit !== -1 && (
                <p className="text-sm text-destructive font-medium">
                  Você atingiu o limite de gerações. Assine um plano para continuar!
                </p>
              )}
              <Link href="/dashboard/planos">
                <Button className="font-semibold w-full">
                  {user?.plan === "free" ? "Ver Planos" : "Fazer Upgrade para Pro"}
                </Button>
              </Link>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                  <div className="w-10 h-10 bg-muted rounded-xl animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-20 bg-muted rounded mb-2 animate-pulse"></div>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.title}
                className="bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className={`h-5 w-5 ${stat.comingSoon ? 'text-muted-foreground' : 'text-white'}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {stat.comingSoon ? (
                    <>
                      <div className="text-2xl font-bold text-muted-foreground mb-2">Em breve</div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Requer integração</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                      {stat.change && (
                        <div className="flex items-center space-x-1 text-sm">
                          <ArrowUpRight className={`h-4 w-4 ${stat.changeType === 'positive' ? 'text-primary' : 'text-red-500'}`} />
                          <span className={`font-semibold ${stat.changeType === 'positive' ? 'text-primary' : 'text-red-500'}`}>{stat.change}</span>
                          <span className="text-muted-foreground">vs mês anterior</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Ações Rápidas</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card
                key={action.title}
                className="bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group overflow-hidden"
              >
                <Link href={action.href}>
                  <CardHeader className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-base">{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Activity className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 rounded-xl animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 rounded-xl hover:bg-accent transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-foreground">{activity.action}</p>
                        <p className="text-muted-foreground">{activity.description}</p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhuma atividade recente</p>
                <p className="text-sm text-muted-foreground mt-2">Comece gerando sua primeira copy!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg" data-animate>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Performance dos Últimos 7 Dias</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded"></div>
                </div>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded"></div>
                </div>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded"></div>
                </div>
              </div>
            ) : dashboardStats ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Copies geradas</span>
                    <span className="font-bold text-foreground text-lg">{dashboardStats.performance.copiesGenerated}</span>
                  </div>
                  <Progress 
                    value={dashboardStats.performance.copiesGenerated > 0 ? Math.min(100, (dashboardStats.performance.copiesGenerated / 30) * 100) : 0} 
                    className="h-3" 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Taxa de sucesso</span>
                    <span className="font-bold text-foreground text-lg">{dashboardStats.performance.successRate}%</span>
                  </div>
                  <Progress value={dashboardStats.performance.successRate} className="h-3" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Produtos analisados</span>
                    <span className="font-bold text-foreground text-lg">{dashboardStats.performance.productsAnalyzed}</span>
                  </div>
                  <Progress 
                    value={dashboardStats.performance.productsAnalyzed > 0 ? Math.min(100, (dashboardStats.performance.productsAnalyzed / 15) * 100) : 0} 
                    className="h-3" 
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-accent border border-border shadow-lg" data-animate>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-foreground">
            <Users className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Insights e Recomendações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
            Para maximizar suas conversões, experimente diferentes variações de headlines para o mesmo produto. Nossa IA
            pode gerar múltiplas versões otimizadas que você pode testar.
          </p>
          <Button className="font-semibold px-6 py-3">
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Headlines Agora
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
