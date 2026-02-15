import { apiRequest } from './api'

// Interfaces para los lotes
export interface Lote {
  id: number
  manzana: number
  numero_lote: string
  metros_cuadrados: string
  valor_total: string
  saldo_financiar: string // Saldo a financiar para el módulo de financiamiento
  enganche: string
  costo_instalacion: string
  plazo_meses: number
  cuota_mensual: string
  estado: 'disponible' | 'reservado' | 'vendido' | 'en_proceso' | 'cancelado'
  created_at: string
  updated_at: string
  manzana_nombre?: string // Nombre de la manzana
}

export interface LoteCreate {
  manzana: number
  numero_lote: string
  metros_cuadrados: string
  valor_total: string
  enganche: string
  costo_instalacion: string
  plazo_meses: number
  cuota_mensual: string
  estado: 'disponible' | 'reservado' | 'vendido' | 'en_proceso' | 'cancelado'
}

export interface LoteUpdate extends Partial<LoteCreate> {}

export interface LotesFilters {
  manzana?: string
  estado?: 'disponible' | 'reservado' | 'vendido' | 'en_proceso' | 'cancelado'
  precio_min?: number
  precio_max?: number
  metros_min?: number
  metros_max?: number
  solo_disponibles?: boolean
}

export interface LotesEstadisticas {
  total_lotes: number
  lotes_disponibles: number
  lotes_reservados: number
  lotes_vendidos: number
  lotes_en_proceso: number
  lotes_cancelados: number
  valor_total_inventario: string
  valor_total_vendido: string
  promedio_metros_cuadrados: string
  promedio_valor_lote: string
}

// Servicio de lotes
export const lotesService = {
  // Obtener todos los lotes con filtros opcionales
  async getLotes(filters?: LotesFilters): Promise<Lote[]> {
    const params = new URLSearchParams()
    
    if (filters) {
      if (filters.manzana) params.append('manzana', filters.manzana)
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.precio_min) params.append('precio_min', filters.precio_min.toString())
      if (filters.precio_max) params.append('precio_max', filters.precio_max.toString())
      if (filters.metros_min) params.append('metros_min', filters.metros_min.toString())
      if (filters.metros_max) params.append('metros_max', filters.metros_max.toString())
      if (filters.solo_disponibles) params.append('solo_disponibles', 'true')
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/lotes/lotes/?${queryString}` : '/lotes/lotes/'
    
    return apiRequest<Lote[]>(endpoint)
  },

  // Obtener un lote específico por ID
  async getLote(id: number): Promise<Lote> {
    return apiRequest<Lote>(`/lotes/lotes/${id}/`)
  },

  // Crear un nuevo lote
  async createLote(loteData: LoteCreate): Promise<Lote> {
    return apiRequest<Lote>('/lotes/lotes/', {
      method: 'POST',
      body: JSON.stringify(loteData),
    })
  },

  // Actualizar un lote existente
  async updateLote(id: number, loteData: LoteUpdate): Promise<Lote> {
    return apiRequest<Lote>(`/lotes/lotes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(loteData),
    })
  },

  // Eliminar un lote (si el backend lo soporta)
  async deleteLote(id: number): Promise<void> {
    return apiRequest<void>(`/lotes/lotes/${id}/`, {
      method: 'DELETE',
    })
  },

  // Obtener solo lotes disponibles
  async getLotesDisponibles(): Promise<Lote[]> {
    console.log('[LotesService] Llamando a getLotesDisponibles...')
    try {
      const result = await apiRequest<Lote[]>('/lotes/lotes/disponibles/')
      console.log('[LotesService] Respuesta exitosa:', result)
      return result
    } catch (error) {
      console.error('[LotesService] Error en getLotesDisponibles:', error)
      throw error
    }
  },

  // Obtener estadísticas de lotes
  async getEstadisticas(): Promise<LotesEstadisticas> {
    return apiRequest<LotesEstadisticas>('/lotes/lotes/estadisticas/')
  },

  // Función helper para calcular cuota mensual
  calcularCuotaMensual(valorTotal: number, enganche: number, instalacion: number, plazoMeses: number, tasaAnual = 12): number {
    const saldoFinanciar = valorTotal - enganche - instalacion
    const tasaMensual = tasaAnual / 12 / 100
    
    if (saldoFinanciar <= 0 || plazoMeses <= 0) return 0
    
    const cuota = (saldoFinanciar * tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / 
                  (Math.pow(1 + tasaMensual, plazoMeses) - 1)
    
    return cuota
  },

  // Función helper para calcular tabla de amortización
  calcularTablaAmortizacion(valorTotal: number, enganche: number, instalacion: number, plazoMeses: number, tasaAnual = 12) {
    const saldoFinanciar = valorTotal - enganche - instalacion
    const tasaMensual = tasaAnual / 12 / 100
    const cuotaMensual = this.calcularCuotaMensual(valorTotal, enganche, instalacion, plazoMeses, tasaAnual)
    const tabla = []
    let saldoPendiente = saldoFinanciar

    for (let mes = 1; mes <= Math.min(plazoMeses, 12); mes++) {
      const interes = saldoPendiente * tasaMensual
      const capital = cuotaMensual - interes
      saldoPendiente -= capital

      tabla.push({
        mes,
        cuota: cuotaMensual,
        capital,
        interes,
        saldoPendiente: Math.max(0, saldoPendiente)
      })
    }

    return tabla
  }
}

