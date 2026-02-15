import { DashboardLayout } from "@/components/dashboard-layout"
import { LotesReservados } from "@/components/lotes-reservados"
import ProtectedRoute from "@/components/protected-route"

export default function LotesReservadosPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <LotesReservados />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
