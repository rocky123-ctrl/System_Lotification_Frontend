import { apiRequest } from './api'

export interface CalculoCotizacionResponse {
  valor_lote: number
  valor_con_descuento: number
  valor_financiar: number
  tasa_anual: number
  tasa_mensual_efectiva_porcentaje: number
  plazo_meses: number
  cuota_final_mensual: number
  total_pagar_hoy: number
  error?: string
}

export interface RegistrarCotizacionPayload {
  cliente?: number | null
  nombre_prospecto?: string
  telefono_prospecto?: string
  fecha_vencimiento: string
  lote: number
  valor_lote: number
  enganche: number
  descuento: number
  tipo_pago: 'CONTADO' | 'FINANCIADO'
  plazo_meses: number
  tasa_interes_anual: number
  acepta_instalacion: boolean
  forma_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'
}

export interface Cotizacion {
  id: number
  cliente?: number
  nombre_prospecto?: string
  telefono_prospecto?: string
  fecha_vencimiento: string
  vendedor: number
  lote: number
  vendedor_nombre: string
  cliente_nombre: string
  lote_numero: string
  lote_manzana: string
  lotificacion_nombre: string
  lotificacion_id?: number
  plano_svg_id?: string
  lote_identificador?: string
  lote_costo_instalacion?: string
  lote_valor_total?: string
  valor_lote: string
  enganche: string
  descuento: string
  monto_financiar: string
  tasa_interes_anual: string
  total_pagar_contado: string
  cuota_mensual_estimada: number
  tipo_pago: 'CONTADO' | 'FINANCIADO'
  forma_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'
  acepta_instalacion: boolean
  plazo_meses: number
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA'
  fecha_creacion: string
}

export const cotizacionesService = {
  // Obtener cotizaciones con filtros
  async getCotizaciones(filters: { search?: string; estado?: string; lotificacion?: string | number; all?: boolean; page?: number }): Promise<{ count: number; results: Cotizacion[] }> {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.estado && filters.estado !== 'TODOS') params.append('estado', filters.estado)
    if (filters.lotificacion) params.append('lotificacion', filters.lotificacion.toString())
    if (filters.all) params.append('all', 'true')
    if (filters.page) params.append('page', filters.page.toString())

    const response = await apiRequest<any>(`/ventas/cotizaciones/?${params.toString()}`)
    
    if (Array.isArray(response)) {
      return { results: response, count: response.length }
    }
    
    if (response && response.results) {
      return { results: response.results, count: response.count || response.results.length }
    }
    
    return { results: [], count: 0 }
  },

  // Registrar definitivamente la cotizacion
  async registrarCotizacion(payload: RegistrarCotizacionPayload): Promise<any> {
    return apiRequest<any>('/ventas/cotizaciones/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // Obtener detalle de una cotizacion
  async getCotizacion(cotizacionId: number): Promise<Cotizacion> {
    return apiRequest<Cotizacion>(`/ventas/cotizaciones/${cotizacionId}/`)
  },

  // Editar Cotizacion
  async editarCotizacion(cotizacionId: number, payload: Partial<RegistrarCotizacionPayload>): Promise<any> {
    return apiRequest<any>(`/ventas/cotizaciones/${cotizacionId}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  // Eliminar Cotizacion
  async eliminarCotizacion(cotizacionId: number): Promise<void> {
    return apiRequest<void>(`/ventas/cotizaciones/${cotizacionId}/`, {
      method: 'DELETE',
    })
  },

  // Convertir a Venta
  async convertirAVenta(cotizacionId: number): Promise<{mensaje: string; venta_id: number}> {
    return apiRequest<{mensaje: string; venta_id: number}>(`/ventas/cotizaciones/${cotizacionId}/convertir_a_venta/`, {
      method: 'POST',
    })
  },
  
  // Rechazar Cotizacion
  async rechazarCotizacion(cotizacionId: number): Promise<any> {
    return apiRequest<any>(`/ventas/cotizaciones/${cotizacionId}/rechazar/`, {
      method: 'POST',
    })
  },

  // Restaurar Cotizacion
  async restaurarCotizacion(cotizacionId: number): Promise<any> {
    return apiRequest<any>(`/ventas/cotizaciones/${cotizacionId}/restaurar/`, {
      method: 'POST',
    })
  },

  // Exportar a Excel
  async exportarExcel(cotizacionId: number, filename: string): Promise<Blob> {
    const { config } = await import('./config')
    const token = sessionStorage.getItem(config.auth.tokenKey)
    
    const response = await fetch(`${config.api.baseUrl}/api/ventas/cotizaciones/${cotizacionId}/exportar_excel/?filename=${encodeURIComponent(filename)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Error al generar el archivo Excel')
    }
    
    return response.blob()
  }
}
