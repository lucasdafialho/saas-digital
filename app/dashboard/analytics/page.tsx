"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Clock } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center" data-animate>
      <Card className="max-w-2xl w-full bg-card shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground mb-2">
            Analytics
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Esta funcionalidade está sendo desenvolvida
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <div className="bg-accent rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Em breve</span>
            </div>
            <p className="text-muted-foreground">
              Estamos trabalhando para trazer análises detalhadas e insights sobre suas campanhas e estratégias de marketing digital.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="font-semibold text-foreground mb-1">Métricas em Tempo Real</p>
              <p className="text-muted-foreground text-xs">Acompanhe seu desempenho</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="font-semibold text-foreground mb-1">Relatórios Avançados</p>
              <p className="text-muted-foreground text-xs">Análises detalhadas</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="font-semibold text-foreground mb-1">Insights de IA</p>
              <p className="text-muted-foreground text-xs">Recomendações personalizadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
