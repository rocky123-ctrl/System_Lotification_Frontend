"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TablePagination } from "@/components/ui/table-pagination"
import { Download, Wallet, CreditCard, Search, Loader2, Calendar, CheckCircle2, AlertCircle } from "lucide-react"
import { planillasService, type LiquidacionComision } from "@/lib/planillas-service"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function PlanillasPage() {
  // State for data
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionComision[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  
  // State for filters
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [mes, setMes] = useState<string>("all")
  const [anio, setAnio] = useState<string>(new Date().getFullYear().toString())
  const [estado, setEstado] = useState<'all' | 'PENDIENTE' | 'PAGADO'>('all')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // State for Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidacionComision | null>(null)
  const [referenciaPago, setReferenciaPago] = useState("")
  const [paying, setPaying] = useState(false)

  // Debouncing effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on search
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchLiquidaciones = useCallback(async () => {
    setLoading(true)
    try {
      const response = await planillasService.getLiquidaciones({
        anio,
        mes,
        search: debouncedSearch,
        estado: estado === 'all' ? undefined : estado,
        page
      })
      setLiquidaciones(response.results)
      setTotalItems(response.count)
    } catch (err) {
      console.error("Error fetching liquidations:", err)
      toast.error("No se pudieron cargar las liquidaciones")
    } finally {
      setLoading(false)
    }
  }, [anio, mes, debouncedSearch, estado, page])

  useEffect(() => {
    fetchLiquidaciones()
  }, [fetchLiquidaciones])

  const handlePagarAhora = async () => {
    if (!selectedLiquidation) return
    setPaying(true)
    try {
      await planillasService.pagarLiquidacion(selectedLiquidation.id, referenciaPago)
      toast.success("Pago registrado exitosamente")
      setShowPaymentModal(false)
      setReferenciaPago("")
      fetchLiquidaciones()
    } catch (err) {
      console.error("Error paying:", err)
      toast.error("Error al registrar el pago")
    } finally {
      setPaying(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      const blob = await planillasService.exportarExcel({
        anio,
        mes,
        search: debouncedSearch,
        estado: estado === 'all' ? undefined : estado
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Planilla_${mes}_${anio}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      console.error("Error exporting:", err)
      toast.error("Error al generar el archivo Excel")
    }
  }

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatDate = (s: string) => {
    if (!s) return "—"
    return new Date(s).toLocaleDateString("es-GT", { dateStyle: "short" })
  }

  const totalComisiones = liquidaciones.reduce((acc, curr) => acc + parseFloat(curr.monto_pagado), 0)

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Planilla</h1>
              <p className="text-muted-foreground">Control y liquidación de comisiones a vendedores para el periodo seleccionado.</p>
            </div>
            <Button 
              onClick={handleExportExcel} 
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
            >
              <Download className="h-4 w-4" />
              Generar Excel de Periodo
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Búsqueda</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Input 
                  placeholder="Nombre del vendedor..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9"
                />
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mes / Periodo</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Meses</SelectItem>
                    <SelectItem value="1">Enero</SelectItem>
                    <SelectItem value="2">Febrero</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Mayo</SelectItem>
                    <SelectItem value="6">Junio</SelectItem>
                    <SelectItem value="7">Julio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Septiembre</SelectItem>
                    <SelectItem value="10">Octubre</SelectItem>
                    <SelectItem value="11">Noviembre</SelectItem>
                    <SelectItem value="12">Diciembre</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Año</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Select value={anio} onValueChange={setAnio}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-emerald-50/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comisiones en Pantalla</CardTitle>
                <Wallet className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalComisiones)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Suma del listado actual</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liquidaciones Pendientes y Pagadas</CardTitle>
                  <CardDescription>Detalle de comisiones generadas por venta de lotes.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <Label className="text-xs">Estado:</Label>
                   <Select value={estado} onValueChange={(v: any) => setEstado(v)}>
                    <SelectTrigger className="w-[150px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PENDIENTE">Sólo Pendientes</SelectItem>
                      <SelectItem value="PAGADO">Sólo Pagados</SelectItem>
                    </SelectContent>
                   </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold">Vendedor</TableHead>
                      <TableHead className="font-bold">Venta / Lote</TableHead>
                      <TableHead className="font-bold">Comisión</TableHead>
                      <TableHead className="font-bold">Fecha Venta</TableHead>
                      <TableHead className="font-bold">Estado</TableHead>
                      <TableHead className="text-right font-bold h-[50px] pr-8">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Sincronizando planilla...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : liquidaciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">No se encontraron liquidaciones para este periodo.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      liquidaciones.map((liq) => (
                        <TableRow key={liq.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="py-4">
                            <span className="font-semibold text-slate-900">{liq.vendedor_nombre}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">Lote: {liq.lote_numero}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">Ticket: V-{liq.venta}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-orange-600">{formatCurrency(liq.monto_pagado)}</span>
                          </TableCell>
                          <TableCell>{formatDate(liq.fecha_venta)}</TableCell>
                          <TableCell>
                            {liq.estado_pago === 'PAGADO' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-3 font-semibold">
                                Pagado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 border-slate-300 bg-slate-50 px-3">
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            {liq.estado_pago === 'PENDIENTE' ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-primary/30 hover:bg-primary/5 text-primary font-bold h-8"
                                onClick={() => {
                                  setSelectedLiquidation(liq)
                                  setShowPaymentModal(true)
                                }}
                              >
                                <CreditCard className="h-3 w-3 mr-1.5" />
                                Pagar Ahora
                              </Button>
                            ) : (
                              <div className="flex flex-col items-end text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                  <CheckCircle2 className="h-3 w-3" /> Pagado: {formatDate(liq.fecha_pago || "")}
                                </span>
                                {liq.referencia_pago && <span className="italic">Ref: {liq.referencia_pago}</span>}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {!loading && totalItems > 0 && (
                <div className="p-4 border-t">
                  <TablePagination 
                    currentPage={page}
                    totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={totalItems}
                    startIndex={(page - 1) * ITEMS_PER_PAGE + 1}
                    endIndex={Math.min(page * ITEMS_PER_PAGE, totalItems)}
                    onPageChange={setPage}
                    onItemsPerPageChange={() => {}}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal Pago de Liquidación */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                Registrar Liquidación
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                Está registrando el pago de la comisión por el valor de{" "}
                <span className="font-bold text-orange-600">{formatCurrency(selectedLiquidation?.monto_pagado || 0)}</span> para{" "}
                <span className="font-bold text-slate-900">{selectedLiquidation?.vendedor_nombre}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 mt-2">
              <div className="grid gap-2">
                <Label htmlFor="referencia" className="font-bold">Referencia de Pago / Comprobante</Label>
                <Input
                  id="referencia"
                  placeholder="Ej. Cheque #123, Transf. Bac..."
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  className="h-11 border-slate-300 focus-visible:ring-primary/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  Al confirmar, la liquidación pasará a estado <strong>PAGADO</strong> con fecha de hoy.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="ghost" 
                onClick={() => setShowPaymentModal(false)}
                disabled={paying}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handlePagarAhora} 
                disabled={paying}
                className="bg-primary hover:bg-primary/90 font-bold px-8 shadow-md"
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Pago"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
