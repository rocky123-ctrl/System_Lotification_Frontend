"use client"

import React, { useState } from "react"
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
import { Calendar, ArrowLeft, Info, ReceiptText, RefreshCw } from "lucide-react"

// Mock Data Structure
const mockClients = [
  { id: 1, nombre: "Juan Pérez", dpi: "1234 56789 0101", telefono: "5555-1234" },
  { id: 2, nombre: "María González", dpi: "9876 54321 0101", telefono: "5555-4321" },
  { id: 3, nombre: "Carlos Rodríguez", dpi: "5678 12345 0101", telefono: "5555-8765" },
];

const mockLotsByClient: Record<number, any[]> = {
  1: [
    { id: 101, numeroLote: "A-15", proyecto: "Residenciales El Bosque", estado: "Pagando" },
    { id: 102, numeroLote: "B-22", proyecto: "Residenciales El Bosque", estado: "Completado" }
  ],
  2: [
    { id: 201, numeroLote: "C-10", proyecto: "Vistas del Valle", estado: "Pagando" }
  ],
  3: [
    { id: 301, numeroLote: "A-02", proyecto: "Colinas Verdes", estado: "Pagando" },
    { id: 302, numeroLote: "C-05", proyecto: "Colinas Verdes", estado: "Completado" }
  ]
};

const mockCuotasByLot: Record<number, any[]> = {
  101: [
    { id: 1001, numero: 1, fechaPago: "2026-01-20", monto: 1500, estado: "pagado" },
    { id: 1002, numero: 2, fechaPago: "2026-02-20", monto: 1500, estado: "pagado" },
    { id: 1003, numero: 3, fechaPago: "2026-03-20", monto: 1500, estado: "vencido" },
    { id: 1004, numero: 4, fechaPago: "2026-04-20", monto: 1500, estado: "pendiente" },
  ],
  102: [
    { id: 2001, numero: 1, fechaPago: "2025-01-20", monto: 1500, estado: "pagado" },
    { id: 2002, numero: 2, fechaPago: "2025-02-20", monto: 1500, estado: "pagado" },
  ],
  201: [
    { id: 3001, numero: 1, fechaPago: "2026-03-25", monto: 1200, estado: "vencido" },
    { id: 3002, numero: 2, fechaPago: "2026-04-25", monto: 1200, estado: "pendiente" },
  ],
  301: [
    { id: 4001, numero: 1, fechaPago: "2026-02-15", monto: 1800, estado: "pagado" },
    { id: 4002, numero: 2, fechaPago: "2026-03-15", monto: 1800, estado: "vencido" },
  ],
  302: [
    { id: 5001, numero: 1, fechaPago: "2025-10-10", monto: 2000, estado: "pagado" },
  ]
};

const mockCambiosByLot: Record<number, any[]> = {
  101: [
    { id: 1, numero: 1, fecha: "2026-02-15", descripcion: "Cambio de titular del lote" }
  ],
  201: [
    { id: 2, numero: 1, fecha: "2026-03-01", descripcion: "Ajuste de tasa de interés" }
  ],
};

type ViewState = 'clients' | 'client_details';

