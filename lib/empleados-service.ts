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
  sueldo: string | null
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
  sueldo?: string
  porcentaje_comision?: string
  estado?: boolean
  username?: string
  password?: string
  confirm_password?: string
}

export const empleadosService = {
  async getEmpleados(params?: { search?: string }): Promise<Empleado[]> {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set('search', params.search)
    
    // As DRF PageNumberPagination is enabled, results might be paginated
    const endpoint = searchParams.toString() ? `/empleados/?${searchParams.toString()}` : '/empleados/'
    const response = await apiRequest<Empleado[] | { results: Empleado[] }>(endpoint)
    
    if (Array.isArray(response)) return response
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results
    }
    return []
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
