"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogContentWide,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PaymentHistory } from "@/components/ui/payment-history"
import { PaymentReceipt } from "@/components/ui/payment-receipt"
import { Plus, Search, Filter, Download, Edit, Trash2, CreditCard, Loader2, AlertTriangle, Clock, MoreHorizontal } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { useReceipt } from "@/hooks/use-receipt"
import { useConfiguracion } from "@/hooks/use-configuracion"
import { 
  financiamientoService, 
  mapFinanciamientoFromApi, 
  mapFinanciamientoToApi,
  type Financiamiento,
  type FinanciamientoCreate,
  type PagoMultiple,
  type PagoCapital
} from "@/lib/financiamiento-service"
import { lotesService, type Lote } from "@/lib/lotes-service"

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

// Nueva interfaz para cuotas con mora
interface CuotaConMora {
  id: number
  numero_cuota: number
  fecha_vencimiento: string
  monto_capital: number
  monto_interes: number
  monto_total: number
  monto_mora: number
  estado: 'pendiente' | 'pagada' | 'atrasada'
  dias_atraso: number
  seleccionada: boolean
}

export function LotesFinanciados() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterManzana, setFilterManzana] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPagoDialogOpen, setIsPagoDialogOpen] = useState(false)
  const [selectedLote, setSelectedLote] = useState<LoteFinanciado | null>(null)

  // Estados para el backend
  const [financiamientos, setFinanciamientos] = useState<Financiamiento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados para el formulario de creación
  const [formData, setFormData] = useState<FinanciamientoCreate>({
    lote_id: 0,
    promitente_comprador: "",
    totalidad: "",
    enganche: "",
    plazo_meses: 36,
    cuota_mensual: "",
    fecha_inicio_financiamiento: new Date().toISOString().split('T')[0]
  })

  // Estados para búsqueda de lote
  const [loteBuscado, setLoteBuscado] = useState<Lote | null>(null)
  const [isBuscandoLote, setIsBuscandoLote] = useState(false)
  const [manzanaBusqueda, setManzanaBusqueda] = useState("")
  const [numeroLoteBusqueda, setNumeroLoteBusqueda] = useState("")

  // Estado para pagos
  const [pagoData, setPagoData] = useState({
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    metodoPago: "Efectivo",
    personaPago: "",
    observaciones: "",
  })

  // Estados para pago a capital
  const [isPagoCapitalDialogOpen, setIsPagoCapitalDialogOpen] = useState(false)
  const [pagoCapitalData, setPagoCapitalData] = useState({
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    concepto: "Pago adelantado a capital",
  })

  // Nuevos estados para el sistema de pagos mejorado
  const [cuotasConMora, setCuotasConMora] = useState<CuotaConMora[]>([])
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState<number[]>([])
  const [montoTotalPago, setMontoTotalPago] = useState(0)
  const [montoMora, setMontoMora] = useState(0)
  const [isCalculandoMora, setIsCalculandoMora] = useState(false)
  const [isMoraDialogOpen, setIsMoraDialogOpen] = useState(false)
  const [resumenMora, setResumenMora] = useState<{
    cuotasAtrasadas: number
    diasAtrasoTotal: number
    montoMoraTotal: number
    porcentajeMora: number
  } | null>(null)

  // Estados para paginación de cuotas
  const [cuotasPage, setCuotasPage] = useState(1)
  const [cuotasPerPage, setCuotasPerPage] = useState(10)

  // Estados para paginación de financiamientos
  const [financiamientosPage, setFinanciamientosPage] = useState(1)
  const [financiamientosPerPage, setFinanciamientosPerPage] = useState(10)

  // Estado para pagos cargados del backend
  const [pagosCargados, setPagosCargados] = useState<{ [key: number]: any[] }>({})
  const [cargandoPagos, setCargandoPagos] = useState<{ [key: number]: boolean }>({})

  // Obtener configuración para cálculos
  const { configuracionActiva, configuracionFinanciera } = useConfiguracion()

  // Cargar financiamientos al montar el componente
  useEffect(() => {
    const cargarFinanciamientos = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await financiamientoService.getFinanciamientosActivos()
        console.log('Financiamientos cargados:', data)
        console.log('Primer financiamiento:', data[0])
        console.log('Campos del primer financiamiento:', {
          id: data[0]?.id,
          capital_cancelado: data[0]?.capital_cancelado,
          interes_cancelado: data[0]?.interes_cancelado,
          cuotas_canceladas: data[0]?.cuotas_canceladas,
          pagos: data[0]?.pagos?.length || 0
        })
        
        // Si algún financiamiento no tiene información del lote, cargarla por separado
        const financiamientosSinLote = data.filter(f => !f.lote)
        if (financiamientosSinLote.length > 0) {
          console.log('Financiamientos sin información de lote:', financiamientosSinLote)
          
          // Cargar información de lotes por separado
          const financiamientosConLotes = await Promise.all(
            data.map(async (financiamiento) => {
              if (!financiamiento.lote) {
                try {
                  // Obtener información del lote usando el servicio de lotes
                  const lotes = await lotesService.getLotesDisponibles()
                  const loteEncontrado = lotes.find(l => l.id === financiamiento.lote_id)
                  if (loteEncontrado) {
                    return {
                      ...financiamiento,
                      lote_info: {
                        id: loteEncontrado.id,
                        manzana: loteEncontrado.manzana.toString(),
                        manzana_nombre: loteEncontrado.manzana_nombre,
                        lote: loteEncontrado.numero_lote,
                        metros_cuadrados: parseFloat(loteEncontrado.metros_cuadrados),
                        valor_total: parseFloat(loteEncontrado.valor_total),
                        saldo_financiar: loteEncontrado.saldo_financiar,
                      }
                    } as Financiamiento
                  }
                } catch (err) {
                  console.error('Error cargando información del lote:', err)
                }
              }
              return financiamiento
            })
          )
          
          setFinanciamientos(financiamientosConLotes)
        } else {
          setFinanciamientos(data)
        }
      } catch (err: any) {
        console.error('Error cargando financiamientos:', err)
        setError(err.message || 'Error al cargar los financiamientos')
      } finally {
        setIsLoading(false)
      }
    }

    cargarFinanciamientos()
  }, [])

  // Función para buscar lote por manzana y número
  const buscarLote = async () => {
    if (!manzanaBusqueda || !numeroLoteBusqueda) {
      alert('Por favor ingresa la manzana y número de lote')
      return
    }

    try {
      setIsBuscandoLote(true)
      setLoteBuscado(null)

      console.log('[Buscar Lote] Buscando lote:', { manzana: manzanaBusqueda, numero: numeroLoteBusqueda })

      // Obtener todos los lotes disponibles
      const lotesApi = await lotesService.getLotesDisponibles()
      
      // Buscar el lote específico por manzana_nombre y numero_lote
      const loteEncontrado = lotesApi.find(lote => 
        lote.manzana_nombre === manzanaBusqueda && 
        lote.numero_lote === numeroLoteBusqueda
      )

      if (loteEncontrado) {
        console.log('[Buscar Lote] Lote encontrado:', loteEncontrado)
        setLoteBuscado(loteEncontrado)
        
        // Llenar automáticamente el formulario usando saldo_financiar
        setFormData(prev => ({
          ...prev,
          lote_id: loteEncontrado.id,
          totalidad: (parseFloat(loteEncontrado.saldo_financiar) + parseFloat(loteEncontrado.enganche)).toString(),
          enganche: loteEncontrado.enganche,
        }))
        
        // Calcular cuota automáticamente usando el enganche del lote
        const saldoFinanciar = parseFloat(loteEncontrado.saldo_financiar)
        const engancheLote = parseFloat(loteEncontrado.enganche)
        calcularCuotaAutomatica(saldoFinanciar, engancheLote, formData.plazo_meses)
      } else {
        alert('Lote no encontrado. Verifica la manzana y número de lote.')
      }
    } catch (err: any) {
      console.error('Error buscando lote:', err)
      alert('Error al buscar el lote. Por favor, intenta de nuevo.')
    } finally {
      setIsBuscandoLote(false)
    }
  }

  // Función para calcular cuota automáticamente
  const calcularCuotaAutomatica = (saldoFinanciar: number, enganche: number, plazoMeses: number) => {
    const tasaAnual = configuracionActiva ? parseFloat(configuracionActiva.tasa_anual) : 12
    const tasaMensual = tasaAnual / 100 / 12
    
    // Fórmula de amortización francesa usando el saldo a financiar
    const cuotaMensual = saldoFinanciar * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / (Math.pow(1 + tasaMensual, plazoMeses) - 1)
    
    setFormData(prev => ({
      ...prev,
      cuota_mensual: cuotaMensual.toFixed(2)
    }))
  }

  // Mock data - en producción vendría de la base de datos
  const [lotes, setLotes] = useState<LoteFinanciado[]>([
    {
      id: "1",
      numero: 1,
      manzana: "A",
      lote: "003",
      promitente: "Juan Carlos Pérez",
      totalidad: 150000,
      enganche: 30000,
      capitalCancelado: 25000,
      interesCancelado: 3500,
      saldo: 91500,
      cuotasCanceladas: 8,
      cuotasPendientes: 28,
      fechaPago: "2024-02-15",
      cuotaMensual: 3472.22,
      plazoTotal: 36,
    },
    {
      id: "2",
      numero: 2,
      manzana: "B",
      lote: "005",
      promitente: "María Elena González",
      totalidad: 180000,
      enganche: 36000,
      capitalCancelado: 18000,
      interesCancelado: 2800,
      saldo: 123200,
      cuotasCanceladas: 4,
      cuotasPendientes: 44,
      fechaPago: "2024-02-20",
      cuotaMensual: 2895.83,
      plazoTotal: 48,
    },
    {
      id: "3",
      numero: 3,
      manzana: "A",
      lote: "007",
      promitente: "Roberto Silva Morales",
      totalidad: 135000,
      enganche: 27000,
      capitalCancelado: 32400,
      interesCancelado: 5600,
      saldo: 70000,
      cuotasCanceladas: 12,
      cuotasPendientes: 12,
      fechaPago: "2024-02-10",
      cuotaMensual: 4708.33,
      plazoTotal: 24,
    },
    {
      id: "4",
      numero: 4,
      manzana: "C",
      lote: "001",
      promitente: "Ana Patricia López",
      totalidad: 165000,
      enganche: 33000,
      capitalCancelado: 15000,
      interesCancelado: 2200,
      saldo: 114800,
      cuotasCanceladas: 6,
      cuotasPendientes: 42,
      fechaPago: "2024-02-25",
      cuotaMensual: 2895.83,
      plazoTotal: 48,
    },
    {
      id: "5",
      numero: 5,
      manzana: "D",
      lote: "002",
      promitente: "Carlos Eduardo Ramírez",
      totalidad: 142500,
      enganche: 28500,
      capitalCancelado: 20000,
      interesCancelado: 3000,
      saldo: 94000,
      cuotasCanceladas: 10,
      cuotasPendientes: 26,
      fechaPago: "2024-02-18",
      cuotaMensual: 3285.56,
      plazoTotal: 36,
    },
    {
      id: "6",
      numero: 6,
      manzana: "E",
      lote: "004",
      promitente: "Patricia Hernández",
      totalidad: 187500,
      enganche: 37500,
      capitalCancelado: 12000,
      interesCancelado: 1800,
      saldo: 136200,
      cuotasCanceladas: 3,
      cuotasPendientes: 57,
      fechaPago: "2024-02-28",
      cuotaMensual: 2895.83,
      plazoTotal: 60,
    },
    {
      id: "7",
      numero: 7,
      manzana: "F",
      lote: "003",
      promitente: "Miguel Ángel Torres",
      totalidad: 127500,
      enganche: 25500,
      capitalCancelado: 28000,
      interesCancelado: 4200,
      saldo: 69800,
      cuotasCanceladas: 14,
      cuotasPendientes: 10,
      fechaPago: "2024-02-12",
      cuotaMensual: 4708.33,
      plazoTotal: 24,
    },
    {
      id: "8",
      numero: 8,
      manzana: "G",
      lote: "001",
      promitente: "Sofia Isabel Morales",
      totalidad: 172500,
      enganche: 34500,
      capitalCancelado: 16000,
      interesCancelado: 2400,
      saldo: 119600,
      cuotasCanceladas: 5,
      cuotasPendientes: 43,
      fechaPago: "2024-02-22",
      cuotaMensual: 2895.83,
      plazoTotal: 48,
    },
    {
      id: "9",
      numero: 9,
      manzana: "H",
      lote: "005",
      promitente: "Luis Fernando Castro",
      totalidad: 157500,
      enganche: 31500,
      capitalCancelado: 22000,
      interesCancelado: 3300,
      saldo: 100700,
      cuotasCanceladas: 9,
      cuotasPendientes: 27,
      fechaPago: "2024-02-16",
      cuotaMensual: 3285.56,
      plazoTotal: 36,
    },
    {
      id: "10",
      numero: 10,
      manzana: "I",
      lote: "002",
      promitente: "Carmen Elena Vega",
      totalidad: 195000,
      enganche: 39000,
      capitalCancelado: 14000,
      interesCancelado: 2100,
      saldo: 139900,
      cuotasCanceladas: 4,
      cuotasPendientes: 56,
      fechaPago: "2024-02-30",
      cuotaMensual: 2895.83,
      plazoTotal: 60,
    },
    {
      id: "11",
      numero: 11,
      manzana: "J",
      lote: "003",
      promitente: "Roberto Antonio Silva",
      totalidad: 120000,
      enganche: 24000,
      capitalCancelado: 30000,
      interesCancelado: 4500,
      saldo: 61500,
      cuotasCanceladas: 15,
      cuotasPendientes: 9,
      fechaPago: "2024-02-08",
      cuotaMensual: 4708.33,
      plazoTotal: 24,
    },
    {
      id: "12",
      numero: 12,
      manzana: "K",
      lote: "001",
      promitente: "María José González",
      totalidad: 168000,
      enganche: 33600,
      capitalCancelado: 18000,
      interesCancelado: 2700,
      saldo: 113700,
      cuotasCanceladas: 7,
      cuotasPendientes: 41,
      fechaPago: "2024-02-24",
      cuotaMensual: 2895.83,
      plazoTotal: 48,
    },
  ])

  const [pagos, setPagos] = useState<Pago[]>([
    {
      id: "1",
      loteId: "1",
      fecha: "2024-01-15",
      monto: 3472.22,
      capital: 2500.00,
      interes: 972.22,
      saldoAnterior: 115000,
      saldoNuevo: 111527.78,
      numeroRecibo: "REC-2024-001"
    },
    {
      id: "2",
      loteId: "1",
      fecha: "2024-02-15",
      monto: 3472.22,
      capital: 2500.00,
      interes: 972.22,
      saldoAnterior: 111527.78,
      saldoNuevo: 108055.56,
      numeroRecibo: "REC-2024-002"
    },
    {
      id: "3",
      loteId: "2",
      fecha: "2024-01-20",
      monto: 2895.83,
      capital: 2000.00,
      interes: 895.83,
      saldoAnterior: 144000,
      saldoNuevo: 141104.17,
      numeroRecibo: "REC-2024-003"
    },
    {
      id: "4",
      loteId: "2",
      fecha: "2024-02-20",
      monto: 2895.83,
      capital: 2000.00,
      interes: 895.83,
      saldoAnterior: 141104.17,
      saldoNuevo: 138208.34,
      numeroRecibo: "REC-2024-004"
    },
    {
      id: "5",
      loteId: "3",
      fecha: "2024-01-10",
      monto: 4708.33,
      capital: 3500.00,
      interes: 1208.33,
      saldoAnterior: 108000,
      saldoNuevo: 104491.67,
      numeroRecibo: "REC-2024-005"
    },
    {
      id: "6",
      loteId: "3",
      fecha: "2024-02-10",
      monto: 4708.33,
      capital: 3500.00,
      interes: 1208.33,
      saldoAnterior: 104491.67,
      saldoNuevo: 100983.34,
      numeroRecibo: "REC-2024-006"
    }
  ])

  // Filtrar financiamientos reales
  const filteredFinanciamientos = financiamientos.filter((financiamiento) => {
    const matchesSearch = searchTerm === "" || 
      financiamiento.promitente_comprador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (financiamiento.lote?.manzana_nombre || financiamiento.lote?.manzana || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (financiamiento.lote?.numero_lote || "").toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesManzana = filterManzana === "all" || 
      (financiamiento.lote?.manzana_nombre || financiamiento.lote?.manzana || "") === filterManzana
    
    return matchesSearch && matchesManzana
  })

  // Paginación de financiamientos reales
  const {
    currentData: paginatedFinanciamientos,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    setItemsPerPage,
  } = usePagination({
    data: filteredFinanciamientos,
    itemsPerPage: 10,
  })

  // Calcular cuota mensual
  const calcularCuota = (saldoFinanciar: number, plazoMeses: number, tasaAnual = 12) => {
    const tasaMensual = tasaAnual / 100 / 12
    const cuota =
      (saldoFinanciar * tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
      (Math.pow(1 + tasaMensual, plazoMeses) - 1)
    return cuota
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loteBuscado) {
      alert('Por favor busca un lote primero')
      return
    }

    try {
      setIsSubmitting(true)

      console.log('[Crear Financiamiento] Enviando datos:', formData)

      // Crear el financiamiento en el backend
      const nuevoFinanciamiento = await financiamientoService.createFinanciamiento(formData)
      
      console.log('[Crear Financiamiento] Financiamiento creado:', nuevoFinanciamiento)

      // Agregar a la lista local
      setFinanciamientos(prev => [...prev, mapFinanciamientoFromApi(nuevoFinanciamiento)])

      // Cerrar modal y resetear formulario
      setIsCreateDialogOpen(false)
    resetForm()
      setLoteBuscado(null)
      setManzanaBusqueda("")
      setNumeroLoteBusqueda("")

      alert('Financiamiento creado exitosamente')
    } catch (err: any) {
      console.error('Error creando financiamiento:', err)
      alert('Error al crear el financiamiento. Por favor, intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Pago] Iniciando proceso de pago...')
    console.log('[Pago] selectedLote:', selectedLote)
    console.log('[Pago] cuotasSeleccionadas:', cuotasSeleccionadas)
    
    if (!selectedLote || cuotasSeleccionadas.length === 0) {
      console.log('[Pago] Error: No hay lote seleccionado o cuotas seleccionadas')
      return
    }

          try {
        console.log('[Pago] Iniciando try block...')
        setIsSubmitting(true)

        const montoTotal = montoTotalPago + montoMora
        console.log('[Pago] montoTotal:', montoTotal)
        console.log('[Pago] montoTotalPago:', montoTotalPago)
        console.log('[Pago] montoMora:', montoMora)
        
        const financiamiento = financiamientos.find(f => f.id.toString() === selectedLote.id)
        console.log('[Pago] financiamiento encontrado:', financiamiento)
      
      if (!financiamiento) {
        alert('Error: No se encontró el financiamiento')
        return
      }

      // Generar número de recibo único
      const fechaActual = new Date()
      const year = fechaActual.getFullYear()
      const month = String(fechaActual.getMonth() + 1).padStart(2, '0')
      const day = String(fechaActual.getDate()).padStart(2, '0')
      const hora = String(fechaActual.getHours()).padStart(2, '0')
      const minuto = String(fechaActual.getMinutes()).padStart(2, '0')
      const segundo = String(fechaActual.getSeconds()).padStart(2, '0')
      const numeroRecibo = `REC-${year}${month}${day}-${hora}${minuto}${segundo}`

      // Combinar persona y observaciones con separador
      const observacionesCompletas = [
        pagoData.personaPago && `Persona: ${pagoData.personaPago}`,
        pagoData.observaciones && `Obs: ${pagoData.observaciones}`,
        `Pago de ${cuotasSeleccionadas.length} cuotas${montoMora > 0 ? ` incluyendo mora de Q ${montoMora.toFixed(2)}` : ''}`
      ].filter(Boolean).join(' | ')

      // Crear múltiples pagos para cada cuota seleccionada
      const pagosMultiples = cuotasSeleccionadas.map(cuotaId => {
        const cuota = cuotasConMora.find(c => c.id === cuotaId)
        if (!cuota) return null

        // Generar número de recibo único para cada cuota
        const fechaActual = new Date()
        const year = fechaActual.getFullYear()
        const month = String(fechaActual.getMonth() + 1).padStart(2, '0')
        const day = String(fechaActual.getDate()).padStart(2, '0')
        const hora = String(fechaActual.getHours()).padStart(2, '0')
        const minuto = String(fechaActual.getMinutes()).padStart(2, '0')
        const segundo = String(fechaActual.getSeconds()).padStart(2, '0')
        const numeroRecibo = `REC-${year}${month}${day}-${hora}${minuto}${segundo}-${cuotaId}`

        return {
          cuota: cuotaId,
          financiamiento: financiamiento.id,
          cuota_id: cuotaId,
          financiamiento_id: financiamiento.id,
          monto_capital: cuota.monto_capital.toFixed(2),
          monto_interes: cuota.monto_interes.toFixed(2),
          monto_total: cuota.monto_total.toFixed(2),
          fecha_pago: pagoData.fecha,
          metodo_pago: pagoData.metodoPago
        }
      }).filter(Boolean) as PagoMultiple[]

      console.log('[Pago] Enviando múltiples pagos al backend:', pagosMultiples)
      console.log('[Pago] Request completo:', {
        pagos: pagosMultiples
      })
      console.log('[Pago] Formato esperado por backend:', {
        pagos: [
          {
            cuota: 73,
            financiamiento: 8,
            cuota_id: 73,
            financiamiento_id: 8,
            monto_capital: "2127.84",
            monto_interes: "686.24",
            monto_total: "2814.08",
            fecha_pago: "2025-08-22",
            metodo_pago: "Efectivo"
          }
        ]
      })

      // Registrar los pagos múltiples en el backend
      const nuevosPagos = await financiamientoService.registrarPagosMultiples({
        pagos: pagosMultiples
      })
      console.log('[Pago] Pagos registrados exitosamente:', nuevosPagos)

      // Actualizar el financiamiento en la lista con datos frescos del backend
      try {
        const financiamientoActualizado = await financiamientoService.getFinanciamiento(financiamiento.id)
        setFinanciamientos(prev => 
          prev.map(f => f.id === financiamiento.id ? financiamientoActualizado : f)
        )
        console.log('[Pago] Financiamiento actualizado con datos frescos:', financiamientoActualizado)
      } catch (error) {
        console.error('[Pago] Error actualizando financiamiento:', error)
        // Fallback: actualizar solo con los pagos nuevos
        const financiamientoActualizado = {
          ...financiamiento,
          pagos: [...(financiamiento.pagos || []), ...nuevosPagos]
        }
        setFinanciamientos(prev => 
          prev.map(f => f.id === financiamiento.id ? financiamientoActualizado : f)
        )
      }

      // Cerrar modal y limpiar estados
    setIsPagoDialogOpen(false)
      setPagoData({ 
        monto: "", 
        fecha: new Date().toISOString().split("T")[0],
        metodoPago: "Efectivo",
        personaPago: "",
        observaciones: ""
      })
      setCuotasConMora([])
      setCuotasSeleccionadas([])
      setMontoTotalPago(0)
      setMontoMora(0)
    setSelectedLote(null)

      alert(`Pagos registrados exitosamente por Q ${montoTotal.toLocaleString()}\n${nuevosPagos.length} cuotas pagadas`)

    } catch (err: any) {
      console.error('Error registrando pago:', err)
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      })
      
      let errorMessage = 'Error al registrar el pago. Por favor, intenta de nuevo.'
      if (err.data?.mensaje) {
        errorMessage = `Error: ${err.data.mensaje}`
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      lote_id: 0,
      promitente_comprador: "",
      totalidad: "",
      enganche: "",
      plazo_meses: 36,
      cuota_mensual: "",
      fecha_inicio_financiamiento: new Date().toISOString().split('T')[0]
    })
    setSelectedLote(null)
    setLoteBuscado(null)
    setManzanaBusqueda("")
    setNumeroLoteBusqueda("")
  }

  const handleEdit = (financiamiento: Financiamiento) => {
    setSelectedLote({
      id: financiamiento.id.toString(),
              numero: financiamiento.id,
        manzana: financiamiento.lote?.manzana_nombre || `Manzana ${financiamiento.lote?.manzana}` || 'N/A',
        lote: financiamiento.lote?.numero_lote || 'N/A',
        promitente: financiamiento.promitente_comprador,
        totalidad: parseFloat(financiamiento.totalidad),
        enganche: parseFloat(financiamiento.enganche),
        capitalCancelado: parseFloat(financiamiento.capital_cancelado || "0"),
        interesCancelado: parseFloat(financiamiento.interes_cancelado || "0"),
        saldo: parseFloat(financiamiento.totalidad) - parseFloat(financiamiento.enganche) - parseFloat(financiamiento.capital_cancelado || "0"),
        cuotasCanceladas: financiamiento.cuotas_canceladas || 0,
        cuotasPendientes: financiamiento.plazo_meses - (financiamiento.cuotas_canceladas || 0),
        fechaPago: financiamiento.fecha_inicio_financiamiento,
        cuotaMensual: parseFloat(financiamiento.cuota_mensual),
        plazoTotal: financiamiento.plazo_meses,
    })
    setFormData({
      lote_id: financiamiento.lote_id,
      promitente_comprador: financiamiento.promitente_comprador,
      totalidad: financiamiento.totalidad,
      enganche: financiamiento.enganche,
      plazo_meses: financiamiento.plazo_meses,
      cuota_mensual: financiamiento.cuota_mensual,
      fecha_inicio_financiamiento: financiamiento.fecha_inicio_financiamiento
    })
    setIsEditDialogOpen(true)
  }

  // Función para calcular mora de cuotas
  const calcularMoraCuotas = async (financiamiento: Financiamiento) => {
    setIsCalculandoMora(true)
    try {
      // Obtener cuotas del financiamiento
      const cuotas = await financiamientoService.getCuotas(financiamiento.id)
      
      // Obtener configuración financiera para el porcentaje de mora
      const penalizacionMora = configuracionFinanciera?.penalizacion_atraso_porcentaje || 5
      
      const cuotasConMoraCalculada: CuotaConMora[] = cuotas
        .filter(cuota => cuota.estado === 'pendiente' || cuota.estado === 'atrasada')
        .map(cuota => {
          const fechaVencimiento = new Date(cuota.fecha_vencimiento)
          const fechaActual = new Date()
          const diasAtraso = Math.max(0, Math.floor((fechaActual.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)))
          
          // Calcular mora solo si hay atraso
          const montoMora = diasAtraso > 0 ? 
            (parseFloat(cuota.monto_total) * parseFloat(penalizacionMora.toString()) / 100) : 0
          
          return {
            id: cuota.id,
            numero_cuota: cuota.numero_cuota,
            fecha_vencimiento: cuota.fecha_vencimiento,
            monto_capital: parseFloat(cuota.monto_capital),
            monto_interes: parseFloat(cuota.monto_interes),
            monto_total: parseFloat(cuota.monto_total),
            monto_mora: montoMora,
            estado: cuota.estado,
            dias_atraso: diasAtraso,
            seleccionada: false
          }
        })
        .sort((a, b) => a.numero_cuota - b.numero_cuota)
      
      setCuotasConMora(cuotasConMoraCalculada)
      setCuotasSeleccionadas([])
      setMontoTotalPago(0)
      setMontoMora(0)
      
    } catch (err: any) {
      console.error('Error calculando mora:', err)
      alert('Error al calcular la mora de las cuotas')
    } finally {
      setIsCalculandoMora(false)
    }
  }

  // Función para mostrar resumen de mora
  const mostrarResumenMora = async (financiamiento: Financiamiento) => {
    setIsCalculandoMora(true)
    try {
      const cuotas = await financiamientoService.getCuotas(financiamiento.id)
      const penalizacionMora = configuracionFinanciera?.penalizacion_atraso_porcentaje || 5
      
      const cuotasAtrasadas = cuotas.filter(cuota => {
        const fechaVencimiento = new Date(cuota.fecha_vencimiento)
        const fechaActual = new Date()
        return fechaActual > fechaVencimiento && cuota.estado !== 'pagada'
      })
      
      const diasAtrasoTotal = cuotasAtrasadas.reduce((total, cuota) => {
        const fechaVencimiento = new Date(cuota.fecha_vencimiento)
        const fechaActual = new Date()
        return total + Math.floor((fechaActual.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))
      }, 0)
      
      const montoMoraTotal = cuotasAtrasadas.reduce((total, cuota) => {
        const fechaVencimiento = new Date(cuota.fecha_vencimiento)
        const fechaActual = new Date()
        const diasAtraso = Math.floor((fechaActual.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))
        return total + (parseFloat(cuota.monto_total) * parseFloat(penalizacionMora.toString()) / 100)
      }, 0)
      
      const porcentajeMora = parseFloat(penalizacionMora.toString())
      
      setResumenMora({
        cuotasAtrasadas: cuotasAtrasadas.length,
        diasAtrasoTotal,
        montoMoraTotal,
        porcentajeMora
      })
      
      setIsMoraDialogOpen(true)
      
    } catch (err: any) {
      console.error('Error calculando resumen de mora:', err)
      alert('Error al calcular el resumen de mora')
    } finally {
      setIsCalculandoMora(false)
    }
  }

  // Función para manejar selección de cuotas
  const handleSeleccionarCuota = (cuotaId: number, seleccionada: boolean) => {
    const cuotasActualizadas = cuotasConMora.map(cuota => 
      cuota.id === cuotaId ? { ...cuota, seleccionada } : cuota
    )
    setCuotasConMora(cuotasActualizadas)
    
    // Actualizar cuotas seleccionadas
    const nuevasSeleccionadas = seleccionada 
      ? [...cuotasSeleccionadas, cuotaId]
      : cuotasSeleccionadas.filter(id => id !== cuotaId)
    setCuotasSeleccionadas(nuevasSeleccionadas)
    
    // Calcular monto total
    const cuotasSeleccionadasData = cuotasActualizadas.filter(c => c.seleccionada)
    const montoCuotas = cuotasSeleccionadasData.reduce((sum, c) => sum + c.monto_total, 0)
    const montoMoraTotal = cuotasSeleccionadasData.reduce((sum, c) => sum + c.monto_mora, 0)
    
    setMontoTotalPago(montoCuotas)
    setMontoMora(montoMoraTotal)
  }

  // Función para seleccionar todas las cuotas
  const handleSeleccionarTodas = () => {
    const todasSeleccionadas = cuotasConMora.map(cuota => ({ ...cuota, seleccionada: true }))
    setCuotasConMora(todasSeleccionadas)
    setCuotasSeleccionadas(todasSeleccionadas.map(c => c.id))
    
    const montoCuotas = todasSeleccionadas.reduce((sum, c) => sum + c.monto_total, 0)
    const montoMoraTotal = todasSeleccionadas.reduce((sum, c) => sum + c.monto_mora, 0)
    
    setMontoTotalPago(montoCuotas)
    setMontoMora(montoMoraTotal)
  }

  // Función para seleccionar solo las cuotas de la página actual
  const handleSeleccionarPaginaActual = () => {
    const cuotasActualizadas = cuotasConMora.map(cuota => ({
      ...cuota,
      seleccionada: cuotasPaginadas.some(c => c.id === cuota.id) ? true : cuota.seleccionada
    }))
    setCuotasConMora(cuotasActualizadas)
    
    const nuevasSeleccionadas = [...new Set([
      ...cuotasSeleccionadas,
      ...cuotasPaginadas.map(c => c.id)
    ])]
    setCuotasSeleccionadas(nuevasSeleccionadas)
    
    // Recalcular montos
    const cuotasSeleccionadasData = cuotasActualizadas.filter(c => c.seleccionada)
    const montoCuotas = cuotasSeleccionadasData.reduce((sum, c) => sum + c.monto_total, 0)
    const montoMoraTotal = cuotasSeleccionadasData.reduce((sum, c) => sum + c.monto_mora, 0)
    
    setMontoTotalPago(montoCuotas)
    setMontoMora(montoMoraTotal)
  }

  // Función para deseleccionar todas las cuotas
  const handleDeseleccionarTodas = () => {
    const todasDeseleccionadas = cuotasConMora.map(cuota => ({ ...cuota, seleccionada: false }))
    setCuotasConMora(todasDeseleccionadas)
    setCuotasSeleccionadas([])
    setMontoTotalPago(0)
    setMontoMora(0)
  }

  // Funciones para paginación de cuotas
  const cuotasPaginadas = cuotasConMora.slice(
    (cuotasPage - 1) * cuotasPerPage,
    cuotasPage * cuotasPerPage
  )

  const totalCuotasPages = Math.ceil(cuotasConMora.length / cuotasPerPage)

  const handleCuotasPageChange = (page: number) => {
    setCuotasPage(page)
  }

  const handleCuotasPerPageChange = (perPage: number) => {
    setCuotasPerPage(perPage)
    setCuotasPage(1) // Reset a la primera página
  }

  const handleRegistrarPago = async (financiamiento: Financiamiento) => {
    setSelectedLote({
      id: financiamiento.id.toString(),
      numero: financiamiento.id,
      manzana: financiamiento.lote_info?.manzana_nombre || `Manzana ${financiamiento.lote_info?.manzana}` || 'N/A',
      lote: financiamiento.lote_info?.numero_lote || 'N/A',
      promitente: financiamiento.promitente_comprador,
      totalidad: parseFloat(financiamiento.totalidad),
      enganche: parseFloat(financiamiento.enganche),
      capitalCancelado: parseFloat(financiamiento.capital_cancelado || "0"),
      interesCancelado: parseFloat(financiamiento.interes_cancelado || "0"),
      saldo: parseFloat(financiamiento.totalidad) - parseFloat(financiamiento.enganche) - parseFloat(financiamiento.capital_cancelado || "0"),
      cuotasCanceladas: financiamiento.cuotas_canceladas || 0,
      cuotasPendientes: financiamiento.plazo_meses - (financiamiento.cuotas_canceladas || 0),
      fechaPago: financiamiento.fecha_inicio_financiamiento,
      cuotaMensual: parseFloat(financiamiento.cuota_mensual),
      plazoTotal: financiamiento.plazo_meses,
    })
    
    // Calcular mora de cuotas al abrir el modal
    await calcularMoraCuotas(financiamiento)
    setIsPagoDialogOpen(true)
  }

  const handlePagoCapitalClick = (financiamiento: Financiamiento) => {
    setSelectedLote({
      id: financiamiento.id.toString(),
      numero: financiamiento.id,
      manzana: financiamiento.lote_info?.manzana_nombre || `Manzana ${financiamiento.lote_info?.manzana}` || 'N/A',
      lote: financiamiento.lote_info?.numero_lote || 'N/A',
      promitente: financiamiento.promitente_comprador,
      totalidad: parseFloat(financiamiento.totalidad),
      enganche: parseFloat(financiamiento.enganche),
      capitalCancelado: parseFloat(financiamiento.capital_cancelado || "0"),
      interesCancelado: parseFloat(financiamiento.interes_cancelado || "0"),
      saldo: parseFloat(financiamiento.totalidad) - parseFloat(financiamiento.enganche) - parseFloat(financiamiento.capital_cancelado || "0"),
      cuotasCanceladas: financiamiento.cuotas_canceladas || 0,
      cuotasPendientes: financiamiento.plazo_meses - (financiamiento.cuotas_canceladas || 0),
      fechaPago: financiamiento.fecha_inicio_financiamiento,
      cuotaMensual: parseFloat(financiamiento.cuota_mensual),
      plazoTotal: financiamiento.plazo_meses,
    })
    setIsPagoCapitalDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este financiamiento?")) {
      try {
        await financiamientoService.deleteFinanciamiento(id)
        setFinanciamientos(prev => prev.filter(f => f.id !== id))
        alert('Financiamiento eliminado exitosamente')
      } catch (err: any) {
        console.error('Error eliminando financiamiento:', err)
        alert('Error al eliminar el financiamiento. Por favor, intenta de nuevo.')
      }
    }
  }

  // Función para manejar pago a capital
  const handlePagoCapital = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedLote) {
      alert('Error: No hay lote seleccionado')
      return
    }

    if (!pagoCapitalData.monto || parseFloat(pagoCapitalData.monto) <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }

    try {
      setIsSubmitting(true)

      const financiamiento = financiamientos.find(f => f.id.toString() === selectedLote.id)
      if (!financiamiento) {
        alert('Error: No se encontró el financiamiento')
        return
      }

      console.log('[Pago Capital] Enviando pago a capital:', {
        financiamiento_id: financiamiento.id,
        monto: pagoCapitalData.monto,
        fecha_pago: pagoCapitalData.fecha,
        concepto: pagoCapitalData.concepto
      })

      // Registrar el pago a capital
      const pagoCapital = await financiamientoService.registrarPagoCapital({
        financiamiento_id: financiamiento.id,
        monto: pagoCapitalData.monto,
        fecha_pago: pagoCapitalData.fecha,
        concepto: pagoCapitalData.concepto
      })

      console.log('[Pago Capital] Pago registrado exitosamente:', pagoCapital)

      // Actualizar el financiamiento en la lista con datos frescos del backend
      try {
        const financiamientoActualizado = await financiamientoService.getFinanciamiento(financiamiento.id)
        setFinanciamientos(prev => 
          prev.map(f => f.id === financiamiento.id ? financiamientoActualizado : f)
        )
        console.log('[Pago Capital] Financiamiento actualizado:', financiamientoActualizado)
      } catch (error) {
        console.error('[Pago Capital] Error actualizando financiamiento:', error)
      }

      // Cerrar modal y limpiar estados
      setIsPagoCapitalDialogOpen(false)
      setPagoCapitalData({
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
        concepto: "Pago adelantado a capital",
      })
      setSelectedLote(null)

      alert(`Pago a capital registrado exitosamente por Q ${parseFloat(pagoCapitalData.monto).toLocaleString()}`)

    } catch (err: any) {
      console.error('Error registrando pago a capital:', err)
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      })
      
      let errorMessage = 'Error al registrar el pago a capital. Por favor, intenta de nuevo.'
      if (err.data?.mensaje) {
        errorMessage = `Error: ${err.data.mensaje}`
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }



  const exportToExcel = () => {
    console.log("Exportando a Excel...")
  }

  const exportToPDF = () => {
    console.log("Exportando a PDF...")
  }

  const manzanas = Array.from(new Set(
    financiamientos
      .map((f) => f.lote?.manzana_nombre || f.lote?.manzana || '')
      .filter(Boolean)
  )).sort()
  
  // Hook para manejar recibos
  const { printReceipt, downloadReceipt } = useReceipt()

  // Funciones para manejar historial y recibos
  const handlePrintReceipt = (pago: Pago) => {
    // Buscar el financiamiento correspondiente
    const financiamiento = financiamientos.find(f => f.id.toString() === pago.loteId)
    if (financiamiento) {
      const loteData = {
        id: financiamiento.id.toString(),
        numero: financiamiento.id,
        manzana: financiamiento.lote?.manzana_nombre || financiamiento.lote?.manzana || 'N/A',
        lote: financiamiento.lote?.numero_lote || 'N/A',
        promitente: financiamiento.promitente_comprador,
        totalidad: parseFloat(financiamiento.totalidad),
        enganche: parseFloat(financiamiento.enganche),
        capitalCancelado: parseFloat(financiamiento.capital_cancelado || "0"),
        interesCancelado: parseFloat(financiamiento.interes_cancelado || "0"),
        saldo: parseFloat(financiamiento.totalidad) - parseFloat(financiamiento.enganche) - parseFloat(financiamiento.capital_cancelado || "0"),
        cuotasCanceladas: financiamiento.cuotas_canceladas || 0,
        cuotasPendientes: financiamiento.plazo_meses - (financiamiento.cuotas_canceladas || 0),
        fechaPago: financiamiento.fecha_inicio_financiamiento,
        cuotaMensual: parseFloat(financiamiento.cuota_mensual),
        plazoTotal: financiamiento.plazo_meses,
      }
      printReceipt(pago, loteData)
    }
  }

  const handleDownloadReceipt = (pago: Pago) => {
    // Buscar el financiamiento correspondiente
    const financiamiento = financiamientos.find(f => f.id.toString() === pago.loteId)
    if (financiamiento) {
      const loteData = {
        id: financiamiento.id.toString(),
        numero: financiamiento.id,
        manzana: financiamiento.lote?.manzana_nombre || financiamiento.lote?.manzana || 'N/A',
        lote: financiamiento.lote?.numero_lote || 'N/A',
        promitente: financiamiento.promitente_comprador,
        totalidad: parseFloat(financiamiento.totalidad),
        enganche: parseFloat(financiamiento.enganche),
        capitalCancelado: parseFloat(financiamiento.capital_cancelado || "0"),
        interesCancelado: parseFloat(financiamiento.interes_cancelado || "0"),
        saldo: parseFloat(financiamiento.totalidad) - parseFloat(financiamiento.enganche) - parseFloat(financiamiento.capital_cancelado || "0"),
        cuotasCanceladas: financiamiento.cuotas_canceladas || 0,
        cuotasPendientes: financiamiento.plazo_meses - (financiamiento.cuotas_canceladas || 0),
        fechaPago: financiamiento.fecha_inicio_financiamiento,
        cuotaMensual: parseFloat(financiamiento.cuota_mensual),
        plazoTotal: financiamiento.plazo_meses,
      }
      downloadReceipt(pago, loteData)
    }
  }

  const cargarPagosHistorial = async (financiamientoId: number) => {
    // Si ya están cargados, no cargar de nuevo
    if (pagosCargados[financiamientoId]) {
      console.log('[Historial] Pagos ya cargados para financiamiento', financiamientoId, ':', pagosCargados[financiamientoId])
      return pagosCargados[financiamientoId]
    }

    setCargandoPagos(prev => ({ ...prev, [financiamientoId]: true }))
    
    try {
      const pagosReales = await financiamientoService.getPagos(financiamientoId)
      console.log('[Historial] Pagos cargados del backend para financiamiento', financiamientoId, ':', pagosReales)
      console.log('[Historial] Estructura del primer pago:', pagosReales[0])
      console.log('[Historial] Total de pagos cargados:', pagosReales.length)
      
      // Ordenar pagos por fecha de pago (más antiguo primero)
      const pagosOrdenados = pagosReales.sort((a, b) => 
        new Date(a.fecha_pago).getTime() - new Date(b.fecha_pago).getTime()
      )
      
      setPagosCargados(prev => ({ ...prev, [financiamientoId]: pagosOrdenados }))
      return pagosOrdenados
    } catch (error) {
      console.error('[Historial] Error cargando pagos para financiamiento', financiamientoId, ':', error)
      return []
    } finally {
      setCargandoPagos(prev => ({ ...prev, [financiamientoId]: false }))
    }
  }

  const getPagosByLote = async (financiamientoId: number) => {
    return await cargarPagosHistorial(financiamientoId)
  }

  const getEstadoPago = (lote: LoteFinanciado) => {
    const diasVencimiento = Math.floor(
      (new Date().getTime() - new Date(lote.fechaPago).getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diasVencimiento > 30) return { estado: "Vencido", color: "destructive" }
    if (diasVencimiento > 0) return { estado: "Por Vencer", color: "secondary" }
    return { estado: "Al Día", color: "default" }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lotes Financiados</h1>
          <p className="text-muted-foreground">Gestiona los lotes en proceso de financiamiento y pagos</p>
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
                Nuevo Financiamiento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Financiamiento</DialogTitle>
                <DialogDescription>Ingresa los datos del nuevo lote financiado</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Búsqueda de lote */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3">Buscar Lote</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="manzana-busqueda">Manzana</Label>
                    <Input
                        id="manzana-busqueda"
                        value={manzanaBusqueda}
                        onChange={(e) => setManzanaBusqueda(e.target.value)}
                      placeholder="A, B, C..."
                    />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="lote-busqueda">Número de Lote</Label>
                    <Input
                        id="lote-busqueda"
                        value={numeroLoteBusqueda}
                        onChange={(e) => setNumeroLoteBusqueda(e.target.value)}
                      placeholder="001, 002..."
                    />
                  </div>
                </div>
                  <Button 
                    type="button" 
                    onClick={buscarLote} 
                    disabled={isBuscandoLote}
                    className="mt-3"
                  >
                    {isBuscandoLote ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar Lote
                      </>
                    )}
                  </Button>
                </div>

                {/* Información del lote encontrado */}
                {loteBuscado && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Lote Encontrado</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Manzana:</span> {loteBuscado.manzana_nombre || `Manzana ${loteBuscado.manzana}`}
                      </div>
                      <div>
                        <span className="font-medium">Lote:</span> {loteBuscado.numero_lote}
                      </div>
                      <div>
                        <span className="font-medium">Metros²:</span> {loteBuscado.metros_cuadrados} m²
                      </div>
                      <div>
                        <span className="font-medium">Enganche del Lote:</span> Q {parseFloat(loteBuscado.enganche).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Saldo a Financiar:</span> Q {parseFloat(loteBuscado.saldo_financiar).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Total del Lote:</span> Q {(parseFloat(loteBuscado.saldo_financiar) + parseFloat(loteBuscado.enganche)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Información del financiamiento */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Información del Financiamiento</h4>
                <div className="space-y-2">
                  <Label htmlFor="promitente">Promitente/Comprador</Label>
                  <Input
                    id="promitente"
                      value={formData.promitente_comprador}
                      onChange={(e) => setFormData({ ...formData, promitente_comprador: e.target.value })}
                    placeholder="Nombre completo del comprador"
                    required
                  />
                </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalidad">Totalidad (Q)</Label>
                    <Input
                      id="totalidad"
                      type="number"
                      step="0.01"
                      value={formData.totalidad}
                      onChange={(e) => setFormData({ ...formData, totalidad: e.target.value })}
                      placeholder="150000"
                      required
                        disabled={!!loteBuscado}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enganche">Enganche (Q)</Label>
                    <Input
                      id="enganche"
                      type="number"
                      step="0.01"
                      value={formData.enganche}
                        onChange={(e) => {
                          const nuevoEnganche = parseFloat(e.target.value)
                          setFormData({ ...formData, enganche: e.target.value })
                          if (loteBuscado) {
                            // Recalcular saldo a financiar restando el nuevo enganche del total
                            const totalLote = parseFloat(loteBuscado.saldo_financiar) + parseFloat(loteBuscado.enganche)
                            const nuevoSaldoFinanciar = totalLote - nuevoEnganche
                            calcularCuotaAutomatica(nuevoSaldoFinanciar, nuevoEnganche, formData.plazo_meses)
                          }
                        }}
                      placeholder="30000"
                      required
                    />
                  </div>
                </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="plazo">Plazo Total (meses)</Label>
                    <Select
                        value={formData.plazo_meses.toString()}
                        onValueChange={(value) => {
                          const plazo = Number.parseInt(value)
                          setFormData({ ...formData, plazo_meses: plazo })
                          if (loteBuscado) {
                            // Recalcular saldo a financiar restando el enganche actual del total
                            const totalLote = parseFloat(loteBuscado.saldo_financiar) + parseFloat(loteBuscado.enganche)
                            const engancheActual = parseFloat(formData.enganche)
                            const saldoFinanciar = totalLote - engancheActual
                            calcularCuotaAutomatica(saldoFinanciar, engancheActual, plazo)
                          }
                        }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el plazo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 meses</SelectItem>
                        <SelectItem value="24">24 meses</SelectItem>
                        <SelectItem value="36">36 meses</SelectItem>
                        <SelectItem value="48">48 meses</SelectItem>
                        <SelectItem value="60">60 meses</SelectItem>
                        <SelectItem value="72">72 meses</SelectItem>
                        <SelectItem value="84">84 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="cuota-mensual">Cuota Mensual (Q)</Label>
                      <Input
                        id="cuota-mensual"
                        type="number"
                        step="0.01"
                        value={formData.cuota_mensual}
                        placeholder="Calculada automáticamente"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fecha_inicio_financiamiento}
                      onChange={(e) => setFormData({ ...formData, fecha_inicio_financiamiento: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !loteBuscado}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear Financiamiento'
                    )}
                  </Button>
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
            <CardTitle className="text-sm font-medium">Total Financiados</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financiamientos.length}</div>
            <p className="text-xs text-muted-foreground">Lotes en financiamiento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Financiado</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Q {financiamientos.reduce((sum, f) => sum + parseFloat(f.totalidad), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Valor total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enganche</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Q {financiamientos.reduce((sum, f) => sum + parseFloat(f.enganche), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Acumulado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cuotas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Q {financiamientos.reduce((sum, f) => sum + (parseFloat(f.cuota_mensual) * f.plazo_meses), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Por cobrar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financiamientos.filter(f => f.estado === 'activo').length}
            </div>
            <p className="text-xs text-muted-foreground">En proceso</p>
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
              <Badge variant="secondary" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {filteredFinanciamientos.length} lotes
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de lotes financiados */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Lotes Financiados</CardTitle>
          <CardDescription>
            {isLoading ? 'Cargando...' : `${financiamientos.length} lotes en proceso de financiamiento`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Cargando financiamientos...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Reintentar
              </Button>
            </div>
          ) : financiamientos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No hay financiamientos registrados</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Financiamiento
              </Button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Promitente</TableHead>
                  <TableHead>Totalidad</TableHead>
                  <TableHead>Enganche</TableHead>
                  <TableHead>Capital Cancelado</TableHead>
                  <TableHead>Interés Cancelado</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Cuotas C/P</TableHead>
                        <TableHead>Cuota Mensual</TableHead>
                        <TableHead>Fecha Inicio</TableHead>
                        <TableHead>Mora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {paginatedFinanciamientos.map((financiamiento) => {
                    // Usar datos del backend para capital e interés cancelado
                    const capitalCancelado = parseFloat(financiamiento.capital_cancelado || "0")
                    const interesCancelado = parseFloat(financiamiento.interes_cancelado || "0")
                    const cuotasCanceladas = financiamiento.cuotas_canceladas || 0
                    const totalCuotas = financiamiento.plazo_meses
                    const cuotasPendientes = totalCuotas - cuotasCanceladas
                    
                    // Calcular saldo pendiente usando datos del backend
                    const saldoPendiente = parseFloat(financiamiento.totalidad) - parseFloat(financiamiento.enganche) - capitalCancelado
                    
                  return (
                      <TableRow key={financiamiento.id}>
                        <TableCell className="font-medium">{financiamiento.id}</TableCell>
                      <TableCell>
                          {financiamiento.lote_info ? 
                            `${financiamiento.lote_info?.manzana_nombre || financiamiento.lote_info?.manzana}-${financiamiento.lote_info?.numero_lote}` : 
                            `ID: ${financiamiento.lote_id}`
                          }
                      </TableCell>
                        <TableCell>{financiamiento.promitente_comprador}</TableCell>
                        <TableCell>Q {parseFloat(financiamiento.totalidad).toLocaleString()}</TableCell>
                        <TableCell>Q {parseFloat(financiamiento.enganche).toLocaleString()}</TableCell>
                        <TableCell>Q {capitalCancelado.toLocaleString()}</TableCell>
                        <TableCell>Q {interesCancelado.toLocaleString()}</TableCell>
                        <TableCell>Q {saldoPendiente.toLocaleString()}</TableCell>
                      <TableCell>
                          {cuotasCanceladas}/{totalCuotas}
                      </TableCell>
                        <TableCell>Q {parseFloat(financiamiento.cuota_mensual).toLocaleString()}</TableCell>
                        <TableCell>{new Date(financiamiento.fecha_inicio_financiamiento).toLocaleDateString()}</TableCell>
                      <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => mostrarResumenMora(financiamiento)}
                            className="text-xs"
                          >
                            Ver Mora
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              financiamiento.estado === 'activo' ? 'default' :
                              financiamiento.estado === 'en_mora' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {financiamiento.estado === 'activo' ? 'Activo' :
                             financiamiento.estado === 'en_mora' ? 'En Mora' :
                             'Finalizado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                          </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRegistrarPago(financiamiento)}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Registrar Pago
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePagoCapitalClick(financiamiento)}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pago a Capital
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => calcularMoraCuotas(financiamiento)}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Calcular Mora
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                if (!pagosCargados[financiamiento.id]) {
                                  await cargarPagosHistorial(financiamiento.id)
                                }
                              }}>
                                <Clock className="h-4 w-4 mr-2" />
                                Cargar Historial
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(financiamiento)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(financiamiento.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {/* Botón de historial separado para fácil acceso */}
                          <PaymentHistory
                            lote={{
                              id: financiamiento.id.toString(),
                              numero: financiamiento.id,
                              manzana: financiamiento.lote_info?.manzana_nombre || financiamiento.lote_info?.manzana || 'N/A',
                              lote: financiamiento.lote_info?.numero_lote || 'N/A',
                              promitente: financiamiento.promitente_comprador,
                              totalidad: parseFloat(financiamiento.totalidad),
                              enganche: parseFloat(financiamiento.enganche),
                              capitalCancelado: parseFloat(financiamiento.capital_cancelado || "0"),
                              interesCancelado: parseFloat(financiamiento.interes_cancelado || "0"),
                              saldo: parseFloat(financiamiento.totalidad) - parseFloat(financiamiento.enganche) - parseFloat(financiamiento.capital_cancelado || "0"),
                              cuotasCanceladas: financiamiento.cuotas_canceladas || 0,
                              cuotasPendientes: financiamiento.plazo_meses - (financiamiento.cuotas_canceladas || 0),
                              fechaPago: financiamiento.fecha_inicio_financiamiento,
                              cuotaMensual: parseFloat(financiamiento.cuota_mensual),
                              plazoTotal: financiamiento.plazo_meses,
                            }}
                            pagos={(pagosCargados[financiamiento.id] || []).map((p, index, pagos) => {
                              // Calcular saldo anterior acumulativo
                              const saldoInicial = parseFloat(financiamiento.totalidad) - parseFloat(financiamiento.enganche)
                              
                              // Calcular capital pagado hasta antes de este pago (en orden cronológico)
                              const capitalPagadoAnterior = pagos
                                .slice(0, index)
                                .reduce((sum, pago) => sum + parseFloat(pago.monto_capital || "0"), 0)
                              
                              // Saldo anterior = saldo inicial - capital pagado anteriormente
                              const saldoAnterior = saldoInicial - capitalPagadoAnterior
                              
                              // Saldo nuevo = saldo anterior - capital de este pago
                              const saldoNuevo = saldoAnterior - parseFloat(p.monto_capital || "0")
                              
                              // Corregir el orden: el primer pago debe tener el saldo más alto
                              // Calcular desde el final hacia el principio
                              const totalCapitalPagado = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto_capital || "0"), 0)
                              const capitalPagadoHastaEstePago = pagos
                                .slice(0, index + 1)
                                .reduce((sum, pago) => sum + parseFloat(pago.monto_capital || "0"), 0)
                              
                              const saldoAnteriorCorregido = saldoInicial - (totalCapitalPagado - capitalPagadoHastaEstePago + parseFloat(p.monto_capital || "0"))
                              const saldoNuevoCorregido = saldoInicial - (totalCapitalPagado - capitalPagadoHastaEstePago)
                              
                              const pagoMapeado = {
                                id: p.id.toString(),
                                loteId: financiamiento.id.toString(),
                                fecha: p.fecha_pago,
                                monto: parseFloat(p.monto_total || "0"),
                                capital: parseFloat(p.monto_capital || "0"),
                                interes: parseFloat(p.monto_interes || "0"),
                                saldoAnterior: saldoNuevoCorregido,
                                saldoNuevo:  saldoAnteriorCorregido,
                                numeroRecibo: p.referencia_pago || p.numero_recibo || "",
                              }
                              
                              console.log(`[PaymentHistory] Pago ${index + 1} mapeado:`, pagoMapeado)
                              
                              return pagoMapeado
                            }).reverse()}
                            onPrintReceipt={handlePrintReceipt}
                            onDownloadReceipt={handleDownloadReceipt}
                          />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
              
              {/* Paginación de la tabla de financiamientos */}
              {filteredFinanciamientos.length > 0 && (
                <div className="mt-4">
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
          </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de registro de pago mejorado */}
      <Dialog open={isPagoDialogOpen} onOpenChange={setIsPagoDialogOpen}>
        <DialogContentWide 
          className="max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Registrar Pago - Sistema Avanzado</DialogTitle>
            <DialogDescription>
              Selecciona las cuotas a pagar para {selectedLote?.promitente} - Lote {selectedLote?.lote_info?.manzana}-{selectedLote?.lote_info?.numero_lote}
            </DialogDescription>
          </DialogHeader>
          
          {isCalculandoMora ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Calculando cuotas y mora...</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePago} className="space-y-6">
              {/* Información del financiamiento */}
              {selectedLote && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3">Información del Financiamiento</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Promitente:</span> {selectedLote.promitente}
                    </div>
                    <div>
                      <span className="font-medium">Lote:</span> {selectedLote.manzana}-{selectedLote.lote}
                    </div>
                    <div>
                      <span className="font-medium">Cuota Mensual:</span> Q {selectedLote.cuotaMensual.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Plazo Total:</span> {selectedLote.plazoTotal} meses
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración de mora */}
              {configuracionFinanciera && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">Configuración de Mora</h4>
                  <div className="text-sm text-yellow-800">
                    <p>Penalización por atraso: <strong>{configuracionFinanciera.penalizacion_atraso_porcentaje}%</strong></p>
                    <p>Esta penalización se aplica automáticamente a las cuotas vencidas.</p>
                  </div>
                </div>
              )}

              {/* Controles de selección */}
              <div className="flex gap-2 flex-wrap">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleSeleccionarTodas}
                  disabled={cuotasConMora.length === 0}
                >
                  Seleccionar Todas
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleSeleccionarPaginaActual}
                  disabled={cuotasPaginadas.length === 0}
                >
                  Seleccionar Página
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleDeseleccionarTodas}
                  disabled={cuotasSeleccionadas.length === 0}
                >
                  Deseleccionar Todas
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => calcularMoraCuotas(financiamientos.find(f => f.id.toString() === selectedLote?.id)!)}
                  disabled={!selectedLote}
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Recalcular Mora
                </Button>
              </div>

              {/* Tabla de cuotas con paginación */}
              {cuotasConMora.length > 0 ? (
                <div className="space-y-4">
                  {/* Información de paginación */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div>
                        Mostrando {((cuotasPage - 1) * cuotasPerPage) + 1} a {Math.min(cuotasPage * cuotasPerPage, cuotasConMora.length)} de {cuotasConMora.length} cuotas
                      </div>
                      {cuotasSeleccionadas.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {cuotasSeleccionadas.length} seleccionadas
                          </Badge>
                          <span className="text-xs">
                            ({cuotasPaginadas.filter(c => c.seleccionada).length} en esta página)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Cuotas por página:</span>
                      <Select value={cuotasPerPage.toString()} onValueChange={(value) => handleCuotasPerPageChange(parseInt(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <input
                                type="checkbox"
                                checked={cuotasSeleccionadas.length === cuotasConMora.length && cuotasConMora.length > 0}
                                onChange={(e) => e.target.checked ? handleSeleccionarTodas() : handleDeseleccionarTodas()}
                              />
                            </TableHead>
                            <TableHead>Cuota</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Capital</TableHead>
                            <TableHead>Interés</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Días Atraso</TableHead>
                            <TableHead>Mora</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cuotasPaginadas.map((cuota) => (
                            <TableRow key={cuota.id} className={cuota.seleccionada ? 'bg-blue-50' : ''}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={cuota.seleccionada}
                                  onChange={(e) => handleSeleccionarCuota(cuota.id, e.target.checked)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{cuota.numero_cuota}</TableCell>
                              <TableCell>{new Date(cuota.fecha_vencimiento).toLocaleDateString()}</TableCell>
                              <TableCell>Q {cuota.monto_capital.toLocaleString()}</TableCell>
                              <TableCell>Q {cuota.monto_interes.toLocaleString()}</TableCell>
                              <TableCell>Q {cuota.monto_total.toLocaleString()}</TableCell>
                              <TableCell>
                                {cuota.dias_atraso > 0 ? (
                                  <Badge variant="destructive">{cuota.dias_atraso} días</Badge>
                                ) : (
                                  <Badge variant="secondary">Al día</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {cuota.monto_mora > 0 ? (
                                  <span className="text-red-600 font-medium">Q {cuota.monto_mora.toLocaleString()}</span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    cuota.estado === 'pagada' ? 'default' :
                                    cuota.estado === 'atrasada' ? 'destructive' :
                                    'secondary'
                                  }
                                >
                                  {cuota.estado === 'pagada' ? 'Pagada' :
                                   cuota.estado === 'atrasada' ? 'Atrasada' :
                                   'Pendiente'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
            </div>
                  </div>

                  {/* Controles de paginación */}
                  {totalCuotasPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Página {cuotasPage} de {totalCuotasPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCuotasPageChange(cuotasPage - 1)}
                          disabled={cuotasPage === 1}
                        >
                          Anterior
                        </Button>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalCuotasPages) }, (_, i) => {
                            let pageNum
                            if (totalCuotasPages <= 5) {
                              pageNum = i + 1
                            } else if (cuotasPage <= 3) {
                              pageNum = i + 1
                            } else if (cuotasPage >= totalCuotasPages - 2) {
                              pageNum = totalCuotasPages - 4 + i
                            } else {
                              pageNum = cuotasPage - 2 + i
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={cuotasPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleCuotasPageChange(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCuotasPageChange(cuotasPage + 1)}
                          disabled={cuotasPage === totalCuotasPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay cuotas pendientes para este financiamiento.</p>
                </div>
              )}

              {/* Resumen del pago */}
              {(montoTotalPago > 0 || montoMora > 0) && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-3">Resumen del Pago</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Cuotas seleccionadas:</span> {cuotasSeleccionadas.length}
                      {cuotasSeleccionadas.length > 0 && (
                        <span className="text-xs text-green-600 ml-1">
                          (de {cuotasConMora.length} disponibles)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Monto cuotas:</span> Q {montoTotalPago.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Mora:</span> Q {montoMora.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium text-lg">Total a pagar:</span> 
                      <span className="text-lg font-bold text-green-700 ml-2">
                        Q {(montoTotalPago + montoMora).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {cuotasSeleccionadas.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-700">
                        💡 <strong>Consejo:</strong> Puedes navegar entre páginas para seleccionar cuotas de diferentes períodos.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Fecha de pago */}
            <div className="space-y-2">
              <Label htmlFor="fecha-pago">Fecha del Pago</Label>
              <Input
                id="fecha-pago"
                type="date"
                value={pagoData.fecha}
                onChange={(e) => setPagoData({ ...pagoData, fecha: e.target.value })}
                required
              />
            </div>

              {/* Información adicional del pago */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metodo-pago">Método de Pago</Label>
                  <Select 
                    value={pagoData.metodoPago} 
                    onValueChange={(value) => setPagoData({ ...pagoData, metodoPago: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="Depósito">Depósito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persona-pago">Persona que Paga</Label>
                  <Input
                    id="persona-pago"
                    value={pagoData.personaPago}
                    onChange={(e) => setPagoData({ ...pagoData, personaPago: e.target.value })}
                    placeholder="Nombre de quien paga"
                  />
              </div>

                <div className="space-y-2">
                  <Label htmlFor="referencia-pago">Referencia</Label>
                  <Input
                    id="referencia-pago"
                    value="Se generará automáticamente"
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones-pago">Observaciones</Label>
                <textarea
                  id="observaciones-pago"
                  value={pagoData.observaciones}
                  onChange={(e) => setPagoData({ ...pagoData, observaciones: e.target.value })}
                  placeholder="Observaciones adicionales del pago..."
                  className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPagoDialogOpen(false)
                    setPagoData({ 
                      monto: "", 
                      fecha: new Date().toISOString().split("T")[0],
                      metodoPago: "Efectivo",
                      personaPago: "",
                      observaciones: ""
                    })
                    setCuotasConMora([])
                    setCuotasSeleccionadas([])
                    setMontoTotalPago(0)
                    setMontoMora(0)
                }}
              >
                Cancelar
              </Button>
                <Button 
                  type="submit" 
                  disabled={cuotasSeleccionadas.length === 0}
                >
                  Registrar Pago ({cuotasSeleccionadas.length} cuotas)
                </Button>
            </DialogFooter>
          </form>
          )}
        </DialogContentWide>
      </Dialog>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Financiamiento</DialogTitle>
            <DialogDescription>Modifica los datos del financiamiento seleccionado</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-manzana">Manzana</Label>
                <Input
                  id="edit-manzana"
                  value={formData.promitente_comprador.split(" ")[0]}
                  onChange={(e) => setFormData({ ...formData, promitente_comprador: `${e.target.value} ${formData.promitente_comprador.split(" ")[1]}` })}
                  placeholder="A, B, C..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lote">Lote</Label>
                <Input
                  id="edit-lote"
                  value={formData.promitente_comprador.split(" ")[1]}
                  onChange={(e) => setFormData({ ...formData, promitente_comprador: `${formData.promitente_comprador.split(" ")[0]} ${e.target.value}` })}
                  placeholder="001, 002..."
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-promitente">Promitente/Comprador</Label>
              <Input
                id="edit-promitente"
                value={formData.promitente_comprador}
                onChange={(e) => setFormData({ ...formData, promitente_comprador: e.target.value })}
                placeholder="Nombre completo del comprador"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-totalidad">Totalidad (Q)</Label>
                <Input
                  id="edit-totalidad"
                  type="number"
                  step="0.01"
                  value={formData.totalidad}
                  onChange={(e) => setFormData({ ...formData, totalidad: e.target.value })}
                  placeholder="150000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-enganche">Enganche (Q)</Label>
                <Input
                  id="edit-enganche"
                  type="number"
                  step="0.01"
                  value={formData.enganche}
                  onChange={(e) => setFormData({ ...formData, enganche: e.target.value })}
                  placeholder="30000"
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

      {/* Dialog de resumen de mora */}
      <Dialog open={isMoraDialogOpen} onOpenChange={setIsMoraDialogOpen}>
        <DialogContent 
          className="max-h-[90vh] overflow-y-auto"
          style={{ 
            maxWidth: '500px !important', 
            width: '500px !important',
            minWidth: '500px !important'
          }}
        >
          <DialogHeader>
            <DialogTitle>Resumen de Mora</DialogTitle>
            <DialogDescription>
              Información detallada sobre las cuotas atrasadas
            </DialogDescription>
          </DialogHeader>
          
          {isCalculandoMora ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Calculando mora...</span>
              </div>
            </div>
          ) : resumenMora ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-red-900">Cuotas Atrasadas</div>
                  <div className="text-2xl font-bold text-red-700">{resumenMora.cuotasAtrasadas}</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-orange-900">Días de Atraso</div>
                  <div className="text-2xl font-bold text-orange-700">{resumenMora.diasAtrasoTotal}</div>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm font-medium text-yellow-900 mb-2">Configuración de Mora</div>
                <div className="text-sm text-yellow-800">
                  <p>Porcentaje de penalización: <strong>{resumenMora.porcentajeMora}%</strong></p>
                  <p>Esta penalización se aplica automáticamente a las cuotas vencidas.</p>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm font-medium text-red-900 mb-2">Mora Acumulada</div>
                <div className="text-2xl font-bold text-red-700">
                  Q {resumenMora.montoMoraTotal.toLocaleString()}
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Este monto se suma automáticamente al pago de las cuotas atrasadas.
                </p>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMoraDialogOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsMoraDialogOpen(false)
                    // Abrir el modal de pago para este financiamiento
                    const financiamiento = financiamientos.find(f => f.id.toString() === selectedLote?.id)
                    if (financiamiento) {
                      handleRegistrarPago(financiamiento)
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Pagar Cuotas Atrasadas
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay información de mora disponible.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de pago a capital */}
      <Dialog open={isPagoCapitalDialogOpen} onOpenChange={setIsPagoCapitalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pago a Capital</DialogTitle>
            <DialogDescription>
              Registra un pago adelantado a capital para {selectedLote?.promitente} - Lote {selectedLote?.lote_info?.manzana}-{selectedLote?.lote_info?.numero_lote}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePagoCapital} className="space-y-4">
            {/* Información del financiamiento */}
            {selectedLote && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Información del Financiamiento</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Promitente:</span> {selectedLote.promitente}</div>
                  <div><span className="font-medium">Lote:</span> {selectedLote.manzana}-{selectedLote.lote}</div>
                  <div><span className="font-medium">Saldo Pendiente:</span> Q {selectedLote.saldo.toLocaleString()}</div>
                  <div><span className="font-medium">Capital Cancelado:</span> Q {selectedLote.capitalCancelado.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Monto del pago */}
            <div className="space-y-2">
              <Label htmlFor="monto-capital">Monto a Pagar (Q)</Label>
              <Input
                id="monto-capital"
                type="number"
                step="0.01"
                min="0.01"
                value={pagoCapitalData.monto}
                onChange={(e) => setPagoCapitalData({ ...pagoCapitalData, monto: e.target.value })}
                placeholder="5000.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Este monto se aplicará directamente al capital pendiente del financiamiento.
              </p>
            </div>

            {/* Fecha del pago */}
            <div className="space-y-2">
              <Label htmlFor="fecha-capital">Fecha del Pago</Label>
              <Input
                id="fecha-capital"
                type="date"
                value={pagoCapitalData.fecha}
                onChange={(e) => setPagoCapitalData({ ...pagoCapitalData, fecha: e.target.value })}
                required
              />
            </div>

            {/* Concepto */}
            <div className="space-y-2">
              <Label htmlFor="concepto-capital">Concepto</Label>
              <Input
                id="concepto-capital"
                value={pagoCapitalData.concepto}
                onChange={(e) => setPagoCapitalData({ ...pagoCapitalData, concepto: e.target.value })}
                placeholder="Pago adelantado a capital"
                required
              />
            </div>

            {/* Información adicional */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">💡 ¿Qué es un pago a capital?</p>
                <p className="text-xs">
                  Un pago a capital es un pago adicional que se aplica directamente al saldo pendiente del financiamiento, 
                  reduciendo el capital adeudado y recalculando automáticamente las cuotas pendientes.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPagoCapitalDialogOpen(false)
                  setPagoCapitalData({
                    monto: "",
                    fecha: new Date().toISOString().split("T")[0],
                    concepto: "Pago adelantado a capital",
                  })
                  setSelectedLote(null)
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!pagoCapitalData.monto || parseFloat(pagoCapitalData.monto) <= 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Pago a Capital'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  )
}
