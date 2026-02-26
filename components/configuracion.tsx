"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Settings, 
  Building2, 
  DollarSign, 
  Upload, 
  Save, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  BarChart3,
  Map
} from "lucide-react"
import { useConfiguracion } from "@/hooks/use-configuracion"
import { 
  configuracionGeneralService, 
  configuracionFinancieraService,
  formatearPorcentaje,
  formatearMoneda,
  formatearArea,
  formatearTasaMensual,
  type ConfiguracionGeneralCreate,
  type ConfiguracionFinancieraCreate
} from "@/lib/configuracion-service"
import { InteractiveSVGViewer } from "@/components/interactive-svg-viewer"

export function Configuracion() {
  const { 
    configuracionActiva, 
    configuracionResumen, 
    configuracionFinanciera, 
    isLoading, 
    error,
    refreshConfiguracion,
    refreshFinanciera
  } = useConfiguracion()

  // Estados para formularios
  const [isGeneralDialogOpen, setIsGeneralDialogOpen] = useState(false)
  const [isFinancieraDialogOpen, setIsFinancieraDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para SVG interactivo
  const [svgContent, setSvgContent] = useState<string | undefined>(undefined)
  const [svgFile, setSvgFile] = useState<File | null>(null)
  const [isUploadingSvg, setIsUploadingSvg] = useState(false)

  // Formulario configuración general
  const [formGeneral, setFormGeneral] = useState<ConfiguracionGeneralCreate>({
    nombre_lotificacion: "",
    ubicacion: "",
    descripcion: "",
    direccion_completa: "",
    telefono: "",
    email: "",
    sitio_web: "",
    fecha_inicio: "",
    total_lotes: 0,
    area_total: "",
    tasa_anual: "",
    activo: true
  })

  // Formulario configuración financiera
  const [formFinanciera, setFormFinanciera] = useState<ConfiguracionFinancieraCreate>({
    plazo_minimo_meses: 12,
    plazo_maximo_meses: 60,
    enganche_minimo_porcentaje: "20.00",
    enganche_maximo_porcentaje: "50.00",
    costo_instalacion_default: "5000.00",
    permitir_pagos_anticipados: true,
    aplicar_penalizacion_atrasos: true,
    penalizacion_atraso_porcentaje: "5.00"
  })

  // Manejar envío de formulario general
  const handleSubmitGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      if (configuracionActiva) {
        // Actualizar configuración existente
        await configuracionGeneralService.updateConfiguracion(configuracionActiva.id, formGeneral)
      } else {
        // Crear nueva configuración
        await configuracionGeneralService.createConfiguracion(formGeneral)
      }

      // Recargar datos
      await refreshConfiguracion()
      setIsGeneralDialogOpen(false)
    } catch (err: any) {
      console.error('Error guardando configuración general:', err)
      alert('Error al guardar la configuración. Por favor, intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar envío de formulario financiero
  const handleSubmitFinanciera = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      if (configuracionFinanciera) {
        // Actualizar configuración financiera existente
        await configuracionFinancieraService.updateConfiguracion(configuracionFinanciera.id, formFinanciera)
      } else {
        // Crear nueva configuración financiera para la configuración activa
        await configuracionFinancieraService.crearParaActiva(formFinanciera)
      }

      // Recargar configuración financiera
      await refreshFinanciera()
      setIsFinancieraDialogOpen(false)
    } catch (err: any) {
      console.error('Error guardando configuración financiera:', err)
      alert('Error al guardar la configuración financiera. Por favor, intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cargar datos en formulario para editar
  const handleEditGeneral = () => {
    if (configuracionActiva) {
      setFormGeneral({
        nombre_lotificacion: configuracionActiva.nombre_lotificacion,
        ubicacion: configuracionActiva.ubicacion,
        descripcion: configuracionActiva.descripcion,
        direccion_completa: configuracionActiva.direccion_completa,
        telefono: configuracionActiva.telefono,
        email: configuracionActiva.email,
        sitio_web: configuracionActiva.sitio_web,
        fecha_inicio: configuracionActiva.fecha_inicio,
        total_lotes: configuracionActiva.total_lotes,
        area_total: configuracionActiva.area_total,
        tasa_anual: configuracionActiva.tasa_anual,
        activo: configuracionActiva.activo
      })
    }
    setIsGeneralDialogOpen(true)
  }

  const handleEditFinanciera = () => {
    if (configuracionFinanciera) {
      setFormFinanciera({
        plazo_minimo_meses: configuracionFinanciera.plazo_minimo_meses,
        plazo_maximo_meses: configuracionFinanciera.plazo_maximo_meses,
        enganche_minimo_porcentaje: configuracionFinanciera.enganche_minimo_porcentaje,
        enganche_maximo_porcentaje: configuracionFinanciera.enganche_maximo_porcentaje,
        costo_instalacion_default: configuracionFinanciera.costo_instalacion_default,
        permitir_pagos_anticipados: configuracionFinanciera.permitir_pagos_anticipados,
        aplicar_penalizacion_atrasos: configuracionFinanciera.aplicar_penalizacion_atrasos,
        penalizacion_atraso_porcentaje: configuracionFinanciera.penalizacion_atraso_porcentaje
      })
    }
    setIsFinancieraDialogOpen(true)
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando configuración...</span>
        </div>
      </div>
    )
  }

  // Mostrar error de conexión
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuración del Sistema</h1>
            <p className="text-muted-foreground">Gestiona la configuración general y financiera de la lotificación</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Error de conexión:</strong> {error}</p>
              <p className="text-sm">Verifica que el backend esté ejecutándose en <code>http://localhost:8000</code></p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración del Sistema</h1>
          <p className="text-muted-foreground">Gestiona la configuración general y financiera de la lotificación</p>
        </div>
      </div>

      {/* Resumen de configuración */}
      {configuracionResumen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resumen de Configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Información de totales */}
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Configurado:</span> {configuracionResumen.total_lotes_configurado || configuracionResumen.total_lotes} lotes
                </div>
                <div>
                  <span className="font-medium">Total Real:</span> {configuracionResumen.total_lotes_reales || configuracionResumen.total_lotes} lotes
                </div>
              </div>
              {(configuracionResumen.total_lotes_reales && configuracionResumen.total_lotes_reales !== configuracionResumen.total_lotes_configurado) && (
                <div className="mt-2 text-xs text-muted-foreground">
                  ⚠️ Hay {(configuracionResumen.total_lotes_reales - (configuracionResumen.total_lotes_configurado || configuracionResumen.total_lotes))} lotes adicionales
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{configuracionResumen.total_lotes_reales || configuracionResumen.total_lotes}</div>
                <div className="text-sm text-muted-foreground">Total de Lotes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{configuracionResumen.lotes_disponibles}</div>
                <div className="text-sm text-muted-foreground">Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{configuracionResumen.lotes_vendidos}</div>
                <div className="text-sm text-muted-foreground">Vendidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{configuracionResumen.tasa_anual_formateada}</div>
                <div className="text-sm text-muted-foreground">Tasa Anual</div>
                <div className="text-xs text-muted-foreground">
                  {formatearTasaMensual(configuracionResumen.tasa_anual)} mensual
                </div>
              </div>
            </div>

            {/* Estados adicionales de lotes */}
            {configuracionResumen && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Otros Estados:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-600">{configuracionResumen.lotes_reservados || 0}</div>
                    <div className="text-xs text-muted-foreground">Reservados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-indigo-600">{configuracionResumen.lotes_financiados || 0}</div>
                    <div className="text-xs text-muted-foreground">Financiados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{configuracionResumen.lotes_en_proceso || 0}</div>
                    <div className="text-xs text-muted-foreground">En Proceso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{configuracionResumen.lotes_cancelados || 0}</div>
                    <div className="text-xs text-muted-foreground">Cancelados</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs de configuración */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Configuración General
          </TabsTrigger>
          <TabsTrigger value="financiera" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Configuración Financiera
          </TabsTrigger>
          <TabsTrigger value="plano" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Plano Interactivo
          </TabsTrigger>
        </TabsList>

        {/* Configuración General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Información General</CardTitle>
                  <CardDescription>Configuración básica de la lotificación</CardDescription>
                </div>
                <Button onClick={handleEditGeneral} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  {configuracionActiva ? 'Editar' : 'Crear Configuración'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {configuracionActiva ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nombre de la Lotificación</Label>
                    <p className="text-lg font-semibold">{configuracionActiva.nombre_lotificacion}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ubicación</Label>
                    <p className="text-lg font-semibold">{configuracionActiva.ubicacion}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                    <p className="text-sm">{configuracionActiva.descripcion}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                    <p className="text-sm">{configuracionActiva.telefono}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-sm">{configuracionActiva.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Sitio Web</Label>
                    <p className="text-sm">{configuracionActiva.sitio_web}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fecha de Inicio</Label>
                    <p className="text-sm">{new Date(configuracionActiva.fecha_inicio).toLocaleDateString('es-GT')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total de Lotes</Label>
                    <p className="text-sm">{configuracionActiva.total_lotes}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Área Total</Label>
                    <p className="text-sm">{formatearArea(configuracionActiva.area_total)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tasa Anual</Label>
                    <p className="text-sm">{formatearPorcentaje(configuracionActiva.tasa_anual)}</p>
                    <p className="text-xs text-muted-foreground">({formatearTasaMensual(configuracionActiva.tasa_anual)} mensual)</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                    <Badge variant={configuracionActiva.activo ? "default" : "secondary"}>
                      {configuracionActiva.activo ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No hay configuración general activa</p>
                  <Button onClick={() => setIsGeneralDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Configuración
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración Financiera */}
        <TabsContent value="financiera" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configuración Financiera</CardTitle>
                  <CardDescription>Parámetros financieros para el cálculo de cuotas</CardDescription>
                </div>
                <Button onClick={handleEditFinanciera} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  {configuracionFinanciera ? 'Editar' : 'Crear Configuración'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {configuracionFinanciera ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Plazo Mínimo (meses)</Label>
                    <p className="text-lg font-semibold">{configuracionFinanciera.plazo_minimo_meses}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Plazo Máximo (meses)</Label>
                    <p className="text-lg font-semibold">{configuracionFinanciera.plazo_maximo_meses}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Enganche Mínimo</Label>
                    <p className="text-sm">{formatearPorcentaje(configuracionFinanciera.enganche_minimo_porcentaje)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Enganche Máximo</Label>
                    <p className="text-sm">{formatearPorcentaje(configuracionFinanciera.enganche_maximo_porcentaje)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Costo de Instalación Default</Label>
                    <p className="text-sm">{formatearMoneda(configuracionFinanciera.costo_instalacion_default)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Penalización por Atraso</Label>
                    <p className="text-sm">{formatearPorcentaje(configuracionFinanciera.penalizacion_atraso_porcentaje)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={configuracionFinanciera.permitir_pagos_anticipados} 
                        disabled 
                      />
                      <Label>Permitir pagos anticipados</Label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={configuracionFinanciera.aplicar_penalizacion_atrasos} 
                        disabled 
                      />
                      <Label>Aplicar penalización por atrasos</Label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No hay configuración financiera activa</p>
                  <Button onClick={() => setIsFinancieraDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Configuración Financiera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Configuración General */}
      <Dialog open={isGeneralDialogOpen} onOpenChange={setIsGeneralDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {configuracionActiva ? 'Editar Configuración General' : 'Crear Configuración General'}
            </DialogTitle>
            <DialogDescription>
              {configuracionActiva ? 'Modifica los datos de la configuración' : 'Crea una nueva configuración para la lotificación'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitGeneral} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Lotificación *</Label>
                <Input
                  id="nombre"
                  value={formGeneral.nombre_lotificacion}
                  onChange={(e) => setFormGeneral({ ...formGeneral, nombre_lotificacion: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación *</Label>
                <Input
                  id="ubicacion"
                  value={formGeneral.ubicacion}
                  onChange={(e) => setFormGeneral({ ...formGeneral, ubicacion: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formGeneral.descripcion}
                onChange={(e) => setFormGeneral({ ...formGeneral, descripcion: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección Completa *</Label>
              <Input
                id="direccion"
                value={formGeneral.direccion_completa}
                onChange={(e) => setFormGeneral({ ...formGeneral, direccion_completa: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={formGeneral.telefono}
                  onChange={(e) => setFormGeneral({ ...formGeneral, telefono: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formGeneral.email}
                  onChange={(e) => setFormGeneral({ ...formGeneral, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sitio_web">Sitio Web</Label>
              <Input
                id="sitio_web"
                value={formGeneral.sitio_web}
                onChange={(e) => setFormGeneral({ ...formGeneral, sitio_web: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formGeneral.fecha_inicio}
                  onChange={(e) => setFormGeneral({ ...formGeneral, fecha_inicio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_lotes">Total de Lotes *</Label>
                <Input
                  id="total_lotes"
                  type="number"
                  value={formGeneral.total_lotes}
                  onChange={(e) => setFormGeneral({ ...formGeneral, total_lotes: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_total">Área Total (m²) *</Label>
                <Input
                  id="area_total"
                  type="number"
                  step="0.01"
                  value={formGeneral.area_total}
                  onChange={(e) => setFormGeneral({ ...formGeneral, area_total: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasa_anual">Tasa Anual (%) *</Label>
              <Input
                id="tasa_anual"
                type="number"
                step="0.01"
                value={formGeneral.tasa_anual}
                onChange={(e) => setFormGeneral({ ...formGeneral, tasa_anual: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formGeneral.activo}
                onCheckedChange={(checked) => setFormGeneral({ ...formGeneral, activo: checked })}
              />
              <Label htmlFor="activo">Configuración Activa</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGeneralDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Configuración Financiera */}
      <Dialog open={isFinancieraDialogOpen} onOpenChange={setIsFinancieraDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {configuracionFinanciera ? 'Editar Configuración Financiera' : 'Crear Configuración Financiera'}
            </DialogTitle>
            <DialogDescription>
              {configuracionFinanciera ? 'Modifica los parámetros financieros' : 'Crea una nueva configuración financiera'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitFinanciera} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plazo_minimo">Plazo Mínimo (meses) *</Label>
                <Input
                  id="plazo_minimo"
                  type="number"
                  value={formFinanciera.plazo_minimo_meses}
                  onChange={(e) => setFormFinanciera({ ...formFinanciera, plazo_minimo_meses: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plazo_maximo">Plazo Máximo (meses) *</Label>
                <Input
                  id="plazo_maximo"
                  type="number"
                  value={formFinanciera.plazo_maximo_meses}
                  onChange={(e) => setFormFinanciera({ ...formFinanciera, plazo_maximo_meses: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enganche_minimo">Enganche Mínimo (%) *</Label>
                <Input
                  id="enganche_minimo"
                  type="number"
                  step="0.01"
                  value={formFinanciera.enganche_minimo_porcentaje}
                  onChange={(e) => setFormFinanciera({ ...formFinanciera, enganche_minimo_porcentaje: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enganche_maximo">Enganche Máximo (%) *</Label>
                <Input
                  id="enganche_maximo"
                  type="number"
                  step="0.01"
                  value={formFinanciera.enganche_maximo_porcentaje}
                  onChange={(e) => setFormFinanciera({ ...formFinanciera, enganche_maximo_porcentaje: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costo_instalacion">Costo de Instalación Default (Q) *</Label>
              <Input
                id="costo_instalacion"
                type="number"
                step="0.01"
                value={formFinanciera.costo_instalacion_default}
                onChange={(e) => setFormFinanciera({ ...formFinanciera, costo_instalacion_default: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="penalizacion">Penalización por Atraso (%) *</Label>
              <Input
                id="penalizacion"
                type="number"
                step="0.01"
                value={formFinanciera.penalizacion_atraso_porcentaje}
                onChange={(e) => setFormFinanciera({ ...formFinanciera, penalizacion_atraso_porcentaje: e.target.value })}
                required
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="pagos_anticipados"
                  checked={formFinanciera.permitir_pagos_anticipados}
                  onCheckedChange={(checked) => setFormFinanciera({ ...formFinanciera, permitir_pagos_anticipados: checked })}
                />
                <Label htmlFor="pagos_anticipados">Permitir pagos anticipados</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="penalizacion_atrasos"
                  checked={formFinanciera.aplicar_penalizacion_atrasos}
                  onCheckedChange={(checked) => setFormFinanciera({ ...formFinanciera, aplicar_penalizacion_atrasos: checked })}
                />
                <Label htmlFor="penalizacion_atrasos">Aplicar penalización por atrasos</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFinancieraDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tab de Plano Interactivo */}
      <TabsContent value="plano" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Plano Interactivo de Lotificación</CardTitle>
                <CardDescription>
                  Carga un archivo SVG y visualiza los lotes de forma interactiva
                </CardDescription>
              </div>
              <div>
                <input
                  type="file"
                  id="svg-upload"
                  accept=".svg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSvgFile(file)
                      setIsUploadingSvg(true)
                      try {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          const content = event.target?.result as string
                          setSvgContent(content)
                          setIsUploadingSvg(false)
                        }
                        reader.readAsText(file)
                      } catch (error) {
                        console.error("Error cargando SVG:", error)
                        setIsUploadingSvg(false)
                      }
                    }
                  }}
                  className="hidden"
                />
                <Label htmlFor="svg-upload">
                  <Button variant="outline" asChild>
                    <span>
                      {isUploadingSvg ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {svgContent ? "Cambiar SVG" : "Cargar SVG"}
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <InteractiveSVGViewer
              svgContent={svgContent}
              onLoteClick={(loteId) => {
                console.log("Lote clickeado:", loteId)
              }}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  )
}
