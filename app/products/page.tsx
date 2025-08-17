"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Target,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Heart,
  Eye,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Product {
  id: string
  title: string
  category: string
  description: string
  demandScore: number
  competitionLevel: "low" | "medium" | "high"
  priceRange: string
  monthlySearches: number
  profitPotential: "low" | "medium" | "high" | "very-high"
  trend: "up" | "down" | "stable"
  tags: string[]
  validationScore: number
  timeToMarket: string
  targetAudience: string
  keyBenefits: string[]
  marketSize: string
  isFavorite?: boolean
}

const mockProducts: Product[] = [
  {
    id: "1",
    title: "Curso de Dropshipping para Iniciantes",
    category: "E-commerce",
    description: "Curso completo sobre como começar no dropshipping sem investimento inicial",
    demandScore: 92,
    competitionLevel: "medium",
    priceRange: "R$ 197 - R$ 497",
    monthlySearches: 45000,
    profitPotential: "very-high",
    trend: "up",
    tags: ["dropshipping", "e-commerce", "iniciantes", "renda extra"],
    validationScore: 88,
    timeToMarket: "2-3 semanas",
    targetAudience: "Pessoas buscando renda extra online",
    keyBenefits: ["Baixo investimento inicial", "Mercado em crescimento", "Alta demanda"],
    marketSize: "R$ 2.3M/mês",
  },
  {
    id: "2",
    title: "Método de Organização Pessoal",
    category: "Produtividade",
    description: "Sistema completo para organizar vida pessoal e profissional",
    demandScore: 78,
    competitionLevel: "low",
    priceRange: "R$ 97 - R$ 297",
    monthlySearches: 28000,
    profitPotential: "high",
    trend: "up",
    tags: ["produtividade", "organização", "lifestyle", "bem-estar"],
    validationScore: 85,
    timeToMarket: "1-2 semanas",
    targetAudience: "Profissionais sobrecarregados",
    keyBenefits: ["Baixa concorrência", "Nicho evergreen", "Fácil produção"],
    marketSize: "R$ 890K/mês",
  },
  {
    id: "3",
    title: "Curso de Investimentos em Criptomoedas",
    category: "Finanças",
    description: "Guia completo para investir em criptomoedas com segurança",
    demandScore: 95,
    competitionLevel: "high",
    priceRange: "R$ 297 - R$ 997",
    monthlySearches: 67000,
    profitPotential: "very-high",
    trend: "up",
    tags: ["criptomoedas", "investimentos", "bitcoin", "finanças"],
    validationScore: 91,
    timeToMarket: "3-4 semanas",
    targetAudience: "Investidores iniciantes e intermediários",
    keyBenefits: ["Altíssima demanda", "Tickets altos", "Mercado aquecido"],
    marketSize: "R$ 4.2M/mês",
  },
  {
    id: "4",
    title: "Receitas Fitness Low Carb",
    category: "Saúde",
    description: "E-book com 100+ receitas saudáveis e saborosas",
    demandScore: 71,
    competitionLevel: "medium",
    priceRange: "R$ 47 - R$ 147",
    monthlySearches: 35000,
    profitPotential: "medium",
    trend: "stable",
    tags: ["fitness", "receitas", "low-carb", "emagrecimento"],
    validationScore: 76,
    timeToMarket: "1 semana",
    targetAudience: "Pessoas em dieta e atletas",
    keyBenefits: ["Produção rápida", "Nicho fiel", "Baixo custo"],
    marketSize: "R$ 650K/mês",
  },
  {
    id: "5",
    title: "Curso de Marketing para Psicólogos",
    category: "Marketing",
    description: "Como psicólogos podem atrair mais pacientes online",
    demandScore: 84,
    competitionLevel: "low",
    priceRange: "R$ 397 - R$ 797",
    monthlySearches: 12000,
    profitPotential: "high",
    trend: "up",
    tags: ["psicologia", "marketing", "consultório", "pacientes"],
    validationScore: 89,
    timeToMarket: "2-3 semanas",
    targetAudience: "Psicólogos autônomos",
    keyBenefits: ["Nicho específico", "Alto valor percebido", "Pouca concorrência"],
    marketSize: "R$ 480K/mês",
  },
  {
    id: "6",
    title: "Planilhas de Controle Financeiro",
    category: "Finanças",
    description: "Kit completo de planilhas para organização financeira",
    demandScore: 69,
    competitionLevel: "medium",
    priceRange: "R$ 27 - R$ 97",
    monthlySearches: 22000,
    profitPotential: "medium",
    trend: "stable",
    tags: ["planilhas", "finanças", "controle", "organização"],
    validationScore: 72,
    timeToMarket: "3-5 dias",
    targetAudience: "Pessoas desorganizadas financeiramente",
    keyBenefits: ["Produção muito rápida", "Baixo investimento", "Demanda constante"],
    marketSize: "R$ 320K/mês",
  },
]

const categories = ["Todos", "E-commerce", "Produtividade", "Finanças", "Saúde", "Marketing", "Educação"]
const competitionLevels = ["Todos", "low", "medium", "high"]
const profitPotentials = ["Todos", "low", "medium", "high", "very-high"]

