import { config as appConfig } from './config'
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = appConfig.api.baseUrl + '/api'

// Función para redirigir al login cuando el token expire o por inactividad
export function redirectToLogin(reason?: string) {
  if (typeof window !== 'undefined') {
    console.log('[API] Redirigiendo al login...')
    sessionStorage.removeItem(appConfig.auth.tokenKey)
    sessionStorage.removeItem(appConfig.auth.refreshTokenKey)
    sessionStorage.removeItem('lotificacion_user')
    sessionStorage.removeItem('last_interaction')
    const queryParams = reason ? `?reason=${reason}` : ''
    window.location.href = `/login${queryParams}`
  }
}

// Interfaces
interface LoginResponse {
  message: string
  user: any
  tokens: {
    refresh: string
    access: string
  }
}

interface RegisterResponse {
  user: any
  message: string
}

interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  profile: any
}

// Clase para errores
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

// Instancia de Axios
export const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Cola para peticiones fallidas mientras se renueva el token
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.map((callback) => callback(token))
  refreshSubscribers = []
}

// Interceptor de Petición
apiInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem(appConfig.auth.tokenKey)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Debug log to trace 401 errors
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - Auth: ${config.headers?.Authorization ? 'Yes' : 'No'}`)
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de Respuesta
apiInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { config, response } = error
    const originalRequest = config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (!response) {
      // Error de red/conexión
      throw new ApiError(
        `No se puede conectar al servidor. Verifica que el backend esté en ${appConfig.api.baseUrl}`,
        0,
        { originalError: error, type: 'CONNECTION_ERROR' }
      )
    }

    const errorData = response.data as any

    // 1. Manejo de Inactividad (Backend)
    if (response.status === 401 && errorData?.code === 'inactivity_timeout') {
      console.error('[API] Inactividad superada.')
      redirectToLogin('inactivity')
      return Promise.reject(new ApiError('Sesión expirada por inactividad', 401, errorData))
    }

    // 2. Manejo de Expiración de Token - Silent Refresh
    // Solo intentamos refresh si no es la propia ruta de login
    const isLoginRequest = config?.url?.includes('/auth/login/')
    
    if (response.status === 401 && !isLoginRequest) {
      if (!originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(apiInstance(originalRequest))
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          console.log('[API] Token expirado, intentando silent refresh...')
          const refreshToken = sessionStorage.getItem(appConfig.auth.refreshTokenKey)
          
          if (!refreshToken) throw new Error('No refresh token')

          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          })

          const newAccessToken = res.data.access
          if (res.data.refresh) {
            sessionStorage.setItem(appConfig.auth.refreshTokenKey, res.data.refresh)
          }
          sessionStorage.setItem(appConfig.auth.tokenKey, newAccessToken)

          onTokenRefreshed(newAccessToken)
          isRefreshing = false

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }
          return apiInstance(originalRequest)
        } catch (refreshError) {
          isRefreshing = false
          refreshSubscribers = []
          console.error('[API] Fallo el refresco de token:', refreshError)
          redirectToLogin('session_expired')
          return Promise.reject(new ApiError('Sesión expirada', 401, refreshError))
        }
      } else {
        // Si ya era un reintento y sigue dando 401, redirigimos
        console.error('[API] Error 401 persistente después de reintento.')
        redirectToLogin('session_expired')
      }
    }

    return Promise.reject(
      new ApiError(
        errorData?.message || errorData?.detail || `Error ${response.status}`,
        response.status,
        errorData
      )
    )
  }
)

/** Adaptador para mantener compatibilidad con las llamadas fetch previas */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const isPostOrPut = options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH'
    
    const axiosConfig: any = {
      url: endpoint,
      method: (options.method || 'GET').toLowerCase(),
      data: isPostOrPut && typeof options.body === 'string' ? JSON.parse(options.body) : options.body,
    }

    if (options.headers) {
      axiosConfig.headers = options.headers
    }

    const response = await apiInstance.request(axiosConfig)
    return response.data as T
  } catch (error) {
    throw error
  }
}

export async function apiRequestText(endpoint: string): Promise<string> {
  const response = await apiInstance.get(endpoint, { responseType: 'text' })
  return response.data
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await apiInstance.post('/auth/login/', { username, password })
    return res.data
  },

  async register(userData: any): Promise<RegisterResponse> {
    const res = await apiInstance.post('/auth/register/', userData)
    return res.data
  },

  async logout(): Promise<void> {
    const refreshToken = sessionStorage.getItem(appConfig.auth.refreshTokenKey)
    if (refreshToken) {
      try {
        await apiInstance.post('/auth/logout/', { refresh: refreshToken })
      } catch (e) {
        console.warn('Logout error', e)
      }
    }
    redirectToLogin()
  },

  async refreshToken(): Promise<{ access: string }> {
    const refreshToken = sessionStorage.getItem(appConfig.auth.refreshTokenKey)
    const res = await apiInstance.post('/auth/token/refresh/', { refresh: refreshToken })
    return res.data
  },

  async getProfile(): Promise<UserProfile> {
    const res = await apiInstance.get('/auth/me/')
    return res.data
  },
}

export async function refreshTokenIfNeeded(): Promise<string | null> {
  return sessionStorage.getItem(appConfig.auth.tokenKey)
}

export { ApiError }
