"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Pencil, ShoppingCart, Unlink, Check, ChevronsUpDown, FileText } from "lucide-react"
import {
  lotificacionService,
  type Lotificacion,
  type LotePlanoItem,
  type LoteDetallePlano,
  type LoteSinIdentificadorItem,
} from "@/lib/lotificacion-service"
import { lotesService, type USO_LOTE, type ESTADO_DISPONIBILIDAD } from "@/lib/lotes-service"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

const MIN_SCALE = 0.3
const MAX_SCALE = 4
const ZOOM_STEP = 1.25

/** Colores por estado: Verde, Amarillo, Morado, Azul, Rojo (en ese orden). */
const ESTADO_COLOR: Record<string, string> = {
  disponible: "#22c55e",           // Verde
  reservado: "#eab308",           // Amarillo
  pagado: "#8b5cf6",              // Morado
  financiado: "#3b82f6",          // Azul
  escriturado: "#ef4444",         // Rojo
}

const ESTADO_LABEL: Record<string, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  pagado: "Pagado",
  financiado: "Financiado",
  escriturado: "Escriturado",
}

const DEFAULT_FILL = "#94a3b8"

/**
 * Normaliza una manzana y número de lote para crear una clave hash.
 */
export function buildKey(manzana: string | undefined | null, numero: string | undefined | null): string {
  const m = (manzana || "").trim().toUpperCase()
  const n = (numero || "").trim().replace(/^0+/, "") || "0"
  return `${m}:${n}`
}

/** Parsea el identificador del plano a manzana y número de lote. */
function parseIdentificadorPlano(
  identificador: string | null
): { manzanaNombre: string; numeroLote: string } | null {
  if (!identificador?.trim()) return null
  const id = identificador.trim()
  const mzMatch = /^MZ(.+)-L(.+)$/i.exec(id)
  if (mzMatch) return { manzanaNombre: mzMatch[1].trim(), numeroLote: mzMatch[2].trim() }
  const simpleMatch = /^(.+)-(.+)$/.exec(id)
  if (simpleMatch) return { manzanaNombre: simpleMatch[1].trim(), numeroLote: simpleMatch[2].trim() }
  return null
}

interface PlanoInteractivoProps {
  lotificacionId: number
  className?: string
}

