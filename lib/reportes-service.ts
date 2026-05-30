import { apiRequest } from './api'

export interface ReporteDashboardResponse {
  lotesDisponibles: number
  lotesFinanciados: number
  lotesReservados: number
  lotesPagados: number
  lotesCancelados: number
  valorTotalVentas: number
  valorTotalProyectoLotes: number
  valorEnganches: number
  valorCapitalCobrado: number
  valorInteresesCobrados: number
  valorReservas: number
  valorPendienteCobro: number
  dataVentasMensuales: {
    mes: string
    ventas: number
    monto: number
  }[]
  resumenPorManzana: {
    manzana: string
    disponibles: number
    financiados: number
    reservados: number
    pagados: number
    valorTotal: number
  }[]
  ventasPorVendedor: {
    vendedor: string
    ventas: number
    monto: number
  }[]
}

export const getReporteDashboard = async (
  fecha_inicio?: string,
  fecha_fin?: string,
  lotificacion_id?: string
): Promise<ReporteDashboardResponse> => {
  const params = new URLSearchParams()
  if (fecha_inicio) params.append('fecha_inicio', fecha_inicio)
  if (fecha_fin) params.append('fecha_fin', fecha_fin)
  if (lotificacion_id) params.append('lotificacion_id', lotificacion_id)

  return apiRequest<ReporteDashboardResponse>(`/ventas/reporte_dashboard/?${params.toString()}`)
}

export interface ReporteFinanciamientoItem {
  venta_id: number
  cliente_nombre: string
  lote: string
  progreso_cuotas: string
}

export interface ReporteFinanciamientoResponse {
  count: number
  next: string | null
  previous: string | null
  results: ReporteFinanciamientoItem[]
  totales: {
    total_monto: number
    pagados: number
    pendientes: number
  }
}

export interface ReporteServiciosItem {
  cliente_id: number
  cliente_nombre: string
  estado_al_dia: boolean
}

export interface ReporteServiciosResponse {
  count: number
  next: string | null
  previous: string | null
  results: ReporteServiciosItem[]
}

export const getReporteFinanciamientoClientes = async (
  lotificacion_id?: string,
  page: number = 1
): Promise<ReporteFinanciamientoResponse> => {
  const params = new URLSearchParams()
  if (lotificacion_id) params.append('lotificacion_id', lotificacion_id)
  params.append('page', page.toString())

  return apiRequest<ReporteFinanciamientoResponse>(`/ventas/reporte_financiamiento_clientes/?${params.toString()}`)
}

export const getReporteServiciosClientes = async (
  lotificacion_id?: string,
  page: number = 1
): Promise<ReporteServiciosResponse> => {
  const params = new URLSearchParams()
  if (lotificacion_id) params.append('lotificacion_id', lotificacion_id)
  params.append('page', page.toString())

  return apiRequest<ReporteServiciosResponse>(`/ventas/reporte_servicios_clientes/?${params.toString()}`)
}
