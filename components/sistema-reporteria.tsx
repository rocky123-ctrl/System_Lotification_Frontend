"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useEffect } from "react"
import { lotificacionService, Lotificacion } from "@/lib/lotificacion-service"
import { 
  getReporteDashboard, 
  ReporteDashboardResponse,
  getReporteFinanciamientoClientes,
  getReporteServiciosClientes,
  ReporteFinanciamientoResponse,
  ReporteServiciosResponse
} from "@/lib/reportes-service"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Download, FileText, TrendingUp, DollarSign, MapPin, Calendar, BarChart3, PieChartIcon } from "lucide-react"

interface ReporteData {
  lotesDisponibles: number
  lotesFinanciados: number
  lotesReservados: number
  lotesPagados: number
  lotesCancelados: number
  valorTotalVentas: number
  valorEnganches: number
  valorCapitalCobrado: number
  valorInteresesCobrados: number
  valorReservas: number
  valorPendienteCobro: number
}

export function SistemaReporteria() {
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-01`
  })
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    return `${d.getFullYear()}-${m}`
  })
  const [proyectoFiltro, setProyectoFiltro] = useState("")
  
  const [lotificaciones, setLotificaciones] = useState<Lotificacion[]>([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [reporteData, setReporteData] = useState<ReporteDashboardResponse | null>(null)
  
  const [financiamientoData, setFinanciamientoData] = useState<ReporteFinanciamientoResponse | null>(null)
  const [serviciosData, setServiciosData] = useState<ReporteServiciosResponse | null>(null)
  const [pageFinanciamiento, setPageFinanciamiento] = useState(1)
  const [pageServicios, setPageServicios] = useState(1)
  const [appliedLotificacion, setAppliedLotificacion] = useState<string>("")

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const res = await lotificacionService.getLotificaciones()
        setLotificaciones(res)
        if (res.length > 0) {
          setProyectoFiltro(res[0].id.toString())
        }
      } catch (error) {
        console.error("Error al cargar proyectos:", error)
      }
    }
    fetchProyectos()
  }, [])

  const generarReporte = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Debes seleccionar una fecha de inicio y fin")
      return
    }
    if (!proyectoFiltro) {
      toast.error("Debes seleccionar un proyecto")
      return
    }
    setIsLoading(true)
    try {
      const data = await getReporteDashboard(fechaInicio, fechaFin, proyectoFiltro)
      setReporteData(data)
      setAppliedLotificacion(proyectoFiltro)
      setPageFinanciamiento(1)
      setPageServicios(1)
      
      const finData = await getReporteFinanciamientoClientes(proyectoFiltro, 1)
      setFinanciamientoData(finData)
      
      const servData = await getReporteServiciosClientes(proyectoFiltro, 1)
      setServiciosData(servData)
      
      toast.success("Reporte generado exitosamente")
    } catch (error) {
      toast.error("Error al generar el reporte")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChangeFinanciamiento = async (newPage: number) => {
    if (!appliedLotificacion) return
    setPageFinanciamiento(newPage)
    const finData = await getReporteFinanciamientoClientes(appliedLotificacion, newPage)
    setFinanciamientoData(finData)
  }

  const handlePageChangeServicios = async (newPage: number) => {
    if (!appliedLotificacion) return
    setPageServicios(newPage)
    const servData = await getReporteServiciosClientes(appliedLotificacion, newPage)
    setServiciosData(servData)
  }

  // Derived state
  const dataPorEstado = reporteData ? [
    { name: "Disponibles", value: reporteData.lotesDisponibles, color: "#6366f1" },
    { name: "Financiados", value: reporteData.lotesFinanciados, color: "#dc2626" },
    { name: "Reservados", value: reporteData.lotesReservados, color: "#f59e0b" },
    { name: "Pagados", value: reporteData.lotesPagados, color: "#059669" },
  ] : []

  const dataFinanciera = reporteData ? [
    { name: "Enganches", monto: reporteData.valorEnganches },
    { name: "Capital Cobrado", monto: reporteData.valorCapitalCobrado },
    { name: "Intereses", monto: reporteData.valorInteresesCobrados },
    { name: "Reservas", monto: reporteData.valorReservas },
    { name: "Pendiente Cobro", monto: reporteData.valorPendienteCobro },
  ] : []

  const dataVentasMensuales = reporteData?.dataVentasMensuales || []
  const resumenPorManzana = reporteData?.resumenPorManzana || []

  const totalLotes = reporteData 
    ? reporteData.lotesDisponibles + reporteData.lotesFinanciados + reporteData.lotesReservados + reporteData.lotesPagados 
    : 0


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sistema de Reportería</h1>
          <p className="text-muted-foreground">Genera reportes detallados y análisis de la lotificación</p>
        </div>
        <div className="flex gap-2">

          <Button onClick={generarReporte} disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            {isLoading ? "Generando..." : "Generar Reporte"}
          </Button>
        </div>
      </div>

      {/* Filtros de reporte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuración de Reporte</CardTitle>
          <CardDescription>Selecciona los parámetros para generar tu reporte personalizado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
              <Input
                id="fecha-inicio"
                type="month"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha-fin">Fecha Fin</Label>
              <Input id="fecha-fin" type="month" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="proyecto-filtro">Proyecto o Lotificación</Label>
              <Select value={proyectoFiltro} onValueChange={setProyectoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {lotificaciones.map(lot => (
                    <SelectItem key={lot.id} value={lot.id.toString()}>{lot.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs principales */}
      {!reporteData && isLoading && (
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}
      
      {!reporteData && !isLoading && (
        <div className="flex items-center justify-center h-64 border rounded-xl bg-slate-50 border-dashed">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 opacity-20 mb-3" />
            <p>Configura los filtros y presiona "Generar Reporte" para ver los datos</p>
          </div>
        </div>
      )}

      {reporteData && (
      <>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLotes}</div>
              <p className="text-xs text-muted-foreground">En el proyecto seleccionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Proyecto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Q {reporteData.valorTotalProyectoLotes.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Suma de valores de todos los lotes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalLotes > 0 ? (((totalLotes - reporteData.lotesDisponibles) / totalLotes) * 100).toFixed(1) : "0"}%
              </div>
              <p className="text-xs text-muted-foreground">Lotes vendidos/reservados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor total de Ventas hechas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Q {reporteData.valorTotalVentas.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Valor acumulado en ventas</p>
            </CardContent>
          </Card>
        </div>

      {/* Tabs de reportes */}
      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumen">Resumen General</TabsTrigger>
          <TabsTrigger value="financiero">Reporte Financiero</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Resumen por estado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Distribución de Lotes por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataPorEstado.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.value}</div>
                        <div className="text-xs text-muted-foreground">
                          {((item.value / totalLotes) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico circular - Distribución de lotes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Distribución de Lotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dataPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financiero" className="space-y-6">
          {financiamientoData && (
            <Card>
              <CardHeader>
                <CardTitle>Cuentas por Cobrar (Financiamiento)</CardTitle>
                <CardDescription>Clientes con lotes en financiamiento y progreso de cuotas.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Progreso de Cuotas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financiamientoData.results.map((item) => (
                      <TableRow key={item.venta_id}>
                        <TableCell className="font-medium">{item.cliente_nombre}</TableCell>
                        <TableCell>{item.lote}</TableCell>
                        <TableCell>{item.progreso_cuotas}</TableCell>
                      </TableRow>
                    ))}
                    {financiamientoData.results.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">No hay datos disponibles</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Total: {financiamientoData.count} registros
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChangeFinanciamiento(pageFinanciamiento - 1)}
                      disabled={!financiamientoData.previous}
                    >
                      Anterior
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChangeFinanciamiento(pageFinanciamiento + 1)}
                      disabled={!financiamientoData.next}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recuadro de Totales */}
          {financiamientoData && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Suma Total de Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Q {financiamientoData.totales.total_monto.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
                  <p className="text-xs text-muted-foreground">Total histórico en cuentas cobrar</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">Q {financiamientoData.totales.pagados.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
                  <p className="text-xs text-muted-foreground">Suma de cuotas ya pagadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Pendiente/Vencido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">Q {financiamientoData.totales.pendientes.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
                  <p className="text-xs text-muted-foreground">Suma de cuotas pendientes o vencidas</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Segunda Tabla - Servicios */}
          {serviciosData && (
            <Card>
              <CardHeader>
                <CardTitle>Estado de Servicios Activos</CardTitle>
                <CardDescription>Clientes con servicios activos y su estado de cuenta al día.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviciosData.results.map((item) => (
                      <TableRow key={item.cliente_id}>
                        <TableCell className="font-medium">{item.cliente_nombre}</TableCell>
                        <TableCell>
                          {item.estado_al_dia ? (
                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">al dia</Badge>
                          ) : (
                            <Badge variant="destructive">con atraso</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {serviciosData.results.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center">No hay clientes con servicios activos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Total: {serviciosData.count} clientes
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChangeServicios(pageServicios - 1)}
                      disabled={!serviciosData.previous}
                    >
                      Anterior
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePageChangeServicios(pageServicios + 1)}
                      disabled={!serviciosData.next}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="graficos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            {/* Gráfico de líneas - Ventas mensuales */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ventas Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dataVentasMensuales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "ventas" ? `${value} lotes` : `Q ${Number(value).toLocaleString()}`,
                        name === "ventas" ? "Lotes Vendidos" : "Monto",
                      ]}
                    />
                    <Line type="monotone" dataKey="ventas" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="monto" stroke="#dc2626" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
      </>
      )}
    </div>
  )
}
