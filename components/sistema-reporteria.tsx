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
import { getReporteDashboard, ReporteDashboardResponse } from "@/lib/reportes-service"
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
    d.setMonth(0)
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [proyectoFiltro, setProyectoFiltro] = useState("all")
  
  const [lotificaciones, setLotificaciones] = useState<Lotificacion[]>([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [reporteData, setReporteData] = useState<ReporteDashboardResponse | null>(null)

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const res = await lotificacionService.getLotificaciones()
        setLotificaciones(res)
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
    setIsLoading(true)
    try {
      const data = await getReporteDashboard(fechaInicio, fechaFin, proyectoFiltro === "all" ? undefined : proyectoFiltro)
      setReporteData(data)
      toast.success("Reporte generado exitosamente")
    } catch (error) {
      toast.error("Error al generar el reporte")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
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

  const exportarPDF = () => {
    console.log("Exportando reporte a PDF...")
    // Implementar exportación a PDF
  }

  const exportarExcel = () => {
    toast.info("Función de exportación a Excel en desarrollo")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sistema de Reportería</h1>
          <p className="text-muted-foreground">Genera reportes detallados y análisis de la lotificación</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportarExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportarPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
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
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha-fin">Fecha Fin</Label>
              <Input id="fecha-fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="proyecto-filtro">Proyecto o Lotificación</Label>
              <Select value={proyectoFiltro} onValueChange={setProyectoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proyectos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
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
              <div className="text-2xl font-bold">Q {reporteData.valorTotalVentas.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Valor acumulado en ventas</p>
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
              <CardTitle className="text-sm font-medium">Pendiente por Cobrar</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Q {reporteData.valorPendienteCobro.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Saldo financiado restante</p>
            </CardContent>
          </Card>
        </div>

      {/* Tabs de reportes */}
      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumen">Resumen General</TabsTrigger>
          <TabsTrigger value="financiero">Reporte Financiero</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="detallado">Reporte Detallado</TabsTrigger>
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

            {/* Resumen por manzana */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen por Manzana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manzana</TableHead>
                        <TableHead>Disponibles</TableHead>
                        <TableHead>Financiados</TableHead>
                        <TableHead>Reservados</TableHead>
                        <TableHead>Pagados</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumenPorManzana.map((manzana) => (
                        <TableRow key={manzana.manzana}>
                          <TableCell className="font-medium">{manzana.manzana}</TableCell>
                          <TableCell>{manzana.disponibles}</TableCell>
                          <TableCell>{manzana.financiados}</TableCell>
                          <TableCell>{manzana.reservados}</TableCell>
                          <TableCell>{manzana.pagados}</TableCell>
                          <TableCell>Q {manzana.valorTotal.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financiero" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Informe financiero detallado */}
            <Card>
              <CardHeader>
                <CardTitle>Informe Financiero Detallado</CardTitle>
                <CardDescription>Valores en Quetzales (Q)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Enganches Cobrados</span>
                    <span className="font-bold">Q {reporteData.valorEnganches.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Capital Cobrado</span>
                    <span className="font-bold">Q {reporteData.valorCapitalCobrado.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Intereses Cobrados</span>
                    <span className="font-bold">Q {reporteData.valorInteresesCobrados.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Reservas Cobradas</span>
                    <span className="font-bold">Q {reporteData.valorReservas.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                    <span className="font-medium">Pendiente por Cobrar</span>
                    <span className="font-bold text-destructive">
                      Q {reporteData.valorPendienteCobro.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Cobrado</span>
                      <span className="text-lg font-bold text-chart-3">
                        Q{" "}
                        {(
                          reporteData.valorEnganches +
                          reporteData.valorCapitalCobrado +
                          reporteData.valorInteresesCobrados +
                          reporteData.valorReservas
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indicadores de rendimiento */}
            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tasa de Conversión (Reserva → Venta)</span>
                      <span className="font-medium">75%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-chart-3 h-2 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tasa de Cobranza</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-chart-1 h-2 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ocupación del Proyecto</span>
                      <span className="font-medium">
                        {(((totalLotes - reporteData.lotesDisponibles) / totalLotes) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-chart-4 h-2 rounded-full"
                        style={{ width: `${((totalLotes - reporteData.lotesDisponibles) / totalLotes) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-chart-3">Q 465,579</div>
                      <div className="text-sm text-muted-foreground">Intereses generados este año</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="graficos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico de barras - Ingresos por categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ingresos por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataFinanciera}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`Q ${Number(value).toLocaleString()}`, "Monto"]} />
                    <Bar dataKey="monto" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
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

            {/* Gráfico de líneas - Ventas mensuales */}
            <Card className="md:col-span-2">
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

        <TabsContent value="detallado" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte Detallado de Lotes Reservados</CardTitle>
              <CardDescription>Información completa según el formato requerido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Tabla resumen como en la imagen */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-muted">DESCRIPCIÓN</TableHead>
                        <TableHead className="bg-muted">LOTES</TableHead>
                        <TableHead className="bg-muted">RECIBIDO POR RECIBIR</TableHead>
                        <TableHead className="bg-muted">TOTAL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Reservados</TableCell>
                        <TableCell>{reporteData.lotesReservados}</TableCell>
                        <TableCell>Q 0.00</TableCell>
                        <TableCell>Q {reporteData.valorReservas.toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Cancelados / Disponibles</TableCell>
                        <TableCell>{reporteData.lotesDisponibles}</TableCell>
                        <TableCell>Q 0.00</TableCell>
                        <TableCell>Q 0.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Financiados</TableCell>
                        <TableCell>{reporteData.lotesFinanciados}</TableCell>
                        <TableCell>Q {reporteData.valorPendienteCobro.toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                        <TableCell>Q {(reporteData.valorEnganches + reporteData.valorCapitalCobrado).toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Pagados / Escriturados</TableCell>
                        <TableCell>{reporteData.lotesPagados}</TableCell>
                        <TableCell>Q 0.00</TableCell>
                        <TableCell>Q {(reporteData.valorTotalVentas - (reporteData.valorEnganches + reporteData.valorCapitalCobrado + reporteData.valorPendienteCobro)).toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted">
                        <TableCell className="font-bold">TOTAL PROYECTO</TableCell>
                        <TableCell className="font-bold">{totalLotes}</TableCell>
                        <TableCell className="font-bold">Q {reporteData.valorPendienteCobro.toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                        <TableCell className="font-bold">Q {reporteData.valorTotalVentas.toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Valor de lotes financiados y pagados */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-bold mb-4 text-center bg-chart-3 text-white p-2 rounded">
                      VALOR LOTES FINANCIADOS Y PAGADOS TOTALMENTE
                    </h4>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">ENGANCHES</TableCell>
                          <TableCell>Q {reporteData.valorEnganches.toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">CAPITAL</TableCell>
                          <TableCell>Q {reporteData.valorCapitalCobrado.toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">INTERESES</TableCell>
                          <TableCell>Q {reporteData.valorInteresesCobrados.toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">YA ESCRITURADOS / PAGADOS</TableCell>
                          <TableCell>Q {(reporteData.valorTotalVentas - (reporteData.valorEnganches + reporteData.valorCapitalCobrado + reporteData.valorPendienteCobro)).toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">LOTES RESERVADOS</TableCell>
                          <TableCell>Q {reporteData.valorReservas.toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">POR RECIBIR</TableCell>
                          <TableCell>Q {reporteData.valorPendienteCobro.toLocaleString('es-GT', {minimumFractionDigits: 2})}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted">
                          <TableCell className="font-bold">TOTAL VENTA/PROYECTO</TableCell>
                          <TableCell className="font-bold">
                            Q{" "}
                            {reporteData.valorTotalVentas.toLocaleString('es-GT', {minimumFractionDigits: 2})}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-4">
                    <Badge variant="outline" className="w-full justify-center p-2">
                      Reporte generado el {new Date().toLocaleDateString()}
                    </Badge>
                    <div className="text-center space-y-2">
                      <div className="text-sm text-muted-foreground">Período del reporte:</div>
                      <div className="font-medium">
                        {new Date(fechaInicio).toLocaleDateString()} - {new Date(fechaFin).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-sm text-muted-foreground">Total de lotes en el proyecto:</div>
                      <div className="text-2xl font-bold">{totalLotes}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  )
}
