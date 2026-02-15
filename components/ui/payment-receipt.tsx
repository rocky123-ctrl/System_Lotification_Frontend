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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Printer, Download, FileText, Building2, MapPin, Phone, Mail } from 'lucide-react'

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

interface PaymentReceiptProps {
  pago: Pago
  lote: LoteFinanciado
  onPrint: () => void
  onDownload: () => void
}

export function PaymentReceipt({ pago, lote, onPrint, onDownload }: PaymentReceiptProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-GT', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recibo de Pago</DialogTitle>
          <DialogDescription>
            Recibo No. {pago.numeroRecibo} - {formatDate(pago.fecha)}
          </DialogDescription>
        </DialogHeader>

        {/* Recibo imprimible */}
        <div className="bg-white border rounded-lg p-6 space-y-6" id="receipt-content">
          {/* Encabezado */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">LOTIFICACIONES S.A.</h1>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Desarrollo Residencial "Villas del Valle"</p>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Km 25.5 Carretera a El Salvador
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  (502) 2425-0000
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  info@lotificaciones.com
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información del recibo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Recibo No.</p>
              <p className="font-semibold">{pago.numeroRecibo}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="font-semibold">{formatDate(pago.fecha)}</p>
              <p className="text-xs text-gray-500">{formatTime(pago.fecha)}</p>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">INFORMACIÓN DEL CLIENTE</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Promitente:</p>
                <p className="font-medium">{lote.promitente}</p>
              </div>
              <div>
                <p className="text-gray-600">Lote:</p>
                <p className="font-medium">{lote.manzana}-{lote.lote}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Detalle del pago */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">DETALLE DEL PAGO</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Saldo Anterior:</span>
                <span className="font-medium">{formatCurrency(pago.saldoAnterior)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto del Pago:</span>
                <span className="font-medium">{formatCurrency(pago.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capital:</span>
                <span className="font-medium">{formatCurrency(pago.capital)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interés:</span>
                <span className="font-medium">{formatCurrency(pago.interes)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Saldo Nuevo:</span>
                <span>{formatCurrency(pago.saldoNuevo)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información adicional */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">INFORMACIÓN ADICIONAL</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Valor Total del Lote:</p>
                <p className="font-medium">{formatCurrency(lote.totalidad)}</p>
              </div>
              <div>
                <p className="text-gray-600">Cuotas Canceladas:</p>
                <p className="font-medium">{lote.cuotasCanceladas} de {lote.cuotasCanceladas + lote.cuotasPendientes}</p>
              </div>
              <div>
                <p className="text-gray-600">Cuota Mensual:</p>
                <p className="font-medium">{formatCurrency(lote.cuotaMensual)}</p>
              </div>
              <div>
                <p className="text-gray-600">Plazo Total:</p>
                <p className="font-medium">{lote.plazoTotal} meses</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pie del recibo */}
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              <p>Este documento es un comprobante oficial de pago.</p>
              <p>Conserve este recibo para futuras referencias.</p>
            </div>
            <div className="flex justify-center">
              <Badge variant="outline" className="text-xs">
                Recibo Generado Electrónicamente
              </Badge>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
