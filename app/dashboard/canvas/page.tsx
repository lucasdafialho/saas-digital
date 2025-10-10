"use client"

import { useRef, useState } from "react"
import { useCSRF } from "@/hooks/use-csrf"
import { useGenerations } from "@/hooks/use-generations"
import { LimitReachedModal } from "@/components/limit-reached-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Layers3, Clipboard, Sparkles, LayoutGrid } from "lucide-react"

type Canvas = {
  customerSegments: string[]
  valueProposition: string[]
  channels: string[]
  customerRelationships: string[]
  revenueStreams: string[]
  keyResources: string[]
  keyActivities: string[]
  keyPartners: string[]
  costStructure: string[]
}

export default function CanvasPage() {
  const { token: csrfToken } = useCSRF()
  const { used, limit, canGenerate } = useGenerations()
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [form, setForm] = useState({
    product: "",
    audience: "",
    offer: "",
    objective: "",
    market: "",
    context: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!form.product || !form.audience || !form.offer || !form.objective) return
    
    // Verificar limite antes de gerar
    if (!canGenerate) {
      setShowLimitModal(true)
      return
    }
    
    if (isGenerating) return // Prevenir cliques duplos
    if (!csrfToken) {
      console.error('Token CSRF não disponível')
      return
    }
    setIsGenerating(true)
    setStatus("generating")
    setErrorMsg("")
    setCanvas(null)
    try {
      const res = await fetch("/api/generate-canvas", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify(form),
      })
      const text = await res.text()
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = null
      }
      if (!res.ok || !data?.success) throw new Error(data?.error || `Falha (${res.status})`)
      setCanvas(data.canvas as Canvas)
      setStatus("success")
      setLastGeneratedAt(new Date())
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150)
    } catch (e: any) {
      console.error(e)
      setStatus("error")
      setErrorMsg(String(e?.message || "Erro ao gerar"))
    } finally {
      setIsGenerating(false)
    }
  }

  const copyCanvas = () => {
    if (!canvas) return
    const lines: string[] = []
    const sections: [keyof Canvas, string][] = [
      ["customerSegments", "Segmentos de Clientes"],
      ["valueProposition", "Proposta de Valor"],
      ["channels", "Canais"],
      ["customerRelationships", "Relacionamento com Clientes"],
      ["revenueStreams", "Fontes de Receita"],
      ["keyResources", "Recursos Chave"],
      ["keyActivities", "Atividades Chave"],
      ["keyPartners", "Parcerias Chave"],
      ["costStructure", "Estrutura de Custos"],
    ]
    sections.forEach(([key, label]) => {
      lines.push(`# ${label}`)
      canvas[key].forEach((item) => lines.push(`• ${item}`))
      lines.push("")
    })
    navigator.clipboard.writeText(lines.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-8" data-animate>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing Model Canvas</h1>
          <p className="text-muted-foreground">Planejamento estratégico em 9 blocos orientado a ação</p>
        </div>
        <div />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Briefing</CardTitle>
              <CardDescription>Forneça detalhes do negócio/produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Produto/Serviço *</Label>
                  <Input value={form.product} onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))} placeholder="Ex: Software de CRM" className="h-11" />
                </div>
                <div className="space-y-3">
                  <Label>Público-alvo *</Label>
                  <Input value={form.audience} onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))} placeholder="Ex: Pequenas agências" className="h-11" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Oferta *</Label>
                  <Input value={form.offer} onChange={(e) => setForm((p) => ({ ...p, offer: e.target.value }))} placeholder="Ex: Plano mensal com 14 dias de trial" className="h-11" />
                </div>
                <div className="space-y-3">
                  <Label>Objetivo *</Label>
                  <Input value={form.objective} onChange={(e) => setForm((p) => ({ ...p, objective: e.target.value }))} placeholder="Ex: Aumentar MRR em 20%" className="h-11" />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Mercado/Nicho</Label>
                <Input value={form.market} onChange={(e) => setForm((p) => ({ ...p, market: e.target.value }))} placeholder="Ex: SMBs no Brasil" className="h-11" />
              </div>

              <div className="space-y-3">
                <Label>Contexto adicional</Label>
                <Textarea value={form.context} onChange={(e) => setForm((p) => ({ ...p, context: e.target.value }))} rows={4} placeholder="Diferenciais, restrições, canais atuais, etc." />
              </div>

              <Button onClick={handleGenerate} disabled={isGenerating || !form.product || !form.audience || !form.offer || !form.objective} className="w-full h-12">
                {isGenerating ? (
                  <>Gerando Canvas...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Marketing Model Canvas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} />
          {canvas ? (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5" />
                    <span>Canvas</span>
                  </CardTitle>
                  <CardDescription>Os 9 blocos do seu modelo</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  {([
                    ["customerSegments", "Segmentos de Clientes"],
                    ["valueProposition", "Proposta de Valor"],
                    ["channels", "Canais"],
                    ["customerRelationships", "Relacionamento com Clientes"],
                    ["revenueStreams", "Fontes de Receita"],
                    ["keyResources", "Recursos Chave"],
                    ["keyActivities", "Atividades Chave"],
                    ["keyPartners", "Parcerias Chave"],
                    ["costStructure", "Estrutura de Custos"],
                  ] as [keyof Canvas, string][]).map(([key, label]) => (
                    <div key={key} className="p-4 rounded-lg border bg-card">
                      <div className="font-semibold text-foreground mb-2">{label}</div>
                      <div className="space-y-1">
                        {canvas[key].map((item, i) => (
                          <div key={i} className="text-sm">• {item}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={copyCanvas}>
                  <Clipboard className="w-4 h-4" />
                  {copied ? "Copiado!" : "Copiar Canvas"}
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Layers3 className="w-14 h-14 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Preencha o briefing e gere seu Marketing Model Canvas</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Use bullets curtos e específicos.</div>
              <div>Conecte proposta de valor aos segmentos.</div>
              <div>Canais e relacionamento devem refletir a jornada.</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Canvas</Badge>
                <Badge className="bg-primary/10 text-primary">IA</Badge>
                {status === "idle" && <Badge variant="secondary">Pronto</Badge>}
                {status === "generating" && <Badge className="bg-amber-500 text-amber-50">Gerando</Badge>}
                {status === "success" && <Badge className="bg-emerald-500 text-emerald-50">Gerado</Badge>}
                {status === "error" && <Badge className="bg-destructive text-destructive-foreground">Erro</Badge>}
              </div>
              <Separator />
              <div className="space-y-1">
                <div className="text-muted-foreground">
                  {status === "generating"
                    ? "Gerando Canvas com IA..."
                    : status === "success"
                      ? "Canvas gerado com sucesso."
                      : status === "error"
                        ? `Falha ao gerar: ${errorMsg}`
                        : "Gere o Canvas e copie para seu documento."}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última geração:</span>
                  <span className="font-medium">{lastGeneratedAt ? lastGeneratedAt.toLocaleString("pt-BR") : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens no Canvas:</span>
                  <span className="font-medium">{canvas ? (
                    canvas.customerSegments.length +
                    canvas.valueProposition.length +
                    canvas.channels.length +
                    canvas.customerRelationships.length +
                    canvas.revenueStreams.length +
                    canvas.keyResources.length +
                    canvas.keyActivities.length +
                    canvas.keyPartners.length +
                    canvas.costStructure.length
                  ) : 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        used={used}
        limit={limit}
      />
    </div>
  )
}


