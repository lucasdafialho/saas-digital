import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Brain, BarChart3, Shield, Users, Zap } from "lucide-react"
import Link from "next/link"
import { ScrollAnimate } from "@/components/scroll-animate"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollAnimate />
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
              <div className="w-6 h-6 bg-primary-foreground rounded-sm"></div>
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">MarketPro</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#platform" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Plataforma
            </a>
            <a href="#solutions" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Soluções
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Preços
            </a>
            <a href="#resources" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Recursos
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="default" className="transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="default" className="transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5" asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-24 px-6" data-animate>
        <div className="container mx-auto text-center max-w-5xl">
          <Badge variant="secondary" className="mb-8 px-4 py-2 text-sm font-medium">
            Plataforma de Marketing Digital com IA
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
            Transforme Seu Marketing
            <span className="text-primary block">Com Inteligência Artificial</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Plataforma completa de marketing digital que combina geração de copy por IA com análise de produtos nichados
            para impulsionar suas vendas online.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button size="lg" className="text-lg px-10 py-4 transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5" asChild>
              <Link href="/register">Start free</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-10 py-4 bg-transparent transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5">
              View demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-12 text-sm text-muted-foreground">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-primary" />
              <span>Dados Seguros</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-primary" />
              <span>Suporte 24/7</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>Garantia de Resultados</span>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="py-24 px-6 bg-muted/20" data-animate>
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Funcionalidades da Plataforma</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ferramentas completas de marketing digital projetadas para empreendedores que querem vender mais online.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-border bg-card transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:border-primary/40" data-animate>
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Brain className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Gerador de Copy IA</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Crie textos persuasivos para vendas, e-mails, anúncios e redes sociais em segundos com inteligência
                  artificial avançada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Headlines que convertem</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>E-mails de vendas</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Posts para redes sociais</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:border-primary/40" data-animate>
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Produtos Nichados</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Descubra produtos digitais validados com alta demanda e baixa concorrência para maximizar seus lucros.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Análise de demanda</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Nível de concorrência</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Potencial de lucro</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:border-primary/40" data-animate>
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Analytics Avançado</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Acompanhe o desempenho das suas campanhas e otimize seus resultados com relatórios detalhados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Taxa de conversão</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>ROI das campanhas</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Relatórios personalizados</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6" data-animate>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Planos e Preços</h2>
            <p className="text-xl text-muted-foreground">
              Escolha o plano ideal para o seu negócio e comece a vender mais hoje mesmo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-border transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:border-primary/40" data-animate>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl mb-2">Starter</CardTitle>
                <CardDescription className="text-base">Para empreendedores iniciantes</CardDescription>
                <div className="text-4xl font-bold mt-4">
                  R$ 97<span className="text-lg font-normal text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>100 copies IA por mês</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Acesso aos produtos nichados</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Relatórios básicos</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Suporte por e-mail</span>
                  </li>
                </ul>
                <Button className="w-full bg-transparent transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5" variant="outline" asChild>
                  <Link href="/register">Start free</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary relative transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl" data-animate>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">Mais Popular</Badge>
              </div>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl mb-2">Pro</CardTitle>
                <CardDescription className="text-base">Para empreendedores sérios</CardDescription>
                <div className="text-4xl font-bold mt-4">
                  R$ 197<span className="text-lg font-normal text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Copies IA ilimitadas</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Todos os produtos nichados</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Analytics avançado</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Templates exclusivos</span>
                  </li>
                </ul>
                <Button className="w-full transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5" asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-primary text-primary-foreground" data-animate>
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Pronto para vender mais?</h2>
          <p className="text-xl mb-12 opacity-90 leading-relaxed">
            Junte-se a milhares de empreendedores que já usam a MarketPro para impulsionar as vendas online.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-10 py-4 transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5" asChild>
              <Link href="/register">Start free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-4 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5"
            >
              View demo
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 border-t bg-muted/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary-foreground rounded-sm"></div>
                </div>
                <span className="text-2xl font-bold tracking-tight">MarketPro</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Plataforma completa de marketing digital para empreendedores que querem vender mais.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-lg">Plataforma</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Gerador de Copy IA
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Produtos Nichados
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentação
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-lg">Empresa</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Sobre Nós
                  </a>
                </li>
                
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Segurança
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-lg">Suporte</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Status do Sistema
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Política de Privacidade
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 MarketPro. Todos os direitos reservados. Plataforma de marketing digital.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
