"use client"

import { Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EmailConfirmationModalProps {
  email: string
  onClose: () => void
}

export function EmailConfirmationModal({ email, onClose }: EmailConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md border-0 shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Confirme seu email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Enviamos um email de confirmação para:
            </p>
            <p className="font-semibold text-lg text-foreground">
              {email}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Verifique sua caixa de entrada</p>
                <p>Clique no link de confirmação que enviamos para ativar sua conta.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Não recebeu o email?</p>
                <p>Verifique sua pasta de spam ou lixo eletrônico.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Após confirmar</p>
                <p>Você poderá fazer login e começar a usar a plataforma.</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={onClose}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Entendi
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            O link de confirmação expira em 24 horas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
