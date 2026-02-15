"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { Plus, Search, Filter, Download, Edit, Trash2, Calculator, Eye, Loader2 } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { lotesService, mapLoteFromApi, mapLoteToApi, type Lote } from "@/lib/lotes-service"
import { BackendStatus } from "@/components/backend-status"
import { useConfiguracion } from "@/hooks/use-configuracion"

interface LoteDisponible {
  id: string
  manzana: string
  lote: string
  metrosCuadrados: number
  valorTotal: number
  enganche: number
  instalacion: number
  saldoFinanciar: number
  plazoMeses: number
  cuotaMensual: number
  estado: string
}

export function LotesDisponibles() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterManzana, setFilterManzana] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSimulationDialogOpen, setIsSimulationDialogOpen] = useState(false)
  const [selectedLote, setSelectedLote] = useState<LoteDisponible | null>(null)
  const [selectedPlazo, setSelectedPlazo] = useState("36")
  
  // Estados para el backend
  const [lotes, setLotes] = useState<LoteDisponible[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Obtener configuración para la tasa anual
  const { configuracionActiva } = useConfiguracion()

  // Cargar lotes desde el backend
  useEffect(() => {
    const cargarLotes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('[Lotes] Iniciando carga de lotes...')
        
        // Obtener solo lotes disponibles
        const lotesApi = await lotesService.getLotesDisponibles()
        console.log('[Lotes] Lotes obtenidos del backend:', lotesApi)
        
        const lotesMapeados = lotesApi.map(mapLoteFromApi)
        console.log('[Lotes] Lotes mapeados:', lotesMapeados)
        
        setLotes(lotesMapeados)
      } catch (err: any) {
        console.error('Error cargando lotes:', err)
        
        // Mensaje de error más específico
        let errorMessage = 'Error al cargar los lotes. '
        
        if (err.status === 404) {
          errorMessage += 'El endpoint no existe. Verifica que el backend esté corriendo.'
        } else if (err.status === 401) {
          errorMessage += 'No autorizado. Verifica tu sesión.'
        } else if (err.status === 500) {
          errorMessage += 'Error del servidor. Verifica que el backend esté funcionando.'
        } else if (err.message?.includes('fetch')) {
          errorMessage += 'No se puede conectar al backend. Verifica que esté corriendo en http://localhost:8000'
        } else {
          errorMessage += err.message || 'Error desconocido.'
        }
        
        setError(errorMessage)
        
        // Temporalmente usar datos mock si hay error de conexión
        if (err.message?.includes('fetch') || err.status === 404) {
          console.log('[Lotes] Usando datos mock temporales...')
          const mockLotes = [
            {
              id: "1",
              manzana: "Manzana A - Residencial",
              lote: "001",
              metrosCuadrados: 200,
              valorTotal: 150000,
              enganche: 30000,
              instalacion: 5000,
              saldoFinanciar: 115000,
              plazoMeses: 36,
              cuotaMensual: 3472.22,
              estado: "disponible"
            },
            {
              id: "2",
              manzana: "Manzana A - Residencial",
              lote: "002",
              metrosCuadrados: 180,
              valorTotal: 135000,
              enganche: 27000,
              instalacion: 5000,
              saldoFinanciar: 103000,
              plazoMeses: 24,
              cuotaMensual: 4708.33,
              estado: "disponible"
            },
            {
              id: "3",
              manzana: "Manzana B - Comercial",
              lote: "001",
              metrosCuadrados: 220,
              valorTotal: 165000,
              enganche: 33000,
              instalacion: 5000,
              saldoFinanciar: 127000,
              plazoMeses: 48,
              cuotaMensual: 2895.83,
              estado: "disponible"
            },
            {
              id: "4",
              manzana: "Manzana C - Premium",
              lote: "001",
              metrosCuadrados: 250,
              valorTotal: 200000,
              enganche: 40000,
              instalacion: 8000,
              saldoFinanciar: 152000,
              plazoMeses: 60,
              cuotaMensual: 3150.00,
              estado: "disponible"
            }
          ]
          setLotes(mockLotes)
          setError(null) // Limpiar el error ya que tenemos datos mock
        }
      } finally {
        setIsLoading(false)
      }
    }

    cargarLotes()
  }, [])

  const [formData, setFormData] = useState({
    manzana: "",
    lote: "",
    metrosCuadrados: "",
    valorTotal: "",
    enganche: "",
    instalacion: "5000",
    plazoMeses: "36",
  })

  // Opciones de manzanas para el formulario
  const opcionesManzanas = [
    { id: 1, nombre: 'Manzana A - Residencial' },
    { id: 2, nombre: 'Manzana B - Comercial' },
    { id: 3, nombre: 'Manzana C - Premium' },
    { id: 4, nombre: 'Manzana D - Ejecutiva' },
    { id: 5, nombre: 'Manzana E - Familiar' },
    { id: 6, nombre: 'Manzana F - Especial' },
    { id: 7, nombre: 'Manzana G - VIP' },
    { id: 8, nombre: 'Manzana H - Económica' }
  ]

  // Obtener manzanas únicas de los datos cargados
  const manzanasUnicas = [...new Set(lotes.map(lote => lote.manzana))].sort()

  // Filtrar lotes
  const filteredLotes = lotes.filter((lote) => {
    const matchesSearch =
      lote.manzana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.lote.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesManzana = filterManzana === "all" || lote.manzana === filterManzana
    return matchesSearch && matchesManzana
  })

  // Paginación
  const {
    currentData: paginatedLotes,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    setItemsPerPage,
  } = usePagination({
    data: filteredLotes,
    itemsPerPage: 10,
  })

  // Calcular cuota mensual
  const calcularCuota = (saldoFinanciar: number, plazoMeses: number, tasaAnual = 12) => {
    const tasaMensual = tasaAnual / 100 / 12
    const cuota =
      (saldoFinanciar * tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
      (Math.pow(1 + tasaMensual, plazoMeses) - 1)
    return cuota
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      const valorTotal = Number.parseFloat(formData.valorTotal)
      const enganche = Number.parseFloat(formData.enganche)
      const instalacion = Number.parseFloat(formData.instalacion)
      const saldoFinanciar = valorTotal - enganche - instalacion
      const plazoMeses = Number.parseInt(formData.plazoMeses)
      const cuotaMensual = calcularCuota(saldoFinanciar, plazoMeses)

      const loteData = {
        manzana: formData.manzana,
        lote: formData.lote,
        metrosCuadrados: Number.parseFloat(formData.metrosCuadrados),
        valorTotal,
        enganche,
        instalacion,
        saldoFinanciar,
        plazoMeses,
        cuotaMensual,
        estado: 'disponible'
      }

      if (selectedLote) {
        // Actualizar lote existente
        const loteApi = mapLoteToApi(loteData)
        await lotesService.updateLote(parseInt(selectedLote.id), loteApi)
        
        // Recargar lotes
        const lotesApi = await lotesService.getLotesDisponibles()
        const lotesMapeados = lotesApi.map(mapLoteFromApi)
        setLotes(lotesMapeados)
        
        setIsEditDialogOpen(false)
      } else {
        // Crear nuevo lote
        const loteApi = mapLoteToApi(loteData)
        await lotesService.createLote(loteApi)
        
        // Recargar lotes
        const lotesApi = await lotesService.getLotesDisponibles()
        const lotesMapeados = lotesApi.map(mapLoteFromApi)
        setLotes(lotesMapeados)
        
        setIsCreateDialogOpen(false)
      }

      resetForm()
    } catch (err) {
      console.error('Error guardando lote:', err)
      setError('Error al guardar el lote. Por favor, intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      manzana: "",
      lote: "",
      metrosCuadrados: "",
      valorTotal: "",
      enganche: "",
      instalacion: "5000",
      plazoMeses: "36",
    })
    setSelectedLote(null)
  }

  const handleEdit = (lote: LoteDisponible) => {
    setSelectedLote(lote)
    setFormData({
      manzana: lote.manzana,
      lote: lote.lote,
      metrosCuadrados: lote.metrosCuadrados.toString(),
      valorTotal: lote.valorTotal.toString(),
      enganche: lote.enganche.toString(),
      instalacion: lote.instalacion.toString(),
      plazoMeses: lote.plazoMeses.toString(),
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await lotesService.deleteLote(parseInt(id))
      
      // Recargar lotes
      const lotesApi = await lotesService.getLotesDisponibles()
      const lotesMapeados = lotesApi.map(mapLoteFromApi)
      setLotes(lotesMapeados)
    } catch (err) {
      console.error('Error eliminando lote:', err)
      setError('Error al eliminar el lote. Por favor, intenta de nuevo.')
    }
  }

  const handleSimulation = (lote: LoteDisponible) => {
    setSelectedLote(lote)
    setSelectedPlazo("36") // Plazo por defecto
    setIsSimulationDialogOpen(true)
  }

  // Función para calcular cuota con plazo específico
  const calcularCuotaConPlazo = (saldoFinanciar: number, plazoMeses: number) => {
    const tasaAnual = configuracionActiva ? parseFloat(configuracionActiva.tasa_anual) : 12
    return lotesService.calcularCuotaMensual(saldoFinanciar + selectedLote!.enganche + selectedLote!.instalacion, selectedLote!.enganche, selectedLote!.instalacion, plazoMeses, tasaAnual)
  }

  // Función para calcular tabla de amortización
  const calcularTablaAmortizacion = (saldoFinanciar: number, plazoMeses: number) => {
    const tasaAnual = configuracionActiva ? parseFloat(configuracionActiva.tasa_anual) : 12
    return lotesService.calcularTablaAmortizacion(selectedLote!.valorTotal, selectedLote!.enganche, selectedLote!.instalacion, plazoMeses, tasaAnual)
  }



  const exportToExcel = () => {
    // Implementar exportación a Excel
    console.log("Exportando a Excel...")
  }

  const exportToPDF = () => {
    // Implementar exportación a PDF
    console.log("Exportando a PDF...")
  }

  const manzanas = Array.from(new Set(lotes.map((l) => l.manzana))).sort()

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando lotes...</span>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
        
        {/* Componente de debug para verificar el backend */}
        <div className="flex justify-center">
          <BackendStatus />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lotes Disponibles</h1>
          <p className="text-muted-foreground">Gestiona los lotes disponibles para venta</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Lote</DialogTitle>
                <DialogDescription>Ingresa los datos del nuevo lote disponible</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manzana">Manzana</Label>
                    <Select
                      value={formData.manzana}
                      onValueChange={(value) => setFormData({ ...formData, manzana: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la manzana" />
                      </SelectTrigger>
                      <SelectContent>
                        {opcionesManzanas.map((manzana) => (
                          <SelectItem key={manzana.id} value={manzana.nombre}>
                            {manzana.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lote">Lote</Label>
                    <Input
                      id="lote"
                      value={formData.lote}
                      onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                      placeholder="001, 002..."
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metros">Metros Cuadrados</Label>
                    <Input
                      id="metros"
                      type="number"
                      value={formData.metrosCuadrados}
                      onChange={(e) => setFormData({ ...formData, metrosCuadrados: e.target.value })}
                      placeholder="200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor Total (Q)</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valorTotal}
                      onChange={(e) => setFormData({ ...formData, valorTotal: e.target.value })}
                      placeholder="150000"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="enganche">Enganche (Q)</Label>
                    <Input
                      id="enganche"
                      type="number"
                      step="0.01"
                      value={formData.enganche}
                      onChange={(e) => setFormData({ ...formData, enganche: e.target.value })}
                      placeholder="30000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instalacion">Instalación - ½ Paja de Agua (Q)</Label>
                    <Input
                      id="instalacion"
                      type="number"
                      step="0.01"
                      value={formData.instalacion}
                      onChange={(e) => setFormData({ ...formData, instalacion: e.target.value })}
                      placeholder="5000"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plazo">Plazo de Financiamiento</Label>
                  <Select
                    value={formData.plazoMeses}
                    onValueChange={(value) => setFormData({ ...formData, plazoMeses: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el plazo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 meses</SelectItem>
                      <SelectItem value="24">24 meses</SelectItem>
                      <SelectItem value="36">36 meses</SelectItem>
                      <SelectItem value="48">48 meses</SelectItem>
                      <SelectItem value="60">60 meses</SelectItem>
                      <SelectItem value="72">72 meses</SelectItem>
                      <SelectItem value="84">84 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear Lote'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por manzana o lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterManzana} onValueChange={setFilterManzana}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Manzana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las manzanas</SelectItem>
                  {manzanasUnicas.map((manzana) => (
                    <SelectItem key={manzana} value={manzana}>
                      {`Manzana ${manzana}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {filteredLotes.length} lotes
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de lotes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Lotes Disponibles</CardTitle>
          <CardDescription>{filteredLotes.length} lotes disponibles para venta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manzana</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Mts²</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Enganche</TableHead>
                  <TableHead>Instalación</TableHead>
                  <TableHead>Saldo a Financiar</TableHead>
                  <TableHead>Plazo</TableHead>
                  <TableHead>Cuota Mensual</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLotes.map((lote) => (
                  <TableRow key={lote.id}>
                    <TableCell className="font-medium">{lote.manzana}</TableCell>
                    <TableCell>{lote.lote}</TableCell>
                    <TableCell>{lote.metrosCuadrados}</TableCell>
                    <TableCell>Q {lote.valorTotal.toLocaleString()}</TableCell>
                    <TableCell>Q {lote.enganche.toLocaleString()}</TableCell>
                    <TableCell>Q {lote.instalacion.toLocaleString()}</TableCell>
                    <TableCell>Q {lote.saldoFinanciar.toLocaleString()}</TableCell>
                    <TableCell>{lote.plazoMeses} meses</TableCell>
                    <TableCell>Q {lote.cuotaMensual.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSimulation(lote)}
                          title="Simular financiamiento"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(lote)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(lote.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginación */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={goToPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Lote</DialogTitle>
            <DialogDescription>Modifica los datos del lote seleccionado</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-manzana">Manzana</Label>
                <Select
                  value={formData.manzana}
                  onValueChange={(value) => setFormData({ ...formData, manzana: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la manzana" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcionesManzanas.map((manzana) => (
                      <SelectItem key={manzana.id} value={manzana.nombre}>
                        {manzana.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lote">Lote</Label>
                <Input
                  id="edit-lote"
                  value={formData.lote}
                  onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                  placeholder="001, 002..."
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-metros">Metros Cuadrados</Label>
                <Input
                  id="edit-metros"
                  type="number"
                  value={formData.metrosCuadrados}
                  onChange={(e) => setFormData({ ...formData, metrosCuadrados: e.target.value })}
                  placeholder="200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-valor">Valor Total (Q)</Label>
                <Input
                  id="edit-valor"
                  type="number"
                  step="0.01"
                  value={formData.valorTotal}
                  onChange={(e) => setFormData({ ...formData, valorTotal: e.target.value })}
                  placeholder="150000"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-enganche">Enganche (Q)</Label>
                <Input
                  id="edit-enganche"
                  type="number"
                  step="0.01"
                  value={formData.enganche}
                  onChange={(e) => setFormData({ ...formData, enganche: e.target.value })}
                  placeholder="30000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-instalacion">Instalación - ½ Paja de Agua (Q)</Label>
                <Input
                  id="edit-instalacion"
                  type="number"
                  step="0.01"
                  value={formData.instalacion}
                  onChange={(e) => setFormData({ ...formData, instalacion: e.target.value })}
                  placeholder="5000"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plazo">Plazo de Financiamiento</Label>
              <Select
                value={formData.plazoMeses}
                onValueChange={(value) => setFormData({ ...formData, plazoMeses: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el plazo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                  <SelectItem value="36">36 meses</SelectItem>
                  <SelectItem value="48">48 meses</SelectItem>
                  <SelectItem value="60">60 meses</SelectItem>
                  <SelectItem value="72">72 meses</SelectItem>
                  <SelectItem value="84">84 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de simulación */}
      <Dialog open={isSimulationDialogOpen} onOpenChange={setIsSimulationDialogOpen}>
        <DialogContent className="!w-[95vw] !max-w-[1400px] !max-h-[95vh] overflow-y-auto !sm:max-w-[1400px]">
          <DialogHeader>
            <DialogTitle>Simulador de Financiamiento</DialogTitle>
            <DialogDescription>
              Simula diferentes plazos de financiamiento para el lote {selectedLote?.manzana}-{selectedLote?.lote}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLote && (
            <div className="space-y-4">
              {/* Información del lote */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Información del Lote</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Manzana-Lote:</span>
                      <p>{selectedLote.manzana}-{selectedLote.lote}</p>
                    </div>
                    <div>
                      <span className="font-medium">Metros²:</span>
                      <p>{selectedLote.metrosCuadrados} m²</p>
                    </div>
                    <div>
                      <span className="font-medium">Valor Total:</span>
                      <p>Q {selectedLote.valorTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Saldo a Financiar:</span>
                      <p>Q {selectedLote.saldoFinanciar.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selector de plazo */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Seleccionar Plazo</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="plazo-simulacion">Plazo de Financiamiento</Label>
                      <Select value={selectedPlazo} onValueChange={setSelectedPlazo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el plazo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12 meses</SelectItem>
                          <SelectItem value="24">24 meses</SelectItem>
                          <SelectItem value="36">36 meses</SelectItem>
                          <SelectItem value="48">48 meses</SelectItem>
                          <SelectItem value="60">60 meses</SelectItem>
                          <SelectItem value="72">72 meses</SelectItem>
                          <SelectItem value="84">84 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Resumen de la simulación */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">
                          Q {calcularCuotaConPlazo(selectedLote.saldoFinanciar, parseInt(selectedPlazo)).toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-600">Cuota Mensual</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">
                          {selectedPlazo} meses
                        </div>
                        <div className="text-xs text-green-600">Plazo Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">
                          Q {(calcularCuotaConPlazo(selectedLote.saldoFinanciar, parseInt(selectedPlazo)) * parseInt(selectedPlazo)).toFixed(2)}
                        </div>
                        <div className="text-xs text-orange-600">Total a Pagar</div>
                      </div>
                    </div>
                    
                    {/* Información de tasas */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <div className="font-medium mb-1">Tasas de Interés:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium">Tasa Anual:</span> {configuracionActiva ? `${configuracionActiva.tasa_anual}%` : '12%'}
                          </div>
                          <div>
                            <span className="font-medium">Tasa Mensual:</span> {configuracionActiva ? `${(parseFloat(configuracionActiva.tasa_anual) / 12).toFixed(2)}%` : '1.00%'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabla de amortización */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tabla de Amortización (Primeros 12 meses)</CardTitle>
                  <CardDescription className="text-sm">
                    Desglose mensual del pago: capital, interés y saldo pendiente
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Mes</TableHead>
                            <TableHead className="text-xs">Cuota</TableHead>
                            <TableHead className="text-xs">Capital</TableHead>
                            <TableHead className="text-xs">Interés</TableHead>
                            <TableHead className="text-xs">Saldo Pendiente</TableHead>
                          </TableRow>
                        </TableHeader>
                                              <TableBody>
                          {calcularTablaAmortizacion(selectedLote.saldoFinanciar, parseInt(selectedPlazo)).map((fila) => (
                            <TableRow key={fila.mes}>
                              <TableCell className="font-medium text-xs">{fila.mes}</TableCell>
                              <TableCell className="text-xs">Q {fila.cuota.toFixed(2)}</TableCell>
                              <TableCell className="text-xs">Q {fila.capital.toFixed(2)}</TableCell>
                              <TableCell className="text-xs">Q {fila.interes.toFixed(2)}</TableCell>
                              <TableCell className="text-xs">Q {fila.saldoPendiente.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Comparación de plazos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Comparación de Plazos</CardTitle>
                  <CardDescription className="text-sm">
                    Compara la cuota mensual y total a pagar en diferentes plazos
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Plazo</TableHead>
                            <TableHead className="text-xs">Cuota Mensual</TableHead>
                            <TableHead className="text-xs">Total a Pagar</TableHead>
                            <TableHead className="text-xs">Interés Total</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {[12, 24, 36, 48, 60, 72, 84].map((plazo) => {
                          const cuota = calcularCuotaConPlazo(selectedLote.saldoFinanciar, plazo)
                          const total = cuota * plazo
                          const interesTotal = total - selectedLote.saldoFinanciar
                          const isSelected = parseInt(selectedPlazo) === plazo
                          
                          return (
                            <TableRow key={plazo} className={isSelected ? "bg-blue-50" : ""}>
                              <TableCell className={`font-medium text-xs ${isSelected ? "text-blue-600" : ""}`}>
                                {plazo} meses
                              </TableCell>
                              <TableCell className={`text-xs ${isSelected ? "text-blue-600" : ""}`}>
                                Q {cuota.toFixed(2)}
                              </TableCell>
                              <TableCell className={`text-xs ${isSelected ? "text-blue-600" : ""}`}>
                                Q {total.toFixed(2)}
                              </TableCell>
                              <TableCell className={`text-xs ${isSelected ? "text-blue-600" : ""}`}>
                                Q {interesTotal.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSimulationDialogOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
