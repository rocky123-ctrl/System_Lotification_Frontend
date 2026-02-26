"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, MapPin, CreditCard, FileText, Settings, Menu, X, LogOut, User, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { SessionStatus } from "@/components/session-status"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const [lotificacion, setLotificacion] = useState({
    nombre: "Lotificaciones",
    logo: null,
  })

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Lotes", href: "/lotes", icon: MapPin },
    { name: "Lotes Financiados", href: "/lotes/financiados", icon: CreditCard },
    { name: "Vendedores", href: "/vendedores", icon: Users },
    { name: "Reportes", href: "/reportes", icon: FileText },
    { name: "Lotificaciones", href: "/configuracion", icon: Settings },
  ]

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {lotificacion.logo && (
                <img src={lotificacion.logo || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain" />
              )}
              <h1 className="text-lg font-bold text-sidebar-foreground">{lotificacion.nombre}</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 p-3 bg-sidebar-accent rounded-lg">
              <User className="h-4 w-4 text-sidebar-accent-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user?.username}</p>
                <p className="text-xs text-sidebar-accent-foreground/70 capitalize">{user?.role}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 w-8 p-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-sidebar lg:border-r lg:border-sidebar-border">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            {lotificacion.logo && (
              <img src={lotificacion.logo || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain" />
            )}
            <h1 className="text-xl font-bold text-sidebar-foreground">{lotificacion.nombre}</h1>
          </div>
        </div>
        <nav className="px-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3 p-3 bg-sidebar-accent rounded-lg">
            <User className="h-5 w-5 text-sidebar-accent-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user?.username}</p>
              <p className="text-xs text-sidebar-accent-foreground/70 capitalize">{user?.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 w-8 p-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-foreground">
                {navigation.find((item) => item.href === pathname)?.name || "Dashboard Administrativo"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <SessionStatus />
              <div className="hidden sm:flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user?.username}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                  {user?.role}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
