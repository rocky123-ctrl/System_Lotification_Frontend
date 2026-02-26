"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2, Info, Filter, PlusCircle } from "lucide-react"
import { lotesService, type Lote } from "@/lib/lotes-service"

/** Parsea un id de lote tipo "MZ03-L07" a manzana (número) y numero_lote */
function parseLoteId(loteId: string): { manzana: number; numero_lote: string } {
  const match = loteId.match(/MZ(\d+)-L(\d+)/i) || loteId.match(/(\d+)-(\d+)/)
  if (match) {
    return { manzana: parseInt(match[1], 10), numero_lote: match[2] }
  }
  return { manzana: 1, numero_lote: "01" }
}

interface InteractiveSVGViewerProps {
  svgContent?: string
  svgUrl?: string
  /** Si se pasa, solo se cargan y muestran lotes de esta lotificación */
  lotificacionId?: number
  onLoteClick?: (loteId: string) => void
  /** Llamado cuando el usuario quiere crear la información del lote manualmente (lote sin datos en backend) */
  onCrearLoteManual?: (info: { manzana: number; numero_lote: string; loteId: string }) => void
  className?: string
}

interface LoteInfo {
  id: string
  manzana: string
  manzanaId: number
  numero: string
  estado: 'disponible' | 'reservado' | 'vendido' | 'en_proceso' | 'cancelado'
  precio?: number
  area?: number
  element?: SVGElement
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  content: {
    id: string
    estado: string
  } | null
}

const ESTADO_COLORS: Record<string, string> = {
  disponible: '#10b981', // green-500
  reservado: '#f59e0b', // amber-500
  vendido: '#ef4444', // red-500
  en_proceso: '#3b82f6', // blue-500
  cancelado: '#6b7280', // gray-500
}

const ESTADO_LABELS: Record<string, string> = {
  disponible: 'DISPONIBLE',
  reservado: 'RESERVADO',
  vendido: 'VENDIDO',
  en_proceso: 'EN PROCESO',
  cancelado: 'CANCELADO',
}

