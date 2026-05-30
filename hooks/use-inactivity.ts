import { useEffect, useCallback } from 'react'
import { config as appConfig } from '@/lib/config'

const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutos en milisegundos

export function useInactivity() {
  const resetTimer = useCallback(() => {
    if (typeof window === 'undefined') return
    const lastInteraction = Date.now().toString()
    sessionStorage.setItem('last_interaction', lastInteraction)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const events = ['click', 'keydown', 'touchstart', 'mousedown']
    let timeout: NodeJS.Timeout | null = null

    const handleActivity = () => {
      if (timeout) return
      timeout = setTimeout(() => {
        resetTimer()
        timeout = null
      }, 500)
    }

    // Set initial interaction time if missing
    if (!sessionStorage.getItem('last_interaction')) {
        resetTimer()
    }

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    const intervalId = setInterval(() => {
      const tokenCurrent = sessionStorage.getItem(appConfig.auth.tokenKey)
      if (!tokenCurrent) return // Si no hay token, no checamos inactividad

      const lastInteraction = sessionStorage.getItem('last_interaction')
      const lastPing = sessionStorage.getItem('last_ping') || '0'

      if (lastInteraction) {
        const inactiveTime = Date.now() - parseInt(lastInteraction, 10)
        
        // Heartbeat: Si el usuario está activo localmente, hacer ping al backend cada 3 minutos
        if (inactiveTime < INACTIVITY_TIMEOUT) {
            const timeSinceLastPing = Date.now() - parseInt(lastPing, 10)
            if (timeSinceLastPing > 3 * 60 * 1000 && parseInt(lastInteraction, 10) > parseInt(lastPing, 10)) {
                sessionStorage.setItem('last_ping', Date.now().toString())
                fetch(`${appConfig.api.baseUrl}/api/auth/me/`, {
                    headers: { 'Authorization': `Bearer ${tokenCurrent}` }
                }).catch(() => {})
            }
        }

        if (inactiveTime >= INACTIVITY_TIMEOUT) {
          console.error('[InactivityHook] Usuario inactivo. Despachando evento modal...')
          window.dispatchEvent(new CustomEvent('inactivity-timeout'))
          // Reseteamos el last interaction en el futuro muy lejano para que no siga disparando repetidamente el evento mientras el modal esta abierto
          sessionStorage.setItem('last_interaction', (Date.now() + 86400000).toString()) 
        }
      }
    }, 1000)

    return () => {
      clearInterval(intervalId)
      if (timeout) clearTimeout(timeout)
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [resetTimer])

  return null
}
