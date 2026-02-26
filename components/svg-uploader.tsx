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
  Image as ImageIcon
} from "lucide-react"
import type { Lotificacion } from "@/lib/lotificacion-service"

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
}: SVGUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Obtener URL del SVG actual
  const svgUrl = lotificacion?.plano_svg_url || lotificacion?.plano_svg

  // Cargar preview del SVG actual si existe
  useEffect(() => {
    if (svgUrl && !selectedFile) {
      setPreview(svgUrl)
    } else if (!svgUrl && !selectedFile) {
      setPreview(null)
    }
  }, [svgUrl, selectedFile])

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

    if (!confirm('¿Estás seguro de que deseas eliminar el plano SVG? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setIsDeleting(true)
      setError(null)
      setSuccess(null)

      if (onDelete) {
        await onDelete()
        setSuccess('Plano SVG eliminado exitosamente')
        setPreview(null)
        setSelectedFile(null)
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el archivo')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedFile(null)
    setError(null)
    setSuccess(null)
    // Restaurar preview del SVG actual si existe
    if (svgUrl) {
      setPreview(svgUrl)
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
            <Label>Previsualización</Label>
            <div className="border rounded-lg p-4 bg-muted/30 overflow-auto max-h-96">
              <div className="flex items-center justify-center min-h-[200px]">
                {preview.startsWith('<svg') || preview.startsWith('<?xml') ? (
                  <div 
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                ) : preview.startsWith('http') || preview.startsWith('/') ? (
                  <img 
                    src={preview} 
                    alt="Preview del plano SVG" 
                    className="max-w-full max-h-80 object-contain"
                    onError={(e) => {
                      // Si falla la carga de imagen, intentar como SVG inline
                      fetch(preview)
                        .then(res => res.text())
                        .then(svgText => {
                          if (svgText.includes('<svg')) {
                            setPreview(svgText)
                          }
                        })
                        .catch(() => {
                          console.error('Error cargando SVG')
                        })
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No se puede mostrar la previsualización
                  </div>
                )}
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
              disabled={disabled || isSubmitting || isUploading || isDeleting}
            />
            <Label htmlFor="svg-upload" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={disabled || isSubmitting || isUploading || isDeleting}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {hasCurrentSvg ? 'Reemplazar SVG' : hasNewFile ? 'Cambiar Archivo' : 'Subir SVG'}
                </span>
              </Button>
            </Label>

            {/* Botón para subir nuevo archivo seleccionado */}
            {hasNewFile && (
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

