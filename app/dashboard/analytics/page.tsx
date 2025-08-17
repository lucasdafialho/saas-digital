"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Users, Target, Calendar, Download, Filter } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-1">Acompanhe o desempenho das suas campanhas e estratégias</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Período Selecionado */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              <span className="font-medium">Período:</span>
              <Badge variant="secondary">Últimos 30 dias</Badge>
            </div>
            <Button variant="outline" size="sm">
              Alterar período
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Copies Geradas</p>
                <p className="text-3xl font-bold text-slate-900">1,247</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +18% vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-slate-900">4.8%</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +0.3% vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Produtos Analisados</p>
                <p className="text-3xl font-bold text-slate-900">89</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12 vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">ROI Médio</p>
                <p className="text-3xl font-bold text-slate-900">312%</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +27% vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance por Tipo de Copy</CardTitle>
            <CardDescription>Análise de conversão por categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Headlines de Vendas</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>E-mail Marketing</span>
                  <span>65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Posts Sociais</span>
                  <span>52%</span>
                </div>
                <Progress value={52} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Anúncios Pagos</span>
                  <span>43%</span>
                </div>
                <Progress value={43} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Analisados</CardTitle>
            <CardDescription>Top 5 nichos com maior interesse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Curso de Marketing Digital", views: 234, trend: "+12%" },
                { name: "E-book de Vendas", views: 189, trend: "+8%" },
                { name: "Mentoria de Negócios", views: 156, trend: "+15%" },
                { name: "Curso de Design", views: 143, trend: "+5%" },
                { name: "Consultoria Financeira", views: 98, trend: "+22%" },
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-600">{product.views} visualizações</p>
                  </div>
                  <Badge variant="secondary" className="text-emerald-600">
                    {product.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
          <CardDescription>Análises baseadas nos seus dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📈 Oportunidade Identificada</h4>
                <p className="text-blue-800 text-sm">
                  Headlines de vendas têm 23% mais conversão que outros tipos. Considere focar mais neste formato.
                </p>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-semibold text-emerald-900 mb-2">✅ Tendência Positiva</h4>
                <p className="text-emerald-800 text-sm">
                  Seu ROI aumentou 27% no último mês. Continue com as estratégias atuais.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">⚠️ Atenção Necessária</h4>
                <p className="text-orange-800 text-sm">
                  Posts sociais têm baixa conversão. Revise a estratégia para este canal.
                </p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">🎯 Recomendação</h4>
                <p className="text-purple-800 text-sm">
                  Explore mais produtos no nicho de consultoria - alta demanda identificada.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
