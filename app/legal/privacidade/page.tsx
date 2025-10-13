import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck } from "lucide-react"

export default function PoliticaDePrivacidade() {
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
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold">Política de Privacidade</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
          <p className="text-sm leading-relaxed">
            <strong>Compromisso com sua privacidade:</strong> A Konvexy leva a sério a proteção dos seus dados pessoais.
            Esta política explica de forma transparente como coletamos, usamos, armazenamos e protegemos suas informações,
            em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">1. Informações que Coletamos</h2>
            </div>

            <h3 className="text-xl font-semibold mt-4 mb-2">1.1. Informações Fornecidas por Você</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Dados de Cadastro:</strong> Nome, e-mail, senha (criptografada)</li>
              <li><strong>Dados de Pagamento:</strong> Processados pelo MercadoPago (não armazenamos dados de cartão)</li>
              <li><strong>Informações de Perfil:</strong> Preferências de uso, tipo de negócio (opcional)</li>
              <li><strong>Conteúdo Gerado:</strong> Copys, funis e estratégias criadas na plataforma</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">1.2. Informações Coletadas Automaticamente</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Dados de Uso:</strong> Funcionalidades acessadas, frequência de uso, tempo na plataforma</li>
              <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional, dispositivo</li>
              <li><strong>Cookies:</strong> Cookies essenciais para funcionamento da plataforma</li>
              <li><strong>Logs de Segurança:</strong> Tentativas de login, ações suspeitas (para proteção da conta)</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">2. Como Usamos suas Informações</h2>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-3">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Fornecer o Serviço:</strong> Processar suas solicitações, gerar conteúdo com IA, gerenciar sua conta</li>
              <li><strong>Processar Pagamentos:</strong> Gerenciar assinaturas e cobranças através do MercadoPago</li>
              <li><strong>Melhorar a Plataforma:</strong> Analisar uso para desenvolver novos recursos e melhorias</li>
              <li><strong>Comunicação:</strong> Enviar atualizações importantes, notificações de conta e suporte</li>
              <li><strong>Segurança:</strong> Detectar e prevenir fraudes, abusos e violações de segurança</li>
              <li><strong>Compliance Legal:</strong> Cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">3. Compartilhamento de Dados</h2>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-3">
              <strong>Nós NÃO vendemos seus dados pessoais.</strong> Compartilhamos informações apenas quando necessário:
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">3.1. Provedores de Serviços</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li><strong>Supabase:</strong> Armazenamento seguro de dados e autenticação</li>
              <li><strong>MercadoPago:</strong> Processamento de pagamentos (conforme suas próprias políticas)</li>
              <li><strong>Google (Gemini AI):</strong> Geração de conteúdo por IA (dados anonimizados)</li>
              <li><strong>Vercel:</strong> Hospedagem e infraestrutura da plataforma</li>
              <li><strong>Redis Cloud:</strong> Cache e rate limiting (dados temporários)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">3.2. Exigências Legais</h3>
            <p className="text-muted-foreground leading-relaxed">
              Podemos divulgar suas informações se exigido por lei, ordem judicial, ou para proteger
              nossos direitos e segurança.
            </p>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">4. Segurança dos Dados</h2>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-3">
              Implementamos medidas de segurança robustas para proteger suas informações:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Criptografia:</strong> Senhas criptografadas com bcrypt, conexões HTTPS/TLS</li>
              <li><strong>Autenticação Segura:</strong> Tokens JWT, sessões protegidas</li>
              <li><strong>Rate Limiting:</strong> Proteção contra ataques de força bruta</li>
              <li><strong>Validação de Dados:</strong> Sanitização de inputs, proteção XSS e CSRF</li>
              <li><strong>Logs de Auditoria:</strong> Monitoramento de atividades suspeitas</li>
              <li><strong>Backups Regulares:</strong> Proteção contra perda de dados</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center space-x-2 mb-4">
              <UserCheck className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">5. Seus Direitos (LGPD)</h2>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-3">
              De acordo com a LGPD, você tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Confirmação e Acesso:</strong> Confirmar se processamos seus dados e acessá-los</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> Solicitar anonimização ou exclusão de dados desnecessários</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado e legível</li>
              <li><strong>Eliminação:</strong> Solicitar exclusão de dados tratados com seu consentimento</li>
              <li><strong>Informação sobre Compartilhamento:</strong> Saber com quem compartilhamos seus dados</li>
              <li><strong>Revogação de Consentimento:</strong> Retirar consentimento a qualquer momento</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Para exercer seus direitos,</strong> acesse as configurações da sua conta ou entre em contato conosco.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Mantemos seus dados pessoais apenas pelo tempo necessário para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Cumprir as finalidades descritas nesta política</li>
              <li>Atender obrigações legais (dados fiscais: 5 anos)</li>
              <li>Resolver disputas e fazer cumprir nossos acordos</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Após o cancelamento da conta, seus dados são excluídos em até 90 dias, exceto aqueles que devemos
              reter por obrigação legal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Cookies Essenciais:</strong> Necessários para funcionamento da plataforma (autenticação, sessão)</li>
              <li><strong>Cookies de Desempenho:</strong> Analisar uso e melhorar a experiência (anônimos)</li>
              <li><strong>Cookies de Segurança:</strong> Detectar atividades fraudulentas e proteger sua conta</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Você pode gerenciar cookies através das configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Transferência Internacional de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Alguns de nossos provedores de serviços podem estar localizados fora do Brasil (EUA, Europa).
              Garantimos que essas transferências ocorram com salvaguardas adequadas, incluindo cláusulas contratuais
              padrão e conformidade com regulamentações de proteção de dados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente informações
              de menores. Se tomarmos conhecimento de que coletamos dados de um menor, excluiremos essas informações imediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas
              através da plataforma ou por e-mail. Recomendamos revisar esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Encarregado de Dados (DPO)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato através das
              configurações da plataforma ou pelo e-mail que será disponibilizado em breve.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Lei Aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Privacidade é regida pelas leis brasileiras, incluindo a LGPD (Lei 13.709/2018)
              e o Marco Civil da Internet (Lei 12.965/2014).
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t flex gap-4">
          <Button variant="default" asChild>
            <Link href="/">Voltar à página inicial</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/legal/termos">Ver Termos de Uso</Link>
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
