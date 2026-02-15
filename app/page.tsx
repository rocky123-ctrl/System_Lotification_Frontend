import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminDashboard } from "@/components/admin-dashboard"
import ProtectedRoute from "@/components/protected-route"

export default function HomePage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
