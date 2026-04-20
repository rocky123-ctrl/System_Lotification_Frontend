"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ArrowLeft } from "lucide-react"

import { getClientes, type Cliente } from "@/lib/clientes-service"
import { lotesService, type Lote } from "@/lib/lotes-service"
import { ventasService, type RegistrarVentaPayload, type CalculoVentaResponse, type Venta } from "@/lib/ventas-service"
import { toast } from "sonner"
import { ViewOnlyPlano } from "@/components/ViewOnlyPlano"

interface VentaFormProps {
  // Solo se envía uno de los dos
  loteId?: string
  ventaId?: string
}

export function VentaForm({ loteId, ventaId }: VentaFormProps) {
  const router = useRouter()
  const isEditing = !!ventaId

  // Estado Core
  const [lote, setLote] = useState<Lote | null>(null)
  const [venta, setVenta] = useState<Venta | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoadingMain, setIsLoadingMain] = useState(true)

  // Campos de formulario
  const [selectedClienteId, setSelectedClienteId] = useState<string>("")
  const [tipoPago, setTipoPago] = useState<'contado' | 'financiado'>('financiado')
  const [enganche, setEnganche] = useState<number>(0)
  const [descuento, setDescuento] = useState<number>(0)
  const [plazoMeses, setPlazoMeses] = useState<number>(12)
  const [tasaInteres, setTasaInteres] = useState<number>(12)
  const [incluirInstalacion, setIncluirInstalacion] = useState(false)
  const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO')

  // Status de Peticiones
  const [isSubmittingVenta, setIsSubmittingVenta] = useState(false)
  const [calculoBackend, setCalculoBackend] = useState<CalculoVentaResponse | null>(null)
  const [isLoadingCalculo, setIsLoadingCalculo] = useState(false)

  // 1. Cargar Clientes y Datos Base
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingMain(true)
        const resClientes = await getClientes(1, 100)
        setClientes(resClientes.clientes)

        if (isEditing && ventaId) {
          // Editando una venta existente
          const v = await ventasService.getVenta(parseInt(ventaId))
          setVenta(v)
          setSelectedClienteId(String(v.cliente))
          setTipoPago(v.tipo_pago.toLowerCase() as any)
          setEnganche(parseFloat(v.enganche || "0"))
          setDescuento(parseFloat(v.descuento || "0"))
          setPlazoMeses(v.plazo_meses || 12)
          setTasaInteres(parseFloat(v.tasa_interes_anual || "0"))
          setFormaPago(v.forma_pago || 'EFECTIVO')
          setIncluirInstalacion(v.acepta_instalacion || false)
          
          const loteAPI = await lotesService.getLote(Number(v.lote))
          setLote(loteAPI)

        } else if (loteId) {
          // Creando nueva venta
          const loteAPI = await lotesService.getLote(parseInt(loteId))
          setLote(loteAPI)
        }
      } catch (err: any) {
        toast.error("Error cargando los datos solicitados.")
      } finally {
        setIsLoadingMain(false)
      }
    }
    fetchData()
  }, [loteId, ventaId, isEditing])

  // 2. Efecto para Calcular en tiempo real
  useEffect(() => {
    const fetchCalculo = async () => {
      if (!lote) return
      setIsLoadingCalculo(true)
      try {
        const payload = {
          valor_lote: incluirInstalacion ? parseFloat(lote.valor_total) : (parseFloat(lote.valor_total) - parseFloat(lote.costo_instalacion || "0")),
          enganche: enganche,
          descuento: descuento,
          tipo_pago: tipoPago.toUpperCase() as "CONTADO" | "FINANCIADO",
          plazo_meses: plazoMeses,
          tasa_interes: tasaInteres
        }
        const calc = await ventasService.calcularVenta(payload)
        setCalculoBackend(calc)
      } catch (err: any) {
        // Silencioso pero loggeado
      } finally {
        setIsLoadingCalculo(false)
      }
    }
    
    // Solo dispara si hay una pausa pequeña
    const timeoutId = setTimeout(() => {
      fetchCalculo()
    }, 400)
    
    return () => clearTimeout(timeoutId)
  }, [enganche, descuento, tipoPago, plazoMeses, tasaInteres, incluirInstalacion, lote])


  const handleSubmit = async () => {
    if (!selectedClienteId) return toast.error("Debe seleccionar un cliente.")
    if (!lote) return toast.error("No hay lote seleccionado.")

    if (enganche < 0 || descuento < 0) {
      return toast.error("Los valores financieros no pueden ser negativos.")
    }

    setIsSubmittingVenta(true)
    try {
      const payload: Partial<RegistrarVentaPayload> = {
        cliente: parseInt(selectedClienteId),
        lote: lote.id,
        enganche: enganche,
        descuento: descuento,
        tipo_pago: tipoPago.toUpperCase() as any,
        plazo_meses: tipoPago === 'financiado' ? plazoMeses : 0,
        tasa_interes_anual: tipoPago === 'financiado' ? tasaInteres : 0,
        acepta_instalacion: incluirInstalacion,
        forma_pago: formaPago
      }

      if (isEditing && ventaId) {
        await ventasService.editarVenta(parseInt(ventaId), payload)
        toast.success("Venta actualizada con éxito", { description: "Los cálculos han sido regenerados." })
        router.push("/venta")
      } else {
        await ventasService.registrarVenta(payload as RegistrarVentaPayload)
        toast.success("Venta registrada con éxito")
        router.push("/venta")
      }
    } catch (err: any) {
      toast.error(isEditing ? "Error al editar la venta." : "Error al registrar la venta.")
    } finally {
      setIsSubmittingVenta(false)
    }
  }

  if (isLoadingMain) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg font-medium text-slate-600">Cargando...</span>
      </div>
    )
  }

  const hasPlanoSvg = !!(lote && lote.lotificacion_id && (lote.plano_svg_id || lote.identificador))

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* Boton de regreso */}
      <Button variant="ghost" onClick={() => router.push("/venta")} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Regresar a Ventas
      </Button>

      {/* Titulos */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border shadow-sm">
         <div>
           <h1 className="text-2xl font-bold text-slate-800">
             {isEditing ? `Editar Venta - Lote ${lote?.numero_lote || venta?.lote_numero}` : `Nueva Venta - Lote ${lote?.numero_lote}`}
           </h1>
           <p className="text-muted-foreground mt-1 text-sm">
             Lotificación {lote?.lotificacion_nombre || venta?.lotificacion_nombre} • Manzana {lote?.manzana_nombre || venta?.lote_manzana}
           </p>
         </div>
         {isEditing && (
            <div className="text-right">
               <p className="text-xs font-semibold text-slate-500 uppercase">Estado actual de pago</p>
               <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mt-1 inline-block">
                 {tipoPago === 'contado' ? 'Contado' : 'Crédito Activo'}
               </span>
            </div>
         )}
      </div>

      {/* Area del Mapa Superior */}
      <Card className="shadow-md border-0 overflow-hidden bg-slate-50">
        <div className="p-4 border-b bg-white flex justify-between items-center w-full">
           <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              Ubicación en el Plano (Mapa general)
           </h3>
        </div>
        <div className="w-full h-[450px]">
           {hasPlanoSvg ? (
             <ViewOnlyPlano 
               lotificacionId={lote!.lotificacion_id!} 
               highlightLoteId={lote!.plano_svg_id || lote!.identificador} 
               className="h-full w-full bg-slate-100"
             />
           ) : (
             <div className="flex h-full w-full items-center justify-center border shadow-inner">
                 <p className="text-muted-foreground font-medium text-sm">No se puede mostrar en plano SVG</p>
             </div>
           )}
        </div>
      </Card>

      {/* Formulario 3 Columnas o 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
         
         <div className="space-y-6">
           {/* Section: Cliente */}
           <Card className="shadow-sm">
             <CardHeader className="pb-4 border-b bg-slate-50/50">
               <CardTitle className="text-base font-semibold">1. Datos del Cliente</CardTitle>
             </CardHeader>
             <CardContent className="pt-4 space-y-4">
               <div className="space-y-2">
                 <Label>Seleccionar Cliente Existente</Label>
                 <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                   <SelectTrigger>
                     <SelectValue placeholder="Busque y seleccione un cliente..." />
                   </SelectTrigger>
                   <SelectContent>
                     {clientes.map(c => (
                       <SelectItem key={c.id} value={String(c.id)}>
                         {c.nombres} {c.apellidos} {c.telefono ? `- Télefono: ${c.telefono}` : ''}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </CardContent>
           </Card>

           {/* Section: Pago */}
           <Card className="shadow-sm">
             <CardHeader className="pb-4 border-b bg-slate-50/50">
               <CardTitle className="text-base font-semibold">2. Detalles de Pago</CardTitle>
             </CardHeader>
             <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Pago</Label>
                  <Select value={tipoPago} onValueChange={(v: "contado" | "financiado") => setTipoPago(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contado">Al Contado</SelectItem>
                      <SelectItem value="financiado">Financiado (Crédito)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pago</Label>
                  <Select value={formaPago} onValueChange={(v: any) => setFormaPago(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo 💵</SelectItem>
                      <SelectItem value="TARJETA">Tarjeta 💳</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia 🏦</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{tipoPago === 'contado' ? 'Monto neto pagado (Q)' : 'Enganche Inicial (Q)'}</Label>
                    <Input type="number" min="0" value={enganche} onChange={e => setEnganche(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Descuento (Q)</Label>
                    <Input type="number" min="0" value={descuento} onChange={e => setDescuento(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                <div className="pt-2 border-t mt-3 flex items-start space-x-2">
                  <Checkbox 
                    id="incluirInstalacion" 
                    checked={incluirInstalacion} 
                    onCheckedChange={(checked) => setIncluirInstalacion(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="incluirInstalacion"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Agregar Costo de Instalacion: Q {(parseFloat(lote?.costo_instalacion || "0")).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Se sumará al valor base del lote para el cálculo final).
                    </p>
                  </div>
                </div>

               {tipoPago === 'financiado' && (
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-2">
                   <div className="space-y-2">
                     <Label>Plazo en meses</Label>
                     <Input type="number" min="1" value={plazoMeses} onChange={e => setPlazoMeses(parseInt(e.target.value) || 0)} />
                   </div>
                   <div className="space-y-2">
                     <Label>Tasa de Interés Anual (%)</Label>
                     <Input type="number" min="0" step="0.1" value={tasaInteres} onChange={e => setTasaInteres(parseFloat(e.target.value) || 0)} />
                   </div>
                 </div>
               )}
             </CardContent>
           </Card>
         </div>

         <div className="space-y-6">
            {/* Resumen */}
            <Card className="shadow-md bg-slate-800 text-white border-0 sticky top-6">
               <CardHeader className="pb-4 border-b border-slate-700/50">
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                     Resumen Financiero 
                     {isLoadingCalculo && <Loader2 className="w-5 h-5 animate-spin text-slate-300" />}
                  </CardTitle>
               </CardHeader>
               <CardContent className="pt-6 relative">
                 {lote && calculoBackend ? (
                    <div className="space-y-4">
                      {/* 1. Valor del Lote */}
                      <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                        <span className="text-slate-300">1. Valor del Lote {descuento > 0 ? '(con descuento)' : ''}</span>
                        <span className="font-medium text-base text-white">
                          {descuento > 0 && (
                            <span className="line-through text-slate-500 mr-2 text-xs">
                               Q {(incluirInstalacion ? parseFloat(lote.valor_total) : (parseFloat(lote.valor_total) - parseFloat(lote.costo_instalacion || "0"))).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          Q {calculoBackend.valor_con_descuento.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* 2. Enganche / Monto */}
                      <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                        <span className="text-slate-300">
                          {tipoPago === 'contado' ? '2. Monto Pagado Hoy' : '2. Total de Enganche'}
                        </span>
                        <span className="font-medium text-base text-emerald-400">Q {enganche.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                      </div>
 
                      {/* 3. Valor a Financiar / Restante */}
                      <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                        <span className="text-slate-300">
                          {tipoPago === 'contado' ? '3. Saldo Restante' : '3. Valor a Financiar'}
                        </span>
                        <span className="font-semibold text-base text-indigo-300">Q {calculoBackend.valor_financiar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {tipoPago === 'financiado' && (
                        <>
                          <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                            <span className="text-slate-300">Total Cuotas</span>
                            <span className="font-medium text-base text-white">{plazoMeses}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                            <span className="text-slate-300">Tasa Mensual Efectiva</span>
                            <span className="font-medium text-white">{calculoBackend.tasa_mensual_efectiva_porcentaje?.toFixed(4)}%</span>
                          </div>

                          <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-5 mt-4 mt-8 border border-emerald-500/30">
                            <span className="text-slate-400 font-medium mb-1">Cuota Final Mensual</span>
                            <span className="font-bold text-3xl text-emerald-400">Q {calculoBackend?.cuota_final_mensual?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}
                      
                      {tipoPago === 'contado' && (
                        <>
                          <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-5 mt-4 mt-8">
                            <span className="text-slate-400 font-medium mb-1">Total a Cancelar Neto</span>
                            <span className="font-bold text-3xl text-emerald-400">Q {calculoBackend?.valor_con_descuento?.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                          </div>
                          
                          {enganche > calculoBackend.valor_con_descuento && (
                             <div className="flex justify-between items-center text-sm mt-4 text-amber-300 bg-amber-950/40 p-3 rounded-md">
                               <span>Vuelto al Cliente :</span>
                               <span className="font-bold">Q {(enganche - calculoBackend.valor_con_descuento).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                             </div>
                          )}
                        </>
                      )}
                    </div>
                 ) : (
                    <p className="text-slate-400">Validando datos...</p>
                 )}

                 <div className="mt-8">
                    <Button 
                      size="lg"
                      className="w-full bg-primary text-white font-semibold py-6 text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                      onClick={handleSubmit} 
                      disabled={isSubmittingVenta || isLoadingCalculo || !lote}
                    >
                      {isSubmittingVenta ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : null}
                      {isEditing ? "Guardar y Actualizar Crédito" : "Confirmar e Inscribir Venta"}
                    </Button>
                 </div>
               </CardContent>
            </Card>
         </div>

      </div>
    </div>
  )
}
