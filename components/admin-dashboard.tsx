"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Settings,
  Bell,
  AlertTriangle,
  Info
} from "lucide-react"
import { useConfiguracion } from "@/hooks/use-configuracion"
import { formatearPorcentaje, formatearMoneda, formatearTasaMensual } from "@/lib/configuracion-service"

export function AdminDashboard() {
  const { configuracionActiva, configuracionResumen, isLoading } = useConfiguracion()

  // Usar datos reales de la configuración
  const stats = {
    lotesDisponibles: configuracionResumen?.lotes_disponibles || 0,
    lotesFinanciados: configuracionResumen?.lotes_financiados || 0,
    lotesReservados: configuracionResumen?.lotes_reservados || 0,
    lotesPagados: configuracionResumen?.lotes_vendidos || 0,
    ingresosTotales: 7759646.95,
    ingresosMes: 245000,
    gastosMes: 85000,
    cobranzaAtrasada: 45000,
    tasaCobranza: 85.5,
    promedioFinanciamiento: 24,
  }

  // Calcular totales
  const totalLotes = stats.lotesDisponibles + stats.lotesFinanciados + stats.lotesReservados + stats.lotesPagados
  const gananciasMes = stats.ingresosMes - stats.gastosMes
  const porcentajeGanancia = ((gananciasMes / stats.ingresosMes) * 100).toFixed(1)


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
  const ubicacion = configuracionActiva?.ubicacion || "Ubicación no especificada"
  const tasaAnual = configuracionActiva?.tasa_anual || "12.0"

  return (
    <div className="space-y-8">
      {/* Encabezado: Información General */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">{nombreLotificacion}</h2>
        <p className="text-muted-foreground">{ubicacion}</p>
      </div>

      {/* ==== SECCIÓN 1: GANANCIAS Y PÉRDIDAS ==== */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Información General de Ganancias y Pérdidas
        </h3>

        {/* Row 1: Ingresos y Gastos */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Ingresos del Mes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Q {stats.ingresosMes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Ingresos por cobranzas</p>
            </CardContent>
          </Card>

          {/* Gastos del Mes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">Q {stats.gastosMes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Gastos operativos</p>
            </CardContent>
          </Card>

          {/* Ganancia Neta */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">Q {gananciasMes.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">{porcentajeGanancia}% de margen</p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Ingresos Totales y Tasa de Cobranza */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Ingresos Totales Acumulados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales Acumulados</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Q {stats.ingresosTotales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Desde el inicio del proyecto</p>
            </CardContent>
          </Card>

          {/* Tasa de Cobranza */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cobranza</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">{stats.tasaCobranza}%</div>
              <p className="text-xs text-muted-foreground mt-1">Pagos al día</p>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Estado de Lotes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Lotes</CardTitle>
            <CardDescription>Distribución actual de todos los lotes en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-1"></div>
                  <span className="font-medium text-sm">Disponibles</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{stats.lotesDisponibles}</div>
                  <div className="text-xs text-muted-foreground">
                    {totalLotes > 0 ? ((stats.lotesDisponibles / totalLotes) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-2"></div>
                  <span className="font-medium text-sm">Financiados</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{stats.lotesFinanciados}</div>
                  <div className="text-xs text-muted-foreground">
                    {totalLotes > 0 ? ((stats.lotesFinanciados / totalLotes) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-4"></div>
                  <span className="font-medium text-sm">Reservados</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{stats.lotesReservados}</div>
                  <div className="text-xs text-muted-foreground">
                    {totalLotes > 0 ? ((stats.lotesReservados / totalLotes) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-3"></div>
                  <span className="font-medium text-sm">Pagados</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{stats.lotesPagados}</div>
                  <div className="text-xs text-muted-foreground">
                    {totalLotes > 0 ? ((stats.lotesPagados / totalLotes) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==== SECCIÓN 2: NOTIFICACIONES DEL PROGRAMA ==== */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones del Programa
        </h3>

        {/* Notificaciones Críticas */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alertas Críticas
            </CardTitle>
            <CardDescription>Problemas que requieren atención inmediata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Cobranza Atrasada */}
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-900">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-red-900 dark:text-red-100">Cobranza Atrasada</div>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Hay <span className="font-bold">Q {stats.cobranzaAtrasada.toLocaleString()}</span> en pagos atrasados
                </p>
              </div>
              <Badge variant="destructive">12 clientes</Badge>
            </div>

            {/* Promedio de Atraso */}
            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-900">
              <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-orange-900 dark:text-orange-100">Promedio de Retraso</div>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Los pagos atrasados tienen un retraso promedio de <span className="font-bold">5 días</span>
                </p>
              </div>
              <Badge variant="secondary">5 días</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones Informativas */}
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Información General
            </CardTitle>
            <CardDescription>Datos operacionales y del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Configuración Activa */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
              <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">Configuración Activa</div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Tasa anual: <span className="font-bold">{formatearPorcentaje(tasaAnual)}</span> | 
                  Tasa mensual: <span className="font-bold">{formatearTasaMensual(tasaAnual)}</span>
                </p>
              </div>
            </div>

            {/* Promedio de Financiamiento */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
              <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">Promedio de Financiamiento</div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  El plazo promedio de financiamiento es de <span className="font-bold">{stats.promedioFinanciamiento} meses</span>
                </p>
              </div>
              <Badge variant="outline">{stats.promedioFinanciamiento} meses</Badge>
            </div>

            {/* Última Actualización */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
              <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">Última Actualización</div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {new Date(configuracionActiva?.updated_at || new Date()).toLocaleDateString('es-GT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            <CardDescription>Gestiona aspectos importantes del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/configuracion">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/reportes">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Reportes
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/lotes">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Gestionar Lotes
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard