import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/konvexy/konvexy-logo-transparent.png" alt="Konvexy" className="h-10 w-auto" />
            <span className="text-2xl font-bold tracking-tight">Konvexy</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e usar a plataforma Konvexy ("Plataforma"), você concorda em cumprir e estar vinculado a estes Termos de Uso.
              Se você não concordar com qualquer parte destes termos, não deverá usar nossa Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              A Konvexy é uma plataforma de marketing digital que oferece:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Geração de copys de marketing utilizando Inteligência Artificial</li>
              <li>Análise de produtos nichados para e-commerce</li>
              <li>Ferramentas de criação de funis de vendas</li>
              <li>Estratégias de anúncios e Marketing Model Canvas</li>
              <li>Analytics e relatórios de desempenho</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Cadastro e Conta de Usuário</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>3.1.</strong> Para utilizar a Plataforma, você deve criar uma conta fornecendo informações verdadeiras,
              completas e atualizadas.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>3.2.</strong> Você é responsável por manter a confidencialidade de sua senha e por todas as atividades
              que ocorram em sua conta.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>3.3.</strong> Você deve ter pelo menos 18 anos de idade para usar a Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Planos e Pagamentos</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>4.1. Planos Disponíveis:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-3">
              <li><strong>Gratuito:</strong> Acesso limitado a 5 gerações de copy por mês</li>
              <li><strong>Starter:</strong> 100 copys geradas por IA por mês - R$ 49,90/mês</li>
              <li><strong>Pro:</strong> Geração ilimitada de copys por IA - R$ 149,90/mês</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>4.2.</strong> Os pagamentos são processados através do MercadoPago, uma plataforma segura de pagamentos.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>4.3.</strong> As assinaturas são renovadas automaticamente no mesmo dia de cada mês,
              a menos que canceladas antes da data de renovação.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>4.4.</strong> Reservamo-nos o direito de modificar os preços dos planos mediante aviso prévio de 30 dias.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>5.1.</strong> Você concorda em NÃO usar a Plataforma para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Criar conteúdo ilegal, fraudulento, enganoso ou difamatório</li>
              <li>Violar direitos de propriedade intelectual de terceiros</li>
              <li>Distribuir spam, malware ou conteúdo malicioso</li>
              <li>Realizar engenharia reversa ou tentar acessar sistemas não autorizados</li>
              <li>Revender ou redistribuir o acesso à Plataforma sem autorização</li>
              <li>Usar bots, scripts ou automações não autorizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>6.1.</strong> Todo o conteúdo da Plataforma, incluindo design, código, logotipos, textos e funcionalidades,
              é de propriedade exclusiva da Konvexy e está protegido por leis de propriedade intelectual.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>6.2.</strong> Os conteúdos gerados pela IA (copys, funis, estratégias) criados através da Plataforma
              pertencem a você, o usuário, e podem ser usados livremente para fins comerciais.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>6.3.</strong> Você concede à Konvexy uma licença limitada para usar exemplos anônimos de conteúdo gerado
              para fins de melhoria do serviço e marketing, sem identificação de sua autoria.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>7.1.</strong> A Konvexy fornece a Plataforma "como está" e não garante que o serviço será
              ininterrupto, livre de erros ou completamente seguro.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>7.2.</strong> Não nos responsabilizamos por resultados comerciais obtidos através do uso
              do conteúdo gerado pela Plataforma.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>7.3.</strong> Nossa responsabilidade máxima é limitada ao valor pago por você nos últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cancelamento e Suspensão</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>8.1.</strong> Você pode cancelar sua assinatura a qualquer momento através do dashboard da Plataforma.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>8.2.</strong> Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos de Uso.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>8.3.</strong> Em caso de cancelamento, você manterá acesso até o fim do período pago.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Modificações dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As alterações entrarão em vigor
              imediatamente após a publicação na Plataforma. O uso continuado após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Lei Aplicável e Jurisdição</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer disputa relacionada
              a estes termos será submetida à jurisdição exclusiva dos tribunais brasileiros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através da Plataforma.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Button variant="default" asChild>
            <Link href="/">Voltar à página inicial</Link>
          </Button>
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
