"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Wand2, Layers3, Target, LineChart, Clock, Copy, Sparkles } from "lucide-react"

type Strategy = {
  funnelType: string
  objective: string
  summary: string
  kpis: string[]
  stages: {
    name: string
    objective: string
    channels: string[]
    actions: string[]
    recommendations: string[]
    kpis: string[]
    copyGuidelines: string[]
  }[]
  recommendedTools: string[]
  contentIdeas: string[]
  timeline: { phase: string; week: string; focus: string }[]
}

const funnelTypes = [
  "Lead Magnet",
  "Webinar",
  "VSL Direta",
  "Lançamento",
  "Low-Ticket Tripwire",
  "Produto/Trial (PLG)",
]

const objectives = [
  "Aquisição de leads",
  "Conversão direta",
  "Geração de demanda",
  "Upsell/Cross-sell",
  "Retenção/Recorrência",
]

const budgets = ["Baixo", "Médio", "Alto"]
const timeframes = ["7 dias", "14 dias", "30 dias", "60 dias"]

export default function AIToolsPage() {
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const [selectedType, setSelectedType] = useState<string>(funnelTypes[0])
  const [form, setForm] = useState({
    product: "",
    audience: "",
    offer: "",
    objective: objectives[0],
    budget: budgets[0],
    timeframe: timeframes[2],
    context: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [copiedPlan, setCopiedPlan] = useState(false)

  const handleGenerate = async () => {
    if (!form.product || !form.audience || !form.offer) return
    setIsGenerating(true)
    setStrategy(null)
    try {
      const res = await fetch("/api/generate-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: form.product,
          audience: form.audience,
          offer: form.offer,
          objective: form.objective,
          funnelType: selectedType,
          budget: form.budget,
          timeframe: form.timeframe,
          context: form.context,
        }),
      })
      const payloadText = await res.text()
      let payload: any = null
      try {
        payload = payloadText ? JSON.parse(payloadText) : null
      } catch {
        payload = null
      }
      if (!res.ok || !payload?.success) throw new Error(payload?.error || `Falha (${res.status})`)
      setStrategy(payload.strategy as Strategy)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 150)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyPlan = () => {
    if (!strategy) return
    const lines: string[] = []
    lines.push(`# ${strategy.funnelType} • ${strategy.objective}`)
    lines.push(strategy.summary)
    lines.push("")
    lines.push(`KPIs: ${strategy.kpis.join(", ")}`)
    lines.push("")
    strategy.stages.forEach((s, idx) => {
      lines.push(`${idx + 1}. ${s.name} — ${s.objective}`)
      lines.push(`Canais: ${s.channels.join(", ")}`)
      lines.push(`Ações: ${s.actions.join("; ")}`)
      lines.push(`Recomendações: ${s.recommendations.join("; ")}`)
      lines.push(`KPIs: ${s.kpis.join(", ")}`)
      lines.push("")
    })
    navigator.clipboard.writeText(lines.join("\n"))
    setCopiedPlan(true)
    setTimeout(() => setCopiedPlan(false), 1500)
  }

  return (
    <div className="space-y-8" data-animate>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ferramentas com IA</h1>
          <p className="text-muted-foreground">Geração de estratégias de funil de vendas</p>
        </div>
        <div />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Configurar Estratégia</CardTitle>
              <CardDescription>Defina os parâmetros do funil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Tipo de Funil</Label>
                <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-12">
                    {funnelTypes.map((t) => (
                      <TabsTrigger key={t} value={t} className="text-sm">
                        <Layers3 className="w-4 h-4 mr-2" />
                        {t}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {funnelTypes.map((t) => (
                    <TabsContent key={t} value={t} />
                  ))}
                </Tabs>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Produto/Serviço *</Label>
                  <Input
                    placeholder="Ex: Curso de Marketing Digital"
                    value={form.product}
                    onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Público-alvo *</Label>
                  <Input
                    placeholder="Ex: Afiliados iniciantes"
                    value={form.audience}
                    onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Oferta principal *</Label>
                  <Input
                    placeholder="Ex: Mentoria 8 semanas"
                    value={form.offer}
                    onChange={(e) => setForm((p) => ({ ...p, offer: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Objetivo</Label>
                  <Select value={form.objective} onValueChange={(v) => setForm((p) => ({ ...p, objective: v }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {objectives.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Orçamento</Label>
                  <Select value={form.budget} onValueChange={(v) => setForm((p) => ({ ...p, budget: v }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Janela de execução</Label>
                  <Select value={form.timeframe} onValueChange={(v) => setForm((p) => ({ ...p, timeframe: v }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeframes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Contexto adicional</Label>
                <Textarea
                  placeholder="Diferenciais, regiões, restrições, canais preferidos etc."
                  value={form.context}
                  onChange={(e) => setForm((p) => ({ ...p, context: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button onClick={handleGenerate} disabled={isGenerating || !form.product || !form.audience || !form.offer} className="w-full h-12">
                {isGenerating ? (
                  <>Gerando estratégia...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar estratégia de Funil
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} />
          {strategy ? (
            <div className="space-y-8">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Layers3 className="w-5 h-5" />
                    <span>{strategy.funnelType}</span>
                  </CardTitle>
                  <CardDescription>{strategy.objective}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{strategy.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {strategy.kpis.map((k) => (
                      <Badge key={k} variant="secondary">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {strategy.stages.map((stage, idx) => (
                  <Card key={`${stage.name}-${idx}`} className="bg-card" data-animate>
                    <CardHeader>
                      <CardTitle className="text-foreground flex items-center gap-2">
                        {idx === 0 ? <Target className="w-5 h-5" /> : idx === strategy.stages.length - 1 ? <LineChart className="w-5 h-5" /> : <Layers3 className="w-5 h-5" />}
                        <span>{stage.name}</span>
                      </CardTitle>
                      <CardDescription>{stage.objective}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {stage.channels.map((c) => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))}
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        {stage.actions.map((a, i) => (
                          <div key={i} className="text-sm text-foreground">• {a}</div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {stage.recommendations.map((r, i) => (
                          <div key={i} className="text-sm text-muted-foreground">– {r}</div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stage.kpis.map((k) => (
                          <Badge key={k} className="bg-primary/10 text-primary">
                            {k}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Ideias de Conteúdo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {strategy.contentIdeas.map((idea, i) => (
                      <div key={i} className="text-sm">• {idea}</div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Ferramentas Recomendadas</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {strategy.recommendedTools.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>Cronograma sugerido</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  {strategy.timeline.map((t, i) => (
                    <div key={i} className="p-4 rounded-lg border">
                      <div className="font-medium text-foreground">{t.phase}</div>
                      <div className="text-xs text-muted-foreground">{t.week}</div>
                      <div className="text-sm mt-1">{t.focus}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={copyPlan}>
                  <Copy className="w-4 h-4" />
                  {copiedPlan ? "Copiado!" : "Copiar plano"}
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Wand2 className="w-14 h-14 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Preencha os campos e gere sua estratégia de funil</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>1. Selecione o tipo de funil e objetivo</div>
              <div>2. Informe produto, público e oferta</div>
              <div>3. Ajuste orçamento e janela</div>
              <div>4. Gere a estratégia com IA</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


