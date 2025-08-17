"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Users, Target, Calendar, Download, Filter } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-8" data-animate>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o desempenho das suas campanhas e estratégias</p>
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
      <Card data-animate>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
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
        <Card data-animate>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Copies Geradas</p>
                <p className="text-3xl font-bold text-foreground">1,247</p>
                <p className="text-sm text-primary flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +18% vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-animate>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-foreground">4.8%</p>
                <p className="text-sm text-primary flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +0.3% vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-animate>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtos Analisados</p>
                <p className="text-3xl font-bold text-foreground">89</p>
                <p className="text-sm text-primary flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12 vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-animate>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ROI Médio</p>
                <p className="text-3xl font-bold text-foreground">312%</p>
                <p className="text-sm text-primary flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +27% vs mês anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-animate>
          <CardHeader>
            <CardTitle className="text-foreground">Performance por Tipo de Copy</CardTitle>
            <CardDescription className="text-muted-foreground">Análise de conversão por categoria</CardDescription>
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

        <Card data-animate>
          <CardHeader>
            <CardTitle className="text-foreground">Produtos Mais Analisados</CardTitle>
            <CardDescription className="text-muted-foreground">Top 5 nichos com maior interesse</CardDescription>
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
                <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.views} visualizações</p>
                  </div>
                  <Badge variant="secondary" className="text-primary">
                    {product.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights e Recomendações */}
      <Card data-animate>
        <CardHeader>
          <CardTitle className="text-foreground">Insights e Recomendações</CardTitle>
          <CardDescription className="text-muted-foreground">Análises baseadas nos seus dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-accent border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">📈 Oportunidade Identificada</h4>
                <p className="text-muted-foreground text-sm">
                  Headlines de vendas têm 23% mais conversão que outros tipos. Considere focar mais neste formato.
                </p>
              </div>
              <div className="p-4 bg-accent border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">✅ Tendência Positiva</h4>
                <p className="text-muted-foreground text-sm">
                  Seu ROI aumentou 27% no último mês. Continue com as estratégias atuais.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-accent border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">⚠️ Atenção Necessária</h4>
                <p className="text-muted-foreground text-sm">
                  Posts sociais têm baixa conversão. Revise a estratégia para este canal.
                </p>
              </div>
              <div className="p-4 bg-accent border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">🎯 Recomendação</h4>
                <p className="text-muted-foreground text-sm">
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
