import { useEffect, useRef } from 'react'
import { refreshTokenIfNeeded } from '@/lib/api'

export function useTokenRefresh() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Verificar tokens cada 4 minutos (240 segundos)
    const checkTokens = async () => {
      try {
        await refreshTokenIfNeeded()
      } catch (error) {
        console.error('[TokenRefresh] Error checking tokens:', error)
      }
    }

    // Verificar inmediatamente al montar
    checkTokens()

    // Configurar intervalo para verificar cada 4 minutos
    intervalRef.current = setInterval(checkTokens, 4 * 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return null
}
