import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { Cliente } from "@/lib/clientes-service"
import { Pagination } from "@/components/pagination"

interface ClientesListProps {
  clientes: Cliente[]
  total: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
}

export function ClientesList({ clientes, total, currentPage, totalPages, onPageChange, onEdit, onDelete }: ClientesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Clientes Registrados ({total} total)</CardTitle>
      </CardHeader>
      <CardContent>
        {clientes.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay clientes registrados aún.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nombres</th>
                    <th className="text-left p-2">Apellidos</th>
                    <th className="text-left p-2">Teléfono</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Dirección</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Fecha Registro</th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{cliente.nombres}</td>
                      <td className="p-2">{cliente.apellidos}</td>
                      <td className="p-2">{cliente.telefono || '-'}</td>
                      <td className="p-2">{cliente.email || '-'}</td>
                      <td className="p-2 max-w-xs truncate" title={cliente.direccion}>{cliente.direccion}</td>
                      <td className="p-2">
                        <Badge variant={cliente.estado === 'activo' ? 'default' : 'secondary'}>
                          {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="p-2">{new Date(cliente.fechaRegistro).toLocaleDateString()}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(cliente)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(cliente)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}