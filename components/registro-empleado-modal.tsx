"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, User, UserCircle, Mail, Phone, Shield, Calendar, DollarSign, Percent, MapPin, Eye, EyeOff, Lock, Hash, UserPlus } from "lucide-react"
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
  porcentaje_comision: string
  username?: string
  password?: string
  confirm_password?: string
  estado?: boolean
}

interface RegistroEmpleadoModalProps {
  onCreated?: () => void
}

export function RegistroEmpleadoModal({ onCreated }: RegistroEmpleadoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    dpi: '',
    direccion: '',
    fecha_contratacion: '',
    rol: '',
    porcentaje_comision: '',
    username: '',
    password: '',
    confirm_password: '',
    estado: true
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

    // Validaciones de obligatorios
    if (!formData.username?.trim() || !formData.nombre.trim() || !formData.apellido.trim() || 
        !formData.dpi.trim() || !formData.fecha_contratacion.trim() || !formData.rol.trim() || 
        !formData.direccion.trim() || !formData.password?.trim()) {
      setError('Todos los campos marcados con * son obligatorios')
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
      setIsOpen(false) // Cerrar inmediatamente para evitar parpadeo
      if (onCreated) onCreated()
      setTimeout(() => {
        handleReset()
      }, 500)
    } catch (err: any) {
      setError(err.message || 'Error al registrar el empleado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      nombre: '', apellido: '', telefono: '', correo: '', dpi: '',
      direccion: '', fecha_contratacion: '', rol: '', porcentaje_comision: '',
      username: '', password: '', confirm_password: '', estado: true
    })
    setError(null)
    setSuccess(null)
    setShowPassword(false)
  }

  const inputClasses = "border-slate-300 dark:border-slate-700 focus:border-primary transition-all duration-200"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4 shadow-sm hover:translate-y-[-1px] transition-transform">
          <UserPlus className="mr-2 h-4 w-4" />
          Registrar Empleado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserCircle className="h-6 w-6 text-primary" />
            Registrar Nuevo Empleado
          </DialogTitle>
          <DialogDescription>
            Ingrese los datos personales y credenciales para crear una nueva ficha de empleado en el sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 text-green-700 border-green-200 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Username - FIRST as requested */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="h-4 w-4 text-slate-500" />
                Nombre de Usuario *
              </Label>
              <Input 
                id="username" 
                name="username" 
                value={formData.username || ''} 
                onChange={handleChange} 
                className={inputClasses}
                placeholder="Ej: jgalindo"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-slate-500" />
                Nombre *
              </Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} className={inputClasses} placeholder="Nombre real" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido" className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-slate-500" />
                Apellido *
              </Label>
              <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} className={inputClasses} placeholder="Apellidos" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dpi" className="flex items-center gap-2 text-sm font-semibold">
                <Hash className="h-4 w-4 text-slate-500" />
                DPI *
              </Label>
              <Input id="dpi" name="dpi" value={formData.dpi} onChange={handleChange} className={inputClasses} placeholder="Número de documento" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_contratacion" className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-slate-500" />
                Fecha de Contratación *
              </Label>
              <Input id="fecha_contratacion" name="fecha_contratacion" type="date" value={formData.fecha_contratacion} onChange={handleChange} className={inputClasses} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="correo" className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4 text-slate-500" />
                Correo
              </Label>
              <Input id="correo" name="correo" type="email" value={formData.correo} onChange={handleChange} className={inputClasses} placeholder="ejemplo@correo.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono" className="flex items-center gap-2 text-sm font-semibold">
                <Phone className="h-4 w-4 text-slate-500" />
                Teléfono
              </Label>
              <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className={inputClasses} placeholder="5555-5555" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rol" className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="h-4 w-4 text-slate-500" />
                Rol *
              </Label>
              <Select
                value={formData.rol}
                onValueChange={(v) => setFormData((f) => ({ ...f, rol: v }))}
              >
                <SelectTrigger className={inputClasses}>
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

            <div className="space-y-1.5">
              <Label htmlFor="estado" className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle className="h-4 w-4 text-slate-500" />
                Estado *
              </Label>
              <Select
                value={formData.estado !== undefined ? String(formData.estado) : "true"}
                onValueChange={(v) => setFormData((f) => ({ ...f, estado: v === "true" }))}
              >
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>


            {formData.rol === 'Vendedor' && (
              <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                <Label htmlFor="porcentaje_comision" className="flex items-center gap-2 text-sm font-semibold">
                  <Percent className="h-4 w-4 text-slate-500" />
                  Comisión (%)
                </Label>
                <Input id="porcentaje_comision" name="porcentaje_comision" type="number" step="0.01" value={formData.porcentaje_comision} onChange={handleChange} className={inputClasses} placeholder="0%" />
              </div>
            )}

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="direccion" className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-slate-500" />
                Dirección *
              </Label>
              <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} className={inputClasses} placeholder="Dirección residencial completa" required />
            </div>
            
            <div className="space-y-2 md:col-span-2 flex items-center gap-2 border-t pt-4 mt-2">
              <Lock className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Credenciales de Seguridad</span>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password || ''} 
                  onChange={handleChange} 
                  className={`${inputClasses} pr-10`}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirmar Contraseña *</Label>
              <Input 
                id="confirm_password" 
                name="confirm_password" 
                type={showPassword ? "text" : "password"} 
                value={formData.confirm_password || ''} 
                onChange={handleChange} 
                className={inputClasses}
                required 
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t pt-6 bg-slate-50/50 -mx-6 px-6 -mb-6 pb-6 rounded-b-lg">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
              Limpiar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px] shadow-sm">
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Registrando...
                </>
              ) : 'Crear Empleado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

  )
}