export default function ProductsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [selectedCompetition, setSelectedCompetition] = useState("Todos")
  const [selectedProfit, setSelectedProfit] = useState("Todos")
  const [sortBy, setSortBy] = useState("demandScore")
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const filteredProducts = useMemo(() => {
    const filtered = mockProducts.filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory
      const matchesCompetition = selectedCompetition === "Todos" || product.competitionLevel === selectedCompetition
      const matchesProfit = selectedProfit === "Todos" || product.profitPotential === selectedProfit

      return matchesSearch && matchesCategory && matchesCompetition && matchesProfit
    })

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "demandScore":
          return b.demandScore - a.demandScore
        case "validationScore":
          return b.validationScore - a.validationScore
        case "monthlySearches":
          return b.monthlySearches - a.monthlySearches
        default:
          return 0
      }
    })

    return filtered
  }, [searchTerm, selectedCategory, selectedCompetition, selectedProfit, sortBy])

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "high":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getProfitColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-gray-600 bg-gray-50"
      case "medium":
        return "text-blue-600 bg-blue-50"
      case "high":
        return "text-green-600 bg-green-50"
      case "very-high":
        return "text-emerald-600 bg-emerald-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos Nichados</h1>
          <p className="text-muted-foreground">Descubra produtos digitais validados com alta demanda</p>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Target className="w-3 h-3" />
          <span>{filteredProducts.length} produtos encontrados</span>
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Concorrência</Label>
              <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {competitionLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level === "Todos" ? "Todos" : level === "low" ? "Baixa" : level === "medium" ? "Média" : "Alta"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Potencial de Lucro</Label>
              <Select value={selectedProfit} onValueChange={setSelectedProfit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profitPotentials.map((profit) => (
                    <SelectItem key={profit} value={profit}>
                      {profit === "Todos"
                        ? "Todos"
                        : profit === "low"
                          ? "Baixo"
                          : profit === "medium"
                            ? "Médio"
                            : profit === "high"
                              ? "Alto"
                              : "Muito Alto"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demandScore">Demanda</SelectItem>
                  <SelectItem value="validationScore">Validação</SelectItem>
                  <SelectItem value="monthlySearches">Buscas Mensais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">{product.category}</Badge>
                        <Badge className={getCompetitionColor(product.competitionLevel)}>
                          {product.competitionLevel === "low"
                            ? "Baixa Concorrência"
                            : product.competitionLevel === "medium"
                              ? "Média Concorrência"
                              : "Alta Concorrência"}
                        </Badge>
                        <Badge className={getProfitColor(product.profitPotential)}>
                          {product.profitPotential === "low"
                            ? "Baixo Lucro"
                            : product.profitPotential === "medium"
                              ? "Médio Lucro"
                              : product.profitPotential === "high"
                                ? "Alto Lucro"
                                : "Muito Alto Lucro"}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{product.title}</CardTitle>
                      <CardDescription className="mt-2">{product.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(product.id)}
                        className={favorites.includes(product.id) ? "text-red-500" : ""}
                      >
                        <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(product)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{product.demandScore}</div>
                      <div className="text-xs text-muted-foreground">Score Demanda</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{product.validationScore}</div>
                      <div className="text-xs text-muted-foreground">Score Validação</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{(product.monthlySearches / 1000).toFixed(0)}K</div>
                      <div className="text-xs text-muted-foreground">Buscas/mês</div>
                    </div>
                    <div className="text-center flex items-center justify-center">
                      {getTrendIcon(product.trend)}
                      <span className="text-xs text-muted-foreground ml-1">Tendência</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      {product.priceRange}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {product.timeToMarket}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {product.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {product.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{product.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Product Details Sidebar */}
        <div className="space-y-6">
          {selectedProduct ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Análise Detalhada</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{selectedProduct.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Tamanho do Mercado:</span>
                    <span className="text-sm font-medium">{selectedProduct.marketSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Público-Alvo:</span>
                    <span className="text-sm font-medium">{selectedProduct.targetAudience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Faixa de Preço:</span>
                    <span className="text-sm font-medium">{selectedProduct.priceRange}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Principais Benefícios:</h4>
                  <ul className="space-y-1">
                    {selectedProduct.keyBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Score de Oportunidade:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${selectedProduct.validationScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{selectedProduct.validationScore}/100</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-accent hover:bg-accent/90">Gerar Copy para Este Produto</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Clique no ícone de visualização de um produto para ver a análise detalhada
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Produtos Analisados:</span>
                <span className="text-sm font-medium">2,847</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Oportunidades Validadas:</span>
                <span className="text-sm font-medium">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Mercado Total:</span>
                <span className="text-sm font-medium">R$ 12.4M/mês</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Seus Favoritos:</span>
                <span className="text-sm font-medium">{favorites.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pro Features */}
          {user?.plan === "starter" && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Star className="w-5 h-5 text-primary" />
                  <span>Recursos Pro</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span>Análise de concorrentes</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span>Histórico de tendências</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span>Alertas de oportunidades</span>
                </div>
                <Button size="sm" className="w-full bg-accent hover:bg-accent/90">
                  Fazer Upgrade
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
