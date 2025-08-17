"use client"

import { useAuth } from "@/hooks/use-auth"
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
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    {
      title: "Copies Geradas",
      value: "127",
      change: "+12%",
      changeType: "positive" as const,
      icon: Zap,
      color: "bg-primary",
    },
    {
      title: "Taxa de Conversão",
      value: "3.2%",
      change: "+0.8%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "bg-primary",
    },
    {
      title: "Produtos Analisados",
      value: "45",
      change: "+5",
      changeType: "positive" as const,
      icon: Target,
      color: "bg-primary",
    },
    {
      title: "ROI Médio",
      value: "285%",
      change: "+23%",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "bg-primary",
    },
  ]

  const recentActivities = [
    {
      action: "Copy gerada",
      description: "Headline para produto de fitness",
      time: "2 horas atrás",
      type: "copy",
      icon: Zap,
    },
    {
      action: "Produto analisado",
      description: "Curso de marketing digital",
      time: "4 horas atrás",
      type: "product",
      icon: Target,
    },
    {
      action: "Copy gerada",
      description: "Email de vendas para e-book",
      time: "6 horas atrás",
      type: "copy",
      icon: Zap,
    },
    {
      action: "Relatório gerado",
      description: "Análise mensal de performance",
      time: "1 dia atrás",
      type: "report",
      icon: BarChart3,
    },
  ]

  const quickActions = [
    {
      title: "Gerar Copy",
      description: "Crie textos persuasivos com IA",
      icon: Zap,
      href: "/dashboard/copy-generator", // Updated path to dashboard structure
      color: "bg-primary",
      textColor: "text-white",
    },
    {
      title: "Explorar Produtos",
      description: "Descubra produtos nichados validados",
      icon: Target,
      href: "/dashboard/products", // Updated path to dashboard structure
      color: "bg-primary",
      textColor: "text-white",
    },
    {
      title: "Ver Analytics",
      description: "Acompanhe suas métricas",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-primary",
      textColor: "text-white",
    },
  ]

  return (
    <div className="min-h-screen space-y-8 pb-12" data-animate>
      {/* Header */}
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
            <Badge
              variant={user?.plan === "pro" ? "default" : "secondary"}
              className={`px-4 py-2 text-sm font-semibold ${
                user?.plan === "pro"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {user?.plan === "pro" ? "PLANO PRO" : "PLANO STARTER"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Account Status */}
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
                  : "Faça upgrade para Pro e desbloqueie recursos avançados de IA"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {user?.plan === "starter" && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Copies utilizadas este mês</span>
                <span className="text-foreground">67/100</span>
              </div>
              <Progress value={67} className="h-3" />
              <Button className="font-semibold">
                Fazer Upgrade para Pro
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="flex items-center space-x-1 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  <span className="text-primary font-semibold">{stat.change}</span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
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

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-card shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Activity className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="bg-card shadow-lg" data-animate>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Performance dos Últimos 7 Dias</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">Copies geradas</span>
                  <span className="font-bold text-foreground text-lg">23</span>
                </div>
                <Progress value={85} className="h-3" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">Taxa de sucesso</span>
                  <span className="font-bold text-foreground text-lg">92%</span>
                </div>
                <Progress value={92} className="h-3" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">Produtos analisados</span>
                  <span className="font-bold text-foreground text-lg">8</span>
                </div>
                <Progress value={60} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Card */}
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