export default function CuentasPorCobrarPage() {
  const [currentView, setCurrentView] = useState<ViewState>('clients')
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [expandedLotId, setExpandedLotId] = useState<number | null>(null)
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null)
  const [compensationPrc, setCompensationPrc] = useState<number>(0)

  const handleRevisarHistorial = (client: any) => {
    setSelectedClient(client)
    setCurrentView('client_details')
    setExpandedLotId(null)
  }

  const handleVolver = () => {
    setCurrentView('clients')
    setSelectedClient(null)
    setExpandedLotId(null)
  }

  const toggleExpandLot = (lotId: number) => {
    setExpandedLotId(prev => prev === lotId ? null : lotId)
  }

  const handleOpenPayment = (installment: any) => {
    setSelectedInstallment(installment)
    setCompensationPrc(0)
    setIsPaymentModalOpen(true)
  }

  const getBadgeForInstallmentStatus = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "vencido": return <Badge variant="destructive">Vencido</Badge>
      case "pendiente": return <Badge variant="outline" className="border-blue-500 text-blue-600">Pendiente</Badge>
      case "pagado": return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent">Pagado</Badge>
      default: return <Badge>{estado}</Badge>
    }
  }

  const getBadgeForLotStatus = (estado: string) => {
    if (estado.toLowerCase() === 'completado') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border-transparent">Completado</Badge>
    }
    return <Badge variant="outline" className="border-blue-500 text-blue-600">Pagando</Badge>
  }

  const calculateTotalAmount = () => {
    if (!selectedInstallment) return 0;
    const isVencido = selectedInstallment.estado.toLowerCase() === 'vencido';
    const baseAmount = selectedInstallment.monto;
    const compensation = isVencido ? (baseAmount * (compensationPrc / 100)) : 0;
    return baseAmount + compensation;
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

          {currentView === 'clients' && (
            <Card>
              <CardHeader>
                <CardTitle>Listado de Clientes</CardTitle>
                <CardDescription>
                  Seleccione un cliente para revisar la información de sus lotes y cuotas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Nombre del Cliente</TableHead>
                        <TableHead>DPI</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockClients.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell className="font-medium">{cliente.nombre}</TableCell>
                          <TableCell>{cliente.dpi}</TableCell>
                          <TableCell>{cliente.telefono}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => handleRevisarHistorial(cliente)}>
                              Revisar Historial
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {currentView === 'client_details' && selectedClient && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handleVolver} title="Regresar a clientes">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">{selectedClient.nombre}</h2>
                  <p className="text-sm text-muted-foreground">Revisión de lotes y cuotas del cliente</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Lotes del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Lote</TableHead>
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(mockLotsByClient[selectedClient.id] || []).map((lote) => (
                          <React.Fragment key={lote.id}>
                            <TableRow className={expandedLotId === lote.id ? "bg-muted/30" : ""}>
                              <TableCell className="font-semibold text-blue-600">{lote.numeroLote}</TableCell>
                              <TableCell>{lote.proyecto}</TableCell>
                              <TableCell>{getBadgeForLotStatus(lote.estado)}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant={expandedLotId === lote.id ? "secondary" : "outline"} 
                                  size="sm" 
                                  onClick={() => toggleExpandLot(lote.id)}
                                >
                                  {expandedLotId === lote.id ? "Ocultar Detalles" : "Revisar"}
                                </Button>
                              </TableCell>
                            </TableRow>
                            
                            {expandedLotId === lote.id && (
                              <TableRow className="bg-slate-50/50">
                                <TableCell colSpan={4} className="p-0">
                                  <div className="p-6 space-y-6">
                                    
                                    {/* Módulo de Cuotas */}
                                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                      <div className="bg-slate-100 px-4 py-3 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                          <ReceiptText className="w-4 h-4" />
                                          Listado de Cuotas
                                        </div>
                                      </div>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-[100px]">No. Cuota</TableHead>
                                            <TableHead>Fecha de Pago</TableHead>
                                            <TableHead>Monto Base</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {(mockCuotasByLot[lote.id] || []).map((cuota) => {
                                            const isPayable = cuota.estado.toLowerCase() !== 'pagado';
                                            return (
                                              <TableRow key={cuota.id}>
                                                <TableCell className="font-medium text-center">{cuota.numero}</TableCell>
                                                <TableCell>
                                                  <span className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {cuota.fechaPago}
                                                  </span>
                                                </TableCell>
                                                <TableCell>Q {cuota.monto.toFixed(2)}</TableCell>
                                                <TableCell>{getBadgeForInstallmentStatus(cuota.estado)}</TableCell>
                                                <TableCell className="text-right">
                                                  {isPayable ? (
                                                    <Button size="sm" onClick={() => handleOpenPayment(cuota)}>Registrar Pago</Button>
                                                  ) : (
                                                    <span className="text-sm text-muted-foreground italic">Pagado</span>
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          })}
                                          {!(mockCuotasByLot[lote.id] || []).length && (
                                            <TableRow>
                                              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                No hay cuotas registradas.
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>

                                    {/* Módulo de Cambios */}
                                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                      <div className="bg-slate-100 px-4 py-3 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                          <RefreshCw className="w-4 h-4" />
                                          Restructuración / Cambios de Condiciones
                                        </div>
                                      </div>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-[150px]">No. Cambio</TableHead>
                                            <TableHead className="w-[150px]">Fecha</TableHead>
                                            <TableHead>Descripción</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {(mockCambiosByLot[lote.id] || []).map((cambio) => (
                                            <TableRow key={cambio.id}>
                                              <TableCell className="font-medium">Cambio #{cambio.numero}</TableCell>
                                              <TableCell>{cambio.fecha}</TableCell>
                                              <TableCell>{cambio.descripcion}</TableCell>
                                            </TableRow>
                                          ))}
                                          {!(mockCambiosByLot[lote.id] || []).length && (
                                            <TableRow>
                                              <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                No hay registros de cambios para este lote.
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>

                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                        {!(mockLotsByClient[selectedClient.id] || []).length && (
                           <TableRow>
                             <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                               Este cliente no tiene lotes registrados.
                             </TableCell>
                           </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
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
                      Pago para la <strong>Cuota #{selectedInstallment.numero}</strong>. <br/>
                      Vencimiento: {selectedInstallment.fechaPago}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              {selectedInstallment && (
                <div className="grid gap-4 py-4">
                  
                  {selectedInstallment.estado.toLowerCase() === 'vencido' && (
                    <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 border border-red-200">
                      <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">Cuota Vencida</p>
                        <p className="text-xs text-red-600 mt-1">Puede asignar un porcentaje de compensación (mora) por el retraso en el pago.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">Monto Base</Label>
                    <div className="col-span-3 px-3 py-2 bg-slate-100 rounded-md font-semibold font-mono">
                      Q {selectedInstallment.monto.toFixed(2)}
                    </div>
                  </div>

                  {selectedInstallment.estado.toLowerCase() === 'vencido' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="compensacion" className="text-right font-medium">Extra Mora (%)</Label>
                      <Input 
                        id="compensacion" 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={compensationPrc} 
                        onChange={(e) => setCompensationPrc(Number(e.target.value) || 0)}
                        className="col-span-3" 
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4 border-t pt-4">
                    <Label className="text-right font-bold text-lg">Total</Label>
                    <div className="col-span-3 text-2xl font-bold text-green-600">
                      Q {calculateTotalAmount().toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4 mt-2">
                    <Label htmlFor="metodo" className="text-right font-medium">Método</Label>
                    <Select defaultValue="efectivo">
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccione método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
                <Button type="button" onClick={() => {
                   setIsPaymentModalOpen(false)
                   // Ideally make an API call to update the installment status
                }}>Confirmar Pago</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
