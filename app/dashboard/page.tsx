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
      color: "bg-blue-500",
    },
    {
      title: "Taxa de Conversão",
      value: "3.2%",
      change: "+0.8%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "bg-emerald-500",
    },
    {
      title: "Produtos Analisados",
      value: "45",
      change: "+5",
      changeType: "positive" as const,
      icon: Target,
      color: "bg-purple-500",
    },
    {
      title: "ROI Médio",
      value: "285%",
      change: "+23%",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "bg-amber-500",
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
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      textColor: "text-white",
    },
    {
      title: "Explorar Produtos",
      description: "Descubra produtos nichados validados",
      icon: Target,
      href: "/dashboard/products", // Updated path to dashboard structure
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      textColor: "text-white",
    },
    {
      title: "Ver Analytics",
      description: "Acompanhe suas métricas",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      textColor: "text-white",
    },
  ]

  return (
    <div className="min-h-screen space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Bem-vindo, {user?.name?.split(" ")[0] || "Usuário"}
            </h1>
            <p className="text-lg text-slate-600">
              Gerencie suas campanhas de marketing digital e acompanhe seus resultados
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge
              variant={user?.plan === "pro" ? "default" : "secondary"}
              className={`px-4 py-2 text-sm font-semibold ${
                user?.plan === "pro"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {user?.plan === "pro" ? "PLANO PRO" : "PLANO STARTER"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <Card className="border-l-4 border-l-blue-500 bg-white shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <span>Status da Conta</span>
              </CardTitle>
              <CardDescription className="text-slate-600 mt-2">
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
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
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
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="flex items-center space-x-1 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">{stat.change}</span>
                  <span className="text-slate-500">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Ações Rápidas</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card
                key={action.title}
                className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group overflow-hidden"
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
                        <CardTitle className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600 text-base">{action.description}</CardDescription>
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
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-slate-900">
              <Activity className="w-6 h-6 text-blue-500" />
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
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-slate-900">{activity.action}</p>
                      <p className="text-slate-600">{activity.description}</p>
                      <p className="text-sm text-slate-500 flex items-center">
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
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-slate-900">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
              <span className="text-xl font-bold">Performance dos Últimos 7 Dias</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Copies geradas</span>
                  <span className="font-bold text-slate-900 text-lg">23</span>
                </div>
                <Progress value={85} className="h-3" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Taxa de sucesso</span>
                  <span className="font-bold text-slate-900 text-lg">92%</span>
                </div>
                <Progress value={92} className="h-3" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Produtos analisados</span>
                  <span className="font-bold text-slate-900 text-lg">8</span>
                </div>
                <Progress value={60} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-slate-900">
            <Users className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold">Insights e Recomendações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-6 leading-relaxed text-lg">
            Para maximizar suas conversões, experimente diferentes variações de headlines para o mesmo produto. Nossa IA
            pode gerar múltiplas versões otimizadas que você pode testar.
          </p>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3">
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Headlines Agora
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
