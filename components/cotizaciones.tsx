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
  const itemsPerPageServer = 10

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
  const [isEliminando, setIsEliminando] = useState<number | null>(null)

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [sharingCotizacion, setSharingCotizacion] = useState<Cotizacion | null>(null)
  const [filename, setFilename] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [savePath, setSavePath] = useState("C:\\Users\\Usuario\\Downloads")
  const [dirHandle, setDirHandle] = useState<any>(null)
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

  const isSuperadmin = user?.role === 'Superadmin' || user?.role === 'Administrador' || user?.isSuperuser

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

  const handleEliminarCotizacion = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar permanentemente esta cotización? Esta acción no se puede deshacer.")) return
    setIsEliminando(id)
    try {
      await cotizacionesService.eliminarCotizacion(id)
      toast.success("Cotización eliminada exitosamente")
      loadHistory(currentPageHistory)
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error al eliminar la cotización")
    } finally {
      setIsEliminando(null)
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
          const errorData = err.response?.data
          if (errorData?.code === 'LOTE_NO_DISPONIBLE' || errorData?.error?.includes('ya hay una venta registrada') || errorData?.error?.includes('ya no está disponible')) {
            toast.warning(errorData?.error || "No se pudo concretar la cotización porque ya hay una venta registrada del lote cotizado.")
          } else {
            toast.error(errorData?.error || "Error al convertir la cotización a venta. Valide si hay cliente asociado y si el lote está disponible.")
          }
        } finally {
          setIsConverting(null)
        }
     }
  }

  const openShareModal = (cotizacion: Cotizacion) => {
    setSharingCotizacion(cotizacion)
    setFilename(`Cotizacion_${cotizacion.lote_numero}_${cotizacion.cliente_nombre?.replace(/\s+/g, '_') || 'Prospecto'}`)
    setDirHandle(null)
    setSavePath("C:\\Users\\Usuario\\Downloads")
    setIsShareModalOpen(true)
  }

  const handleExaminar = async () => {
    if (!filename.trim()) {
      toast.error("Por favor, ingresa primero el nombre del archivo.");
      return;
    }
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker({
          id: 'cotizaciones_excel',
          mode: 'readwrite'
        });
        setDirHandle(handle);
        setSavePath(`Carpeta: ${handle.name}`);
        toast.success(`Carpeta "${handle.name}" seleccionada correctamente.`);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error("Error al seleccionar la carpeta");
        }
      }
    } else {
      toast.info("Tu navegador gestionará la ubicación de descarga al presionar Descargar.");
    }
  }

  const handleDownloadExcel = async () => {
    if (!sharingCotizacion) return;
    if (!filename.trim()) {
      toast.error("El nombre del archivo no puede estar vacío.");
      return;
    }
    try {
      setIsExporting(true);
      const blob = await cotizacionesService.exportarExcel(sharingCotizacion.id, filename);
      const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
      
      if (dirHandle) {
        const fileHandle = await dirHandle.getFileHandle(finalFilename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success(`Archivo guardado exitosamente en la carpeta "${dirHandle.name}"`);
        setIsShareModalOpen(false);
        setDirHandle(null);
      } else if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: finalFilename,
          types: [{
            description: 'Archivo Excel',
            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success("Archivo guardado exitosamente");
        setIsShareModalOpen(false);
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Archivo descargado exitosamente");
        setIsShareModalOpen(false);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error("Error al generar o guardar el archivo");
    } finally {
      setIsExporting(false);
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
                        Q {parseFloat(c.valor_lote || "0").toLocaleString('es-GT', { minimumFractionDigits: 2 })}
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
                                  onClick={() => handleEliminarCotizacion(c.id)}
                                  disabled={effectiveEstado === 'ACEPTADA' || isEliminando === c.id}
                                  className="text-red-600 hover:bg-red-50 h-8 px-2"
                                  title="Eliminar cotización"
                                >
                                  {isEliminando === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : "Borrar"}
                                </Button>
                              </>
                            )
                          })()}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openShareModal(c)}
                            className="text-blue-600 hover:bg-blue-50 h-8 px-2"
                            title="Descargar"
                          >
                            <Download className="w-4 h-4" />
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

      {/* MODAL DE DESCARGAR */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Descargar Cotización
            </DialogTitle>
            <DialogDescription>
              Configura el nombre del archivo y elige la ubicación donde deseas guardarlo.
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
            <div className="space-y-2">
              <Label htmlFor="savepath">Ubicación de guardado</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="savepath"
                  value={savePath}
                  readOnly
                  className="flex-1 bg-slate-50 text-slate-600 text-xs font-mono"
                />
                <Button 
                  variant="outline" 
                  onClick={handleExaminar}
                  className="border-slate-300 hover:bg-slate-100 text-xs h-10 px-3"
                >
                  Examinar
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * Utiliza el explorador nativo para elegir la carpeta exacta en tu PC local.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
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
