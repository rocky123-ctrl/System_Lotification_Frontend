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
import { Trash2, AlertCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export default function RegistrarClientePage() {
  const { user } = useAuth()
  const isSuperadmin = user?.role === 'Superadmin' || user?.role === 'Administrador' || user?.isSuperuser
  
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
  const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('activo')

  const loadData = async (page: number = 1, search = searchQuery, status = statusFilter) => {
    try {
      const [statsData, clientesData] = await Promise.all([
        getClientesStats(),
        getClientes(page, 10, search, status)
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
      setIsDeleting(true)
      await eliminarCliente(clienteToDelete.id)
      loadData(currentPage)
      setShowDeleteDialog(false)
      setClienteToDelete(null)
    } catch (error: any) {
      console.error('Error deleting cliente:', error)
      setShowDeleteDialog(false)
      
      // Si el error es un ProtectedError o 500 (restricciones de base de datos)
      if (error.status === 500 || error.message?.includes('500') || 
          (typeof error.data === 'string' && error.data.includes('ProtectedError')) ||
          (error.data && typeof error.data === 'object')) {
        setShowForceDeleteDialog(true)
      } else {
        alert('Error al intentar eliminar el cliente. Verifica si tiene datos relacionados.')
        setClienteToDelete(null)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmForceDelete = async () => {
    if (!clienteToDelete) return

    try {
      setIsDeleting(true)
      await eliminarCliente(clienteToDelete.id, true)
      loadData(currentPage)
      setShowForceDeleteDialog(false)
      setClienteToDelete(null)
    } catch (error: any) {
      console.error('Error force deleting cliente:', error)
      alert('Ocurrió un error al intentar forzar la eliminación del cliente y liberar los datos.')
      setShowForceDeleteDialog(false)
      setClienteToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePageChange = (page: number) => {
    loadData(page)
  }

  const handleSearch = () => {
    loadData(1, searchQuery, statusFilter)
  }

  const handleStatusChange = (val: string) => {
    setStatusFilter(val)
    loadData(1, searchQuery, val)
  }

  if (loading) {
    return (
      <ProtectedRoute>
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
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Sección Superior: Estadísticas */}
          <div>
            <h1 className="text-3xl font-bold mb-4">Gestión de Clientes</h1>
            <ClientesStats stats={stats} />
          </div>

          {/* Botón para Registrar Cliente y Filtros */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <RegistroClienteModal onClienteRegistrado={handleClienteRegistrado} />
            
            <div className="flex w-full md:w-auto items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar clientes..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" onClick={handleSearch}>
                Buscar
              </Button>
            </div>
          </div>

          {/* Sección Inferior: Lista de Clientes */}
          <ClientesList
            clientes={clientes}
            total={total}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canDelete={isSuperadmin}
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
                <AlertDialogTitle>¿Estás seguro de eliminar este cliente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente
                  <strong> {clienteToDelete?.nombres} {clienteToDelete?.apellidos}</strong> y <strong>TODOS sus registros asociados en cascada</strong> (ventas, pagos, servicios contratados, historial).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Diálogo de Confirmación de Eliminación Forzada */}
          <AlertDialog open={showForceDeleteDialog} onOpenChange={setShowForceDeleteDialog}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Se encontraron datos relacionados
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base text-foreground/90 mt-4 leading-relaxed">
                  ¿Desea seguro borrar a este cliente? 
                  <br /><br />
                  Todos sus datos de propiedades, pagos, historial, etc. serán borrados y se liberarán los datos de los lotes relacionados a este cliente para dejarlos nuevamente disponibles.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmForceDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 font-semibold">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Procesando...' : 'Sí, borrar definitivamente'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}