import { useEffect, useCallback } from 'react'
import { config as appConfig } from '@/lib/config'

const INACTIVITY_TIMEOUT = 20 * 60 * 1000 // 20 minutos en milisegundos

export function useInactivity() {
  const resetTimer = useCallback((e?: Event) => {
    if (typeof window === 'undefined') return

    // Prevenir reinicios fantasmas si el mouse se movió menos de 10 píxeles
    if (e && e.type === 'mousemove') {
      const mouseEvent = e as MouseEvent
      const lastX = Number(sessionStorage.getItem('mouse_x') || 0)
      const lastY = Number(sessionStorage.getItem('mouse_y') || 0)
      
      const dx = Math.abs(mouseEvent.clientX - lastX)
      const dy = Math.abs(mouseEvent.clientY - lastY)
      
      if (dx < 10 && dy < 10) return // El ratón casi no se movió, ignorar
      
      sessionStorage.setItem('mouse_x', mouseEvent.clientX.toString())
      sessionStorage.setItem('mouse_y', mouseEvent.clientY.toString())
    }

    const lastInteraction = Date.now().toString()
    sessionStorage.setItem('last_interaction', lastInteraction)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Verificar si está logueado
    const token = sessionStorage.getItem(appConfig.auth.tokenKey)
    if (!token) return

    const events = ['mousemove', 'keydown', 'wheel', 'mousedown', 'touchstart']
    let timeout: NodeJS.Timeout | null = null

    const handleActivity = (e: Event) => {
      if (timeout) return
      timeout = setTimeout(() => {
        resetTimer(e)
        timeout = null
      }, 500)
    }

    resetTimer()

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    const intervalId = setInterval(() => {
      const tokenCurrent = sessionStorage.getItem(appConfig.auth.tokenKey)
      if (!tokenCurrent) return

      const lastInteraction = sessionStorage.getItem('last_interaction')
      if (lastInteraction) {
        const inactiveTime = Date.now() - parseInt(lastInteraction, 10)
        if (inactiveTime >= INACTIVITY_TIMEOUT) {
          clearInterval(intervalId)
          events.forEach(event => {
            window.removeEventListener(event, handleActivity)
          })
          
          console.error('[InactivityHook] Usuario inactivo. Despachando evento modal...')
          window.dispatchEvent(new CustomEvent('inactivity-timeout'))
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