export function InteractiveSVGViewer({
  svgContent,
  svgUrl,
  lotificacionId,
  onLoteClick,
  onCrearLoteManual,
  className = "",
}: InteractiveSVGViewerProps) {
  const [svg, setSvg] = useState<string>("")
  const [svgViewBox, setSvgViewBox] = useState<string>("")
  const [lotes, setLotes] = useState<Map<string, LoteInfo>>(new Map())
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingLote, setIsLoadingLote] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedManzana, setSelectedManzana] = useState<string>("all")
  const [hoveredLoteId, setHoveredLoteId] = useState<string | null>(null)

  // Estados para zoom y pan
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const svgElementRef = useRef<SVGSVGElement | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Índice de manzanas para el filtro
  const manzanas = useMemo(() => {
    const manzanasSet = new Set<string>()
    lotes.forEach((lote) => {
      manzanasSet.add(lote.manzana)
    })
    return Array.from(manzanasSet).sort()
  }, [lotes])

  // Cargar SVG y extraer viewBox
  useEffect(() => {
    const loadSVG = async () => {
      if (svgContent) {
        processSVG(svgContent)
      } else if (svgUrl) {
        try {
          const response = await fetch(svgUrl)
          const content = await response.text()
          processSVG(content)
        } catch (error) {
          console.error("Error cargando SVG:", error)
        }
      }
    }

    loadSVG()
  }, [svgContent, svgUrl])

  // Procesar SVG y extraer viewBox
  const processSVG = (svgContent: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgContent, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')
    
    if (svgElement) {
      // Extraer viewBox o crear uno desde width/height
      let viewBox = svgElement.getAttribute('viewBox')
      if (!viewBox) {
        const width = svgElement.getAttribute('width') || '100%'
        const height = svgElement.getAttribute('height') || '100%'
        viewBox = `0 0 ${width} ${height}`
      }
      
      // Asegurar que el SVG tenga viewBox y preserveAspectRatio
      svgElement.setAttribute('viewBox', viewBox)
      svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')
      svgElement.setAttribute('width', '100%')
      svgElement.setAttribute('height', '100%')
      // Cursor pointer en elementos con id/data-lote-id para que sean claramente clicables
      svgElement.querySelectorAll('path, polygon, rect, circle, ellipse').forEach((el) => {
        if (el.id || el.getAttribute('data-lote-id')) {
          el.setAttribute('style', (el.getAttribute('style') || '') + '; cursor: pointer')
        }
      })
      setSvgViewBox(viewBox)
      setSvg(svgElement.outerHTML)
    } else {
      setSvg(svgContent)
    }
  }

  // Cargar información de lotes desde el backend
  useEffect(() => {
    const loadLotesData = async () => {
      try {
        const filters = lotificacionId ? { lotificacion: lotificacionId } : undefined
        const lotesData = await lotesService.getLotes(filters)
        const lotesMap = new Map<string, LoteInfo>()

        lotesData.forEach((lote) => {
          // Crear ID en formato "MZ03-L07" o similar
          const loteId = `MZ${String(lote.manzana).padStart(2, '0')}-L${String(lote.numero_lote).padStart(2, '0')}`
          lotesMap.set(loteId, {
            id: loteId,
            manzana: lote.manzana_nombre || `Manzana ${lote.manzana}`,
            manzanaId: lote.manzana,
            numero: lote.numero_lote,
            estado: lote.estado,
            precio: parseFloat(lote.valor_total),
            area: parseFloat(lote.metros_cuadrados),
          })
        })

        setLotes(lotesMap)
      } catch (error) {
        console.error("Error cargando lotes:", error)
      }
    }

    if (svg) {
      loadLotesData()
    }
  }, [svg, lotificacionId])

  // Aplicar estilos iniciales a los lotes usando clases CSS
  useEffect(() => {
    if (!svgContainerRef.current || lotes.size === 0) return

    const svgElement = svgContainerRef.current.querySelector('svg') as SVGSVGElement
    if (!svgElement) return

    svgElementRef.current = svgElement

    // Aplicar estilos iniciales a todos los lotes (sin actualizar estado para evitar loops)
    lotes.forEach((loteInfo, loteId) => {
      const element = findLoteElement(svgElement, loteId)
      if (element && !element.hasAttribute('data-lote-styled')) {
        applyLoteStyles(element, loteInfo)
        element.setAttribute('data-lote-styled', 'true')
      }
    })
  }, [svg, lotes.size])

  // Función helper para encontrar elemento de lote
  const findLoteElement = (svgElement: SVGSVGElement, loteId: string): SVGElement | null => {
    // Buscar por ID (escapar caracteres especiales)
    const escapedId = loteId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let element = svgElement.querySelector(`#${escapedId}`) as SVGElement
    
    // Si no se encuentra por ID, buscar por data attributes
    if (!element) {
      element = svgElement.querySelector(`[data-lote-id="${loteId}"]`) as SVGElement
    }
    
    // También buscar por formato alternativo
    if (!element) {
      const [manzanaPart, lotePart] = loteId.split('-')
      const manzanaNum = manzanaPart.replace('MZ', '')
      const loteNum = lotePart.replace('L', '')
      element = svgElement.querySelector(`[data-manzana="${manzanaNum}"][data-lote="${loteNum}"]`) as SVGElement
    }

    // Buscar por cualquier atributo que contenga el ID
    if (!element) {
      const allElements = svgElement.querySelectorAll('path, polygon, rect, circle, ellipse')
      for (const el of allElements) {
        const svgEl = el as SVGElement
        const id = svgEl.id || svgEl.getAttribute('data-lote-id') || ''
        if (id.includes(loteId) || id === loteId.replace('MZ', '').replace('L', '').replace('-', '')) {
          element = svgEl
          break
        }
      }
    }

    return element
  }

  // Aplicar estilos usando clases CSS y atributos
  const applyLoteStyles = (element: SVGElement, loteInfo: LoteInfo) => {
    const color = ESTADO_COLORS[loteInfo.estado] || ESTADO_COLORS.disponible
    
    // Usar clases CSS
    element.classList.add('lote-interactivo')
    element.classList.add(`lote-${loteInfo.estado}`)
    
    // Aplicar atributos de estilo
    element.setAttribute('fill', color)
    element.setAttribute('fill-opacity', '0.6')
    element.setAttribute('stroke', color)
    element.setAttribute('stroke-width', '2')
    element.setAttribute('stroke-opacity', '1')
    
    // Data attributes para lookup
    element.setAttribute('data-lote-id', loteInfo.id)
    element.setAttribute('data-estado', loteInfo.estado)
    element.setAttribute('data-manzana-id', String(loteInfo.manzanaId))
    
    // Cursor pointer
    element.style.cursor = 'pointer'
  }

  // Abrir modal para lote sin información en el backend (click en elemento SVG sin datos)
  const handleLoteClickSinInfo = useCallback((loteId: string) => {
    const { manzana, numero_lote } = parseLoteId(loteId)
    setSelectedLote({
      id: 0,
      manzana,
      numero_lote,
      metros_cuadrados: '0',
      valor_total: '0',
      saldo_financiar: '0',
      enganche: '0',
      costo_instalacion: '0',
      plazo_meses: 0,
      cuota_mensual: '0',
      estado: 'disponible',
      created_at: '',
      updated_at: '',
    } as Lote)
    setIsLoadingLote(false)
    setIsModalOpen(true)
  }, [])

  // Manejar click en lote (con datos en backend)
  const handleLoteClick = useCallback(async (loteId: string, loteInfo: LoteInfo) => {
    setIsLoadingLote(true)
    setIsModalOpen(true)

    try {
      const filters = lotificacionId ? { lotificacion: lotificacionId } : undefined
      const lotesData = await lotesService.getLotes(filters)
      const lote = lotesData.find(
        (l) => 
          String(l.manzana).padStart(2, '0') === loteId.split('-')[0].replace('MZ', '') &&
          String(l.numero_lote).padStart(2, '0') === loteId.split('-')[1].replace('L', '')
      )

      if (lote) {
        const fullLote = await lotesService.getLote(lote.id)
        setSelectedLote(fullLote)
      } else {
        // Si no se encuentra, crear un objeto básico
        setSelectedLote({
          id: 0,
          manzana: loteInfo.manzanaId,
          numero_lote: loteInfo.numero,
          metros_cuadrados: loteInfo.area?.toString() || '0',
          valor_total: loteInfo.precio?.toString() || '0',
          saldo_financiar: '0',
          enganche: '0',
          costo_instalacion: '0',
          plazo_meses: 0,
          cuota_mensual: '0',
          estado: loteInfo.estado,
          created_at: '',
          updated_at: '',
        } as Lote)
      }

      if (onLoteClick) {
        onLoteClick(loteId)
      }
    } catch (error) {
      console.error("Error cargando información del lote:", error)
    } finally {
      setIsLoadingLote(false)
    }
  }, [onLoteClick, lotificacionId])

  // Event delegation: un solo listener en el SVG
  const handleSVGEvent = useCallback((e: MouseEvent) => {
    if (!svgElementRef.current) return

    const target = (e.target as Element).closest('path, polygon, rect, circle, ellipse') as SVGElement
    if (!target) return

    const loteId = target.getAttribute('data-lote-id') || target.id
    if (!loteId) return

    const loteInfo = lotes.get(loteId)

    if (e.type === 'mouseenter' || e.type === 'mouseover') {
      if (!loteInfo) return
      setHoveredLoteId(loteId)
      target.classList.add('is-hover')
      target.setAttribute('stroke-width', '3')
      target.setAttribute('stroke', '#000')
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        content: {
          id: loteId,
          estado: ESTADO_LABELS[loteInfo.estado] || loteInfo.estado.toUpperCase(),
        },
      })
    } else if (e.type === 'mouseleave' || e.type === 'mouseout') {
      if (!loteInfo) return
      setHoveredLoteId(null)
      target.classList.remove('is-hover')
      const color = ESTADO_COLORS[loteInfo.estado] || ESTADO_COLORS.disponible
      target.setAttribute('stroke-width', '2')
      target.setAttribute('stroke', color)
      setTooltip({ visible: false, x: 0, y: 0, content: null })
    } else if (e.type === 'click') {
      if (loteInfo) {
        handleLoteClick(loteId, loteInfo)
      } else {
        handleLoteClickSinInfo(loteId)
      }
    }
  }, [lotes, handleLoteClick, handleLoteClickSinInfo])

  // Aplicar filtro de manzana usando clases CSS
  useEffect(() => {
    if (!svgElementRef.current) return

    const svgElement = svgElementRef.current
    const allLoteElements = svgElement.querySelectorAll('.lote-interactivo')

    allLoteElements.forEach((el) => {
      const element = el as SVGElement
      const manzanaId = element.getAttribute('data-manzana-id')
      
      if (selectedManzana === 'all') {
        element.classList.remove('lote-filtered-out')
        element.setAttribute('opacity', '1')
      } else {
        if (manzanaId === selectedManzana) {
          element.classList.remove('lote-filtered-out')
          element.setAttribute('opacity', '1')
        } else {
          element.classList.add('lote-filtered-out')
          element.setAttribute('opacity', '0.2')
        }
      }
    })
  }, [selectedManzana, lotes])

  // Configurar event delegation cuando el SVG esté montado
  useEffect(() => {
    const svgElement = svgElementRef.current
    if (!svgElement || lotes.size === 0) return

    // Un solo listener para todos los eventos usando event delegation
    const handleMouseEnter = (e: MouseEvent) => handleSVGEvent(e)
    const handleMouseLeave = (e: MouseEvent) => handleSVGEvent(e)
    const handleClick = (e: MouseEvent) => handleSVGEvent(e)

    svgElement.addEventListener('mouseenter', handleMouseEnter, true)
    svgElement.addEventListener('mouseleave', handleMouseLeave, true)
    svgElement.addEventListener('click', handleClick)

    return () => {
      svgElement.removeEventListener('mouseenter', handleMouseEnter, true)
      svgElement.removeEventListener('mouseleave', handleMouseLeave, true)
      svgElement.removeEventListener('click', handleClick)
    }
  }, [handleSVGEvent, lotes.size])

  // Zoom in
  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 5),
    }))
  }

  // Zoom out
  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.5),
    }))
  }

  // Reset zoom y pan
  const handleReset = () => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }

  // Manejar inicio de pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Botón izquierdo
      setIsPanning(true)
      setIsDragging(false)
      setPanStart({
        x: e.clientX - transform.x,
        y: e.clientY - transform.y,
      })
    }
  }

  // Manejar movimiento durante pan
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsDragging(true)
      setTransform({
        ...transform,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }

  // Manejar fin de pan
  const handleMouseUp = () => {
    setIsPanning(false)
    setIsDragging(false)
  }

  // Manejar zoom con rueda del mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.5, Math.min(5, transform.scale * delta))
    
    // Zoom hacia el punto del mouse
    const rect = svgContainerRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const scaleChange = newScale / transform.scale
      setTransform({
        scale: newScale,
        x: mouseX - (mouseX - transform.x) * scaleChange,
        y: mouseY - (mouseY - transform.y) * scaleChange,
      })
    }
  }

  // Índice de manzanas con IDs correctos para el filtro
  const manzanasWithIds = useMemo(() => {
    const manzanasMap = new Map<string, { name: string; id: number }>()
    lotes.forEach((lote) => {
      if (!manzanasMap.has(lote.manzana)) {
        manzanasMap.set(lote.manzana, {
          name: lote.manzana,
          id: lote.manzanaId,
        })
      }
    })
    return Array.from(manzanasMap.values()).sort((a, b) => a.id - b.id)
  }, [lotes])

  if (!svg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plano Interactivo de Lotificación</CardTitle>
          <CardDescription>
            Carga un archivo SVG para visualizar los lotes de forma interactiva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay SVG cargado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Plano Interactivo de Lotificación</CardTitle>
              <CardDescription>
                Haz clic en un lote para ver su información detallada
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Filtro por manzana */}
              {manzanasWithIds.length > 0 && (
                <Select value={selectedManzana} onValueChange={setSelectedManzana}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por manzana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las manzanas</SelectItem>
                    {manzanasWithIds.map((manzana) => (
                      <SelectItem key={manzana.id} value={String(manzana.id)}>
                        {manzana.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                title="Acercar"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                title="Alejar"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                title="Restablecer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                title="Pantalla completa"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={svgContainerRef}
            className="relative border rounded-lg overflow-hidden bg-gray-50"
            style={{
              cursor: isPanning ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div
              className="w-full h-full"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            
            {/* Leyenda de estados */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
              <div className="text-xs font-semibold mb-2">Estados:</div>
              <div className="space-y-1">
                {Object.entries(ESTADO_COLORS).map(([estado, color]) => (
                  <div key={estado} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color, opacity: 0.6 }}
                    />
                    <span>{ESTADO_LABELS[estado]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tooltip flotante */}
      {tooltip.visible && tooltip.content && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 10}px`,
          }}
        >
          <div className="font-semibold">{tooltip.content.id}</div>
          <div className="text-gray-300">{tooltip.content.estado}</div>
        </div>
      )}

      {/* Modal con información del lote */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLote
                ? `Lote ${selectedLote.manzana_nombre || `Manzana ${selectedLote.manzana}`} - ${selectedLote.numero_lote}`
                : "Información del Lote"}
            </DialogTitle>
            <DialogDescription>
              Detalles completos del lote seleccionado
            </DialogDescription>
          </DialogHeader>

          {isLoadingLote ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedLote && selectedLote.id === 0 ? (
            <div className="space-y-4 py-4">
              <p className="text-center text-muted-foreground">
                No hay información acerca de este lote
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Manzana {selectedLote.manzana} – Lote {selectedLote.numero_lote}
              </p>
              {onCrearLoteManual && (
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={() => {
                      const loteId = `MZ${String(selectedLote.manzana).padStart(2, '0')}-L${String(selectedLote.numero_lote).padStart(2, '0')}`
                      onCrearLoteManual({
                        manzana: selectedLote.manzana,
                        numero_lote: selectedLote.numero_lote,
                        loteId,
                      })
                      setIsModalOpen(false)
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Crear información del lote manualmente
                  </Button>
                </div>
              )}
            </div>
          ) : selectedLote ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Manzana</div>
                  <div className="text-lg font-semibold">
                    {selectedLote.manzana_nombre || `Manzana ${selectedLote.manzana}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Número de Lote</div>
                  <div className="text-lg font-semibold">{selectedLote.numero_lote}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Estado</div>
                  <Badge
                    variant={
                      selectedLote.estado === 'disponible'
                        ? 'default'
                        : selectedLote.estado === 'reservado'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {ESTADO_LABELS[selectedLote.estado] || selectedLote.estado.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Área</div>
                  <div className="text-lg font-semibold">
                    {parseFloat(selectedLote.metros_cuadrados).toLocaleString()} m²
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Valor Total</div>
                  <div className="text-lg font-semibold">
                    Q {parseFloat(selectedLote.valor_total).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Enganche</div>
                  <div className="text-lg font-semibold">
                    Q {parseFloat(selectedLote.enganche).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Saldo a Financiar</div>
                  <div className="text-lg font-semibold">
                    Q {parseFloat(selectedLote.saldo_financiar).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Costo de Instalación</div>
                  <div className="text-lg font-semibold">
                    Q {parseFloat(selectedLote.costo_instalacion).toLocaleString()}
                  </div>
                </div>
                {selectedLote.plazo_meses > 0 && (
                  <>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Plazo</div>
                      <div className="text-lg font-semibold">{selectedLote.plazo_meses} meses</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Cuota Mensual</div>
                      <div className="text-lg font-semibold">
                        Q {parseFloat(selectedLote.cuota_mensual).toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No se pudo cargar la información del lote
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog fullscreen */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Plano Interactivo - Vista Completa</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6">
            <div className="relative w-full h-full border rounded-lg overflow-hidden bg-gray-50">
              <div
                ref={svgContainerRef}
                className="w-full h-full"
                style={{
                  cursor: isPanning ? 'grabbing' : 'grab',
                  touchAction: 'none',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <div
                  style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: '0 0',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
              
              {/* Controles en fullscreen */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  )
}
