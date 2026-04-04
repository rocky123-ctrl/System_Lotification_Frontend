"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Users, Wallet, Percent, CheckCircle2 } from "lucide-react"
import * as XLSX from "xlsx"

export default function PlanillasPage() {
  // Mock Data for Vendedores
  const vendedoresData = [
    { id: 1, nombre: "Carlos Méndez", ventasTotales: 150000, comisionPorcentaje: 5, estado: "pendiente" },
    { id: 2, nombre: "Lucía Hernández", ventasTotales: 220000, comisionPorcentaje: 5, estado: "pagado" },
    { id: 3, nombre: "Roberto Gómez", ventasTotales: 80000, comisionPorcentaje: 5, estado: "pendiente" },
  ]

  // Mock Data for Administradores
  const administradoresData = [
    { id: 101, nombre: "Ana López", cargo: "Gerente de Ventas", sueldoBase: 12000, deducciones: 579.60, estado: "pagado" },
    { id: 102, nombre: "Martín Fuentes", cargo: "Contador", sueldoBase: 8000, deducciones: 386.40, estado: "pendiente" },
    { id: 103, nombre: "Elena Castro", cargo: "Recepcionista", sueldoBase: 4000, deducciones: 193.20, estado: "pendiente" },
  ]

  const calcularComision = (ventas: number, porcentaje: number) => {
    return (ventas * porcentaje) / 100
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusBadge = (estado: string) => {
    if (estado === "pagado") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Pagado</Badge>
    }
    return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pendiente</Badge>
  }

  const handleExportExcel = () => {
    // Worksheet for Administrators
    const adminWS = XLSX.utils.json_to_sheet(administradoresData.map(emp => ({
      "ID": emp.id,
      "Nombre": emp.nombre,
      "Cargo": emp.cargo,
      "Sueldo Base (Q)": emp.sueldoBase,
      "Deducciones (Q)": emp.deducciones,
      "Sueldo Neto (Q)": emp.sueldoBase - emp.deducciones,
      "Estado": emp.estado.toUpperCase()
    })));

    // Styles/column widths for admin worksheet
    adminWS['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }
    ];

    // Worksheet for Sellers
    const sellerWS = XLSX.utils.json_to_sheet(vendedoresData.map(emp => ({
      "ID": emp.id,
      "Nombre": emp.nombre,
      "Ventas Totales (Q)": emp.ventasTotales,
      "Comisión (%)": emp.comisionPorcentaje,
      "Monto Comisión (Q)": calcularComision(emp.ventasTotales, emp.comisionPorcentaje),
      "Estado": emp.estado.toUpperCase()
    })));

    // Styles/column widths for seller worksheet
    sellerWS['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sellerWS, "Planilla Vendedores");
    XLSX.utils.book_append_sheet(wb, adminWS, "Planilla Administradores");

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Planilla_General_${dateStr}.xlsx`);
  }

  const totalComisiones = vendedoresData.reduce((acc, curr) => acc + calcularComision(curr.ventasTotales, curr.comisionPorcentaje), 0)
  const totalSueldos = administradoresData.reduce((acc, curr) => acc + (curr.sueldoBase - curr.deducciones), 0)
  const totalNomina = totalComisiones + totalSueldos

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Planillas de Pago</h1>
              <p className="text-muted-foreground mt-2">Gestiona el pago de sueldos para administradores y comisiones para vendedores.</p>
            </div>
            <Button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
              <Download className="h-4 w-4" />
              Exportar a Excel
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Nómina (Mes actual)</CardTitle>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalNomina)}</div>
                <p className="text-xs text-muted-foreground mt-1">Sueldos y comisiones combinados</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pago Administradores</CardTitle>
                <div className="bg-purple-100 p-2 rounded-full">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalSueldos)}</div>
                <p className="text-xs text-muted-foreground mt-1">Sueldos netos a pagar</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pago Vendedores</CardTitle>
                <div className="bg-orange-100 p-2 rounded-full">
                  <Percent className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalComisiones)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total de comisiones generadas</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="vendedores" className="w-full">
            <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="vendedores">Vendedores (Comisiones)</TabsTrigger>
              <TabsTrigger value="administradores">Administradores (Sueldos)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="vendedores" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Planilla de Vendedores</CardTitle>
                  <CardDescription>
                    Detalle de ventas computadas y comisiones a pagar asociadas a los vendedores.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Ventas Totales</TableHead>
                          <TableHead>Comisión (%)</TableHead>
                          <TableHead>Monto a Pagar</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendedoresData.map((emp) => (
                          <TableRow key={emp.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{emp.nombre}</TableCell>
                            <TableCell>{formatCurrency(emp.ventasTotales)}</TableCell>
                            <TableCell>{emp.comisionPorcentaje}%</TableCell>
                            <TableCell className="font-bold text-orange-600">
                              {formatCurrency(calcularComision(emp.ventasTotales, emp.comisionPorcentaje))}
                            </TableCell>
                            <TableCell>{getStatusBadge(emp.estado)}</TableCell>
                            <TableCell className="text-right">
                              {emp.estado === 'pendiente' ? (
                                <Button size="sm" variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
                                  <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar Pagado
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" disabled className="text-muted-foreground">
                                  Pagado
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="administradores" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Planilla de Administradores</CardTitle>
                  <CardDescription>
                    Detalle de sueldos fijos mensuales y deducciones de ley requeridas para administradores.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Sueldo Base</TableHead>
                          <TableHead>Deducciones</TableHead>
                          <TableHead>Sueldo Neto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {administradoresData.map((emp) => (
                          <TableRow key={emp.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{emp.nombre}</TableCell>
                            <TableCell className="text-muted-foreground">{emp.cargo}</TableCell>
                            <TableCell>{formatCurrency(emp.sueldoBase)}</TableCell>
                            <TableCell className="text-red-500">-{formatCurrency(emp.deducciones)}</TableCell>
                            <TableCell className="font-bold text-purple-600">
                              {formatCurrency(emp.sueldoBase - emp.deducciones)}
                            </TableCell>
                            <TableCell>{getStatusBadge(emp.estado)}</TableCell>
                            <TableCell className="text-right">
                              {emp.estado === 'pendiente' ? (
                                <Button size="sm" variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
                                  <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar Pagado
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" disabled className="text-muted-foreground">
                                  Pagado
                                </Button>
                              )}
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
