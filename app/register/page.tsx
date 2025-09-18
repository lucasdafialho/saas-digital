"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Eye, EyeOff, CheckCircle, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)

  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (!acceptTerms) {
      setError("Você deve aceitar os termos de uso")
      setIsLoading(false)
      return
    }

    try {
      await register(formData.name, formData.email, formData.password)
      router.push("/dashboard")
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const strength = passwordStrength(formData.password)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <img src="/konvexy/Konvexy Logo Transparante.png" alt="Konvexy" className="h-10 w-auto" />
          <span className="text-2xl font-bold">Konvexy</span>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Criar sua conta</CardTitle>
            <CardDescription>Comece sua jornada no marketing digital</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha forte"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="flex space-x-1 mt-2">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          strength >= level
                            ? strength <= 2
                              ? "bg-red-500"
                              : strength === 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Senhas coincidem</span>
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 mt-0.5"
                />
                <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer text-foreground">
                  Eu aceito os {""}
                  <button
                    type="button"
                    onClick={() => setIsTermsOpen(true)}
                    className="text-primary hover:underline underline-offset-2"
                  >
                    Termos de Uso
                  </button>{" "}
                  e {""}
                  <button
                    type="button"
                    onClick={() => setIsPrivacyOpen(true)}
                    className="text-primary hover:underline underline-offset-2"
                  >
                    Política de Privacidade
                  </button>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar para o site
          </Link>
        </div>
      </div>
      {isTermsOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsTermsOpen(false)} />
          <div className="relative w-full max-w-2xl">
            <Card className="border-0 shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Termos de Uso</CardTitle>
                <CardAction>
                  <Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setIsTermsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="max-h-[70vh] overflow-y-auto space-y-4 text-sm leading-relaxed text-muted-foreground">
                <h3 className="text-foreground font-semibold">1. Aceitação dos Termos</h3>
                <p>Ao criar uma conta e utilizar a Konvexy, você concorda integralmente com estes Termos de Uso. Caso não concorde com qualquer condição, não utilize a plataforma.</p>
                <h3 className="text-foreground font-semibold">2. Cadastro e Conta</h3>
                <p>Para acessar os recursos, você deve fornecer informações verdadeiras, precisas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta.</p>
                <h3 className="text-foreground font-semibold">3. Uso Permitido</h3>
                <p>Você se compromete a utilizar a plataforma de forma lícita, respeitando a legislação aplicável, estes Termos e os direitos de terceiros. É proibido realizar engenharia reversa, explorar vulnerabilidades, automatizar abusivamente o uso ou prejudicar a disponibilidade do serviço.</p>
                <h3 className="text-foreground font-semibold">4. Planos, Pagamentos e Cancelamento</h3>
                <p>Planos pagos, quando oferecidos, podem ser cobrados de forma recorrente. Cancelamentos interrompem cobranças futuras, mantendo o acesso até o fim do ciclo vigente. Valores e benefícios podem ser alterados com aviso prévio.</p>
                <h3 className="text-foreground font-semibold">5. Propriedade Intelectual</h3>
                <p>Todo o conteúdo, marca, layout e tecnologia da Konvexy pertencem à empresa ou a seus licenciadores. É vedada a reprodução, distribuição ou criação de obras derivadas sem autorização.</p>
                <h3 className="text-foreground font-semibold">6. Conteúdos Gerados por IA</h3>
                <p>Os textos e sugestões gerados por inteligência artificial são fornecidos no estado em que se encontram. Você é responsável por revisar, adaptar e garantir que estejam em conformidade com as leis e com sua finalidade de uso.</p>
                <h3 className="text-foreground font-semibold">7. Limitação de Responsabilidade</h3>
                <p>Na máxima extensão permitida por lei, a Konvexy não se responsabiliza por lucros cessantes, danos indiretos, perda de dados ou indisponibilidade ocasionais. Empregamos boas práticas para manter a continuidade e segurança do serviço.</p>
                <h3 className="text-foreground font-semibold">8. Suspensão e Encerramento</h3>
                <p>Podemos suspender ou encerrar contas que violem estes Termos, leis ou políticas internas. Você pode encerrar sua conta a qualquer momento, observadas as obrigações pendentes.</p>
                <h3 className="text-foreground font-semibold">9. Privacidade</h3>
                <p>O tratamento de dados pessoais observa a nossa Política de Privacidade. Ao utilizar a plataforma, você declara ciência e concordância com essa política.</p>
                <h3 className="text-foreground font-semibold">10. Alterações destes Termos</h3>
                <p>Podemos atualizar estes Termos a qualquer momento. Alterações passam a valer a partir da publicação. O uso contínuo do serviço após a atualização representa concordância com os novos termos.</p>
                <h3 className="text-foreground font-semibold">11. Legislação e Foro</h3>
                <p>Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro de seu domicílio para resolver eventuais controvérsias, salvo disposições legais em contrário.</p>
                <h3 className="text-foreground font-semibold">12. Contato</h3>
                <p>Em caso de dúvidas, entre em contato pelo e-mail suporte@marketpro.com.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {isPrivacyOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsPrivacyOpen(false)} />
          <div className="relative w-full max-w-2xl">
            <Card className="border-0 shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Política de Privacidade</CardTitle>
                <CardAction>
                  <Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setIsPrivacyOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="max-h-[70vh] overflow-y-auto space-y-4 text-sm leading-relaxed text-muted-foreground">
                <h3 className="text-foreground font-semibold">1. Introdução</h3>
                <p>Esta Política de Privacidade descreve como a Konvexy coleta, utiliza e protege seus dados pessoais de acordo com a legislação aplicável, incluindo a Lei Geral de Proteção de Dados (LGPD).</p>
                <h3 className="text-foreground font-semibold">2. Dados que Coletamos</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Dados de cadastro: nome, e-mail, senha e informações de contato.</li>
                  <li>Dados de uso: páginas acessadas, funcionalidades utilizadas e métricas de desempenho.</li>
                  <li>Dados técnicos: endereço IP, dispositivo, navegador e cookies.</li>
                </ul>
                <h3 className="text-foreground font-semibold">3. Bases Legais</h3>
                <p>Tratamos dados com base em execução de contrato, cumprimento de obrigação legal, legítimo interesse e consentimento, quando aplicável.</p>
                <h3 className="text-foreground font-semibold">4. Como Utilizamos os Dados</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Para autenticação, suporte e comunicação com o usuário.</li>
                  <li>Para melhorar a plataforma, personalizar a experiência e garantir segurança.</li>
                  <li>Para fins estatísticos e analíticos, com dados preferencialmente agregados ou anonimizados.</li>
                </ul>
                <h3 className="text-foreground font-semibold">5. Compartilhamento de Dados</h3>
                <p>Podemos compartilhar dados com provedores de serviços estritamente necessários à operação, observando medidas contratuais e de segurança. Não vendemos seus dados pessoais.</p>
                <h3 className="text-foreground font-semibold">6. Cookies e Tecnologias Semelhantes</h3>
                <p>Utilizamos cookies para manter sua sessão, lembrar preferências e analisar o uso. Você pode gerenciar cookies nas configurações do seu navegador.</p>
                <h3 className="text-foreground font-semibold">7. Direitos do Titular</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Acesso, correção, anonimização ou exclusão de dados.</li>
                  <li>Portabilidade e informação sobre compartilhamento.</li>
                  <li>Revogação de consentimento e oposição ao tratamento, quando aplicável.</li>
                </ul>
                <h3 className="text-foreground font-semibold">8. Segurança</h3>
                <p>Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados, perdas e incidentes.</p>
                <h3 className="text-foreground font-semibold">9. Retenção</h3>
                <p>Os dados são mantidos pelo tempo necessário para cumprir as finalidades informadas ou exigências legais. Após esse período, serão eliminados ou anonimizados.</p>
                <h3 className="text-foreground font-semibold">10. Transferências Internacionais</h3>
                <p>Se houver transferência internacional de dados, garantimos salvaguardas adequadas conforme a legislação aplicável.</p>
                <h3 className="text-foreground font-semibold">11. Contato</h3>
                <p>Para exercer seus direitos ou tirar dúvidas, entre em contato pelo e-mail suporte@marketpro.com.</p>
                <h3 className="text-foreground font-semibold">12. Atualizações desta Política</h3>
                <p>Podemos atualizar esta Política periodicamente. A versão vigente será sempre a mais recente publicada na plataforma.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
