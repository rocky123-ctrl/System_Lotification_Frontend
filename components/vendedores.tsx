"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { Search, Filter, Download, Loader2, Edit, Trash2 } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { empleadosService, type Empleado } from "@/lib/empleados-service"
import { RegistroEmpleadoModal } from "@/components/registro-empleado-modal"
import { EditarEmpleadoModal } from "@/components/editar-empleado-modal"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export function Empleados() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState<"all" | "activo" | "inactivo">("all")
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI states for create/edit/delete
  // UI states for editing/deleting employees
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null)

  const handleEditClick = (u: Empleado) => {
    setSelectedEmpleado(u)
    setShowEdit(true)
  }

  const handleDeleteClick = (u: Empleado) => {
    setSelectedEmpleado(u)
    setShowDelete(true)
  }

  const loadEmpleados = () => {
    let cancelled = false
    setLoading(true)
    setError(null)
    empleadosService
      .getEmpleados()
      .then((data) => {
        if (!cancelled) setEmpleados(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar los vendedores.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }

  useEffect(() => {
    const cleanup = loadEmpleados()
    return cleanup
  }, [])

  // Filtrar empleados (client-side)
  const filteredEmpleados = empleados.filter((u) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !term ||
      (u.nombre || "").toLowerCase().includes(term) ||
      (u.apellido || "").toLowerCase().includes(term) ||
      (u.correo || "").toLowerCase().includes(term) ||
      (u.telefono || "").toLowerCase().includes(term) ||
      (u.dpi || "").toLowerCase().includes(term)
    const estado = u.estado ? "activo" : "inactivo"
    const matchesEstado = filterEstado === "all" || estado === filterEstado
    return matchesSearch && matchesEstado
  })

  const {
    currentData: paginatedVendedores,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    setItemsPerPage,
  } = usePagination({
    data: filteredEmpleados,
    itemsPerPage: 10,
  })

  const formatDate = (s: string) => {
    if (!s) return "—"
    try {
      return new Date(s).toLocaleDateString("es-GT", { dateStyle: "short" })
    } catch {
      return "—"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Cargando empleados...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
        <Card className="border-destructive">
          <CardContent className="py-6">
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Los empleados son usuarios con rol &quot;Vendedor&quot;. Asígnelo desde el módulo de usuarios/permisos.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
          <p className="text-muted-foreground">
            Gestión interna de empleados de la empresa
          </p>
        </div>
        <div>
          {/* the modal component includes its own trigger button */}
          <RegistroEmpleadoModal onCreated={loadEmpleados} />
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>Busca y filtra los empleados registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, apellido, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={filterEstado} onValueChange={(v) => setFilterEstado(v as "all" | "activo" | "inactivo")}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>

          {/* Tabla */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre y Apellido</TableHead>
                  <TableHead>DPI / Rol</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Contratación</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVendedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {empleados.length === 0
                        ? "No hay empleados registrados."
                        : "No hay resultados con los filtros aplicados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVendedores.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.nombre} {u.apellido || ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div>{u.dpi || "—"}</div>
                        <div className="text-xs">{u.rol}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>{u.correo || "—"}</div>
                          <div className="text-muted-foreground">{u.telefono || "—"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{u.direccion || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={u.estado ? "default" : "secondary"}>
                          {u.estado ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(u.fecha_contratacion)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(u)}
                            aria-label="Editar empleado"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(u)}
                            aria-label="Eliminar empleado"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {paginatedVendedores.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={goToPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit modal and delete confirmation dialog outside of table/container */}
      <EditarEmpleadoModal
        empleado={selectedEmpleado}
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false)
          setSelectedEmpleado(null)
        }}
        onUpdated={() => {
          loadEmpleados()
        }}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar empleado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar al empleado{' '}
              <strong>{selectedEmpleado?.nombre} {selectedEmpleado?.apellido}</strong>?
              Esta acción no podrá deshacerse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white"
              onClick={async () => {
                if (selectedEmpleado) {
                  try {
                    await empleadosService.eliminarEmpleado(selectedEmpleado.id)
                    loadEmpleados()
                  } catch (e) {
                    console.error("Error eliminando empleado", e)
                  }
                }
                setShowDelete(false)
                setSelectedEmpleado(null)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

