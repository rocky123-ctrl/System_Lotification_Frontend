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
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Pencil, ShoppingCart, Unlink, Check, ChevronsUpDown } from "lucide-react"
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
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [registerSubmitting, setRegisterSubmitting] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registerIdentificadorManual, setRegisterIdentificadorManual] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    identificador: "",
    metros_cuadrados: "",
    valor_total: "",
    costo_instalacion: "5000",
    uso_lote: "residencial" as USO_LOTE,
    estado_disponibilidad: "disponible" as ESTADO_DISPONIBILIDAD,
  })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editIdentificadorManual, setEditIdentificadorManual] = useState(false)
  const [editForm, setEditForm] = useState({
    identificador: "",
    metros_cuadrados: "",
    valor_total: "",
    costo_instalacion: "",
    uso_lote: "residencial" as USO_LOTE,
    estado_disponibilidad: "disponible" as ESTADO_DISPONIBILIDAD,
  })
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

  useEffect(() => {
    if (registerModalOpen && modalIdentificador && !registerIdentificadorManual) {
      const parsed = parseIdentificadorPlano(modalIdentificador)
      if (parsed && lotificacionActual) {
        const abrev = lotificacionActual.nombre.substring(0, 3).toUpperCase()
        setRegisterForm(f => ({ ...f, identificador: `${abrev}-${parsed.manzanaNombre}-${parsed.numeroLote}`.toUpperCase() }))
      } else {
        setRegisterForm(f => ({ ...f, identificador: modalIdentificador }))
      }
    }
  }, [registerModalOpen, modalIdentificador, registerIdentificadorManual, lotificacionActual])

  useEffect(() => {
    if (editModalOpen && modalLote && !editIdentificadorManual) {
      setEditForm(f => ({ 
        ...f, 
        identificador: modalLote.identificador ?? "",
        metros_cuadrados: String(modalLote.metros_cuadrados ?? ""),
        valor_total: String(modalLote.valor_total ?? ""),
        costo_instalacion: String(modalLote.costo_instalacion ?? ""),
        uso_lote: modalLote.uso_lote as USO_LOTE,
        estado_disponibilidad: modalLote.estado_disponibilidad as ESTADO_DISPONIBILIDAD,
      }))
    }
  }, [editModalOpen, modalLote, editIdentificadorManual])

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
      
      if (!loteEncontrado) {
        const parsed = parseIdentificadorPlano(id)
        if (parsed) {
          const key = buildKey(parsed.manzanaNombre, parsed.numeroLote)
          const loteCandidato = mapLotesByKey.get(key)
          if (loteCandidato && !loteCandidato.plano_svg_id) {
             loteEncontrado = loteCandidato
          }
        }
      }

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
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
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

  const formatMoney = (v: string | number) => `Q ${parseFloat(String(v)).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
  const formatDecimal = (v: string | number) => parseFloat(String(v)).toLocaleString("es-GT", { minimumFractionDigits: 2 })

  const Row = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between border-b py-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )

  return (
    <>
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
        onWheel={handleWheel}
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
                <Button variant="outline" size="sm" onClick={() => { setEditIdentificadorManual(false); setEditModalOpen(true); setModalOpen(false); }}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Button>
                {modalLote.estado_disponibilidad === 'disponible' && (
                  <Button size="sm" onClick={() => window.location.href = `/lotes?lotificacion=${lotificacionId}&vender=${modalLote.id}`}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> Vender
                  </Button>
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
                <Button onClick={() => { 
                  setRegisterForm(f => ({ ...f, identificador: modalIdentificador || "" }));
                  setRegisterModalOpen(true); 
                  setModalOpen(false); 
                }}>Registrar como nuevo</Button>
                <Button variant="outline" onClick={async () => {
                  setRelateLoading(true);
                  try {
                    const list = await lotesService.getLotes({ lotificacion: lotificacionId });
                    setRelateOptions(list.filter(l => !vinculadosIds.has(l.id)));
                    setRelateModalOpen(true);
                    setModalOpen(false);
                  } finally { setRelateLoading(false); }
                }}>Relacionar con existente</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Registro */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Lote</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            setRegisterSubmitting(true);
            try {
              const res = await lotificacionService.registrarLoteDesdePlano(lotificacionId, {
                identificador: registerForm.identificador,
                metros_cuadrados: parseFloat(registerForm.metros_cuadrados),
                valor_total: parseFloat(registerForm.valor_total),
                costo_instalacion: parseFloat(registerForm.costo_instalacion),
                uso_lote: registerForm.uso_lote,
                estado_disponibilidad: registerForm.estado_disponibilidad,
              });
              const list = await lotificacionService.getLotesPlano(lotificacionId);
              setLotesList(list);
              setModalLote(res);
              setRegisterModalOpen(false);
            } catch (err: any) { setRegisterError(err.message); } finally { setRegisterSubmitting(false); }
          }}>
            <div className="space-y-2">
              <Label>Identificador</Label>
              <Input value={registerForm.identificador} onChange={e => setRegisterForm(f => ({ ...f, identificador: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Metros²</Label><Input type="number" required value={registerForm.metros_cuadrados} onChange={e => setRegisterForm(f => ({ ...f, metros_cuadrados: e.target.value }))} /></div>
              <div><Label>Valor (Q)</Label><Input type="number" required value={registerForm.valor_total} onChange={e => setRegisterForm(f => ({ ...f, valor_total: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Uso</Label>
                <Select value={registerForm.uso_lote} onValueChange={v => setRegisterForm(f => ({ ...f, uso_lote: v as USO_LOTE }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="residencial">Residencial</SelectItem><SelectItem value="comercial_y_bodega">Comercial</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disponibilidad</Label>
                <Select value={registerForm.estado_disponibilidad} onValueChange={v => setRegisterForm(f => ({ ...f, estado_disponibilidad: v as ESTADO_DISPONIBILIDAD }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADO_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {registerError && <p className="text-xs text-destructive">{registerError}</p>}
            <DialogFooter><Button type="submit" disabled={registerSubmitting}>Registrar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Lote</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            if (!modalLote) return;
            setEditSubmitting(true);
            try {
              const res = await lotesService.updateLote(modalLote.id, {
                metros_cuadrados: editForm.metros_cuadrados,
                valor_total: editForm.valor_total,
                costo_instalacion: editForm.costo_instalacion,
                uso_lote: editForm.uso_lote,
                estado_disponibilidad: editForm.estado_disponibilidad,
                version: modalLote.version,
              });
              const list = await lotificacionService.getLotesPlano(lotificacionId);
              setLotesList(list);
              setEditModalOpen(false);
            } catch (err: any) { setEditError(err.message); } finally { setEditSubmitting(false); }
          }}>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Metros²</Label><Input type="number" required value={editForm.metros_cuadrados} onChange={e => setEditForm(f => ({ ...f, metros_cuadrados: e.target.value }))} /></div>
              <div><Label>Valor (Q)</Label><Input type="number" required value={editForm.valor_total} onChange={e => setEditForm(f => ({ ...f, valor_total: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Uso</Label>
                <Select value={editForm.uso_lote} onValueChange={v => setEditForm(f => ({ ...f, uso_lote: v as USO_LOTE }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="residencial">Residencial</SelectItem><SelectItem value="comercial_y_bodega">Comercial</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Disponibilidad</Label>
                <Select value={editForm.estado_disponibilidad} onValueChange={v => setEditForm(f => ({ ...f, estado_disponibilidad: v as ESTADO_DISPONIBILIDAD }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADO_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editError && <p className="text-xs text-destructive">{editError}</p>}
            <DialogFooter><Button type="submit" disabled={editSubmitting}>Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Relate Modal */}
      <Dialog open={relateModalOpen} onOpenChange={setRelateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Relacionar Lote</DialogTitle></DialogHeader>
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
    </>
  )
}