// Función helper para mapear lote del backend al formato del frontend
export const mapLoteFromApi = (apiLote: Lote) => {
  // Mapear el ID de manzana a un nombre descriptivo
  const getManzanaNombre = (manzanaId: number): string => {
    const manzanasMap: { [key: number]: string } = {
      1: 'Manzana A - Residencial',
      2: 'Manzana B - Comercial',
      3: 'Manzana C - Premium',
      4: 'Manzana D - Ejecutiva',
      5: 'Manzana E - Familiar',
      6: 'Manzana F - Especial',
      7: 'Manzana G - VIP',
      8: 'Manzana H - Económica'
    }
    return manzanasMap[manzanaId] || `Manzana ${String.fromCharCode(64 + manzanaId)}` // A=65, B=66, etc.
  }

  const manzanaNombre = apiLote.manzana_nombre || getManzanaNombre(apiLote.manzana)
  
  console.log('[mapLoteFromApi] Lote original:', apiLote)
  console.log('[mapLoteFromApi] Manzana ID:', apiLote.manzana, 'Nombre mapeado:', manzanaNombre)

  return {
    id: apiLote.id.toString(),
    manzana: manzanaNombre,
    lote: apiLote.numero_lote,
    metrosCuadrados: parseFloat(apiLote.metros_cuadrados),
    valorTotal: parseFloat(apiLote.valor_total),
    enganche: parseFloat(apiLote.enganche),
    instalacion: parseFloat(apiLote.costo_instalacion),
    saldoFinanciar: parseFloat(apiLote.saldo_financiar),
    plazoMeses: apiLote.plazo_meses,
    cuotaMensual: parseFloat(apiLote.cuota_mensual),
    estado: apiLote.estado
  }
}

// Función helper para mapear lote del frontend al formato del backend
export const mapLoteToApi = (frontendLote: any): LoteCreate => {
  // Extraer el ID de la manzana del nombre (asumiendo formato "Manzana X - Descripción")
  let manzanaId = 1 // Default
  if (frontendLote.manzana && typeof frontendLote.manzana === 'string') {
    const match = frontendLote.manzana.match(/Manzana\s+([A-Z])\s*-\s*/)
    if (match) {
      const letra = match[1]
      manzanaId = letra.charCodeAt(0) - 64 // A=1, B=2, C=3, etc.
    }
  }
  
  return {
    manzana: manzanaId,
    numero_lote: frontendLote.lote,
    metros_cuadrados: frontendLote.metrosCuadrados.toString(),
    valor_total: frontendLote.valorTotal.toString(),
    enganche: frontendLote.enganche.toString(),
    costo_instalacion: frontendLote.instalacion.toString(),
    plazo_meses: frontendLote.plazoMeses,
    cuota_mensual: frontendLote.cuotaMensual.toString(),
    estado: 'disponible'
  }
}
