"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from "lucide-react"
import { lotificacionService } from "@/lib/lotificacion-service"
import { cn } from "@/lib/utils"

interface ViewOnlyPlanoProps {
  lotificacionId: number
  highlightLoteId: string | undefined | null
  className?: string
}

const MIN_SCALE = 0.3
const MAX_SCALE = 4
const ZOOM_STEP = 1.25

export function ViewOnlyPlano({ lotificacionId, highlightLoteId, className }: ViewOnlyPlanoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [svgText, setSvgText] = useState<string | null>(null)
  
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    lotificacionService.getPlanoSvg(lotificacionId)
      .then((svg) => {
        if (!cancelled) setSvgText(svg)
      })
      .catch((err) => {
        console.error('Error load plano:', err)
        if (!cancelled) setSvgText(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [lotificacionId])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !svgText) return

    const parser = new DOMParser()
    const doc = parser.parseFromString(svgText, "image/svg+xml")
    const svgEl = doc.querySelector("svg")
    if (!svgEl) return

    svgEl.setAttribute("width", "100%")
    svgEl.setAttribute("height", "100%")
    
    container.innerHTML = ""
    container.appendChild(svgEl)

    const paths = container.querySelectorAll<SVGPathElement>("path[id]")
    
    let targetPath: SVGPathElement | null = null

    paths.forEach((path) => {
      const id = path.getAttribute("id")
      if (!id) return

      let isHighlighted = false
      if (highlightLoteId) {
        if (id.toUpperCase() === highlightLoteId.toUpperCase()) {
            isHighlighted = true
        } else {
            const ht = highlightLoteId.toUpperCase().replace(/-/g, '')
            if (ht === id.toUpperCase().replace(/-/g, '')) {
                isHighlighted = true
            }
        }
      }

      if (isHighlighted) {
          targetPath = path
          path.setAttribute("fill", "#4ade80") // verde claro mas fuerte
          path.setAttribute("stroke", "#16a34a")
          path.setAttribute("stroke-width", "2")
      } else {
          path.setAttribute("fill", "transparent")
          path.setAttribute("stroke", "#94a3b8")
          path.setAttribute("stroke-width", "1")
      }
    })

    if (targetPath) {
      // Auto center zoom
      const bbox = (targetPath as SVGElement).getBoundingClientRect()
      if (bbox.width > 0 && bbox.height > 0) {
          // Centering logic could be tricky with original SVG coords vs bounding rect
          // Let's just leave it neutral for now, or just trust the user panning
      }
    }

    return () => {
      container.innerHTML = ""
    }
  }, [svgText, highlightLoteId])

  const zoomIn = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.min(MAX_SCALE, t.scale * ZOOM_STEP) }))
  }, [])
  const zoomOut = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.max(MIN_SCALE, t.scale / ZOOM_STEP) }))
  }, [])
  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
  }, [transform.x, transform.y])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setTransform({ ...transform, x: e.clientX - panStart.x, y: e.clientY - panStart.y })
  }, [isPanning, transform, panStart])
  
  const handleMouseUp = useCallback(() => { setIsPanning(false) }, [])
  
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale * delta))
    const rect = viewportRef.current?.getBoundingClientRect()
    if (rect) {
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const scaleChange = newScale / transform.scale
      setTransform({
        scale: newScale,
        x: mx - (mx - transform.x) * scaleChange,
        y: my - (my - transform.y) * scaleChange,
      })
    } else {
      setTransform((t) => ({ ...t, scale: newScale }))
    }
  }, [transform])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const wheelHandler = (e: WheelEvent) => {
      handleWheel(e)
    }

    viewport.addEventListener("wheel", wheelHandler, { passive: false })
    return () => viewport.removeEventListener("wheel", wheelHandler)
  }, [handleWheel])

  if (loading) {
     return <div className="flex h-full w-full items-center justify-center bg-white rounded-lg border shadow-inner"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (!svgText) {
     return <div className="flex h-full w-full items-center justify-center bg-white rounded-lg border shadow-inner"><p className="text-muted-foreground font-medium text-sm">No se puede mostrar en plano SVG</p></div>
  }

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative w-full h-full min-h-[300px] overflow-hidden rounded-lg border bg-white shadow-inner",
        isPanning ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={containerRef}
        className="inline-block origin-top-left [&_svg]:block [&_svg]:max-w-none transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      />
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 shadow-lg rounded-lg p-2 bg-background/95 border backdrop-blur">
        <Button variant="outline" size="icon" onClick={zoomIn} title="Acercar"><ZoomIn className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={zoomOut} title="Alejar"><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={resetView} title="Restablecer"><RotateCcw className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}
