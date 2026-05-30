import { apiRequest } from './api'

export interface CatalogoServicio {
  id: number
  nombre: string
  precio_base_defecto: string | number
  descripcion?: string
  icono?: string
  es_recurrente: boolean
  activo: boolean
  lotificacion: number
}

export interface BilleteraServicio {
  id: number
  cliente: number
  cliente_nombre?: string
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface ConfiguracionServicioLote {
  id: number
  lote: number
  lote_nombre?: string
  servicio: number
  servicio_nombre?: string
  precio_personalizado: string | number | null
  esta_activo: boolean
}

export interface PagoServicio {
  id: number
  lote: number
  lote_nombre?: string
  servicio: number
  servicio_nombre?: string
  mes_periodo: string
  monto_cobrado: string | number
  monto_pagado: string | number
  mora_aplicada: string | number
  fecha_limite: string
  fecha_pago_realizado: string | null
  estado: 'Pendiente' | 'Pagado' | 'Vencido'
}

export interface LotStatusResponse {
  lote_id: number
  numero_lote: string
  manzana: string
  lotificacion: string
  lotificacion_id: number
  estado_lote: string
  servicios_activos: ConfiguracionServicioLote[]
  configuraciones: ConfiguracionServicioLote[]
  historial_pagos: PagoServicio[]
  saldo_pendiente: number
  count_pendientes: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const serviciosService = {
  // ...

  // Catalogo
  async getCatalogo(filters?: { lotificacion_id?: number, activo?: boolean }): Promise<CatalogoServicio[]> {
    let url = '/servicios/catalogo/'
    const params = new URLSearchParams()
    if (filters?.lotificacion_id) params.append('lotificacion_id', filters.lotificacion_id.toString())
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString())
    
    const queryString = params.toString()
    if (queryString) url += `?${queryString}`
    
    const response = await apiRequest<any>(url)
    return Array.isArray(response) ? response : (response.results || [])
  },

  async createService(data: Partial<CatalogoServicio>): Promise<CatalogoServicio> {
    return apiRequest<CatalogoServicio>('/servicios/catalogo/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateService(id: number, data: Partial<CatalogoServicio>): Promise<CatalogoServicio> {
    return apiRequest<CatalogoServicio>(`/servicios/catalogo/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Billeteras
  async getBilleteras(): Promise<BilleteraServicio[]> {
    const response = await apiRequest<any>('/servicios/billeteras/')
    return Array.isArray(response) ? response : (response.results || [])
  },

  async createBilletera(clienteId: number): Promise<BilleteraServicio> {
    return apiRequest<BilleteraServicio>('/servicios/billeteras/', {
      method: 'POST',
      body: JSON.stringify({ cliente: clienteId }),
    })
  },

  async getLotStatus(billeteraId: number): Promise<LotStatusResponse[]> {
    return apiRequest<LotStatusResponse[]>(`/servicios/billeteras/${billeteraId}/lots_status/`)
  },

  async deleteBilletera(id: number): Promise<void> {
    await apiRequest(`/servicios/billeteras/${id}/`, {
      method: 'DELETE',
    })
  },

  // Configuraciones
  async getConfiguraciones(filters?: { lote_id?: number }): Promise<ConfiguracionServicioLote[]> {
    let url = '/servicios/configuraciones/'
    if (filters?.lote_id) url += `?lote_id=${filters.lote_id}`
    const response = await apiRequest<any>(url)
    return Array.isArray(response) ? response : (response.results || [])
  },

  async createConfiguracion(data: Partial<ConfiguracionServicioLote>): Promise<ConfiguracionServicioLote> {
    return apiRequest<ConfiguracionServicioLote>('/servicios/configuraciones/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateConfiguracion(id: number, data: Partial<ConfiguracionServicioLote>): Promise<ConfiguracionServicioLote> {
    return apiRequest<ConfiguracionServicioLote>(`/servicios/configuraciones/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Pagos
  async getPagos(filters?: { lote_id?: number, servicio_id?: number, estado?: string, exclude_estado?: string, page?: number }): Promise<any> {
    let url = '/servicios/pagos/'
    const params = new URLSearchParams()
    if (filters?.lote_id) params.append('lote_id', filters.lote_id.toString())
    if (filters?.servicio_id) params.append('servicio_id', filters.servicio_id.toString())
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.exclude_estado) params.append('exclude_estado', filters.exclude_estado)
    if (filters?.page) params.append('page', filters.page.toString())
    
    const queryString = params.toString()
    if (queryString) url += `?${queryString}`
    
    return apiRequest<any>(url)
  },

  async createPago(data: Partial<PagoServicio>): Promise<PagoServicio> {
    return apiRequest<PagoServicio>('/servicios/pagos/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updatePago(id: number, data: Partial<PagoServicio>): Promise<PagoServicio> {
    return apiRequest<PagoServicio>(`/servicios/pagos/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async getRecibo(pagoId: number): Promise<Blob> {
    const { apiInstance } = await import('./api')
    const response = await apiInstance.get(`/servicios/pagos/${pagoId}/recibo/`, {
      responseType: 'blob'
    })
    return new Blob([response.data], { type: 'application/pdf' })
  },

  async deletePago(id: number): Promise<void> {
    await apiRequest(`/servicios/pagos/${id}/`, {
      method: 'DELETE',
    })
  }
}
