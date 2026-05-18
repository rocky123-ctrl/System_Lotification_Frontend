"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { XCircle, Loader2 } from "lucide-react"
import { actualizarCliente, Cliente } from "@/lib/clientes-service"
import { toast } from "sonner"

// Dependencias y Mocks borrados. Ahora usando datos reales.

interface FormData {
  nombres: string
  apellidos: string
  dpi: string
  nit: string
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
    dpi: '',
    nit: '',
    telefono: '',
    email: '',
    direccion: '',
    estado: 'activo'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [warningOpen, setWarningOpen] = useState(false)
  const [warningMsg, setWarningMsg] = useState('')



  useEffect(() => {
    if (cliente) {
      setFormData({
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        dpi: cliente.dpi || '',
        nit: cliente.nit || '',
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

    // Validaciones básicas
    if (!formData.nombres.trim() || !formData.apellidos.trim() || !formData.dpi.trim() || !formData.nit.trim() || !formData.direccion.trim()) {
      setWarningMsg('Los campos Nombres, Apellidos, DPI, NIT y Dirección son obligatorios')
      setWarningOpen(true)
      return
    }

    setIsSubmitting(true)
    try {
      await actualizarCliente(cliente.id, formData)
      toast.success('Cliente actualizado exitosamente')
      onClienteActualizado()
      onClose()
    } catch (err) {
      toast.error('Error al actualizar el cliente. Inténtalo de nuevo.')
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dpi">DPI *</Label>
              <Input
                id="dpi"
                name="dpi"
                type="text"
                value={formData.dpi}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nit">NIT *</Label>
              <Input
                id="nit"
                name="nit"
                type="text"
                value={formData.nit}
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

      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <XCircle className="h-5 w-5" />
              Campos Incompletos
            </DialogTitle>
            <DialogDescription>
              Faltan campos obligatorios para guardar el cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-slate-700">
            {warningMsg}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setWarningOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}