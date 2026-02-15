import { config as appConfig } from './config'

const API_BASE_URL = appConfig.api.baseUrl + '/api'

// Interfaces para las respuestas de la API
interface LoginResponse {
  message: string
  user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    profile: {
      phone: string | null
      address: string | null
      is_active: boolean
      created_at: string
      updated_at: string
    }
  }
  tokens: {
    refresh: string
    access: string
  }
}

interface RegisterResponse {
  user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  message: string
}

interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  profile: {
    phone: string | null
    address: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
}

interface ApiError {
  message: string
  detail?: string
  errors?: Record<string, string[]>
}

// Clase para manejar errores de la API
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Función para hacer peticiones HTTP con renovación automática de tokens
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Verificar y renovar token si es necesario
  const token = await refreshTokenIfNeeded()
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    }
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      // Si es error 401 y no hemos intentado renovar el token, intentar renovar y reintentar
      if (response.status === 401 && retryCount === 0) {
        console.log('[API] Token expirado, intentando renovar...')
        try {
          const newToken = await authService.refreshToken()
          localStorage.setItem(appConfig.auth.tokenKey, newToken.access)
          
          // Reintentar la petición con el nuevo token
          return apiRequest<T>(endpoint, options, retryCount + 1)
        } catch (refreshError) {
          console.error('[API] Error renovando token:', refreshError)
          // Si no se puede renovar, limpiar tokens y lanzar error
          localStorage.removeItem(appConfig.auth.tokenKey)
          localStorage.removeItem(appConfig.auth.refreshTokenKey)
          localStorage.removeItem('lotificacion_user')
          throw new ApiError('Sesión expirada', 401, { originalError: refreshError })
        }
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.message || errorData.detail || `Error ${response.status}`,
        response.status,
        errorData
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      'Error de conexión',
      0,
      { originalError: error }
    )
  }
}

// Servicios de autenticación
export const authService = {
  // Login
  async login(username: string, password: string): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  // Registro
  async register(userData: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
  }): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  // Logout
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(appConfig.auth.refreshTokenKey)
    if (refreshToken) {
      try {
        await apiRequest('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh: refreshToken }),
        })
      } catch (error) {
        console.warn('Error during logout:', error)
      }
    }
  },

  // Renovar token
  async refreshToken(): Promise<{ access: string }> {
    const refreshToken = localStorage.getItem(appConfig.auth.refreshTokenKey)
    if (!refreshToken) {
      throw new ApiError('No refresh token available', 401)
    }

    const response = await apiRequest<{ access: string }>('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    })
    
    return response
  },

  // Obtener perfil del usuario
  async getProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/auth/me/')
  },
}

// Función para manejar la renovación automática de tokens
export async function refreshTokenIfNeeded(): Promise<string | null> {
  const token = localStorage.getItem(appConfig.auth.tokenKey)
  const refreshToken = localStorage.getItem(appConfig.auth.refreshTokenKey)
  
  if (!token || !refreshToken) {
    console.log('[API] No hay tokens disponibles - usuario no autenticado')
    return null
  }

  try {
    // Verificar si el token actual está expirado
    const tokenData = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    const timeUntilExpiry = tokenData.exp - currentTime
    
    console.log(`[API] Token expira en ${Math.round(timeUntilExpiry)} segundos`)
    
    // Renovar si expira en menos de 5 minutos o ya expiró
    if (timeUntilExpiry < 300) {
      console.log('[API] Token próximo a expirar, renovando...')
      try {
        const response = await authService.refreshToken()
        localStorage.setItem(appConfig.auth.tokenKey, response.access)
        console.log('[API] Token renovado exitosamente')
        return response.access
      } catch (refreshError) {
        console.error('[API] Error renovando token:', refreshError)
        // Limpiar tokens inválidos
        localStorage.removeItem(appConfig.auth.tokenKey)
        localStorage.removeItem(appConfig.auth.refreshTokenKey)
        localStorage.removeItem('lotificacion_user')
        return null
      }
    }
    
    return token
  } catch (error) {
    console.error('[API] Error verificando token:', error)
    // Limpiar tokens inválidos
    localStorage.removeItem(appConfig.auth.tokenKey)
    localStorage.removeItem(appConfig.auth.refreshTokenKey)
    localStorage.removeItem('lotificacion_user')
    return null
  }
}

export { ApiError }
