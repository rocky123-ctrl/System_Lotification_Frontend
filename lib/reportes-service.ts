import { apiRequest } from './api'

export interface ReporteDashboardResponse {
  lotesDisponibles: number
  lotesFinanciados: number
  lotesReservados: number
  lotesPagados: number
  lotesCancelados: number
  valorTotalVentas: number
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

  return apiRequest<ReporteDashboardResponse>(`/ventas/ventas/reporte_dashboard/?${params.toString()}`)
}
