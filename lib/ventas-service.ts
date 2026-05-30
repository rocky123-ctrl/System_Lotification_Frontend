import { apiRequest } from './api'

export interface CalculoVentaPayload {
  valor_lote: number
  enganche: number
  descuento: number
  tipo_pago: 'contado' | 'financiado'
  plazo_meses: number
  tasa_interes: number
  acepta_instalacion?: boolean
  costo_instalacion?: number
}

export interface CalculoVentaResponse {
  valor_lote: number
  valor_lote_con_descuento: number
  valor_total: number
  valor_con_descuento: number
  enganche_puro: number
  faltante: number
  valor_financiar: number
  tasa_anual: number
  tasa_mensual_efectiva_porcentaje: number
  plazo_meses: number
  cuota_final_mensual: number
  total_financia_mas_intereses: number
  valor_intereses: number
  total_pagar_hoy: number
  error?: string
}

export interface RegistrarVentaPayload {
  cliente: number
  lote: number
  valor_lote: number
  enganche: number
  descuento: number
  tipo_pago: 'CONTADO' | 'FINANCIADO'
  plazo_meses: number
  tasa_interes_anual: number
  acepta_instalacion: boolean
  forma_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'DEPOSITO'
}

export interface Venta {
  id: number
  cliente: number
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
  lote_estado_disponibilidad?: string
  valor_lote: string
  enganche: string
  descuento: string
  monto_financiar: string
  total_pagado_calculado?: string
  tasa_interes_anual: string
  total_pagar_contado: string
  comision_monto: string
  tipo_pago: 'CONTADO' | 'FINANCIADO'
  forma_pago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'DEPOSITO'
  acepta_instalacion: boolean
  plazo_meses: number
  estado: 'GENERADA' | 'COMPLETADA' | 'CANCELADA'
  fecha_creacion: string
}

export interface ResumenVentas {
  total_ventas: number
  total_comisiones: number
  conteo: number
}

export const ventasService = {
  // Petición al Backend para hacer cálculos financieros
  async calcularVenta(payload: CalculoVentaPayload): Promise<CalculoVentaResponse> {
    return apiRequest<CalculoVentaResponse>('/ventas/calcular/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // Registrar definitivamente la venta
  async registrarVenta(payload: RegistrarVentaPayload): Promise<any> {
    return apiRequest<any>('/ventas/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // Obtener historial de ventas con filtros
  async getHistorialVentas(filters: { anio?: string; mes?: string; search?: string; lotificacion?: string; estado?: string; all?: boolean; page?: number }): Promise<{ count: number; results: Venta[] }> {
    const params = new URLSearchParams()
    if (filters.anio && filters.anio !== "all") params.append('anio', filters.anio)
    if (filters.mes && filters.mes !== "all") params.append('mes', filters.mes)
    if (filters.lotificacion) params.append('lotificacion', filters.lotificacion)
    if (filters.estado && filters.estado !== "TODOS") params.append('estado', filters.estado)
    if (filters.search) params.append('search', filters.search)
    if (filters.all) params.append('all', 'true')
    if (filters.page) params.append('page', filters.page.toString())

    const response = await apiRequest<any>(`/ventas/?${params.toString()}`)
    
    // Si es array (sin paginación)
    if (Array.isArray(response)) {
      return { results: response, count: response.length }
    }
    
    // Si es paginado
    if (response && response.results) {
      return { results: response.results, count: response.count || response.results.length }
    }
    
    return { results: [], count: 0 }
  },

  // Obtener resumen de ventas
  async getResumenVentas(filters: { anio?: string; mes?: string; search?: string; lotificacion?: string; estado?: string; all?: boolean }): Promise<ResumenVentas> {
    const params = new URLSearchParams()
    if (filters.anio && filters.anio !== "all") params.append('anio', filters.anio)
    if (filters.mes && filters.mes !== "all") params.append('mes', filters.mes)
    if (filters.lotificacion) params.append('lotificacion', filters.lotificacion)
    if (filters.estado && filters.estado !== "TODOS") params.append('estado', filters.estado)
    if (filters.search) params.append('search', filters.search)
    if (filters.all) params.append('all', 'true')

    return apiRequest<ResumenVentas>(`/ventas/resumen/?${params.toString()}`)
  },

  // Obtener detalle de una venta
  async getVenta(ventaId: number): Promise<Venta> {
    return apiRequest<Venta>(`/ventas/${ventaId}/`)
  },

  // Editar Venta
  async editarVenta(ventaId: number, payload: Partial<RegistrarVentaPayload>): Promise<any> {
    return apiRequest<any>(`/ventas/${ventaId}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  // Eliminar Venta (Carga estado CANCELADA)
  async eliminarVenta(ventaId: number): Promise<void> {
    return apiRequest<void>(`/ventas/${ventaId}/`, {
      method: 'DELETE',
    })
  },

  // Restaurar una venta cancelada
  async restaurarVenta(id: number): Promise<Venta> {
    return apiRequest<Venta>(`/ventas/${id}/restaurar/`, {
      method: 'POST'
    })
  },

  // Eliminar permanentemente una venta cancelada
  async eliminarPermanenteVenta(id: number): Promise<any> {
    return apiRequest<any>(`/ventas/${id}/eliminar_permanente/`, {
      method: 'POST'
    })
  },

  // Escriturar un lote desde una venta completada
  async escriturarVenta(id: number): Promise<any> {
    return apiRequest<any>(`/ventas/${id}/escriturar/`, {
      method: 'POST'
    })
  }
}
