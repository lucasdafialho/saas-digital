"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sparkles, LayoutDashboard, Zap, Target, BarChart3, Settings, LogOut, Menu, X, Wand2, ChevronDown, Layers3, Megaphone, CreditCard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

type NavEntry =
  | { type: "item"; name: string; href: string; icon: any }
  | { type: "group"; name: string; icon: any; items: { name: string; href: string; icon: any }[] }

const navigation: NavEntry[] = [
  { type: "item", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    type: "group",
    name: "IA Konvexy",
    icon: Wand2,
    items: [
      { name: "Gerador de Copy", href: "/dashboard/copy-generator", icon: Zap },
      { name: "Funis de Vendas", href: "/dashboard/ferramentas", icon: Layers3 },
      { name: "Estratégias de Ads", href: "/dashboard/ads", icon: Megaphone },
      { name: "Marketing Model Canvas", href: "/dashboard/canvas", icon: Layers3 },
    ],
  },
  { type: "item", name: "Produtos Nichados", href: "/dashboard/products", icon: Target },
  { type: "item", name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { type: "item", name: "Planos", href: "/dashboard/planos", icon: CreditCard },
  { type: "item", name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, isLoading } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const planLabels: Record<string, string> = {
    pro: "Pro",
    starter: "Starter",
  }
  const planDisplayName = user?.plan ? planLabels[user.plan] ?? "Gratuito" : "Gratuito"

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background" data-animate>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <Link href="/dashboard" className="flex items-center">
              <img src="/konvexy/konvexy-logo.png" alt="Konvexy" className="h-25 w-auto" />
            </Link>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((entry) => {
              if (entry.type === "item") {
                const Icon = entry.icon
                const isActive = pathname === entry.href
                return (
                  <Link
                    key={entry.name}
                    href={entry.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{entry.name}</span>
                  </Link>
                )
              }

              const Icon = entry.icon
              const isGroupActive = entry.items.some((it) => pathname.startsWith(it.href))
              const isOpen = openGroups[entry.name] ?? isGroupActive

              return (
                <div key={entry.name} className="space-y-1">
                  <button
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isGroupActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [entry.name]: !isOpen }))}
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{entry.name}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="pl-8 space-y-1 py-1">
                        {entry.items.map((child) => {
                          const CIcon = child.icon
                          const active = pathname === child.href
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                active
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <CIcon className="w-4 h-4" />
                              <span>{child.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start space-x-3 h-auto p-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/configuracoes">
                    {" "}
                    {/* Updated settings link */}
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">Plano {planDisplayName}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
