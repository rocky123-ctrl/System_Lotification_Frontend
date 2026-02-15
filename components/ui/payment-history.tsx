import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { History, Printer, Download, FileText } from 'lucide-react'

interface Pago {
  id: string
  loteId: string
  fecha: string
  monto: number
  capital: number
  interes: number
  saldoAnterior: number
  saldoNuevo: number
  numeroRecibo: string
}

interface LoteFinanciado {
  id: string
  numero: number
  manzana: string
  lote: string
  promitente: string
  totalidad: number
  enganche: number
  capitalCancelado: number
  interesCancelado: number
  saldo: number
  cuotasCanceladas: number
  cuotasPendientes: number
  fechaPago: string
  cuotaMensual: number
  plazoTotal: number
}

interface PaymentHistoryProps {
  lote: LoteFinanciado
  pagos: Pago[]
  onPrintReceipt: (pago: Pago) => void
  onDownloadReceipt: (pago: Pago) => void
}

export function PaymentHistory({ lote, pagos, onPrintReceipt, onDownloadReceipt }: PaymentHistoryProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const totalPagado = pagos.reduce((sum, pago) => sum + pago.monto, 0)
  const totalCapital = pagos.reduce((sum, pago) => sum + pago.capital, 0)
  const totalInteres = pagos.reduce((sum, pago) => sum + pago.interes, 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="!w-[95vw] !max-w-[1400px] !max-h-[90vh] overflow-y-auto !sm:max-w-[1400px]">
        <DialogHeader>
          <DialogTitle>Historial de Pagos</DialogTitle>
          <DialogDescription>
            Historial completo de pagos para {lote.promitente} - Lote {lote.manzana}-{lote.lote}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del lote */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Lote</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="font-medium">Promitente:</span>
                  <p>{lote.promitente}</p>
                </div>
                <div>
                  <span className="font-medium">Lote:</span>
                  <p>{lote.manzana}-{lote.lote}</p>
                </div>
                <div>
                  <span className="font-medium">Valor Total:</span>
                  <p>Q {lote.totalidad.toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium">Saldo Actual:</span>
                  <p>Q {lote.saldo.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de pagos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    Q {totalPagado.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">Total Pagado</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    Q {totalCapital.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600">Capital Pagado</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    Q {totalInteres.toLocaleString()}
                  </div>
                  <div className="text-sm text-orange-600">Interés Pagado</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de historial */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalle de Pagos</CardTitle>
              <CardDescription>
                {pagos.length} pagos registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Fecha</TableHead>
                      <TableHead className="w-32">Recibo</TableHead>
                      <TableHead className="w-28">Monto</TableHead>
                      <TableHead className="w-24">Capital</TableHead>
                      <TableHead className="w-24">Interés</TableHead>
                      <TableHead className="w-32">Saldo Anterior</TableHead>
                      <TableHead className="w-32">Saldo Nuevo</TableHead>
                      <TableHead className="w-20">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm">No hay pagos registrados</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagos.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell className="text-sm">
                            {new Date(pago.fecha).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {pago.numeroRecibo}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            Q {pago.monto.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            Q {pago.capital.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            Q {pago.interes.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            Q {pago.saldoAnterior.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            Q {pago.saldoNuevo.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onPrintReceipt(pago)}
                                title="Imprimir recibo"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDownloadReceipt(pago)}
                                title="Descargar recibo"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
