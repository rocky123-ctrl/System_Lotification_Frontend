"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { actualizarCliente, Cliente } from "@/lib/clientes-service"

// Dependencias y Mocks borrados. Ahora usando datos reales.

interface FormData {
  nombres: string
  apellidos: string
  telefono: string
  email: string
  direccion: string
  estado: 'activo' | 'inactivo'
}

interface EditarClienteModalProps {
  cliente: Cliente | null
  isOpen: boolean
  onClose: () => void
  onClienteActualizado: () => void
}

export function EditarClienteModal({ cliente, isOpen, onClose, onClienteActualizado }: EditarClienteModalProps) {
  const [formData, setFormData] = useState<FormData>({
    nombres: '',
    apellidos: '',
    telefono: '',
    email: '',
    direccion: '',
    estado: 'activo'
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)



  useEffect(() => {
    if (cliente) {
      setFormData({
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion,
        estado: cliente.estado
      })
    }
  }, [cliente])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEstadoChange = (estado: 'activo' | 'inactivo') => {
    setFormData(prev => ({ ...prev, estado }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente) return

    setError(null)
    setSuccess(null)

    // Validaciones básicas
    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.direccion.trim()) {
      setError('Los campos Nombres, Apellidos y Dirección son obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      await actualizarCliente(cliente.id, formData)
      setSuccess('Cliente actualizado exitosamente')
      onClienteActualizado()
      setTimeout(() => {
        onClose()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError('Error al actualizar el cliente. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>Modifique los datos del cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input
                id="nombres"
                name="nombres"
                type="text"
                value={formData.nombres}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                name="apellidos"
                type="text"
                value={formData.apellidos}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Input
              id="direccion"
              name="direccion"
              type="text"
              value={formData.direccion}
              onChange={handleChange}
              required
            />
          </div>


          <div className="space-y-2 border-t pt-4">
            <Label>Estado</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="estado"
                  value="activo"
                  checked={formData.estado === 'activo'}
                  onChange={() => handleEstadoChange('activo')}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-green-700">Activo</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="estado"
                  value="inactivo"
                  checked={formData.estado === 'inactivo'}
                  onChange={() => handleEstadoChange('inactivo')}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-red-700">Inactivo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Actualizar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}