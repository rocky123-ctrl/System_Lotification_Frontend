import { config as appConfig } from './config'

const API_BASE_URL = appConfig.api.baseUrl + '/api'

// Función para redirigir al login cuando el token expire
export function redirectToLogin() {
  // Solo redirigir si estamos en el cliente (navegador)
  if (typeof window !== 'undefined') {
    console.log('[API] Redirigiendo al login debido a token expirado')
    // Limpiar todos los datos de autenticación antes de redirigir
    localStorage.removeItem(appConfig.auth.tokenKey)
    localStorage.removeItem(appConfig.auth.refreshTokenKey)
    localStorage.removeItem('lotificacion_user')
    // Redirigir al login
    window.location.href = '/login'
  }
}

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
          // Si no se puede renovar, redirigir al login
          redirectToLogin()
          throw new ApiError('Sesión expirada', 401, { originalError: refreshError })
        }
      }
      
      // Si es error 401 y ya intentamos renovar (retryCount > 0), redirigir al login
      if (response.status === 401 && retryCount > 0) {
        console.error('[API] Token sigue inválido después de intentar renovar')
        redirectToLogin()
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.message || errorData.detail || `Error ${response.status}`,
        response.status,
        errorData
      )
    }

    // Manejar respuestas vacías (DELETE, 204 No Content, etc.)
    // Para DELETE y 204 No Content, no hay body
    if (response.status === 204 || options.method === 'DELETE') {
      return undefined as T
    }

    // Intentar parsear JSON, pero manejar respuestas vacías
    try {
      const text = await response.text()
      
      // Si no hay texto, retornar undefined
      if (!text || text.trim() === '') {
        return undefined as T
      }
      
      // Intentar parsear JSON
      return JSON.parse(text)
    } catch (parseError) {
      // Si falla el parseo pero la respuesta fue exitosa (200-299), 
      // probablemente es una respuesta vacía válida
      if (response.status >= 200 && response.status < 300) {
        return undefined as T
      }
      // Si es un error de parseo en una respuesta exitosa, lanzar el error
      throw parseError
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Detectar errores de conexión específicos
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('ERR_CONNECTION_REFUSED') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('fetch failed')) {
      throw new ApiError(
        'No se puede conectar al servidor. Por favor, verifica que el servidor Django esté corriendo en http://localhost:8000',
        0,
        { originalError: error, type: 'CONNECTION_ERROR' }
      )
    }
    
    throw new ApiError(
      'Error de conexión',
      0,
      { originalError: error }
    )
  }
}

/** Petición que devuelve el cuerpo como texto (p. ej. SVG). Usa el mismo token JWT que apiRequest. */
export async function apiRequestText(endpoint: string): Promise<string> {
  const token = await refreshTokenIfNeeded()
  const url = `${API_BASE_URL}${endpoint}`
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch(url, { headers })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      (errorData as any)?.error || (errorData as any)?.detail || `Error ${response.status}`,
      response.status,
      errorData
    )
  }
  return response.text()
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
        // Si no se puede renovar, redirigir al login
        redirectToLogin()
        return null
      }
    }
    
    return token
  } catch (error) {
    console.error('[API] Error verificando token:', error)
    // Si hay un error al verificar el token, redirigir al login
    redirectToLogin()
    return null
  }
}

export { ApiError }
