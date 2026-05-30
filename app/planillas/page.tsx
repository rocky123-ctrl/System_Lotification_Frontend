"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Wallet, Users, Search, Loader2, Calendar, AlertCircle, Eye } from "lucide-react"
import { planillasService, type ResumenVendedor } from "@/lib/planillas-service"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function PlanillasPage() {
  const router = useRouter()

  // State for data
  const [resumen, setResumen] = useState<ResumenVendedor[]>([])
  const [loading, setLoading] = useState(false)
  
  // State for filters (By default wait for user selection)
  const [mes, setMes] = useState<string>("all")
  const [anio, setAnio] = useState<string>(new Date().getFullYear().toString())

  const isFilterComplete = mes !== "all" && anio !== "all"

  const fetchResumen = useCallback(async () => {
    if (!isFilterComplete) {
      setResumen([])
      return
    }
    
    setLoading(true)
    try {
      const response = await planillasService.getResumenVendedores(anio, mes)
      setResumen(response)
    } catch (err) {
      console.error("Error fetching resumen:", err)
      toast.error("No se pudieron cargar el resumen de comisiones")
    } finally {
      setLoading(false)
    }
  }, [anio, mes, isFilterComplete])

  useEffect(() => {
    fetchResumen()
  }, [fetchResumen])

  const handleExportExcel = async () => {
    if (!isFilterComplete) {
      toast.error("Debe seleccionar un Mes y un Año para exportar")
      return
    }
    
    if (resumen.length === 0) {
      toast.error("No se puede generar porque no hay registros en este periodo")
      return
    }
    
    try {
      const blob = await planillasService.exportarExcel({
        anio,
        mes,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Planilla_${mes}_${anio}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err: any) {
      console.error("Error exporting:", err)
      if (err.message === 'NO_DATA') {
        toast.error("No se puede generar porque no hay registros en el periodo seleccionado")
      } else {
        toast.error("Error al generar el archivo Excel")
      }
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

  const totalComisionesGlobal = resumen.reduce((acc, curr) => acc + (curr.total_comisiones || 0), 0)
  const totalPagadoGlobal = resumen.reduce((acc, curr) => acc + (curr.monto_pagado || 0), 0)
  const totalPendienteGlobal = resumen.reduce((acc, curr) => acc + (curr.monto_pendiente || 0), 0)

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Planillas</h1>
              <p className="text-muted-foreground">Resumen de liquidaciones agrupadas por vendedor.</p>
            </div>
            <Button 
              onClick={handleExportExcel} 
              disabled={!isFilterComplete || resumen.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg disabled:bg-slate-300 disabled:text-slate-500"
            >
              <Download className="h-4 w-4" />
              Generar Excel de Periodo
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4">
            <Card className="border-l-4 border-l-purple-500 shadow-sm col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Periodo de Cálculo</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select value={mes} onValueChange={setMes}>
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue placeholder="Seleccione Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Seleccione un Mes</SelectItem>
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

                  <Select value={anio} onValueChange={setAnio}>
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Seleccione Año</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isFilterComplete && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Requerido seleccionar Mes y Año para visualizar
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-emerald-50/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comisiones del Periodo</CardTitle>
                <Wallet className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalComisionesGlobal)}</div>
                <div className="text-[11px] flex justify-between mt-1 text-slate-600">
                  <span>Pagado: {formatCurrency(totalPagadoGlobal)}</span>
                  <span className="text-orange-600 font-semibold">Pendiente: {formatCurrency(totalPendienteGlobal)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{resumen.length}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Con ventas en el periodo</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader className="bg-muted/20 border-b">
              <div>
                <CardTitle>Resumen por Vendedor</CardTitle>
                <CardDescription>Seleccione un vendedor para ver y liquidar sus comisiones individuales.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold">Vendedor</TableHead>
                      <TableHead className="font-bold text-center">Ventas</TableHead>
                      <TableHead className="font-bold text-right">Comisión Total</TableHead>
                      <TableHead className="font-bold text-right">Monto Pendiente</TableHead>
                      <TableHead className="text-right font-bold h-[50px] pr-8">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isFilterComplete ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center bg-slate-50/50">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Calendar className="h-10 w-10 text-slate-300" />
                            <div className="text-slate-500">
                              <p className="font-semibold text-base">Seleccione un periodo</p>
                              <p className="text-sm">Debe elegir el Mes y el Año en los filtros superiores.</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Analizando datos del periodo...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : resumen.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">No se encontraron ventas para ningún vendedor en este periodo.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      resumen.map((vendedor) => (
                        <TableRow key={vendedor.vendedor_id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="py-4">
                            <span className="font-semibold text-slate-900">{vendedor.vendedor_nombre}</span>
                            {vendedor.cantidad_pendientes > 0 && (
                              <Badge variant="outline" className="ml-2 border-orange-200 bg-orange-50 text-orange-700 text-[10px]">
                                {vendedor.cantidad_pendientes} Pendientes
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {vendedor.cantidad_ventas}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(vendedor.total_comisiones)}
                          </TableCell>
                          <TableCell className="text-right">
                            {vendedor.monto_pendiente > 0 ? (
                              <span className="text-orange-600 font-bold">{formatCurrency(vendedor.monto_pendiente)}</span>
                            ) : (
                              <span className="text-emerald-600 font-medium text-sm">Al día</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8"
                              onClick={() => router.push(`/planillas/${vendedor.vendedor_id}?mes=${mes}&anio=${anio}`)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Ver Historial
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
