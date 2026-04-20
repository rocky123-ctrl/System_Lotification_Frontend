import { apiRequest, refreshTokenIfNeeded } from './api'
import { config } from './config'

export interface LiquidacionComision {
  id: number
  venta: number
  vendedor: number
  vendedor_nombre: string
  fecha_venta: string
  lote_numero: string
  monto_pagado: string
  fecha_pago: string | null
  es_pago_inmediato: boolean
  referencia_pago: string | null
  estado_pago: 'PENDIENTE' | 'PAGADO'
  fecha_creacion: string
}

export interface LiquidacionesResponse {
  count: number
  next: string | null
  previous: string | null
  results: LiquidacionComision[]
}

export interface PlanillasFilters {
  anio?: string
  mes?: string
  search?: string
  estado?: 'PENDIENTE' | 'PAGADO'
  page?: number
}

export const planillasService = {
  // Obtener liquidaciones con filtros y paginación
  async getLiquidaciones(filters: PlanillasFilters): Promise<LiquidacionesResponse> {
    const params = new URLSearchParams()
    if (filters.anio && filters.anio !== "all") params.append('anio', filters.anio)
    if (filters.mes && filters.mes !== "all") params.append('mes', filters.mes)
    if (filters.estado && filters.estado !== "all") params.append('estado', filters.estado)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())

    return apiRequest<LiquidacionesResponse>(`/ventas/liquidaciones/?${params.toString()}`)
  },

  // Registrar el pago de una liquidación
  async pagarLiquidacion(id: number, referencia_pago?: string): Promise<LiquidacionComision> {
    return apiRequest<LiquidacionComision>(`/ventas/liquidaciones/${id}/pagar_ahora/`, {
      method: 'POST',
      body: JSON.stringify({ referencia_pago }),
    })
  },

  // Descargar el Excel de planillas
  async exportarExcel(filters: PlanillasFilters): Promise<Blob> {
    const params = new URLSearchParams()
    if (filters.anio && filters.anio !== "all") params.append('anio', filters.anio)
    if (filters.mes && filters.mes !== "all") params.append('mes', filters.mes)
    if (filters.estado && filters.estado !== "all") params.append('estado', filters.estado)
    if (filters.search) params.append('search', filters.search)

    const token = await refreshTokenIfNeeded()
    const response = await fetch(`${config.api.baseUrl}/api/ventas/liquidaciones/exportar_excel/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al exportar el archivo Excel')
    }

    return response.blob()
  }
}
