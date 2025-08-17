"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Zap, Target, Users, DollarSign, BarChart3, ArrowUpRight, Activity } from "lucide-react"
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
      color: "bg-slate-600",
    },
    {
      title: "Ver Analytics",
      description: "Acompanhe suas métricas",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-slate-700",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="space-y-8 p-8">
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Bem-vindo, {user?.name?.split(" ")[0] || "Usuário"}</h1>
              <p className="text-slate-600 mt-2">
                Gerencie suas campanhas de marketing digital e acompanhe seus resultados
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={user?.plan === "pro" ? "default" : "secondary"} className="px-3 py-1 text-sm font-medium">
                {user?.plan === "pro" ? "PLANO PRO" : "PLANO STARTER"}
              </Badge>
            </div>
          </div>
        </div>

        <Card className="border-l-4 border-l-primary bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">Status da Conta</CardTitle>
                <CardDescription className="text-slate-600 mt-1">
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
                  <span className="text-slate-700">Copies utilizadas este mês</span>
                  <span className="text-slate-900">67/100</span>
                </div>
                <Progress value={67} className="h-3" />
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-medium">
                  Fazer Upgrade para Pro
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 mb-2">{stat.value}</div>
                  <div className="flex items-center space-x-1 text-xs">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">{stat.change}</span>
                    <span className="text-slate-500">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Ações Rápidas</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Card
                  key={action.title}
                  className="bg-white shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  <Link href={action.href}>
                    <CardHeader className="p-6">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-slate-900 mb-1">{action.title}</CardTitle>
                          <CardDescription className="text-slate-600">{action.description}</CardDescription>
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
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-slate-900">
                <Activity className="w-5 h-5 text-primary" />
                <span>Atividade Recente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-2 ${
                        activity.type === "copy"
                          ? "bg-primary"
                          : activity.type === "product"
                            ? "bg-slate-600"
                            : "bg-slate-700"
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                      <p className="text-sm text-slate-600">{activity.description}</p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-slate-900">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span>Performance dos Últimos 7 Dias</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Copies geradas</span>
                    <span className="text-sm font-bold text-slate-900">23</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Taxa de sucesso</span>
                    <span className="text-sm font-bold text-slate-900">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Produtos analisados</span>
                    <span className="text-sm font-bold text-slate-900">8</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-primary/5 to-slate-100 border-primary/20 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-slate-900">
              <Users className="w-5 h-5 text-primary" />
              <span>Insights e Recomendações</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4 leading-relaxed">
              Para maximizar suas conversões, experimente diferentes variações de headlines para o mesmo produto. Nossa
              IA pode gerar múltiplas versões otimizadas que você pode testar.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white font-medium bg-transparent"
            >
              Gerar Headlines Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
