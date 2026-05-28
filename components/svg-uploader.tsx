"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  X, 
  FileImage, 
  Loader2, 
  AlertCircle,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react"
import { lotificacionService, type Lotificacion } from "@/lib/lotificacion-service"
import { cn } from "@/lib/utils"

interface SVGUploaderProps {
  lotificacion?: Lotificacion | null
  lotificacionId?: number
  onUpload?: (file: File) => Promise<void>
  onDelete?: () => Promise<void>
  onUploadSuccess?: (lotificacion: Lotificacion) => void
  onDeleteSuccess?: (lotificacion: Lotificacion) => void
  disabled?: boolean
  isSubmitting?: boolean
  className?: string
  pendingFile?: File | null
  onPendingFileChange?: (file: File | null) => void
}

export function SVGUploader({
  lotificacion,
  lotificacionId,
  onUpload,
  onDelete,
  onUploadSuccess,
  onDeleteSuccess,
  disabled = false,
  isSubmitting = false,
  className = "",
  pendingFile = null,
  onPendingFileChange,
}: SVGUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isValidatingLots, setIsValidatingLots] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Zoom & Pan states for preview
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 })
  const [isPanningPreview, setIsPanningPreview] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Obtener URL del SVG actual
  const svgUrl = lotificacion?.plano_svg_url || lotificacion?.plano_svg

  // Cargar preview del SVG actual si existe
  useEffect(() => {
    if (selectedFile) {
      // Ya lo maneja handleFileSelect
    } else if (pendingFile) {
      setSelectedFile(pendingFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreview(result)
      }
      reader.readAsText(pendingFile)
    } else if (svgUrl) {
      // Añadir cache-buster dinámico basado en la fecha de subida o tiempo actual
      const buster = `?t=${lotificacion?.plano_svg_fecha_subida ? new Date(lotificacion.plano_svg_fecha_subida).getTime() : Date.now()}`
      setPreview(svgUrl.includes('?') ? `${svgUrl}&t=${Date.now()}` : `${svgUrl}${buster}`)
    } else {
      setPreview(null)
    }
  }, [svgUrl, selectedFile, pendingFile, lotificacion?.plano_svg_fecha_subida])

  // Resetear zoom al cambiar de preview
  useEffect(() => {
    setZoomScale(1)
    setZoomOffset({ x: 0, y: 0 })
  }, [preview])

  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanningPreview(true)
    setPanStart({ x: e.clientX - zoomOffset.x, y: e.clientY - zoomOffset.y })
  }

  const handlePreviewMouseMove = (e: React.MouseEvent) => {
    if (!isPanningPreview) return
    setZoomOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    })
  }

  const handlePreviewMouseUp = () => {
    setIsPanningPreview(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que sea SVG
    if (!file.name.toLowerCase().endsWith('.svg') && !file.type.includes('svg')) {
      setError('El archivo debe ser un SVG (.svg)')
      return
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Tamaño máximo: 10MB')
      return
    }

    setError(null)
    setSuccess(null)
    setSelectedFile(file)
    onPendingFileChange?.(file)

    // Crear preview del archivo seleccionado
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setIsUploading(true)
      setError(null)
      setSuccess(null)

      if (onUpload) {
        await onUpload(selectedFile)
        setSuccess('Plano SVG subido exitosamente')
        setSelectedFile(null)
        onPendingFileChange?.(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!lotificacion?.tiene_plano_svg) return

    try {
      setIsDeleting(true)
      setError(null)
      setSuccess(null)

      if (lotificacionId) {
        const lotes = await lotificacionService.getLotesPlano(lotificacionId)
        const tieneVinculados = lotes.some(l => l.identificador || l.plano_svg_id)
        if (tieneVinculados) {
          setError("No se puede eliminar el plano SVG porque tiene lotes vinculados. Primero debes desvincular todos los lotes en la ventana de lotes.")
          setIsDeleting(false)
          return
        }
      }

      if (!confirm('¿Estás seguro de que deseas eliminar el plano SVG? Esta acción no se puede deshacer.')) {
        setIsDeleting(false)
        return
      }

      if (onDelete) {
        await onDelete()
        setSuccess('Plano SVG eliminado exitosamente')
        setPreview(null)
        setSelectedFile(null)
        onPendingFileChange?.(null)
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el archivo')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSelectClick = async () => {
    if (lotificacionId && hasCurrentSvg) {
      setIsValidatingLots(true)
      setError(null)
      setSuccess(null)
      try {
        const lotes = await lotificacionService.getLotesPlano(lotificacionId)
        const tieneVinculados = lotes.some(l => l.identificador || l.plano_svg_id)
        if (tieneVinculados) {
          setError("No se puede reemplazar el plano SVG porque tiene lotes vinculados. Primero debes desvincular todos los lotes en la ventana de lotes.")
          setIsValidatingLots(false)
          return
        }
      } catch (err) {
        console.error("Error validando lotes vinculados:", err)
      } finally {
        setIsValidatingLots(false)
      }
    }
    
    // Si pasa la validación o no tiene SVG actual, abrir el selector de archivos
    fileInputRef.current?.click()
  }

  const handleClearSelection = () => {
    setSelectedFile(null)
    setError(null)
    setSuccess(null)
    onPendingFileChange?.(null)
    // Restaurar preview del SVG actual si existe
    if (svgUrl) {
      const buster = `?t=${lotificacion?.plano_svg_fecha_subida ? new Date(lotificacion.plano_svg_fecha_subida).getTime() : Date.now()}`
      setPreview(svgUrl.includes('?') ? `${svgUrl}&t=${Date.now()}` : `${svgUrl}${buster}`)
    } else {
      setPreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const hasCurrentSvg = lotificacion?.tiene_plano_svg && svgUrl && !selectedFile
  const hasNewFile = selectedFile !== null
  const showPreview = preview !== null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Plano SVG de la Lotificación
        </CardTitle>
        <CardDescription>
          Sube un archivo SVG del plano de la lotificación. Solo se permite un plano por lotificación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del SVG actual */}
        {hasCurrentSvg && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Plano SVG actual</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Nombre:</span> {lotificacion.plano_svg_nombre || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Tamaño:</span> {formatFileSize(lotificacion.plano_svg_tamaño)}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Fecha de subida:</span> {formatDate(lotificacion.plano_svg_fecha_subida)}
              </div>
            </div>
          </div>
        )}

        {/* Preview del SVG */}
        {showPreview && (
          <div className="space-y-2">
            <Label>Previsualización (Arrastra para mover, usa botones para zoom)</Label>
            <div 
              className={cn(
                "relative w-full h-[300px] border rounded-lg overflow-hidden bg-muted/20 select-none",
                isPanningPreview ? "cursor-grabbing" : "cursor-grab"
              )}
              onMouseDown={handlePreviewMouseDown}
              onMouseMove={handlePreviewMouseMove}
              onMouseUp={handlePreviewMouseUp}
              onMouseLeave={handlePreviewMouseUp}
            >
              <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                  transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomScale})`,
                  transformOrigin: "center center"
                }}
              >
                {preview.startsWith('<svg') || preview.startsWith('<?xml') ? (
                  <div 
                    className="w-full h-full flex items-center justify-center pointer-events-none [&_svg]:max-w-full [&_svg]:max-h-[260px] [&_svg]:w-auto [&_svg]:h-auto [&_svg]:block [&_svg]:mx-auto"
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                ) : preview.startsWith('http') || preview.startsWith('/') ? (
                  <img 
                    src={preview} 
                    alt="Preview del plano SVG" 
                    className="max-w-full max-h-[260px] object-contain pointer-events-none"
                    onError={(e) => {
                      // Si falla la carga de imagen, intentar como SVG inline
                      const loadSVG = async () => {
                        try {
                          let svgText: string
                          // Si es una URL del servidor API, usar apiRequestText con autenticación
                          if (preview.includes('/api/') || preview.startsWith('/')) {
                            const { apiRequestText } = await import('@/lib/api')
                            svgText = await apiRequestText(preview.replace(/^.*\/api/, ''))
                          } else {
                            // Para URLs externas, usar fetch directo
                            const res = await fetch(preview)
                            svgText = await res.text()
                          }
                          if (svgText.includes('<svg')) {
                            setPreview(svgText)
                          }
                        } catch (error) {
                          console.error('Error cargando SVG:', error)
                        }
                      }
                      loadSVG()
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No se puede mostrar la previsualización
                  </div>
                )}
              </div>

              {/* Botones de control de Zoom */}
              <div className="absolute bottom-2 right-2 flex gap-1 shadow-md rounded-md p-1 bg-background/95 border backdrop-blur">
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setZoomScale(s => Math.min(4, s * 1.2))}
                  title="Acercar"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setZoomScale(s => Math.max(0.4, s / 1.2))}
                  title="Alejar"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => {
                    setZoomScale(1)
                    setZoomOffset({ x: 0, y: 0 })
                  }}
                  title="Restablecer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {hasNewFile 
                ? `Archivo seleccionado: ${selectedFile?.name} (${formatFileSize(selectedFile?.size)})`
                : 'Plano SVG actual'}
            </p>
          </div>
        )}

        {/* Sin SVG actual ni seleccionado */}
        {!hasCurrentSvg && !hasNewFile && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center mb-4">
              No hay plano SVG cargado
            </p>
          </div>
        )}

        {/* Mensajes de error y éxito */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Controles */}
        <div className="flex flex-col gap-2">
          {/* Input de archivo */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              id="svg-upload"
              accept=".svg,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || isSubmitting || isUploading || isDeleting || isValidatingLots}
              title="Seleccionar archivo SVG del plano de la lotificación"
              aria-label="Seleccionar archivo SVG del plano de la lotificación"
            />
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={disabled || isSubmitting || isUploading || isDeleting || isValidatingLots}
                onClick={handleSelectClick}
              >
                {isValidatingLots ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando lotes...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {hasCurrentSvg ? 'Reemplazar SVG' : hasNewFile ? 'Cambiar Archivo' : 'Subir SVG'}
                  </>
                )}
              </Button>
            </div>

            {/* Botón para subir nuevo archivo seleccionado */}
            {hasNewFile && !onPendingFileChange && (
              <Button
                type="button"
                onClick={handleUpload}
                disabled={disabled || isSubmitting || isUploading || isDeleting}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Guardar SVG
                  </>
                )}
              </Button>
            )}

            {/* Botón para cancelar selección */}
            {hasNewFile && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearSelection}
                disabled={disabled || isSubmitting || isUploading || isDeleting}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Botón para eliminar SVG actual */}
          {hasCurrentSvg && !hasNewFile && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={disabled || isSubmitting || isUploading || isDeleting}
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Plano SVG
                </>
              )}
            </Button>
          )}
        </div>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Solo se permiten archivos SVG (.svg)</p>
          <p>• Tamaño máximo: 10MB</p>
          <p>• Al subir un nuevo SVG, se reemplazará el actual</p>
        </div>
      </CardContent>
    </Card>
  )
}

