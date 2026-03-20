import { apiRequest } from './api'

/**
 * Rol devuelto por la API (/api/roles/)
 */
export interface RoleItem {
  id: number
  name: string
  description?: string
  is_active?: boolean
}

export const rolesService = {
  /**
   * Obtener todos los roles activos
   */
  async getRoles(): Promise<RoleItem[]> {
    // la API está bajo el namespace `permissions`
    const response = await apiRequest<RoleItem[] | { results: RoleItem[] }>('/permissions/roles/')
    if (Array.isArray(response)) return response
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results
    }
    return []
  },
}