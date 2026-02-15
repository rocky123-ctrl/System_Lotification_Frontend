import { DashboardLayout } from "@/components/dashboard-layout"
import { SistemaReporteria } from "@/components/sistema-reporteria"
import ProtectedRoute from "@/components/protected-route"

export default function ReportesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SistemaReporteria />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
