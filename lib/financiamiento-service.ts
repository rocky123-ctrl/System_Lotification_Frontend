import { apiRequest } from './api'

// Interfaces para financiamiento
export interface Financiamiento {
  id: number
  lote_id: number
  promitente_comprador: string
  totalidad: string
  enganche: string
  plazo_meses: number
  cuota_mensual: string
  fecha_inicio_financiamiento: string
  estado: 'activo' | 'en_mora' | 'finalizado'
  capital_cancelado?: string
  interes_cancelado?: string
  cuotas_canceladas?: number
  created_at: string
  updated_at: string
  // Campos adicionales que pueden venir del backend
  lote?: {
    id: number
    manzana: string
    manzana_nombre?: string
    numero_lote: string
    metros_cuadrados: number
    valor_total: number
    saldo_financiar?: string
  }
  cuotas?: Cuota[]
  pagos?: Pago[]
}

export interface FinanciamientoCreate {
  lote_id: number
  promitente_comprador: string
  totalidad: string
  enganche: string
  plazo_meses: number
  cuota_mensual: string
  fecha_inicio_financiamiento: string
}

export interface FinanciamientoUpdate {
  promitente_comprador?: string
  totalidad?: string
  enganche?: string
  plazo_meses?: number
  cuota_mensual?: string
  fecha_inicio_financiamiento?: string
  estado?: 'activo' | 'en_mora' | 'finalizado'
}

export interface Cuota {
  id: number
  financiamiento_id: number
  numero_cuota: number
  fecha_vencimiento: string
  monto_capital: string
  monto_interes: string
  monto_total: string
  estado: 'pendiente' | 'pagada' | 'atrasada'
  fecha_pago?: string
  created_at: string
  updated_at: string
}

export interface Pago {
  id: number
  financiamiento_id: number
  fecha_pago: string
  monto: string
  numero_recibo: string
  observaciones?: string
  created_at: string
  updated_at: string
}

export interface PagoCreate {
  cuota_id: number
  financiamiento_id: number
  monto_capital: string
  monto_interes: string
  monto_mora: string
  monto_total: string
  fecha_pago: string
  metodo_pago: string
  referencia_pago: string
  observaciones: string
}

export interface PagoCapital {
  financiamiento_id: number
  monto: string
  fecha_pago: string
  concepto: string
}

export interface PagoMultiple {
  cuota: number
  financiamiento: number
  cuota_id: number
  financiamiento_id: number
  monto_capital: string
  monto_interes: string
  monto_mora?: string
  monto_total: string
  fecha_pago: string
  metodo_pago: string
  referencia_pago?: string
  observaciones?: string
}

export interface PagosMultiplesRequest {
  pagos: PagoMultiple[]
}

export interface FinanciamientoEstadisticas {
  total_financiamientos: number
  financiamientos_activos: number
  financiamientos_finalizados: number
  financiamientos_en_mora: number
  total_cobrado: string
  total_pendiente: string
  total_mora: string
  cuotas_atrasadas_total: number
}

