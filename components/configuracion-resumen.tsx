"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, DollarSign, MapPin, Calendar, Users, BarChart3, Settings } from "lucide-react"
import { useConfiguracion } from "@/hooks/use-configuracion"
import { formatearPorcentaje, formatearMoneda, formatearTasaMensual } from "@/lib/configuracion-service"
import Link from "next/link"

export function ConfiguracionResumen() {
  const { configuracionActiva, configuracionResumen, configuracionFinanciera, isLoading } = useConfiguracion()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Cargando configuración...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!configuracionActiva) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del Sistema
          </CardTitle>
          <CardDescription>No hay configuración activa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">No se ha configurado el sistema</p>
            <Link href="/configuracion">
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Sistema
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {configuracionActiva.nombre_lotificacion}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {configuracionActiva.ubicacion}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{configuracionActiva.total_lotes}</div>
              <div className="text-sm text-muted-foreground">Total de Lotes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {configuracionResumen?.lotes_disponibles || 0}
              </div>
              <div className="text-sm text-muted-foreground">Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {configuracionResumen?.lotes_vendidos || 0}
              </div>
              <div className="text-sm text-muted-foreground">Vendidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatearPorcentaje(configuracionActiva.tasa_anual)}
              </div>
              <div className="text-sm text-muted-foreground">Tasa Anual</div>
              <div className="text-xs text-muted-foreground">
                {formatearTasaMensual(configuracionActiva.tasa_anual)}
              </div>
            </div>
          </div>

          {/* Estados adicionales si existen */}
          {configuracionResumen && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Otros Estados:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">{configuracionResumen.lotes_reservados || 0}</div>
                  <div className="text-sm text-muted-foreground">Reservados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-indigo-600">{configuracionResumen.lotes_financiados || 0}</div>
                  <div className="text-sm text-muted-foreground">Financiados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{configuracionResumen.lotes_en_proceso || 0}</div>
                  <div className="text-sm text-muted-foreground">En Proceso</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{configuracionResumen.lotes_cancelados || 0}</div>
                  <div className="text-sm text-muted-foreground">Cancelados</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración Financiera */}
      {configuracionFinanciera && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Configuración Financiera
            </CardTitle>
            <CardDescription>Parámetros para el cálculo de cuotas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{configuracionFinanciera.plazo_minimo_meses} - {configuracionFinanciera.plazo_maximo_meses}</div>
                <div className="text-sm text-muted-foreground">Plazo (meses)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {formatearPorcentaje(configuracionFinanciera.enganche_minimo_porcentaje)} - {formatearPorcentaje(configuracionFinanciera.enganche_maximo_porcentaje)}
                </div>
                <div className="text-sm text-muted-foreground">Enganche</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {formatearMoneda(configuracionFinanciera.costo_instalacion_default)}
                </div>
                <div className="text-sm text-muted-foreground">Instalación</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {formatearPorcentaje(configuracionFinanciera.penalizacion_atraso_porcentaje)}
                </div>
                <div className="text-sm text-muted-foreground">Penalización</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/configuracion">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Gestionar Configuración
              </Button>
            </Link>
            <Link href="/lotes/disponibles">
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Ver Lotes Disponibles
              </Button>
            </Link>
            <Link href="/lotes/financiados">
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Ver Lotes Financiados
              </Button>
            </Link>
            <Link href="/reportes">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Reportes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
