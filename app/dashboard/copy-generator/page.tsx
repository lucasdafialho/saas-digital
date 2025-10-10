"use client"

import { useState } from "react"
import { useCSRF } from "@/hooks/use-csrf"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Copy,
  Heart,
  RefreshCw,
  Sparkles,
  Mail,
  MessageSquare,
  Megaphone,
  FileText,
  Clock,
  CheckCircle,
  Wand2,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface CopyResult {
  id: string
  type: string
  content: string
  timestamp: Date
  liked: boolean
}

const copyTypes = [
  {
    value: "headline",
    label: "Headlines",
    icon: Megaphone,
    description: "Títulos que chamam atenção",
    color: "bg-primary",
  },
  { value: "email", label: "E-mails de Vendas", icon: Mail, description: "E-mails persuasivos", color: "bg-primary" },
  {
    value: "social",
    label: "Posts Sociais",
    icon: MessageSquare,
    description: "Conteúdo para redes sociais",
    color: "bg-green-500",
  },
  { value: "ad", label: "Anúncios", icon: Sparkles, description: "Textos para anúncios pagos", color: "bg-purple-500" },
  {
    value: "description",
    label: "Descrições",
    icon: FileText,
    description: "Descrições de produtos",
    color: "bg-amber-500",
  },
]

const toneOptions = [
  { value: "professional", label: "Profissional" },
  { value: "casual", label: "Casual" },
  { value: "enthusiastic", label: "Entusiasmado" },
  { value: "urgent", label: "Urgente" },
  { value: "friendly", label: "Amigável" },
]

const templates = {
  headline: [
    "Como [produto] pode [benefício principal] em [tempo]",
    "O segredo para [resultado desejado] que [público-alvo] não quer que você saiba",
    "[Número] maneiras comprovadas de [alcançar objetivo]",
  ],
  email: [
    "Assunto: [Benefício] em apenas [tempo] - Garantido!",
    "Olá [nome], descobri algo que vai mudar sua [área de interesse]...",
    "Última chance: [oferta] expira em [tempo]",
  ],
  social: [
    "🚀 Acabei de descobrir [produto/método] e os resultados são incríveis!",
    "Dica rápida: [dica valiosa] que pode [benefício] hoje mesmo",
    "Quem mais quer [resultado desejado]? Comenta aqui 👇",
  ],
}

