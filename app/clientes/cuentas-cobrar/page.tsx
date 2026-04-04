"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Download, FileText, CheckCircle2, DollarSign, Calendar, AlertTriangle } from "lucide-react"

export default function CuentasPorCobrarPage() {
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  // Mock Data
  const pendingInstallments = [
    { id: 1, cliente: "Juan Pérez", lote: "A-15", cuota: "12 de 36", vens: "2026-03-20", monto: "Q 1,500.00", estado: "vencido" },
    { id: 2, cliente: "María González", lote: "B-22", cuota: "5 de 24", vens: "2026-03-25", monto: "Q 1,200.00", estado: "proximo" },
    { id: 3, cliente: "Carlos Rodríguez", lote: "C-10", cuota: "20 de 60", vens: "2026-04-05", monto: "Q 2,000.00", estado: "pendiente" },
    { id: 4, cliente: "Ana López", lote: "A-02", cuota: "8 de 48", vens: "2026-03-15", monto: "Q 1,800.00", estado: "vencido" },
    { id: 5, cliente: "Luis Martínez", lote: "D-05", cuota: "3 de 12", vens: "2026-04-10", monto: "Q 900.00", estado: "pendiente" },
  ]

  const paymentHistory = [
    { id: 101, fecha: "2026-03-10", cliente: "Juan Pérez", lote: "A-15", recibo: "REC-202603-001", monto: "Q 1,500.00", metodo: "Transferencia" },
    { id: 102, fecha: "2026-03-08", cliente: "Carlos Rodríguez", lote: "C-10", recibo: "REC-202603-002", monto: "Q 2,000.00", metodo: "Efectivo" },
    { id: 103, fecha: "2026-03-05", cliente: "Elena Flores", lote: "B-18", recibo: "REC-202603-003", monto: "Q 1,100.00", metodo: "Cheque" },
  ]

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>
      case "proximo":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent">Próximo</Badge>
      case "pendiente":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Pendiente</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Cuentas por Cobrar</h1>
              <p className="text-muted-foreground mt-2">Gestiona y monitorea los saldos pendientes y pagos de clientes</p>
            </div>
            <Button variant="outline" className="flex items-center gap-2 border-gray-300">
              <Download className="h-4 w-4" />
              Generar Reporte
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pendiente
                </CardTitle>
                <div className="bg-blue-100 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Q 45,231.00</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +20.1% comparado con el mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pagos Vencidos
                </CardTitle>
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">12</div>
                <p className="text-xs text-red-500 mt-1">
                  Totalizando Q 14,300.00 en riesgo
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recibido este Mes
                </CardTitle>
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Q 22,400.00</div>
                <p className="text-xs text-green-500 mt-1">
                  85% de la proyección mensual
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pendientes" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pendientes">Cuotas Pendientes</TabsTrigger>
              <TabsTrigger value="historial">Historial de Pagos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pendientes" className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Atención requerida</h3>
                    <div className="mt-1 text-sm text-red-700">
                      <p>
                        Existen 12 cuotas vencidas que requieren seguimiento o envío de recordatorios.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Listado de Cuotas Pendientes</CardTitle>
                  <CardDescription>
                    Monitorea las cuotas de clientes y registra los pagos recibidos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Cuota</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead className="w-[120px]">Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingInstallments.length > 0 ? (
                          pendingInstallments.map((item) => (
                            <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">{item.cliente}</TableCell>
                              <TableCell>Lote {item.lote}</TableCell>
                              <TableCell>{item.cuota}</TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {item.vens}
                                </span>
                              </TableCell>
                              <TableCell className="font-semibold">{item.monto}</TableCell>
                              <TableCell>{getStatusBadge(item.estado)}</TableCell>
                              <TableCell className="text-right">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="default" onClick={() => setSelectedItem(item)}>
                                      Registrar Pago
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                      <DialogTitle>Registrar Pago</DialogTitle>
                                      <DialogDescription>
                                        Ingrese los detalles del pago para <strong>{item.cliente}</strong> (Lote {item.lote}).
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="monto" className="text-right font-medium">
                                          Monto
                                        </Label>
                                        <Input id="monto" defaultValue={item.monto.replace('Q ', '')} className="col-span-3 font-semibold" readOnly />
                                      </div>
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="metodo" className="text-right font-medium">
                                          Método
                                        </Label>
                                        <Select>
                                          <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Seleccione método" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="efectivo">Efectivo</SelectItem>
                                            <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                                            <SelectItem value="cheque">Cheque</SelectItem>
                                            <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="referencia" className="text-right font-medium">
                                          Referencia
                                        </Label>
                                        <Input id="referencia" placeholder="No. boleta, recibo o cheque" className="col-span-3" />
                                      </div>
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="fecha" className="text-right font-medium">
                                          Fecha
                                        </Label>
                                        <Input id="fecha" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="col-span-3" />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" type="button">Cancelar</Button>
                                      <Button type="submit">Confirmar Pago</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No hay cuotas pendientes.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="historial">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Pagos Consolidados</CardTitle>
                  <CardDescription>
                    Resumen de todos los pagos realizados por los clientes y comprobantes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2 w-full max-w-sm">
                      <Input placeholder="Buscar por cliente o recibo..." className="w-full" />
                      <Button variant="secondary">Buscar</Button>
                    </div>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Recibo</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentHistory.map((hist) => (
                          <TableRow key={hist.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>{hist.fecha}</TableCell>
                            <TableCell className="font-medium">{hist.cliente}</TableCell>
                            <TableCell>Lote {hist.lote}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono bg-slate-50">{hist.recibo}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{hist.metodo}</span>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">{hist.monto}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Ver Detalle">
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-slate-800 hover:bg-slate-100" title="Descargar PDF">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
