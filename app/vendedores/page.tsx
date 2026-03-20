import { DashboardLayout } from "@/components/dashboard-layout"
import { Empleados as EmpleadosComponent } from "@/components/vendedores"
import ProtectedRoute from "@/components/protected-route"

export default function EmpleadosPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <EmpleadosComponent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

