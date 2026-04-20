"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, AlertCircle, MousePointer2 } from 'lucide-react'

const INACTIVITY_TIMEOUT_SEC = 20 * 60 // 20 minutos

export function SessionStatus() {
  const { user, isAuthenticated } = useAuth()
  const [inactiveSeconds, setInactiveSeconds] = useState<number>(0)

  useEffect(() => {
    if (!isAuthenticated) return

    const calculateInactivity = () => {
      const lastInteractionRaw = sessionStorage.getItem('last_interaction')
      if (lastInteractionRaw) {
        const lastInteraction = parseInt(lastInteractionRaw, 10)
        const seconds = Math.floor((Date.now() - lastInteraction) / 1000)
        setInactiveSeconds(seconds)
      } else {
        setInactiveSeconds(0)
      }
    }

    calculateInactivity()
    const interval = setInterval(calculateInactivity, 1000) // Actualizar cada segundo

    return () => clearInterval(interval)
  }, [isAuthenticated])

  if (!isAuthenticated || !user) {
    return null
  }

  const secondsRemaining = Math.max(0, INACTIVITY_TIMEOUT_SEC - inactiveSeconds)

  const getStatusColor = () => {
    if (secondsRemaining === 0) return 'bg-red-500' // Expirado
    if (secondsRemaining < 60) return 'bg-red-500' // Menos de 1 minuto revoca atención
    if (secondsRemaining < 300) return 'bg-yellow-500' // Menos de 5 minutos
    return 'bg-green-500' // Todo bien
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="flex items-center gap-2 text-xs" title="Expiración por inactividad">
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        <MousePointer2 className="h-3 w-3 text-muted-foreground ml-1" />
        <span className="text-muted-foreground mr-1">Expiración en:</span>
        {secondsRemaining > 0 ? (
          <span className="font-medium font-mono w-14 text-right inline-block">
            {formatTime(secondsRemaining)}
          </span>
        ) : (
          <span className="text-red-500 font-medium">Expirada</span>
        )}
      </div>
    </div>
  )
}
