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
  fecha_pago?: string
  es_pago_inmediato: boolean
  forma_pago?: string
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
  vendedor?: string
  page?: number
}

export interface ResumenVendedor {
  vendedor_id: number
  vendedor_nombre: string
  total_comisiones: number
  monto_pendiente: number
  monto_pagado: number
  cantidad_ventas: number
  cantidad_pendientes: number
}

export const planillasService = {
  // Obtener liquidaciones con filtros y paginación
  async getLiquidaciones(filters: PlanillasFilters): Promise<LiquidacionesResponse> {
    const params = new URLSearchParams()
    if (filters.anio && filters.anio !== "all") params.append('anio', filters.anio)
    if (filters.mes && filters.mes !== "all") params.append('mes', filters.mes)
    if (filters.estado && filters.estado !== "all") params.append('estado', filters.estado)
    if (filters.search) params.append('search', filters.search)
    if (filters.vendedor) params.append('vendedor', filters.vendedor)
    if (filters.page) params.append('page', filters.page.toString())

    return apiRequest<LiquidacionesResponse>(`/ventas/liquidaciones/?${params.toString()}`)
  },

  // Obtener resumen de comisiones agrupadas por vendedor
  async getResumenVendedores(anio: string, mes: string): Promise<ResumenVendedor[]> {
    const params = new URLSearchParams()
    if (anio && anio !== "all") params.append('anio', anio)
    if (mes && mes !== "all") params.append('mes', mes)
    
    return apiRequest<ResumenVendedor[]>(`/ventas/liquidaciones/resumen_por_vendedor/?${params.toString()}`)
  },

  // Registrar el pago de una liquidación
  pagarLiquidacion: async (id: number, forma_pago?: string): Promise<LiquidacionComision> => {
    return apiRequest<LiquidacionComision>(`/ventas/liquidaciones/${id}/pagar_ahora/`, {
      method: 'POST',
      body: JSON.stringify({ forma_pago }),
    })
  },

  // Registrar el pago masivo de liquidaciones
  pagarLiquidacionesMultiples: async (ids: number[], forma_pago?: string): Promise<{ mensaje: string }> => {
    return apiRequest<{ mensaje: string }>(`/ventas/liquidaciones/pagar_multiples/`, {
      method: 'POST',
      body: JSON.stringify({ ids, forma_pago }),
    })
  },

  // Descargar el Excel de planillas
  async exportarExcel(filters: PlanillasFilters): Promise<Blob> {
    const params = new URLSearchParams()
    if (filters.anio && filters.anio !== "all") params.append('anio', filters.anio)
    if (filters.mes && filters.mes !== "all") params.append('mes', filters.mes)
    if (filters.estado && filters.estado !== "all") params.append('estado', filters.estado)
    if (filters.search) params.append('search', filters.search)
    if (filters.vendedor) params.append('vendedor', filters.vendedor)

    const token = await refreshTokenIfNeeded()
    const response = await fetch(`${config.api.baseUrl}/api/ventas/liquidaciones/exportar_excel/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.status === 400) {
      throw new Error('NO_DATA')
    }

    if (!response.ok) {
      throw new Error('Error al exportar el archivo Excel')
    }

    return response.blob()
  }
}
