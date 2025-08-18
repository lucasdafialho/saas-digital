"use client"

import { useMemo, useState } from "react"
import type React from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { BookOpen, Megaphone, ShoppingCart, Filter, LineChart, FileText, Clock, Layers3 } from "lucide-react"

type CourseCategory = "Marketing" | "Vendas" | "Funil" | "Tráfego" | "Copywriting"

interface Course {
  id: string
  title: string
  category: CourseCategory
  description: string
  level: "Iniciante" | "Intermediário" | "Avançado"
  lessons: number
  durationHours: number
  image: string
  tags: string[]
}

const allCategories: ("Todos" | CourseCategory)[] = [
  "Todos",
  "Marketing",
  "Vendas",
  "Funil",
  "Tráfego",
  "Copywriting",
]

const courses: Course[] = [
  {
    id: "mk-1",
    title: "Fundamentos de Marketing Digital",
    category: "Marketing",
    description: "Planejamento, posicionamento e jornada do cliente para negócios digitais",
    level: "Iniciante",
    lessons: 24,
    durationHours: 6,
    image: "/placeholder.jpg",
    tags: ["branding", "estratégia"],
  },
  {
    id: "mk-2",
    title: "Conteúdo que Converte",
    category: "Marketing",
    description: "Produção de conteúdo para atrair, nutrir e vender todos os dias",
    level: "Intermediário",
    lessons: 18,
    durationHours: 5,
    image: "/placeholder.jpg",
    tags: ["conteúdo", "social"],
  },
  {
    id: "vd-1",
    title: "Script de Vendas de Alta Conversão",
    category: "Vendas",
    description: "Scripts, objeções e fechamento com técnicas modernas",
    level: "Intermediário",
    lessons: 20,
    durationHours: 4,
    image: "/placeholder.jpg",
    tags: ["fechamento", "objeções"],
  },
  {
    id: "vd-2",
    title: "Funil de Vendas no WhatsApp",
    category: "Vendas",
    description: "Processo completo de captação ao pós-venda usando automações",
    level: "Iniciante",
    lessons: 16,
    durationHours: 3,
    image: "/placeholder.jpg",
    tags: ["whatsapp", "automação"],
  },
  {
    id: "fl-1",
    title: "Arquitetura de Funis Lucrativos",
    category: "Funil",
    description: "Mapeamento, métricas e orquestração de etapas de conversão",
    level: "Avançado",
    lessons: 28,
    durationHours: 8,
    image: "/placeholder.jpg",
    tags: ["métricas", "orquestração"],
  },
  {
    id: "tf-1",
    title: "Tráfego Pago Essencial",
    category: "Tráfego",
    description: "Estratégias base para Meta Ads e Google Ads focadas em ROI",
    level: "Iniciante",
    lessons: 22,
    durationHours: 6,
    image: "/placeholder.jpg",
    tags: ["meta ads", "google ads"],
  },
  {
    id: "tf-2",
    title: "Escala com Criativos",
    category: "Tráfego",
    description: "Teste e otimização de criativos usando dados de performance",
    level: "Intermediário",
    lessons: 14,
    durationHours: 3,
    image: "/placeholder.jpg",
    tags: ["criativos", "testes"],
  },
  {
    id: "cp-1",
    title: "Copywriting para Lançamentos",
    category: "Copywriting",
    description: "Estruturas e mensagens para CPL, VSL e páginas de vendas",
    level: "Avançado",
    lessons: 26,
    durationHours: 7,
    image: "/placeholder.jpg",
    tags: ["vsl", "páginas"],
  },
  {
    id: "cp-2",
    title: "E-mails que Vendem Todos os Dias",
    category: "Copywriting",
    description: "Sequências, nutrição e ofertas para e-mail marketing",
    level: "Intermediário",
    lessons: 17,
    durationHours: 4,
    image: "/placeholder.jpg",
    tags: ["e-mail", "ofertas"],
  },
]

const categoryToIcon: Record<"Todos" | CourseCategory, React.ComponentType<{ className?: string }>> = {
  Todos: Layers3,
  Marketing: Megaphone,
  Vendas: ShoppingCart,
  Funil: Filter,
  Tráfego: LineChart,
  Copywriting: FileText,
}

export default function ContentsPage() {
  const [selected, setSelected] = useState<"Todos" | CourseCategory>("Todos")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesCategory = selected === "Todos" || c.category === selected
      const matchesQuery =
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      return matchesCategory && matchesQuery
    })
  }, [selected, query])

  return (
    <div className="space-y-8" data-animate>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conteúdos</h1>
          <p className="text-muted-foreground">Cursos e materiais organizados por categoria</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          <span>{filtered.length} itens</span>
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Categorias</CardTitle>
          <CardDescription>Selecione uma categoria ou pesquise por nome, tema ou tag</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={selected} onValueChange={(v) => setSelected(v as any)} className="w-full">
            <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 h-12">
              {allCategories.map((cat) => {
                const Icon = categoryToIcon[cat]
                return (
                  <TabsTrigger key={cat} value={cat} className="text-sm">
                    <Icon className="w-4 h-4 mr-2" />
                    {cat}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {allCategories.map((cat) => (
              <TabsContent key={cat} value={cat} />
            ))}
          </Tabs>

          <div className="relative">
            <Input
              placeholder="Buscar cursos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <Card key={course.id} className="overflow-hidden bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-animate>
            <div className="relative h-40 w-full">
              <Image src={course.image} alt={course.title} fill className="object-cover" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{course.category}</Badge>
                <Badge className="bg-primary/10 text-primary">{course.level}</Badge>
              </div>
              <CardTitle className="text-lg text-foreground">{course.title}</CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.durationHours}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers3 className="w-4 h-4" />
                  <span>{course.lessons} aulas</span>
                </div>
                <div className="truncate max-w-[45%]">
                  {course.tags.slice(0, 2).map((t) => (
                    <Badge key={t} variant="secondary" className="mr-1 text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <Button className="w-full">Acessar Curso</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


