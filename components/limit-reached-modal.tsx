"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Zap, Crown } from "lucide-react"
import Link from "next/link"

interface LimitReachedModalProps {
  isOpen: boolean
  onClose: () => void
  used: number
  limit: number
}

export function LimitReachedModal({ isOpen, onClose, used, limit }: LimitReachedModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="relative pb-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Limite Atingido</CardTitle>
              <CardDescription>
                Você usou {used} de {limit} gerações gratuitas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Você atingiu o limite de gerações do plano gratuito. Para continuar criando conteúdo ilimitado, assine um de nossos planos.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Crown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Plano Starter</p>
                <p className="text-muted-foreground">50 gerações/mês + recursos avançados</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Crown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Plano Pro</p>
                <p className="text-muted-foreground">Gerações ilimitadas + prioridade</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Voltar
            </Button>
            <Link href="/dashboard/planos" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90">
                Ver Planos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
