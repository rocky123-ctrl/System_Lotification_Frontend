"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TablePagination } from "@/components/ui/table-pagination"
import { CreditCard, Loader2, AlertCircle, CheckCircle2, ArrowLeft, CheckSquare } from "lucide-react"
import { planillasService, type LiquidacionComision } from "@/lib/planillas-service"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useRouter, useParams, useSearchParams } from "next/navigation"

export default function HistorialVendedorPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  const vendedorId = params.vendedorId as string
  const mes = searchParams.get('mes') || "all"
  const anio = searchParams.get('anio') || "all"

  // State for data
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionComision[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // State for selections
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // State for Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [payingIds, setPayingIds] = useState<number[]>([]) // Array of IDs to pay
  const [referenciaPago, setReferenciaPago] = useState("")
  const [paying, setPaying] = useState(false)

  const fetchLiquidaciones = useCallback(async () => {
    setLoading(true)
    try {
      const response = await planillasService.getLiquidaciones({
        vendedor: vendedorId,
        anio,
        mes,
        page
      })
      setLiquidaciones(response.results)
      setTotalItems(response.count)
      // Clear selections on page change/refresh
      setSelectedIds(new Set())
    } catch (err) {
      console.error("Error fetching liquidations:", err)
      toast.error("No se pudieron cargar las liquidaciones del vendedor")
    } finally {
      setLoading(false)
    }
  }, [vendedorId, anio, mes, page])

  useEffect(() => {
    if (vendedorId) {
      fetchLiquidaciones()
    }
  }, [fetchLiquidaciones, vendedorId])

  // Select all logic
  const pendientesActuales = useMemo(() => {
    return liquidaciones.filter(l => l.estado_pago === 'PENDIENTE')
  }, [liquidaciones])

  const allSelected = pendientesActuales.length > 0 && selectedIds.size === pendientesActuales.length
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set<number>()
      pendientesActuales.forEach(l => newSelected.add(l.id))
      setSelectedIds(newSelected)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (checked: boolean, id: number) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  // Payment triggers
  const initiateSinglePayment = (id: number) => {
    setPayingIds([id])
    setReferenciaPago("")
    setShowPaymentModal(true)
  }

  const initiateBulkPayment = () => {
    if (selectedIds.size === 0) return
    setPayingIds(Array.from(selectedIds))
    setReferenciaPago("")
    setShowPaymentModal(true)
  }

  const handlePagar = async () => {
    if (payingIds.length === 0) return
    setPaying(true)
    try {
      if (payingIds.length === 1) {
        // Individual
        await planillasService.pagarLiquidacion(payingIds[0], referenciaPago)
      } else {
        // Masivo
        await planillasService.pagarLiquidacionesMultiples(payingIds, referenciaPago)
      }
      toast.success(payingIds.length > 1 ? "Pagos masivos registrados exitosamente" : "Pago registrado exitosamente")
      setShowPaymentModal(false)
      fetchLiquidaciones()
    } catch (err) {
      console.error("Error paying:", err)
      toast.error("Error al registrar el pago")
    } finally {
      setPaying(false)
    }
  }

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatDate = (s: string) => {
    if (!s) return "—"
    return new Date(s).toLocaleDateString("es-GT", { dateStyle: "short" })
  }

  // Get seller name from the first record if available
  const vendedorNombre = liquidaciones.length > 0 ? liquidaciones[0].vendedor_nombre : 'Vendedor'
  
  const amountToPay = payingIds.reduce((total, id) => {
    const liq = liquidaciones.find(l => l.id === id)
    return total + (liq ? parseFloat(liq.monto_pagado) : 0)
  }, 0)

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.push('/planillas')} className="h-10 w-10 shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Historial de Comisiones</h1>
                <p className="text-muted-foreground">
                  Mostrando ventas de <span className="font-bold text-slate-800">{vendedorNombre}</span> para el periodo {mes}/{anio}.
                </p>
              </div>
            </div>
            {selectedIds.size > 0 && (
              <Button 
                onClick={initiateBulkPayment} 
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg animate-in zoom-in-95 duration-200"
              >
                <CheckSquare className="h-4 w-4" />
                Pagar Seleccionadas ({selectedIds.size})
              </Button>
            )}
          </div>

          <Card className="shadow-md">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Liquidaciones Individuales</CardTitle>
                  <CardDescription>Detalle por venta y estado de comisión.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">
                        <Checkbox 
                          checked={pendientesActuales.length > 0 && allSelected}
                          onCheckedChange={handleSelectAll}
                          disabled={pendientesActuales.length === 0}
                          aria-label="Seleccionar todas las pendientes"
                        />
                      </TableHead>
                      <TableHead className="font-bold">Venta / Lote</TableHead>
                      <TableHead className="font-bold">Fecha Venta</TableHead>
                      <TableHead className="font-bold">Comisión</TableHead>
                      <TableHead className="font-bold">Estado</TableHead>
                      <TableHead className="text-right font-bold h-[50px] pr-8">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Cargando detalles...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : liquidaciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">No se encontraron liquidaciones.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      liquidaciones.map((liq) => (
                        <TableRow key={liq.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-center">
                            {liq.estado_pago === 'PENDIENTE' && (
                              <Checkbox 
                                checked={selectedIds.has(liq.id)}
                                onCheckedChange={(checked) => handleSelectOne(checked as boolean, liq.id)}
                                aria-label={`Seleccionar comisión V-${liq.venta}`}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">Lote: {liq.lote_numero}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">Ticket: V-{liq.venta}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(liq.fecha_venta)}</TableCell>
                          <TableCell>
                            <span className="font-bold text-orange-600">{formatCurrency(liq.monto_pagado)}</span>
                          </TableCell>
                          <TableCell>
                            {liq.estado_pago === 'PAGADO' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-3 font-semibold">
                                Pagado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 border-slate-300 bg-slate-50 px-3">
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            {liq.estado_pago === 'PENDIENTE' ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-primary/30 hover:bg-primary/5 text-primary font-bold h-8"
                                onClick={() => initiateSinglePayment(liq.id)}
                              >
                                <CreditCard className="h-3 w-3 mr-1.5" />
                                Pagar
                              </Button>
                            ) : (
                              <div className="flex flex-col items-end text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                  <CheckCircle2 className="h-3 w-3" /> {formatDate(liq.fecha_pago || "")}
                                </span>
                                {liq.referencia_pago && <span className="italic">Ref: {liq.referencia_pago}</span>}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {!loading && totalItems > 0 && (
                <div className="p-4 border-t">
                  <TablePagination 
                    currentPage={page}
                    totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={totalItems}
                    startIndex={(page - 1) * ITEMS_PER_PAGE + 1}
                    endIndex={Math.min(page * ITEMS_PER_PAGE, totalItems)}
                    onPageChange={setPage}
                    onItemsPerPageChange={() => {}}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal Pago */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                Registrar Pago
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                Está a punto de pagar {payingIds.length === 1 ? "una comisión" : <span className="font-bold text-slate-800">{payingIds.length} comisiones</span>} por un total de{" "}
                <span className="font-bold text-orange-600">{formatCurrency(amountToPay)}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 mt-2">
              <div className="grid gap-2">
                <Label htmlFor="referencia" className="font-bold">Referencia de Pago / Comprobante (Opcional)</Label>
                <Input
                  id="referencia"
                  placeholder="Ej. Cheque #123, Transf. Bac..."
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  className="h-11 border-slate-300 focus-visible:ring-primary/20"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Se aplicará esta referencia a {payingIds.length === 1 ? "la comisión seleccionada" : "todas las comisiones seleccionadas"}. Las comisiones pasarán a estado <strong>PAGADO</strong>.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="ghost" 
                onClick={() => setShowPaymentModal(false)}
                disabled={paying}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handlePagar} 
                disabled={paying}
                className="bg-primary hover:bg-primary/90 font-bold px-8 shadow-md"
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Pago"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
