import { DashboardLayout } from "@/components/dashboard-layout"
import { CotizacionForm } from "@/components/cotizacion-form"
import ProtectedRoute from "@/components/protected-route"

export default async function RegistrarCotizacionPage({ params }: { params: Promise<{ loteId: string }> }) {
  const { loteId } = await params;
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <CotizacionForm loteId={loteId} />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
