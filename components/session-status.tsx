"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { refreshTokenIfNeeded } from '@/lib/api'

export function SessionStatus() {
  const { user, isAuthenticated } = useAuth()
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]))
          const currentTime = Date.now() / 1000
          const timeUntilExpiry = tokenData.exp - currentTime
          setTokenExpiry(timeUntilExpiry)
        } catch (error) {
          console.error('Error parsing token:', error)
          setTokenExpiry(null)
        }
      } else {
        setTokenExpiry(null)
      }
    }

    checkTokenExpiry()
    const interval = setInterval(checkTokenExpiry, 30000) // Verificar cada 30 segundos

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshTokenIfNeeded()
      console.log('Token renovado manualmente')
    } catch (error) {
      console.error('Error renovando token:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const getStatusColor = () => {
    if (!tokenExpiry) return 'bg-gray-500'
    if (tokenExpiry < 60) return 'bg-red-500' // Menos de 1 minuto
    if (tokenExpiry < 300) return 'bg-yellow-500' // Menos de 5 minutos
    return 'bg-green-500' // Más de 5 minutos
  }

  const getStatusIcon = () => {
    if (!tokenExpiry) return <AlertCircle className="h-3 w-3" />
    if (tokenExpiry < 60) return <AlertCircle className="h-3 w-3" />
    if (tokenExpiry < 300) return <Clock className="h-3 w-3" />
    return <CheckCircle className="h-3 w-3" />
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        <span className="text-muted-foreground">Sesión:</span>
        {tokenExpiry !== null ? (
          <span className="font-medium">
            {formatTime(tokenExpiry)}
          </span>
        ) : (
          <span className="text-red-500">Expirada</span>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        className="h-6 w-6 p-0"
        title="Renovar sesión"
      >
        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  )
}
