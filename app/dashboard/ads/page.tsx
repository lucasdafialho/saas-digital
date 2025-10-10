"use client"

import { useState, useRef } from "react"
import { useCSRF } from "@/hooks/use-csrf"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Megaphone, Target, Rocket, Copy, Wallet, Sparkles, MapPin } from "lucide-react"

type AdsPlan = {
  objective: string
  platforms: string[]
  budget: string
  timeframe: string
  strategySummary: string
  kpis: string[]
  campaigns: {
    name: string
    goal: string
    budgetSplitPercent: number
    biddingStrategy: string
    audiences: string[]
    placements: string[]
    creatives: { format: string; headline: string; description: string; cta: string; angle: string }[]
    recommendations: string[]
  }[]
  testingPlan: string[]
  dailyRoutine: string[]
  optimizationTips: string[]
}

const objectives = ["Leads", "Conversão", "Reconhecimento", "Tráfego", "Vendas", "Engajamento"]
const platforms = ["Meta Ads", "Google Ads", "TikTok Ads", "YouTube", "LinkedIn Ads", "Auto"]

export default function AdsPage() {
  const { token: csrfToken } = useCSRF()
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const [form, setForm] = useState({
    product: "",
    offer: "",
    audience: "",
    objective: objectives[0],
    platform: platforms[0],
    budget: "1000",
    timeframe: "30",
    region: "BR",
    context: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [plan, setPlan] = useState<AdsPlan | null>(null)
  const [copiedCreatives, setCopiedCreatives] = useState(false)

  const handleGenerate = async () => {
    if (!form.product || !form.offer || !form.audience) return
    if (isGenerating) return // Prevenir cliques duplos
    if (!csrfToken) {
      console.error('Token CSRF não disponível')
      return
    }
    setIsGenerating(true)
    setPlan(null)
    try {
      const res = await fetch("/api/generate-ads", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget || 0),
          timeframe: Number(form.timeframe || 0),
        }),
      })
      const text = await res.text()
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = null
      }
      if (!res.ok || !data?.success) throw new Error(data?.error || `Falha (${res.status})`)
      setPlan(data.strategy as AdsPlan)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 150)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNumeric = (key: "budget" | "timeframe") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, "")
    setForm((p) => ({ ...p, [key]: digits }))
  }

  const copyCreatives = () => {
    if (!plan) return
    const lines: string[] = []
    plan.campaigns.forEach((c) => {
      lines.push(`# ${c.name} — ${c.goal}`)
      c.creatives.forEach((cr, i) => {
        lines.push(`(${i + 1}) [${cr.format}] ${cr.angle}`)
        lines.push(`Headline: ${cr.headline}`)
        lines.push(`Desc: ${cr.description}`)
        lines.push(`CTA: ${cr.cta}`)
        lines.push("")
      })
    })
    navigator.clipboard.writeText(lines.join("\n"))
    setCopiedCreatives(true)
    setTimeout(() => setCopiedCreatives(false), 1500)
  }

  return (
    <div className="space-y-8" data-animate>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estratégias de Ads/Tráfego</h1>
          <p className="text-muted-foreground">Planejamento completo com recomendações de público e criativos</p>
        </div>
        <div />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Configurar Campanha</CardTitle>
              <CardDescription>Defina objetivo, plataforma e parâmetros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Briefing</div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Produto/Serviço *</Label>
                  <Input value={form.product} onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))} placeholder="Ex: Curso X" className="h-11" />
                </div>
                <div className="space-y-3">
                  <Label>Oferta *</Label>
                  <Input value={form.offer} onChange={(e) => setForm((p) => ({ ...p, offer: e.target.value }))} placeholder="Ex: 50% OFF no lançamento" className="h-11" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Público-alvo *</Label>
                  <Input value={form.audience} onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))} placeholder="Ex: Donos de e-commerce" className="h-11" />
                </div>
                <div className="space-y-3">
                  <Label>Objetivo</Label>
                  <Select value={form.objective} onValueChange={(v) => setForm((p) => ({ ...p, objective: v }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {objectives.map((o) => (
                        <SelectItem value={o} key={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Parâmetros de Mídia</div>
                <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label>Plataforma</Label>
                  <Select value={form.platform} onValueChange={(v) => setForm((p) => ({ ...p, platform: v }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Orçamento mensal (R$)</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</div>
                    <Input type="text" inputMode="numeric" pattern="[0-9]*" value={form.budget} onChange={handleNumeric("budget")} placeholder="1000" className="h-11 pl-10" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Janela (dias)</Label>
                  <div className="relative">
                    <Input type="text" inputMode="numeric" pattern="[0-9]*" value={form.timeframe} onChange={handleNumeric("timeframe")} placeholder="30" className="h-11 pr-14" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">dias</div>
                  </div>
                </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Contexto</div>
                <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Região</Label>
                  <Input value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} placeholder="Ex: BR / PT-BR" className="h-11" />
                </div>
                <div className="space-y-3">
                  <Label>Contexto adicional</Label>
                  <Textarea value={form.context} onChange={(e) => setForm((p) => ({ ...p, context: e.target.value }))} rows={4} placeholder="Restrições, diferenciais, dados anteriores..." />
                </div>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={isGenerating || !form.product || !form.offer || !form.audience} className="w-full h-12">
                {isGenerating ? (
                  <>Gerando estratégia...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar estratégia de Ads
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} />
          {plan ? (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    <span>{plan.objective}</span>
                  </CardTitle>
                  <CardDescription>
                    {plan.strategySummary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline"><Wallet className="w-3 h-3 mr-1" />{plan.budget}</Badge>
                    <Badge variant="outline">{plan.timeframe}</Badge>
                    {plan.platforms.map((p) => (
                      <Badge key={p} className="bg-primary/10 text-primary">{p}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.kpis.map((k) => (
                      <Badge key={k} variant="secondary">{k}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {plan.campaigns.map((c, idx) => (
                <Card key={`${c.name}-${idx}`} className="bg-card" data-animate>
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      <span>{c.name}</span>
                    </CardTitle>
                    <CardDescription>{c.goal} • {c.budgetSplitPercent}% • {c.biddingStrategy}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {c.audiences.map((a) => (
                        <Badge key={a} variant="outline">{a}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.placements.map((p) => (
                        <Badge key={p} className="bg-primary/10 text-primary">{p}</Badge>
                      ))}
                    </div>
                    <Separator />
                    <div className="grid md:grid-cols-2 gap-4">
                      {c.creatives.map((cr, i) => (
                        <div key={i} className="p-4 rounded-lg border">
                          <div className="text-xs text-muted-foreground mb-1">{cr.format} • {cr.angle}</div>
                          <div className="font-semibold">{cr.headline}</div>
                          <div className="text-sm text-muted-foreground">{cr.description}</div>
                          <div className="text-sm mt-1">CTA: {cr.cta}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {c.recommendations.map((r, i) => (
                        <div key={i} className="text-sm">• {r}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Plano de Testes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {plan.testingPlan.map((t, i) => (<div key={i} className="text-sm">• {t}</div>))}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Rotina Diária</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {plan.dailyRoutine.map((d, i) => (<div key={i} className="text-sm">• {d}</div>))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Otimizações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {plan.optimizationTips.map((o, i) => (<div key={i} className="text-sm">• {o}</div>))}
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={copyCreatives}>
                  <Copy className="w-4 h-4" />
                  {copiedCreatives ? "Copiado!" : "Copiar criativos"}
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Megaphone className="w-14 h-14 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Preencha os campos e gere a estratégia de Ads</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Resumo da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{form.objective}</Badge>
                <Badge className="bg-primary/10 text-primary">{form.platform}</Badge>
                <Badge variant="secondary"><Wallet className="w-3 h-3 mr-1" />R$ {Number(form.budget || 0).toLocaleString("pt-BR")}/mês</Badge>
                <Badge variant="secondary">{Number(form.timeframe || 0)} dias</Badge>
                <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{form.region || "BR"}</Badge>
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div><span className="text-muted-foreground">Produto:</span> {form.product || "—"}</div>
                <div><span className="text-muted-foreground">Oferta:</span> {form.offer || "—"}</div>
                <div><span className="text-muted-foreground">Público:</span> {form.audience || "—"}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Use orçamentos realistas e mantenha consistência por pelo menos 7 dias.</div>
              <div>Teste 3-5 ângulos iniciais por campanha.</div>
              <div>Evite alterações frequentes de orçamento para não quebrar o aprendizado.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


