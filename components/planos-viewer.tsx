"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Download, Maximize2 } from "lucide-react"

interface PlanosViewerProps {
  planoUrl?: string | null
  planoNombre?: string
  esPdf?: boolean
  esImagen?: boolean
  onUpload?: (file: File) => Promise<void>
  isLoading?: boolean
}

export function PlanosViewer({ planoUrl, planoNombre, esPdf, esImagen, onUpload, isLoading = false }: PlanosViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/dwg']
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.dwg', '.dxf']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setUploadError('Tipo de archivo no válido. Solo se permiten PDF, imágenes (JPG, PNG) o archivos AutoCAD (DWG, DXF)')
      return
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setUploadError('El archivo es demasiado grande. El tamaño máximo es 10MB')
      return
    }

    if (onUpload) {
      try {
        setIsUploading(true)
        setUploadError(null)
        await onUpload(file)
      } catch (error: any) {
        setUploadError(error.message || 'Error al subir el archivo')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleDownload = () => {
    if (planoUrl) {
      const link = document.createElement('a')
      link.href = planoUrl
      link.download = planoNombre || 'plano.pdf'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Usar los valores del backend si están disponibles, sino intentar detectar desde la URL
  const isPDF = esPdf !== undefined ? esPdf : (planoUrl?.toLowerCase().includes('.pdf') || planoUrl?.includes('application/pdf') || planoUrl?.includes('pdf'))
  const isImage = esImagen !== undefined ? esImagen : (planoUrl?.match(/\.(jpg|jpeg|png|gif)$/i) || planoUrl?.includes('image/') || planoUrl?.match(/\.(jpg|jpeg|png|gif)/i))

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planos de Lotificación</CardTitle>
              <CardDescription>
                Visualiza y gestiona los planos de AutoCAD de la lotificación
              </CardDescription>
            </div>
            {planoUrl && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Ampliar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : planoUrl ? (
            <div className="space-y-4">
              {isPDF ? (
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <iframe
                    src={planoUrl}
                    className="w-full h-[600px]"
                    title="Plano PDF"
                  />
                </div>
              ) : isImage ? (
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={planoUrl}
                    alt={planoNombre || "Plano de lotificación"}
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center bg-muted">
                  <p className="text-muted-foreground">
                    Formato de archivo no soportado para visualización
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar archivo
                  </Button>
                </div>
              )}
              
              {planoNombre && (
                <div className="text-sm text-muted-foreground">
                  <strong>Archivo:</strong> {planoNombre}
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No hay planos cargados
              </p>
            </div>
          )}

          {/* Botón de subir archivo */}
          <div className="mt-4">
            <input
              type="file"
              id="plano-upload"
              accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <label htmlFor="plano-upload">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isUploading}
                asChild
              >
                <span>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    'Subir Plano'
                  )}
                </span>
              </Button>
            </label>
          </div>

          {uploadError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {uploadError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para vista fullscreen */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Plano de Lotificación - Vista Completa</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6">
            {isPDF ? (
              <iframe
                src={planoUrl}
                className="w-full h-full min-h-[80vh]"
                title="Plano PDF"
              />
            ) : isImage ? (
              <img
                src={planoUrl}
                alt={planoNombre || "Plano de lotificación"}
                className="w-full h-auto object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

