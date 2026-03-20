"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Search, User, UserPlus, FileText, FileEdit, Trash2, Wrench, Droplet, Zap, HardHat, Calendar, AlertCircle } from "lucide-react"

// Mock Data
const MOCK_CLIENTS = [
  { id: "1", nombre: "Juan Pérez", documento: "001-1234567-8", lote: "Lote M1-4", proyecto: "Residencial Los Pinos" },
  { id: "2", nombre: "María Gómez", documento: "001-9876543-2", lote: "Lote M2-12", proyecto: "Residencial Los Pinos" },
  { id: "3", nombre: "Carlos Rodríguez", documento: "001-5555555-5", lote: "Lote A-1", proyecto: "Villas del Mar" },
]

const MOCK_PAYMENTS = [
  { id: "p1", fecha: "2023-10-15", servicio: "Agua", monto: 25.0, referencia: "REC-001", estado: "Pagado" },
  { id: "p2", fecha: "2023-10-15", servicio: "Mantenimiento", monto: 50.0, referencia: "REC-002", estado: "Pagado" },
  { id: "p3", fecha: "2023-11-15", servicio: "Agua", monto: 25.0, referencia: "REC-034", estado: "Pagado" },
  { id: "p4", fecha: "2023-11-15", servicio: "Luz", monto: 45.5, referencia: "REC-035", estado: "Pendiente" },
]

