"use client"

import { useState } from "react"
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
  Zap,
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
  { value: "headline", label: "Headlines", icon: Megaphone, description: "Títulos que chamam atenção" },
  { value: "email", label: "E-mails de Vendas", icon: Mail, description: "E-mails persuasivos" },
  { value: "social", label: "Posts Sociais", icon: MessageSquare, description: "Conteúdo para redes sociais" },
  { value: "ad", label: "Anúncios", icon: Sparkles, description: "Textos para anúncios pagos" },
  { value: "description", label: "Descrições", icon: FileText, description: "Descrições de produtos" },
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

  const handleGenerate = async () => {
    if (!formData.product || !formData.audience || !formData.benefit) {
      return
    }

    setIsGenerating(true)

    try {
      // Simulate API call to Gemini
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockResults: CopyResult[] = [
        {
          id: Date.now().toString(),
          type: selectedType,
          content: generateMockCopy(selectedType, formData),
          timestamp: new Date(),
          liked: false,
        },
        {
          id: (Date.now() + 1).toString(),
          type: selectedType,
          content: generateMockCopy(selectedType, formData, 2),
          timestamp: new Date(),
          liked: false,
        },
        {
          id: (Date.now() + 2).toString(),
          type: selectedType,
          content: generateMockCopy(selectedType, formData, 3),
          timestamp: new Date(),
          liked: false,
        },
      ]

      setResults(mockResults)
      setHistory((prev) => [...mockResults, ...prev])
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerador de Copy IA</h1>
          <p className="text-muted-foreground">Crie textos persuasivos em segundos com inteligência artificial</p>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3" />
          <span>Powered by Gemini</span>
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Configurar Copy</span>
              </CardTitle>
              <CardDescription>Preencha as informações para gerar copies personalizadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Copy Type Selection */}
              <div className="space-y-3">
                <Label>Tipo de Copy</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {copyTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={`p-4 rounded-lg border text-left transition-colors ${
                          selectedType === type.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-2 text-primary" />
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produto/Serviço *</Label>
                  <Input
                    id="product"
                    placeholder="Ex: Curso de Marketing Digital"
                    value={formData.product}
                    onChange={(e) => setFormData((prev) => ({ ...prev, product: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Público-Alvo *</Label>
                  <Input
                    id="audience"
                    placeholder="Ex: Empreendedores iniciantes"
                    value={formData.audience}
                    onChange={(e) => setFormData((prev) => ({ ...prev, audience: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefit">Principal Benefício *</Label>
                <Input
                  id="benefit"
                  placeholder="Ex: Aumentar vendas em 300%"
                  value={formData.benefit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benefit: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tom de Voz</Label>
                <Select
                  value={formData.tone}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, tone: value }))}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="context">Contexto Adicional</Label>
                <Textarea
                  id="context"
                  placeholder="Informações extras sobre seu produto, promoções, urgência, etc."
                  value={formData.context}
                  onChange={(e) => setFormData((prev) => ({ ...prev, context: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.product || !formData.audience || !formData.benefit}
                className="w-full bg-accent hover:bg-accent/90"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Copy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Templates */}
          {selectedTypeData && templates[selectedType as keyof typeof templates] && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates de {selectedTypeData.label}</CardTitle>
                <CardDescription>Exemplos de estruturas que funcionam</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {templates[selectedType as keyof typeof templates].map((template, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                      {template}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="results">Resultados</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              {results.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Preencha o formulário e clique em "Gerar Copy" para ver os resultados aqui
                    </p>
                  </CardContent>
                </Card>
              ) : (
                results.map((result) => (
                  <Card key={result.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{copyTypes.find((t) => t.value === result.type)?.label}</Badge>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLike(result.id)}
                            className={result.liked ? "text-red-500" : ""}
                          >
                            <Heart className={`w-4 h-4 ${result.liked ? "fill-current" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.content)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm">{result.content}</div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {history.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">Seu histórico de copies aparecerá aqui</p>
                  </CardContent>
                </Card>
              ) : (
                history.slice(0, 10).map((result) => (
                  <Card key={result.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{copyTypes.find((t) => t.value === result.type)?.label}</Badge>
                          <span className="text-xs text-muted-foreground">{result.timestamp.toLocaleDateString()}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.content)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm line-clamp-3">{result.content}</div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uso Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Copies geradas</span>
                  <span>{user?.plan === "pro" ? "Ilimitado" : `${history.length}/100`}</span>
                </div>
                {user?.plan === "starter" && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min((history.length / 100) * 100, 100)}%` }}
                    />
                  </div>
                )}
                {user?.plan === "starter" && history.length > 80 && (
                  <div className="flex items-center space-x-2 text-sm text-amber-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Considere fazer upgrade para Pro</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
