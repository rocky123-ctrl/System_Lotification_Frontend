"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, CreditCard, CheckCircle, Clock, TrendingUp, DollarSign, Settings, Save } from "lucide-react"
import { useConfiguracion } from "@/hooks/use-configuracion"
import { formatearPorcentaje, formatearMoneda, formatearTasaMensual } from "@/lib/configuracion-service"

export function AdminDashboard() {
  const { configuracionActiva, configuracionResumen, isLoading } = useConfiguracion()
  const [tasaAnual, setTasaAnual] = useState("12")
  const [tasaMensual, setTasaMensual] = useState("1")

  // Usar datos reales de la configuración
  const stats = {
    lotesDisponibles: configuracionResumen?.lotes_disponibles || 0,
    lotesFinanciados: configuracionResumen?.lotes_financiados || 0,
    lotesReservados: configuracionResumen?.lotes_reservados || 0,
    lotesPagados: configuracionResumen?.lotes_vendidos || 0,
    ingresosTotales: 7759646.95, // TODO: Obtener de backend
    ingresosMes: 245000, // TODO: Obtener de backend
    tasaCobranza: 85.5, // TODO: Obtener de backend
    promedioFinanciamiento: 24, // TODO: Obtener de backend
  }

  // Calcular total de lotes
  const totalLotes = stats.lotesDisponibles + stats.lotesFinanciados + stats.lotesReservados + stats.lotesPagados

  // Actualizar tasas cuando se carga la configuración
  useEffect(() => {
    if (configuracionActiva) {
      setTasaAnual(configuracionActiva.tasa_anual)
      setTasaMensual((parseFloat(configuracionActiva.tasa_anual) / 12).toFixed(2))
    }
  }, [configuracionActiva])

  const handleSaveTasas = () => {
    // Aquí se guardarían las tasas en la base de datos
    console.log("Guardando tasas:", { tasaAnual, tasaMensual })
  }

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

  // Mostrar mensaje si no hay configuración
  if (!configuracionActiva) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración Requerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No hay configuración activa en el sistema</p>
              <p className="text-sm text-muted-foreground mb-6">
                Para ver el dashboard completo, necesitas configurar el sistema primero.
              </p>
              <Button asChild>
                <a href="/configuracion">
                  <Settings className="h-4 w-4 mr-2" />
                  Ir a Configuración
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Información de la lotificación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {configuracionActiva.nombre_lotificacion}
          </CardTitle>
          <CardDescription>{configuracionActiva.ubicacion}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Total de Lotes:</span> {configuracionActiva.total_lotes}
            </div>
            <div>
              <span className="font-medium">Tasa Anual:</span> {formatearPorcentaje(configuracionActiva.tasa_anual)}
            </div>
            <div>
              <span className="font-medium">Tasa Mensual:</span> {formatearTasaMensual(configuracionActiva.tasa_anual)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Disponibles</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{stats.lotesDisponibles}</div>
            <p className="text-xs text-muted-foreground">Listos para venta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Financiados</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{stats.lotesFinanciados}</div>
            <p className="text-xs text-muted-foreground">En proceso de pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Reservados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{stats.lotesReservados}</div>
            <p className="text-xs text-muted-foreground">Pendientes de financiamiento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Pagados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{stats.lotesPagados}</div>
            <p className="text-xs text-muted-foreground">Completamente pagados</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas financieras */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q {stats.ingresosTotales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Acumulado histórico</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q {stats.ingresosMes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cobranza</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasaCobranza}%</div>
            <p className="text-xs text-muted-foreground">Pagos al día</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Financiamiento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.promedioFinanciamiento} meses</div>
            <p className="text-xs text-muted-foreground">Plazo promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuración de tasas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Tasas de Interés
          </CardTitle>
          <CardDescription>
            Establece las tasas que se utilizarán para calcular las cuotas de financiamiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tasa-anual">Tasa Anual (%)</Label>
              <Input
                id="tasa-anual"
                type="number"
                step="0.1"
                value={configuracionActiva ? configuracionActiva.tasa_anual : tasaAnual}
                onChange={(e) => setTasaAnual(e.target.value)}
                placeholder="12.0"
                disabled={!configuracionActiva}
              />
              <p className="text-xs text-muted-foreground">Tasa de interés anual para cálculos de financiamiento</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasa-mensual">Tasa Mensual (%)</Label>
              <Input
                id="tasa-mensual"
                type="number"
                step="0.01"
                value={configuracionActiva ? formatearTasaMensual(configuracionActiva.tasa_anual).replace('%', '') : tasaMensual}
                onChange={(e) => setTasaMensual(e.target.value)}
                placeholder="1.0"
                disabled={!configuracionActiva}
              />
              <p className="text-xs text-muted-foreground">Tasa de interés mensual equivalente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveTasas} className="flex items-center gap-2" disabled={!configuracionActiva}>
              <Save className="h-4 w-4" />
              Guardar Configuración
            </Button>
            <Badge variant="outline">
              Última actualización: {configuracionActiva ? new Date(configuracionActiva.updated_at).toLocaleDateString() : new Date().toLocaleDateString()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Resumen por estado */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Lotes por Estado</CardTitle>
          <CardDescription>Distribución actual de todos los lotes en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-chart-1"></div>
                <span className="font-medium">Disponibles</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{stats.lotesDisponibles} lotes</div>
                <div className="text-sm text-muted-foreground">
                  {totalLotes > 0 ? ((stats.lotesDisponibles / totalLotes) * 100).toFixed(1) : '0'}% del total
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-chart-2"></div>
                <span className="font-medium">Financiados</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{stats.lotesFinanciados} lotes</div>
                <div className="text-sm text-muted-foreground">
                  {totalLotes > 0 ? ((stats.lotesFinanciados / totalLotes) * 100).toFixed(1) : '0'}% del total
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-chart-4"></div>
                <span className="font-medium">Reservados</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{stats.lotesReservados} lotes</div>
                <div className="text-sm text-muted-foreground">
                  {totalLotes > 0 ? ((stats.lotesReservados / totalLotes) * 100).toFixed(1) : '0'}% del total
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-chart-3"></div>
                <span className="font-medium">Pagados Totalmente</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{stats.lotesPagados} lotes</div>
                <div className="text-sm text-muted-foreground">
                  {totalLotes > 0 ? ((stats.lotesPagados / totalLotes) * 100).toFixed(1) : '0'}% del total
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