export default function ServiciosPage() {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  
  // Dialog rules
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterProject, setFilterProject] = useState("all")

  // Which payment is being edited/deleted
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  const filteredClients = MOCK_CLIENTS.filter(c => {
    const matchesQuery = c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || c.documento.includes(searchQuery)
    const matchesProject = filterProject === "all" || c.proyecto === filterProject
    return matchesQuery && matchesProject
  })

  // Icons for services
  const getServiceIcon = (service: string) => {
    switch (service) {
      case "Agua": return <Droplet className="h-4 w-4 text-blue-500" />
      case "Luz": return <Zap className="h-4 w-4 text-yellow-500" />
      case "Mantenimiento": return <HardHat className="h-4 w-4 text-orange-500" />
      default: return <Wrench className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === "Pagado") return <Badge className="bg-green-500/10 text-green-600 border-green-200">Pagado</Badge>
    if (status === "Pendiente") return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Pendiente</Badge>
    return <Badge variant="outline">{status}</Badge>
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Servicios (agua, luz, mantenimiento)</h1>
              <p className="text-muted-foreground mt-2">Gestiona pagos de servicios por cliente</p>
            </div>
            
            {/* Always visible action but primary intent when client selected */}
            {selectedClient && (
              <Button onClick={() => setIsSearchOpen(true)} variant="outline" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar otro cliente
              </Button>
            )}
          </div>

          {/* Dialog for selecting client */}
          <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>Buscar Cliente</DialogTitle>
                <DialogDescription>
                  Utiliza los filtros o la barra de búsqueda para encontrar al cliente deseado.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col gap-4 py-4 overflow-hidden flex-1">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por nombre o documento..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue placeholder="Proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los proyectos</SelectItem>
                      <SelectItem value="Residencial Los Pinos">Residencial Los Pinos</SelectItem>
                      <SelectItem value="Villas del Mar">Villas del Mar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="rounded-md border mt-2 flex-1 overflow-hidden flex flex-col">
                  <div className="overflow-auto max-h-[50vh] w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Nombre</TableHead>
                          <TableHead className="whitespace-nowrap">Documento</TableHead>
                          <TableHead className="whitespace-nowrap">Proyecto / Lote</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No se encontraron clientes
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredClients.map((client) => (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium whitespace-nowrap">{client.nombre}</TableCell>
                              <TableCell className="whitespace-nowrap">{client.documento}</TableCell>
                              <TableCell className="min-w-[150px]">
                                <div className="flex flex-col">
                                  <span className="text-sm truncate">{client.proyecto}</span>
                                  <span className="text-xs text-muted-foreground">{client.lote}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedClient(client)
                                    setIsSearchOpen(false)
                                  }}
                                >
                                  Seleccionar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsSearchOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Main Content Area */}
          {!selectedClient ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ningún cliente seleccionado</h3>
              <p className="text-muted-foreground max-w-[450px] mb-6">
                Para ver el historial de pagos de servicios y registrar o editar nuevos pagos, primero debes usar el buscador.
              </p>
              <Button onClick={() => setIsSearchOpen(true)} size="lg" className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar y Seleccionar Cliente
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Selected Client Card */}
              <Card className="bg-card">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                        {selectedClient.nombre.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">{selectedClient.nombre}</h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> {selectedClient.documento}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="font-medium text-foreground">{selectedClient.proyecto}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{selectedClient.lote}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payments Controls and List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                  <div>
                    <CardTitle>Historial de Servicios</CardTitle>
                    <CardDescription>Registro de pagos de servicios para este cliente</CardDescription>
                  </div>
                  <Button onClick={() => setIsRegisterOpen(true)} className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Registrar Pago
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto max-w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Fecha</TableHead>
                            <TableHead className="whitespace-nowrap">Servicio</TableHead>
                            <TableHead className="whitespace-nowrap">Referencia</TableHead>
                            <TableHead className="whitespace-nowrap">Estado</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Monto</TableHead>
                            <TableHead className="text-center whitespace-nowrap">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {MOCK_PAYMENTS.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  {payment.fecha}
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-2 font-medium">
                                  <div className="flex-shrink-0">{getServiceIcon(payment.servicio)}</div>
                                  {payment.servicio}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap">{payment.referencia}</TableCell>
                              <TableCell className="whitespace-nowrap">{getStatusBadge(payment.estado)}</TableCell>
                              <TableCell className="text-right font-semibold whitespace-nowrap">${payment.monto.toFixed(2)}</TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setSelectedPayment(payment)
                                      setIsEditOpen(true)
                                    }}
                                    title="Editar"
                                  >
                                    <FileEdit className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setSelectedPayment(payment)
                                      setIsDeleteOpen(true)
                                    }}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dialogs for CRUD operations */}
          
          {/* Register Payment Dialog */}
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Pago de Servicio</DialogTitle>
                <DialogDescription>
                  Ingresa los detalles del pago para {selectedClient?.nombre}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="service">Tipo de Servicio</Label>
                  <Select defaultValue="Agua">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agua">Agua</SelectItem>
                      <SelectItem value="Luz">Luz eléctrica</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento general</SelectItem>
                      <SelectItem value="Otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Monto ($)</Label>
                    <Input id="amount" type="number" placeholder="0.00" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" className="w-full text-foreground" style={{ colorScheme: "dark light" }} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reference">Número de Referencia / Recibo</Label>
                  <Input id="reference" placeholder="Ej. REC-005" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select defaultValue="Pagado">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pagado">Pagado</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsRegisterOpen(false)}>Cancelar</Button>
                <Button className="w-full sm:w-auto" onClick={() => setIsRegisterOpen(false)}>Guardar Registro</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Payment Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Registro</DialogTitle>
                <DialogDescription>
                  Modifica los detalles del pago {selectedPayment?.referencia}.
                </DialogDescription>
              </DialogHeader>
              {selectedPayment && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-service">Tipo de Servicio</Label>
                    <Select defaultValue={selectedPayment.servicio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Agua">Agua</SelectItem>
                        <SelectItem value="Luz">Luz eléctrica</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento general</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-amount">Monto ($)</Label>
                      <Input id="edit-amount" type="number" defaultValue={selectedPayment.monto} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-date">Fecha</Label>
                      <Input id="edit-date" type="date" defaultValue={selectedPayment.fecha} className="w-full text-foreground" style={{ colorScheme: "dark light" }} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-reference">Número de Referencia / Recibo</Label>
                    <Input id="edit-reference" defaultValue={selectedPayment.referencia} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Estado</Label>
                    <Select defaultValue={selectedPayment.estado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pagado">Pagado</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                <Button className="w-full sm:w-auto" onClick={() => setIsEditOpen(false)}>Actualizar Cambios</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Warning Dialog */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="sm:max-w-md w-[95vw]">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Confirmar Eliminación
                </DialogTitle>
                <DialogDescription>
                  ¿Estás seguro que deseas eliminar el registro de {selectedPayment?.servicio} por ${selectedPayment?.monto?.toFixed(2)}{" "}
                  {selectedPayment?.referencia ? `con referencia ${selectedPayment.referencia}` : ""}? Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 sm:justify-end flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setIsDeleteOpen(false)}>Eliminar Registro</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

