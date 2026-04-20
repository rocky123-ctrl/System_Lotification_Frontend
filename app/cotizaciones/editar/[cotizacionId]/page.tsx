import { DashboardLayout } from "@/components/dashboard-layout"
import { CotizacionForm } from "@/components/cotizacion-form"
import ProtectedRoute from "@/components/protected-route"

export default function EditarCotizacionPage({ params }: { params: { cotizacionId: string } }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CotizacionForm cotizacionId={params.cotizacionId} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
