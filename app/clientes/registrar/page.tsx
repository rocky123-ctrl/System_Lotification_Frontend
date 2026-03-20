"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { ClientesStats } from "@/components/clientes-stats"
import { ClientesList } from "@/components/clientes-list"
import { RegistroClienteModal } from "@/components/registro-cliente-modal"
import { EditarClienteModal } from "@/components/editar-cliente-modal"
import { getClientesStats, getClientes, eliminarCliente, Cliente, ClientesStats as StatsType } from "@/lib/clientes-service"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

export default function RegistrarClientePage() {
  const [stats, setStats] = useState<StatsType>({ activos: 0, inactivos: 0, total: 0 })
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const loadData = async (page: number = 1) => {
    try {
      const [statsData, clientesData] = await Promise.all([
        getClientesStats(),
        getClientes(page, 10)
      ])
      setStats(statsData)
      setClientes(clientesData.clientes)
      setTotal(clientesData.total)
      setTotalPages(clientesData.pages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading data:', error)
      // Fallback data for demo
      setStats({ activos: 5, inactivos: 2, total: 7 })
      setClientes([
        {
          id: 1,
          nombres: 'Juan Carlos',
          apellidos: 'Pérez García',
          telefono: '71234567',
          email: 'juan@example.com',
          direccion: 'Zona 15, Ciudad de Guatemala',
          estado: 'activo',
          fechaRegistro: '2024-01-15'
        },
        {
          id: 2,
          nombres: 'María Elena',
          apellidos: 'García López',
          telefono: '79876543',
          email: 'maria@example.com',
          direccion: 'Zona 10, Ciudad de Guatemala',
          estado: 'activo',
          fechaRegistro: '2024-02-20'
        }
      ])
      setTotal(2)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleClienteRegistrado = () => {
    loadData(currentPage)
  }

  const handleClienteActualizado = () => {
    loadData(currentPage)
  }

  const handleEdit = (cliente: Cliente) => {
    setClienteToEdit(cliente)
    setShowEditModal(true)
  }

  const handleDelete = (cliente: Cliente) => {
    setClienteToDelete(cliente)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!clienteToDelete) return

    try {
      await eliminarCliente(clienteToDelete.id)
      loadData(currentPage)
      setShowDeleteDialog(false)
      setClienteToDelete(null)
    } catch (error) {
      console.error('Error deleting cliente:', error)
    }
  }

  const handlePageChange = (page: number) => {
    loadData(page)
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Sección Superior: Estadísticas */}
          <div>
            <h1 className="text-3xl font-bold mb-4">Gestión de Clientes</h1>
            <ClientesStats stats={stats} />
          </div>

          {/* Botón para Registrar Cliente */}
          <RegistroClienteModal onClienteRegistrado={handleClienteRegistrado} />

          {/* Sección Inferior: Lista de Clientes */}
          <ClientesList
            clientes={clientes}
            total={total}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {/* Modal de Edición */}
          <EditarClienteModal
            cliente={clienteToEdit}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onClienteActualizado={handleClienteActualizado}
          />

          {/* Diálogo de Confirmación de Eliminación */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente
                  <strong> {clienteToDelete?.nombres} {clienteToDelete?.apellidos}</strong> y todos sus datos asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}