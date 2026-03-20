"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle } from "lucide-react"
import { empleadosService, type Empleado } from "@/lib/empleados-service"
import { RoleItem, rolesService } from "@/lib/roles-service"

interface FormData {
  nombre: string
  apellido: string
  telefono: string
  correo: string
  dpi: string
  direccion: string
  fecha_contratacion: string
  rol: string
  sueldo: string
  porcentaje_comision: string
  username?: string
  password?: string
  confirm_password?: string
}

interface EditarEmpleadoModalProps {
  empleado: Empleado | null
  isOpen: boolean
  onClose: () => void
  onUpdated?: () => void
}

export function EditarEmpleadoModal({ empleado, isOpen, onClose, onUpdated }: EditarEmpleadoModalProps) {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    dpi: '',
    direccion: '',
    fecha_contratacion: '',
    rol: '',
    sueldo: '',
    porcentaje_comision: '',
    username: '',
    password: '',
    confirm_password: ''
  })
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [roles, setRoles] = useState<RoleItem[]>([])

  // cargar lista de roles
  useEffect(() => {
    rolesService.getRoles().then(setRoles).catch((e) => console.error('Error cargando roles', e))
  }, [])

  useEffect(() => {
    if (empleado) {
      setFormData({
        nombre: empleado.nombre || '',
        apellido: empleado.apellido || '',
        telefono: empleado.telefono || '',
        correo: empleado.correo || '',
        dpi: empleado.dpi || '',
        direccion: empleado.direccion || '',
        fecha_contratacion: empleado.fecha_contratacion || '',
        rol: empleado.rol || '',
        sueldo: empleado.sueldo || '',
        porcentaje_comision: empleado.porcentaje_comision || '',
        username: empleado.username || '',
        password: '',
        confirm_password: ''
      })
      setShowPasswordFields(false)
    }
  }, [empleado])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empleado) return
    setError(null)
    setSuccess(null)
    if (!formData.nombre.trim() || !formData.fecha_contratacion.trim() || !formData.rol.trim()) {
      setError('Nombre, fecha de contratación y rol son obligatorios')
      return
    }
    
    if (showPasswordFields) {
      if (!formData.password?.trim()) {
        setError('La contraseña no puede estar vacía si desea cambiarla')
        return
      }
      if (formData.password !== formData.confirm_password) {
        setError('Las contraseñas no coinciden')
        return
      }
    }
    
    setIsSubmitting(true)
    try {
      const dataToSend = { ...formData }
      if (!showPasswordFields) {
        delete dataToSend.password
        delete dataToSend.confirm_password
      } else {
        delete dataToSend.confirm_password
      }
      await empleadosService.actualizarEmpleado(empleado.id, dataToSend)
      setSuccess('Empleado actualizado exitosamente')
      if (onUpdated) onUpdated()
      setTimeout(() => onClose(), 1500)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el empleado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Empleado</DialogTitle>
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
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dpi">DPI</Label>
              <Input id="dpi" name="dpi" value={formData.dpi} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_contratacion">Fecha de Contratación *</Label>
              <Input id="fecha_contratacion" name="fecha_contratacion" type="date" value={formData.fecha_contratacion} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correo">Correo</Label>
              <Input id="correo" name="correo" type="email" value={formData.correo} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sueldo">Sueldo (Q)</Label>
              <Input id="sueldo" name="sueldo" type="number" step="0.01" value={formData.sueldo} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="porcentaje_comision">Comisión (%)</Label>
              <Input id="porcentaje_comision" name="porcentaje_comision" type="number" step="0.01" value={formData.porcentaje_comision} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              <Select
                value={formData.rol}
                onValueChange={(v) => setFormData((f) => ({ ...f, rol: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input id="username" name="username" value={formData.username || ''} onChange={handleChange} />
            </div>
            
            <div className="space-y-2 md:col-span-2 flex items-center justify-between mt-2">
              <Label>Credenciales de Acceso</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPasswordFields(!showPasswordFields)}>
                {showPasswordFields ? 'Cancelar Cambio' : 'Cambiar Contraseña'}
              </Button>
            </div>
            
            {showPasswordFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva Contraseña</Label>
                  <Input id="password" name="password" type="password" value={formData.password || ''} onChange={handleChange} required={showPasswordFields} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar Contraseña</Label>
                  <Input id="confirm_password" name="confirm_password" type="password" value={formData.confirm_password || ''} onChange={handleChange} required={showPasswordFields} />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}