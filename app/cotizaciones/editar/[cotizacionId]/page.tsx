import { DashboardLayout } from "@/components/dashboard-layout"
import { CotizacionForm } from "@/components/cotizacion-form"
import ProtectedRoute from "@/components/protected-route"

export default async function EditarCotizacionPage({ params }: { params: Promise<{ cotizacionId: string }> }) {
  const { cotizacionId } = await params;
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CotizacionForm cotizacionId={cotizacionId} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
