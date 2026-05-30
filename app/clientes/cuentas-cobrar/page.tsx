"use client"

import React, { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ArrowLeft, Info, ReceiptText, RefreshCw, Printer } from "lucide-react"
import { toast } from "sonner"

import { ventasService, Venta } from "@/lib/ventas-service"
import { cuentasCobrarService, Cuota, BitacoraCambio, Pago } from "@/lib/cuentas-cobrar-service"
import { lotificacionService, Lotificacion } from "@/lib/lotificacion-service"
import { apiInstance } from "@/lib/api"

type ViewMode = 'clients' | 'purchases' | 'details';

export default function CuentasPorCobrarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('clients')
  const [ventas, setVentas] = useState<Venta[]>([]) // Todas las ventas de la lotificación para agrupar
  const [loadingVentas, setLoadingVentas] = useState(false)
  const [search, setSearch] = useState('')
  
  const [lotificaciones, setLotificaciones] = useState<Lotificacion[]>([])
  const [selectedLotificacionId, setSelectedLotificacionId] = useState<string>('')
  const [loadingLotificaciones, setLoadingLotificaciones] = useState(true)

  const [selectedClient, setSelectedClient] = useState<{ id: number, nombre: string } | null>(null)
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  const [ventasPage, setVentasPage] = useState(1)
  const [ventasTotal, setVentasTotal] = useState(0)

  const [cuotasPage, setCuotasPage] = useState(1)
  const [cuotasTotal, setCuotasTotal] = useState(0)
  const [cuotasAnio, setCuotasAnio] = useState('all')
  const [cuotasMes, setCuotasMes] = useState('all')

  const years = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - 1 + i).toString())
  const months = [
    { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' }, { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' }, { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
  ]
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Cuota | null>(null)
  const [montoMora, setMontoMora] = useState<number>(0)
  const [incluirMora, setIncluirMora] = useState(false)
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Depósito'>('Efectivo')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchLotificaciones = useCallback(async () => {
    try {
      setLoadingLotificaciones(true)
      const data = await lotificacionService.getLotificaciones()
      setLotificaciones(data)
      if (data.length > 0) {
        setSelectedLotificacionId(data[0].id.toString())
      }
    } catch (error) {
      toast.error('Error al cargar lotificaciones')
    } finally {
      setLoadingLotificaciones(false)
    }
  }, [])

  const fetchVentas = useCallback(async () => {
    if (!selectedLotificacionId) return
    
    try {
      setLoadingVentas(true)
      const res = await ventasService.getHistorialVentas({ 
        all: true,
        page: ventasPage,
        estado: 'ACTIVAS', 
        search,
        lotificacion: selectedLotificacionId
      })
      setVentas(res.results)
      setVentasTotal(res.count)
    } catch (error) {
      toast.error('Error al cargar clientes')
    } finally {
      setLoadingVentas(false)
    }
  }, [search, selectedLotificacionId, ventasPage])

  useEffect(() => {
    setVentasPage(1)
  }, [search, selectedLotificacionId])

  useEffect(() => {
    fetchLotificaciones()
  }, [fetchLotificaciones])

  useEffect(() => {
    fetchVentas()
  }, [fetchVentas])

  const loadCuotas = async () => {
    if (!selectedVenta) return
    try {
      const res = await cuentasCobrarService.getCuotasByVenta(selectedVenta.id, { 
        page: cuotasPage, 
        anio: cuotasAnio, 
        mes: cuotasMes 
      })
      setCuotas(res.results)
      setCuotasTotal(res.count)
    } catch (error) {
      toast.error('Error al cargar cuotas')
    }
  }

  const loadVentaDetails = async (venta: Venta) => {
    setSelectedVenta(venta)
    setViewMode('details')
    setCuotasPage(1)
    setCuotasAnio('all')
    setCuotasMes('all')
  }

  useEffect(() => {
    if (viewMode === 'details' && selectedVenta) {
      loadCuotas()
    }
  }, [viewMode, selectedVenta, cuotasPage, cuotasAnio, cuotasMes])

  const handleSelectClient = (client: { id: number, nombre: string }) => {
    setSelectedClient(client)
    setViewMode('purchases')
  }

  const handleVolver = () => {
    if (viewMode === 'details') {
      setViewMode('purchases')
      setSelectedVenta(null)
    } else if (viewMode === 'purchases') {
      setViewMode('clients')
      setSelectedClient(null)
    }
  }

  // Clientes únicos basados en las ventas cargadas
  const getUniqueClients = () => {
    const clientsMap = new Map<number, string>()
    ventas.forEach(v => {
      if (!clientsMap.has(v.cliente)) {
        clientsMap.set(v.cliente, v.cliente_nombre)
      }
    })
    
    return Array.from(clientsMap.entries()).map(([id, nombre]) => ({ id, nombre }))
  }

  // Ventas del cliente seleccionado
  const getClientVentas = () => {
    if (!selectedClient) return []
    return ventas.filter(v => v.cliente === selectedClient.id)
  }

  const handleOpenPayment = (cuota: Cuota) => {
    setSelectedInstallment(cuota)
    setMontoMora(0)
    setMetodoPago('Efectivo')
    setIncluirMora(false)
    setIsPaymentModalOpen(true)
  }

  const getClientStats = () => {
    const clientVentas = getClientVentas()
    const totalVentas = clientVentas.length
    const totalValor = clientVentas.reduce((sum, v) => sum + Number(v.valor_lote), 0)
    const financedVentas = clientVentas.filter(v => v.tipo_pago === 'FINANCIADO')
    const totalDeuda = financedVentas.reduce((sum, v) => sum + Number(v.monto_financiar), 0)
    
    return { totalVentas, totalValor, totalDeuda, financedCount: financedVentas.length }
  }

  const handlePrintRecibo = async (cuotaId: number) => {
    try {
      // Usamos apiInstance para que incluya automáticamente el token y el prefijo /api
      const response = await apiInstance.get(`/cuentas-cobrar/cuotas/${cuotaId}/recibo/`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.click()
      
      toast.success('Recibo generado correctamente')
    } catch (error: any) {
      console.error('Error al imprimir recibo:', error)
      toast.error('No se pudo generar el recibo. Verifique que el pago esté registrado.')
    }
  }

  const getVentaSummaryStats = () => {
    if (!cuotas.length) return null
    const pagadas = cuotas.filter(c => c.estado === 'Pagado').length
    const pendientes = cuotas.filter(c => c.estado === 'Pendiente').length
    const vencidas = cuotas.filter(c => c.estado === 'Vencido' || (c.fecha_programada < new Date().toISOString().split('T')[0] && c.estado === 'Pendiente')).length
    
    return { pagadas, pendientes, vencidas, total: cuotas.length }
  }

  const handleSugerirMora = () => {
    if (selectedInstallment && selectedInstallment.mora_sugerida) {
      setMontoMora(Number(selectedInstallment.mora_sugerida))
    }
  }

  const handleSubmitPago = async () => {
    if (!selectedInstallment) return

    setIsSubmitting(true)
    try {
      const pagoData: Pago = {
        cuota: selectedInstallment.id,
        monto_base: selectedInstallment.monto_cuota,
        monto_mora: (incluirMora && selectedInstallment.estado === 'Vencido') ? montoMora.toString() : "0",
        metodo_pago: metodoPago,
      }
      await cuentasCobrarService.registrarPago(pagoData)
      toast.success('Pago registrado exitosamente')
      setIsPaymentModalOpen(false)
      if (selectedVenta) {
        loadVentaDetails(selectedVenta) // Recargar datos
      }
    } catch (error) {
      toast.error('Error al registrar pago')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getBadgeForInstallmentStatus = (estado: string) => {
    switch (estado) {
      case "Vencido": return <Badge variant="destructive">Vencido</Badge>
      case "Pendiente": return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendiente</Badge>
      case "Pagado": return <Badge variant="secondary" className="bg-green-100 text-green-800 border-transparent">Pagado</Badge>
      case "Revertido": return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-transparent">Revertido</Badge>
      default: return <Badge>{estado}</Badge>
    }
  }

  const calculateTotalAmount = () => {
    if (!selectedInstallment) return 0;
    return Number(selectedInstallment.monto_cuota) + montoMora;
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Cuentas por Cobrar</h1>
              <p className="text-muted-foreground mt-2">Gestiona clientes, lotes, cuotas y pagos asociados</p>
            </div>
          </div>

          {/* 1. SELECCIÓN DE CLIENTE */}
          {viewMode === 'clients' && (
            <Card>
              <CardHeader>
                <CardTitle>Selección de Cliente</CardTitle>
                <CardDescription>
                  Listado de clientes con compras registradas en la lotificación seleccionada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 max-w-md">
                    <Label htmlFor="search" className="mb-2 block">Buscar Cliente</Label>
                    <Input 
                      id="search"
                      placeholder="Nombre del cliente..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-[250px]">
                    <Label htmlFor="lotificacion" className="mb-2 block">Lotificación</Label>
                    <Select 
                      value={selectedLotificacionId} 
                      onValueChange={setSelectedLotificacionId}
                      disabled={loadingLotificaciones}
                    >
                      <SelectTrigger id="lotificacion">
                        <SelectValue placeholder={loadingLotificaciones ? "Cargando..." : "Seleccione lotificación"} />
                      </SelectTrigger>
                      <SelectContent>
                        {lotificaciones.map((lot) => (
                          <SelectItem key={lot.id} value={lot.id.toString()}>
                            {lot.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Nombre del Cliente</TableHead>
                        <TableHead className="text-center">Total Compras</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingVentas ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                            Cargando clientes...
                          </TableCell>
                        </TableRow>
                      ) : getUniqueClients().map((client) => (
                        <TableRow key={client.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-semibold text-lg py-4">{client.nombre}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-blue-50">
                              {ventas.filter(v => v.cliente === client.id).length} registro(s)
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button onClick={() => handleSelectClient(client)}>
                              Ver Compras
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loadingVentas && getUniqueClients().length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic">
                            No se encontraron clientes para esta lotificación
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  
                  {ventasTotal > 10 && (
                    <div className="bg-slate-50 px-4 py-3 border-t flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Mostrando clientes de la página {ventasPage} ({ventasTotal} ventas totales)
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={ventasPage === 1}
                          onClick={() => setVentasPage(prev => prev - 1)}
                        >
                          Anterior
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={ventasPage * 10 >= ventasTotal}
                          onClick={() => setVentasPage(prev => prev + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2. HISTORIAL DE COMPRAS DEL CLIENTE */}
          {viewMode === 'purchases' && selectedClient && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={handleVolver}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">Compras de {selectedClient.nombre}</h2>
                    <p className="text-sm text-muted-foreground">Listado de lotes adquiridos en {lotificaciones.find(l => l.id.toString() === selectedLotificacionId)?.nombre}</p>
                  </div>
                </div>
                
                {/* Resumen rápido del cliente */}
                <Card className="bg-slate-50/50 border-dashed border-slate-300">
                  <CardContent className="py-3 px-4 flex gap-6">
                    <div className="text-center border-r pr-6">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Total Lotes</p>
                      <p className="text-xl font-bold">{getClientStats().totalVentas}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Valor Acumulado</p>
                      <p className="text-xl font-bold text-primary">Q {getClientStats().totalValor.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getClientVentas().map((venta) => (
                  <Card key={venta.id} className="overflow-hidden hover:shadow-lg transition-all group border-slate-200">
                    <CardHeader className="border-b bg-slate-50/30">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">Lote {venta.lote_numero}</CardTitle>
                        <Badge variant={venta.tipo_pago === 'FINANCIADO' ? 'default' : 'secondary'}>
                          {venta.tipo_pago}
                        </Badge>
                      </div>
                      <CardDescription>Manzana {venta.lote_manzana}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor Final:</span>
                        <span className="font-bold text-lg">
                          Q {Number(venta.valor_lote).toFixed(2)}
                        </span>
                      </div>
                      
                      {venta.tipo_pago === 'FINANCIADO' && (
                        <div className="space-y-2 border-t pt-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Enganche + Costo de Instalacion:</span>
                            <span className="font-medium text-slate-700">Q {Number(venta.enganche).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monto Financiado:</span>
                            <span className="font-bold text-indigo-600">Q {Number(venta.monto_financiar).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Plazo:</span>
                            <span className="font-medium">{venta.plazo_meses} meses</span>
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full mt-4 group-hover:translate-y-[-2px] transition-transform shadow-sm" 
                        variant={venta.tipo_pago === 'FINANCIADO' ? 'default' : 'outline'}
                        onClick={() => loadVentaDetails(venta)}
                      >
                        {venta.tipo_pago === 'FINANCIADO' ? 'Ver Estado de Pagos' : 'Ver Detalles de Compra'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 3. DETALLE DE LA VENTA / ESTADO DE PAGOS */}
          {viewMode === 'details' && selectedVenta && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={handleVolver} title="Regresar">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedVenta.tipo_pago === 'FINANCIADO' ? 'Estado de Pagos' : 'Resumen de Compra'} 
                      - Lote {selectedVenta.lote_numero}
                    </h2>
                    <p className="text-sm text-muted-foreground">Cliente: {selectedVenta.cliente_nombre}</p>
                  </div>
                </div>

                {selectedVenta.tipo_pago === 'FINANCIADO' && getVentaSummaryStats() && (
                  <div className="flex gap-4">
                    <div className="bg-green-50 px-3 py-1 rounded-full border border-green-200 text-xs font-bold text-green-700">
                      {getVentaSummaryStats()?.pagadas} Pagadas
                    </div>
                    <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-200 text-xs font-bold text-blue-700">
                      {getVentaSummaryStats()?.pendientes} Pendientes
                    </div>
                    {getVentaSummaryStats()?.vencidas! > 0 && (
                      <div className="bg-red-50 px-3 py-1 rounded-full border border-red-200 text-xs font-bold text-red-700 animate-pulse">
                        {getVentaSummaryStats()?.vencidas} Vencidas
                      </div>
                    )}
                  </div>
                )}
              </div>

              {loadingDetails ? (
                 <div className="text-center py-12 text-muted-foreground">Cargando detalles...</div>
              ) : selectedVenta.tipo_pago === 'CONTADO' ? (
                <div className="bg-emerald-50 p-8 rounded-lg border border-emerald-200 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Badge className="bg-emerald-600 h-10 w-10 flex items-center justify-center p-0 text-white rounded-full">✓</Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-800">Compra al Contado Finalizada</h3>
                    <p className="text-emerald-700">Este lote fue adquirido mediante un pago único y no posee cuotas pendientes.</p>
                  </div>
                  <div className="grid grid-cols-2 max-w-sm mx-auto text-sm gap-y-2 pt-4 border-t">
                    <span className="text-emerald-600 text-left font-medium">Fecha de Venta:</span>
                    <span className="text-emerald-800 text-right font-bold">{new Date(selectedVenta.fecha_creacion).toLocaleDateString()}</span>
                    
                    <span className="text-emerald-600 text-left font-medium">Precio Lote:</span>
                    <span className="text-emerald-800 text-right font-bold">Q {Number(selectedVenta.valor_lote).toFixed(2)}</span>
                    
                    
                    
                    <span className="text-emerald-600 text-left font-medium text-base pt-2">Total Pagado:</span>
                    <span className="text-emerald-800 text-right font-bold text-xl pt-2">
                      Q {Number(selectedVenta.valor_lote).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Valor Total</p>
                        <p className="text-xl font-bold">Q {Number(selectedVenta.valor_lote).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Enganche + Costo de Instalacion</p>
                        <p className="text-xl font-bold text-emerald-600">Q {Number(selectedVenta.enganche).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Monto Financiado</p>
                        <p className="text-xl font-bold text-indigo-600">Q {Number(selectedVenta.monto_financiar).toFixed(2)}</p>
                        <p className="text-[10px] text-indigo-500 font-medium">{selectedVenta.plazo_meses} meses al {selectedVenta.tasa_interes_anual}%</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Progreso de Financia</p>
                        <p className="text-xl font-bold text-green-600">Q {Number(selectedVenta.total_pagado_calculado || 0).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="bg-slate-100 px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <ReceiptText className="w-4 h-4" />
                        Listado de Cuotas
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select value={cuotasAnio} onValueChange={(val) => { setCuotasAnio(val); setCuotasPage(1); }}>
                          <SelectTrigger className="w-[100px] h-8 text-xs bg-white">
                            <SelectValue placeholder="Año" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Año: Todos</SelectItem>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        
                        <Select value={cuotasMes} onValueChange={(val) => { setCuotasMes(val); setCuotasPage(1); }}>
                          <SelectTrigger className="w-[100px] h-8 text-xs bg-white">
                            <SelectValue placeholder="Mes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Mes: Todos</SelectItem>
                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">No. Cuota</TableHead>
                          <TableHead>Fecha Prog.</TableHead>
                          <TableHead>Monto Cuota</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cuotas.map((cuota) => {
                          const isPayable = ['Pendiente', 'Vencido'].includes(cuota.estado);
                          return (
                            <TableRow key={cuota.id}>
                              <TableCell className="font-medium text-center">{cuota.no_cuota}</TableCell>
                              <TableCell>
                                <span className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {cuota.fecha_programada}
                                </span>
                              </TableCell>
                              <TableCell>Q {Number(cuota.monto_cuota).toFixed(2)}</TableCell>
                              <TableCell>{getBadgeForInstallmentStatus(cuota.estado)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {isPayable ? (
                                    <Button size="sm" onClick={() => handleOpenPayment(cuota)}>Registrar Pago</Button>
                                  ) : (
                                    <>
                                      {cuota.estado === 'Pagado' && (
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                          onClick={() => handlePrintRecibo(cuota.id)}
                                          title="Imprimir Recibo"
                                        >
                                          <Printer className="h-4 w-4 mr-1" />
                                          Recibo
                                        </Button>
                                      )}
                                      <span className="text-sm text-muted-foreground italic flex items-center">{cuota.estado}</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {cuotas.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                              No se encontraron cuotas con los filtros seleccionados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination for Cuotas */}
                    {cuotasTotal > 10 && (
                      <div className="bg-slate-50 px-4 py-3 border-t flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Mostrando {cuotas.length} de {cuotasTotal} cuotas
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={cuotasPage === 1}
                            onClick={() => setCuotasPage(prev => prev - 1)}
                          >
                            Anterior
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={cuotasPage * 10 >= cuotasTotal}
                            onClick={() => setCuotasPage(prev => prev + 1)}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                </>
              )}
            </div>
          )}

          {/* Payment Modal */}
          <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Pago</DialogTitle>
                <DialogDescription>
                  {selectedInstallment && (
                    <>
                      Pago para la <strong>Cuota #{selectedInstallment.no_cuota}</strong>. <br/>
                      Vencimiento: {selectedInstallment.fecha_programada}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              {selectedInstallment && (
                <div className="grid gap-4 py-4">
                  
                  {selectedInstallment.estado === 'Vencido' && (
                    <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 border border-red-200">
                      <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="w-full">
                        <p className="text-sm font-semibold text-red-700">Cuota Vencida ({selectedInstallment.dias_atraso} días)</p>
                        <div className="flex items-center justify-between mt-2">
                           <p className="text-xs text-red-600">Mora sugerida: Q {Number(selectedInstallment.mora_sugerida).toFixed(2)}</p>
                           <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleSugerirMora}>
                             Aplicar Sugerencia
                           </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">Monto Base</Label>
                    <div className="col-span-3 px-3 py-2 bg-slate-100 rounded-md font-semibold font-mono">
                      Q {Number(selectedInstallment.monto_cuota).toFixed(2)}
                    </div>
                  </div>

                  {selectedInstallment.estado === 'Vencido' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="col-span-1 flex justify-end">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="incluirMora" 
                            checked={incluirMora}
                            onChange={(e) => setIncluirMora(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="incluirMora" className="font-medium">Mora (Q)</Label>
                        </div>
                      </div>
                      <Input 
                        id="mora" 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={montoMora} 
                        onChange={(e) => setMontoMora(Number(e.target.value) || 0)}
                        disabled={!incluirMora}
                        className="col-span-3 border-slate-300 focus:border-primary" 
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4 border-t pt-4">
                    <Label className="text-right font-bold text-lg">Total</Label>
                    <div className="col-span-3 text-2xl font-bold text-green-600">
                      Q {((Number(selectedInstallment.monto_cuota) || 0) + (incluirMora && selectedInstallment.estado === 'Vencido' ? montoMora : 0)).toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4 mt-2">
                    <Label htmlFor="metodo" className="text-right font-medium">Método</Label>
                    <Select value={metodoPago} onValueChange={(val: any) => setMetodoPago(val)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccione método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                        <SelectItem value="Depósito">Depósito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
                <Button type="button" disabled={isSubmitting} onClick={handleSubmitPago}>
                  {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
