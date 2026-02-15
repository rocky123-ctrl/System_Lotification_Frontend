import { apiRequest } from './api'

// Interfaces para configuración general
export interface ConfiguracionGeneral {
  id: number
  nombre_lotificacion: string
  ubicacion: string
  descripcion: string
  direccion_completa: string
  telefono: string
  email: string
  sitio_web: string
  fecha_inicio: string
  total_lotes: number
  area_total: string
  tasa_anual: string
  activo: boolean
  logo?: string
  created_at: string
  updated_at: string
}

export interface ConfiguracionGeneralCreate {
  nombre_lotificacion: string
  ubicacion: string
  descripcion: string
  direccion_completa: string
  telefono: string
  email: string
  sitio_web: string
  fecha_inicio: string
  total_lotes: number
  area_total: string
  tasa_anual: string
  activo: boolean
}

export interface ConfiguracionGeneralUpdate extends Partial<ConfiguracionGeneralCreate> {}

// Interfaces para configuración financiera
export interface ConfiguracionFinanciera {
  id: number
  plazo_minimo_meses: number
  plazo_maximo_meses: number
  enganche_minimo_porcentaje: string
  enganche_maximo_porcentaje: string
  costo_instalacion_default: string
  permitir_pagos_anticipados: boolean
  aplicar_penalizacion_atrasos: boolean
  penalizacion_atraso_porcentaje: string
  configuracion_general: number
  created_at: string
  updated_at: string
}

export interface ConfiguracionFinancieraCreate {
  plazo_minimo_meses: number
  plazo_maximo_meses: number
  enganche_minimo_porcentaje: string
  enganche_maximo_porcentaje: string
  costo_instalacion_default: string
  permitir_pagos_anticipados: boolean
  aplicar_penalizacion_atrasos: boolean
  penalizacion_atraso_porcentaje: string
}

export interface ConfiguracionFinancieraUpdate extends Partial<ConfiguracionFinancieraCreate> {}

// Interfaces para respuestas especiales
export interface ConfiguracionPublica {
  nombre_lotificacion: string
  ubicacion: string
  descripcion: string
  telefono: string
  email: string
  sitio_web: string
}

export interface ConfiguracionResumen {
  nombre_lotificacion: string
  ubicacion: string
  total_lotes: number
  total_lotes_configurado?: number
  total_lotes_reales?: number
  lotes_disponibles: number
  lotes_vendidos: number
  lotes_reservados?: number
  lotes_en_proceso?: number
  lotes_cancelados?: number
  lotes_financiados?: number
  tasa_anual: string
  tasa_anual_formateada: string
  valor_total_inventario: string
  valor_total_vendido: string
  valor_total_reservados?: string
  valor_total_en_proceso?: string
  valor_total_financiado?: string
  fecha_ultima_actualizacion: string
}

export interface ConfiguracionEstadisticas {
  total_configuraciones: number
  configuracion_activa: boolean
  fecha_creacion_configuracion: string
  fecha_ultima_actualizacion: string
  tiene_logo: boolean
  tiene_configuracion_financiera: boolean
}

