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
import { Search, Loader2, MapPin, Building2, ShoppingCart, PlusCircle } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { lotesService, type Lote } from "@/lib/lotes-service"
import { lotificacionService, type Lotificacion } from "@/lib/lotificacion-service"
import { getClientes, registrarCliente, type Cliente } from "@/lib/clientes-service"

interface LoteDisplay {
  id: number
  manzana: string
  numero_lote: string
  metros_cuadrados: number
  valor_total: number
  estado: 'disponible' | 'comercial_y_bodega' | string
}

export function Ventas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLotificacion, setSelectedLotificacion] = useState<number | null>(null)
  const [lotificaciones, setLotificaciones] = useState<Lotificacion[]>([])
  const [lotes, setLotes] = useState<LoteDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLotes, setIsLoadingLotes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVenderModalOpen, setIsVenderModalOpen] = useState(false)
  const [selectedLote, setSelectedLote] = useState<LoteDisplay | null>(null)

  // -- Modal Client & Payment State --
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
  const [isSubmittingVenta, setIsSubmittingVenta] = useState(false)
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

  const loadLotesParaVenta = useCallback(async () => {
    if (!selectedLotificacion) return
    try {
      setIsLoadingLotes(true)
      setError(null)
      // Buscar lotes disponibles y comerciales/bodega
      const [disponibles, comercialBodega] = await Promise.all([
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'disponible' }),
        lotesService.getLotes({ lotificacion: selectedLotificacion, estado: 'comercial_y_bodega' }),
      ])
      
      const todosLotes: LoteDisplay[] = [
        ...disponibles.map(l => ({ 
          id: l.id, 
          manzana: l.manzana_nombre || `Manzana ${l.manzana}`, 
          numero_lote: l.numero_lote, 
          metros_cuadrados: parseFloat(l.metros_cuadrados), 
          valor_total: parseFloat(l.valor_total), 
          estado: l.estado 
        })),
        ...comercialBodega.map(l => ({ 
          id: l.id, 
          manzana: l.manzana_nombre || `Manzana ${l.manzana}`, 
          numero_lote: l.numero_lote, 
          metros_cuadrados: parseFloat(l.metros_cuadrados), 
          valor_total: parseFloat(l.valor_total), 
          estado: l.estado 
        })),
      ]
      
      setLotes(todosLotes)
    } catch (err: any) {
      console.error('[Ventas] Error cargando lotes:', err)
      setError('Error al cargar los lotes para venta')
    } finally {
      setIsLoadingLotes(false)
    }
  }, [selectedLotificacion])

  useEffect(() => {
    loadLotesParaVenta()
  }, [loadLotesParaVenta])

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

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Badge variant="default" className="bg-green-500">Disponible</Badge>
      case 'comercial_y_bodega':
        return <Badge variant="default" className="bg-amber-800">Comercial y Bodega</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const handleOpenVender = async (lote: LoteDisplay) => {
    setSelectedLote(lote)
    setIsVenderModalOpen(true)
    setTipoPago('contado')
    setSelectedClienteId("")
    setIsCreatingCliente(false)
    setEnganche(0)
    setDescuento(0)
    setPlazoMeses(12)
    setTasaInteres(12)

    if (clientes.length === 0) {
      try {
        const res = await getClientes(1, 100)
        setClientes(res.clientes)
      } catch (err) {
        console.error("Error loading clients:", err)
      }
    }
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

  const handleVenderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClienteId) {
      alert("Por favor seleccione o registre un cliente para la venta.")
      return
    }
    setIsSubmittingVenta(true)
    // Simulando llamada API
    setTimeout(() => {
      alert(`¡Venta Exitosa!\nLote: ${selectedLote?.numero_lote}\nCliente: ${clientes.find(c => String(c.id) === selectedClienteId)?.nombres}\nTipo de Pago: ${tipoPago.toUpperCase()}`);
      setIsSubmittingVenta(false)
      setIsVenderModalOpen(false)
      setSelectedLote(null)
      loadLotesParaVenta() 
    }, 1000)
  }

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
          <h1 className="text-2xl font-bold text-foreground">Venta de Lotes</h1>
          <p className="text-muted-foreground">Realizar ventas de lotes disponibles, comerciales y de bodega.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Lotificación</CardTitle>
          <CardDescription>Elige la lotificación para ver los lotes listos para la venta</CardDescription>
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
          </div>
        </CardContent>
      </Card>

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
                <CardTitle>Lotes para Vender</CardTitle>
                <CardDescription>
                  {totalItems} lote{totalItems !== 1 ? 's' : ''} disponible{totalItems !== 1 ? 's' : ''}
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
                  {searchTerm ? 'No se encontraron lotes con ese criterio de búsqueda' : 'No hay lotes disponibles para esta lotificación'}
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
                        <TableHead className="w-[120px] text-center">Acciones</TableHead>
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
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              onClick={() => handleOpenVender(lote)}
                              variant="default"
                              size="sm"
                              className="w-full flex items-center justify-center gap-2"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Vender
                            </Button>
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

      {!selectedLotificacion && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Selecciona una lotificación para ver sus lotes listos para venta</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para "Vender" */}
      <Dialog open={isVenderModalOpen} onOpenChange={setIsVenderModalOpen}>
         <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Venta - Lote {selectedLote?.numero_lote}</DialogTitle>
            <DialogDescription>
              Procese la venta para este lote en la {selectedLote?.manzana}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
             {/* Sección Cliente */}
             <div className="space-y-3 bg-slate-50 p-4 rounded-md border">
               <div className="flex items-center justify-between">
                 <Label className="text-base font-semibold">1. Datos del Cliente</Label>
                 {!isCreatingCliente && (
                   <Button variant="outline" size="sm" onClick={() => setIsCreatingCliente(true)}>
                     <PlusCircle className="h-4 w-4 mr-1" /> Nuevo Cliente
                   </Button>
                 )}
               </div>
               
               {isCreatingCliente ? (
                 <div className="space-y-3 pt-2 border-t mt-2">
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <Label>Nombres *</Label>
                       <Input value={newCliente.nombres} onChange={e => setNewCliente({...newCliente, nombres: e.target.value})} placeholder="Ej. Juan Perez" />
                     </div>
                     <div className="space-y-1">
                       <Label>Apellidos *</Label>
                       <Input value={newCliente.apellidos} onChange={e => setNewCliente({...newCliente, apellidos: e.target.value})} placeholder="Ej. Lopez" />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <Label>DPI *</Label>
                       <Input value={newCliente.dpi} onChange={e => setNewCliente({...newCliente, dpi: e.target.value})} placeholder="Ej. 1234567890101" />
                     </div>
                     <div className="space-y-1">
                       <Label>NIT *</Label>
                       <Input value={newCliente.nit} onChange={e => setNewCliente({...newCliente, nit: e.target.value})} placeholder="Ej. 123456-7" />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <Label>Teléfono</Label>
                       <Input value={newCliente.telefono} onChange={e => setNewCliente({...newCliente, telefono: e.target.value})} placeholder="Ej. 55554444" />
                     </div>
                     <div className="space-y-1">
                       <Label>Email</Label>
                       <Input type="email" value={newCliente.email} onChange={e => setNewCliente({...newCliente, email: e.target.value})} placeholder="correo@ejemplo.com" />
                     </div>
                   </div>
                   <div className="space-y-1">
                     <Label>Dirección *</Label>
                     <Input value={newCliente.direccion} onChange={e => setNewCliente({...newCliente, direccion: e.target.value})} placeholder="Dirección completa..." />
                   </div>
                   <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingCliente(false)}>Cancelar</Button>
                     <Button type="button" size="sm" onClick={handleCreateCliente} disabled={isSubmittingCliente}>
                       {isSubmittingCliente ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cliente"}
                     </Button>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-2">
                   <Label>Seleccionar Cliente Existente</Label>
                   <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                     <SelectTrigger>
                       <SelectValue placeholder="Busque y seleccione un cliente..." />
                     </SelectTrigger>
                     <SelectContent>
                       {clientes.map(c => (
                         <SelectItem key={c.id} value={String(c.id)}>
                           {c.nombres} {c.apellidos} {c.telefono ? `- Télefono: ${c.telefono}` : ''}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               )}
             </div>

             {/* Sección Pago */}
             <div className="space-y-3 bg-slate-50 p-4 rounded-md border">
               <Label className="text-base font-semibold">2. Detalles de Pago</Label>
               
               <div className="grid grid-cols-2 gap-4 pt-2 mb-3">
                 <div className="space-y-2">
                   <Label>Enganche (Q)</Label>
                   <Input type="number" min="0" value={enganche} onChange={e => setEnganche(parseFloat(e.target.value) || 0)} />
                 </div>
                 <div className="space-y-2">
                   <Label>Descuento (Q)</Label>
                   <Input type="number" min="0" value={descuento} onChange={e => setDescuento(parseFloat(e.target.value) || 0)} />
                 </div>
               </div>
               
               <div className="space-y-2 pt-2 border-t">
                 <Label>Tipo de Pago Restante</Label>
                 <Select value={tipoPago} onValueChange={(v: "contado" | "financiado") => setTipoPago(v)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="contado">Al Contado</SelectItem>
                     <SelectItem value="financiado">Financiado (Crédito)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               {tipoPago === 'financiado' && (
                 <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-3">
                   <div className="space-y-2">
                     <Label>Plazo en meses</Label>
                     <Input type="number" min="1" value={plazoMeses} onChange={e => setPlazoMeses(parseInt(e.target.value) || 0)} />
                   </div>
                   <div className="space-y-2">
                     <Label>Tasa de Interés Anual (%)</Label>
                     <Input type="number" min="0" step="0.1" value={tasaInteres} onChange={e => setTasaInteres(parseFloat(e.target.value) || 0)} />
                   </div>
                 </div>
               )}
             </div>

             {/* Resumen */}
             <div className="space-y-3 p-4 border rounded-md bg-white">
               <Label className="text-base font-semibold block mb-2 border-b pb-2">Resumen Financiero</Label>
               
               {selectedLote && (() => {
                  const valorLote = selectedLote.valor_total;
                  const valorConDescuento = Math.max(0, valorLote - descuento);
                  const valorFinanciar = Math.max(0, valorConDescuento - enganche);
                  
                  // Tasa Efectiva Mensual = (1 + Tasa Anual Nominal)^(1/12) - 1
                  const tasaAnualDecimal = tasaInteres / 100;
                  const tasaMensualEfectiva = Math.pow(1 + tasaAnualDecimal, 1 / 12) - 1;
                  const tasaMensualEfectivaPorcentaje = tasaMensualEfectiva * 100;
                  
                  let cuotaFinal = 0;
                  if (tipoPago === 'financiado' && plazoMeses > 0 && valorFinanciar > 0) {
                      if (tasaMensualEfectiva > 0) {
                          cuotaFinal = (valorFinanciar * tasaMensualEfectiva * Math.pow(1 + tasaMensualEfectiva, plazoMeses)) /
                                       (Math.pow(1 + tasaMensualEfectiva, plazoMeses) - 1);
                      } else {
                          cuotaFinal = valorFinanciar / plazoMeses;
                      }
                  }

                  return (
                    <>
                      {/* 1. Valor del Lote */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">1. Valor del Lote {descuento > 0 ? '(con descuento aplicado)' : ''}</span>
                        <span className="font-medium text-base">
                          {descuento > 0 && (
                            <span className="line-through text-red-500 mr-2 text-xs">Q {valorLote.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                          )}
                          Q {valorConDescuento.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* 2. Enganche */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">2. Total de Enganche</span>
                        <span className="font-medium text-base text-blue-600">Q {enganche.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {/* 3. Valor a Financiar */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">3. Valor a Financiar</span>
                        <span className="font-semibold text-base">Q {valorFinanciar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {tipoPago === 'financiado' && (
                        <>
                          {/* 4. Plazo */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">4. Plazo en meses (y años)</span>
                            <span className="font-medium text-base">{plazoMeses} meses / {(plazoMeses / 12).toFixed(2)} años</span>
                          </div>
                          
                          {/* 5. Total de Pagos */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">5. Total de pagos a realizar</span>
                            <span className="font-medium text-base">{plazoMeses} pagos</span>
                          </div>

                          {/* 6. Tasas de Interes */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">6. Tasa Anual / Efectiva Mensual</span>
                            <span className="font-medium text-sm text-right">
                              {tasaInteres.toFixed(2)}% anual <br className="md:hidden"/> 
                              <span className="text-xs text-muted-foreground">({tasaMensualEfectivaPorcentaje.toFixed(4)}% mensual)</span>
                            </span>
                          </div>

                          {/* 7. Cuota Final */}
                          <div className="flex justify-between items-center text-sm pt-2 border-t mt-2">
                            <span className="text-muted-foreground font-semibold">7. Cuota Final Mensual</span>
                            <span className="font-bold text-lg text-green-600">Q {cuotaFinal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}
                      
                      {tipoPago === 'contado' && (
                        <div className="flex justify-between items-center text-sm pt-2 border-t mt-2">
                          <span className="text-muted-foreground font-semibold">Total a Pagar Hoy (Enganche + Contado Restante)</span>
                          <span className="font-bold text-lg text-green-600">Q {(enganche + valorFinanciar).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </>
                  );
               })()}
             </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsVenderModalOpen(false)} disabled={isSubmittingVenta}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleVenderSubmit} disabled={isSubmittingVenta || isCreatingCliente}>
              {isSubmittingVenta ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Confirmar Venta"}
            </Button>
          </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  )
}
