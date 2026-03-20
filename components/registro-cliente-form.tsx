"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Save,
  X,
} from "lucide-react"

interface FormData {
  // Información Personal
  nombre: string
  apellido: string
  numeroDocumento: string
  email: string
  telefono: string
  telefonoAdicional: string

  // Dirección
  ultimaLinea: string
  zona: string
  municipio: string
  departamento: string

  // Información Financiera
  ingresosmensuales: string
  ocupacion: string
  empleador: string

  // Información Conyugal
  estadoCivil: string
  nombreConyuge: string

  // Referencias
  referencia1Nombre: string
  referencia1Telefono: string
  referencia2Nombre: string
  referencia2Telefono: string

  // Términos
  aceptaTerminos: boolean
}

export function RegistroClienteForm() {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellido: "",
    numeroDocumento: "",
    email: "",
    telefono: "",
    telefonoAdicional: "",
    ultimaLinea: "",
    zona: "",
    municipio: "",
    departamento: "",
    ingresosmensuales: "",
    ocupacion: "",
    empleador: "",
    estadoCivil: "soltero",
    nombreConyuge: "",
    referencia1Nombre: "",
    referencia1Telefono: "",
    referencia2Nombre: "",
    referencia2Telefono: "",
    aceptaTerminos: false,
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    // Validaciones
    if (!formData.nombre || !formData.apellido || !formData.numeroDocumento) {
      setError("Por favor completa los campos obligatorios: Nombre, Apellido y Documento")
      setIsSubmitting(false)
      return
    }

    if (!formData.email || !formData.telefono) {
      setError("Por favor completa: Email y Teléfono")
      setIsSubmitting(false)
      return
    }

    if (!formData.aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones")
      setIsSubmitting(false)
      return
    }

    try {
      // TODO: Aquí irá la petición al backend para guardar el cliente
      console.log("Datos del cliente a registrar:", formData)

      // Simular envío al backend
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess("¡Cliente registrado exitosamente!")
      // Resetear formulario después de 2 segundos
      setTimeout(() => {
        setFormData({
          nombre: "",
          apellido: "",
          numeroDocumento: "",
          email: "",
          telefono: "",
          telefonoAdicional: "",
          ultimaLinea: "",
          zona: "",
          municipio: "",
          departamento: "",
          ingresosmensuales: "",
          ocupacion: "",
          empleador: "",
          estadoCivil: "soltero",
          nombreConyuge: "",
          referencia1Nombre: "",
          referencia1Telefono: "",
          referencia2Nombre: "",
          referencia2Telefono: "",
          aceptaTerminos: false,
        })
      }, 2000)
    } catch (err) {
      setError("Error al registrar el cliente. Por favor intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      nombre: "",
      apellido: "",
      numeroDocumento: "",
      email: "",
      telefono: "",
      telefonoAdicional: "",
      ultimaLinea: "",
      zona: "",
      municipio: "",
      departamento: "",
      ingresosmensuales: "",
      ocupacion: "",
      empleador: "",
      estadoCivil: "soltero",
      nombreConyuge: "",
      referencia1Nombre: "",
      referencia1Telefono: "",
      referencia2Nombre: "",
      referencia2Telefono: "",
      aceptaTerminos: false,
    })
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <User className="h-8 w-8" />
          Registrar Nuevo Cliente
        </h1>
        <p className="text-muted-foreground mt-2">Completa el formulario para registrar un nuevo cliente en el sistema</p>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ====== SECCIÓN 1: INFORMACIÓN PERSONAL ====== */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>Datos básicos del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="font-semibold">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Ej: Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido" className="font-semibold">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellido"
                  name="apellido"
                  type="text"
                  placeholder="Ej: Pérez García"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroDocumento" className="font-semibold">
                  Documento de Identidad (DPI/CUI) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numeroDocumento"
                  name="numeroDocumento"
                  type="text"
                  placeholder="Ej: 1234567890101"
                  value={formData.numeroDocumento}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoCivil" className="font-semibold">
                  Estado Civil
                </Label>
                <select
                  id="estadoCivil"
                  name="estadoCivil"
                  title="Selecciona tu estado civil"
                  value={formData.estadoCivil}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="soltero">Soltero/a</option>
                  <option value="casado">Casado/a</option>
                  <option value="viudo">Viudo/a</option>
                  <option value="divorciado">Divorciado/a</option>
                  <option value="unionLibre">Unión Libre</option>
                </select>
              </div>

              {formData.estadoCivil === "casado" && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nombreConyuge" className="font-semibold">
                    Nombre del Cónyuge
                  </Label>
                  <Input
                    id="nombreConyuge"
                    name="nombreConyuge"
                    type="text"
                    placeholder="Nombre del cónyuge"
                    value={formData.nombreConyuge}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ====== SECCIÓN 2: INFORMACIÓN DE CONTACTO ====== */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Información de Contacto
            </CardTitle>
            <CardDescription>Datos de comunicación del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="font-semibold">
                  Teléfono Principal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="7123456789"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="telefonoAdicional" className="font-semibold">
                  Teléfono Adicional
                </Label>
                <Input
                  id="telefonoAdicional"
                  name="telefonoAdicional"
                  type="tel"
                  placeholder="Teléfono opcional"
                  value={formData.telefonoAdicional}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ====== SECCIÓN 3: DIRECCIÓN ====== */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Dirección
            </CardTitle>
            <CardDescription>Ubicación del domicilio del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ultimaLinea" className="font-semibold">
                Última Línea / Calle Principal
              </Label>
              <Input
                id="ultimaLinea"
                name="ultimaLinea"
                type="text"
                placeholder="Ej: Calle Principal, Avenida Principal"
                value={formData.ultimaLinea}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="zona" className="font-semibold">
                  Zona
                </Label>
                <Input
                  id="zona"
                  name="zona"
                  type="text"
                  placeholder="Ej: Zona 15"
                  value={formData.zona}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipio" className="font-semibold">
                  Municipio
                </Label>
                <Input
                  id="municipio"
                  name="municipio"
                  type="text"
                  placeholder="Ej: Minerva"
                  value={formData.municipio}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departamento" className="font-semibold">
                  Departamento
                </Label>
                <select
                  id="departamento"
                  name="departamento"
                  title="Selecciona tu departamento"
                  value={formData.departamento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">Selecciona departamento</option>
                  <option value="peten">Petén</option>
                  <option value="guatemala">Guatemala</option>
                  <option value="huehuetenango">Huehuetenango</option>
                  <option value="altaverapaz">Alta Verapaz</option>
                  <option value="bajverapaz">Baja Verapaz</option>
                  <option value="quiche">Quiché</option>
                  <option value="chimaltenango">Chimaltenango</option>
                  <option value="sacatepequez">Sacatepéquez</option>
                  <option value="solola">Sololá</option>
                  <option value="totonicapan">Totonicapán</option>
                  <option value="quetzaltenango">Quetzaltenango</option>
                  <option value="suchitepequez">Suchitepéquez</option>
                  <option value="retalhuleu">Retalhuleu</option>
                  <option value="sandiego">San Marcos</option>
                  <option value="escuintla">Escuintla</option>
                  <option value="santa rosa">Santa Rosa</option>
                  <option value="jalapa">Jalapa</option>
                  <option value="jutiapa">Jutiapa</option>
                  <option value="el progreso">El Progreso</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ====== SECCIÓN 4: INFORMACIÓN FINANCIERA ====== */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información Financiera
            </CardTitle>
            <CardDescription>Datos de ingresos y ocupación del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ocupacion" className="font-semibold">
                  Ocupación
                </Label>
                <Input
                  id="ocupacion"
                  name="ocupacion"
                  type="text"
                  placeholder="Ej: Ingeniero, Comerciante, Empleado"
                  value={formData.ocupacion}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="empleador" className="font-semibold">
                  Empleador / Empresa
                </Label>
                <Input
                  id="empleador"
                  name="empleador"
                  type="text"
                  placeholder="Nombre de la empresa o negocio"
                  value={formData.empleador}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ingresosmensuales" className="font-semibold">
                  Ingresos Mensuales Aproximados (Q)
                </Label>
                <Input
                  id="ingresosmensuales"
                  name="ingresosmensuales"
                  type="number"
                  placeholder="Ej: 5000"
                  value={formData.ingresosmensuales}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ====== SECCIÓN 5: REFERENCIAS PERSONALES ====== */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referencias Personales
            </CardTitle>
            <CardDescription>Contactos de referencia del cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Referencia 1 */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-sm">Referencia 1</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="referencia1Nombre" className="font-semibold text-sm">
                    Nombre
                  </Label>
                  <Input
                    id="referencia1Nombre"
                    name="referencia1Nombre"
                    type="text"
                    placeholder="Nombre de la referencia"
                    value={formData.referencia1Nombre}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referencia1Telefono" className="font-semibold text-sm">
                    Teléfono
                  </Label>
                  <Input
                    id="referencia1Telefono"
                    name="referencia1Telefono"
                    type="tel"
                    placeholder="7123456789"
                    value={formData.referencia1Telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Referencia 2 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Referencia 2</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="referencia2Nombre" className="font-semibold text-sm">
                    Nombre
                  </Label>
                  <Input
                    id="referencia2Nombre"
                    name="referencia2Nombre"
                    type="text"
                    placeholder="Nombre de la referencia"
                    value={formData.referencia2Nombre}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referencia2Telefono" className="font-semibold text-sm">
                    Teléfono
                  </Label>
                  <Input
                    id="referencia2Telefono"
                    name="referencia2Telefono"
                    type="tel"
                    placeholder="7123456789"
                    value={formData.referencia2Telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ====== SECCIÓN 6: TÉRMINOS Y CONDICIONES ====== */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Términos y Condiciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
              <input
                type="checkbox"
                id="aceptaTerminos"
                name="aceptaTerminos"
                checked={formData.aceptaTerminos}
                onChange={handleChange}
                className="mt-1"
              />
              <label htmlFor="aceptaTerminos" className="text-sm text-blue-900 dark:text-blue-100">
                Confirmo que la información proporcionada es veraz y completa. Autorizo el procesamiento de mis datos
                personales de acuerdo con la política de privacidad de la empresa.
              </label>
            </div>
          </CardContent>
        </Card>

        {/* ====== BOTONES DE ACCIÓN ====== */}
        <div className="flex gap-4">
          <Button type="submit" className="flex-1" disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Registrando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Registrar Cliente
              </>
            )}
          </Button>

          <Button type="button" variant="outline" onClick={handleReset} size="lg">
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>

        {/* Nota sobre campos requeridos */}
        <p className="text-xs text-muted-foreground">
          <span className="text-red-500">*</span> Indica campos obligatorios
        </p>
      </form>
    </div>
  )
}
