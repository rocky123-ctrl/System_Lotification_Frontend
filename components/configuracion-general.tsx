"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Upload, Save, Download, Database, Building2, MapPin, Phone, FileImage, Trash2 } from "lucide-react"

interface ConfiguracionData {
  nombre: string
  logo: string | null
  descripcion: string
  direccion: string
  telefono: string
  email: string
  sitioWeb: string
  fechaInicio: string
  totalLotes: number
  areaTotalM2: number
  ubicacion: string
}

export function ConfiguracionGeneral() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionData>({
    nombre: "Lotificación San Carlos",
    logo: null,
    descripcion: "Proyecto residencial con lotes de alta calidad en zona privilegiada",
    direccion: "Km 25 Carretera a El Salvador, Guatemala",
    telefono: "+502 2234-5678",
    email: "info@lotificacionsancarlos.com",
    sitioWeb: "www.lotificacionsancarlos.com",
    fechaInicio: "2024-01-15",
    totalLotes: 96,
    areaTotalM2: 15000,
    ubicacion: "Villa Nueva, Guatemala",
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleInputChange = (field: keyof ConfiguracionData, value: string | number) => {
    setConfiguracion((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoPreview(result)
        setConfiguracion((prev) => ({
          ...prev,
          logo: result,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setConfiguracion((prev) => ({
      ...prev,
      logo: null,
    }))
  }

  const handleSave = () => {
    console.log("[v0] Guardando configuración:", configuracion)
    // TODO: Implementar llamada a API para guardar configuración
    alert("Configuración guardada exitosamente")
  }

  const handleBackup = () => {
    console.log("[v0] Iniciando backup del sistema")
    // TODO: Implementar llamada a API para generar backup
    alert("Backup iniciado. Se notificará cuando esté listo para descargar.")
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(configuracion, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `configuracion-${configuracion.nombre.toLowerCase().replace(/\s+/g, "-")}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración General</h1>
          <p className="text-muted-foreground">Administra la información general de tu lotificación</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Config
          </Button>
          <Button onClick={handleSave} className="bg-primary">
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información General */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información General
              </CardTitle>
              <CardDescription>Datos básicos de la lotificación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre de la Lotificación</Label>
                  <Input
                    id="nombre"
                    value={configuracion.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    placeholder="Ej: Lotificación San Carlos"
                  />
                </div>
                <div>
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={configuracion.ubicacion}
                    onChange={(e) => handleInputChange("ubicacion", e.target.value)}
                    placeholder="Ej: Villa Nueva, Guatemala"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={configuracion.descripcion}
                  onChange={(e) => handleInputChange("descripcion", e.target.value)}
                  placeholder="Descripción del proyecto..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="direccion">Dirección Completa</Label>
                <Input
                  id="direccion"
                  value={configuracion.direccion}
                  onChange={(e) => handleInputChange("direccion", e.target.value)}
                  placeholder="Dirección completa del proyecto"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={configuracion.telefono}
                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                    placeholder="+502 2234-5678"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={configuracion.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="info@lotificacion.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sitioWeb">Sitio Web</Label>
                <Input
                  id="sitioWeb"
                  value={configuracion.sitioWeb}
                  onChange={(e) => handleInputChange("sitioWeb", e.target.value)}
                  placeholder="www.lotificacion.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Datos del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={configuracion.fechaInicio}
                    onChange={(e) => handleInputChange("fechaInicio", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="totalLotes">Total de Lotes</Label>
                  <Input
                    id="totalLotes"
                    type="number"
                    value={configuracion.totalLotes}
                    onChange={(e) => handleInputChange("totalLotes", Number.parseInt(e.target.value) || 0)}
                    placeholder="96"
                  />
                </div>
                <div>
                  <Label htmlFor="areaTotalM2">Área Total (m²)</Label>
                  <Input
                    id="areaTotalM2"
                    type="number"
                    value={configuracion.areaTotalM2}
                    onChange={(e) => handleInputChange("areaTotalM2", Number.parseInt(e.target.value) || 0)}
                    placeholder="15000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logo y Backup */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Logo de la Lotificación
              </CardTitle>
              <CardDescription>Sube el logo que aparecerá en reportes y documentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoPreview || configuracion.logo ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={logoPreview || configuracion.logo || ""}
                        alt="Logo preview"
                        className="h-32 w-32 object-contain border border-border rounded-lg bg-muted"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-full justify-center">
                    Logo cargado
                  </Badge>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No hay logo cargado</p>
                </div>
              )}

              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview || configuracion.logo ? "Cambiar Logo" : "Subir Logo"}
                    </span>
                  </Button>
                </Label>
                <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Respaldo de Datos
              </CardTitle>
              <CardDescription>Administra los respaldos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Último respaldo</p>
                    <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("es-GT")} - 14:30</p>
                  </div>
                  <Badge variant="outline">Automático</Badge>
                </div>

                <Button onClick={handleBackup} variant="outline" className="w-full bg-transparent">
                  <Database className="h-4 w-4 mr-2" />
                  Crear Respaldo Manual
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Los respaldos automáticos se crean diariamente</p>
                  <p>• Se conservan los últimos 30 respaldos</p>
                  <p>• Incluye todos los datos de lotes y configuración</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Lotes</span>
                <Badge variant="secondary">{configuracion.totalLotes}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Área Total</span>
                <Badge variant="secondary">{configuracion.areaTotalM2.toLocaleString()} m²</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Días Activo</span>
                <Badge variant="secondary">
                  {Math.floor(
                    (new Date().getTime() - new Date(configuracion.fechaInicio).getTime()) / (1000 * 60 * 60 * 24),
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