// Servicio de configuración general
export const configuracionGeneralService = {
  // Obtener todas las configuraciones
  async getConfiguraciones(): Promise<ConfiguracionGeneral[]> {
    return apiRequest<ConfiguracionGeneral[]>('/configuracion/general/')
  },

  // Obtener una configuración específica
  async getConfiguracion(id: number): Promise<ConfiguracionGeneral> {
    return apiRequest<ConfiguracionGeneral>(`/configuracion/general/${id}/`)
  },

  // Crear una nueva configuración
  async createConfiguracion(data: ConfiguracionGeneralCreate): Promise<ConfiguracionGeneral> {
    return apiRequest<ConfiguracionGeneral>('/configuracion/general/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Actualizar una configuración
  async updateConfiguracion(id: number, data: ConfiguracionGeneralUpdate): Promise<ConfiguracionGeneral> {
    return apiRequest<ConfiguracionGeneral>(`/configuracion/general/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Eliminar una configuración
  async deleteConfiguracion(id: number): Promise<void> {
    return apiRequest<void>(`/configuracion/general/${id}/`, {
      method: 'DELETE',
    })
  },

  // Obtener la configuración activa
  async getConfiguracionActiva(): Promise<ConfiguracionGeneral> {
    return apiRequest<ConfiguracionGeneral>('/configuracion/general/activa/')
  },

  // Obtener información pública
  async getConfiguracionPublica(): Promise<ConfiguracionPublica> {
    return apiRequest<ConfiguracionPublica>('/configuracion/general/public/')
  },

  // Obtener configuración completa
  async getConfiguracionCompleta(): Promise<ConfiguracionGeneral> {
    return apiRequest<ConfiguracionGeneral>('/configuracion/general/completa/')
  },

  // Obtener resumen de configuración
  async getConfiguracionResumen(): Promise<ConfiguracionResumen> {
    return apiRequest<ConfiguracionResumen>('/configuracion/general/resumen/')
  },

  // Obtener estadísticas
  async getEstadisticas(): Promise<ConfiguracionEstadisticas> {
    return apiRequest<ConfiguracionEstadisticas>('/configuracion/general/estadisticas/')
  },

  // Activar una configuración
  async activarConfiguracion(id: number): Promise<void> {
    return apiRequest<void>(`/configuracion/general/${id}/activar/`, {
      method: 'POST',
    })
  },

  // Subir logo
  async subirLogo(id: number, file: File): Promise<ConfiguracionGeneral> {
    const formData = new FormData()
    formData.append('logo', file)

    return apiRequest<ConfiguracionGeneral>(`/configuracion/general/${id}/subir_logo/`, {
      method: 'POST',
      body: formData,
      headers: {
        // No incluir Content-Type para FormData
      },
    })
  },
}

// Servicio de configuración financiera
export const configuracionFinancieraService = {
  // Obtener todas las configuraciones financieras
  async getConfiguraciones(): Promise<ConfiguracionFinanciera[]> {
    return apiRequest<ConfiguracionFinanciera[]>('/configuracion/financiera/')
  },

  // Obtener una configuración financiera específica
  async getConfiguracion(id: number): Promise<ConfiguracionFinanciera> {
    return apiRequest<ConfiguracionFinanciera>(`/configuracion/financiera/${id}/`)
  },

  // Crear una nueva configuración financiera
  async createConfiguracion(data: ConfiguracionFinancieraCreate): Promise<ConfiguracionFinanciera> {
    return apiRequest<ConfiguracionFinanciera>('/configuracion/financiera/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Actualizar una configuración financiera
  async updateConfiguracion(id: number, data: ConfiguracionFinancieraUpdate): Promise<ConfiguracionFinanciera> {
    return apiRequest<ConfiguracionFinanciera>(`/configuracion/financiera/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Eliminar una configuración financiera
  async deleteConfiguracion(id: number): Promise<void> {
    return apiRequest<void>(`/configuracion/financiera/${id}/`, {
      method: 'DELETE',
    })
  },

  // Obtener configuración financiera activa
  async getConfiguracionActiva(): Promise<ConfiguracionFinanciera> {
    return apiRequest<ConfiguracionFinanciera>('/configuracion/financiera/activa/')
  },

  // Crear configuración financiera para la configuración activa
  async crearParaActiva(data: ConfiguracionFinancieraCreate): Promise<ConfiguracionFinanciera> {
    return apiRequest<ConfiguracionFinanciera>('/configuracion/financiera/crear_para_activa/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// Función helper para formatear porcentajes
export const formatearPorcentaje = (valor: string | number): string => {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor
  return `${num.toFixed(2)}%`
}

// Función helper para formatear moneda
export const formatearMoneda = (valor: string | number): string => {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor
  return `Q ${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Función helper para formatear área
export const formatearArea = (valor: string | number): string => {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor
  return `${num.toLocaleString('es-GT')} m²`
}

// Función helper para calcular tasa mensual
export const calcularTasaMensual = (tasaAnual: string | number): number => {
  const tasa = typeof tasaAnual === 'string' ? parseFloat(tasaAnual) : tasaAnual
  return tasa / 12
}

// Función helper para formatear tasa mensual
export const formatearTasaMensual = (tasaAnual: string | number): string => {
  const tasaMensual = calcularTasaMensual(tasaAnual)
  return `${tasaMensual.toFixed(2)}%`
}
