"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Search, Loader2, MapPin, Building2, Map } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { lotesService, type Lote, type LoteCreate } from "@/lib/lotes-service"
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
  const [createLoteForm, setCreateLoteForm] = useState({
    manzanaId: "",
    numero_lote: "",
    metros_cuadrados: "0",
    valor_total: "0",
    costo_instalacion: "5000",
    estado: "disponible" as const,
  })

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

  // Cargar lotes cuando se selecciona una lotificación
  useEffect(() => {
    if (!selectedLotificacion) return

    const cargarLotes = async () => {
      try {
        setIsLoadingLotes(true)
        setError(null)

        // Obtener lotes por estado (disponible, reservado, pagado, pagado_y_escriturado, comercial_y_bodega, financiado)
        const [disponibles, reservados, pagados, pagadosEscriturados, comercialBodega, financiados] = await Promise.all([
          lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'disponible' }),
          lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'reservado' }),
          lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'pagado' }),
          lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'pagado_y_escriturado' }),
          lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'comercial_y_bodega' }),
          lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'financiado' }),
        ])

        const todosLotes: LoteDisplay[] = [
          ...disponibles.map(lote => ({
            id: lote.id,
            manzana: lote.manzana_nombre || `Manzana ${lote.manzana}`,
            numero_lote: lote.numero_lote,
            metros_cuadrados: parseFloat(lote.metros_cuadrados),
            valor_total: parseFloat(lote.valor_total),
            estado: lote.estado,
          })),
          ...reservados.map(lote => ({
            id: lote.id,
            manzana: lote.manzana_nombre || `Manzana ${lote.manzana}`,
            numero_lote: lote.numero_lote,
            metros_cuadrados: parseFloat(lote.metros_cuadrados),
            valor_total: parseFloat(lote.valor_total),
            estado: lote.estado,
          })),
          ...pagados.map(lote => ({
            id: lote.id,
            manzana: lote.manzana_nombre || `Manzana ${lote.manzana}`,
            numero_lote: lote.numero_lote,
            metros_cuadrados: parseFloat(lote.metros_cuadrados),
            valor_total: parseFloat(lote.valor_total),
            estado: lote.estado,
          })),
          ...pagadosEscriturados.map(lote => ({
            id: lote.id,
            manzana: lote.manzana_nombre || `Manzana ${lote.manzana}`,
            numero_lote: lote.numero_lote,
            metros_cuadrados: parseFloat(lote.metros_cuadrados),
            valor_total: parseFloat(lote.valor_total),
            estado: lote.estado,
          })),
          ...comercialBodega.map(lote => ({
            id: lote.id,
            manzana: lote.manzana_nombre || `Manzana ${lote.manzana}`,
            numero_lote: lote.numero_lote,
            metros_cuadrados: parseFloat(lote.metros_cuadrados),
            valor_total: parseFloat(lote.valor_total),
            estado: lote.estado,
          })),
          ...financiados.map(lote => ({
            id: lote.id,
            manzana: lote.manzana_nombre || `Manzana ${lote.manzana}`,
            numero_lote: lote.numero_lote,
            metros_cuadrados: parseFloat(lote.metros_cuadrados),
            valor_total: parseFloat(lote.valor_total),
            estado: lote.estado,
          })),
        ]

        setLotes(todosLotes)
      } catch (err: any) {
        console.error('[Lotes] Error cargando lotes:', err)
        setError('Error al cargar los lotes')
      } finally {
        setIsLoadingLotes(false)
      }
    }

    cargarLotes()
  }, [selectedLotificacion])

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
      manzanaId: manzanaMatch ? String(manzanaMatch.id) : (manzanas[0] ? String(manzanas[0].id) : ""),
      numero_lote: info.numero_lote,
      metros_cuadrados: "0",
      valor_total: "0",
      costo_instalacion: "5000",
      estado: "disponible",
    })
    setCreateLotePrefill({ manzana: info.manzana, numero_lote: info.numero_lote })
    setIsCreateLoteOpen(true)
  }

  const handleSubmitCrearLote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLotificacion || !createLoteForm.manzanaId) return
    setIsSubmittingLote(true)
    setError(null)
    try {
      const data: LoteCreate = {
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
        manzanaId: manzanas[0] ? String(manzanas[0].id) : "",
        numero_lote: "",
        metros_cuadrados: "0",
        valor_total: "0",
        costo_instalacion: "5000",
        estado: "disponible",
      })
      const [disponibles, reservados, pagados, pagadosEscriturados, comercialBodega, financiados] = await Promise.all([
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: "disponible" }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: "reservado" }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: "pagado" }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: "pagado_y_escriturado" }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: "comercial_y_bodega" }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: "financiado" }),
      ])
      const todosLotes: LoteDisplay[] = [
        ...disponibles.map((l) => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...reservados.map((l) => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...pagados.map((l) => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...pagadosEscriturados.map((l) => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...comercialBodega.map((l) => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
        ...financiados.map((l) => ({ id: l.id, manzana: l.manzana_nombre || `Manzana ${l.manzana}`, numero_lote: l.numero_lote, metros_cuadrados: parseFloat(l.metros_cuadrados), valor_total: parseFloat(l.valor_total), estado: l.estado })),
      ]
      setLotes(todosLotes)
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

  const contarLotesPorEstado = () => {
    return {
      disponibles: lotes.filter(l => l.estado === 'disponible').length,
      reservados: lotes.filter(l => l.estado === 'reservado').length,
      pagados: lotes.filter(l => l.estado === 'pagado' || l.estado === 'pagado_y_escriturado').length,
    }
  }

  const estadisticas = contarLotesPorEstado()

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
              <Link href={`/lotificaciones/${selectedLotificacion}/plano`}>
                <Button variant="outline" type="button">
                  <Map className="h-4 w-4 mr-2" />
                  Ir a mapa interactuable
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      {selectedLotificacion && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.disponibles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reservados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.reservados}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pagados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.pagados}</div>
            </CardContent>
          </Card>
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
    </div>
  )
}

