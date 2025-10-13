"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Star, StarOff, Sparkles, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase-client"
import Link from "next/link"

interface BusinessTemplate {
  id: string
  name: string
  is_default: boolean
  company_name: string | null
  company_description: string | null
  niche: string | null
  target_audience: string | null
  product_name: string | null
  product_description: string | null
  product_benefits: string | null
  product_price: string | null
  tone: string
  voice_style: string | null
  keywords: string[] | null
  tags: string[] | null
  usage_count: number
  last_used_at: string | null
  created_at: string
}

export default function TemplatesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<BusinessTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<BusinessTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    company_description: "",
    niche: "",
    target_audience: "",
    product_name: "",
    product_description: "",
    product_benefits: "",
    product_price: "",
    tone: "professional",
    voice_style: "",
    keywords: "",
    is_default: false,
  })

  // Verificar se é Pro
  const isPro = user?.plan === "pro"

  useEffect(() => {
    if (user) {
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("business_templates")
      .select("*")
      .eq("user_id", user?.id)
      .order("is_default", { ascending: false })
      .order("last_used_at", { ascending: false, nullsFirst: false })

    if (error) {
      toast({
        title: "Erro ao carregar templates",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setTemplates(data || [])
    }
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPro) {
      toast({
        title: "Recurso exclusivo Pro",
        description: "Faça upgrade para Pro para criar templates personalizados",
        variant: "destructive",
      })
      return
    }

    const supabase = createClient()

    const templateData = {
      name: formData.name,
      company_name: formData.company_name || null,
      company_description: formData.company_description || null,
      niche: formData.niche || null,
      target_audience: formData.target_audience || null,
      product_name: formData.product_name || null,
      product_description: formData.product_description || null,
      product_benefits: formData.product_benefits || null,
      product_price: formData.product_price || null,
      tone: formData.tone,
      voice_style: formData.voice_style || null,
      keywords: formData.keywords ? formData.keywords.split(",").map(k => k.trim()) : null,
      is_default: formData.is_default,
      user_id: user?.id,
    }

    if (editingTemplate) {
      // Update
      const { error } = await supabase
        .from("business_templates")
        .update(templateData)
        .eq("id", editingTemplate.id)

      if (error) {
        toast({
          title: "Erro ao atualizar template",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Template atualizado!",
          description: "Seu template foi atualizado com sucesso",
        })
        setIsDialogOpen(false)
        resetForm()
        loadTemplates()
      }
    } else {
      // Create
      const { error } = await supabase
        .from("business_templates")
        .insert(templateData)

      if (error) {
        toast({
          title: "Erro ao criar template",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Template criado!",
          description: "Seu template foi criado com sucesso",
        })
        setIsDialogOpen(false)
        resetForm()
        loadTemplates()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return

    const supabase = createClient()
    const { error } = await supabase
      .from("business_templates")
      .delete()
      .eq("id", id)

    if (error) {
      toast({
        title: "Erro ao excluir template",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Template excluído",
        description: "O template foi removido com sucesso",
      })
      loadTemplates()
    }
  }

  const handleSetDefault = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("business_templates")
      .update({ is_default: true })
      .eq("id", id)

    if (error) {
      toast({
        title: "Erro ao definir template padrão",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Template padrão definido",
        description: "Este template será usado automaticamente",
      })
      loadTemplates()
    }
  }

  const handleEdit = (template: BusinessTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      company_name: template.company_name || "",
      company_description: template.company_description || "",
      niche: template.niche || "",
      target_audience: template.target_audience || "",
      product_name: template.product_name || "",
      product_description: template.product_description || "",
      product_benefits: template.product_benefits || "",
      product_price: template.product_price || "",
      tone: template.tone,
      voice_style: template.voice_style || "",
      keywords: template.keywords?.join(", ") || "",
      is_default: template.is_default,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      company_name: "",
      company_description: "",
      niche: "",
      target_audience: "",
      product_name: "",
      product_description: "",
      product_benefits: "",
      product_price: "",
      tone: "professional",
      voice_style: "",
      keywords: "",
      is_default: false,
    })
    setEditingTemplate(null)
  }

  if (!isPro) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Recurso Exclusivo Pro</CardTitle>
            <CardDescription>
              Templates de empresa estão disponíveis apenas para usuários do plano Pro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">O que você ganha com Templates:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Salve informações da sua empresa uma vez</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Use presets em todos os geradores de IA</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Crie múltiplos templates para diferentes produtos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Gere conteúdo 10x mais rápido</span>
                </li>
              </ul>
            </div>
            <Button className="w-full" asChild>
              <Link href="/dashboard/planos">
                Fazer Upgrade para Pro
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Empresa</h1>
          <p className="text-muted-foreground mt-2">
            Salve presets de informações da sua empresa para usar nos geradores de IA
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Template" : "Novo Template"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações da sua empresa. Você pode deixar campos vazios se não aplicável.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Loja Principal, Produto X"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Escolha um nome para identificar este template
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Ex: TechStore Brasil"
                  />
                </div>

                <div>
                  <Label htmlFor="niche">Nicho/Segmento</Label>
                  <Input
                    id="niche"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    placeholder="Ex: Tecnologia e Eletrônicos"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company_description">Descrição da Empresa</Label>
                <Textarea
                  id="company_description"
                  value={formData.company_description}
                  onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                  placeholder="Descreva sua empresa em poucas linhas"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="target_audience">Público-Alvo</Label>
                <Textarea
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  placeholder="Ex: Jovens profissionais de 25-40 anos, tech-savvy"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product_name">Nome do Produto/Serviço</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="Ex: Smartphone XYZ Pro"
                  />
                </div>

                <div>
                  <Label htmlFor="product_price">Faixa de Preço</Label>
                  <Input
                    id="product_price"
                    value={formData.product_price}
                    onChange={(e) => setFormData({ ...formData, product_price: e.target.value })}
                    placeholder="Ex: R$ 2.000 - R$ 3.000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product_description">Descrição do Produto</Label>
                <Textarea
                  id="product_description"
                  value={formData.product_description}
                  onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                  placeholder="Descreva seu produto ou serviço"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="product_benefits">Principais Benefícios</Label>
                <Textarea
                  id="product_benefits"
                  value={formData.product_benefits}
                  onChange={(e) => setFormData({ ...formData, product_benefits: e.target.value })}
                  placeholder="Liste os principais benefícios do seu produto"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="tone">Tom de Voz</Label>
                <Select
                  value={formData.tone}
                  onValueChange={(value) => setFormData({ ...formData, tone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Amigável</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="luxury">Luxo/Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="Ex: tecnologia, inovação, qualidade"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Definir como template padrão
                </Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTemplate ? "Atualizar" : "Criar Template"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum template criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro template para agilizar a criação de conteúdo
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className={template.is_default ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{template.name}</span>
                      {template.is_default && (
                        <Badge variant="default" className="ml-2">
                          <Star className="w-3 h-3 mr-1" />
                          Padrão
                        </Badge>
                      )}
                    </CardTitle>
                    {template.company_name && (
                      <CardDescription className="mt-1">{template.company_name}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {template.niche && (
                    <div>
                      <span className="text-muted-foreground">Nicho:</span> {template.niche}
                    </div>
                  )}
                  {template.product_name && (
                    <div>
                      <span className="text-muted-foreground">Produto:</span> {template.product_name}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Tom:</span>{" "}
                    {template.tone === "professional" ? "Profissional" :
                     template.tone === "casual" ? "Casual" :
                     template.tone === "friendly" ? "Amigável" :
                     template.tone === "urgent" ? "Urgente" : "Luxo"}
                  </div>
                  {template.usage_count > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Usado {template.usage_count} {template.usage_count === 1 ? "vez" : "vezes"}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {!template.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(template.id)}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
