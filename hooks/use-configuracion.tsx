"use client"

import React, { useState, useEffect, createContext, useContext } from 'react'
import { 
  configuracionGeneralService, 
  configuracionFinancieraService,
  type ConfiguracionGeneral,
  type ConfiguracionFinanciera,
  type ConfiguracionResumen
} from '@/lib/configuracion-service'
import { config as appConfig } from '@/lib/config'

interface ConfiguracionContextType {
  // Configuración general
  configuracionActiva: ConfiguracionGeneral | null
  configuracionResumen: ConfiguracionResumen | null
  
  // Configuración financiera
  configuracionFinanciera: ConfiguracionFinanciera | null
  
  // Estados
  isLoading: boolean
  error: string | null
  
  // Funciones
  refreshConfiguracion: () => Promise<void>
  refreshFinanciera: () => Promise<void>
}

const ConfiguracionContext = createContext<ConfiguracionContextType | undefined>(undefined)

export function ConfiguracionProvider({ children }: { children: React.ReactNode }) {
  const [configuracionActiva, setConfiguracionActiva] = useState<ConfiguracionGeneral | null>(null)
  const [configuracionResumen, setConfiguracionResumen] = useState<ConfiguracionResumen | null>(null)
  const [configuracionFinanciera, setConfiguracionFinanciera] = useState<ConfiguracionFinanciera | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarConfiguracion = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('[ConfiguracionProvider] Iniciando carga de configuración...')

      // Verificar si hay tokens disponibles antes de hacer las llamadas
      const token = localStorage.getItem(appConfig.auth.tokenKey)
      const refreshToken = localStorage.getItem(appConfig.auth.refreshTokenKey)
      
      if (!token || !refreshToken) {
        console.log('[ConfiguracionProvider] No hay tokens disponibles - omitiendo carga de configuración')
        setConfiguracionActiva(null)
        setConfiguracionResumen(null)
        setConfiguracionFinanciera(null)
        setIsLoading(false)
        return
      }

      console.log('[ConfiguracionProvider] Tokens disponibles, procediendo con carga de configuración...')

      // Cargar configuración activa
      try {
        const activa = await configuracionGeneralService.getConfiguracionActiva()
        console.log('[ConfiguracionProvider] Configuración activa cargada:', activa)
        console.log('[ConfiguracionProvider] Total de lotes en configuración:', activa.total_lotes)
        setConfiguracionActiva(activa)
      } catch (err: any) {
        console.error('[ConfiguracionProvider] Error cargando configuración activa:', err)
        if (err.status === 404) {
          console.log('[ConfiguracionProvider] No hay configuración activa')
          setConfiguracionActiva(null)
        } else if (err.status === 401) {
          console.log('[ConfiguracionProvider] Error de autenticación - omitiendo configuración')
          setConfiguracionActiva(null)
        } else {
          throw err
        }
      }

      // Cargar resumen
      try {
        const resumen = await configuracionGeneralService.getConfiguracionResumen()
        console.log('[ConfiguracionProvider] Resumen cargado:', resumen)
        console.log('[ConfiguracionProvider] Detalle de lotes en resumen:')
        console.log('  - Total de lotes:', resumen.total_lotes)
        console.log('  - Lotes disponibles:', resumen.lotes_disponibles)
        console.log('  - Lotes vendidos:', resumen.lotes_vendidos)
        console.log('  - Lotes reservados:', resumen.lotes_reservados || 0)
        console.log('  - Lotes financiados:', resumen.lotes_financiados || 0)
        console.log('  - Lotes en proceso:', resumen.lotes_en_proceso || 0)
        console.log('  - Lotes cancelados:', resumen.lotes_cancelados || 0)
        console.log('  - Suma total:', (resumen.lotes_disponibles + resumen.lotes_vendidos + (resumen.lotes_reservados || 0) + (resumen.lotes_financiados || 0) + (resumen.lotes_en_proceso || 0) + (resumen.lotes_cancelados || 0)))
        console.log('  - ¿Coincide con total?:', (resumen.lotes_disponibles + resumen.lotes_vendidos + (resumen.lotes_reservados || 0) + (resumen.lotes_financiados || 0) + (resumen.lotes_en_proceso || 0) + (resumen.lotes_cancelados || 0)) === resumen.total_lotes)
        setConfiguracionResumen(resumen)
      } catch (err: any) {
        console.error('[ConfiguracionProvider] Error cargando resumen:', err)
        if (err.status === 404) {
          console.log('[ConfiguracionProvider] No hay resumen disponible')
          setConfiguracionResumen(null)
        } else if (err.status === 401) {
          console.log('[ConfiguracionProvider] Error de autenticación - omitiendo resumen')
          setConfiguracionResumen(null)
        } else {
          throw err
        }
      }

      // Cargar configuración financiera activa
      try {
        const financiera = await configuracionFinancieraService.getConfiguracionActiva()
        console.log('[ConfiguracionProvider] Configuración financiera cargada:', financiera)
        setConfiguracionFinanciera(financiera)
      } catch (err: any) {
        console.log('[ConfiguracionProvider] No hay configuración financiera activa:', err.message)
        if (err.status === 401) {
          console.log('[ConfiguracionProvider] Error de autenticación - omitiendo configuración financiera')
        }
        setConfiguracionFinanciera(null)
      }

    } catch (err: any) {
      console.error('[ConfiguracionProvider] Error general cargando configuración:', err)
      
      // Solo mostrar errores si no son de autenticación
      if (err.status !== 401 && !err.message?.includes('No refresh token available')) {
        // Determinar el tipo de error
        let errorMessage = 'Error al cargar la configuración del sistema'
        
        if (err.message?.includes('fetch')) {
          errorMessage = 'No se puede conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000'
        } else if (err.status === 403) {
          errorMessage = 'No tienes permisos para acceder a la configuración.'
        } else if (err.status >= 500) {
          errorMessage = 'Error del servidor. Por favor, intenta más tarde.'
        } else if (err.message) {
          errorMessage = err.message
        }
        
        setError(errorMessage)
      } else {
        console.log('[ConfiguracionProvider] Error de autenticación - no mostrando error al usuario')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshConfiguracion = async () => {
    try {
      console.log('[ConfiguracionProvider] Refrescando configuración...')
      
      const activa = await configuracionGeneralService.getConfiguracionActiva()
      setConfiguracionActiva(activa)
      
      const resumen = await configuracionGeneralService.getConfiguracionResumen()
      setConfiguracionResumen(resumen)
      
      console.log('[ConfiguracionProvider] Configuración refrescada exitosamente')
    } catch (err: any) {
      console.error('[ConfiguracionProvider] Error refrescando configuración:', err)
      throw err
    }
  }

  const refreshFinanciera = async () => {
    try {
      console.log('[ConfiguracionProvider] Refrescando configuración financiera...')
      
      const financiera = await configuracionFinancieraService.getConfiguracionActiva()
      setConfiguracionFinanciera(financiera)
      
      console.log('[ConfiguracionProvider] Configuración financiera refrescada exitosamente')
    } catch (err: any) {
      console.error('[ConfiguracionProvider] Error refrescando configuración financiera:', err)
      setConfiguracionFinanciera(null)
      throw err
    }
  }

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const value: ConfiguracionContextType = {
    configuracionActiva,
    configuracionResumen,
    configuracionFinanciera,
    isLoading,
    error,
    refreshConfiguracion,
    refreshFinanciera
  }

  return (
    <ConfiguracionContext.Provider value={value}>
      {children}
    </ConfiguracionContext.Provider>
  )
}

export function useConfiguracion() {
  const context = useContext(ConfiguracionContext)
  if (context === undefined) {
    throw new Error('useConfiguracion debe ser usado dentro de un ConfiguracionProvider')
  }
  return context
}
