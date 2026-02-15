"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { authService, refreshTokenIfNeeded, ApiError } from "@/lib/api"
import { config as appConfig } from "@/lib/config"
import { useTokenRefresh } from "@/hooks/use-token-refresh"

interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  isStaff: boolean
  isSuperuser: boolean
  role: "admin" | "user"
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (userData: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Hook para renovación automática de tokens
  useTokenRefresh()

  // Función para mapear el usuario del backend al formato local
  const mapUserFromApi = (apiUser: any): User => ({
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    firstName: apiUser.first_name || "",
    lastName: apiUser.last_name || "",
    isStaff: false, // Por defecto, ya que el backend no devuelve is_staff
    isSuperuser: false, // Por defecto, ya que el backend no devuelve is_superuser
    role: "admin", // Por defecto como admin para el usuario actual
  })

  // Función para verificar y renovar tokens automáticamente
  const checkAuthStatus = async () => {
    try {
      console.log('[AuthContext] Verificando estado de autenticación...')
      const token = await refreshTokenIfNeeded()
      if (token) {
        // Token válido, obtener perfil del usuario
        console.log('[AuthContext] Token válido, obteniendo perfil...')
        const profile = await authService.getProfile()
        const userData = mapUserFromApi(profile)
        setUser(userData)
        localStorage.setItem('lotificacion_user', JSON.stringify(userData))
        console.log('[AuthContext] Usuario autenticado:', userData)
      } else {
        // No hay token válido, limpiar estado
        console.log('[AuthContext] No hay token válido, limpiando estado')
        setUser(null)
        localStorage.removeItem('lotificacion_user')
      }
    } catch (error) {
      console.error('[AuthContext] Error checking auth status:', error)
      setUser(null)
      localStorage.removeItem('lotificacion_user')
      localStorage.removeItem(appConfig.auth.tokenKey)
      localStorage.removeItem(appConfig.auth.refreshTokenKey)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      console.log("[API] Attempting login with:", { username })

      const response = await authService.login(username, password)
      
      // Guardar tokens
      localStorage.setItem(appConfig.auth.tokenKey, response.tokens.access)
      localStorage.setItem(appConfig.auth.refreshTokenKey, response.tokens.refresh)
      
      // Mapear y guardar usuario
      const userData = mapUserFromApi(response.user)
      setUser(userData)
      localStorage.setItem('lotificacion_user', JSON.stringify(userData))
      
      console.log("[API] Login successful:", userData)
      console.log("[API] User state updated, isAuthenticated should be true")
      return { success: true }
    } catch (error) {
      console.error("[API] Login failed:", error)
      
      let errorMessage = "Error de conexión"
      if (error instanceof ApiError) {
        if (error.status === 401) {
          errorMessage = "Credenciales incorrectas"
        } else if (error.status === 400) {
          errorMessage = error.data?.detail || "Datos de entrada inválidos"
        } else {
          errorMessage = error.message || "Error del servidor"
        }
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      console.log("[API] Attempting registration with:", { username: userData.username })

      const response = await authService.register({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
      })
      
      console.log("[API] Registration successful:", response)
      return { success: true }
    } catch (error) {
      console.error("[API] Registration failed:", error)
      
      let errorMessage = "Error de conexión"
      if (error instanceof ApiError) {
                 if (error.status === 400) {
           // Manejar errores de validación
           if (error.data?.errors) {
             const fieldErrors = Object.entries(error.data.errors)
               .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
               .join('; ')
             errorMessage = fieldErrors
           } else {
             errorMessage = error.data?.detail || "Datos de entrada inválidos"
           }
         } else if (error.status === 409) {
          errorMessage = "El usuario ya existe"
        } else {
          errorMessage = error.message || "Error del servidor"
        }
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log("[API] Logging out user")
      
      // Llamar al endpoint de logout del backend
      await authService.logout()
    } catch (error) {
      console.warn("[API] Error during logout:", error)
    } finally {
      // Limpiar estado local independientemente del resultado del backend
      setUser(null)
      localStorage.removeItem('lotificacion_user')
      localStorage.removeItem(appConfig.auth.tokenKey)
      localStorage.removeItem(appConfig.auth.refreshTokenKey)
    }
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    isLoading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
