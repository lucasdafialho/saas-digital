import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Rocket,
  Zap,
  Target,
  TrendingUp,
  FileText,
  ShoppingCart,
  Megaphone,
  BarChart3,
  CheckCircle2,
  Play,
  Lightbulb
} from "lucide-react"

export default function GuiaRapido() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/konvexy/konvexy-logo-transparent.png" alt="Konvexy" className="h-10 w-auto" />
            <span className="text-2xl font-bold tracking-tight">Konvexy</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                Ir para Dashboard
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <Rocket className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Bem-vindo à Konvexy! 🎉</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Sua jornada para transformar marketing com IA começa aqui. Siga este guia rápido
            para dominar todas as funcionalidades e começar a criar copys que convertem.
          </p>
        </div>

        {/* Quick Start Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Primeiros Passos em 3 Minutos</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle className="text-xl">Configure seu Perfil</CardTitle>
                <CardDescription>Personalize suas preferências</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Vá em Configurações → Perfil</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Adicione informações do seu negócio</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Escolha suas preferências de tom</span>
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm" asChild>
                  <Link href="/dashboard/configuracoes">
                    Configurar agora
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">2</span>
                </div>
                <CardTitle className="text-xl">Crie sua Primeira Copy</CardTitle>
                <CardDescription>Teste o poder da IA</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Acesse "Gerador de Copy"</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Preencha os campos com seu produto</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Clique em "Gerar" e veja a mágica!</span>
                  </li>
                </ul>
                <Button className="w-full mt-4" size="sm" asChild>
                  <Link href="/dashboard/copy-generator">
                    <Play className="w-4 h-4 mr-2" />
                    Começar agora
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle className="text-xl">Explore as Ferramentas</CardTitle>
                <CardDescription>Descubra todo o potencial</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Teste o Gerador de Funis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Crie estratégias de Ads</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Explore produtos nichados</span>
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm" asChild>
                  <Link href="/dashboard/ferramentas">
                    Ver ferramentas
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Conheça as Funcionalidades</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <CardTitle>Gerador de Copy IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Crie textos persuasivos para vendas, e-mails, anúncios e redes sociais em segundos.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">O que você pode criar:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Headlines que chamam atenção</li>
                    <li>• Descrições de produtos</li>
                    <li>• E-mails de vendas</li>
                    <li>• Posts para redes sociais</li>
                    <li>• Scripts de vídeo</li>
                  </ul>
                </div>
                <Button className="w-full" variant="outline" size="sm" asChild>
                  <Link href="/dashboard/copy-generator">Experimentar</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-500" />
                  </div>
                  <CardTitle>Gerador de Funis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Construa funis de vendas completos com estratégias testadas e aprovadas.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Estrutura do funil:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Topo: Atração e conscientização</li>
                    <li>• Meio: Consideração e interesse</li>
                    <li>• Fundo: Conversão e vendas</li>
                    <li>• Pós-venda: Fidelização</li>
                  </ul>
                </div>
                <Button className="w-full" variant="outline" size="sm" asChild>
                  <Link href="/dashboard/ferramentas">Criar funil</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-green-500" />
                  </div>
                  <CardTitle>Estratégias de Ads</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Crie campanhas de anúncios otimizadas para Google Ads, Facebook e Instagram.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Inclui:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Segmentação de público</li>
                    <li>• Copys para anúncios</li>
                    <li>• Estratégias de lance</li>
                    <li>• Palavras-chave sugeridas</li>
                  </ul>
                </div>
                <Button className="w-full" variant="outline" size="sm" asChild>
                  <Link href="/dashboard/ads">Criar estratégia</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-amber-500" />
                  </div>
                  <CardTitle>Produtos Nichados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Descubra produtos validados com alta demanda e baixa concorrência.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Análise inclui:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Volume de busca mensal</li>
                    <li>• Nível de concorrência</li>
                    <li>• Potencial de lucro</li>
                    <li>• Sazonalidade</li>
                  </ul>
                </div>
                <Button className="w-full" variant="outline" size="sm" asChild>
                  <Link href="/dashboard/products">Explorar produtos</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Dicas para Melhores Resultados</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Seja Específico</h3>
                    <p className="text-sm text-muted-foreground">
                      Quanto mais detalhes você fornecer sobre seu produto, público e benefícios,
                      melhores serão os resultados da IA.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Teste Variações</h3>
                    <p className="text-sm text-muted-foreground">
                      Gere múltiplas versões da mesma copy e teste qual performa melhor
                      com seu público.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Personalize o Resultado</h3>
                    <p className="text-sm text-muted-foreground">
                      Use as copys geradas como base e adapte para o tom e estilo
                      da sua marca.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Acompanhe Métricas</h3>
                    <p className="text-sm text-muted-foreground">
                      Use o Analytics para monitorar quais copys e estratégias
                      geram melhores resultados.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Plan Info */}
        <div className="mb-16">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">Sobre seu Plano Atual</h2>
                <p className="text-muted-foreground mb-6">
                  Você pode verificar seu limite de gerações mensais, histórico de uso
                  e fazer upgrade do seu plano a qualquer momento no Dashboard.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild>
                    <Link href="/dashboard">
                      Ver Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/planos">
                      Ver Planos
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Precisa de Ajuda?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Estamos aqui para ajudar! Se tiver dúvidas ou precisar de suporte,
            acesse as configurações da plataforma ou nos contate diretamente.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/configuracoes">
                Configurações
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/legal/termos">
                Termos de Uso
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 px-6 bg-muted/10">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <p>&copy; 2025 Konvexy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
