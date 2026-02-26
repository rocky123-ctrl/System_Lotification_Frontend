import { apiRequest, apiRequestText } from './api'

// Interfaces para lotificación basadas en el modelo Lotificacion del backend
export interface Lotificacion {
  id: number
  nombre: string
  descripcion: string | null
  ubicacion: string | null
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
  // Campos de estadísticas
  total_manzanas: number
  total_lotes: number
  area_total_m2: number
  // Campos de auditoría (solo lectura)
  created_at?: string
  updated_at?: string
  created_by?: number | null
  created_by_nombre?: string | null
  updated_by?: number | null
  updated_by_nombre?: string | null
  // Campos del plano SVG
  plano_svg?: string | null
  plano_svg_nombre?: string | null
  plano_svg_tamaño?: number | null
  plano_svg_fecha_subida?: string | null
  plano_svg_url?: string | null
  tiene_plano_svg?: boolean
}

export interface LotificacionCreate {
  nombre: string
  descripcion?: string
  ubicacion?: string
  activo?: boolean
  total_manzanas?: number
  total_lotes?: number
  area_total_m2?: number
}

export interface LotificacionUpdate extends Partial<LotificacionCreate> {}

/** Item de listado para plano interactivo (identificador + estado para colorear). */
export interface LotePlanoItem {
  id: number
  identificador: string | null
  estado: string
  activo: boolean
  manzana?: number
  manzana_nombre?: string
}

/** Detalle completo de lote (respuesta de GET lotes/{identificador}/). */
export interface LoteDetallePlano {
  id: number
  identificador: string | null
  numero_lote: string
  metros_cuadrados: string
  valor_total: string
  costo_instalacion: string
  estado: string
  manzana: number
  manzana_nombre?: string
  version?: number
  [key: string]: unknown
}

