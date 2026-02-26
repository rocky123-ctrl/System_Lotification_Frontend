"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PlanoInteractivo } from "@/components/PlanoInteractivo"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PlanoLotificacionPage() {
  const params = useParams()
  const id = params?.id ? Number(params.id) : null

  if (id == null || Number.isNaN(id)) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">ID de lotificación no válido.</p>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/lotes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Regresar
              </Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Plano interactivo</CardTitle>
              <CardDescription>
                Haz clic en un lote del plano para ver su información. Si no tiene datos guardados, puedes registrarlo con «Registrar este lote nuevo».
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanoInteractivo lotificacionId={id} className="rounded-lg border bg-muted/20 p-2" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
