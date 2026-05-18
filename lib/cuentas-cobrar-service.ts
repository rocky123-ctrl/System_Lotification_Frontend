import { apiRequest } from './api'

export interface Cuota {
  id: number
  esta_vencida: boolean
  mora_sugerida: string
  dias_atraso: number
  no_cuota: number
  fecha_programada: string
  monto_cuota: string
  estado: 'Pendiente' | 'Pagado' | 'Vencido' | 'Revertido'
  venta: number
}

export interface Pago {
  id?: number
  monto_base: string
  monto_mora: string
  fecha_pago?: string
  metodo_pago: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Depósito'
  referencia: string
  activo?: boolean
  cuota: number
}

export interface BitacoraCambio {
  id: number
  usuario_nombre: string
  fecha: string
  descripcion: string
  venta: number
}

export const cuentasCobrarService = {
  // Obtener cuotas de una venta con filtros y paginación
  async getCuotasByVenta(ventaId: number, filters?: { anio?: string; mes?: string; page?: number }): Promise<{ count: number; results: Cuota[] }> {
    const params = new URLSearchParams()
    params.append('venta_id', ventaId.toString())
    if (filters?.anio && filters.anio !== 'all') params.append('anio', filters.anio)
    if (filters?.mes && filters.mes !== 'all') params.append('mes', filters.mes)
    if (filters?.page) params.append('page', filters.page.toString())
    
    const res = await apiRequest<any>(`/cuentas-cobrar/cuotas/?${params.toString()}`)
    return {
      results: Array.isArray(res) ? res : (res.results || []),
      count: res.count || (Array.isArray(res) ? res.length : 0)
    }
  },

  // Registrar un pago
  async registrarPago(pagoData: Pago): Promise<Pago> {
    return apiRequest<Pago>('/cuentas-cobrar/pagos/', {
      method: 'POST',
      body: JSON.stringify(pagoData),
    })
  },

  // Anular un pago
  async anularPago(pagoId: number, motivo: string): Promise<{ mensaje: string; cuota_estado: string }> {
    return apiRequest<{ mensaje: string; cuota_estado: string }>(`/cuentas-cobrar/pagos/${pagoId}/anular/`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    })
  },

  // Obtener historial de cambios con filtros y paginación
  async getBitacoraByVenta(ventaId: number, filters?: { anio?: string; mes?: string; page?: number }): Promise<{ count: number; results: BitacoraCambio[] }> {
    const params = new URLSearchParams()
    params.append('venta_id', ventaId.toString())
    if (filters?.anio && filters.anio !== 'all') params.append('anio', filters.anio)
    if (filters?.mes && filters.mes !== 'all') params.append('mes', filters.mes)
    if (filters?.page) params.append('page', filters.page.toString())

    const res = await apiRequest<any>(`/cuentas-cobrar/bitacora/?${params.toString()}`)
    return {
      results: Array.isArray(res) ? res : (res.results || []),
      count: res.count || (Array.isArray(res) ? res.length : 0)
    }
  }
}
