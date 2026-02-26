"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Pencil, ShoppingCart } from "lucide-react"
import { lotificacionService, type LotePlanoItem, type LoteDetallePlano } from "@/lib/lotificacion-service"
import { lotesService } from "@/lib/lotes-service"
import { cn } from "@/lib/utils"

const MIN_SCALE = 0.3
const MAX_SCALE = 4
const ZOOM_STEP = 1.25

/** Colores por estado: Verde, Amarillo, Morado, Marrón, Azul, Rojo (en ese orden). */
const ESTADO_COLOR: Record<string, string> = {
  disponible: "#22c55e",           // Verde
  reservado: "#eab308",           // Amarillo
  pagado: "#8b5cf6",              // Morado
  comercial_y_bodega: "#92400e",   // Marrón
  financiado: "#3b82f6",          // Azul
  pagado_y_escriturado: "#ef4444", // Rojo
}

const ESTADO_LABEL: Record<string, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  pagado: "Pagado",
  comercial_y_bodega: "Comercial y Bodega",
  financiado: "Financiado",
  pagado_y_escriturado: "Pagado y Escriturado",
}

const DEFAULT_FILL = "#94a3b8"

interface PlanoInteractivoProps {
  lotificacionId: number
  className?: string
}

export function PlanoInteractivo({ lotificacionId, className }: PlanoInteractivoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [svgText, setSvgText] = useState<string | null>(null)
  const [lotesList, setLotesList] = useState<LotePlanoItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLote, setModalLote] = useState<LoteDetallePlano | null>(null)
  const [modalIdentificador, setModalIdentificador] = useState<string | null>(null)
  const [loadingLote, setLoadingLote] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [registerSubmitting, setRegisterSubmitting] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registerForm, setRegisterForm] = useState({
    metros_cuadrados: "",
    valor_total: "",
    costo_instalacion: "5000",
    estado: "disponible",
  })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    metros_cuadrados: "",
    valor_total: "",
    costo_instalacion: "",
    estado: "disponible",
  })
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
      lotificacionService.getPlanoSvg(lotificacionId),
      lotificacionService.getLotesPlano(lotificacionId),
    ])
      .then(([svg, lotes]) => {
        if (!cancelled) {
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

  // Insertar SVG en el DOM (sin dangerouslySetInnerHTML), pintar por estado y asignar eventos
  useEffect(() => {
    const container = containerRef.current
    if (!container || !svgText) return

    const parser = new DOMParser()
    const doc = parser.parseFromString(svgText, "image/svg+xml")
    const svgEl = doc.querySelector("svg")
    if (!svgEl) return

    // Asegurar que el SVG sea responsive
    svgEl.setAttribute("width", "100%")
    svgEl.setAttribute("height", "100%")
    if (!svgEl.getAttribute("viewBox") && svgEl.getAttribute("width") && svgEl.getAttribute("height")) {
      const w = svgEl.getAttribute("width")
      const h = svgEl.getAttribute("height")
      if (w && h && !w.includes("%") && !h.includes("%")) {
        svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`)
      }
    }

    const mapIdentificadorEstado = new Map<string, string>()
    lotesList.forEach((l) => {
      if (l.identificador) {
        mapIdentificadorEstado.set(l.identificador, l.estado)
      }
    })

    container.innerHTML = ""
    container.appendChild(svgEl)

    const paths = container.querySelectorAll<SVGPathElement>("path[id]")
    const cleanup: Array<() => void> = []

    paths.forEach((path) => {
      const id = path.getAttribute("id")
      if (!id) return

      const estado = mapIdentificadorEstado.get(id)
      const fill = estado ? ESTADO_COLOR[estado] ?? DEFAULT_FILL : DEFAULT_FILL
      path.setAttribute("fill", fill)
      path.style.cursor = "pointer"
      path.style.transition = "opacity 0.15s ease"

      const onEnter = () => {
        path.style.opacity = "0.8"
      }
      const onLeave = () => {
        path.style.opacity = "1"
      }
      const onClick = () => {
        if (didPanRef.current) {
          didPanRef.current = false
          return
        }
        setModalIdentificador(id)
        setLoadingLote(true)
        setModalOpen(true)
        setModalLote(null)
        lotificacionService
          .getLotePorIdentificador(lotificacionId, id)
          .then((data) => setModalLote(data))
          .catch(() => setModalLote(null))
          .finally(() => setLoadingLote(false))
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

    return () => {
      cleanup.forEach((fn) => fn())
      container.innerHTML = ""
    }
  }, [svgText, lotesList, lotificacionId])

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      setIsPanning(true)
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
    },
    [transform.x, transform.y]
  )
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return
      didPanRef.current = true
      setTransform({ ...transform, x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    },
    [isPanning, transform, panStart]
  )
  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
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
    },
    [transform]
  )

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center min-h-[320px] bg-muted/30 rounded-lg", className)}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Cargando plano...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center min-h-[320px] bg-destructive/10 rounded-lg", className)}>
        <div className="flex flex-col items-center gap-2 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        ref={viewportRef}
        className={cn(
          "relative w-full min-h-[320px] overflow-hidden rounded-lg border bg-muted/20",
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
          className="inline-block origin-top-left [&_svg]:block [&_svg]:max-w-none"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transition: isPanning ? "none" : "transform 0.1s ease-out",
          }}
        />
        <div className="absolute top-2 right-2 flex gap-1 shadow-md rounded-md overflow-hidden bg-background/95 border">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-none border-0"
            onClick={zoomIn}
            title="Acercar"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-none border-0 border-l"
            onClick={zoomOut}
            title="Alejar"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-none border-0 border-l"
            onClick={resetView}
            title="Restablecer vista"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalLote
                ? `Lote ${modalLote.identificador ?? modalLote.numero_lote}`
                : "Información del lote"}
            </DialogTitle>
            <DialogDescription>Detalle del lote seleccionado en el plano</DialogDescription>
          </DialogHeader>
          {loadingLote ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : modalLote ? (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <Row label="Identificador" value={modalLote.identificador ?? "—"} />
                <Row label="Manzana" value={modalLote.manzana_nombre ?? `Manzana ${modalLote.manzana}`} />
                <Row label="Número de lote" value={modalLote.numero_lote} />
                <Row label="Estado" value={ESTADO_LABEL[modalLote.estado] ?? modalLote.estado} />
                <Row label="Metros cuadrados" value={formatDecimal(modalLote.metros_cuadrados)} />
                <Row label="Valor total" value={formatMoney(modalLote.valor_total)} />
                <Row label="Costo instalación" value={formatMoney(modalLote.costo_instalacion)} />
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditForm({
                      metros_cuadrados: String(modalLote.metros_cuadrados ?? ""),
                      valor_total: String(modalLote.valor_total ?? ""),
                      costo_instalacion: String(modalLote.costo_instalacion ?? ""),
                      estado: modalLote.estado || "disponible",
                    })
                    setEditError(null)
                    setEditModalOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                {modalLote.estado === "disponible" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      // Navegar a venta o abrir flujo de venta (placeholder)
                      window.location.href = `/lotes?lotificacion=${lotificacionId}&vender=${modalLote.id}` 
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Vender este lote
                  </Button>
                )}
              </div>
            </div>
          ) : modalIdentificador ? (
            <div className="space-y-4 py-2">
              <p className="text-muted-foreground">
                No hay información almacenada en la base de datos para este lote en el plano.
              </p>
              <Button
                type="button"
                onClick={() => {
                  setRegisterForm({
                    metros_cuadrados: "",
                    valor_total: "",
                    costo_instalacion: "5000",
                    estado: "disponible",
                  })
                  setRegisterError(null)
                  setRegisterModalOpen(true)
                }}
              >
                Registrar este lote nuevo
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground py-4">No se pudo cargar la información del lote.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={registerModalOpen}
        onOpenChange={(open) => {
          setRegisterModalOpen(open)
          if (!open) setRegisterError(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar lote nuevo</DialogTitle>
            <DialogDescription>
              Complete los datos del lote según la tabla lotes_lote. El identificador y la manzana se toman del plano.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!modalIdentificador) return
              setRegisterError(null)
              setRegisterSubmitting(true)
              const metros = parseFloat(registerForm.metros_cuadrados)
              const valor = parseFloat(registerForm.valor_total)
              const costo = parseFloat(registerForm.costo_instalacion) || 5000
              if (isNaN(metros) || metros <= 0 || isNaN(valor) || valor <= 0) {
                setRegisterError("Metros cuadrados y valor total son obligatorios y deben ser mayores a 0.")
                setRegisterSubmitting(false)
                return
              }
              try {
                const created = await lotificacionService.registrarLoteDesdePlano(lotificacionId, {
                  identificador: modalIdentificador,
                  metros_cuadrados: metros,
                  valor_total: valor,
                  costo_instalacion: costo,
                  estado: registerForm.estado,
                })
                const list = await lotificacionService.getLotesPlano(lotificacionId)
                setLotesList(list)
                setModalLote(created)
                setRegisterModalOpen(false)
              } catch (err: any) {
                setRegisterError(err?.data?.error ?? err?.message ?? "Error al registrar el lote.")
              } finally {
                setRegisterSubmitting(false)
              }
            }}
          >
            <div className="space-y-2">
              <Label>Identificador</Label>
              <Input value={modalIdentificador ?? ""} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-metros">Metros cuadrados *</Label>
              <Input
                id="reg-metros"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={registerForm.metros_cuadrados}
                onChange={(e) =>
                  setRegisterForm((f) => ({ ...f, metros_cuadrados: e.target.value }))
                }
                placeholder="Ej: 150.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-valor">Valor total (Q) *</Label>
              <Input
                id="reg-valor"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={registerForm.valor_total}
                onChange={(e) =>
                  setRegisterForm((f) => ({ ...f, valor_total: e.target.value }))
                }
                placeholder="Ej: 125000.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-costo">Costo instalación (Q)</Label>
              <Input
                id="reg-costo"
                type="number"
                min="0"
                step="0.01"
                value={registerForm.costo_instalacion}
                onChange={(e) =>
                  setRegisterForm((f) => ({ ...f, costo_instalacion: e.target.value }))
                }
                placeholder="5000"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={registerForm.estado}
                onValueChange={(v) => setRegisterForm((f) => ({ ...f, estado: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADO_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {registerError && (
              <p className="text-sm text-destructive">{registerError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegisterModalOpen(false)}
                disabled={registerSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={registerSubmitting}>
                {registerSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  "Registrar lote"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open)
          if (!open) setEditError(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar lote</DialogTitle>
            <DialogDescription>
              Modifique los datos del lote. El identificador no se puede cambiar.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!modalLote) return
              setEditError(null)
              setEditSubmitting(true)
              const metros = parseFloat(editForm.metros_cuadrados)
              const valor = parseFloat(editForm.valor_total)
              const costo = parseFloat(editForm.costo_instalacion) || 0
              if (isNaN(metros) || metros <= 0 || isNaN(valor) || valor <= 0) {
                setEditError("Metros cuadrados y valor total son obligatorios y deben ser mayores a 0.")
                setEditSubmitting(false)
                return
              }
              try {
                const updated = await lotesService.updateLote(modalLote.id, {
                  version: modalLote.version ?? 0,
                  metros_cuadrados: String(metros),
                  valor_total: String(valor),
                  costo_instalacion: String(costo),
                  estado: editForm.estado,
                  activo: true,
                })
                const list = await lotificacionService.getLotesPlano(lotificacionId)
                setLotesList(list)
                setModalLote({
                  ...modalLote,
                  ...updated,
                  metros_cuadrados: String(updated.metros_cuadrados),
                  valor_total: String(updated.valor_total),
                  costo_instalacion: String(updated.costo_instalacion),
                  estado: updated.estado,
                  version: updated.version,
                } as LoteDetallePlano)
                setEditModalOpen(false)
              } catch (err: any) {
                setEditError(err?.data?.version?.[0] ?? err?.data?.error ?? err?.message ?? "Error al actualizar el lote.")
              } finally {
                setEditSubmitting(false)
              }
            }}
          >
            <div className="space-y-2">
              <Label>Identificador</Label>
              <Input value={modalLote?.identificador ?? ""} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-metros">Metros cuadrados *</Label>
              <Input
                id="edit-metros"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={editForm.metros_cuadrados}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, metros_cuadrados: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-valor">Valor total (Q) *</Label>
              <Input
                id="edit-valor"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={editForm.valor_total}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, valor_total: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-costo">Costo instalación (Q)</Label>
              <Input
                id="edit-costo"
                type="number"
                min="0"
                step="0.01"
                value={editForm.costo_instalacion}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, costo_instalacion: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={editForm.estado}
                onValueChange={(v) => setEditForm((f) => ({ ...f, estado: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADO_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={editSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function formatDecimal(s: string): string {
  const n = parseFloat(s)
  return isNaN(n) ? "—" : n.toLocaleString("es-GT", { minimumFractionDigits: 2 })
}

function formatMoney(s: string): string {
  const n = parseFloat(s)
  return isNaN(n) ? "—" : `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
}
