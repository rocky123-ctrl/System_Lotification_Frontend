"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Building2, 
  Edit, 
  Save, 
  Plus,
  Loader2,
  AlertCircle,
  MapPin,
  Trash2,
  CheckCircle2,
  Search,
  Filter
} from "lucide-react"
import { 
  lotificacionService,
  type Lotificacion,
  type LotificacionCreate,
  type LotificacionUpdate
} from "@/lib/lotificacion-service"
import { config as appConfig } from "@/lib/config"
import { SVGUploader } from "@/components/svg-uploader"

export function Lotificaciones() {
  const [lotificaciones, setLotificaciones] = useState<Lotificacion[]>([])
  const [lotificacionActiva, setLotificacionActiva] = useState<Lotificacion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [lotificacionToDelete, setLotificacionToDelete] = useState<Lotificacion | null>(null)
  const [editingLotificacion, setEditingLotificacion] = useState<Lotificacion | null>(null)
  const [currentLotificacionData, setCurrentLotificacionData] = useState<Lotificacion | null>(null)

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"todas" | "activa" | "inactiva">("todas")
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [pendingSvgFile, setPendingSvgFile] = useState<File | null>(null)

  // Formulario
  const [formData, setFormData] = useState<LotificacionCreate>({
    nombre: "",
    descripcion: "",
    ubicacion: "",
    activo: true,
    total_manzanas: 0,
    total_lotes: 0,
    area_total_m2: 0
  })

  // Filas de manzanas (solo cuando total_manzanas > 0): nombre (máx 10 caracteres) y activo
  type ManzanaRow = { id?: number; nombre: string; activo: boolean }
  const [manzanas, setManzanas] = useState<ManzanaRow[]>([])
  const [manzanasPage, setManzanasPage] = useState(1)
  const MANZANAS_PER_PAGE = 8

  // Cargar lotificaciones desde el backend
  const cargarLotificaciones = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('[Lotificaciones] Cargando lotificaciones desde el backend...')
      
      // Obtener todas las lotificaciones y la activa en paralelo
      const [todas, activa] = await Promise.all([
        lotificacionService.getLotificaciones(),
        lotificacionService.getLotificacionActiva()
      ])

      console.log('[Lotificaciones] Datos cargados:', {
        total: todas.length,
        activa: activa ? activa.nombre : 'ninguna'
      })

      // Actualizar estado con datos reales del backend
      setLotificaciones(todas)
      setLotificacionActiva(activa)
      
      console.log('[Lotificaciones] Estado actualizado correctamente')
    } catch (err: any) {
      console.error('[Lotificaciones] Error cargando lotificaciones:', err)
      let errorMessage = 'Error al cargar las lotificaciones'
      
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        errorMessage = `No se puede conectar con el servidor. Verifica que el backend esté ejecutándose en ${appConfig.api.baseUrl}`
      } else if (err.status === 403) {
        errorMessage = 'No tienes permisos para acceder a las lotificaciones.'
      } else if (err.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
      } else if (err.status >= 500) {
        errorMessage = 'Error del servidor. Por favor, intenta más tarde.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarLotificaciones()
  }, [])

  // Sincronizar el campo del formulario con el recuento real de manzanas
  useEffect(() => {
    setFormData((prev) => ({ ...prev, total_manzanas: manzanas.length }))
  }, [manzanas.length])

  // Al abrir para editar, cargar manzanas existentes desde el backend
  useEffect(() => {
    if (!editingLotificacion?.id) return
    lotificacionService
      .getManzanas(editingLotificacion.id, true)
      .then((list) => {
        setManzanas(list)
      })
      .catch(() => {})
  }, [editingLotificacion?.id])

  // Manejar eliminación de manzana individual
  const handleDeleteManzana = async (index: number, row: ManzanaRow) => {
    if (row.id) {
      try {
        setIsSubmitting(true)
        await lotificacionService.deleteManzana(row.id)
        setManzanas((prev) => prev.filter((_, i) => i !== index))
      } catch (err: any) {
        console.error('[Lotificaciones] Error eliminando manzana:', err)
        let errorMessage = 'Error al eliminar la manzana'
        
        if (err.status === 500 || err.message?.includes('500')) {
          errorMessage = 'No se puede eliminar la manzana porque tiene lotes asociados. Elimina o desvincula los lotes primero.'
        } else if (err.data) {
          if (typeof err.data === 'string' && err.data.trim().startsWith('<')) {
            errorMessage = 'Ocurrió un error en el servidor. Es muy probable que la manzana tenga lotes asociados.'
          } else {
            errorMessage = err.data.detail || err.data.message || err.data
          }
        }
        
        if (typeof errorMessage === 'string' && (errorMessage.includes('relacion') || errorMessage.includes('foreign key') || errorMessage.includes('constraint') || errorMessage.includes('ProtectedError'))) {
          errorMessage = 'No se puede eliminar la manzana porque tiene lotes asociados en el sistema.'
        }
        
        setWarningMessage(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setManzanas((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // Manejar envío de formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      let saved: Lotificacion
      if (editingLotificacion) {
        const updated = await lotificacionService.updateLotificacion(
          editingLotificacion.id, 
          formData as LotificacionUpdate
        )
        if (lotificacionActiva?.id === updated.id) setLotificacionActiva(updated)
        saved = updated
      } else {
        const nueva = await lotificacionService.createLotificacion(formData)
        if (nueva.activo || lotificaciones.length === 0) setLotificacionActiva(nueva)
        saved = nueva
      }

      // Sincronizar manzanas con el backend (crear o actualizar cada fila)
      if (manzanas.length > 0 && saved.id) {
        await Promise.all(
          manzanas.map((row) =>
            row.id
              ? lotificacionService.updateManzana(row.id, { nombre: row.nombre.slice(0, 10), activo: row.activo })
              : lotificacionService.createManzana(saved.id!, { nombre: row.nombre.slice(0, 10), activo: row.activo })
          )
        )
      }

      // Subir archivo SVG si se seleccionó uno durante la creación
      if (pendingSvgFile && saved.id) {
        try {
          await lotificacionService.subirPlanoSvg(saved.id, pendingSvgFile)
        } catch (svgErr) {
          console.error('[Lotificaciones] Error subiendo el SVG durante la creación:', svgErr)
          // No detenemos el flujo, ya que la lotificación se creó correctamente
        }
      }

      await cargarLotificaciones()
      const updatedLotificacion = await lotificacionService.getLotificacion(saved.id)
      setCurrentLotificacionData(updatedLotificacion)
      setEditingLotificacion(updatedLotificacion)
      setIsDialogOpen(false)
      setEditingLotificacion(null)
      setCurrentLotificacionData(null)
      
      console.log('[Lotificaciones] Operación completada exitosamente')
    } catch (err: any) {
      console.error('[Lotificaciones] Error guardando lotificación:', err)
      
      // Extraer mensaje de error más detallado
      let errorMessage = 'Error al guardar la lotificación'
      
      if (err.data) {
        // Si hay errores de validación del backend
        if (err.data.nombre) {
          errorMessage = `Error en el nombre: ${Array.isArray(err.data.nombre) ? err.data.nombre[0] : err.data.nombre}`
        } else if (err.data.detail) {
          errorMessage = err.data.detail
        } else if (err.data.message) {
          errorMessage = err.data.message
        } else if (typeof err.data === 'string') {
          errorMessage = err.data
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      alert(`Error: ${errorMessage}. Por favor, verifica los datos e intenta de nuevo.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar eliminación
  const handleDelete = async () => {
    if (!lotificacionToDelete) return

    try {
      setIsSubmitting(true)

      console.log('[Lotificaciones] Verificando en el backend si tiene lotes...')
      const lotificacionActualizada = await lotificacionService.getLotificacion(lotificacionToDelete.id)
      if (lotificacionActualizada.total_lotes > 0) {
        setWarningMessage(`No se puede eliminar la lotificación "${lotificacionActualizada.nombre}" porque tiene ${lotificacionActualizada.total_lotes} lote(s) asociado(s).`)
        setIsSubmitting(false)
        setIsDeleteDialogOpen(false)
        setLotificacionToDelete(null)
        return
      }

      console.log('[Lotificaciones] Eliminando lotificación:', lotificacionToDelete.id)
      
      await lotificacionService.deleteLotificacion(lotificacionToDelete.id)
      console.log('[Lotificaciones] Lotificación eliminada exitosamente')
      
      // Si era la activa, limpiarla
      if (lotificacionActiva?.id === lotificacionToDelete.id) {
        setLotificacionActiva(null)
      }
      
      // Recargar datos desde el backend
      console.log('[Lotificaciones] Recargando datos después de eliminar...')
      await cargarLotificaciones()
      
      setIsDeleteDialogOpen(false)
      setLotificacionToDelete(null)
      
      console.log('[Lotificaciones] Eliminación completada exitosamente')
    } catch (err: any) {
      // Se omite el console.error para no saturar el inspector del navegador; el error se maneja vía UI
      
      let errorMessage = 'Error al eliminar la lotificación'
      
      // Chequeo rápido de status 500 (común en ProtectedError de Django)
      if (err.status === 500 || err.message?.includes('500')) {
        errorMessage = 'No se puede eliminar la lotificación porque tiene registros asociados (manzanas, servicios, etc.). Elimina estos registros primero.'
      } else if (err.data) {
        if (err.data.detail) {
          errorMessage = err.data.detail
        } else if (err.data.message) {
          errorMessage = err.data.message
        } else if (typeof err.data === 'string') {
          // Si el backend devuelve HTML (ej. página de error cruda de Django)
          if (err.data.trim().startsWith('<')) {
            errorMessage = 'Ocurrió un error en el servidor. Es muy probable que la lotificación tenga registros asociados que impiden su eliminación segura.'
          } else {
            errorMessage = err.data
          }
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      // Filtros adicionales por palabras clave de base de datos
      if (errorMessage.includes('relacion') || errorMessage.includes('foreign key') || errorMessage.includes('constraint') || errorMessage.includes('ProtectedError')) {
        errorMessage = 'No se puede eliminar la lotificación porque tiene registros asociados en el sistema. Primero elimina o desvincula esos registros.'
      }
      
      setWarningMessage(errorMessage)
      setIsDeleteDialogOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cargar datos en formulario para crear nueva
  const handleCreate = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      ubicacion: "",
      activo: true,
      total_manzanas: 0,
      total_lotes: 0,
      area_total_m2: 0
    })
    setManzanas([])
    setManzanasPage(1)
    setPendingSvgFile(null)
    setEditingLotificacion(null)
    setCurrentLotificacionData(null)
    setIsDialogOpen(true)
  }

  // Cargar datos en formulario para editar
  const handleEdit = (lotificacion: Lotificacion) => {
    setFormData({
      nombre: lotificacion.nombre,
      descripcion: lotificacion.descripcion || "",
      ubicacion: lotificacion.ubicacion || "",
      activo: lotificacion.activo,
      total_manzanas: lotificacion.total_manzanas || 0,
      total_lotes: lotificacion.total_lotes || 0,
      area_total_m2: lotificacion.area_total_m2 || 0
    })
    setManzanasPage(1)
    setPendingSvgFile(null)
    setEditingLotificacion(lotificacion)
    setCurrentLotificacionData(lotificacion)
    setIsDialogOpen(true)
  }

  // Manejar subida de SVG
  const handleUploadSvg = async (file: File) => {
    if (!editingLotificacion) {
      throw new Error('No hay lotificación seleccionada para editar')
    }

    try {
      const updated = await lotificacionService.subirPlanoSvg(editingLotificacion.id, file)
      setCurrentLotificacionData(updated)
      
      // Actualizar también en la lista
      setLotificaciones(prev => 
        prev.map(l => l.id === updated.id ? updated : l)
      )
      
      // Si era la activa, actualizarla también
      if (lotificacionActiva?.id === updated.id) {
        setLotificacionActiva(updated)
      }
      
      // Actualizar editingLotificacion con los nuevos datos
      setEditingLotificacion(updated)
    } catch (error: any) {
      throw error
    }
  }

  // Manejar eliminación de SVG
  const handleDeleteSvg = async () => {
    if (!editingLotificacion) {
      throw new Error('No hay lotificación seleccionada para editar')
    }

    try {
      const updated = await lotificacionService.eliminarPlanoSvg(editingLotificacion.id)
      setCurrentLotificacionData(updated)
      
      // Actualizar también en la lista
      setLotificaciones(prev => 
        prev.map(l => l.id === updated.id ? updated : l)
      )
      
      // Si era la activa, actualizarla también
      if (lotificacionActiva?.id === updated.id) {
        setLotificacionActiva(updated)
      }
      
      // Actualizar editingLotificacion con los nuevos datos
      setEditingLotificacion(updated)
    } catch (error: any) {
      throw error
    }
  }

  // Confirmar eliminación
  const confirmDelete = (lotificacion: Lotificacion) => {
    setLotificacionToDelete(lotificacion)
    setIsDeleteDialogOpen(true)
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando lotificaciones...</span>
        </div>
      </div>
    )
  }

  // Mostrar error de conexión
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lotificaciones</h1>
            <p className="text-muted-foreground">Gestiona las lotificaciones del sistema</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Error de conexión:</strong> {error}</p>
              <p className="text-sm">Verifica que el backend esté ejecutándose en <code>{appConfig.api.baseUrl}</code></p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lotificaciones</h1>
          <p className="text-muted-foreground">Gestiona las lotificaciones del sistema</p>
        </div>
        <Button onClick={handleCreate} variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Crear Nueva Lotificación
        </Button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o ubicación..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={filterStatus}
            onValueChange={(value: "todas" | "activa" | "inactiva") => setFilterStatus(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="activa">Activas</SelectItem>
              <SelectItem value="inactiva">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de todas las lotificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Lotificaciones</CardTitle>
          <CardDescription>Lista de lotificaciones en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {lotificaciones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No hay lotificaciones registradas en el sistema</p>
              <Button onClick={() => {
                setFormData({
                  nombre: "",
                  descripcion: "",
                  ubicacion: "",
                  activo: true,
                  total_manzanas: 0,
                  total_lotes: 0,
                  area_total_m2: 0
                })
                setIsDialogOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Lotificación
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {lotificaciones
                .filter((lot) => {
                  const matchesSearch = lot.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        (lot.ubicacion && lot.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()));
                  const matchesFilter = filterStatus === "todas" ? true :
                                        filterStatus === "activa" ? lot.activo === true :
                                        lot.activo === false;
                  return matchesSearch && matchesFilter;
                })
                .map((lot) => (
                <div
                  key={lot.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                    lotificacionActiva?.id === lot.id ? 'border-primary bg-primary/5' : ''
                  } ${!lot.activo ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Building2 className={`h-5 w-5 ${lot.activo ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${!lot.activo ? 'text-muted-foreground' : ''}`}>{lot.nombre}</p>
                        {lot.activo && lotificacionActiva?.id === lot.id && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            En Uso
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${lot.activo ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                        {lot.ubicacion || 'Sin ubicación'}
                      </p>
                      {lot.descripcion && (
                        <p className={`text-xs mt-1 line-clamp-1 ${lot.activo ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                          {lot.descripcion}
                        </p>
                      )}
                      <div className={`flex items-center gap-4 mt-2 text-xs ${lot.activo ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                        <span>Manzanas: {lot.total_manzanas || 0}</span>
                        <span>•</span>
                        <span>Creada: {new Date(lot.fecha_creacion).toLocaleDateString('es-GT')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={lot.activo ? "default" : "secondary"}>
                      {lot.activo ? "Activa" : "Inactiva"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(lot)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(lot)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar lotificación */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          setEditingLotificacion(null)
          setCurrentLotificacionData(null)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLotificacion ? 'Editar Lotificación' : 'Crear Nueva Lotificación'}
            </DialogTitle>
            <DialogDescription>
              {editingLotificacion 
                ? 'Modifica los datos de la lotificación' 
                : 'Completa los campos para crear una nueva lotificación en el sistema'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Lotificación *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                placeholder="Ej: Residencial Los Pinos"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Nombre único que identifica la lotificación
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Ej: Ciudad de Guatemala, Zona 10"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Ubicación física de la lotificación
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada de la lotificación..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Información adicional sobre la lotificación
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_manzanas">Total de Manzanas</Label>
                <Input
                  id="total_manzanas"
                  type="number"
                  value={formData.total_manzanas}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Total calculado a partir de las manzanas añadidas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_lotes">Total de Lotes</Label>
                <Input
                  id="total_lotes"
                  type="number"
                  value={formData.total_lotes}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Lotes totales calculados por el sistema
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_total_m2">Área Total (m²) *</Label>
                <Input
                  id="area_total_m2"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.area_total_m2}
                  onChange={(e) => setFormData({ ...formData, area_total_m2: parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Área total en metros cuadrados
                </p>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Manzanas</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setManzanas([...manzanas, { nombre: "", activo: true }])
                    const newTotal = manzanas.length + 1
                    setManzanasPage(Math.ceil(newTotal / MANZANAS_PER_PAGE))
                  }}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manzana +
                </Button>
              </div>
              
              {manzanas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay manzanas registradas. Haz clic en "Manzana +" para empezar.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 items-center text-sm">
                    <span className="font-medium text-muted-foreground">Nombre (máx. 10)</span>
                    <span className="font-medium text-muted-foreground">Activa</span>
                    <span className="font-medium text-muted-foreground text-center w-9">Acción</span>
                    {((): ManzanaRow[] => {
                      const start = (manzanasPage - 1) * MANZANAS_PER_PAGE
                      return manzanas.slice(start, start + MANZANAS_PER_PAGE)
                    })().map((row, localIndex) => {
                      const index = (manzanasPage - 1) * MANZANAS_PER_PAGE + localIndex
                      return (
                        <span key={index} className="contents">
                          <Input
                            maxLength={10}
                            value={row.nombre}
                            onChange={(e) =>
                              setManzanas((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, nombre: e.target.value } : r))
                              )
                            }
                            placeholder={`Manzana ${index + 1}`}
                            className="h-9"
                            disabled={isSubmitting}
                          />
                          <Switch
                            checked={row.activo}
                            onCheckedChange={(checked) =>
                              setManzanas((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, activo: checked } : r))
                              )
                            }
                            disabled={isSubmitting}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 p-0 h-9 w-9"
                            onClick={() => handleDeleteManzana(index, row)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </span>
                      )
                    })}
                  </div>
                  {manzanas.length > MANZANAS_PER_PAGE && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground">
                        Página {manzanasPage} de {Math.ceil(manzanas.length / MANZANAS_PER_PAGE)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setManzanasPage((p) => Math.max(1, p - 1))}
                          disabled={manzanasPage <= 1 || isSubmitting}
                        >
                          Anterior
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setManzanasPage((p) =>
                              Math.min(Math.ceil(manzanas.length / MANZANAS_PER_PAGE), p + 1)
                            )
                          }
                          disabled={manzanasPage >= Math.ceil(manzanas.length / MANZANAS_PER_PAGE) || isSubmitting}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="activo" className="text-base">Estado de la Lotificación</Label>
                <p className="text-sm text-muted-foreground">
                  Las lotificaciones activas estarán disponibles para uso en el sistema
                </p>
              </div>
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>

            {/* Componente para subir/administrar SVG */}
            {editingLotificacion ? (
              <SVGUploader
                lotificacion={currentLotificacionData || editingLotificacion}
                lotificacionId={editingLotificacion.id}
                onUpload={handleUploadSvg}
                onDelete={handleDeleteSvg}
                disabled={isSubmitting}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <Label className="text-sm font-medium">Plano SVG de la Lotificación</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept=".svg,image/svg+xml" 
                    onChange={(e) => setPendingSvgFile(e.target.files?.[0] || null)}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Opcional. Selecciona un archivo SVG inicial. Podrás editarlo más tarde.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false)
                  setEditingLotificacion(null)
                  setCurrentLotificacionData(null)
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingLotificacion ? 'Actualizar' : 'Crear'} Lotificación
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Advertencia */}
      <AlertDialog open={!!warningMessage} onOpenChange={(open) => !open && setWarningMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertCircle className="h-5 w-5" />
              Advertencia
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground mt-2">
              {warningMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setWarningMessage(null)}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la lotificación
              <strong className="block mt-2">"{lotificacionToDelete?.nombre}"</strong>
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

