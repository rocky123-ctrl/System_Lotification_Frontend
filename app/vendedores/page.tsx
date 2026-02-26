import { DashboardLayout } from "@/components/dashboard-layout"
import { Vendedores } from "@/components/vendedores"
import ProtectedRoute from "@/components/protected-route"

export default function VendedoresPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Vendedores />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

