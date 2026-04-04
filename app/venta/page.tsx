import { DashboardLayout } from "@/components/dashboard-layout"
import { Ventas } from "@/components/ventas"
import ProtectedRoute from "@/components/protected-route"

export default function VentaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Ventas />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