export default function CopyGeneratorPage() {
  const { user } = useAuth()
  const { token: csrfToken } = useCSRF()
  const [selectedType, setSelectedType] = useState("headline")
  const [formData, setFormData] = useState({
    product: "",
    audience: "",
    benefit: "",
    tone: "professional",
    context: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<CopyResult[]>([])
  const [history, setHistory] = useState<CopyResult[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!formData.product || !formData.audience || !formData.benefit) {
      return
    }

    // Prevenir cliques duplos
    if (isGenerating) {
      return
    }

    setIsGenerating(true)

    if (!csrfToken) {
      console.error('Token CSRF não disponível')
      setIsGenerating(false)
      return
    }

    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({
          type: selectedType,
          product: formData.product,
          audience: formData.audience,
          benefit: formData.benefit,
          tone: formData.tone,
          context: formData.context,
        }),
      })

      const text = await res.text()
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = null
      }
      if (!res.ok || !data?.success) {
        throw new Error((data && data.error) || `Falha ao gerar (${res.status})`)
      }

      const mapped: CopyResult[] = (data.copies || []).map((c: any) => ({
        id: String(c.id),
        type: String(c.type || selectedType),
        content: String(c.content || ""),
        timestamp: new Date(c.timestamp || Date.now()),
        liked: false,
      }))

      setResults(mapped)
      setHistory((prev) => [...mapped, ...prev])
    } catch (error) {
      console.error("Erro ao gerar copy:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateMockCopy = (type: string, data: any, variant = 1) => {
    const { product, audience, benefit, tone } = data

    switch (type) {
      case "headline":
        const headlines = [
          `Como ${product} Pode ${benefit} em Apenas 30 Dias`,
          `O Segredo Para ${benefit} Que ${audience} Não Quer Que Você Saiba`,
          `Descubra Como ${product} Está Revolucionando a Vida de ${audience}`,
        ]
        return headlines[variant - 1] || headlines[0]

      case "email":
        const emails = [
          `Assunto: ${benefit} Garantido em 30 Dias ou Seu Dinheiro de Volta!\n\nOlá,\n\nVocê já imaginou como seria ${benefit} sem todo o estresse e complicação?\n\nCom ${product}, isso é possível. Nossa solução foi desenvolvida especificamente para ${audience} que querem resultados reais.\n\nClique aqui para descobrir como: [LINK]\n\nAbraços,\n[Seu Nome]`,
          `Assunto: Última Chance - ${product} com 50% OFF\n\nOi,\n\nEsta é sua última oportunidade de conseguir ${product} com desconto especial.\n\nMais de 10.000 ${audience} já estão usando para ${benefit}.\n\nNão perca: [LINK]\n\nAtenciosamente,\n[Seu Nome]`,
          `Assunto: ${audience}, isso vai mudar sua vida\n\nOlá,\n\nEu sei que você está buscando uma forma de ${benefit}.\n\nE eu tenho a solução perfeita: ${product}.\n\nVeja os resultados: [LINK]\n\nSucesso!`,
        ]
        return emails[variant - 1] || emails[0]

      case "social":
        const social = [
          `🚀 Acabei de descobrir ${product} e os resultados são incríveis!\n\nEm apenas 1 semana consegui ${benefit}.\n\nSe você é ${audience}, precisa conhecer isso!\n\n#marketing #vendas #sucesso`,
          `Dica rápida para ${audience}: \n\n${product} pode ser a chave para ${benefit} 🔑\n\nQuem mais quer saber como? Comenta aqui 👇\n\n#dica #empreendedorismo`,
          `Pergunta honesta: quantos de vocês já tentaram ${benefit} e não conseguiram?\n\n${product} mudou isso para mim.\n\nQuem quer saber como? 🤔`,
        ]
        return social[variant - 1] || social[0]

      default:
        return `Copy gerada para ${product} focada em ${audience} com o benefício de ${benefit}.`
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const toggleLike = (id: string) => {
    setResults((prev) => prev.map((result) => (result.id === id ? { ...result, liked: !result.liked } : result)))
    setHistory((prev) => prev.map((result) => (result.id === id ? { ...result, liked: !result.liked } : result)))
  }

  const selectedTypeData = copyTypes.find((type) => type.value === selectedType)

  return (
    <div className="min-h-screen bg-background" data-animate>
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gerador de Copy IA</h1>
            <p className="text-lg text-muted-foreground">Crie textos persuasivos em segundos com inteligência artificial</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg bg-card">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center space-x-3 text-2xl font-bold text-foreground">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span>Configurar Copy</span>
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Preencha as informações para gerar copies personalizadas com IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Copy Type Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-foreground">Tipo de Copy</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {copyTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.value}
                          onClick={() => setSelectedType(type.value)}
                          className={`p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg ${
                            selectedType === type.value
                              ? "border-primary bg-primary/10 shadow-lg"
                              : "border-border hover:border-primary bg-card"
                          }`}
                        >
                          <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center mb-3`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="font-semibold text-foreground mb-1">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="product" className="text-base font-semibold text-foreground">
                      Produto/Serviço *
                    </Label>
                    <Input
                      id="product"
                      placeholder="Ex: Curso de Marketing Digital"
                      value={formData.product}
                      onChange={(e) => setFormData((prev) => ({ ...prev, product: e.target.value }))}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="audience" className="text-base font-semibold text-foreground">
                      Público-Alvo *
                    </Label>
                    <Input
                      id="audience"
                      placeholder="Ex: Empreendedores iniciantes"
                      value={formData.audience}
                      onChange={(e) => setFormData((prev) => ({ ...prev, audience: e.target.value }))}
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="benefit" className="text-base font-semibold text-foreground">
                    Principal Benefício *
                  </Label>
                  <Input
                    id="benefit"
                    placeholder="Ex: Aumentar vendas em 300%"
                    value={formData.benefit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, benefit: e.target.value }))}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tone" className="text-base font-semibold text-foreground">
                    Tom de Voz
                  </Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {toneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="context" className="text-base font-semibold text-foreground">
                    Contexto Adicional
                  </Label>
                  <Textarea
                    id="context"
                    placeholder="Informações extras sobre seu produto, promoções, urgência, etc."
                    value={formData.context}
                    onChange={(e) => setFormData((prev) => ({ ...prev, context: e.target.value }))}
                    rows={4}
                    className="text-base"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !formData.product || !formData.audience || !formData.benefit}
                  className="w-full h-14 text-lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                      Gerando Copy...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Gerar Copy com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Templates */}
            {selectedTypeData && templates[selectedType as keyof typeof templates] && (
              <Card className="shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Templates de {selectedTypeData.label}
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">Exemplos de estruturas que funcionam</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {templates[selectedType as keyof typeof templates].map((template, index) => (
                      <div key={index} className="p-4 bg-accent rounded-lg text-sm border border-border">
                        {template}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-8">
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="results" className="text-base font-semibold">
                  Resultados
                </TabsTrigger>
                <TabsTrigger value="history" className="text-base font-semibold">
                  Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-4 mt-6">
                {results.length === 0 ? (
                  <Card className="shadow-lg bg-card">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <p className="text-muted-foreground text-center text-base">
                        Preencha o formulário e clique em "Gerar Copy" para ver os resultados aqui
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  results.map((result, index) => (
                    <Card key={result.id} className="shadow-lg hover:shadow-xl transition-shadow bg-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-semibold">
                              {copyTypes.find((t) => t.value === result.type)?.label}
                            </Badge>
                            <Badge className="bg-primary text-primary-foreground">
                              Versão {index + 1}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLike(result.id)}
                              className={`hover:bg-accent ${result.liked ? "text-rose-500" : "text-muted-foreground"}`}
                            >
                              <Heart className={`w-4 h-4 ${result.liked ? "fill-current" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                copyToClipboard(result.content)
                                setCopiedId(result.id)
                                setTimeout(() => setCopiedId(null), 1500)
                              }}
                              className="hover:bg-accent text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="w-4 h-4" />
                              <span className="ml-1 text-xs">{copiedId === result.id ? "Copiado!" : ""}</span>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground bg-accent p-4 rounded-lg border">
                          {result.content}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-6">
                {history.length === 0 ? (
                  <Card className="shadow-lg bg-card">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Clock className="w-16 h-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center text-base">Seu histórico de copies aparecerá aqui</p>
                    </CardContent>
                  </Card>
                ) : (
                  history.slice(0, 10).map((result) => (
                    <Card key={result.id} className="shadow-lg hover:shadow-xl transition-shadow bg-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-semibold">
                              {copyTypes.find((t) => t.value === result.type)?.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{result.timestamp.toLocaleDateString()}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              copyToClipboard(result.content)
                              setCopiedId(result.id)
                              setTimeout(() => setCopiedId(null), 1500)
                            }}
                            className="hover:bg-accent text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-4 h-4" />
                            <span className="ml-1 text-xs">{copiedId === result.id ? "Copiado!" : ""}</span>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm line-clamp-3 text-muted-foreground">{result.content}</div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Usage Stats */}
            <Card className="shadow-lg bg-card">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Uso Mensal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-base">
                    <span className="font-medium text-muted-foreground">Copies geradas</span>
                    <span className="font-bold text-foreground">
                      {user?.plan === "pro" ? "Ilimitado" : `${history.length}/100`}
                    </span>
                  </div>
                  {user?.plan === "starter" && (
                    <div className="w-full bg-accent rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((history.length / 100) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                  {user?.plan === "starter" && history.length > 80 && (
                    <div className="flex items-center space-x-2 text-sm text-primary bg-accent p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>Considere fazer upgrade para Pro para copies ilimitadas</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
