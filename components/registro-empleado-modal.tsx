"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, CheckCircle, XCircle } from "lucide-react"
import { useEffect } from "react"
import { RoleItem, rolesService } from "@/lib/roles-service"
import { empleadosService } from "@/lib/empleados-service"

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

interface RegistroEmpleadoModalProps {
  onCreated?: () => void
}

export function RegistroEmpleadoModal({ onCreated }: RegistroEmpleadoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // lista de roles para desplegar en el select
  const [roles, setRoles] = useState<RoleItem[]>([])

  useEffect(() => {
    if (isOpen) {
      rolesService.getRoles().then(setRoles).catch((e) => console.error('Error cargando roles', e))
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.nombre.trim() || !formData.fecha_contratacion.trim() || !formData.rol.trim()) {
      setError('Nombre, fecha de contratación y rol son obligatorios')
      return
    }

    if (formData.password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden')
      return
    }

    setIsSubmitting(true)
    try {
      await empleadosService.crearEmpleado(formData)
      setSuccess('Empleado registrado exitosamente')
      if (onCreated) onCreated()
      setTimeout(() => setIsOpen(false), 1500)
    } catch (err: any) {
      setError(err.message || 'Error al registrar el empleado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      nombre: '', apellido: '', telefono: '', correo: '', dpi: '',
      direccion: '', fecha_contratacion: '', rol: '', sueldo: '', porcentaje_comision: '',
      username: '', password: '', confirm_password: ''
    })
    setError(null)
    setSuccess(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Empleado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Empleado</DialogTitle>
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
              <Label htmlFor="username">Nombre de Usuario *</Label>
              <Input id="username" name="username" value={formData.username || ''} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input id="password" name="password" type="password" value={formData.password || ''} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar Contraseña *</Label>
              <Input id="confirm_password" name="confirm_password" type="password" value={formData.confirm_password || ''} onChange={handleChange} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleReset}>Limpiar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Crear'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}