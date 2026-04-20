"use client"

import { useEffect, useState } from "react"
import { redirectToLogin } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function InactivityModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleTimeout = () => {
      setIsOpen(true)
    }

    window.addEventListener("inactivity-timeout", handleTimeout)
    return () => window.removeEventListener("inactivity-timeout", handleTimeout)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Sesión Expirada</h2>
        <p className="text-slate-600 mb-6">
          Su sesión ha finalizado por seguridad tras un largo periodo de inactividad.
        </p>
        <Button 
          onClick={() => redirectToLogin('inactivity')}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          Volver al Login
        </Button>
      </div>
    </div>
  )
}
