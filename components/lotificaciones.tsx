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
  CheckCircle2
} from "lucide-react"
import { 
  lotificacionService,
  type Lotificacion,
  type LotificacionCreate,
  type LotificacionUpdate
} from "@/lib/lotificacion-service"
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
        errorMessage = 'No se puede conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000'
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

  // Sincronizar filas de manzanas con total_manzanas (redimensionar al cambiar el número)
  useEffect(() => {
    const N = formData.total_manzanas || 0
    if (N <= 0) {
      setManzanas([])
      setManzanasPage(1)
      return
    }
    setManzanas((prev) => {
      const next = prev.slice(0, N)
      while (next.length < N) next.push({ nombre: "", activo: true })
      return next
    })
    setManzanasPage(1)
  }, [formData.total_manzanas])

  // Al abrir para editar, cargar manzanas existentes desde el backend
  useEffect(() => {
    const N = editingLotificacion?.total_manzanas ?? 0
    if (!editingLotificacion?.id || N <= 0) return
    lotificacionService
      .getManzanas(editingLotificacion.id, true)
      .then((list) => {
        const rows: ManzanaRow[] = []
        for (let i = 0; i < N; i++) {
          const m = list[i]
          rows.push(m ? { id: m.id, nombre: m.nombre, activo: m.activo } : { nombre: "", activo: true })
        }
        setManzanas(rows)
      })
      .catch(() => {})
  }, [editingLotificacion?.id, editingLotificacion?.total_manzanas])

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
      console.error('[Lotificaciones] Error eliminando lotificación:', err)
      
      let errorMessage = 'Error al eliminar la lotificación'
      
      if (err.data) {
        if (err.data.detail) {
          errorMessage = err.data.detail
        } else if (err.data.message) {
          errorMessage = err.data.message
        } else if (typeof err.data === 'string') {
          errorMessage = err.data
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      // Si el error es que tiene relaciones (manzanas, lotes), mostrar mensaje más claro
      if (errorMessage.includes('relacion') || errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
        errorMessage = 'No se puede eliminar la lotificación porque tiene manzanas o lotes asociados. Primero elimina o mueve esos registros.'
      }
      
      alert(`Error: ${errorMessage}. Por favor, intenta de nuevo.`)
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
              <p className="text-sm">Verifica que el backend esté ejecutándose en <code>http://localhost:8000</code></p>
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

      {/* Información de la lotificación activa */}
      {lotificacionActiva ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {lotificacionActiva.nombre}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <MapPin className="h-4 w-4" />
                  {lotificacionActiva.ubicacion || 'Sin ubicación'}
                </CardDescription>
              </div>
              <Badge variant={lotificacionActiva.activo ? "default" : "secondary"}>
                {lotificacionActiva.activo ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nombre</Label>
                <p className="text-lg font-semibold">{lotificacionActiva.nombre}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Ubicación</Label>
                <p className="text-sm">{lotificacionActiva.ubicacion || 'No especificada'}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                <p className="text-sm">{lotificacionActiva.descripcion || 'Sin descripción'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total de Manzanas</Label>
                <p className="text-sm">{lotificacionActiva.total_manzanas || 0}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Fecha de Creación</Label>
                <p className="text-sm">{new Date(lotificacionActiva.fecha_creacion).toLocaleDateString('es-GT')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Última Actualización</Label>
                <p className="text-sm">{new Date(lotificacionActiva.fecha_actualizacion).toLocaleDateString('es-GT')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No hay lotificación activa</CardTitle>
            <CardDescription>Crea una nueva lotificación para comenzar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No hay lotificación activa en el sistema</p>
              <Button onClick={() => {
                setFormData({
                  nombre: "",
                  descripcion: "",
                  ubicacion: "",
                  activo: true
                })
                setIsDialogOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Lotificación
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de todas las lotificaciones */}
      {lotificaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Todas las Lotificaciones ({lotificaciones.length})</CardTitle>
            <CardDescription>Lista completa de lotificaciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lotificaciones.map((lot) => (
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
          </CardContent>
        </Card>
      )}

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
                <Label htmlFor="total_manzanas">Total de Manzanas *</Label>
                <Input
                  id="total_manzanas"
                  type="number"
                  min="0"
                  value={formData.total_manzanas}
                  onChange={(e) => setFormData({ ...formData, total_manzanas: parseInt(e.target.value) || 0 })}
                  required
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Número total de manzanas en la lotificación
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_lotes">Total de Lotes *</Label>
                <Input
                  id="total_lotes"
                  type="number"
                  min="0"
                  value={formData.total_lotes}
                  onChange={(e) => setFormData({ ...formData, total_lotes: parseInt(e.target.value) || 0 })}
                  required
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Número total de lotes en la lotificación
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
            {formData.total_manzanas > 0 && (
              <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <Label className="text-sm font-medium">Manzanas</Label>
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 items-center text-sm">
                  <span className="font-medium text-muted-foreground">Nombre (máx. 10)</span>
                  <span className="font-medium text-muted-foreground">Activa</span>
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
                        />
                        <Switch
                          checked={row.activo}
                          onCheckedChange={(checked) =>
                            setManzanas((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, activo: checked } : r))
                            )
                          }
                        />
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
                        disabled={manzanasPage <= 1}
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
                        disabled={manzanasPage >= Math.ceil(manzanas.length / MANZANAS_PER_PAGE)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
            {editingLotificacion && (
              <SVGUploader
                lotificacion={currentLotificacionData || editingLotificacion}
                lotificacionId={editingLotificacion.id}
                onUpload={handleUploadSvg}
                onDelete={handleDeleteSvg}
                disabled={isSubmitting}
                isSubmitting={isSubmitting}
              />
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

