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
    // Desactivado: Ya no se usan las tablas de configuración y financiamiento
    // El apartado de Lotificaciones ahora usa directamente la tabla lotes_lotificacion
    try {
      setIsLoading(true)
      setError(null)

      // Inicializar valores como null ya que no se cargan datos
      setConfiguracionActiva(null)
      setConfiguracionResumen(null)
      setConfiguracionFinanciera(null)
      
    } catch (err: any) {
      console.error('[ConfiguracionProvider] Error:', err)
      setError(null) // No mostrar errores ya que no se cargan datos
    } finally {
      setIsLoading(false)
    }
  }

  const refreshConfiguracion = async () => {
    // Desactivado: Ya no se usan las tablas de configuración
    // Esta función se mantiene para compatibilidad con componentes que aún la usan
    setConfiguracionActiva(null)
    setConfiguracionResumen(null)
  }

  const refreshFinanciera = async () => {
    // Desactivado: Ya no se usan las tablas de financiamiento
    // Esta función se mantiene para compatibilidad con componentes que aún la usan
    setConfiguracionFinanciera(null)
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
