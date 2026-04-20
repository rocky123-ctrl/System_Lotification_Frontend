import { DashboardLayout } from "@/components/dashboard-layout"
import { Cotizaciones } from "@/components/cotizaciones"
import ProtectedRoute from "@/components/protected-route"

export default function CotizacionesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Cotizaciones />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
