"use client"

import type React from "react"

import { useState } from "react"
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
import { Plus, Search, Filter, Download, Edit, Trash2, CheckCircle, FileText, Award } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"

interface LotePagado {
  id: string
  numero: number
  manzana: string
  lote: string
  promitente: string
  area: number
  precio: number
  interesPagado: number
  escriturado: boolean
  finca: string
  folio: string
  libro: string
  escrituraNo: string
  fechaAutorizada: string
  fechaCompletoPago: string
}

export function LotesPagados() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterManzana, setFilterManzana] = useState("all") // Updated default value
  const [filterEscriturado, setFilterEscriturado] = useState("all") // Updated default value
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEscrituraDialogOpen, setIsEscrituraDialogOpen] = useState(false)
  const [selectedLote, setSelectedLote] = useState<LotePagado | null>(null)

  // Mock data - en producción vendría de la base de datos
  const [lotes, setLotes] = useState<LotePagado[]>([
    {
      id: "1",
      numero: 1,
      manzana: "A",
      lote: "001",
      promitente: "Juan Carlos Pérez",
      area: 200,
      precio: 150000,
      interesPagado: 18500,
      escriturado: true,
      finca: "12345",
      folio: "67",
      libro: "890",
      escrituraNo: "2024-001",
      fechaAutorizada: "2024-01-15",
      fechaCompletoPago: "2023-12-20",
    },
    {
      id: "2",
      numero: 2,
      manzana: "B",
      lote: "003",
      promitente: "María Elena González",
      area: 180,
      precio: 135000,
      interesPagado: 16200,
      escriturado: false,
      finca: "",
      folio: "",
      libro: "",
      escrituraNo: "",
      fechaAutorizada: "",
      fechaCompletoPago: "2024-01-10",
    },
    {
      id: "3",
      numero: 3,
      manzana: "A",
      lote: "005",
      promitente: "Roberto Silva Morales",
      area: 220,
      precio: 165000,
      interesPagado: 19800,
      escriturado: true,
      finca: "54321",
      folio: "89",
      libro: "123",
      escrituraNo: "2024-002",
      fechaAutorizada: "2024-02-01",
      fechaCompletoPago: "2024-01-25",
    },
    {
      id: "4",
      numero: 4,
      manzana: "C",
      lote: "002",
      promitente: "Ana Patricia Morales",
      area: 190,
      precio: 142500,
      interesPagado: 17100,
      escriturado: false,
      finca: "",
      folio: "",
      libro: "",
      escrituraNo: "",
      fechaAutorizada: "",
      fechaCompletoPago: "2024-02-05",
    },
  ])

  const [formData, setFormData] = useState({
    manzana: "",
    lote: "",
    promitente: "",
    area: "",
    precio: "",
    interesPagado: "",
    fechaCompletoPago: new Date().toISOString().split("T")[0],
  })

  const [escrituraData, setEscrituraData] = useState({
    finca: "",
    folio: "",
    libro: "",
    escrituraNo: "",
    fechaAutorizada: new Date().toISOString().split("T")[0],
  })

  // Filtrar lotes
  const filteredLotes = lotes.filter((lote) => {
    const matchesSearch =
      lote.promitente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.manzana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.lote.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesManzana = filterManzana === "all" || lote.manzana === filterManzana
    const matchesEscriturado =
      filterEscriturado === "all" ||
      (filterEscriturado === "true" && lote.escriturado) ||
      (filterEscriturado === "false" && !lote.escriturado)
    return matchesSearch && matchesManzana && matchesEscriturado
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const nuevoLote: LotePagado = {
      id: Date.now().toString(),
      numero: lotes.length + 1,
      manzana: formData.manzana,
      lote: formData.lote,
      promitente: formData.promitente,
      area: Number.parseFloat(formData.area),
      precio: Number.parseFloat(formData.precio),
      interesPagado: Number.parseFloat(formData.interesPagado),
      escriturado: false,
      finca: "",
      folio: "",
      libro: "",
      escrituraNo: "",
      fechaAutorizada: "",
      fechaCompletoPago: formData.fechaCompletoPago,
    }

    if (selectedLote) {
      setLotes(
        lotes.map((l) =>
          l.id === selectedLote.id ? { ...nuevoLote, id: selectedLote.id, numero: selectedLote.numero } : l,
        ),
      )
      setIsEditDialogOpen(false)
    } else {
      setLotes([...lotes, nuevoLote])
      setIsCreateDialogOpen(false)
    }

    resetForm()
  }

  const handleEscritura = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLote) return

    const loteActualizado: LotePagado = {
      ...selectedLote,
      escriturado: true,
      finca: escrituraData.finca,
      folio: escrituraData.folio,
      libro: escrituraData.libro,
      escrituraNo: escrituraData.escrituraNo,
      fechaAutorizada: escrituraData.fechaAutorizada,
    }

    setLotes(lotes.map((l) => (l.id === selectedLote.id ? loteActualizado : l)))

    setIsEscrituraDialogOpen(false)
    resetEscrituraForm()
    setSelectedLote(null)
  }

  const resetForm = () => {
    setFormData({
      manzana: "",
      lote: "",
      promitente: "",
      area: "",
      precio: "",
      interesPagado: "",
      fechaCompletoPago: new Date().toISOString().split("T")[0],
    })
    setSelectedLote(null)
  }

  const resetEscrituraForm = () => {
    setEscrituraData({
      finca: "",
      folio: "",
      libro: "",
      escrituraNo: "",
      fechaAutorizada: new Date().toISOString().split("T")[0],
    })
  }

  const handleEdit = (lote: LotePagado) => {
    setSelectedLote(lote)
    setFormData({
      manzana: lote.manzana,
      lote: lote.lote,
      promitente: lote.promitente,
      area: lote.area.toString(),
      precio: lote.precio.toString(),
      interesPagado: lote.interesPagado.toString(),
      fechaCompletoPago: lote.fechaCompletoPago,
    })
    setIsEditDialogOpen(true)
  }

  const handleEscriturar = (lote: LotePagado) => {
    setSelectedLote(lote)
    setEscrituraData({
      finca: lote.finca,
      folio: lote.folio,
      libro: lote.libro,
      escrituraNo: lote.escrituraNo,
      fechaAutorizada: lote.fechaAutorizada || new Date().toISOString().split("T")[0],
    })
    setIsEscrituraDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setLotes(lotes.filter((l) => l.id !== id))
  }

  const exportToExcel = () => {
    console.log("Exportando a Excel...")
  }

  const exportToPDF = () => {
    console.log("Exportando a PDF...")
  }

  const manzanas = Array.from(new Set(lotes.map((l) => l.manzana))).sort()

  // Estadísticas
  const totalPagados = lotes.length
  const totalEscriturados = lotes.filter((l) => l.escriturado).length
  const totalPendientesEscritura = lotes.filter((l) => !l.escriturado).length
  const montoTotalVentas = lotes.reduce((sum, l) => sum + l.precio, 0)
  const montoTotalIntereses = lotes.reduce((sum, l) => sum + l.interesPagado, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lotes Pagados Totalmente</h1>
          <p className="text-muted-foreground">
            Gestiona los lotes completamente pagados y su proceso de escrituración
          </p>
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
                Nuevo Lote Pagado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Lote Pagado Totalmente</DialogTitle>
                <DialogDescription>Ingresa los datos del lote que ha sido pagado completamente</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manzana">Manzana</Label>
                    <Input
                      id="manzana"
                      value={formData.manzana}
                      onChange={(e) => setFormData({ ...formData, manzana: e.target.value })}
                      placeholder="A, B, C..."
                      required
                    />
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
                <div className="space-y-2">
                  <Label htmlFor="promitente">Promitente/Comprador</Label>
                  <Input
                    id="promitente"
                    value={formData.promitente}
                    onChange={(e) => setFormData({ ...formData, promitente: e.target.value })}
                    placeholder="Nombre completo del comprador"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">Área (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio Total (Q)</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      placeholder="150000"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interesPagado">Interés Pagado (Q)</Label>
                    <Input
                      id="interesPagado"
                      type="number"
                      step="0.01"
                      value={formData.interesPagado}
                      onChange={(e) => setFormData({ ...formData, interesPagado: e.target.value })}
                      placeholder="18500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaCompletoPago">Fecha Completo Pago</Label>
                    <Input
                      id="fechaCompletoPago"
                      type="date"
                      value={formData.fechaCompletoPago}
                      onChange={(e) => setFormData({ ...formData, fechaCompletoPago: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Lote Pagado</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPagados}</div>
            <p className="text-xs text-muted-foreground">Lotes completamente pagados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escriturados</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{totalEscriturados}</div>
            <p className="text-xs text-muted-foreground">Con escritura finalizada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes Escritura</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{totalPendientesEscritura}</div>
            <p className="text-xs text-muted-foreground">Por escriturar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q {montoTotalVentas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Valor total vendido</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intereses Cobrados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q {montoTotalIntereses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total intereses</p>
          </CardContent>
        </Card>
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
                  placeholder="Buscar por promitente, manzana o lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterManzana} onValueChange={setFilterManzana}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Manzana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {manzanas.map((manzana) => (
                    <SelectItem key={manzana} value={manzana}>
                      Manzana {manzana}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEscriturado} onValueChange={setFilterEscriturado}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Escrituración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Escriturados</SelectItem>
                  <SelectItem value="false">Pendientes</SelectItem>
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

      {/* Tabla de lotes pagados */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Lotes Pagados Totalmente</CardTitle>
          <CardDescription>{filteredLotes.length} lotes completamente pagados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Manzana</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Promitente</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Interés Pagado</TableHead>
                  <TableHead>Escriturado</TableHead>
                  <TableHead>Finca</TableHead>
                  <TableHead>Folio</TableHead>
                  <TableHead>Libro</TableHead>
                  <TableHead>Escritura No.</TableHead>
                  <TableHead>Fecha Autorizada</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLotes.map((lote) => (
                  <TableRow key={lote.id}>
                    <TableCell className="font-medium">{lote.numero}</TableCell>
                    <TableCell>{lote.manzana}</TableCell>
                    <TableCell>{lote.lote}</TableCell>
                    <TableCell>{lote.promitente}</TableCell>
                    <TableCell>{lote.area} m²</TableCell>
                    <TableCell>Q {lote.precio.toLocaleString()}</TableCell>
                    <TableCell>Q {lote.interesPagado.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={lote.escriturado ? "default" : "secondary"}>
                        {lote.escriturado ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>{lote.finca || "-"}</TableCell>
                    <TableCell>{lote.folio || "-"}</TableCell>
                    <TableCell>{lote.libro || "-"}</TableCell>
                    <TableCell>{lote.escrituraNo || "-"}</TableCell>
                    <TableCell>
                      {lote.fechaAutorizada ? new Date(lote.fechaAutorizada).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!lote.escriturado && (
                          <Button variant="ghost" size="sm" onClick={() => handleEscriturar(lote)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
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

      {/* Dialog de escrituración */}
      <Dialog open={isEscrituraDialogOpen} onOpenChange={setIsEscrituraDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Escrituración</DialogTitle>
            <DialogDescription>
              Completa los datos de escrituración para {selectedLote?.promitente} - Lote {selectedLote?.manzana}-
              {selectedLote?.lote}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEscritura} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="finca">Finca</Label>
                <Input
                  id="finca"
                  value={escrituraData.finca}
                  onChange={(e) => setEscrituraData({ ...escrituraData, finca: e.target.value })}
                  placeholder="12345"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folio">Folio</Label>
                <Input
                  id="folio"
                  value={escrituraData.folio}
                  onChange={(e) => setEscrituraData({ ...escrituraData, folio: e.target.value })}
                  placeholder="67"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="libro">Libro</Label>
                <Input
                  id="libro"
                  value={escrituraData.libro}
                  onChange={(e) => setEscrituraData({ ...escrituraData, libro: e.target.value })}
                  placeholder="890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escrituraNo">Escritura No.</Label>
                <Input
                  id="escrituraNo"
                  value={escrituraData.escrituraNo}
                  onChange={(e) => setEscrituraData({ ...escrituraData, escrituraNo: e.target.value })}
                  placeholder="2024-001"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaAutorizada">Fecha Autorizada</Label>
              <Input
                id="fechaAutorizada"
                type="date"
                value={escrituraData.fechaAutorizada}
                onChange={(e) => setEscrituraData({ ...escrituraData, fechaAutorizada: e.target.value })}
                required
              />
            </div>
            {selectedLote && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Información del Lote</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Precio: Q {selectedLote.precio.toLocaleString()}</div>
                  <div>Área: {selectedLote.area} m²</div>
                  <div>Interés pagado: Q {selectedLote.interesPagado.toLocaleString()}</div>
                  <div>Fecha pago completo: {new Date(selectedLote.fechaCompletoPago).toLocaleDateString()}</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEscrituraDialogOpen(false)
                  resetEscrituraForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Registrar Escrituración</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Lote Pagado</DialogTitle>
            <DialogDescription>Modifica los datos del lote pagado seleccionado</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-manzana">Manzana</Label>
                <Input
                  id="edit-manzana"
                  value={formData.manzana}
                  onChange={(e) => setFormData({ ...formData, manzana: e.target.value })}
                  placeholder="A, B, C..."
                  required
                />
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
            <div className="space-y-2">
              <Label htmlFor="edit-promitente">Promitente/Comprador</Label>
              <Input
                id="edit-promitente"
                value={formData.promitente}
                onChange={(e) => setFormData({ ...formData, promitente: e.target.value })}
                placeholder="Nombre completo del comprador"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-area">Área (m²)</Label>
                <Input
                  id="edit-area"
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-precio">Precio Total (Q)</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  placeholder="150000"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-interesPagado">Interés Pagado (Q)</Label>
                <Input
                  id="edit-interesPagado"
                  type="number"
                  step="0.01"
                  value={formData.interesPagado}
                  onChange={(e) => setFormData({ ...formData, interesPagado: e.target.value })}
                  placeholder="18500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fechaCompletoPago">Fecha Completo Pago</Label>
                <Input
                  id="edit-fechaCompletoPago"
                  type="date"
                  value={formData.fechaCompletoPago}
                  onChange={(e) => setFormData({ ...formData, fechaCompletoPago: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
