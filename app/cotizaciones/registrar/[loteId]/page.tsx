import { DashboardLayout } from "@/components/dashboard-layout"
import { CotizacionForm } from "@/components/cotizacion-form"
import ProtectedRoute from "@/components/protected-route"

export default function RegistrarCotizacionPage({ params }: { params: { loteId: string } }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CotizacionForm loteId={params.loteId} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
