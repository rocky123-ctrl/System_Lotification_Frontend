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
import { Search, Loader2, MapPin, Building2, ShoppingCart, History, Check, CalendarIcon, FileText, Share, Download, MessageCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

import { lotesService, type Lote } from "@/lib/lotes-service"
import { lotificacionService, type Lotificacion } from "@/lib/lotificacion-service"
import { cotizacionesService, type Cotizacion } from "@/lib/cotizaciones-service"

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

export function Cotizaciones() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("cotizar")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Lotes State
  const [selectedLotificacion, setSelectedLotificacion] = useState<number | null>(null)
  const [lotificaciones, setLotificaciones] = useState<Lotificacion[]>([])
  const [lotes, setLotes] = useState<LoteDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLotes, setIsLoadingLotes] = useState(false)
  const [currentPageLotes, setCurrentPageLotes] = useState(1)
  const [totalItemsLotes, setTotalItemsLotes] = useState(0)
  const itemsPerPageServer = 8

  // Historial de Cotizaciones
  const [cotizacionesHistory, setCotizacionesHistory] = useState<Cotizacion[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [currentPageHistory, setCurrentPageHistory] = useState(1)
  const [totalItemsHistory, setTotalItemsHistory] = useState(0)
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [debouncedHistorySearchTerm, setDebouncedHistorySearchTerm] = useState("")
  const [historyEstadoFilter, setHistoryEstadoFilter] = useState("PENDIENTE")
  const [isConverting, setIsConverting] = useState<number | null>(null)
  const [isRechazando, setIsRechazando] = useState<number | null>(null)
  const [isRestaurando, setIsRestaurando] = useState<number | null>(null)

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHistorySearchTerm(historySearchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [historySearchTerm])
  const [sharingCotizacion, setSharingCotizacion] = useState<Cotizacion | null>(null)
  const [filename, setFilename] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    // Verificar si el navegador soporta compartir archivos nativamente (Típico de móviles)
    if (typeof navigator !== 'undefined' && navigator.canShare) {
       try {
         const testFile = new File([''], 't.txt', { type: 'text/plain' })
         if (navigator.canShare({ files: [testFile] })) {
           setCanShare(true)
         }
       } catch (e) {
         setCanShare(false)
       }
    }
  }, [])

  const isSuperadmin = user?.role === 'Superadmin' || user?.isSuperuser

  // 1. Cargar lotificaciones
  useEffect(() => {
    const cargarLotificaciones = async () => {
      try {
        setIsLoading(true)
        const data = await lotificacionService.getLotificaciones()
        setLotificaciones(data)
        const activa = data.find(l => l.activo) || data[0]
        if (activa) {
          setSelectedLotificacion(activa.id)
        }
      } catch (err: any) {
        toast.error('Error al cargar las lotificaciones')
      } finally {
        setIsLoading(false)
      }
    }
    cargarLotificaciones()
  }, [])

  // 2. Cargar lotes para cotizar
  const loadLotesParaCotizar = useCallback(async (page: number = 1) => {
    if (!selectedLotificacion) return
    try {
      setIsLoadingLotes(true)
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
      toast.error('Error al cargar los lotes')
    } finally {
      setIsLoadingLotes(false)
    }
  }, [selectedLotificacion])

  useEffect(() => {
    if (activeTab === "cotizar") {
      loadLotesParaCotizar(1)
    }
  }, [loadLotesParaCotizar, selectedLotificacion, activeTab])

  // 3. Cargar Historial de Cotizaciones
  const loadHistory = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingHistory(true)
      const data = await cotizacionesService.getCotizaciones({
        search: debouncedHistorySearchTerm,
        estado: historyEstadoFilter,
        lotificacion: selectedLotificacion || "",
        all: activeTab === "gestion",
        page: page
      })
      setCotizacionesHistory(data.results)
      setTotalItemsHistory(data.count)
      setCurrentPageHistory(page)
    } catch (err) {
      toast.error("Error al cargar las cotizaciones")
    } finally {
      setIsLoadingHistory(false)
    }
  }, [debouncedHistorySearchTerm, activeTab, historyEstadoFilter, selectedLotificacion])

  useEffect(() => {
    if (activeTab === "historial" || activeTab === "gestion") {
      loadHistory(1)
    }
  }, [activeTab, loadHistory, historyEstadoFilter, selectedLotificacion])


  const getEstadoBadge = (lote: LoteDisplay) => {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className="capitalize">
          {lote.uso_lote.replace(/_/g, ' ')}
        </Badge>
        {lote.estado_disponibilidad === 'disponible' ? (
          <Badge variant="default" className="bg-green-500 text-white border-none">Disponible</Badge>
        ) : (
          <Badge variant="secondary">{lote.estado_disponibilidad}</Badge>
        )}
      </div>
    )
  }

  const handleOpenCotizar = (lote: LoteDisplay) => {
    router.push(`/cotizaciones/registrar/${lote.id}`)
  }

  const handleRechazarCotizacion = async (id: number) => {
    if (!confirm("¿Estás seguro de rechazar esta cotización? Pasará a estado RECHAZADA.")) return
    setIsRechazando(id)
    try {
      await cotizacionesService.rechazarCotizacion(id)
      toast.success("Cotización rechazada")
      loadHistory(currentPageHistory)
    } catch (err: any) {
      toast.error("Error al rechazar")
    } finally {
      setIsRechazando(null)
    }
  }

  const handleRestaurarCotizacion = async (id: number) => {
    setIsRestaurando(id)
    try {
      await cotizacionesService.restaurarCotizacion(id)
      toast.success("Cotización restaurada")
      loadHistory(currentPageHistory)
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al restaurar")
    } finally {
      setIsRestaurando(null)
    }
  }

  const handleConvertirAVenta = async (cotizacion: Cotizacion) => {
     if(new Date(cotizacion.fecha_vencimiento) < new Date(new Date().setHours(0,0,0,0))) {
        toast.error("Esta cotización ya venció.")
        return
     }
     
     if(confirm("¿Convertir esta cotización en una venta formal? Esto ocupará el lote.")){
        setIsConverting(cotizacion.id)
        try {
          const res = await cotizacionesService.convertirAVenta(cotizacion.id)
          toast.success("¡Venta creada exitosamente!")
          router.push(`/venta`) // Or stay and reload
          loadHistory(currentPageHistory)
        } catch(err: any) {
          toast.error(err.response?.data?.error || "Error al convertir la cotización a venta. Valide si hay cliente asociado y si el lote está disponible.")
        } finally {
          setIsConverting(null)
        }
     }
  }

  const openShareModal = (cotizacion: Cotizacion) => {
    setSharingCotizacion(cotizacion)
    setFilename(`Cotizacion_${cotizacion.lote_numero}_${cotizacion.cliente_nombre?.replace(/\s+/g, '_') || 'Prospecto'}`)
    setIsShareModalOpen(true)
  }

  const handleDownloadExcel = async () => {
    if (!sharingCotizacion) return
    try {
      setIsExporting(true)
      const blob = await cotizacionesService.exportarExcel(sharingCotizacion.id, filename)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Archivo descargado exitosamente")
      setIsShareModalOpen(false)
    } catch (err: any) {
      toast.error("Error al generar el archivo")
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareWhatsApp = async () => {
    if (!sharingCotizacion) return
    try {
      setIsExporting(true)
      const blob = await cotizacionesService.exportarExcel(sharingCotizacion.id, filename)
      const file = new File([blob], `${filename}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: 'Cotización',
            text: `Hola, te adjunto la cotización para el lote ${sharingCotizacion.lote_numero} de la manzana ${sharingCotizacion.lote_manzana} en ${sharingCotizacion.lotificacion_nombre}.`
          })
          setIsShareModalOpen(false)
          toast.success("¡Compartido con éxito!")
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return
          toast.error("Error al intentar compartir")
        }
      } else {
        // Fallback redundante por si acaso se llegara a ver el botón
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        const phone = sharingCotizacion.telefono_prospecto || ""
        const message = encodeURIComponent(`Hola, te adjunto la cotización para el lote ${sharingCotizacion.lote_numero} de la manzana ${sharingCotizacion.lote_manzana} en ${sharingCotizacion.lotificacion_nombre}.`)
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank')
        setIsShareModalOpen(false)
      }
    } catch (err: any) {
      toast.error("Error al generar el archivo")
    } finally {
      setIsExporting(false)
    }
  }


  // Paginaciones Helpers
  const totalPagesLotes = Math.ceil(totalItemsLotes / itemsPerPageServer)
  const startIndexLotes = (currentPageLotes - 1) * itemsPerPageServer + 1
  const endIndexLotes = Math.min(currentPageLotes * itemsPerPageServer, totalItemsLotes)

  const filteredLotes = lotes.filter((lote) => {
    return lote.manzana.toLowerCase().includes(searchTerm.toLowerCase()) || lote.numero_lote.toLowerCase().includes(searchTerm.toLowerCase())
  })


  const renderHistorialContent = (isGlobal: boolean) => {
    const totalPagesHistory = Math.ceil(totalItemsHistory / itemsPerPageServer)
    const startIndexHistory = (currentPageHistory - 1) * itemsPerPageServer + 1
    const endIndexHistory = Math.min(currentPageHistory * itemsPerPageServer, totalItemsHistory)

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{isGlobal ? "Gestión de Cotizaciones" : "Mis Cotizaciones"}</CardTitle>
              <CardDescription>{isGlobal ? "Listado global de cotizaciones del sistema." : "Listado de prospectos e interesados atendidos."}</CardDescription>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <Select value={historyEstadoFilter} onValueChange={setHistoryEstadoFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                  <SelectItem value="ACEPTADA">Aceptadas</SelectItem>
                  <SelectItem value="RECHAZADA">Rechazadas</SelectItem>
                  <SelectItem value="VENCIDA">Vencidas</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por lote o cliente..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
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
          ) : cotizacionesHistory.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-lg border-2 border-dashed">
              <History className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">No se encontraron cotizaciones.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold">Interesado</TableHead>
                      <TableHead className="font-semibold text-center">Estado</TableHead>
                      <TableHead className="font-semibold text-center">T. Pago</TableHead>
                      <TableHead className="font-semibold">Lote</TableHead>
                      <TableHead className="font-semibold text-center">Vencimiento</TableHead>
                      <TableHead className="font-semibold text-right">Valor Promesa</TableHead>
                      {isGlobal && <TableHead className="font-semibold">Vendedor</TableHead>}
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(cotizacionesHistory) && cotizacionesHistory.map((c) => {
                     const isExpired = new Date(c.fecha_vencimiento) < new Date(new Date().setHours(0,0,0,0))
                     return (
                    <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="font-medium text-slate-900">{c.cliente_nombre}</span>
                           {!c.cliente && <span className="text-xs text-muted-foreground italic">Prospecto no registrado</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                           const isExpired = new Date(c.fecha_vencimiento) < new Date(new Date().setHours(0,0,0,0))
                           const effectiveEstado = (c.estado === 'PENDIENTE' && isExpired) ? 'VENCIDA' : c.estado
                           
                           switch(effectiveEstado) {
                             case 'ACEPTADA': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Aceptada</Badge>
                             case 'RECHAZADA': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Rechazada</Badge>
                             case 'VENCIDA': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Vencida</Badge>
                             default: return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Pendiente</Badge>
                           }
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="rounded-full px-3 bg-slate-100">
                          {c.tipo_pago}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">Lote {c.lote_numero}</span>
                          <span className="text-xs text-muted-foreground">{c.lote_manzana}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={new Date(c.fecha_vencimiento) < new Date(new Date().setHours(0,0,0,0)) ? "destructive" : "secondary"}>
                          <CalendarIcon className="w-3 h-3 mr-1"/>
                          {new Date(c.fecha_vencimiento).toLocaleDateString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-800 text-sm">
                        Q {parseFloat(c.valor_lote).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </TableCell>
                      {isGlobal && <TableCell className="text-xs">{c.vendedor_nombre}</TableCell>}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(() => {
                            const isExpired = new Date(c.fecha_vencimiento) < new Date(new Date().setHours(0,0,0,0))
                            const effectiveEstado = (c.estado === 'PENDIENTE' && isExpired) ? 'VENCIDA' : c.estado

                            if (effectiveEstado === 'RECHAZADA') {
                              return (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleRestaurarCotizacion(c.id)}
                                  disabled={isRestaurando === c.id}
                                  className="h-8 border-amber-200 text-amber-700 hover:bg-amber-50"
                                >
                                  {isRestaurando === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <History className="w-4 h-4 mr-1" />}
                                  Restaurar
                                </Button>
                              )
                            }

                            return (
                              <>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => handleConvertirAVenta(c)}
                                  disabled={effectiveEstado !== 'PENDIENTE' || isConverting === c.id}
                                  className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3"
                                >
                                  {isConverting === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4 mr-1" />}
                                  Vender
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => router.push(`/cotizaciones/editar/${c.id}`)}
                                  disabled={effectiveEstado === 'ACEPTADA'}
                                  className="text-primary hover:bg-primary/10 h-8 px-2"
                                >
                                  Editar
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleRechazarCotizacion(c.id)}
                                  disabled={effectiveEstado === 'ACEPTADA' || effectiveEstado === 'RECHAZADA' || isRechazando === c.id}
                                  className="text-red-600 hover:bg-red-50 h-8 px-2"
                                  title="Rechazar"
                                >
                                  {isRechazando === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : "Borrar"}
                                </Button>
                              </>
                            )
                          })()}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openShareModal(c)}
                            className="text-blue-600 hover:bg-blue-50 h-8 px-2"
                            title="Compartir"
                          >
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
              </div>
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
                onItemsPerPageChange={() => {}}
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando recursos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Cotizaciones</h1>
          <p className="text-muted-foreground">Emisión de cotizaciones a prospectos y control preventas.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
             <div className="flex-1 w-full max-w-md">
                <Select
                  value={selectedLotificacion?.toString() || ""}
                  onValueChange={(value) => {
                    if(value !== 'all') setSelectedLotificacion(Number.parseInt(value))
                  }}
                >
                  <SelectTrigger id="lotificacion">
                    <SelectValue placeholder="Selecciona una lotificación" />
                  </SelectTrigger>
                  <SelectContent>
                    {lotificaciones.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{lot.nombre}</span>
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
          <TabsTrigger value="cotizar" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Nueva Cotización
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Mis Cotizaciones
          </TabsTrigger>
          {isSuperadmin && (
            <TabsTrigger value="gestion" className="flex items-center gap-2">
               <MapPin className="h-4 w-4" />
               Ver Todas (Admin)
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="cotizar" className="space-y-6">
          {selectedLotificacion && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Lotes Disponibles para Cotizar</CardTitle>
                    <CardDescription>Escoja el lote para emitir un presupuesto a un prospecto o cliente.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar lote..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-full md:w-[250px]"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingLotes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : lotes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No hay lotes disponibles en este momento</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                       <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">Manzana</TableHead>
                              <TableHead className="whitespace-nowrap">Lote</TableHead>
                              <TableHead className="whitespace-nowrap">Tamaño</TableHead>
                              <TableHead className="whitespace-nowrap">Precio</TableHead>
                              <TableHead className="w-[120px] text-center">Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLotes.map((lote) => (
                              <TableRow key={lote.id}>
                                <TableCell className="font-medium whitespace-nowrap">{lote.manzana}</TableCell>
                                <TableCell className="whitespace-nowrap">{lote.numero_lote}</TableCell>
                                <TableCell className="whitespace-nowrap">{lote.metros_cuadrados.toLocaleString('es-GT')} m²</TableCell>
                                <TableCell className="font-semibold text-primary whitespace-nowrap">Q {lote.valor_total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    onClick={() => handleOpenCotizar(lote)}
                                    variant="secondary"
                                    size="sm"
                                    className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                  >
                                    Cotizar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
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
                          onPageChange={(p) => loadLotesParaCotizar(p)}
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
                  <p className="text-muted-foreground">Selecciona una lotificación para cotizar sus lotes.</p>
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

      {/* MODAL DE COMPARTIR */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share className="h-5 w-5 text-primary" />
              Compartir Cotización
            </DialogTitle>
            <DialogDescription>
              Configura el nombre del archivo y elige cómo quieres guardarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Nombre del archivo (Excel)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Ej: Cotizacion_Lote_7"
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">.xlsx</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {canShare && (
              <Button
                variant="outline"
                className="flex-1 gap-2 border-green-200 text-green-700 hover:bg-green-50"
                onClick={handleShareWhatsApp}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Compartir en WhatsApp
              </Button>
            )}
            <Button
              className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={handleDownloadExcel}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
