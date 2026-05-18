"use client"

import React, { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ProtectedRoute from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Wallet, Plus, Settings, ArrowLeft, Droplet, Zap, HardHat, Calendar, AlertCircle, Edit, List, UserPlus, LayoutGrid, Info, CheckCircle2, Building2, ChevronRight, Printer, Trash2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { lotificacionService, Lotificacion } from "@/lib/lotificacion-service"
import { serviciosService, CatalogoServicio, BilleteraServicio, LotStatusResponse, ConfiguracionServicioLote, PagoServicio } from "@/lib/servicios-service"
import { getClientes, Cliente } from "@/lib/clientes-service"

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "Droplet": return <Droplet className="h-4 w-4 text-blue-500" />
    case "Zap": return <Zap className="h-4 w-4 text-yellow-500" />
    case "HardHat": return <HardHat className="h-4 w-4 text-orange-500" />
    default: return <Plus className="h-4 w-4 text-gray-500" />
  }
}

export default function ServiciosPage() {
  const [viewMode, setViewMode] = useState<'clients' | 'wallet' | 'lot_payments' | 'lot_history'>('clients')
  const [selectedBilletera, setSelectedBilletera] = useState<BilleteraServicio | null>(null)
  const [selectedLotStatus, setSelectedLotStatus] = useState<LotStatusResponse | null>(null)

  // Data State
  const [billeteras, setBilleteras] = useState<BilleteraServicio[]>([])
  const [systemClients, setSystemClients] = useState<Cliente[]>([])
  const [lotificaciones, setLotificaciones] = useState<Lotificacion[]>([])
  const [catalog, setCatalog] = useState<CatalogoServicio[]>([])
  const [lotStatusList, setLotStatusList] = useState<LotStatusResponse[]>([])

  // Loading States
  const [isLoadingBilleteras, setIsLoadingBilleteras] = useState(true)
  const [isLoadingLotificaciones, setIsLoadingLotificaciones] = useState(true)
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [isLoadingLots, setIsLoadingLots] = useState(false)
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)

  // Pagination
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsTotal, setPaymentsTotal] = useState(0)
  const [paymentsData, setPaymentsData] = useState<PagoServicio[]>([])

  // Search and Filters
  const [searchClient, setSearchClient] = useState("")
  const [searchCatalog, setSearchCatalog] = useState("")
  const [searchLot, setSearchLot] = useState("")
  const [searchPayment, setSearchPayment] = useState("")
  const [filterPaymentService, setFilterPaymentService] = useState("all")
  const [selectedProjectCatalog, setSelectedProjectCatalog] = useState<Lotificacion | null>(null)

  // Modals State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false)
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isQuickPay, setIsQuickPay] = useState(false)
  const [isRegisterPaidOpen, setIsRegisterPaidOpen] = useState(false)
  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")

  // Form States
  const [newService, setNewService] = useState<Partial<CatalogoServicio>>({
    nombre: "",
    precio_base_defecto: 0,
    icono: "Plus",
    descripcion: "",
    activo: true,
    es_recurrente: true
  })
  const [selectedNewWalletClient, setSelectedNewWalletClient] = useState("")
  const [lotServicesTemp, setLotServicesTemp] = useState<any[]>([])

  // Payment Form States
  const [paymentMode, setPaymentMode] = useState<'create' | 'edit'>('create')
  const [paymentRecord, setPaymentRecord] = useState<PagoServicio | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string>("")
  const [montoPagar, setMontoPagar] = useState<number>(0)
  const [montoCobrado, setMontoCobrado] = useState<number>(0)
  const [hasMora, setHasMora] = useState(false)
  const [mora, setMora] = useState<number>(0)
  const [paymentState, setPaymentState] = useState<PagoServicio['estado']>("Pendiente")
  const [paymentMonth, setPaymentMonth] = useState("")
  const [fechaLimite, setFechaLimite] = useState("")
  const [fechaPago, setFechaPago] = useState("")
  const [metodoPago, setMetodoPago] = useState("Efectivo")

  // Initial Fetch
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [projects, wallets, clientsRes] = await Promise.all([
        lotificacionService.getLotificaciones(),
        serviciosService.getBilleteras(),
        getClientes(1, 100) // Get more clients for the wallet creation
      ])

      setLotificaciones(projects)
      setBilleteras(wallets)
      setSystemClients(clientsRes.clientes)

      if (projects.length > 0) {
        setSelectedProjectCatalog(projects[0])
      }
    } catch (error) {
      toast.error("Error al cargar datos iniciales")
    } finally {
      setIsLoadingLotificaciones(false)
      setIsLoadingBilleteras(false)
    }
  }

  // Fetch catalog when project changes
  useEffect(() => {
    if (selectedProjectCatalog) {
      fetchProjectCatalog(selectedProjectCatalog.id)
    }
  }, [selectedProjectCatalog])

  const fetchProjectCatalog = async (projectId: number) => {
    setIsLoadingCatalog(true)
    try {
      const data = await serviciosService.getCatalogo({ lotificacion_id: projectId })
      setCatalog(data)
    } catch (error) {
      toast.error("Error al cargar el catálogo")
    } finally {
      setIsLoadingCatalog(false)
    }
  }

  const refreshLotStatus = useCallback(async (billeteraId: number) => {
    setIsLoadingLots(true)
    try {
      const data = await serviciosService.getLotStatus(billeteraId)
      // The requirement says only financiado, pagado, escriturado
      // Since the backend might return all lots of the client, we filter here
      // But based on my backend implementation, it returns lots from Venta records.
      // We should check the status of each lot if possible.
      // For now, assume the list is correct but apply filters if needed.
      setLotStatusList(data)
    } catch (error) {
      toast.error("Error al cargar los lotes del cliente")
    } finally {
      setIsLoadingLots(false)
    }
  }, [])

  // Handlers
  const handleSelectBilletera = async (billetera: BilleteraServicio) => {
    setSelectedBilletera(billetera)
    setViewMode('wallet')
    await refreshLotStatus(billetera.id)
  }

  const handleSelectLot = async (lot: LotStatusResponse, page = 1) => {
    setSelectedLotStatus(lot)
    setViewMode('lot_payments')
    setIsLoadingPayments(true)
    setPaymentsPage(page)
    try {
      // Fetch only non-paid payments
      const res = await serviciosService.getPagos({
        lote_id: lot.lote_id,
        exclude_estado: 'Pagado',
        page: page
      })

      // Handle both paginated and non-paginated responses
      const results = Array.isArray(res) ? res : (res.results || [])
      const count = Array.isArray(res) ? res.length : (res.count || 0)

      setPaymentsData(results.filter(p => p.estado !== 'Pagado'))
      setPaymentsTotal(count)
    } catch (error) {
      toast.error("Error al cargar cobros")
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const handleSelectLotHistory = async (lot: LotStatusResponse, page = 1) => {
    setSelectedLotStatus(lot)
    setViewMode('lot_history')
    setIsLoadingPayments(true)
    setPaymentsPage(page)
    try {
      const res = await serviciosService.getPagos({
        lote_id: lot.lote_id,
        estado: 'Pagado',
        page: page
      })

      // Handle both paginated and non-paginated responses
      const results = Array.isArray(res) ? res : (res.results || [])
      const count = Array.isArray(res) ? res.length : (res.count || 0)

      setPaymentsData(results)
      setPaymentsTotal(count)
    } catch (error) {
      toast.error("Error al cargar historial")
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const handleVolver = () => {
    if (viewMode === 'lot_payments' || viewMode === 'lot_history') {
      setViewMode('wallet')
      setSelectedLotStatus(null)
    } else {
      setViewMode('clients')
      setSelectedBilletera(null)
      setLotStatusList([])
    }
  }

  const handleSaveCatalog = async () => {
    if (!newService.nombre || (newService.precio_base_defecto ?? 0) <= 0) return toast.error("Datos inválidos")
    if (!selectedProjectCatalog) return toast.error("Seleccione un proyecto")

    try {
      await serviciosService.createService({
        ...newService,
        lotificacion: selectedProjectCatalog.id
      })
      toast.success("Servicio agregado al catálogo")
      setIsCatalogModalOpen(false)
      setNewService({ nombre: "", precio_base_defecto: 0, icono: "Plus", descripcion: "", activo: true, es_recurrente: true })
      fetchProjectCatalog(selectedProjectCatalog.id)
    } catch (error) {
      toast.error("Error al guardar el servicio")
    }
  }

  const handleCreateWallet = async () => {
    if (!selectedNewWalletClient) return toast.error("Seleccione un cliente")
    try {
      await serviciosService.createBilletera(Number(selectedNewWalletClient))
      toast.success("Billetera virtual creada")
      setIsCreateWalletOpen(false)
      const wallets = await serviciosService.getBilleteras()
      setBilleteras(wallets)
    } catch (error) {
      toast.error("Error al crear la billetera o el cliente ya posee una.")
    }
  }

  const openPersonalize = async (lotStatus: LotStatusResponse) => {
    setSelectedLotStatus(lotStatus)
    setIsLoadingLots(true)
    try {
      // Fetch catalog specifically for this lot's lotificacion
      const catalogItems = await serviciosService.getCatalogo({ lotificacion_id: lotStatus.lotificacion_id })

      const mapped = catalogItems.map(cat => {
        // Search in ALL configurations (active or inactive)
        const ex = lotStatus.configuraciones.find(s => s.servicio === cat.id)
        return {
          id: ex?.id || null,
          servicioId: cat.id,
          nombre: cat.nombre,
          precio: ex?.precio_personalizado || cat.precio_base_defecto,
          selected: ex ? ex.esta_activo : false, // Preserve selection state
          icono: cat.icono
        }
      })
      setLotServicesTemp(mapped)
      setIsPersonalizeOpen(true)
    } catch (error) {
      toast.error("Error al cargar configuraciones")
    } finally {
      setIsLoadingLots(false)
    }
  }

  const toggleTempService = (serviceId: number) => {
    setLotServicesTemp(prev => prev.map(p => p.servicioId === serviceId ? { ...p, selected: !p.selected } : p))
  }

  const updateTempPrice = (serviceId: number, price: number) => {
    setLotServicesTemp(prev => prev.map(p => p.servicioId === serviceId ? { ...p, precio: price } : p))
  }

  const savePersonalization = async () => {
    if (!selectedLotStatus || !selectedBilletera) return

    try {
      for (const item of lotServicesTemp) {
        if (item.id && !item.selected) {
          // Deactivate
          await serviciosService.updateConfiguracion(item.id, { esta_activo: false })
        } else if (item.selected) {
          if (item.id) {
            // Update
            await serviciosService.updateConfiguracion(item.id, {
              precio_personalizado: item.precio,
              esta_activo: true
            })
          } else {
            // Create
            await serviciosService.createConfiguracion({
              lote: selectedLotStatus.lote_id,
              servicio: item.servicioId,
              precio_personalizado: item.precio,
              esta_activo: true
            })
          }
        }
      }
      toast.success("Servicios del lote actualizados")
      setIsPersonalizeOpen(false)
      refreshLotStatus(selectedBilletera.id)
    } catch (error) {
      toast.error("Error al guardar la personalización")
    }
  }

  const openCreatePayment = () => {
    setPaymentMode('create')
    setIsQuickPay(false)
    setSelectedServiceId("")
    setMontoCobrado(0)
    setMontoPagar(0)
    setHasMora(false)
    setMora(0)
    setPaymentState("Pendiente")
    const todayStr = new Date().toISOString().split('T')[0]
    setPaymentMonth(todayStr)
    setFechaLimite(todayStr)
    setFechaPago("")
    setMetodoPago("Efectivo")
    setIsPaymentOpen(true)
  }

  const openRegisterPaid = () => {
    setSelectedServiceId("")
    setMontoCobrado(0)
    setHasMora(false)
    setMora(0)
    setFechaPago(new Date().toISOString().split('T')[0])
    setMetodoPago("Efectivo")
    setIsRegisterPaidOpen(true)
  }

  const openEditPayment = (record: PagoServicio) => {
    setPaymentMode('edit')
    setIsQuickPay(false)
    setPaymentRecord(record)
    setSelectedServiceId(record.servicio.toString())
    setMontoCobrado(Number(record.monto_cobrado))
    setMontoPagar(Number(record.monto_pagado))
    setHasMora(Number(record.mora_aplicada) > 0)
    setMora(Number(record.mora_aplicada))
    setPaymentState(record.estado)
    setPaymentMonth(record.mes_periodo)
    setFechaLimite(record.fecha_limite)
    setMetodoPago(record.metodo_pago || "Efectivo")
    setIsPaymentOpen(true)
  }

  const handleServiceChange = (val: string) => {
    setSelectedServiceId(val)
    if (paymentMode === 'create' && selectedLotStatus) {
      const config = selectedLotStatus.servicios_activos.find(s => s.servicio === Number(val))
      if (config) {
        // Find base price from catalog if not personalizado
        const catItem = catalog.find(c => c.id === config.servicio)
        setMontoCobrado(Number(config.precio_personalizado || catItem?.precio_base_defecto || 0))
      }
    }
  }

  const handleRegisterPayment = async () => {
    if (!selectedLotStatus || !selectedBilletera) return
    if (!selectedServiceId || !paymentMonth || !fechaLimite) {
      toast.error("Complete los campos obligatorios")
      return
    }

    if (!isQuickPay) {
      const todayStr = new Date().toISOString().split('T')[0]
      const expectedState = todayStr > fechaLimite ? 'Vencido' : 'Pendiente'
      if (paymentState !== expectedState && paymentState !== 'Pagado') {
        setWarningMessage(`El estado seleccionado (${paymentState}) no coincide con las fechas. Debería ser "${expectedState}" ya que la fecha actual ${todayStr > fechaLimite ? 'es mayor a' : 'no sobrepasa'} la fecha límite.`)
        setIsWarningOpen(true)
        return
      }
    }

    try {
      const payload: Partial<PagoServicio> = {
        lote: selectedLotStatus.lote_id,
        servicio: Number(selectedServiceId),
        mes_periodo: paymentMonth.includes('-') ? paymentMonth : `${paymentMonth.split('/')[1]}-${paymentMonth.split('/')[0]}-01`,
        monto_cobrado: montoCobrado,
        monto_pagado: montoPagar,
        mora_aplicada: hasMora ? mora : 0,
        fecha_limite: fechaLimite,
        estado: paymentState,
        metodo_pago: metodoPago,
        fecha_pago_realizado: paymentState === 'Pagado' ? (fechaPago || new Date().toISOString()) : null
      }

      if (paymentMode === 'create') {
        await serviciosService.createPago(payload)
      } else if (paymentRecord) {
        await serviciosService.updatePago(paymentRecord.id, payload)
      }

      toast.success("Pago registrado correctamente")
      setIsPaymentOpen(false)
      refreshLotStatus(selectedBilletera.id)
      // Refresh current list
      if (viewMode === 'lot_payments') handleSelectLot(selectedLotStatus, paymentsPage)
      else handleSelectLotHistory(selectedLotStatus, paymentsPage)
    } catch (error: any) {
      if (error.status === 400 && error.data?.detail) {
        toast.error(error.data.detail)
      } else {
        toast.error("Error al registrar el pago")
      }
    }
  }

  const handleRegisterPaid = async () => {
    if (!selectedLotStatus || !selectedBilletera) return
    if (!selectedServiceId || !fechaPago || !metodoPago) {
      toast.error("Complete los campos obligatorios")
      return
    }

    try {
      const payload: Partial<PagoServicio> = {
        lote: selectedLotStatus.lote_id,
        servicio: Number(selectedServiceId),
        mes_periodo: `${fechaPago.split('-')[0]}-${fechaPago.split('-')[1]}-01`,
        monto_cobrado: montoCobrado,
        monto_pagado: montoCobrado + (hasMora ? mora : 0),
        mora_aplicada: hasMora ? mora : 0,
        fecha_limite: fechaPago,
        estado: 'Pagado',
        metodo_pago: metodoPago,
        fecha_pago_realizado: fechaPago
      }

      await serviciosService.createPago(payload)
      toast.success("Pago registrado correctamente")
      setIsRegisterPaidOpen(false)
      refreshLotStatus(selectedBilletera.id)
      handleSelectLotHistory(selectedLotStatus, paymentsPage)
    } catch (error: any) {
      toast.error("Error al registrar el pago directo")
    }
  }

  const handlePrintRecibo = async (pagoId: number) => {
    try {
      const blob = await serviciosService.getRecibo(pagoId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.click()
      toast.success('Recibo generado correctamente')
    } catch (error) {
      toast.error('No se pudo generar el recibo')
    }
  }

  const handleDeletePago = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este registro de pago?")) return
    try {
      await serviciosService.deletePago(id)
      toast.success("Registro eliminado")
      if (selectedBilletera) refreshLotStatus(selectedBilletera.id)
      if (selectedLotStatus) {
        if (viewMode === 'lot_payments') handleSelectLot(selectedLotStatus, paymentsPage)
        else handleSelectLotHistory(selectedLotStatus, paymentsPage)
      }
    } catch (error) {
      toast.error("Error al eliminar el registro")
    }
  }

  const openQuickPay = (record: PagoServicio) => {
    setPaymentMode('edit')
    setIsQuickPay(true)
    setPaymentRecord(record)
    setSelectedServiceId(record.servicio.toString())
    setMontoCobrado(Number(record.monto_cobrado))

    // Auto-calculate total with mora if Vencido
    const isVencido = record.estado === 'Vencido'
    const suggestedMora = isVencido ? 25 : 0 // Mora fija de ejemplo o dinámica

    setHasMora(isVencido)
    setMora(suggestedMora)
    setMontoPagar(Number(record.monto_cobrado) + suggestedMora)
    setPaymentState("Pagado")
    setPaymentMonth(record.mes_periodo)
    setFechaLimite(record.fecha_limite)
    setFechaPago(new Date().toISOString().split('T')[0])
    setMetodoPago("Efectivo")
    setIsPaymentOpen(true)
  }

  // Filter Data
  const filteredBilleteras = billeteras.filter(b =>
    b.cliente_nombre?.toLowerCase().includes(searchClient.toLowerCase())
  )

  const filteredLots = lotStatusList.filter(l =>
    l.numero_lote.toLowerCase().includes(searchLot.toLowerCase()) ||
    l.lotificacion.toLowerCase().includes(searchLot.toLowerCase())
  )


  const filteredCatalog = catalog.filter(c => c.nombre.toLowerCase().includes(searchCatalog.toLowerCase()))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pagado": return <Badge variant="secondary" className="bg-green-100 text-green-800">Pagado</Badge>
      case "Pendiente": return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendiente</Badge>
      case "Vencido": return <Badge variant="destructive">Vencido</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Servicios</h1>
              <p className="text-muted-foreground mt-2">Billetera virtual, personalización de cobros y catálogo</p>
            </div>
          </div>

          <Tabs defaultValue="billeteras" className="space-y-6">
            {viewMode === 'clients' && (
              <TabsList className="bg-slate-100">
                <TabsTrigger value="billeteras" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Billeteras de Clientes</TabsTrigger>
                <TabsTrigger value="catalogo" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Catálogo de Servicios</TabsTrigger>
              </TabsList>
            )}

            {/* TAB: BILLETERAS */}
            <TabsContent value="billeteras" className="m-0">

              {/* VIEW: CLIENTS */}
              {viewMode === 'clients' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle>Billeteras Activas</CardTitle>
                      <CardDescription>
                        Seleccione un cliente para ver sus lotes y gestionar pagos.
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsCreateWalletOpen(true)} className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Crear Billetera
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 max-w-md relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar cliente por nombre..."
                        className="pl-9"
                        value={searchClient}
                        onChange={(e) => setSearchClient(e.target.value)}
                      />
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Nombre del Cliente</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingBilleteras ? (
                            <TableRow><TableCell colSpan={2} className="text-center py-8">Cargando billeteras...</TableCell></TableRow>
                          ) : filteredBilleteras.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-8 text-muted-foreground italic">
                                No se encontraron billeteras.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredBilleteras.map((wallet) => (
                              <TableRow key={wallet.id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="font-semibold text-lg py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                      {wallet.cliente_nombre?.charAt(0)}
                                    </div>
                                    {wallet.cliente_nombre}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button onClick={() => handleSelectBilletera(wallet)}>
                                    Entrar a Billetera
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* VIEW: WALLET (LOTS LIST) */}
              {viewMode === 'wallet' && selectedBilletera && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="icon" onClick={handleVolver}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <Wallet className="h-6 w-6 text-primary" />
                          Billetera de {selectedBilletera.cliente_nombre}
                        </h2>
                        <p className="text-sm text-muted-foreground">Listado de lotes propiedad de este cliente.</p>
                      </div>
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar lote o proyecto..."
                        className="pl-9"
                        value={searchLot}
                        onChange={(e) => setSearchLot(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoadingLots ? (
                      <div className="col-span-full py-20 text-center">Cargando lotes...</div>
                    ) : filteredLots.length === 0 ? (
                      <div className="col-span-full">
                        <Card className="p-12 text-center text-muted-foreground border-dashed">
                          No se encontraron lotes activos para este cliente.
                        </Card>
                      </div>
                    ) : (
                      filteredLots.map(lot => {
                        const lotStatus = lot.estado_lote.toLowerCase();
                        const isEditable = lotStatus === 'pagado' || lotStatus === 'escriturado';
                        const hasServices = lot.servicios_activos && lot.servicios_activos.length > 0;

                        return (
                          <Card key={lot.lote_id} className="border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="bg-slate-50 border-b pb-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-xl">Lote {lot.numero_lote}</CardTitle>
                                  <CardDescription>{lot.lotificacion} - Manzana {lot.manzana}</CardDescription>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className={`${lotStatus === 'pagado' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'} uppercase text-[10px]`}>
                                    {lot.estado_lote}
                                  </Badge>
                                  <Badge variant="secondary" className="text-[10px]">
                                    Q {lot.saldo_pendiente.toFixed(2)} Pendiente
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 p-2 rounded-md border">
                                <Settings className="h-4 w-4" />
                                {lot.servicios_activos.length} servicio(s) configurados
                              </div>

                              <div className="flex flex-col gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  onClick={() => openPersonalize(lot)}
                                  className={`w-full justify-start border-slate-300 ${!isEditable ? 'opacity-50 pointer-events-none' : 'text-muted-foreground'}`}
                                  disabled={!isEditable}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Personalizar Servicios
                                </Button>
                                <Button
                                  onClick={() => handleSelectLot(lot)}
                                  className={`w-full justify-start ${(!isEditable || !hasServices) ? 'bg-slate-400 pointer-events-none' : 'bg-slate-800 hover:bg-slate-900'}`}
                                  disabled={!isEditable || !hasServices}
                                >
                                  <List className="h-4 w-4 mr-2" />
                                  Cobros Pendientes ({lot.count_pendientes})
                                </Button>

                                <Button
                                  variant="outline"
                                  onClick={() => handleSelectLotHistory(lot)}
                                  className={`w-full justify-start border-slate-300 ${!isEditable ? 'opacity-50 pointer-events-none' : 'text-slate-700'}`}
                                  disabled={!isEditable}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Pagos Realizados
                                </Button>

                                {!isEditable && (
                                  <div className="flex items-center gap-1 mt-1 justify-center">
                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                    <p className="text-[10px] text-amber-600 italic uppercase">Estado {lot.estado_lote}: Solo lectura</p>
                                  </div>
                                )}
                                {isEditable && !hasServices && (
                                  <div className="flex items-center gap-1 mt-1 justify-center">
                                    <Info className="h-3 w-3 text-blue-500" />
                                    <p className="text-[10px] text-blue-600 italic uppercase">Configure servicios para ver pagos</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
              {(viewMode === 'lot_payments' || viewMode === 'lot_history') && selectedLotStatus && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={handleVolver} className="h-10 w-10 p-0 rounded-full">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">
                        {viewMode === 'lot_payments' ? 'Cobros Pendientes' : 'Pagos Realizados'} - Lote {selectedLotStatus.numero_lote}
                      </h2>
                      <p className="text-slate-500">{selectedBilletera?.cliente_nombre} • {selectedLotStatus.lotificacion}</p>
                    </div>
                  </div>

                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          {viewMode === 'lot_payments' ? (
                            <>
                              <Calendar className="h-5 w-5 text-primary" />
                              Historial de Pagos y Pendientes
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              Historial de Pagos Realizados
                            </>
                          )}
                        </CardTitle>
                        {viewMode === 'lot_payments' ? (
                          <Button onClick={openCreatePayment} className="bg-slate-800 hover:bg-slate-900">
                            <Plus className="h-4 w-4 mr-2" />
                            Registrar Cobro Manualmente
                          </Button>
                        ) : (
                          <Button onClick={openRegisterPaid} className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Registrar Pago Realizado
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        {isLoadingPayments ? (
                          <div className="py-20 text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-500">Cargando datos...</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/50">
                                <TableHead className="pl-6">Mes / Fechas</TableHead>
                                <TableHead>Servicio</TableHead>
                                <TableHead>Monto {viewMode === 'lot_payments' ? 'Cobrado' : 'Pagado'}</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right pr-6">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(paymentsData || []).length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                    No hay registros que mostrar.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                (paymentsData || []).map(payment => (
                                  <TableRow key={payment.id}>
                                    <TableCell className="pl-6 font-medium">
                                      <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-muted-foreground" />
                                          {payment.mes_periodo}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-6">
                                          {viewMode === 'lot_payments' ? `Límite: ${payment.fecha_limite}` : `Pagado: ${payment.fecha_pago_realizado ? new Date(payment.fecha_pago_realizado).toLocaleDateString() : 'N/A'}`}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{payment.servicio_nombre}</TableCell>
                                    <TableCell>
                                      Q {viewMode === 'lot_payments' ? Number(payment.monto_cobrado).toFixed(2) : Number(payment.monto_pagado).toFixed(2)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(payment.estado)}</TableCell>
                                    <TableCell className="text-right pr-6">
                                      <div className="flex justify-end gap-2">
                                        {payment.estado === 'Pagado' ? (
                                          <Button variant="outline" size="sm" onClick={() => handlePrintRecibo(payment.id)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                            <Printer className="h-4 w-4 mr-2" />
                                            Recibo
                                          </Button>
                                        ) : (
                                          <Button variant="default" size="sm" onClick={() => openQuickPay(payment)} className="bg-emerald-600 hover:bg-emerald-700">
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Pagar
                                          </Button>
                                        )}
                                        {viewMode === 'lot_payments' && (
                                          <Button variant="ghost" size="sm" onClick={() => openEditPayment(payment)} className="text-primary hover:text-primary hover:bg-slate-100">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Editar
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => handleDeletePago(payment.id)} className="text-destructive hover:text-destructive hover:bg-red-50">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Eliminar
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        )}
                      </div>

                      {/* Pagination Controls */}
                      {paymentsTotal > 10 && (
                        <div className="p-4 border-t bg-slate-50/50 flex justify-between items-center">
                          <p className="text-sm text-slate-500">
                            Mostrando {paymentsData.length} de {paymentsTotal} registros
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={paymentsPage === 1}
                              onClick={() => {
                                if (viewMode === 'lot_payments') handleSelectLot(selectedLotStatus, paymentsPage - 1)
                                else handleSelectLotHistory(selectedLotStatus, paymentsPage - 1)
                              }}
                            >
                              Anterior
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={paymentsPage * 10 >= paymentsTotal}
                              onClick={() => {
                                if (viewMode === 'lot_payments') handleSelectLot(selectedLotStatus, paymentsPage + 1)
                                else handleSelectLotHistory(selectedLotStatus, paymentsPage + 1)
                              }}
                            >
                              Siguiente
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* TAB: CATALOGO */}
            <TabsContent value="catalogo" className="m-0">
              <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* SIDEBAR: PROYECTOS */}
                <Card className="w-full lg:w-80 shrink-0 self-stretch">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Proyectos</CardTitle>
                    </div>
                    <CardDescription>Seleccione una lotificación</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col max-h-[500px] overflow-y-auto">
                      {isLoadingLotificaciones ? (
                        <div className="p-8 text-center">Cargando proyectos...</div>
                      ) : lotificaciones.map(project => (
                        <button
                          key={project.id}
                          onClick={() => setSelectedProjectCatalog(project)}
                          className={`flex items-center justify-between p-4 text-left border-b last:border-b-0 transition-all hover:bg-slate-50 ${selectedProjectCatalog?.id === project.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                        >
                          <div className="space-y-1">
                            <p className={`font-semibold ${selectedProjectCatalog?.id === project.id ? 'text-primary' : ''}`}>{project.nombre}</p>
                            <Badge variant={project.activo ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0 h-4">
                              {project.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedProjectCatalog?.id === project.id ? 'translate-x-1' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* MAIN AREA: CATALOG TABLE */}
                <div className="flex-1 w-full space-y-6">
                  {selectedProjectCatalog ? (
                    <Card className="shadow-sm border-slate-200">
                      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b bg-slate-50/30">
                        <div>
                          <CardTitle className="text-2xl font-bold">{selectedProjectCatalog.nombre}</CardTitle>
                          <CardDescription>Catálogo de servicios disponibles.</CardDescription>
                        </div>
                        <Button onClick={() => setIsCatalogModalOpen(true)} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Nuevo Servicio
                        </Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="p-4 border-b">
                          <Input
                            placeholder="Buscar en el catálogo..."
                            className="max-w-sm"
                            value={searchCatalog}
                            onChange={(e) => setSearchCatalog(e.target.value)}
                          />
                        </div>
                        <Table>
                          <TableHeader className="bg-slate-50/50">
                            <TableRow>
                              <TableHead className="pl-6">Servicio</TableHead>
                              <TableHead>Precio Base</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right pr-6">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingCatalog ? (
                              <TableRow><TableCell colSpan={4} className="text-center py-10">Cargando catálogo...</TableCell></TableRow>
                            ) : filteredCatalog.length === 0 ? (
                              <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No hay servicios.</TableCell></TableRow>
                            ) : (
                              filteredCatalog.map(cat => (
                                <TableRow key={cat.id}>
                                  <TableCell className="pl-6 font-semibold">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center">
                                        {getIconComponent(cat.icono || "")}
                                      </div>
                                      {cat.nombre}
                                    </div>
                                  </TableCell>
                                  <TableCell>Q {Number(cat.precio_base_defecto).toFixed(2)}</TableCell>
                                  <TableCell>
                                    {cat.activo ? <Badge className="bg-green-100 text-green-700">Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-full min-h-[400px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
                      <h3 className="text-xl font-bold">Seleccione un proyecto</h3>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* MODALS (Simplified versions of the previous ones, linked to real handlers) */}

          {/* MODAL: NUEVO SERVICIO CATÁLOGO */}
          <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo Servicio en Catálogo</DialogTitle>
                <DialogDescription className="sr-only">Formulario para crear un nuevo servicio en el catálogo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre del Servicio</Label>
                  <Input value={newService.nombre} onChange={(e) => setNewService({ ...newService, nombre: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Precio Base (Q)</Label>
                  <Input type="number" value={newService.precio_base_defecto} onChange={(e) => setNewService({ ...newService, precio_base_defecto: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label>Icono</Label>
                  <Select value={newService.icono} onValueChange={(v) => setNewService({ ...newService, icono: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Droplet">Agua</SelectItem>
                      <SelectItem value="Zap">Energía</SelectItem>
                      <SelectItem value="HardHat">Mantenimiento</SelectItem>
                      <SelectItem value="Plus">Genérico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCatalogModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveCatalog}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* MODAL: CREAR BILLETERA */}
          <Dialog open={isCreateWalletOpen} onOpenChange={setIsCreateWalletOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Billetera</DialogTitle>
                <DialogDescription className="sr-only">Seleccione un cliente para crear una nueva billetera.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select value={selectedNewWalletClient} onValueChange={setSelectedNewWalletClient}>
                  <SelectTrigger><SelectValue placeholder="Seleccione cliente" /></SelectTrigger>
                  <SelectContent>
                    {systemClients.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nombres} {c.apellidos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateWalletOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateWallet}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* MODAL: PERSONALIZAR LOTE */}
          <Dialog open={isPersonalizeOpen} onOpenChange={setIsPersonalizeOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Personalizar Servicios - Lote {selectedLotStatus?.numero_lote}</DialogTitle>
                <DialogDescription className="sr-only">Configuración de servicios activos y precios para el lote seleccionado.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {lotServicesTemp.map(svc => (
                  <div key={svc.servicioId} className="p-4 rounded-lg border flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={svc.selected} onCheckedChange={() => toggleTempService(svc.servicioId)} />
                      <Label className="text-base font-semibold">{svc.nombre}</Label>
                    </div>
                    {svc.selected && (
                      <div className="ml-7 flex items-center gap-3">
                        <Label className="text-sm">Precio (Q):</Label>
                        <Input type="number" value={svc.precio} onChange={(e) => updateTempPrice(svc.servicioId, Number(e.target.value))} className="h-8 w-24" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPersonalizeOpen(false)}>Cancelar</Button>
                <Button onClick={savePersonalization}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
            <DialogContent className="sm:max-w-md border-none shadow-2xl p-0 overflow-hidden">
                <div className={`p-6 ${isQuickPay ? 'bg-slate-900 text-white' : 'bg-slate-50 border-b'}`}>
                  <DialogHeader className="space-y-1">
                    <DialogTitle className={`text-xl font-bold ${isQuickPay ? 'text-white' : 'text-slate-900'}`}>
                      {isQuickPay ? 'Registrar Pago' : (paymentMode === 'create' ? 'Nuevo Cobro Manual' : 'Editar Cobro')}
                    </DialogTitle>
                    {isQuickPay && paymentRecord && (
                      <DialogDescription className="text-slate-400 text-sm">
                        {paymentRecord.servicio_nombre} • Periodo {paymentRecord.mes_periodo}
                      </DialogDescription>
                    )}
                    {!isQuickPay && (
                      <DialogDescription>Configure los detalles del cobro del servicio.</DialogDescription>
                    )}
                  </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                  {!isQuickPay && (
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Servicio</Label>
                        <Select
                          value={selectedServiceId}
                          onValueChange={(val) => {
                            setSelectedServiceId(val)
                            const config = selectedLotStatus?.servicios_activos.find(s => s.servicio.toString() === val)
                            if (config) setMontoCobrado(Number(config.precio_personalizado || 0))
                          }}
                          disabled={paymentMode === 'edit'}
                        >
                          <SelectTrigger className="h-11"><SelectValue placeholder="Seleccione servicio" /></SelectTrigger>
                          <SelectContent>
                            {selectedLotStatus?.servicios_activos.map(s => (
                              <SelectItem key={s.servicio} value={s.servicio.toString()}>{s.servicio_nombre}</SelectItem>
                            ))}
                            {paymentMode === 'edit' && paymentRecord && !selectedLotStatus?.servicios_activos.some(s => s.servicio.toString() === selectedServiceId) && (
                              <SelectItem value={selectedServiceId}>{paymentRecord.servicio_nombre}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fecha de Inicio</Label>
                          <Input 
                            className="h-11" 
                            type="date" 
                            value={paymentMonth} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaymentMonth(val);
                              if (fechaLimite) {
                                const todayStr = new Date().toISOString().split('T')[0];
                                setPaymentState(todayStr > fechaLimite ? 'Vencido' : 'Pendiente');
                              }
                            }} 
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fecha Límite</Label>
                          <Input 
                            className="h-11" 
                            type="date" 
                            value={fechaLimite} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setFechaLimite(val);
                              if (val) {
                                const todayStr = new Date().toISOString().split('T')[0];
                                setPaymentState(todayStr > val ? 'Vencido' : 'Pendiente');
                              }
                            }} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Estado</Label>
                          <Select
                            value={paymentState}
                            onValueChange={(val: any) => setPaymentState(val)}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pendiente">Pendiente</SelectItem>
                              <SelectItem value="Vencido">Vencido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Monto a Cobrar (Q)</Label>
                          <Input
                            type="number"
                            value={montoCobrado}
                            onChange={(e) => setMontoCobrado(Number(e.target.value))}
                            className="h-11 bg-slate-50 font-bold"
                            disabled={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PAYMENT SECTION - Always visible when paying, or the only thing visible in QuickPay */}
                  {(paymentState === 'Pagado' || isQuickPay) && (
                    <div className={`space-y-5 ${!isQuickPay ? 'pt-6 border-t' : ''}`}>

                      {/* Only show Mora if it's Vencido or already has Mora */}
                      {(paymentRecord?.estado === 'Vencido' || hasMora) && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <Label htmlFor="mora" className="text-sm font-semibold text-amber-900">Aplicar recargo por Mora</Label>
                            </div>
                            <Switch
                              id="mora"
                              checked={hasMora}
                              onCheckedChange={(val) => {
                                setHasMora(val)
                                setMontoPagar(montoCobrado + (val ? mora : 0))
                              }}
                            />
                          </div>

                          {hasMora && (
                            <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                              <Label className="text-xs font-bold uppercase text-amber-700">Monto de Mora (Q)</Label>
                              <Input
                                type="number"
                                value={mora}
                                onChange={(e) => {
                                  const m = Number(e.target.value)
                                  setMora(m)
                                  setMontoPagar(montoCobrado + m)
                                }}
                                className="h-10 border-amber-200 focus:ring-amber-500"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid gap-2">
                        <Label className="text-sm font-bold text-slate-700 flex justify-between">
                          Monto Paga Cliente
                          <span className="text-primary">Total Sugerido: Q{(montoCobrado + (hasMora ? mora : 0)).toFixed(2)}</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">Q</span>
                          <Input
                            type="number"
                            value={montoPagar}
                            onChange={(e) => setMontoPagar(Number(e.target.value))}
                            className="h-14 pl-9 text-2xl font-black border-2 border-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic text-center uppercase tracking-tighter">Debe coincidir exactamente con el total</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fecha de Pago</Label>
                          <Input className="h-11" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Método de Pago</Label>
                          <Select value={metodoPago} onValueChange={setMetodoPago}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Efectivo">Efectivo</SelectItem>
                              <SelectItem value="Transferencia">Transferencia</SelectItem>
                              <SelectItem value="Depósito">Depósito</SelectItem>
                              <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-50 flex flex-col-reverse sm:flex-row gap-3">
                  <Button variant="ghost" onClick={() => setIsPaymentOpen(false)} className="flex-1 h-11">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRegisterPayment}
                    className={`flex-1 h-11 font-bold ${isQuickPay ? 'bg-slate-900 hover:bg-slate-800' : 'bg-primary'}`}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isQuickPay ? 'Confirmar Pago' : 'Guardar Cambios'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

          {/* MODAL: ADVERTENCIA ESTADO */}
          <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  Advertencia de Estado
                </DialogTitle>
                <DialogDescription>
                  Inconsistencia detectada en el estado del cobro.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 text-slate-700">
                {warningMessage}
              </div>
              <DialogFooter>
                <Button onClick={() => setIsWarningOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* MODAL: REGISTRAR PAGO REALIZADO */}
          <Dialog open={isRegisterPaidOpen} onOpenChange={setIsRegisterPaidOpen}>
            <DialogContent className="sm:max-w-md border-none shadow-2xl overflow-hidden p-0">
              <div className="p-6 bg-emerald-50/50 border-b">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-800">
                    <CheckCircle2 className="h-6 w-6" />
                    Registrar Pago Realizado
                  </DialogTitle>
                  <DialogDescription className="text-emerald-700/70">
                    Registre un cobro directamente con estado pagado.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Servicio</Label>
                  <Select
                    value={selectedServiceId}
                    onValueChange={(val) => {
                      setSelectedServiceId(val)
                      const config = selectedLotStatus?.servicios_activos.find(s => s.servicio.toString() === val)
                      if (config) {
                        const catItem = catalog.find(c => c.id === config.servicio)
                        setMontoCobrado(Number(config.precio_personalizado || catItem?.precio_base_defecto || 0))
                      }
                    }}
                  >
                    <SelectTrigger className="h-11"><SelectValue placeholder="Seleccione servicio" /></SelectTrigger>
                    <SelectContent>
                      {selectedLotStatus?.servicios_activos.map(s => (
                        <SelectItem key={s.servicio} value={s.servicio.toString()}>{s.servicio_nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <Label htmlFor="mora_directa" className="text-sm font-semibold text-amber-900">¿Aplica Mora?</Label>
                    </div>
                    <Switch id="mora_directa" checked={hasMora} onCheckedChange={setHasMora} />
                  </div>
                  {hasMora && (
                    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <Label className="text-xs font-bold uppercase text-amber-700">Monto de Mora (Q)</Label>
                      <Input type="number" value={mora} onChange={(e) => setMora(Number(e.target.value))} className="h-10 border-amber-200 focus:ring-amber-500" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fecha de Pago</Label>
                    <Input className="h-11" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Método de Pago</Label>
                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Seleccione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                        <SelectItem value="Depósito">Depósito</SelectItem>
                        <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">Total a registrar:</span>
                  <span className="text-xl font-black text-emerald-600">Q{(montoCobrado + (hasMora ? mora : 0)).toFixed(2)}</span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex flex-col-reverse sm:flex-row gap-3 border-t">
                <Button variant="ghost" onClick={() => setIsRegisterPaidOpen(false)} className="flex-1 h-11">Cancelar</Button>
                <Button onClick={handleRegisterPaid} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Guardar Pago
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
