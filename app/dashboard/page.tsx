"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Zap, Target, Users, DollarSign, BarChart3, ArrowUpRight, Clock } from "lucide-react"
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
    },
    {
      title: "Taxa de Conversão",
      value: "3.2%",
      change: "+0.8%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Produtos Analisados",
      value: "45",
      change: "+5",
      changeType: "positive" as const,
      icon: Target,
    },
    {
      title: "ROI Médio",
      value: "285%",
      change: "+23%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
  ]

  const recentActivities = [
    {
      action: "Copy gerada",
      description: "Headline para produto de fitness",
      time: "2 horas atrás",
      type: "copy",
    },
    {
      action: "Produto analisado",
      description: "Curso de marketing digital",
      time: "4 horas atrás",
      type: "product",
    },
    {
      action: "Copy gerada",
      description: "Email de vendas para e-book",
      time: "6 horas atrás",
      type: "copy",
    },
    {
      action: "Relatório gerado",
      description: "Análise mensal de performance",
      time: "1 dia atrás",
      type: "report",
    },
  ]

  const quickActions = [
    {
      title: "Gerar Copy",
      description: "Crie textos persuasivos com IA",
      icon: Zap,
      href: "/copy-generator",
      color: "bg-primary",
    },
    {
      title: "Explorar Produtos",
      description: "Descubra produtos nichados validados",
      icon: Target,
      href: "/products",
      color: "bg-accent",
    },
    {
      title: "Ver Analytics",
      description: "Acompanhe suas métricas",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-secondary",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Olá, {user?.name?.split(" ")[0] || "Usuário"}! 👋</h1>
        <p className="text-muted-foreground">Aqui está um resumo da sua atividade no MarketPro</p>
      </div>

      {/* Plan Status */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Plano {user?.plan === "pro" ? "Pro" : "Starter"}</CardTitle>
              <CardDescription>
                {user?.plan === "pro"
                  ? "Acesso completo a todas as funcionalidades"
                  : "Upgrade para Pro e desbloqueie recursos avançados"}
              </CardDescription>
            </div>
            <Badge variant={user?.plan === "pro" ? "default" : "secondary"}>
              {user?.plan === "pro" ? "PRO" : "STARTER"}
            </Badge>
          </div>
        </CardHeader>
        {user?.plan === "starter" && (
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Copies utilizadas este mês</span>
                <span>67/100</span>
              </div>
              <Progress value={67} className="h-2" />
              <Button size="sm" className="bg-accent hover:bg-accent/90">
                Fazer Upgrade
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
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">{stat.change}</span>
                  <span>vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={action.href}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{action.title}</CardTitle>
                        <CardDescription className="text-sm">{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity & Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === "copy"
                        ? "bg-primary"
                        : activity.type === "product"
                          ? "bg-accent"
                          : "bg-secondary"
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Performance dos Últimos 7 Dias</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Copies geradas</span>
                <span className="text-sm font-medium">23</span>
              </div>
              <Progress value={85} className="h-2" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa de sucesso</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Produtos analisados</span>
                <span className="text-sm font-medium">8</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips & Recommendations */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Dica do Dia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Para aumentar suas conversões, teste diferentes headlines para o mesmo produto. Nossa IA pode gerar
            variações que você pode A/B testar.
          </p>
          <Button size="sm" variant="outline">
            Gerar Headlines Agora
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
