"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
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
import Link from "next/link"
import { Search, Loader2, MapPin, Building2, Map, Pencil, Trash2 } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { lotesService, type Lote, type LoteCreate, type LoteUpdate } from "@/lib/lotes-service"
import { lotificacionService, type Lotificacion } from "@/lib/lotificacion-service"

interface LoteDisplay {
  id: number
  manzana: string
  numero_lote: string
  metros_cuadrados: number
  valor_total: number
  estado: 'disponible' | 'reservado' | 'pagado' | 'comercial_y_bodega' | 'financiado' | 'pagado_y_escriturado'
}

export function Lotes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLotificacion, setSelectedLotificacion] = useState<number | null>(null)
  const [lotificaciones, setLotificaciones] = useState<Lotificacion[]>([])
  const [lotes, setLotes] = useState<LoteDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLotes, setIsLoadingLotes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateLoteOpen, setIsCreateLoteOpen] = useState(false)
  const [createLotePrefill, setCreateLotePrefill] = useState<{ manzana: number; numero_lote: string } | null>(null)
  const [manzanas, setManzanas] = useState<{ id: number; nombre: string }[]>([])
  const [isSubmittingLote, setIsSubmittingLote] = useState(false)
  const [createIdentificadorManual, setCreateIdentificadorManual] = useState(false)
  const [createLoteForm, setCreateLoteForm] = useState({
    identificador: "",
    manzanaId: "",
    numero_lote: "",
    metros_cuadrados: "0",
    valor_total: "0",
    costo_instalacion: "5000",
    estado: "disponible" as const,
  })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoteId, setEditLoteId] = useState<number | null>(null)
  const [editVersion, setEditVersion] = useState(0)
  const [editLoading, setEditLoading] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editIdentificadorManual, setEditIdentificadorManual] = useState(false)
  const [editForm, setEditForm] = useState({
    identificador: "",
    manzanaId: "",
    numero_lote: "",
    metros_cuadrados: "",
    valor_total: "",
    costo_instalacion: "",
    estado: "disponible" as LoteEstado,
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoteId, setDeleteLoteId] = useState<number | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

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
        console.error('[Lotes] Error cargando lotificaciones:', err)
        setError('Error al cargar las lotificaciones')
      } finally {
        setIsLoading(false)
      }
    }

    cargarLotificaciones()
  }, [])

  // Cargar manzanas de la lotificación (para formulario crear lote)
  useEffect(() => {
    if (!selectedLotificacion) {
      setManzanas([])
      return
    }
    const cargar = async () => {
      try {
        const list = await lotificacionService.getManzanas(selectedLotificacion)
        setManzanas(list)
      } catch {
        setManzanas([])
      }
    }
    cargar()
  }, [selectedLotificacion])

  const loadLotes = useCallback(async () => {
    if (!selectedLotificacion) return
    try {
      setIsLoadingLotes(true)
      setError(null)
      const [disponibles, reservados, pagados, pagadosEscriturados, comercialBodega, financiados] = await Promise.all([
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'disponible' }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'reservado' }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'pagado' }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'pagado_y_escriturado' }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'comercial_y_bodega' }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'financiado' }),
      ])
      const todosLotes: LoteDisplay[] = [
        ...disponibles.map(l => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...reservados.map(l => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...pagados.map(l => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...pagadosEscriturados.map(l => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...comercialBodega.map(l => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...financiados.map(l => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
      ]
      setLotes(todosLotes)
    } catch (err: any) {
      console.error('[Lotes] Error cargando lotes:', err)
      setError('Error al cargar los lotes')
    } finally {
      setIsLoadingLotes(false)
    }
  }, [selectedLotificacion])

  useEffect(() => {
    loadLotes()
  }, [loadLotes])

  // Helper for generating abbreviations
  const getLotificacionAbreviatura = useCallback(() => {
    if (!selectedLotificacion) return "LOT"
    const lot = lotificaciones.find(l => l.id === selectedLotificacion)
    if (!lot) return "LOT"
    return lot.nombre.substring(0, 3).toUpperCase()
  }, [selectedLotificacion, lotificaciones])

  // Auto-generate identificador on create
  useEffect(() => {
    if (!isCreateLoteOpen || createIdentificadorManual) return
    const manzanaMatch = manzanas.find(m => String(m.id) === createLoteForm.manzanaId)
    const mName = manzanaMatch ? manzanaMatch.nombre : ""
    if (mName && createLoteForm.numero_lote) {
      setCreateLoteForm(f => ({ ...f, identificador: `${getLotificacionAbreviatura()}-${mName}-${f.numero_lote}`.toUpperCase() }))
    }
  }, [createLoteForm.manzanaId, createLoteForm.numero_lote, createIdentificadorManual, manzanas, getLotificacionAbreviatura, isCreateLoteOpen])

  // Auto-generate identificador on edit
  useEffect(() => {
    if (!editModalOpen || editIdentificadorManual) return
    const manzanaMatch = manzanas.find(m => String(m.id) === editForm.manzanaId)
    const mName = manzanaMatch ? manzanaMatch.nombre : ""
    if (mName && editForm.numero_lote) {
      setEditForm(f => ({ ...f, identificador: `${getLotificacionAbreviatura()}-${mName}-${f.numero_lote}`.toUpperCase() }))
    }
  }, [editForm.manzanaId, editForm.numero_lote, editIdentificadorManual, manzanas, getLotificacionAbreviatura, editModalOpen])

  // Filtrar lotes por término de búsqueda
  const filteredLotes = lotes.filter((lote) => {
    const matchesSearch =
      lote.manzana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.numero_lote.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Paginación con 10 items por página
  const {
    currentData: paginatedLotes,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination({
    data: filteredLotes,
    itemsPerPage: 10,
  })

  const handleCrearLoteManual = (info: { manzana: number; numero_lote: string; loteId: string }) => {
    const manzanaMatch = manzanas.find(
      (m) => m.id === info.manzana || String(m.nombre) === String(info.manzana)
    )
    setCreateLoteForm({
      identificador: "",
      manzanaId: manzanaMatch ? String(manzanaMatch.id) : (manzanas[0] ? String(manzanas[0].id) : ""),
      numero_lote: info.numero_lote,
      metros_cuadrados: "0",
      valor_total: "0",
      costo_instalacion: "5000",
      estado: "disponible",
    })
    setCreateLotePrefill({ manzana: info.manzana, numero_lote: info.numero_lote })
    setCreateIdentificadorManual(false)
    setIsCreateLoteOpen(true)
  }

  const handleSubmitCrearLote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLotificacion || !createLoteForm.manzanaId) return
    setIsSubmittingLote(true)
    setError(null)
    try {
      const metros = parseFloat(createLoteForm.metros_cuadrados)
      const valor = parseFloat(createLoteForm.valor_total)
      const costo = parseFloat(createLoteForm.costo_instalacion) || 0
      if (isNaN(metros) || metros <= 0 || isNaN(valor) || valor <= 0) {
        setError("Metros cuadrados y valor total deben ser mayores a 0.")
        setIsSubmittingLote(false)
        return
      }
      if (valor - costo <= 0) {
        setError("El saldo a financiar debe ser mayor a 0. Asegúrate de que el valor total sea mayor al costo de instalación.")
        setIsSubmittingLote(false)
        return
      }
      const data: LoteCreate = {
        identificador: createLoteForm.identificador || undefined,
        manzana: parseInt(createLoteForm.manzanaId, 10),
        numero_lote: createLoteForm.numero_lote,
        metros_cuadrados: createLoteForm.metros_cuadrados,
        valor_total: createLoteForm.valor_total,
        costo_instalacion: createLoteForm.costo_instalacion,
        estado: createLoteForm.estado,
      }
      await lotesService.createLote(data)
      setIsCreateLoteOpen(false)
      setCreateLotePrefill(null)
      setCreateLoteForm({
        identificador: "",
        manzanaId: manzanas[0] ? String(manzanas[0].id) : "",
        numero_lote: "",
        metros_cuadrados: "0",
        valor_total: "0",
        costo_instalacion: "5000",
        estado: "disponible",
      })
      loadLotes()
    } catch (err: any) {
      console.error("[Lotes] Error creando lote:", err)
      setError(err.message || "Error al crear el lote")
    } finally {
      setIsSubmittingLote(false)
    }
  }

  // Función para obtener el badge según el estado
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Badge variant="default" className="bg-green-500">Disponible</Badge>
      case 'reservado':
        return <Badge variant="default" className="bg-yellow-500">Reservado</Badge>
      case 'pagado':
        return <Badge variant="default" className="bg-purple-500">Pagado</Badge>
      case 'comercial_y_bodega':
        return <Badge variant="default" className="bg-amber-800">Comercial y Bodega</Badge>
      case 'financiado':
        return <Badge variant="default" className="bg-blue-500">Financiado</Badge>
      case 'pagado_y_escriturado':
        return <Badge variant="default" className="bg-red-500">Pagado y Escriturado</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  /** Colores por estado (igual que en el plano interactivo). */
  const ESTADO_COLOR: Record<string, string> = {
    disponible: "#22c55e",
    reservado: "#eab308",
    pagado: "#8b5cf6",
    comercial_y_bodega: "#92400e",
    financiado: "#3b82f6",
    pagado_y_escriturado: "#ef4444",
  }
  const COLOR_TOTAL = "#64748b"

  const contarLotesPorEstado = () => {
    return {
      disponibles: lotes.filter(l => l.estado === 'disponible').length,
      pagados: lotes.filter(l => l.estado === 'pagado').length,
      pagados_y_escriturados: lotes.filter(l => l.estado === 'pagado_y_escriturado').length,
      reservados: lotes.filter(l => l.estado === 'reservado').length,
      comercial_y_bodega: lotes.filter(l => l.estado === 'comercial_y_bodega').length,
      financiados: lotes.filter(l => l.estado === 'financiado').length,
      total: lotes.length,
    }
  }

  const estadisticas = contarLotesPorEstado()

  const cuadrosEstados = [
    { key: 'disponibles' as const, label: 'Disponibles', color: ESTADO_COLOR.disponible },
    { key: 'pagados' as const, label: 'Pagados', color: ESTADO_COLOR.pagado },
    { key: 'pagados_y_escriturados' as const, label: 'Pagados y Escriturados', color: ESTADO_COLOR.pagado_y_escriturado },
    { key: 'reservados' as const, label: 'Reservados', color: ESTADO_COLOR.reservado },
    { key: 'comercial_y_bodega' as const, label: 'Comerciales y Bodegas', color: ESTADO_COLOR.comercial_y_bodega },
    { key: 'financiados' as const, label: 'Financiados', color: ESTADO_COLOR.financiado },
    { key: 'total' as const, label: 'Total de Lotes', color: COLOR_TOTAL },
  ]

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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lotes</h1>
          <p className="text-muted-foreground">Gestiona los lotes disponibles, reservados y pagados</p>
        </div>
      </div>

      {/* Selector de lotificación */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Lotificación</CardTitle>
          <CardDescription>Elige la lotificación para ver sus lotes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <Label htmlFor="lotificacion">Lotificación</Label>
              <Select
                value={selectedLotificacion?.toString() || ""}
                onValueChange={(value) => setSelectedLotificacion(Number.parseInt(value))}
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
                        {!lot.activo && <Badge variant="secondary" className="ml-2">Inactiva</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLotificacion && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => {
                    setCreateLotePrefill(null)
                    setCreateLoteForm({
                      identificador: "",
                      manzanaId: manzanas[0] ? String(manzanas[0].id) : "",
                      numero_lote: "",
                      metros_cuadrados: "0",
                      valor_total: "0",
                      costo_instalacion: "5000",
                      estado: "disponible",
                    })
                    setCreateIdentificadorManual(false)
                    setIsCreateLoteOpen(true)
                  }}
                >
                  Crear lote manual
                </Button>
                <Link href={`/lotificaciones/${selectedLotificacion}/plano`}>
                  <Button variant="outline" type="button">
                    <Map className="h-4 w-4 mr-2" />
                    Ir a mapa interactuable
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información de los lotes: 6 cuadros en 3 columnas × 2 filas, Total a la derecha ocupando las 2 filas */}
      {selectedLotificacion && (
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:col-span-3 md:row-span-2">
            {cuadrosEstados.slice(0, 6).map(({ key, label, color }) => (
              <Card
                key={key}
                className="overflow-hidden border-l-4 py-2"
                style={{ borderLeftColor: color }}
              >
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-xs font-medium leading-tight" style={{ color }}>
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-1">
                  <div className="text-xl font-bold tabular-nums">
                    {estadisticas[key]}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {(() => {
            const { key, label, color } = cuadrosEstados[6]
            return (
              <Card
                key={key}
                className="overflow-hidden border-l-4 py-2 md:col-start-4 md:row-span-2 flex flex-col"
                style={{ borderLeftColor: color }}
              >
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-xs font-medium leading-tight" style={{ color }}>
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-1 flex-1 flex items-center">
                  <div className="text-2xl font-bold tabular-nums">
                    {estadisticas[key]}
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabla de lotes */}
      {selectedLotificacion && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Lista de Lotes</CardTitle>
                <CardDescription>
                  {totalItems} lote{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por manzana o número..."
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
            ) : paginatedLotes.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No se encontraron lotes con ese criterio de búsqueda' : 'No hay lotes para esta lotificación'}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manzana</TableHead>
                        <TableHead>Número de Lote</TableHead>
                        <TableHead>Metros Cuadrados</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLotes.map((lote) => (
                        <TableRow key={lote.id}>
                          <TableCell className="font-medium">{lote.manzana}</TableCell>
                          <TableCell>{lote.numero_lote}</TableCell>
                          <TableCell>{lote.metros_cuadrados.toLocaleString('es-GT')} m²</TableCell>
                          <TableCell>Q {lote.valor_total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{getEstadoBadge(lote.estado)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={async () => {
                                  setEditLoteId(lote.id)
                                  setEditModalOpen(true)
                                  setEditError(null)
                                  setEditLoading(true)
                                  try {
                                    const full = await lotesService.getLote(lote.id)
                                    setEditVersion((full as any).version ?? 0)
                                    setEditForm({
                                      identificador: (full as any).identificador ?? "",
                                      manzanaId: String((full as any).manzana ?? ""),
                                      numero_lote: (full as any).numero_lote ?? "",
                                      metros_cuadrados: String((full as any).metros_cuadrados ?? ""),
                                      valor_total: String((full as any).valor_total ?? ""),
                                      costo_instalacion: String((full as any).costo_instalacion ?? ""),
                                      estado: ((full as any).estado ?? "disponible") as "disponible" | "reservado" | "pagado" | "comercial_y_bodega" | "financiado" | "pagado_y_escriturado",
                                    })
                                    setEditIdentificadorManual(true) // By default, let's keep it manual when opening edit so it doesn't immediately overwrite the saved ID
                                  } catch {
                                    setEditError("No se pudo cargar el lote.")
                                  } finally {
                                    setEditLoading(false)
                                  }
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeleteLoteId(lote.id)
                                  setDeleteModalOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      itemsPerPage={itemsPerPage}
                      totalItems={totalItems}
                      startIndex={startIndex}
                      endIndex={endIndex}
                      onPageChange={goToPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay lotificación seleccionada */}
      {!selectedLotificacion && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Selecciona una lotificación para ver sus lotes</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Crear lote manualmente (desde plano SVG) */}
      <Dialog open={isCreateLoteOpen} onOpenChange={setIsCreateLoteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear información del lote</DialogTitle>
            <DialogDescription>
              Completa los datos del lote para registrarlo en el sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCrearLote} className="space-y-4">
            <div className="space-y-2">
              <Label>Identificador</Label>
              <div className="flex gap-2">
                <Input
                  value={createLoteForm.identificador}
                  onChange={(e) => setCreateLoteForm((f) => ({ ...f, identificador: e.target.value }))}
                  placeholder="Ej: PRA-X-01"
                  readOnly={!createIdentificadorManual}
                  className={createIdentificadorManual ? "" : "bg-muted"}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setCreateIdentificadorManual(!createIdentificadorManual)}
                  title={createIdentificadorManual ? "Volver automático" : "Editar manualmente"}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manzana</Label>
                <Select
                  value={createLoteForm.manzanaId}
                  onValueChange={(v) => setCreateLoteForm((f) => ({ ...f, manzanaId: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar manzana" />
                  </SelectTrigger>
                  <SelectContent>
                    {manzanas.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número de lote</Label>
                <Input
                  value={createLoteForm.numero_lote}
                  onChange={(e) => setCreateLoteForm((f) => ({ ...f, numero_lote: e.target.value }))}
                  placeholder="01, 02..."
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Metros cuadrados</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createLoteForm.metros_cuadrados}
                  onChange={(e) => setCreateLoteForm((f) => ({ ...f, metros_cuadrados: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Valor total (Q)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createLoteForm.valor_total}
                  onChange={(e) => setCreateLoteForm((f) => ({ ...f, valor_total: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Costo instalación (Q)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createLoteForm.costo_instalacion}
                onChange={(e) => setCreateLoteForm((f) => ({ ...f, costo_instalacion: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={createLoteForm.estado}
                onValueChange={(v) =>
                  setCreateLoteForm((f) => ({ ...f, estado: v as typeof f.estado }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="comercial_y_bodega">Comercial y Bodega</SelectItem>
                  <SelectItem value="financiado">Financiado</SelectItem>
                  <SelectItem value="pagado_y_escriturado">Pagado y Escriturado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateLoteOpen(false)}
                disabled={isSubmittingLote}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingLote}>
                {isSubmittingLote ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear lote"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar lote */}
      <Dialog open={editModalOpen} onOpenChange={(open) => { setEditModalOpen(open); if (!open) setEditError(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar lote</DialogTitle>
            <DialogDescription>
              Modifique los datos del lote. Revisa el identificador para mantener la vinculación al mapa.
            </DialogDescription>
          </DialogHeader>
          {editLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                if (editLoteId == null) return
                const metros = parseFloat(editForm.metros_cuadrados)
                const valor = parseFloat(editForm.valor_total)
                const costo = parseFloat(editForm.costo_instalacion) || 0
                if (isNaN(metros) || metros <= 0 || isNaN(valor) || valor <= 0) {
                  setEditError("Metros cuadrados y valor total deben ser mayores a 0.")
                  return
                }
                if (valor - costo <= 0) {
                  setEditError("El valor total debe ser mayor al costo de instalación.")
                  return
                }
                setEditError(null)
                setEditSubmitting(true)
                try {
                  const payload: LoteUpdate = {
                    identificador: editForm.identificador || undefined,
                    version: editVersion,
                    manzana: parseInt(editForm.manzanaId, 10),
                    numero_lote: editForm.numero_lote,
                    metros_cuadrados: editForm.metros_cuadrados,
                    valor_total: editForm.valor_total,
                    costo_instalacion: editForm.costo_instalacion,
                    estado: editForm.estado,
                    activo: true,
                  }
                  await lotesService.updateLote(editLoteId, payload)
                  loadLotes()
                  setEditModalOpen(false)
                } catch (err: any) {
                  setEditError(err?.data?.non_field_errors?.[0] ?? err?.data?.version?.[0] ?? err?.message ?? "Error al guardar.")
                } finally {
                  setEditSubmitting(false)
                }
              }}
            >
              <div className="space-y-2">
                <Label>Identificador</Label>
                <div className="flex gap-2">
                  <Input
                    value={editForm.identificador}
                    onChange={(e) => setEditForm((f) => ({ ...f, identificador: e.target.value }))}
                    placeholder="Ej: PRA-X-01"
                    readOnly={!editIdentificadorManual}
                    className={editIdentificadorManual ? "" : "bg-muted"}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setEditIdentificadorManual(!editIdentificadorManual)}
                    title={editIdentificadorManual ? "Volver automático" : "Editar manualmente"}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manzana</Label>
                  <Select
                    value={editForm.manzanaId}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, manzanaId: v }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Manzana" />
                    </SelectTrigger>
                    <SelectContent>
                      {manzanas.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de lote</Label>
                  <Input
                    value={editForm.numero_lote}
                    onChange={(e) => setEditForm((f) => ({ ...f, numero_lote: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Metros cuadrados</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editForm.metros_cuadrados}
                    onChange={(e) => setEditForm((f) => ({ ...f, metros_cuadrados: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor total (Q)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editForm.valor_total}
                    onChange={(e) => setEditForm((f) => ({ ...f, valor_total: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Costo instalación (Q)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.costo_instalacion}
                  onChange={(e) => setEditForm((f) => ({ ...f, costo_instalacion: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={editForm.estado}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, estado: v as typeof f.estado }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="reservado">Reservado</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="comercial_y_bodega">Comercial y Bodega</SelectItem>
                    <SelectItem value="financiado">Financiado</SelectItem>
                    <SelectItem value="pagado_y_escriturado">Pagado y Escriturado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} disabled={editSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={editSubmitting}>
                  {editSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar eliminar lote */}
      <Dialog open={deleteModalOpen} onOpenChange={(open) => { setDeleteModalOpen(open); if (!open) setDeleteLoteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar lote?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El lote se eliminará por completo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleteSubmitting}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteSubmitting}
              onClick={async () => {
                if (deleteLoteId == null) return
                setDeleteSubmitting(true)
                try {
                  await lotesService.deleteLote(deleteLoteId)
                  loadLotes()
                  setDeleteModalOpen(false)
                  setDeleteLoteId(null)
                } catch (err: any) {
                  setError(err?.message ?? "Error al eliminar el lote.")
                } finally {
                  setDeleteSubmitting(false)
                }
              }}
            >
              {deleteSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Eliminando...</> : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

