import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { VentaForm } from "@/components/venta-form"

export default async function EditarVentaPage({ params }: { params: Promise<{ ventaId: string }> }) {
  const { ventaId } = await params
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
           <VentaForm ventaId={ventaId} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
