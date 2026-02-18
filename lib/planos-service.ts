import { config as appConfig } from './config'

const API_BASE_URL = appConfig.api.baseUrl + '/api'

interface PlanoResponse {
  id: number
  url: string
  nombre: string
  fecha_subida: string
  es_pdf?: boolean
  es_imagen?: boolean
}

// Función para hacer peticiones con FormData (sin Content-Type automático)
async function apiRequestFormData<T>(
  endpoint: string,
  formData: FormData,
  retryCount = 0
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Obtener token
  const token = localStorage.getItem(appConfig.auth.tokenKey)
  
  const config: RequestInit = {
    method: 'POST',
    body: formData,
    headers: {
      // NO incluir Content-Type - el navegador lo establecerá automáticamente con el boundary
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      // Si es error 401 y no hemos intentado renovar el token, intentar renovar y reintentar
      if (response.status === 401 && retryCount === 0) {
        console.log('[API] Token expirado, intentando renovar...')
        try {
          const refreshToken = localStorage.getItem(appConfig.auth.refreshTokenKey)
          if (refreshToken) {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh: refreshToken }),
            })
            
            if (refreshResponse.ok) {
              const { access } = await refreshResponse.json()
              localStorage.setItem(appConfig.auth.tokenKey, access)
              
              // Reintentar la petición con el nuevo token
              return apiRequestFormData<T>(endpoint, formData, retryCount + 1)
            }
          }
        } catch (refreshError) {
          console.error('[API] Error renovando token:', refreshError)
          localStorage.removeItem(appConfig.auth.tokenKey)
          localStorage.removeItem(appConfig.auth.refreshTokenKey)
          localStorage.removeItem('lotificacion_user')
          throw new Error('Sesión expirada')
        }
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || errorData.detail || `Error ${response.status}`
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error de conexión')
  }
}

// Función para obtener planos
async function apiRequestGet<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const token = localStorage.getItem(appConfig.auth.tokenKey)
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || errorData.detail || `Error ${response.status}`
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error de conexión')
  }
}

// Servicio de planos
export const planosService = {
  // Obtener plano de lotificación
  async getPlano(): Promise<PlanoResponse | null> {
    try {
      return await apiRequestGet<PlanoResponse>('/planos/')
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('No encontrado')) {
        return null
      }
      throw error
    }
  },

  // Subir plano de lotificación
  async subirPlano(file: File): Promise<PlanoResponse> {
    const formData = new FormData()
    formData.append('plano', file)
    formData.append('nombre', file.name)

    return apiRequestFormData<PlanoResponse>('/planos/subir/', formData)
  },

  // Actualizar plano existente
  async actualizarPlano(id: number, file: File): Promise<PlanoResponse> {
    const formData = new FormData()
    formData.append('plano', file)
    formData.append('nombre', file.name)

    return apiRequestFormData<PlanoResponse>(`/planos/${id}/actualizar/`, formData)
  },

  // Eliminar plano
  async eliminarPlano(id: number): Promise<void> {
    const url = `${API_BASE_URL}/planos/${id}/`
    const token = localStorage.getItem(appConfig.auth.tokenKey)
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || errorData.detail || `Error ${response.status}`
      )
    }
  },
}

