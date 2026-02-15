import { DashboardLayout } from "@/components/dashboard-layout"
import { LotesPagados } from "@/components/lotes-pagados"
import ProtectedRoute from "@/components/protected-route"

export default function LotesPagadosPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <LotesPagados />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
