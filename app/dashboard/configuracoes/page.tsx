"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Shield, CreditCard, Key, Trash2, Save, Loader2, Eye, EyeOff } from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

interface SettingsData {
  profile: {
    id: string
    email: string
    name: string
    plan: 'free' | 'starter' | 'pro'
    generations_used: number
  }
  subscription: {
    id: string
    planType: 'starter' | 'pro'
    status: 'active' | 'cancelled' | 'expired'
    expiresAt: string | null
  } | null
  generationsThisMonth: number
}

type TabType = 'perfil' | 'seguranca' | 'plano'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('perfil')
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  // Estados para o modal de senha
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const response = await fetch('/api/user/settings')
      if (!response.ok) throw new Error('Erro ao carregar configurações')

      const data = await response.json()
      setSettings(data)
      setFormData({
        name: data.profile.name,
        email: data.profile.email
      })
    } catch (error) {
      setMessage({ type: 'error', text: 'Não foi possível carregar as configurações' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Erro ao salvar')

      setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso' })

      await loadSettings()
    } catch (error) {
      setMessage({ type: 'error', text: 'Não foi possível salvar as alterações' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium.')) {
      return
    }

    try {
      const response = await fetch('/api/user/cancel-subscription', {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Erro ao cancelar')

      setMessage({ type: 'success', text: 'Assinatura cancelada com sucesso' })
      await loadSettings()
    } catch (error) {
      setMessage({ type: 'error', text: 'Não foi possível cancelar a assinatura' })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  async function handleChangePassword() {
    setChangingPassword(true)

    // Validações
    if (!passwordData.currentPassword) {
      setMessage({ type: 'error', text: 'A senha atual é obrigatória' })
      setChangingPassword(false)
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres' })
      setChangingPassword(false)
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' })
      setChangingPassword(false)
      setTimeout(() => setMessage(null), 3000)
      return
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar senha')
      }

      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
      setShowPasswordDialog(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Não foi possível alterar a senha' })
    } finally {
      setChangingPassword(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  async function handleDeleteAccount() {
    const confirmation = prompt('Esta ação é irreversível! Digite "EXCLUIR" para confirmar:')

    if (confirmation !== 'EXCLUIR') {
      if (confirmation !== null) {
        setMessage({ type: 'error', text: 'Confirmação incorreta' })
        setTimeout(() => setMessage(null), 3000)
      }
      return
    }

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao excluir conta')

      setMessage({ type: 'success', text: 'Conta excluída com sucesso. Redirecionando...' })

      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Não foi possível excluir a conta' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  function getDaysUntilExpiration() {
    if (!settings?.subscription?.expiresAt) return null
    const expiresAt = new Date(settings.subscription.expiresAt)
    const now = new Date()
    const diffTime = expiresAt.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  function getPlanName(plan: string) {
    const names: Record<string, string> = {
      free: 'Gratuito',
      starter: 'Starter',
      pro: 'Pro'
    }
    return names[plan] || plan
  }

  function getPlanPrice(plan: string) {
    const prices: Record<string, string> = {
      free: 'R$ 0',
      starter: 'R$ 49,90',
      pro: 'R$ 149,90'
    }
    return prices[plan] || 'R$ 0'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8" data-animate>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta e preferências</p>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Lateral */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${activeTab === 'perfil' ? 'bg-accent text-foreground' : ''}`}
                  onClick={() => setActiveTab('perfil')}
                >
                  <User className="h-4 w-4 mr-3" />
                  Perfil
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${activeTab === 'seguranca' ? 'bg-accent text-foreground' : ''}`}
                  onClick={() => setActiveTab('seguranca')}
                >
                  <Shield className="h-4 w-4 mr-3" />
                  Segurança
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${activeTab === 'plano' ? 'bg-accent text-foreground' : ''}`}
                  onClick={() => setActiveTab('plano')}
                >
                  <CreditCard className="h-4 w-4 mr-3" />
                  Plano & Cobrança
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Perfil */}
          {activeTab === 'perfil' && (
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>Atualize suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {settings?.profile.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Alterar foto
                    </Button>
                    <p className="text-sm text-slate-600">JPG, PNG ou GIF. Máximo 2MB.</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input id="company" placeholder="Nome da sua empresa" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="(11) 99999-9999" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plano Atual */}
          {activeTab === 'plano' && (
            <Card>
              <CardHeader>
                <CardTitle>Plano Atual</CardTitle>
                <CardDescription>Gerencie sua assinatura e uso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Plano {getPlanName(settings?.profile.plan || 'free')}</h3>
                      {settings?.subscription?.status === 'active' ? (
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">ATIVO</Badge>
                      ) : settings?.subscription?.status === 'cancelled' ? (
                        <Badge variant="outline">CANCELADO</Badge>
                      ) : settings?.subscription?.status === 'expired' ? (
                        <Badge variant="destructive">EXPIRADO</Badge>
                      ) : (
                        <Badge variant="secondary">GRATUITO</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {settings?.subscription ? (
                        <>
                          {getPlanPrice(settings.profile.plan)}/mês
                          {getDaysUntilExpiration() !== null && ` • Renovação em ${getDaysUntilExpiration()} dias`}
                        </>
                      ) : (
                        'Sem assinatura ativa'
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {settings?.subscription?.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={handleCancelSubscription}>
                        Cancelar assinatura
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => window.location.href = '/dashboard/planos'}>
                      Alterar plano
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Copies geradas este mês</span>
                    <span>
                      {settings?.generationsThisMonth || 0} / {
                        settings?.profile.plan === 'free' ? '5' :
                          settings?.profile.plan === 'starter' ? '50' :
                            'Ilimitado'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total de gerações</span>
                    <span>{settings?.profile.generations_used || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Segurança */}
          {activeTab === 'seguranca' && (
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Mantenha sua conta protegida</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alterar senha</p>
                    <p className="text-sm text-slate-600">Atualize sua senha regularmente</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Alterar
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticação de dois fatores</p>
                    <p className="text-sm text-slate-600">Em breve - adicione uma camada extra de segurança</p>
                  </div>
                  <Button variant="outline" disabled>Configurar</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-600">Excluir conta</p>
                    <p className="text-sm text-slate-600">Remover permanentemente sua conta e dados</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Alteração de Senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Certifique-se de usar uma senha forte e segura.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-gray-300">Senha Atual *</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Digite sua senha atual"
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-gray-300">Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                <p className="text-xs text-red-400">A senha deve ter no mínimo 6 caracteres</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-300">Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Digite a senha novamente"
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-400">As senhas não coincidem</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false)
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
              }}
              disabled={changingPassword}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
