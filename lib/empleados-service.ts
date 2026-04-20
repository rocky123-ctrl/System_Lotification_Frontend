import { apiRequest } from './api'

export interface Empleado {
  id: number
  nombre: string
  apellido: string | null
  telefono: string | null
  correo: string | null
  dpi: string | null
  direccion: string | null
  fecha_contratacion: string
  rol: string
  porcentaje_comision: string | null
  estado: boolean
  fecha_creacion: string
  username?: string
}

export interface EmpleadoFormData {
  nombre: string
  apellido?: string
  telefono?: string
  correo?: string
  dpi?: string
  direccion?: string
  fecha_contratacion: string
  rol: string
  porcentaje_comision?: string
  estado?: boolean
  username?: string
  password?: string
  confirm_password?: string
}

export const empleadosService = {
  async getEmpleados(params?: { search?: string, page?: number, rol?: string }): Promise<{ count: number, results: Empleado[] }> {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.rol) searchParams.set('rol', params.rol)
    
    const endpoint = searchParams.toString() ? `/empleados/?${searchParams.toString()}` : '/empleados/'
    const response = await apiRequest<{ count: number, results: Empleado[] }>(endpoint)
    
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response
    }
    
    // Fallback if not paginated or unexpected format
    return {
      count: Array.isArray(response) ? response.length : 0,
      results: Array.isArray(response) ? response : []
    }
  },

  async crearEmpleado(data: EmpleadoFormData): Promise<Empleado> {
    return await apiRequest<Empleado>('/empleados/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async actualizarEmpleado(id: number, data: Partial<EmpleadoFormData>): Promise<Empleado> {
    return await apiRequest<Empleado>(`/empleados/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async eliminarEmpleado(id: number): Promise<void> {
    await apiRequest(`/empleados/${id}/`, {
      method: 'DELETE',
    })
  }
}
