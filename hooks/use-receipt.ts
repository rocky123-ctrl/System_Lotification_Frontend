import { useCallback } from 'react'

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

export function useReceipt() {
  const printReceipt = useCallback((pago: Pago, lote: LoteFinanciado) => {
    // Crear una nueva ventana para imprimir
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir el recibo.')
      return
    }

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

    const receiptHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Pago - ${pago.numeroRecibo}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .company-info {
            font-size: 14px;
            color: #6b7280;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8fafc;
            border-radius: 8px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .payment-details {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .payment-total {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #e5e7eb;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 11px;
            color: #374151;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          }
          .print-button:hover {
            background-color: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">Imprimir Recibo</button>
        
        <div class="header">
          <div class="company-name">LOTIFICACIONES S.A.</div>
          <div class="company-info">
            Desarrollo Residencial "Villas del Valle"<br>
            Km 25.5 Carretera a El Salvador<br>
            Tel: (502) 2425-0000 | Email: info@lotificaciones.com
          </div>
        </div>

        <div class="receipt-info">
          <div>
            <strong>Recibo No.:</strong> ${pago.numeroRecibo}
          </div>
          <div>
            <strong>Fecha:</strong> ${formatDate(pago.fecha)}<br>
            <small>${formatTime(pago.fecha)}</small>
          </div>
        </div>

        <div class="section">
          <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
          <div class="grid-2">
            <div>
              <strong>Promitente:</strong><br>
              ${lote.promitente}
            </div>
            <div>
              <strong>Lote:</strong><br>
              ${lote.manzana}-${lote.lote}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">DETALLE DEL PAGO</div>
          <div class="payment-details">
            <div class="payment-row">
              <span>Saldo Anterior:</span>
              <span>${formatCurrency(pago.saldoAnterior)}</span>
            </div>
            <div class="payment-row">
              <span>Monto del Pago:</span>
              <span>${formatCurrency(pago.monto)}</span>
            </div>
            <div class="payment-row">
              <span>Capital:</span>
              <span>${formatCurrency(pago.capital)}</span>
            </div>
            <div class="payment-row">
              <span>Interés:</span>
              <span>${formatCurrency(pago.interes)}</span>
            </div>
            <div class="payment-total">
              <span>Saldo Nuevo:</span>
              <span>${formatCurrency(pago.saldoNuevo)}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">INFORMACIÓN ADICIONAL</div>
          <div class="grid-2">
            <div>
              <strong>Valor Total del Lote:</strong><br>
              ${formatCurrency(lote.totalidad)}
            </div>
            <div>
              <strong>Cuotas Canceladas:</strong><br>
              ${lote.cuotasCanceladas} de ${lote.cuotasCanceladas + lote.cuotasPendientes}
            </div>
            <div>
              <strong>Cuota Mensual:</strong><br>
              ${formatCurrency(lote.cuotaMensual)}
            </div>
            <div>
              <strong>Plazo Total:</strong><br>
              ${lote.plazoTotal} meses
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Este documento es un comprobante oficial de pago.</p>
          <p>Conserve este recibo para futuras referencias.</p>
          <div style="margin-top: 10px;">
            <span class="badge">Recibo Generado Electrónicamente</span>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    
    // Esperar a que se cargue el contenido antes de imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }, [])

  const downloadReceipt = useCallback((pago: Pago, lote: LoteFinanciado) => {
    // Para una implementación completa, aquí se usaría una librería como jsPDF
    // Por ahora, simulamos la descarga
    const receiptData = {
      numeroRecibo: pago.numeroRecibo,
      fecha: pago.fecha,
      promitente: lote.promitente,
      lote: `${lote.manzana}-${lote.lote}`,
      monto: pago.monto,
      capital: pago.capital,
      interes: pago.interes,
      saldoAnterior: pago.saldoAnterior,
      saldoNuevo: pago.saldoNuevo
    }

    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recibo-${pago.numeroRecibo}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  return {
    printReceipt,
    downloadReceipt
  }
}