// Servicio de financiamiento
export const financiamientoService = {
  // Obtener todos los financiamientos
  async getFinanciamientos(): Promise<Financiamiento[]> {
    return apiRequest<Financiamiento[]>('/financiamiento/financiamientos/')
  },

  // Obtener un financiamiento específico
  async getFinanciamiento(id: number): Promise<Financiamiento> {
    return apiRequest<Financiamiento>(`/financiamiento/financiamientos/${id}/`)
  },

  // Crear un nuevo financiamiento
  async createFinanciamiento(data: FinanciamientoCreate): Promise<Financiamiento> {
    return apiRequest<Financiamiento>('/financiamiento/financiamientos/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Actualizar un financiamiento
  async updateFinanciamiento(id: number, data: FinanciamientoUpdate): Promise<Financiamiento> {
    return apiRequest<Financiamiento>(`/financiamiento/financiamientos/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Eliminar un financiamiento
  async deleteFinanciamiento(id: number): Promise<void> {
    return apiRequest<void>(`/financiamiento/financiamientos/${id}/`, {
      method: 'DELETE',
    })
  },

  // Obtener financiamientos activos
  async getFinanciamientosActivos(): Promise<Financiamiento[]> {
    return apiRequest<Financiamiento[]>('/financiamiento/financiamientos/activos/')
  },

  // Obtener financiamientos en mora
  async getFinanciamientosEnMora(): Promise<Financiamiento[]> {
    return apiRequest<Financiamiento[]>('/financiamiento/financiamientos/en_mora/')
  },

  // Obtener financiamientos finalizados
  async getFinanciamientosFinalizados(): Promise<Financiamiento[]> {
    return apiRequest<Financiamiento[]>('/financiamiento/financiamientos/finalizados/')
  },

  // Obtener estadísticas
  async getEstadisticas(): Promise<FinanciamientoEstadisticas> {
    return apiRequest<FinanciamientoEstadisticas>('/financiamiento/financiamientos/estadisticas/')
  },

  // Calcular moras para un financiamiento
  async calcularMoras(id: number): Promise<void> {
    return apiRequest<void>(`/financiamiento/financiamientos/${id}/calcular_moras/`, {
      method: 'POST',
    })
  },

  // Obtener cuotas de un financiamiento
  async getCuotas(id: number): Promise<Cuota[]> {
    return apiRequest<Cuota[]>(`/financiamiento/financiamientos/${id}/cuotas/`)
  },

  // Obtener pagos de un financiamiento
  async getPagos(id: number): Promise<Pago[]> {
    return apiRequest<Pago[]>(`/financiamiento/financiamientos/${id}/pagos/`)
  },

  // Registrar un nuevo pago
  async registrarPago(data: PagoCreate): Promise<Pago> {
    return apiRequest<Pago>('/financiamiento/pagos/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Registrar múltiples pagos
  async registrarPagosMultiples(data: PagosMultiplesRequest): Promise<Pago[]> {
    return apiRequest<Pago[]>('/financiamiento/pagos/multiples_pagos/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Registrar pago a capital
  async registrarPagoCapital(data: PagoCapital): Promise<Pago> {
    return apiRequest<Pago>('/financiamiento/pagos-capital/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// Función helper para mapear financiamiento desde API
export const mapFinanciamientoFromApi = (apiFinanciamiento: any): Financiamiento => {
  return {
    id: apiFinanciamiento.id,
    lote_id: apiFinanciamiento.lote_id,
    promitente_comprador: apiFinanciamiento.promitente_comprador,
    totalidad: apiFinanciamiento.totalidad,
    enganche: apiFinanciamiento.enganche,
    plazo_meses: apiFinanciamiento.plazo_meses,
    cuota_mensual: apiFinanciamiento.cuota_mensual,
    fecha_inicio_financiamiento: apiFinanciamiento.fecha_inicio_financiamiento,
    estado: apiFinanciamiento.estado,
    capital_cancelado: apiFinanciamiento.capital_cancelado || "0.00",
    interes_cancelado: apiFinanciamiento.interes_cancelado || "0.00",
    cuotas_canceladas: apiFinanciamiento.cuotas_canceladas || 0,
    created_at: apiFinanciamiento.created_at,
    updated_at: apiFinanciamiento.updated_at,
    lote: apiFinanciamiento.lote,
    cuotas: apiFinanciamiento.cuotas,
    pagos: apiFinanciamiento.pagos,
  }
}

// Función helper para mapear financiamiento a API
export const mapFinanciamientoToApi = (financiamiento: FinanciamientoCreate): any => {
  return {
    lote_id: financiamiento.lote_id,
    promitente_comprador: financiamiento.promitente_comprador,
    totalidad: financiamiento.totalidad,
    enganche: financiamiento.enganche,
    plazo_meses: financiamiento.plazo_meses,
    cuota_mensual: financiamiento.cuota_mensual,
    fecha_inicio_financiamiento: financiamiento.fecha_inicio_financiamiento,
  }
}
