import { apiRequest } from './api'

export interface Cliente {
  id: number
  nombres: string
  apellidos: string
  dpi?: string
  nit?: string
  telefono?: string
  email?: string
  direccion: string
  estado: 'activo' | 'inactivo'
  fechaRegistro: string
}

export interface ClientesStats {
  activos: number
  inactivos: number
  total: number
}

export const getClientesStats = async (): Promise<ClientesStats> => {
  return apiRequest<ClientesStats>('/clientes/stats/')
}

export const getClientes = async (page: number = 1, limit: number = 10, search?: string, estado: string = 'activo'): Promise<{ clientes: Cliente[], total: number, pages: number }> => {
  let url = `/clientes/?page=${page}&page_size=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (estado && estado !== 'todos') url += `&estado=${estado}`;
  
  const response = await apiRequest<any>(url)
  return {
    clientes: response.results || [],
    total: response.count || 0,
    pages: Math.ceil((response.count || 0) / limit) || 1
  }
}

export const registrarCliente = async (data: Omit<Cliente, 'id' | 'fechaRegistro'>): Promise<Cliente> => {
  return apiRequest<Cliente>('/clientes/registrar/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const actualizarCliente = async (id: number, data: Omit<Cliente, 'id' | 'fechaRegistro'>): Promise<Cliente> => {
  return apiRequest<Cliente>(`/clientes/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const eliminarCliente = async (id: number, force: boolean = false): Promise<void> => {
  if (force) {
    return apiRequest<void>(`/clientes/${id}/force_delete/`, {
      method: 'DELETE',
    })
  }
  return apiRequest<void>(`/clientes/${id}/`, {
    method: 'DELETE',
  })
}

// Interfaces y Endpoints para Geografía (Lotificaciones, Manzanas, Lotes)
export interface Lotificacion {
  id: string | number
  nombre: string
  activo?: boolean
}

export interface Manzana {
  id: string | number
  nombre: string
  lotificacion: number | string
  activo?: boolean
}

export interface Lote {
  id: string | number
  identificador: string
  numero_lote: string
  manzana: number | string
  estado: string
  activo?: boolean
}

export const getLotificaciones = async (): Promise<Lotificacion[]> => {
  // Las lotificaciones por defecto en este Endpoint vienen con paginación? 
  // Depende de la configuración de DRF paginación global. Normalmente sí.
  // Asumiremos que el backend retorna un array o un paginated reponse.
  const response = await apiRequest<any>('/lotes/lotificaciones/?page_size=0')
  return Array.isArray(response) ? response : (response.results || [])
}

export const getManzanas = async (lotificacionId: string | number): Promise<Manzana[]> => {
  const response = await apiRequest<any>(`/lotes/manzanas/?lotificacion=${lotificacionId}&page_size=0`)
  return Array.isArray(response) ? response : (response.results || [])
}

export const getLotes = async (manzanaId: string | number): Promise<Lote[]> => {
  const response = await apiRequest<any>(`/lotes/lotes/?manzana_id=${manzanaId}&page_size=0`)
  return Array.isArray(response) ? response : (response.results || [])
}