import { DashboardLayout } from "@/components/dashboard-layout"
import { Lotes } from "@/components/lotes"
import ProtectedRoute from "@/components/protected-route"

export default function LotesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Lotes />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

