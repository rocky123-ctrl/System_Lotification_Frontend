"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertCircle, 
  CheckCircle,
  Clock,
  Settings,
  Bell,
  AlertTriangle,
  Info,
  ShoppingCart,
  Calculator,
  UserPlus,
  MapPin,
  Users,
  Receipt,
  FileText,
  Wrench,
  LayoutDashboard
} from "lucide-react"
import { useConfiguracion } from "@/hooks/use-configuracion"
import { useAuth } from "@/contexts/auth-context"
import { formatearPorcentaje, formatearTasaMensual } from "@/lib/configuracion-service"

export function AdminDashboard() {
  const { configuracionActiva, configuracionResumen, isLoading } = useConfiguracion()
  const { user } = useAuth()

  const userRole = user?.role?.toLowerCase() || ""
  const isSuperAdmin = userRole === "superadmin"
  const isAdmin = userRole === "administrador" || userRole === "admin"
  const isVendedor = userRole === "vendedor"

  // Usar datos reales de la configuración para lo que queda en notificaciones
  const stats = {
    cobranzaAtrasada: 45000,
  }

  // Definir secciones del menú categorizadas
  const menuSections = [
    {
      title: "Operaciones y Ventas",
      roles: ["superadmin", "administrador", "admin", "vendedor"],
      items: [
        { name: "Inicio (Dashboard)", href: "/", icon: LayoutDashboard, color: "bg-slate-700 hover:bg-slate-800", roles: ["superadmin", "administrador", "admin", "vendedor"] },
        { name: "Nueva Venta", href: "/venta", icon: ShoppingCart, color: "bg-blue-600 hover:bg-blue-700", roles: ["superadmin", "administrador", "admin", "vendedor"] },
        { name: "Cotización", href: "/cotizaciones", icon: Calculator, color: "bg-emerald-600 hover:bg-emerald-700", roles: ["superadmin", "administrador", "admin", "vendedor"] },
        { name: "Generar Reportes", href: "/reportes", icon: FileText, color: "bg-slate-600 hover:bg-slate-700", roles: ["superadmin", "administrador", "admin"] },
      ]
    },
    {
      title: "Gestión de Proyectos e Inventario",
      roles: ["superadmin"],
      items: [
        { name: "Gestión de Lotes", href: "/lotes", icon: MapPin, color: "bg-indigo-600 hover:bg-indigo-700", roles: ["superadmin"] },
        { name: "Config. de Lotificaciones", href: "/configuracion", icon: Settings, color: "bg-gray-600 hover:bg-gray-700", roles: ["superadmin"] },
      ]
    },
    {
      title: "Módulo Financiero y RRHH",
      roles: ["superadmin", "administrador", "admin"],
      items: [
        { name: "Control de Empleados", href: "/vendedores", icon: Users, color: "bg-pink-600 hover:bg-pink-700", roles: ["superadmin"] },
        { name: "Planillas de Pago", href: "/planillas", icon: Receipt, color: "bg-purple-600 hover:bg-purple-700", roles: ["superadmin", "administrador", "admin"] },
      ]
    },
    {
      title: "Atención al Cliente",
      roles: ["superadmin", "administrador", "admin", "vendedor"],
      items: [
        { name: "Cuentas por Cobrar", href: "/clientes/cuentas-cobrar", icon: Receipt, color: "bg-orange-600 hover:bg-orange-700", roles: ["superadmin", "administrador", "admin"] },
        { name: "Servicios Varios", href: "/clientes/servicios", icon: Wrench, color: "bg-cyan-600 hover:bg-cyan-700", roles: ["superadmin", "administrador", "admin"] },
        { name: "Registrar Nuevo Cliente", href: "/clientes/registrar", icon: UserPlus, color: "bg-amber-600 hover:bg-amber-700", roles: ["superadmin", "administrador", "admin", "vendedor"] },
      ]
    }
  ]

  // Mostrar loading si está cargando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Cargando dashboard...</span>
        </div>
      </div>
    )
  }

  // Datos por defecto si no hay configuración activa
  const nombreLotificacion = configuracionActiva?.nombre_lotificacion || "Sistema de Lotificaciones"
  const tasaAnual = configuracionActiva?.tasa_anual || "12.0"

  return (
    <div className="space-y-10">
      {/* Encabezado: Bienvenido */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">¡Hola, {user?.username}!</h2>
          <p className="text-muted-foreground">Bienvenido al panel de control de {nombreLotificacion}.</p>
        </div>
        <Badge variant="secondary" className="text-sm py-1 px-4 w-fit h-8 uppercase font-bold tracking-wider bg-primary/10 text-primary border-primary/20">
          {user?.role}
        </Badge>
      </div>

      {/* Menú de Acceso Rápido por Seccion */}
      <div className="space-y-8">
        {menuSections.filter(section => section.roles.includes(userRole)).map((section) => (
          <div key={section.title} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground/80">
                {section.title}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.filter(item => item.roles.includes(userRole)).map((action) => (
                <Link key={action.name} href={action.href} passHref>
                  <Button 
                    className={`w-full h-28 flex flex-col items-center justify-center gap-3 text-white shadow-md transition-all hover:scale-105 active:scale-95 ${action.color}`}
                  >
                    <action.icon className="h-10 w-10" />
                    <span className="font-bold text-center leading-tight px-2">{action.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN SOLO ADMIN/SUPERADMIN: NOTIFICACIONES DEL PROGRAMA */}
      {(isAdmin || isSuperAdmin) && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones del Programa
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Alertas Críticas */}
            <Card className="border-red-200 shadow-sm">
              <CardHeader className="pb-3 bg-red-50/50 rounded-t-lg">
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Alertas Críticas
                </CardTitle>
                <CardDescription>Atención inmediata requerida</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-100/50 rounded-lg border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-red-900">Cobranza Atrasada</div>
                    <p className="text-sm text-red-800">
                      Total en mora: <span className="font-bold text-red-900">Q {stats.cobranzaAtrasada.toLocaleString()}</span>
                    </p>
                  </div>
                  <Badge variant="destructive" className="animate-pulse">12 clientes</Badge>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-100/50 rounded-lg border border-orange-200">
                  <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-orange-900">Promedio de Retraso</div>
                    <p className="text-sm text-orange-800">
                      Los pagos tienen un retraso de <span className="font-bold text-orange-900">5 días</span> promedio.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información General */}
            <Card className="border-blue-200 shadow-sm">
              <CardHeader className="pb-3 bg-blue-50/50 rounded-t-lg">
                <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                  <Info className="h-5 w-5 text-blue-500" />
                  Información Operativa
                </CardTitle>
                <CardDescription>Estado del sistema y parámetros</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="font-semibold text-blue-900">Configuración Activa</div>
                    <p className="text-blue-800">
                      Interés: <span className="font-bold text-blue-900">{formatearPorcentaje(tasaAnual)}</span> anual
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="font-semibold text-blue-900">Última Actualización</div>
                    <p className="text-blue-800">
                      {new Date(configuracionActiva?.updated_at || new Date()).toLocaleDateString('es-GT', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* FOOTER: Bienvenido Vendedor (Solo para Vendedores) */}
      {isVendedor && (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <div className="max-w-md">
              <h4 className="text-xl font-bold">¡Buen trabajo hoy!</h4>
              <p className="text-muted-foreground mt-2">
                Utiliza los botones de arriba para gestionar tus ventas y cotizaciones. Si necesitas ayuda con el registro de un nuevo cliente, contacta a tu supervisor.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdminDashboard