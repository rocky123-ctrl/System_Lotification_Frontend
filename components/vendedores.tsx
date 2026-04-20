"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { Search, Loader2, Edit, Trash2, Users, FileQuestion, Info, CheckCircle2, Mail, Phone, XCircle, ShieldCheck, UserCheck } from "lucide-react"
import { empleadosService, type Empleado } from "@/lib/empleados-service"
import { RegistroEmpleadoModal } from "@/components/registro-empleado-modal"
import { EditarEmpleadoModal } from "@/components/editar-empleado-modal"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export function Empleados() {
  // Common UI states
  const ITEMS_PER_PAGE = 8
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null)

  // Administrators State
  const [admins, setAdmins] = useState<Empleado[]>([])
  const [adminsLoading, setAdminsLoading] = useState(true)
  const [adminsCount, setAdminsCount] = useState(0)
  const [adminsSearch, setAdminsSearch] = useState("")
  const [adminsPage, setAdminsPage] = useState(1)

  // Sellers State
  const [vendedores, setVendedores] = useState<Empleado[]>([])
  const [vendedoresLoading, setVendedoresLoading] = useState(true)
  const [vendedoresCount, setVendedoresCount] = useState(0)
  const [vendedoresSearch, setVendedoresSearch] = useState("")
  const [vendedoresPage, setVendedoresPage] = useState(1)

  const fetchAdmins = useCallback(async () => {
    setAdminsLoading(true)
    try {
      const response = await empleadosService.getEmpleados({
        rol: "Administrador",
        search: adminsSearch,
        page: adminsPage
      })
      setAdmins(response.results)
      setAdminsCount(response.count)
    } catch (err) {
      console.error("Error loading admins:", err)
    } finally {
      setAdminsLoading(false)
    }
  }, [adminsSearch, adminsPage])

  const fetchVendedores = useCallback(async () => {
    setVendedoresLoading(true)
    try {
      const response = await empleadosService.getEmpleados({
        rol: "Vendedor",
        search: vendedoresSearch,
        page: vendedoresPage
      })
      setVendedores(response.results)
      setVendedoresCount(response.count)
    } catch (err) {
      console.error("Error loading sellers:", err)
    } finally {
      setVendedoresLoading(false)
    }
  }, [vendedoresSearch, vendedoresPage])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  useEffect(() => {
    fetchVendedores()
  }, [fetchVendedores])

  const reloadAll = () => {
    fetchAdmins()
    fetchVendedores()
  }

  const handleEditClick = (u: Empleado) => {
    setSelectedEmpleado(u)
    setShowEdit(true)
  }

  const handleDeleteClick = (u: Empleado) => {
    setSelectedEmpleado(u)
    setShowDelete(true)
  }

  const formatDate = (s: string) => {
    if (!s) return "—"
    try {
      return new Date(s).toLocaleDateString("es-GT", { dateStyle: "short" })
    } catch {
      return "—"
    }
  }

  const renderTable = (
    data: Empleado[],
    loading: boolean,
    count: number,
    page: number,
    setPage: (p: number) => void,
    title: string,
    description: string,
    search: string,
    setSearch: (s: string) => void,
    icon: React.ReactNode
  ) => {
    const totalPages = Math.ceil(count / ITEMS_PER_PAGE)
    const startIndex = (page - 1) * ITEMS_PER_PAGE + 1
    const endIndex = Math.min(page * ITEMS_PER_PAGE, count)

    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-xl">{title}</CardTitle>
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="h-fit py-1 px-3 bg-white dark:bg-slate-950 font-bold">
            {count} Registros
          </Badge>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative group mb-6">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={`Buscar en ${title}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1) // Reset to first page on search
              }}
              className="pl-11 h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Colaborador</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Identificación</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Información de Contacto</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Estado</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Vinculación</TableHead>
                  <TableHead className="w-24 text-right pr-6 font-bold text-slate-700 dark:text-slate-300">Gestión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-muted-foreground animate-pulse">Sincronizando datos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4">
                        <FileQuestion className="h-10 w-10 text-slate-300" />
                        <p className="text-muted-foreground">No se encontraron registros activos.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((u, index) => (
                    <TableRow key={u.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 40}ms` }}>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                            {u.nombre[0]}{u.apellido ? u.apellido[0] : ""}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                              {u.nombre} {u.apellido || ""}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[150px]">
                              {u.username || "—"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-700 dark:text-slate-300">{u.dpi || "—"}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">DPI Oficial</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1 text-sm">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <Mail className="h-3 w-3" /> {u.correo || "—"}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="h-3 w-3" /> {u.telefono || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`
                            px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${u.estado 
                               ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" 
                               : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"}
                          `}
                        >
                          {u.estado ? "Activo" : "Suspendido"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                        <div className="font-medium">{formatDate(u.fecha_contratacion)}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Contratación</div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => handleEditClick(u)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteClick(u)}>
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

          {!loading && count > 0 && (
            <div className="mt-6 border-t pt-4">
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={count}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
                onItemsPerPageChange={() => {}} // Fixed at 8
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Panel de Colaboradores</h1>
          </div>
          <p className="text-muted-foreground text-lg pl-11">
            Gestión interna dividida por niveles jerárquicos y roles operativos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RegistroEmpleadoModal onCreated={reloadAll} />
        </div>
      </div>

      {/* Table Administradores */}
      <div className="space-y-4">
        {renderTable(
          admins,
          adminsLoading,
          adminsCount,
          adminsPage,
          setAdminsPage,
          "Administradores",
          "Visualización del personal con acceso a nivel gestión y configuración.",
          adminsSearch,
          setAdminsSearch,
          <ShieldCheck className="h-5 w-5 text-indigo-500" />
        )}
      </div>

      {/* Table Vendedores */}
      <div className="space-y-4">
        {renderTable(
          vendedores,
          vendedoresLoading,
          vendedoresCount,
          vendedoresPage,
          setVendedoresPage,
          "Fuerza de Ventas",
          "Monitoreo de agentes encargados de la comercialización de lotes.",
          vendedoresSearch,
          setVendedoresSearch,
          <UserCheck className="h-5 w-5 text-emerald-500" />
        )}
      </div>

      {/* Shared Modals */}
      <EditarEmpleadoModal
        empleado={selectedEmpleado}
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false)
          setSelectedEmpleado(null)
        }}
        onUpdated={reloadAll}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="overflow-hidden border-none shadow-2xl">
          <AlertDialogHeader className="p-6 pb-0">
            <div className="p-3 bg-destructive/10 w-fit rounded-full mb-4">
              <Trash2 className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Eliminar colaborador</AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              ¿Está seguro que desea eliminar a <strong className="text-foreground">{selectedEmpleado?.nombre} {selectedEmpleado?.apellido}</strong>? 
              <span className="block mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-sm font-medium">
                Esta acción es irreversible y eliminará también el acceso del usuario al sistema.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="bg-slate-50 dark:bg-slate-950 px-6 py-4 mt-6 border-t flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={async () => {
                if (selectedEmpleado) {
                  try {
                    await empleadosService.eliminarEmpleado(selectedEmpleado.id)
                    reloadAll()
                  } catch (e) {
                    console.error("Error eliminando empleado", e)
                  }
                }
                setShowDelete(false)
                setSelectedEmpleado(null)
              }}
            >
              Sí, eliminar registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
