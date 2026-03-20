import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function CuentasPorCobrarPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cuentas por Cobrar (Mensualidad)</h1>
            <p className="text-muted-foreground mt-2">Gestiona y monitorea las cuotas mensuales de los clientes</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                En Construcción
              </CardTitle>
              <CardDescription>Esta sección está siendo desarrollada</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aquí podrás ver y gestionar todas las cuentas por cobrar de los clientes, incluyendo:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Listado de cuotas pendientes</li>
                <li>Historial de pagos</li>
                <li>Alertas de pagos atrasados</li>
                <li>Registrar nuevos pagos</li>
                <li>Generar reportes de cobranza</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
