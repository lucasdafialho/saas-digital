import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

export default function PoliticaDeReembolso() {
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
        <div className="flex items-center space-x-3 mb-4">
          <RefreshCw className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold">Política de Reembolso</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
          <p className="text-sm leading-relaxed">
            <strong>Nossa garantia:</strong> A Konvexy está comprometida com a satisfação dos nossos clientes.
            Esta política detalha as condições para solicitação de reembolso de forma justa e transparente.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-semibold">1. Garantia de Satisfação - 7 Dias</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Oferecemos uma <strong>garantia de reembolso de 7 dias</strong> para novas assinaturas dos planos
              <strong> Starter</strong> e <strong>Pro</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>Condições para reembolso integral:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Solicitação feita em até <strong>7 dias corridos</strong> após a primeira cobrança</li>
              <li>Primeira assinatura do plano (não se aplica a renovações)</li>
              <li>Uso moderado da plataforma (até 20 gerações de conteúdo)</li>
              <li>Ausência de violação dos Termos de Uso</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">2. Como Solicitar Reembolso</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Para solicitar reembolso, siga os seguintes passos:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-3 ml-4">
              <li>
                <strong>Acesse sua conta:</strong> Entre no dashboard da Konvexy
              </li>
              <li>
                <strong>Vá em Configurações:</strong> Navegue até "Configurações" → "Assinatura"
              </li>
              <li>
                <strong>Solicite o reembolso:</strong> Clique em "Solicitar Reembolso" e preencha o motivo
              </li>
              <li>
                <strong>Aguarde análise:</strong> Nossa equipe analisará sua solicitação em até 2 dias úteis
              </li>
              <li>
                <strong>Confirmação:</strong> Você receberá um e-mail com o status da solicitação
              </li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Prazo de processamento:</strong> Reembolsos aprovados são processados em até 5-10 dias úteis,
              dependendo da operadora do cartão ou instituição financeira.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-semibold">3. Situações NÃO Elegíveis para Reembolso</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Não são elegíveis para reembolso:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Renovações automáticas:</strong> Cobranças de renovação mensal (responsabilidade do usuário cancelar antes)
              </li>
              <li>
                <strong>Uso excessivo:</strong> Contas que excederam uso moderado (mais de 50 gerações em 7 dias)
              </li>
              <li>
                <strong>Violação de Termos:</strong> Usuários que violaram nossos Termos de Uso
              </li>
              <li>
                <strong>Após 7 dias:</strong> Solicitações feitas após o período de garantia
              </li>
              <li>
                <strong>Plano Gratuito:</strong> O plano gratuito não possui cobrança, portanto não há reembolso
              </li>
              <li>
                <strong>Mudança de ideia:</strong> Após 7 dias, não aceitamos mudança de ideia como justificativa
              </li>
              <li>
                <strong>Contas suspensas:</strong> Contas suspensas por atividade fraudulenta ou suspeita
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-semibold">4. Cancelamento de Assinatura</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>Importante:</strong> Cancelar sua assinatura é diferente de solicitar reembolso.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>Ao cancelar sua assinatura:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Você mantém acesso até o final do período já pago</li>
              <li>Não há cobrança na próxima renovação</li>
              <li>Não há reembolso proporcional do período atual (após 7 dias)</li>
              <li>Seus dados e conteúdos gerados são mantidos por 90 dias</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Como cancelar:</strong> Acesse "Configurações" → "Assinatura" → "Cancelar Assinatura"
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Reembolso Proporcional</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>Não oferecemos reembolso proporcional</strong> para cancelamentos após o período de 7 dias.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Exemplo: Se você assinou em 01/01 e cancelou em 20/01, terá acesso até 31/01 (fim do período pago),
              mas não receberá reembolso pelos dias restantes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Problemas Técnicos</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Se você experimentar problemas técnicos que impedem o uso adequado da plataforma:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Entre em contato com nosso suporte imediatamente</li>
              <li>Descreva detalhadamente o problema (prints, logs, etc.)</li>
              <li>Daremos prioridade para resolver o problema</li>
              <li>Em casos excepcionais, podemos oferecer créditos ou extensão do plano</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Nota:</strong> Problemas pontuais de curta duração (menos de 24h) não são elegíveis para reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Chargebacks e Disputas</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>Antes de abrir um chargeback,</strong> entre em contato conosco. Chargebacks podem:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Resultar no cancelamento imediato da sua conta</li>
              <li>Impedir futuras assinaturas</li>
              <li>Gerar custos adicionais de processamento</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Estamos comprometidos em resolver todas as questões de forma amigável e rápida.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Mudanças de Plano</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>Upgrade de plano:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li>Você pode fazer upgrade a qualquer momento</li>
              <li>O valor é cobrado proporcionalmente ao período restante</li>
              <li>Os novos limites são aplicados imediatamente</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>Downgrade de plano:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Você pode fazer downgrade, mas ele só terá efeito na próxima renovação</li>
              <li>Não há reembolso da diferença do período atual</li>
              <li>Você mantém os benefícios do plano atual até o fim do ciclo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Exceções e Casos Especiais</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Em situações excepcionais, podemos avaliar reembolsos fora das condições padrão:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Falecimento do titular da conta (mediante documentação)</li>
              <li>Problemas técnicos prolongados não resolvidos (acima de 7 dias)</li>
              <li>Erro de cobrança comprovado (cobrança duplicada, valor incorreto, etc.)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Cada caso será analisado individualmente por nossa equipe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Processamento pelo MercadoPago</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todos os pagamentos e reembolsos são processados através do <strong>MercadoPago</strong>.
              O tempo de processamento e disponibilização do reembolso na sua conta pode variar de acordo
              com a operadora do cartão ou instituição financeira.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar esta Política de Reembolso a qualquer momento.
              Alterações serão comunicadas através da plataforma e por e-mail. A política vigente no
              momento da sua assinatura será aplicada.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre reembolsos ou para solicitar um reembolso, acesse as configurações
              da sua conta ou entre em contato através do suporte da plataforma.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="bg-muted/50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Resumo: Política de Reembolso em 3 Pontos
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground ml-7">
              <li>✓ <strong>7 dias de garantia</strong> para primeira assinatura com uso moderado</li>
              <li>✓ <strong>Cancele quando quiser</strong>, sem multas (acesso até fim do período pago)</li>
              <li>✓ <strong>Sem reembolso proporcional</strong> após 7 dias ou em renovações</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button variant="default" asChild>
              <Link href="/">Voltar à página inicial</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/legal/termos">Ver Termos de Uso</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/legal/privacidade">Ver Política de Privacidade</Link>
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