// Servicio de lotificación
export const lotificacionService = {
  // Obtener todas las lotificaciones (activas e inactivas)
  async getLotificaciones(): Promise<Lotificacion[]> {
    try {
      const response = await apiRequest<any>('/lotes/lotificaciones/')
      // Manejar respuesta paginada o array directo
      if (Array.isArray(response)) {
        return response
      }
      // Si viene paginado, extraer results
      if (response && response.results && Array.isArray(response.results)) {
        return response.results
      }
      // Si es un objeto vacío o formato inesperado, retornar array vacío
      return []
    } catch (error: any) {
      console.error('[lotificacionService] Error obteniendo lotificaciones:', error)
      // Si es 404, retornar array vacío (no hay lotificaciones)
      if (error.status === 404) {
        return []
      }
      throw error
    }
  },

  // Obtener una lotificación específica
  async getLotificacion(id: number): Promise<Lotificacion> {
    return apiRequest<Lotificacion>(`/lotes/lotificaciones/${id}/`)
  },

  // Crear una nueva lotificación
  async createLotificacion(data: LotificacionCreate): Promise<Lotificacion> {
    try {
      const response = await apiRequest<Lotificacion>('/lotes/lotificaciones/', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      console.log('[lotificacionService] Lotificación creada exitosamente:', response)
      return response
    } catch (error: any) {
      console.error('[lotificacionService] Error creando lotificación:', error)
      throw error
    }
  },

  // Actualizar una lotificación
  async updateLotificacion(id: number, data: LotificacionUpdate): Promise<Lotificacion> {
    try {
      const response = await apiRequest<Lotificacion>(`/lotes/lotificaciones/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      console.log('[lotificacionService] Lotificación actualizada exitosamente:', response)
      return response
    } catch (error: any) {
      console.error('[lotificacionService] Error actualizando lotificación:', error)
      throw error
    }
  },

  // Eliminar una lotificación
  async deleteLotificacion(id: number): Promise<void> {
    try {
      await apiRequest<void>(`/lotes/lotificaciones/${id}/`, {
        method: 'DELETE',
      })
      console.log('[lotificacionService] Lotificación eliminada exitosamente:', id)
    } catch (error: any) {
      console.error('[lotificacionService] Error eliminando lotificación:', error)
      throw error
    }
  },

  /** Manzana para listado/edición (tabla lotes_manzana). */
  async getManzanas(
    lotificacionId: number,
    todas?: boolean
  ): Promise<{ id: number; nombre: string; activo: boolean }[]> {
    const qs = todas ? '?todas=1' : ''
    const response = await apiRequest<any>(`/lotes/lotificaciones/${lotificacionId}/manzanas/${qs}`)
    const list = Array.isArray(response) ? response : (response?.results ?? [])
    return list.map((m: any) => ({
      id: m.id,
      nombre: m.nombre ?? '',
      activo: m.activo !== false,
    }))
  },

  /** Crear manzana en una lotificación. */
  async createManzana(
    lotificacionId: number,
    data: { nombre: string; activo?: boolean }
  ): Promise<{ id: number; nombre: string; activo: boolean }> {
    const res = await apiRequest<any>('/lotes/manzanas/', {
      method: 'POST',
      body: JSON.stringify({ lotificacion: lotificacionId, nombre: data.nombre.slice(0, 10), activo: data.activo !== false }),
    })
    return { id: res.id, nombre: res.nombre ?? data.nombre, activo: res.activo !== false }
  },

  /** Actualizar manzana. */
  async updateManzana(
    id: number,
    data: { nombre?: string; activo?: boolean }
  ): Promise<{ id: number; nombre: string; activo: boolean }> {
    const payload: any = {}
    if (data.nombre !== undefined) payload.nombre = data.nombre.slice(0, 10)
    if (data.activo !== undefined) payload.activo = data.activo
    const res = await apiRequest<any>(`/lotes/manzanas/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return { id: res.id, nombre: res.nombre ?? '', activo: res.activo !== false }
  },

  /** SVG del plano como texto (GET /api/lotes/lotificaciones/{id}/plano-svg/). Para plano interactivo. */
  async getPlanoSvg(lotificacionId: number): Promise<string> {
    return apiRequestText(`/lotes/lotificaciones/${lotificacionId}/plano-svg/`)
  },

  /** Lista de lotes de una lotificación (identificador, estado) para pintar el plano. */
  async getLotesPlano(lotificacionId: number): Promise<LotePlanoItem[]> {
    const response = await apiRequest<LotePlanoItem[]>(`/lotes/lotificaciones/${lotificacionId}/lotes/`)
    return Array.isArray(response) ? response : []
  },

  /** Detalle de un lote por identificador dentro de la lotificación. */
  async getLotePorIdentificador(lotificacionId: number, identificador: string): Promise<LoteDetallePlano> {
    return apiRequest<LoteDetallePlano>(
      `/lotes/lotificaciones/${lotificacionId}/lotes/${encodeURIComponent(identificador)}/`
    )
  },

  /**
   * Registrar un lote nuevo desde el plano (por identificador).
   * Campos editables: metros_cuadrados, valor_total, costo_instalacion, estado.
   */
  async registrarLoteDesdePlano(
    lotificacionId: number,
    payload: {
      identificador: string
      metros_cuadrados: number
      valor_total: number
      costo_instalacion?: number
      estado?: string
    }
  ): Promise<LoteDetallePlano> {
    return apiRequest<LoteDetallePlano>(
      `/lotes/lotificaciones/${lotificacionId}/registrar-lote/`,
      { method: 'POST', body: JSON.stringify(payload) }
    )
  },

  // Obtener la lotificación activa (primera activa)
  async getLotificacionActiva(): Promise<Lotificacion | null> {
    try {
      const lotificaciones = await this.getLotificaciones()
      if (!Array.isArray(lotificaciones) || lotificaciones.length === 0) {
        return null
      }
      return lotificaciones.find(l => l.activo) || lotificaciones[0] || null
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  },

  // Subir plano SVG de una lotificación
  async subirPlanoSvg(id: number, archivo: File): Promise<Lotificacion> {
    try {
      const formData = new FormData()
      formData.append('plano_svg', archivo)

      const { config } = await import('./config')
      const API_BASE_URL = config.api.baseUrl + '/api'
      const url = `${API_BASE_URL}/lotes/lotificaciones/${id}/subir-plano-svg/`
      
      // Obtener token
      const { refreshTokenIfNeeded } = await import('./api')
      const token = await refreshTokenIfNeeded()

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          // NO incluir Content-Type para FormData, el navegador lo hace automáticamente
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || errorData.detail || 'Error al subir el plano SVG')
      }

      const data = await response.json()
      console.log('[lotificacionService] Plano SVG subido exitosamente:', data)
      return data.data || data
    } catch (error: any) {
      console.error('[lotificacionService] Error subiendo plano SVG:', error)
      throw error
    }
  },

  // Eliminar plano SVG de una lotificación
  async eliminarPlanoSvg(id: number): Promise<Lotificacion> {
    try {
      const { config } = await import('./config')
      const API_BASE_URL = config.api.baseUrl + '/api'
      const url = `${API_BASE_URL}/lotes/lotificaciones/${id}/eliminar-plano-svg/`
      
      // Obtener token
      const { refreshTokenIfNeeded } = await import('./api')
      const token = await refreshTokenIfNeeded()

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || errorData.detail || 'Error al eliminar el plano SVG')
      }

      const data = await response.json()
      console.log('[lotificacionService] Plano SVG eliminado exitosamente:', data)
      return data.data || data
    } catch (error: any) {
      console.error('[lotificacionService] Error eliminando plano SVG:', error)
      throw error
    }
  },
}

