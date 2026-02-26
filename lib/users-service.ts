import { apiRequest } from './api'

/** Usuario tal como lo devuelve el listado del backend (GET /api/users/) */
export interface UserListItem {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  is_active: boolean
  date_joined: string
  is_online: boolean
  last_activity: string | null
  phone: string
  address: string
}

export const usersService = {
  /**
   * Listar usuarios. Con role=Vendedor devuelve solo usuarios con rol Vendedor.
   */
  async getUsers(params?: { role?: string; search?: string }): Promise<UserListItem[]> {
    const searchParams = new URLSearchParams()
    if (params?.role) searchParams.set('role', params.role)
    if (params?.search) searchParams.set('search', params.search)
    const qs = searchParams.toString()
    const endpoint = qs ? `/users/?${qs}` : '/users/'
    const response = await apiRequest<UserListItem[] | { results: UserListItem[] }>(endpoint)
    if (Array.isArray(response)) return response
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results
    }
    return []
  },

  /** Listar solo usuarios con rol Vendedor (para el apartado Vendedores). */
  async getVendedores(search?: string): Promise<UserListItem[]> {
    return this.getUsers({ role: 'Vendedor', search: search || undefined })
  },
}
