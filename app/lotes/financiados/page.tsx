import { DashboardLayout } from "@/components/dashboard-layout"
import { LotesFinanciados } from "@/components/lotes-financiados"
import ProtectedRoute from "@/components/protected-route"

export default function LotesFinanciadosPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <LotesFinanciados />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
