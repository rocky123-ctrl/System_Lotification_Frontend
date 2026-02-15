"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react'
import { API_CONFIG } from '@/lib/config'

export function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [details, setDetails] = useState<string>('')
  const [isChecking, setIsChecking] = useState(false)

  const checkBackendStatus = async () => {
    setIsChecking(true)
    setStatus('checking')
    
    try {
      console.log('[BackendStatus] Verificando conexión a:', API_CONFIG.BASE_URL)
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/me/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        setStatus('online')
        setDetails('Backend conectado correctamente')
        console.log('[BackendStatus] Backend online')
      } else {
        setStatus('offline')
        setDetails(`Backend respondió con status: ${response.status}`)
        console.log('[BackendStatus] Backend offline - status:', response.status)
      }
    } catch (error: any) {
      setStatus('offline')
      setDetails(`Error de conexión: ${error.message}`)
      console.error('[BackendStatus] Error conectando al backend:', error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkBackendStatus()
  }, [])

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'bg-yellow-100 text-yellow-800'
      case 'online':
        return 'bg-green-100 text-green-800'
      case 'offline':
        return 'bg-red-100 text-red-800'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Verificando...'
      case 'online':
        return 'Conectado'
      case 'offline':
        return 'Desconectado'
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Estado del Backend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Conexión:</span>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <div><strong>URL:</strong> {API_CONFIG.BASE_URL}</div>
          <div><strong>Detalles:</strong> {details}</div>
        </div>
        
        <Button 
          onClick={checkBackendStatus} 
          disabled={isChecking}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              Verificar Conexión
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
