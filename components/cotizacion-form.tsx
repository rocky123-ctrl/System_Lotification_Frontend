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
import { ventasService, type CalculoVentaResponse } from "@/lib/ventas-service"
import { cotizacionesService, type RegistrarCotizacionPayload, type Cotizacion } from "@/lib/cotizaciones-service"
import { toast } from "sonner"
import { ViewOnlyPlano } from "@/components/ViewOnlyPlano"

interface CotizacionFormProps {
  loteId?: string
  cotizacionId?: string
}

export function CotizacionForm({ loteId, cotizacionId }: CotizacionFormProps) {
  const router = useRouter()
  const isEditing = !!cotizacionId

  // Estado Core
  const [lote, setLote] = useState<Lote | null>(null)
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoadingMain, setIsLoadingMain] = useState(true)

  // Campos de formulario
  const [selectedClienteId, setSelectedClienteId] = useState<string>("")
  const [clienteSearch, setClienteSearch] = useState<string>("")
  
  const [tipoPago, setTipoPago] = useState<'contado' | 'financiado'>('financiado')
  const [enganche, setEnganche] = useState<number>(5000)
  const [descuento, setDescuento] = useState<number>(0)
  const [plazoMeses, setPlazoMeses] = useState<number>(12)
  const [tasaInteres, setTasaInteres] = useState<number>(16)
  const [incluirInstalacion, setIncluirInstalacion] = useState(false)
  const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'DEPOSITO'>('EFECTIVO')
  const [fechaVencimiento, setFechaVencimiento] = useState("")

  // Status de Peticiones
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calculoBackend, setCalculoBackend] = useState<CalculoVentaResponse | null>(null)
  const [isLoadingCalculo, setIsLoadingCalculo] = useState(false)

  // 1. Cargar Clientes y Datos Base
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingMain(true)
        const resClientes = await getClientes(1, 100)
        setClientes(resClientes.clientes)

        // Definir fecha por defecto (vence en 15 dias)
        const dateDefault = new Date()
        dateDefault.setDate(dateDefault.getDate() + 15)
        setFechaVencimiento(dateDefault.toISOString().split('T')[0])

        if (isEditing && cotizacionId) {
          const c = await cotizacionesService.getCotizacion(parseInt(cotizacionId))
          setCotizacion(c)
          
          if (c.cliente) {
            setSelectedClienteId(String(c.cliente))
          }

          setTipoPago(c.tipo_pago.toLowerCase() as any)
          setEnganche(parseFloat(c.enganche || "0"))
          setDescuento(parseFloat(c.descuento || "0"))
          setPlazoMeses(c.plazo_meses || 12)
          setTasaInteres(parseFloat(c.tasa_interes_anual || "0"))
          setFormaPago(c.forma_pago || 'EFECTIVO')
          setIncluirInstalacion(c.acepta_instalacion || false)
          setFechaVencimiento(c.fecha_vencimiento)
          
          const loteAPI = await lotesService.getLote(Number(c.lote))
          setLote(loteAPI)

        } else if (loteId) {
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
  }, [loteId, cotizacionId, isEditing])

  // 2. Efecto para Calcular en tiempo real usando el servicio de ventas (misma lógica)
  useEffect(() => {
    const fetchCalculo = async () => {
      if (!lote) return
      setIsLoadingCalculo(true)
      try {
        const payload: CalculoVentaPayload = {
          valor_lote: parseFloat(lote.valor_total),
          acepta_instalacion: incluirInstalacion,
          costo_instalacion: parseFloat(lote.costo_instalacion || "0"),
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
    
    const timeoutId = setTimeout(() => {
      fetchCalculo()
    }, 400)
    
    return () => clearTimeout(timeoutId)
  }, [enganche, descuento, tipoPago, plazoMeses, tasaInteres, incluirInstalacion, lote])

  const handleSubmit = async () => {
    if (!selectedClienteId) return toast.error("Debe seleccionar un cliente.")
    if (!lote) return toast.error("No hay lote seleccionado.")
    if (!fechaVencimiento) return toast.error("La fecha de vencimiento es requerida.")

    if (enganche < 0 || descuento < 0) {
      return toast.error("Los valores financieros no pueden ser negativos.")
    }

    const valorTotal = (parseFloat(lote.valor_total) + parseFloat(lote.costo_instalacion || "0"));
    const totalAPagar = valorTotal - descuento;
    
    if (tipoPago === 'contado') {
      if (Math.abs(enganche - totalAPagar) > 0.01) {
         return toast.error(`Para cotizaciones al contado, el monto neto propuesto a pagar debe ser igual al total a cancelar (Q ${totalAPagar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}).`);
      }
    } else {
      if (enganche <= 0) return toast.error("El enganche propuesto debe ser mayor a 0 para una cotización financiada.");
      if (plazoMeses <= 0) return toast.error("El plazo en meses debe ser mayor a 0.");
      if (tasaInteres <= 0) return toast.error("La tasa de interés anual debe ser mayor a 0.");
      
      const instalacion = parseFloat(lote?.costo_instalacion || "0");
      if (enganche <= instalacion) {
        return toast.error(`El Monto Pagar Enganche + Costo de Instalacion debe ser mayor al costo de instalación (Q ${instalacion.toLocaleString('es-GT', {minimumFractionDigits: 2})}).`);
      }
    }
    setIsSubmitting(true)
    try {
      let valorLoteCalculado = (parseFloat(lote.valor_total) + parseFloat(lote.costo_instalacion || "0")) - descuento;

      if (tipoPago === 'financiado' && calculoBackend) {
        valorLoteCalculado = calculoBackend.total_financia_mas_intereses + enganche;
      }

      const payload: Partial<RegistrarCotizacionPayload> = {
        cliente: parseInt(selectedClienteId),
        lote: lote.id,
        valor_lote: valorLoteCalculado,
        enganche: enganche,
        descuento: descuento,
        tipo_pago: tipoPago.toUpperCase() as any,
        plazo_meses: tipoPago === 'financiado' ? plazoMeses : 0,
        tasa_interes_anual: tipoPago === 'financiado' ? tasaInteres : 0,
        acepta_instalacion: true,
        forma_pago: formaPago,
        fecha_vencimiento: fechaVencimiento
      }

      if (isEditing && cotizacionId) {
        await cotizacionesService.editarCotizacion(parseInt(cotizacionId), payload)
        toast.success("Cotización actualizada con éxito")
        router.push("/cotizaciones")
      } else {
        await cotizacionesService.registrarCotizacion(payload as RegistrarCotizacionPayload)
        toast.success("Cotización registrada con éxito")
        router.push("/cotizaciones")
      }
    } catch (err: any) {
        console.error("Error saving cotizacion", err)
      toast.error(isEditing ? "Error al editar la cotización." : "Error al registrar la cotización.")
    } finally {
      setIsSubmitting(false)
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
      
      <Button variant="ghost" onClick={() => router.push("/cotizaciones")} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Regresar a Cotizaciones
      </Button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 md:p-6 rounded-lg border shadow-sm gap-4">
         <div>
           <h1 className="text-xl md:text-2xl font-bold text-slate-800">
             {isEditing ? `Editar Cotización - Lote ${lote?.numero_lote || cotizacion?.lote_numero}` : `Nueva Cotización - Lote ${lote?.numero_lote}`}
           </h1>
           <p className="text-muted-foreground mt-1 text-xs md:text-sm">
             Lotificación {lote?.lotificacion_nombre || cotizacion?.lotificacion_nombre} • Manzana {lote?.manzana_nombre || cotizacion?.lote_manzana}
           </p>
         </div>
      </div>

      <Card className="shadow-md border-0 overflow-hidden bg-slate-50">
        <div className="p-4 border-b bg-white flex justify-between items-center w-full">
           <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              Ubicación en el Plano
           </h3>
        </div>
        <div className="w-full h-[300px] md:h-[450px]">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
         <div className="space-y-6">
           {/* Section: Cliente/Prospecto */}
           <Card className="shadow-sm">
             <CardHeader className="pb-4 border-b bg-slate-50/50">
               <CardTitle className="text-base font-semibold">1. Datos del Interesado</CardTitle>
             </CardHeader>
             <CardContent className="pt-4 space-y-4">

                <div className="space-y-2 pb-2">
                  <Label>Seleccionar Cliente Existente</Label>
                  <Input 
                    placeholder="Buscar cliente por nombre, apellido o DPI..." 
                    value={clienteSearch} 
                    onChange={e => setClienteSearch(e.target.value)} 
                    className="mb-2"
                  />
                  <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cliente de la lista..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.filter(c => c.estado === 'activo' && (
                        c.nombres.toLowerCase().includes(clienteSearch.toLowerCase()) || 
                        c.apellidos.toLowerCase().includes(clienteSearch.toLowerCase()) || 
                        (c.dpi && c.dpi.includes(clienteSearch))
                      )).map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nombres} {c.apellidos} {c.nit ? `(NIT: ${c.nit})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label>Fecha de Vencimiento de Cotización</Label>
                  <Input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} />
                </div>
             </CardContent>
           </Card>

           {/* Section: Pago */}
           <Card className="shadow-sm">
             <CardHeader className="pb-4 border-b bg-slate-50/50">
               <CardTitle className="text-base font-semibold">2. Detalles de Plan de Pago Propuesto</CardTitle>
             </CardHeader>
             <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Pago Orientativo</Label>
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
                  <Label>Forma de Pago Prevista</Label>
                  <Select value={formaPago} onValueChange={(v: any) => setFormaPago(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo 💵</SelectItem>
                      <SelectItem value="TARJETA">Tarjeta 💳</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia 🏦</SelectItem>
                      <SelectItem value="DEPOSITO">Depósito 📥</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{tipoPago === 'contado' ? 'Monto neto a pagar (Q)' : 'Monto Pagar Enganche + Costo de Instalacion'}</Label>
                    <Input type="number" min="0" value={enganche} onChange={e => setEnganche(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Descuento Especial (Q) (Opcional)</Label>
                    <Input type="number" min="0" value={descuento} onChange={e => setDescuento(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>


               {tipoPago === 'financiado' && (
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-2">
                   <div className="space-y-2">
                     <Label>Plazo en meses</Label>
                     <Select value={plazoMeses.toString()} onValueChange={(v: string) => setPlazoMeses(parseInt(v))}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="12">12</SelectItem>
                         <SelectItem value="24">24</SelectItem>
                         <SelectItem value="36">36</SelectItem>
                         <SelectItem value="48">48</SelectItem>
                         <SelectItem value="60">60</SelectItem>
                         <SelectItem value="72">72</SelectItem>
                         <SelectItem value="84">84</SelectItem>
                       </SelectContent>
                     </Select>
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
             <Card className="shadow-md bg-slate-800 text-white border-0 md:sticky md:top-6">
               <CardHeader className="pb-4 border-b border-slate-700/50">
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                     Resumen de Cotización
                     {isLoadingCalculo && <Loader2 className="w-5 h-5 animate-spin text-slate-300" />}
                  </CardTitle>
               </CardHeader>
               <CardContent className="pt-6 relative">
                 {lote && calculoBackend ? (
                    (() => {
                      const costoInstalacion = parseFloat(lote.costo_instalacion || "0");
                      const pagoCliente = enganche;

                      // Valores estables desde el backend
                      const valorLoteNeto = calculoBackend.valor_lote;
                      const valorLoteConDescuento = calculoBackend.valor_lote_con_descuento;
                      const valorTotal = calculoBackend.valor_total;
                      const faltante = calculoBackend.faltante;
                      const enganchePuro = calculoBackend.enganche_puro;
                      
                      const valorFinanciar = calculoBackend.valor_financiar;
                      const cuotaFinal = calculoBackend.cuota_final_mensual;
                      const tasaEfectiva = calculoBackend.tasa_mensual_efectiva_porcentaje;
                      
                      const totalFinanciaMasIntereses = calculoBackend.total_financia_mas_intereses;
                      const valorIntereses = calculoBackend.valor_intereses;

                      return (
                        <div className="space-y-4">
                          {tipoPago === 'contado' && (
                            <>
                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Valor del lote {descuento > 0 ? '(con descuento)' : ''}</span>
                                <span className="font-medium text-base text-white">
                                  {descuento > 0 && (
                                    <span className="line-through text-slate-500 mr-2 text-xs">
                                      Q {valorLoteNeto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                  Q {valorLoteConDescuento.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Valor Total</span>
                                <span className="font-medium text-base text-white">
                                  Q {valorTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Pago del Cliente</span>
                                <span className="font-medium text-base text-emerald-400">
                                  Q {pagoCliente.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Faltante</span>
                                <span className="font-medium text-base text-rose-400">
                                  Q {faltante.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-5 mt-4">
                                <span className="text-slate-400 font-medium mb-1">Total a Cancelar Neto</span>
                                <span className="font-bold text-3xl text-emerald-400">
                                  Q {valorTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </>
                          )}

                          {tipoPago === 'financiado' && (
                            <>
                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Valor del lote {descuento > 0 ? '(con descuento)' : ''}</span>
                                <span className="font-medium text-base text-white">
                                  {descuento > 0 && (
                                    <span className="line-through text-slate-500 mr-2 text-xs">
                                      Q {valorLoteNeto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                  Q {valorLoteConDescuento.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex flex-col text-sm border-b border-slate-700/50 pb-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-slate-300 font-medium">Monto a pagar Ahora</span>
                                </div>
                                <div className="pl-4 border-l-2 border-slate-600 mb-2 space-y-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Costo de instalación</span>
                                    <span className="text-slate-300">Q {costoInstalacion.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Enganche</span>
                                    <span className="text-slate-300">Q {enganchePuro.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-slate-400 font-medium">Total</span>
                                  <span className="font-medium text-emerald-400">
                                    Q {pagoCliente.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Valor Total</span>
                                <span className="font-medium text-base text-white">
                                  Q {valorTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Valor a Financiar</span>
                                <span className="font-semibold text-base text-indigo-300">
                                  Q {valorFinanciar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Total de cuotas</span>
                                <span className="font-medium text-base text-white">{plazoMeses}</span>
                              </div>
                              
                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Tasa Mensual Efectiva</span>
                                <span className="font-medium text-white">{tasaEfectiva?.toFixed(4)}%</span>
                              </div>

                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Valor de los Intereses</span>
                                <span className="font-medium text-rose-300">
                                  Q {valorIntereses.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                <span className="text-slate-300">Total de Financia (+intereses)</span>
                                <span className="font-medium text-indigo-300">
                                  Q {totalFinanciaMasIntereses.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-5 mt-4 border border-emerald-500/30">
                                <span className="text-slate-400 font-medium mb-1">Cuota Final Mensual</span>
                                <span className="font-bold text-3xl text-emerald-400">Q {cuotaFinal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()
                 ) : (
                    <p className="text-slate-400">Validando datos...</p>
                 )}

                 <div className="mt-8">
                    <Button 
                      size="lg"
                      className="w-full bg-primary text-white font-semibold py-6 text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                      onClick={handleSubmit} 
                      disabled={isSubmitting || isLoadingCalculo || !lote}
                    >
                      {isSubmitting ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : null}
                      {isEditing ? "Guardar Cotización" : "Crear Cotización"}
                    </Button>
                 </div>
               </CardContent>
            </Card>
         </div>

      </div>
    </div>
  )
}
