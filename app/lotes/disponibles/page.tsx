import { DashboardLayout } from "@/components/dashboard-layout"
import { LotesDisponibles } from "@/components/lotes-disponibles"
import ProtectedRoute from "@/components/protected-route"

export default function LotesDisponiblesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <LotesDisponibles />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
