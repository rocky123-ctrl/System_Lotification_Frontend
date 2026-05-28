"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Loader2, MapPin, Building2, ShoppingCart, PlusCircle, History, Filter, FileText, TrendingUp, DollarSign } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePagination } from "@/hooks/use-pagination"
import { lotesService, type Lote } from "@/lib/lotes-service"
import { lotificacionService, type Lotificacion } from "@/lib/lotificacion-service"
import { getClientes, registrarCliente, type Cliente } from "@/lib/clientes-service"
import { ventasService, type RegistrarVentaPayload, type CalculoVentaResponse, type Venta, type ResumenVentas } from "@/lib/ventas-service"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { ViewOnlyPlano } from "@/components/ViewOnlyPlano"
import { Map, CheckSquare } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface LoteDisplay {
  id: number
  manzana: string
  numero_lote: string
  metros_cuadrados: number
  valor_total: number
  costo_instalacion?: number
  plano_svg_id?: string
  identificador?: string
  lotificacion_id?: number
  uso_lote: 'residencial' | 'comercial_y_bodega'
  estado_disponibilidad: 'disponible' | 'reservado' | 'financiado' | 'pagado' | 'escriturado'
}

export function Ventas() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLotificacion, setSelectedLotificacion] = useState<number | null>(null)
  const [lotificaciones, setLotificaciones] = useState<Lotificacion[]>([])
  const [lotes, setLotes] = useState<LoteDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLotes, setIsLoadingLotes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVenderModalOpen, setIsVenderModalOpen] = useState(false)
  const [selectedLote, setSelectedLote] = useState<LoteDisplay | null>(null)

  // -- Server Pagination State --
  const [currentPageLotes, setCurrentPageLotes] = useState(1)
  const [totalItemsLotes, setTotalItemsLotes] = useState(0)
  const itemsPerPageServer = 8 // Sincronizado con backend

  const [currentPageHistory, setCurrentPageHistory] = useState(1)
  const [totalItemsHistory, setTotalItemsHistory] = useState(0)

  // -- Modal Client & Payment State (DEPRECATED - Moved to VentaForm) --
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selectedClienteId, setSelectedClienteId] = useState<string>("")
  const [isCreatingCliente, setIsCreatingCliente] = useState(false)
  const [newCliente, setNewCliente] = useState({ nombres: '', apellidos: '', dpi: '', nit: '', direccion: '', telefono: '', email: '' })
  const [isSubmittingCliente, setIsSubmittingCliente] = useState(false)
  
  const [tipoPago, setTipoPago] = useState<'contado' | 'financiado'>('contado')
  const [enganche, setEnganche] = useState<number>(0)
  const [descuento, setDescuento] = useState<number>(0)
  const [plazoMeses, setPlazoMeses] = useState<number>(12)
  const [tasaInteres, setTasaInteres] = useState<number>(12)
  const [incluirInstalacion, setIncluirInstalacion] = useState(false)
  const [isSubmittingVenta, setIsSubmittingVenta] = useState(false)
  const [calculoBackend, setCalculoBackend] = useState<CalculoVentaResponse | null>(null)
  const [isLoadingCalculo, setIsLoadingCalculo] = useState(false)
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("venta")
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [ventasHistory, setVentasHistory] = useState<Venta[]>([])
  const [resumenVentas, setResumenVentas] = useState<ResumenVentas | null>(null)

  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [debouncedHistorySearchTerm, setDebouncedHistorySearchTerm] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHistorySearchTerm(historySearchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [historySearchTerm])
  const [historyFilters, setHistoryFilters] = useState({
    anio: new Date().getFullYear().toString(),
    mes: (new Date().getMonth() + 1).toString(),
    lotificacion: selectedLotificacion?.toString() || "",
    estado: "ACTIVAS"
  })
  // ------------------------------------

  // Cargar lotificaciones al inicio
  useEffect(() => {
    const cargarLotificaciones = async () => {
      try {
        setIsLoading(true)
        const data = await lotificacionService.getLotificaciones()
        setLotificaciones(data)
        // Seleccionar la primera lotificación activa por defecto
        const activa = data.find(l => l.activo) || data[0]
        if (activa) {
          setSelectedLotificacion(activa.id)
        }
      } catch (err: any) {
        console.error('[Ventas] Error cargando lotificaciones:', err)
        setError('Error al cargar las lotificaciones')
      } finally {
        setIsLoading(false)
      }
    }

    cargarLotificaciones()
  }, [])

  const loadLotesParaVenta = useCallback(async (page: number = 1) => {
    if (!selectedLotificacion) return
    try {
      setIsLoadingLotes(true)
      setError(null)
      const resp = await lotesService.getLotes({ 
        lotificacion: selectedLotificacion,
        page: page,
        solo_disponibles: true
      })
      
      const todosLotes: LoteDisplay[] = resp.results.map(l => ({ 
        id: l.id, 
        manzana: l.manzana_nombre || `Manzana ${l.manzana}`, 
        numero_lote: l.numero_lote, 
        metros_cuadrados: parseFloat(l.metros_cuadrados), 
        valor_total: parseFloat(l.valor_total), 
        costo_instalacion: parseFloat(l.costo_instalacion || '0'),
        plano_svg_id: l.plano_svg_id,
        identificador: l.identificador,
        lotificacion_id: l.lotificacion_id,
        uso_lote: l.uso_lote,
        estado_disponibilidad: l.estado_disponibilidad
      }))

      setLotes(todosLotes)
      setTotalItemsLotes(resp.count)
      setCurrentPageLotes(page)
    } catch (err: any) {
      console.error('[Ventas] Error cargando lotes:', err)
      setError('Error al cargar los lotes para venta')
    } finally {
      setIsLoadingLotes(false)
    }
  }, [selectedLotificacion])

  useEffect(() => {
    loadLotesParaVenta(1)
    // Sincronizar filtro de historial con la lotificación seleccionada
    setHistoryFilters(prev => ({ ...prev, lotificacion: selectedLotificacion?.toString() || "" }))
  }, [loadLotesParaVenta, selectedLotificacion])

  // Filtrar lotes por término de búsqueda (Local para resultados de la página actual)
  const filteredLotes = lotes.filter((lote) => {
    const matchesSearch =
      lote.manzana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.numero_lote.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Cálculos para paginación de servidor
  const totalPagesLotes = Math.ceil(totalItemsLotes / itemsPerPageServer)
  const startIndexLotes = (currentPageLotes - 1) * itemsPerPageServer + 1
  const endIndexLotes = Math.min(currentPageLotes * itemsPerPageServer, totalItemsLotes)

  const getEstadoBadge = (lote: LoteDisplay) => {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className="capitalize">
          {lote.uso_lote.replace(/_/g, ' ')}
        </Badge>
        {lote.estado_disponibilidad === 'disponible' ? (
          <Badge variant="default" className="bg-green-500 text-white border-none">Disponible</Badge>
        ) : lote.estado_disponibilidad === 'financiado' ? (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">Financiado</Badge>
        ) : lote.estado_disponibilidad === 'pagado' ? (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">Pagado</Badge>
        ) : (
          <Badge variant="secondary">{lote.estado_disponibilidad}</Badge>
        )}
      </div>
    )
  }

  const handleOpenVender = (lote: LoteDisplay) => {
    router.push(`/venta/registrar/${lote.id}`)
  }

  const handleCreateCliente = async () => {
    if (!newCliente.nombres || !newCliente.apellidos || !newCliente.dpi || !newCliente.nit || !newCliente.direccion) {
      alert("Nombres, Apellidos, DPI, NIT y Dirección son obligatorios.")
      return
    }
    setIsSubmittingCliente(true)
    try {
      const created = await registrarCliente({
        ...newCliente,
        estado: 'activo'
      })
      setClientes(prev => [created, ...prev])
      setSelectedClienteId(String(created.id))
      setIsCreatingCliente(false)
      setNewCliente({ nombres: '', apellidos: '', dpi: '', nit: '', direccion: '', telefono: '', email: '' })
    } catch (err: any) {
      alert("Error al registrar cliente: " + (err.message || "Desconocido"))
    } finally {
      setIsSubmittingCliente(false)
    }
  }

  // Actualizar cálculo del backend cuando cambian los inputs
  useEffect(() => {
    const fetchCalculo = async () => {
      if (!selectedLote || !isVenderModalOpen) return
      
      try {
        setIsLoadingCalculo(true)
        const valorBase = selectedLote.valor_total
        const costoInstalacion = selectedLote.costo_instalacion || 0
        const valorAEnviar = incluirInstalacion ? valorBase : (valorBase - costoInstalacion)

        const res = await ventasService.calcularVenta({
          valor_lote: valorAEnviar,
          enganche,
          descuento,
          tipo_pago: tipoPago,
          plazo_meses: plazoMeses,
          tasa_interes: tasaInteres
        })
        setCalculoBackend(res)
      } catch (err) {
        console.error("Error fetching calculation:", err)
      } finally {
        setIsLoadingCalculo(false)
      }
    }

    const timer = setTimeout(fetchCalculo, 500)
    return () => clearTimeout(timer)
  }, [selectedLote, enganche, descuento, tipoPago, plazoMeses, tasaInteres, isVenderModalOpen, incluirInstalacion])

  const handleVenderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClienteId || !selectedLote) {
      alert("Por favor seleccione un cliente para la venta.")
      return
    }
    
    setIsSubmittingVenta(true)
    try {
      const payload: RegistrarVentaPayload = {
        cliente: parseInt(selectedClienteId),
        lote: selectedLote.id,
        valor_lote: selectedLote.valor_total,
        enganche,
        descuento,
        tipo_pago: (tipoPago.toUpperCase() as 'CONTADO' | 'FINANCIADO'),
        plazo_meses: tipoPago === 'contado' ? 0 : plazoMeses,
        tasa_interes_anual: tasaInteres,
        incluir_costo_instalacion: incluirInstalacion
      }

      await ventasService.registrarVenta(payload)
      
      toast.success(`¡Venta Exitosa! Lote: ${selectedLote.numero_lote}`)
      setIsVenderModalOpen(false)
      setSelectedLote(null)
      loadLotesParaVenta() 
    } catch (err: any) {
      console.error("Error al registrar venta:", err)
      const errorMsg = err.response?.data?.error || err.message || "Error desconocido al procesar la venta"
      alert(`Error en la venta: ${errorMsg}`)
    } finally {
      setIsSubmittingVenta(false)
    }
  }

  const isSuperadmin = user?.role === 'Superadmin' || user?.role === 'Administrador' || user?.isSuperuser

  // Effect para cargar historial
  const loadHistory = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingHistory(true)
      const data = await ventasService.getHistorialVentas({
        ...historyFilters,
        search: debouncedHistorySearchTerm,
        all: activeTab === "gestion",
        page: page
      })
      setVentasHistory(data.results)
      setTotalItemsHistory(data.count)
      setCurrentPageHistory(page)

      const resumen = await ventasService.getResumenVentas({
        ...historyFilters,
        search: debouncedHistorySearchTerm,
        all: activeTab === "gestion"
      })
      setResumenVentas(resumen)
    } catch (err) {
      console.error("Error loading history:", err)
      toast.error("Error al cargar el historial de ventas")
    } finally {
      setIsLoadingHistory(false)
    }
  }, [historyFilters, debouncedHistorySearchTerm, activeTab])

  useEffect(() => {
    if (activeTab === "historial" || activeTab === "gestion") {
      loadHistory(1)
    }
  }, [activeTab, loadHistory, historyFilters.estado])

  const handleEliminarVenta = async (id: number) => {
    if (!confirm("¿Deseas cancelar esta venta? Esta acción borrará por completo los registros de cuentas por cobrar y servicios asociados a la venta, y el lote volverá a estar disponible.")) return
    
    try {
      await ventasService.eliminarVenta(id)
      toast.success("Venta cancelada exitosamente")
      loadHistory()
      loadLotesParaVenta()
    } catch (err: any) {
      toast.error("Error al cancelar la venta: " + (err.message || "Servidor no respondió"))
    }
  }

  const handleRestaurarVenta = async (id: number) => {
    try {
      await ventasService.restaurarVenta(id)
      toast.success("Venta restaurada exitosamente")
      loadHistory()
      loadLotesParaVenta()
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Error al restaurar"
      toast.error("No se pudo restaurar: " + errorMsg)
    }
  }

  const handleEliminarPermanenteVenta = async (id: number) => {
    if (!confirm("¿ESTÁS COMPLETAMENTE SEGURO? Esta acción eliminará el registro de la venta permanentemente de la base de datos y no se podrá recuperar.")) return
    
    try {
      await ventasService.eliminarPermanenteVenta(id)
      toast.success("Registro eliminado permanentemente")
      loadHistory()
    } catch (err: any) {
      toast.error("Error al eliminar permanentemente: " + (err.message || "Servidor no respondió"))
    }
  }

  const handleEscriturarVenta = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas escriturar este lote? Esto marcará el lote como ESCRITURADO y no se podrá revertir fácilmente.")) return
    
    try {
      await ventasService.escriturarVenta(id)
      toast.success("Lote escriturado exitosamente")
      loadHistory()
      loadLotesParaVenta()
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Error al escriturar"
      toast.error("No se pudo escriturar: " + errorMsg)
    }
  }

  const renderHistorialContent = (isGlobal: boolean) => {
    const totalPagesHistory = Math.ceil(totalItemsHistory / itemsPerPageServer)
    const startIndexHistory = (currentPageHistory - 1) * itemsPerPageServer + 1
    const endIndexHistory = Math.min(currentPageHistory * itemsPerPageServer, totalItemsHistory)

    return (
    <>
      <div className={`grid grid-cols-1 ${isGlobal ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-white/20 rounded-full">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-100 opacity-90">Ventas Totales</p>
              <h3 className="text-2xl font-bold">Q {resumenVentas?.total_ventas.toLocaleString('es-GT', { minimumFractionDigits: 2 }) || '0.00'}</h3>
            </div>
          </CardContent>
        </Card>

        {!isGlobal && (
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-white/20 rounded-full">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-100 opacity-90">Total Comisiones</p>
                <h3 className="text-2xl font-bold">Q {resumenVentas?.total_comisiones.toLocaleString('es-GT', { minimumFractionDigits: 2 }) || '0.00'}</h3>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-white/20 rounded-full">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-100 opacity-90">Lotes Vendidos</p>
              <h3 className="text-2xl font-bold">{resumenVentas?.conteo || 0} lotes</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{isGlobal ? "Gestión Global de Ventas" : "Listado de Ventas"}</CardTitle>
              <CardDescription>{isGlobal ? "Control total sobre todas las ventas del sistema." : "Auditoría de lotes vendidos por el usuario activo."}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-[120px]">
                <Select value={historyFilters.anio} onValueChange={(v) => setHistoryFilters(prev => ({ ...prev, anio: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo</SelectItem>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Select value={historyFilters.mes} onValueChange={(v) => setHistoryFilters(prev => ({ ...prev, mes: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo</SelectItem>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Select value={historyFilters.estado} onValueChange={(v) => setHistoryFilters(prev => ({ ...prev, estado: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVAS">Activas (Comp. y Gen.)</SelectItem>
                    <SelectItem value="GENERADA">Generada</SelectItem>
                    <SelectItem value="COMPLETADA">Completada</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cliente o lote..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="pl-8 w-full md:w-[200px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ventasHistory.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed">
              <History className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">No se encontraron registros de ventas en este periodo.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold text-center">Estado</TableHead>
                      <TableHead className="font-semibold text-center">Tipo de Pago</TableHead>
                      <TableHead className="font-semibold">Vendedor</TableHead>
                      <TableHead className="font-semibold text-center">Lote / Manzana</TableHead>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold text-right">Valor Venta</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(ventasHistory) && ventasHistory.map((v) => (
                    <TableRow key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{v.cliente_nombre}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={`rounded-full px-3 font-semibold ${
                            v.estado === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            v.estado === 'GENERADA' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {v.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={v.tipo_pago === 'CONTADO' ? 'default' : 'secondary'} className="rounded-full px-3">
                          {v.tipo_pago}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{isGlobal ? v.vendedor_nombre : "Yo"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col">
                          <span className="font-semibold">Lote {v.lote_numero}</span>
                          <span className="text-xs text-muted-foreground">{v.lote_manzana}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(v.fecha_creacion).toLocaleDateString('es-GT', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-800 text-xs">
                        Q {parseFloat(v.valor_lote).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {v.estado !== 'CANCELADA' ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => router.push(`/venta/editar/${v.id}`)}
                                className="text-primary hover:text-primary hover:bg-primary/10 h-8 px-2"
                              >
                                Editar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEliminarVenta(v.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                              >
                                Cancelar
                              </Button>
                              {v.estado === 'COMPLETADA' && v.lote_estado_disponibilidad !== 'escriturado' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEscriturarVenta(v.id)}
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50 h-8 px-2"
                                >
                                  Escriturar
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleRestaurarVenta(v.id)}
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8 px-2"
                              >
                                Restaurar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEliminarPermanenteVenta(v.id)}
                                className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                              >
                                Eliminar Registro
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
            {totalItemsHistory > itemsPerPageServer && (
              <div className="mt-4">
                <TablePagination
                  currentPage={currentPageHistory}
                  totalPages={totalPagesHistory}
                  itemsPerPage={itemsPerPageServer}
                  totalItems={totalItemsHistory}
                  startIndex={startIndexHistory}
                  endIndex={endIndexHistory}
                  onPageChange={(p) => loadHistory(p)}
                  onItemsPerPageChange={() => {}} // No permitido cambiar en este modo fijo
                />
              </div>
            )}
          </CardContent>
        </Card>
      </>
    )
  }


  const years = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString())
  const months = [
    { value: "all", label: "Todo el año" },
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]

  const isVendedor = user?.role !== "admin"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando lotificaciones...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ventas y Auditoría</h1>
          <p className="text-muted-foreground">Gestión de ventas, auditoría de lotes y seguimiento de historial.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Proyecto</CardTitle>
          <CardDescription>Escoge el proyecto para operar ventas o auditar el historial.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <Label htmlFor="lotificacion">Lotificación</Label>
              <Select
                value={selectedLotificacion?.toString() || "all"}
                onValueChange={(value) => {
                   if (value === "all") {
                      setSelectedLotificacion(null)
                   } else {
                      setSelectedLotificacion(Number.parseInt(value))
                   }
                }}
              >
                <SelectTrigger id="lotificacion">
                  <SelectValue placeholder="Selecciona una lotificación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ver Todas</SelectItem>
                  {lotificaciones.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{lot.nombre}</span>
                        {!lot.activo && <Badge variant="secondary" className="ml-2">Inactiva</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${isSuperadmin ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
          <TabsTrigger value="venta" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Realizar Ventas
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial Personal
          </TabsTrigger>
          {isSuperadmin && (
            <TabsTrigger value="gestion" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Gestión Global
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="venta" className="space-y-6">

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {selectedLotificacion && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Lotes en el Sistema</CardTitle>
                <CardDescription>
                  Mostrando lotes disponibles, pagados y financiados.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por manzana o número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full md:w-[300px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingLotes ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Cargando lotes...</span>
                </div>
              </div>
            ) : lotes.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No se encontraron lotes con ese criterio de búsqueda' : 'No hay lotes disponibles en este momento'}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manzana</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Tamaño</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[100px] text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLotes.map((lote) => (
                        <TableRow key={lote.id}>
                          <TableCell className="font-medium">{lote.manzana}</TableCell>
                          <TableCell>{lote.numero_lote}</TableCell>
                          <TableCell>{lote.metros_cuadrados.toLocaleString('es-GT')} m²</TableCell>
                          <TableCell className="font-semibold text-primary">Q {lote.valor_total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{getEstadoBadge(lote)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {lote.estado_disponibilidad === 'disponible' && (
                                <Button
                                  type="button"
                                  onClick={() => handleOpenVender(lote)}
                                  variant="default"
                                  size="sm"
                                  className="flex items-center justify-center gap-2 w-full"
                                >
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                  Vender
                                </Button>
                              )}
                              {lote.estado_disponibilidad !== 'disponible' && <span className="text-xs text-muted-foreground italic">No disponible</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalItemsLotes > itemsPerPageServer && (
                  <div className="mt-4">
                    <TablePagination
                      currentPage={currentPageLotes}
                      totalPages={totalPagesLotes}
                      itemsPerPage={itemsPerPageServer}
                      totalItems={totalItemsLotes}
                      startIndex={startIndexLotes}
                      endIndex={endIndexLotes}
                      onPageChange={(p) => loadLotesParaVenta(p)}
                      onItemsPerPageChange={() => {}}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedLotificacion && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Selecciona una lotificación para ver sus lotes registrados.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>

        <TabsContent value="historial" className="space-y-6">
          {renderHistorialContent(false)}
        </TabsContent>

        {isSuperadmin && (
          <TabsContent value="gestion" className="space-y-6">
            {renderHistorialContent(true)}
          </TabsContent>
        )}
      </Tabs>

      {/* Se ha eliminado el Modal "Vender", la lógica fue transferida a /app/venta/registrar y /app/venta/editar */}
    </div>
  )
}