export function PlanoInteractivo({ lotificacionId, className }: PlanoInteractivoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lotificacionActual, setLotificacionActual] = useState<Lotificacion | null>(null)
  const [svgText, setSvgText] = useState<string | null>(null)
  const [lotesList, setLotesList] = useState<LotePlanoItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLote, setModalLote] = useState<LoteDetallePlano | null>(null)
  const [modalIdentificador, setModalIdentificador] = useState<string | null>(null)
  const [loadingLote, setLoadingLote] = useState(false)
  const [relateModalOpen, setRelateModalOpen] = useState(false)
  const [relateLoading, setRelateLoading] = useState(false)
  const [relateSubmitting, setRelateSubmitting] = useState(false)
  const [relateError, setRelateError] = useState<string | null>(null)
  const [relateOptions, setRelateOptions] = useState<any[]>([])
  const [relateSelectedId, setRelateSelectedId] = useState<string>("")
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [desvincularLoading, setDesvincularLoading] = useState(false)
  const [vinculadosIds, setVinculadosIds] = useState<Set<number>>(new Set())
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [desvincularTodosModalOpen, setDesvincularTodosModalOpen] = useState(false)
  const [desvincularTodosSubmitting, setDesvincularTodosSubmitting] = useState(false)
  const didPanRef = useRef(false)

  // Cargar SVG y listado de lotes en paralelo
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setSvgText(null)
    setLotesList([])

    Promise.all([
      lotificacionService.getLotificacion(lotificacionId),
      lotificacionService.getPlanoSvg(lotificacionId),
      lotificacionService.getLotesPlano(lotificacionId),
    ])
      .then(([lotificacion, svg, lotes]) => {
        if (!cancelled) {
          setLotificacionActual(lotificacion)
          setSvgText(svg)
          setLotesList(lotes)
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || "Error al cargar el plano o los lotes.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lotificacionId])

  // Efectos eliminados para registerModalOpen

  // Efectos eliminados para editModalOpen

  // Hashmap O(1) construido a partir de lotesList
  const mapLotesByKey = useMemo(() => {
    const map = new Map<string, LotePlanoItem>()
    lotesList.forEach((l) => {
      if (l.manzana_nombre && l.numero_lote) {
        map.set(buildKey(l.manzana_nombre, l.numero_lote), l)
      }
      if (l.plano_svg_id) {
        map.set(l.plano_svg_id.toUpperCase(), l)
      } else if (l.identificador) {
        map.set(l.identificador.toUpperCase(), l) 
      }
    })
    return map
  }, [lotesList])

  // Insertar SVG en el DOM y pintar por disponibilidad
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
    const cleanup: Array<() => void> = []
    const nuevosVinculados = new Set<number>()

    paths.forEach((path) => {
      const id = path.getAttribute("id")
      if (!id) return

      let loteEncontrado = mapLotesByKey.get(id.toUpperCase())

      if (loteEncontrado) {
        nuevosVinculados.add(loteEncontrado.id)
      }
      
      const disponibilidad = loteEncontrado ? loteEncontrado.estado_disponibilidad : null
      const fill = disponibilidad ? ESTADO_COLOR[disponibilidad] ?? DEFAULT_FILL : DEFAULT_FILL
      path.setAttribute("fill", fill)
      path.style.cursor = "pointer"
      path.style.transition = "opacity 0.15s ease"

      const onEnter = () => { path.style.opacity = "0.8" }
      const onLeave = () => { path.style.opacity = "1" }
      const onClick = () => {
        if (didPanRef.current) {
          didPanRef.current = false
          return
        }
        setModalIdentificador(id)
        setLoadingLote(true)
        setModalOpen(true)
        setModalLote(null)
        
        if (loteEncontrado) {
           lotesService.getLote(loteEncontrado.id)
             .then((data) => setModalLote(data as any as LoteDetallePlano))
             .catch(() => setModalLote(null))
             .finally(() => setLoadingLote(false))
        } else {
           setModalLote(null)
           setLoadingLote(false)
        }
      }

      path.addEventListener("mouseenter", onEnter)
      path.addEventListener("mouseleave", onLeave)
      path.addEventListener("click", onClick)
      cleanup.push(() => {
        path.removeEventListener("mouseenter", onEnter)
        path.removeEventListener("mouseleave", onLeave)
        path.removeEventListener("click", onClick)
      })
    })

    setVinculadosIds(nuevosVinculados)

    return () => {
      cleanup.forEach((fn) => fn())
      container.innerHTML = ""
    }
  }, [svgText, lotesList, mapLotesByKey])

  const viewportRef = useRef<HTMLDivElement>(null)

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
    didPanRef.current = true
    setTransform({ ...transform, x: e.clientX - panStart.x, y: e.clientY - panStart.y })
  }, [isPanning, transform, panStart])
  
  const handleMouseUp = useCallback(() => { setIsPanning(false) }, [])
  
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP
    
    setTransform((prevTransform) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prevTransform.scale * delta))
      const rect = viewportRef.current?.getBoundingClientRect()
      if (rect) {
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const scaleChange = newScale / prevTransform.scale
        return {
          scale: newScale,
          x: mx - (mx - prevTransform.x) * scaleChange,
          y: my - (my - prevTransform.y) * scaleChange,
        }
      }
      return { ...prevTransform, scale: newScale }
    })
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  const formatMoney = (v: string | number) => `Q ${parseFloat(String(v)).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
  const formatDecimal = (v: string | number) => parseFloat(String(v)).toLocaleString("es-GT", { minimumFractionDigits: 2 })

  const Row = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between border-b py-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => setDesvincularTodosModalOpen(true)}
        >
          <Unlink className="h-4 w-4 mr-2" />
          Desvincular todos los lotes
        </Button>
      </div>
      <div
        ref={viewportRef}
        className={cn(
          "relative w-full min-h-[450px] overflow-hidden rounded-lg border bg-muted/20 shadow-inner",
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalLote ? `Lote ${modalLote.identificador ?? modalLote.numero_lote}` : "Detalle del Lote"}
            </DialogTitle>
            <DialogDescription className="hidden">
              Detalles y opciones para el lote seleccionado.
            </DialogDescription>
          </DialogHeader>
          {loadingLote ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : modalLote ? (
            <div className="space-y-6">
              <div className="grid gap-2">
                <Row label="Identificador" value={modalLote.identificador ?? "No asignado"} />
                <Row label="Manzana" value={modalLote.manzana_nombre ?? modalLote.manzana} />
                <Row label="Lote" value={modalLote.numero_lote} />
                <Row label="Uso" value={modalLote.uso_lote?.replace(/_/g, ' ') || "—"} />
                <Row label="Estado" value={ESTADO_LABEL[modalLote.estado_disponibilidad] || modalLote.estado_disponibilidad} />
                <Row label="Área" value={`${formatDecimal(modalLote.metros_cuadrados)} m²`} />
                <Row label="Valor" value={formatMoney(modalLote.valor_total)} />
                <Row label="Instalación" value={formatMoney(modalLote.costo_instalacion)} />
              </div>
              <div className="flex gap-2 pt-2">
                {modalLote.estado_disponibilidad === 'disponible' && (
                  <>
                    <Button size="sm" onClick={() => window.location.href = `/venta/registrar/${modalLote.id}`}>
                      <ShoppingCart className="h-4 w-4 mr-2" /> Vender Lote
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.location.href = `/cotizaciones/registrar/${modalLote.id}`}>
                      <FileText className="h-4 w-4 mr-2" /> Cotizar Lote
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={async () => {
                  setDesvincularLoading(true);
                  try {
                    await lotificacionService.desvincularLote(lotificacionId, modalLote.id!);
                    const list = await lotificacionService.getLotesPlano(lotificacionId);
                    setLotesList(list);
                    setModalOpen(false);
                  } finally { setDesvincularLoading(false); }
                }}>
                  <Unlink className="h-4 w-4 mr-2" /> Desvincular
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Este espacio no tiene información asociada en el sistema.</p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={async () => {
                  setRelateLoading(true);
                  try {
                    const data = await lotesService.getLotes({ lotificacion: lotificacionId });
                    setRelateOptions(data.results.filter(l => !vinculadosIds.has(l.id)));
                    setRelateModalOpen(true);
                    setModalOpen(false);
                  } finally { setRelateLoading(false); }
                }}>Relacionar con existente</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      
      {/* Relate Modal */}
      <Dialog open={relateModalOpen} onOpenChange={setRelateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Relacionar Lote</DialogTitle>
            <DialogDescription className="hidden">Seleccione un lote existente para vincularlo al plano</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <Label>Seleccionar un lote disponible</Label>
             <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {relateSelectedId ? relateOptions.find(o => String(o.id) === relateSelectedId)?.identificador || "Relacionar..." : "Seleccionar..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron lotes.</CommandEmpty>
                      <CommandGroup>
                        {relateOptions.map(l => (
                          <CommandItem key={l.id} value={l.identificador || String(l.id)} onSelect={() => { setRelateSelectedId(String(l.id)); setComboboxOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", relateSelectedId === String(l.id) ? "opacity-100" : "opacity-0")} />
                            {l.identificador} ({l.manzana_nombre} - {l.numero_lote})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
             </Popover>
          </div>
          {relateError && <p className="text-xs text-destructive">{relateError}</p>}
          <DialogFooter>
            <Button onClick={async () => {
              if (!relateSelectedId) return;
              setRelateSubmitting(true);
              try {
                await lotificacionService.relacionarLoteExistente(lotificacionId, { 
                  lote_id: parseInt(relateSelectedId), 
                  identificador: modalIdentificador || "" 
                });
                const list = await lotificacionService.getLotesPlano(lotificacionId);
                setLotesList(list);
                setRelateModalOpen(false);
              } catch (err: any) { setRelateError(err.message); } finally { setRelateSubmitting(false); }
            }} disabled={relateSubmitting}>Relacionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Desvincular Todos */}
      <Dialog open={desvincularTodosModalOpen} onOpenChange={setDesvincularTodosModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Desvincular Todos los Lotes
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea desvincular todos los lotes del plano actual? 
              Los lotes perderán su color en el plano y deberá volver a relacionarlos manualmente. 
              Esta acción no elimina los lotes de la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesvincularTodosModalOpen(false)} disabled={desvincularTodosSubmitting}>Cancelar</Button>
            <Button variant="destructive" disabled={desvincularTodosSubmitting} onClick={async () => {
              setDesvincularTodosSubmitting(true);
              try {
                await lotificacionService.desvincularTodosLotes(lotificacionId);
                const list = await lotificacionService.getLotesPlano(lotificacionId);
                setLotesList(list);
                setDesvincularTodosModalOpen(false);
              } catch (err) {
                console.error("Error desvinculando todos los lotes", err);
              } finally {
                setDesvincularTodosSubmitting(false);
              }
            }}>
              {desvincularTodosSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desvincular Todos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
