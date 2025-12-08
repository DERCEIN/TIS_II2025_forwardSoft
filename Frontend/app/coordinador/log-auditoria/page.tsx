"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/NotificationProvider'
import { ApiService, CoordinadorService } from '@/lib/api'
import * as XLSX from 'xlsx'
import Link from 'next/link'
import { 
  Search,
  Filter,
  FileText,
  Eye,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Users,
  Activity,
  Download,
  ChevronDown,
  Info,
  RefreshCw,
  Settings,
  ArrowLeft
} from 'lucide-react'

interface LogCambio {
  id: number
  evaluacion_id: number
  evaluador_id: number
  evaluador_nombre: string
  olimpista_id: number
  olimpista_nombre: string
  area_competencia_id: number
  area_nombre: string
  nivel_competencia_id: number
  nivel_nombre: string
  nota_anterior: number
  nota_nueva: number
  observaciones_anterior: string
  observaciones_nueva: string
  motivo_cambio: string
  fecha_cambio: string
  ip_address: string
  estado_aprobacion?: 'pendiente' | 'aprobado' | 'rechazado'
  coordinador_id?: number
  fecha_revision?: string
  observaciones_coordinador?: string
  notificacion_enviada?: boolean
}

interface EstadisticasLog {
  total_cambios: number
  evaluadores_con_cambios: number
  olimpistas_afectados: number
  promedio_diferencia: number
  primer_cambio: string
  ultimo_cambio: string
  cambios_pendientes?: number
  cambios_aprobados?: number
  cambios_rechazados?: number
  porcentaje_aprobacion?: number
}

export default function LogAuditoriaPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { success, error } = useNotifications()
  
  const [logs, setLogs] = useState<LogCambio[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [filterEvaluador, setFilterEvaluador] = useState<string>('todos')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [filterOperacion, setFilterOperacion] = useState<string>('todos')
  const [cambiosPendientes, setCambiosPendientes] = useState<number>(0)
  
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogCambio | null>(null)
  
  const [isModalRevisionOpen, setIsModalRevisionOpen] = useState(false)
  const [selectedCambioRevision, setSelectedCambioRevision] = useState<LogCambio | null>(null)
  const [observacionesCoordinador, setObservacionesCoordinador] = useState('')
  const [accionRevision, setAccionRevision] = useState<'aprobar' | 'rechazar' | 'solicitar_info'>('aprobar')
  const [submitting, setSubmitting] = useState(false)

  
  const [rangoFechas, setRangoFechas] = useState<string>('')
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [exportando, setExportando] = useState(false)

  
  const actualizarRangoFechas = () => {
    if (filterFechaDesde && filterFechaHasta) {
      const desde = new Date(filterFechaDesde).toLocaleDateString('es-ES')
      const hasta = new Date(filterFechaHasta).toLocaleDateString('es-ES')
      setRangoFechas(`${desde} - ${hasta}`)
    } else if (filterFechaDesde) {
      const desde = new Date(filterFechaDesde).toLocaleDateString('es-ES')
      setRangoFechas(`Desde ${desde}`)
    } else if (filterFechaHasta) {
      const hasta = new Date(filterFechaHasta).toLocaleDateString('es-ES')
      setRangoFechas(`Hasta ${hasta}`)
    } else {
      setRangoFechas('')
    }
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo al login...')
      window.location.href = '/login'
    }
  }, [isAuthenticated, isLoading])

  useEffect(() => {
    if (user) {
      fetchLogs()
      fetchCambiosPendientes()
      actualizarRangoFechas()
    }
  }, [user])

  const fetchCambiosPendientes = async () => {
    try {
      const data = await CoordinadorService.getCambiosPendientes()
      setCambiosPendientes(data.data?.total_pendientes || 0)
    } catch (err) {
      console.error('Error fetching cambios pendientes:', err)
    }
  }

  useEffect(() => {
    actualizarRangoFechas()
  }, [filterFechaDesde, filterFechaHasta])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const limpiarFiltrosFecha = () => {
    setFilterFechaDesde('')
    setFilterFechaHasta('')
    setRangoFechas('')
  }

  const exportarLogs = async () => {
    setExportando(true)
    try {
      const logsFiltrados = getLogsFiltrados()
      const workbook = generarXLSX(logsFiltrados)
      
      XLSX.writeFile(workbook, `log-auditoria-${new Date().toISOString().split('T')[0]}.xlsx`)
      
      success('Exportación exitosa', 'Log de auditoría exportado correctamente')
    } catch (err) {
      error('Error', 'No se pudo exportar el log de auditoría')
    } finally {
      setExportando(false)
    }
  }

  const generarXLSX = (logs: LogCambio[]) => {
    const headers = ['ID', 'Fecha', 'Evaluador', 'Participante', 'Área', 'Nivel', 'Nota Anterior', 'Nota Nueva', 'Diferencia', 'Motivo']
    const rows = logs.map(log => [
      log.id,
      new Date(log.fecha_cambio).toLocaleString('es-ES'),
      log.evaluador_nombre,
      log.olimpista_nombre,
      log.area_nombre,
      log.nivel_nombre,
      log.nota_anterior || '',
      log.nota_nueva || '',
      typeof log.nota_nueva === 'number' && typeof log.nota_anterior === 'number' 
        ? (log.nota_nueva - log.nota_anterior).toFixed(2) 
        : '0.00',
      log.motivo_cambio || ''
    ])
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Log Auditoría')
    
    return workbook
  }

  const generarXLSXReclamos = (logs: LogCambio[]) => {
    const headers = [
      'ID_Registro', 
      'Fecha_Cambio', 
      'Hora_Cambio', 
      'Evaluador_Nombre', 
      'Participante_Nombre', 
      'Area_Competencia', 
      'Nivel_Competencia', 
      'Nota_Anterior', 
      'Nota_Nueva', 
      'Diferencia_Puntos', 
      'Motivo_Cambio',
      'IP_Address',
      'Observaciones_Anterior',
      'Observaciones_Nueva'
    ]
    
    const rows = logs.map(log => {
      const fecha = new Date(log.fecha_cambio)
      const diferencia = log.nota_nueva - log.nota_anterior
      
      return [
        log.id,
        fecha.toLocaleDateString('es-ES'),
        fecha.toLocaleTimeString('es-ES'),
        log.evaluador_nombre,
        log.olimpista_nombre,
        log.area_nombre,
        log.nivel_nombre,
        log.nota_anterior,
        log.nota_nueva,
        typeof diferencia === 'number' ? diferencia.toFixed(2) : '0.00',
        log.motivo_cambio || 'Sin motivo especificado',
        log.ip_address,
        log.observaciones_anterior || '',
        log.observaciones_nueva || ''
      ]
    })
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reclamos')
    
    return workbook
  }

  const fetchLogs = async () => {
    try {
      setLoading(true)
      
      
      const areaId = user?.area_id || 1 
      console.log('User completo:', user)
      console.log('Area ID del usuario:', areaId)
      
      if (!areaId) {
        console.error('No se encontró area_id en el usuario')
        error('Error', 'No se pudo determinar el área del coordinador')
        return
      }
      
      console.log('Fetching logs for area_id:', areaId)
      
      const data = await CoordinadorService.getLogCambiosNotas({
        area_id: areaId,
        fecha_desde: filterFechaDesde || undefined,
        fecha_hasta: filterFechaHasta || undefined,
        evaluador_id: filterEvaluador !== 'todos' ? parseInt(filterEvaluador) : undefined,
        estado_aprobacion: filterEstado !== 'todos' ? filterEstado : undefined
      })
      console.log('Log response data:', data)
      setLogs(data.data?.cambios || [])
      setEstadisticas(data.data?.estadisticas || null)
      console.log('Logs set:', data.data?.cambios || [])
      
      
      fetchCambiosPendientes()
    } catch (err: any) {
      console.error('Error fetching logs:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'No se pudieron cargar los logs de auditoría'
      error('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleProcesarCambio = async () => {
    if (!selectedCambioRevision) return

    if (accionRevision === 'solicitar_info' && !observacionesCoordinador.trim()) {
      error('Error', 'Las observaciones son requeridas para solicitar más información')
      return
    }

    setSubmitting(true)

    try {
      let response
      if (accionRevision === 'aprobar') {
        response = await CoordinadorService.aprobarCambio(selectedCambioRevision.id, observacionesCoordinador || undefined)
      } else if (accionRevision === 'rechazar') {
        response = await CoordinadorService.rechazarCambio(selectedCambioRevision.id, observacionesCoordinador || undefined)
      } else {
        response = await CoordinadorService.solicitarMasInfo(selectedCambioRevision.id, observacionesCoordinador)
      }

      if (response.success) {
        const mensaje = accionRevision === 'aprobar' ? 'Cambio aprobado exitosamente' :
                       accionRevision === 'rechazar' ? 'Cambio rechazado y nota revertida' :
                       'Solicitud de información enviada'
        success('Éxito', mensaje)
        
        setLogs(prev => prev.map(log => 
          log.id === selectedCambioRevision.id 
            ? { ...log, estado_aprobacion: accionRevision === 'aprobar' ? 'aprobado' : accionRevision === 'rechazar' ? 'rechazado' : 'pendiente',
                     observaciones_coordinador: observacionesCoordinador,
                     fecha_revision: new Date().toISOString() }
            : log
        ))

        setIsModalRevisionOpen(false)
        setSelectedCambioRevision(null)
        setObservacionesCoordinador('')
        fetchLogs()
        fetchCambiosPendientes()
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'No se pudo procesar la acción'
      error('Error', errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const getEstadoBadge = (estado?: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-300"><Clock className="h-3 w-3" />Pendiente</Badge>
      case 'aprobado':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300"><CheckCircle className="h-3 w-3" />Aprobado</Badge>
      case 'rechazado':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rechazado</Badge>
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Info className="h-3 w-3" />Sin estado</Badge>
    }
  }




  const getLogsFiltrados = () => {
    return logs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.olimpista_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.evaluador_nombre.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesEvaluador = filterEvaluador === 'todos' || log.evaluador_id.toString() === filterEvaluador
      
      return matchesSearch && matchesEvaluador
    })
  }

  const logsFiltrados = getLogsFiltrados()
  const evaluadoresUnicos = Array.from(new Set(logs.map(l => l.evaluador_id)))
    .map(id => logs.find(l => l.evaluador_id === id))
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header estilo limpio */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                <Link href="/coordinador/dashboard">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Log de Cambios</h1>
                {cambiosPendientes > 0 && (
                  <Badge className="bg-orange-500 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    {cambiosPendientes} {cambiosPendientes === 1 ? 'pendiente' : 'pendientes'}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 ml-0 sm:ml-11">
                Sistema de trazabilidad completa para rastrear cambios de notas en caso de reclamos o actualizaciones
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setRefreshing(true)
                  fetchLogs().finally(() => setRefreshing(false))
                }}
                disabled={refreshing}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              <Button 
                onClick={exportarLogs}
                disabled={exportando || logs.length === 0}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{exportando ? 'Exportando...' : 'Exportar para Reclamos'}</span>
                <span className="sm:hidden">{exportando ? 'Exportando...' : 'Exportar'}</span>
                <ChevronDown className="h-4 w-4 ml-1 hidden sm:inline" />
              </Button>
            </div>
          </div>
          
          {/* Barra de selección de fechas */}
          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
              {rangoFechas ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 break-words">{rangoFechas}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={limpiarFiltrosFecha}
                    className="h-6 w-6 p-0 hover:bg-gray-200 flex-shrink-0"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-gray-500">Selecciona un rango de fechas</span>
              )}
            </div>
          </div>

          {/* Sección de filtros */}
          <Card className="mb-4">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Fecha Desde</Label>
                  <Input
                    type="date"
                    value={filterFechaDesde}
                    onChange={(e) => setFilterFechaDesde(e.target.value)}
                    className="text-sm"
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Fecha Hasta</Label>
                  <Input
                    type="date"
                    value={filterFechaHasta}
                    onChange={(e) => setFilterFechaHasta(e.target.value)}
                    className="text-sm"
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Evaluador</Label>
                  <Select value={filterEvaluador} onValueChange={setFilterEvaluador}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Todos los evaluadores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los evaluadores</SelectItem>
                      {/* Aquí se cargarían los evaluadores dinámicamente */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Estado de Aprobación</Label>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="pendiente">Pendientes</SelectItem>
                      <SelectItem value="aprobado">Aprobados</SelectItem>
                      <SelectItem value="rechazado">Rechazados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Filtros Avanzados */}
          {mostrarFiltrosAvanzados && (
            <Card className="mb-4">
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="fecha-desde">Fecha Desde</Label>
                    <Input
                      id="fecha-desde"
                      type="date"
                      value={filterFechaDesde}
                      onChange={(e) => setFilterFechaDesde(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha-hasta">Fecha Hasta</Label>
                    <Input
                      id="fecha-hasta"
                      type="date"
                      value={filterFechaHasta}
                      onChange={(e) => setFilterFechaHasta(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="evaluador">Evaluador</Label>
                    <Select value={filterEvaluador} onValueChange={setFilterEvaluador}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los evaluadores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los evaluadores</SelectItem>
                        {evaluadoresUnicos.map((evaluador) => (
                          <SelectItem key={evaluador!.evaluador_id} value={evaluador!.evaluador_id.toString()}>
                            {evaluador!.evaluador_nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="operacion">Operación</Label>
                    <Select value={filterOperacion} onValueChange={setFilterOperacion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las operaciones" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas las operaciones</SelectItem>
                        <SelectItem value="INSERT">Crear</SelectItem>
                        <SelectItem value="UPDATE">Modificar</SelectItem>
                        <SelectItem value="DELETE">Eliminar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contenido Principal */}
        <div>
            {/* Estadísticas */}
            {estadisticas && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Cambios</p>
                    <p className="text-xl sm:text-2xl font-bold">{estadisticas.total_cambios}</p>
                  </div>
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Evaluadores con Cambios</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">{estadisticas.evaluadores_con_cambios}</p>
                  </div>
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Olimpistas Afectados</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{estadisticas.olimpistas_afectados}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Promedio Diferencia</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">
                      {estadisticas?.promedio_diferencia && typeof estadisticas.promedio_diferencia === 'number' 
                        ? estadisticas.promedio_diferencia.toFixed(2) 
                        : '0.00'}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sección de Reclamos */}
        <Card className="mb-6 border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              Gestión de Reclamos
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Herramientas específicas para manejar reclamos sobre cambios de notas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span className="font-medium text-red-800 text-sm sm:text-base">Reporte de Reclamo</span>
                </div>
                <p className="text-xs sm:text-sm text-red-700 mb-3">
                  Genera un reporte detallado de cambios para casos específicos
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-red-300 text-red-700 hover:bg-red-100 w-full sm:w-auto text-xs sm:text-sm"
                  onClick={() => {
                    const logsFiltrados = getLogsFiltrados()
                    const workbook = generarXLSXReclamos(logsFiltrados)
                    XLSX.writeFile(workbook, `reporte-reclamos-${new Date().toISOString().split('T')[0]}.xlsx`)
                    success('Reporte generado', 'Reporte de reclamos exportado correctamente')
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Generar Reporte
                </Button>
              </div>
              
              <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <span className="font-medium text-yellow-800 text-sm sm:text-base">Cambios Pendientes</span>
                </div>
                <p className="text-xs sm:text-sm text-yellow-700 mb-3">
                  Revisa cambios que requieren aprobación del coordinador
                </p>
                <div className="text-xl sm:text-2xl font-bold text-yellow-800">
                  {estadisticas?.cambios_pendientes || cambiosPendientes || 0}
                </div>
              </div>
              
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-blue-800 text-sm sm:text-base">Trazabilidad</span>
                </div>
                <p className="text-xs sm:text-sm text-blue-700 mb-3">
                  Historial completo de modificaciones con timestamps
                </p>
                <div className="text-xl sm:text-2xl font-bold text-blue-800">
                  {estadisticas?.total_cambios || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Logs estilo Azure DevOps */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando logs...</p>
              </div>
            ) : logsFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros</h3>
                <p className="text-gray-500">
                  {logs.length === 0 
                    ? 'No se encontraron cambios en las evaluaciones'
                    : 'No se encontraron registros con los filtros aplicados'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Estado</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Evaluador</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Fecha/Hora</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Participante</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Área/Nivel</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Cambio de Nota</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsFiltrados.map((log) => (
                        <TableRow key={log.id} className="hover:bg-gray-50">
                          <TableCell className="text-xs sm:text-sm">
                            {getEstadoBadge(log.estado_aprobacion)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">{log.evaluador_nombre}</div>
                                <div className="text-xs text-gray-500">ID: {log.evaluador_id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            <div>
                              <div>{new Date(log.fecha_cambio).toLocaleDateString('es-ES')}</div>
                              <div className="text-xs text-gray-500">{new Date(log.fecha_cambio).toLocaleTimeString('es-ES')}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">{log.olimpista_nombre}</div>
                              <div className="text-xs text-gray-500">ID: {log.olimpista_id}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">
                                {log.area_nombre}
                              </Badge>
                              <div className="text-xs text-gray-500">{log.nivel_nombre}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="max-w-xs">
                              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-mono flex-wrap">
                                {log.nota_anterior && (
                                  <span className="text-red-600 bg-red-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                    {log.nota_anterior}
                                  </span>
                                )}
                                {log.nota_anterior && log.nota_nueva && (
                                  <span className="text-gray-400">→</span>
                                )}
                                {log.nota_nueva && (
                                  <span className="text-green-600 bg-green-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                    {log.nota_nueva}
                                  </span>
                                )}
                              </div>
                              {log.motivo_cambio && (
                                <div className="text-xs text-gray-500 mt-1 italic max-w-xs truncate">
                                  "{log.motivo_cambio}"
                                </div>
                              )}
                            </div>
                          </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            {log.estado_aprobacion === 'pendiente' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedCambioRevision(log)
                                  setAccionRevision('aprobar')
                                  setObservacionesCoordinador('')
                                  setIsModalRevisionOpen(true)
                                }}
                                className="h-7 sm:h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Revisar</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLog(log)
                                setIsModalOpen(true)
                              }}
                              className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                              title="Ver detalles"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const workbook = generarXLSXReclamos([log])
                                XLSX.writeFile(workbook, `reclamo-${log.id}-${new Date().toISOString().split('T')[0]}.xlsx`)
                                success('Reporte generado', `Reporte individual del cambio ${log.id} exportado`)
                              }}
                              className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                              title="Exportar"
                            >
                              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalles */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalles del Cambio - Registro #{selectedLog?.id}
              </DialogTitle>
              <DialogDescription>
                Información completa del registro de auditoría para trazabilidad y reclamos
              </DialogDescription>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-6">
                {/* Información Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Participante</Label>
                      <p className="text-sm font-medium">{selectedLog.olimpista_nombre}</p>
                      <p className="text-xs text-gray-500">ID: {selectedLog.olimpista_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Evaluador Responsable</Label>
                      <p className="text-sm font-medium">{selectedLog.evaluador_nombre}</p>
                      <p className="text-xs text-gray-500">ID: {selectedLog.evaluador_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">IP Address</Label>
                      <p className="text-sm font-medium font-mono">{selectedLog.ip_address}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Área de Competencia</Label>
                      <p className="text-sm">{selectedLog.area_nombre}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Nivel</Label>
                      <p className="text-sm">{selectedLog.nivel_nombre}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Evaluación ID</Label>
                      <p className="text-sm font-mono">{selectedLog.evaluacion_id}</p>
                    </div>
                  </div>
                </div>
                
                {/* Cambios de Nota */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-500 mb-3 block">Cambios en la Evaluación</Label>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                      {selectedLog.nota_anterior && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Nota Anterior</p>
                          <div className="text-xl sm:text-2xl font-mono text-red-600 bg-red-100 px-3 sm:px-4 py-2 rounded-lg">
                            {selectedLog.nota_anterior}
                          </div>
                        </div>
                      )}
                      {selectedLog.nota_anterior && selectedLog.nota_nueva && (
                        <div className="text-center">
                          <div className="text-gray-400 text-xl sm:text-2xl">→</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Diferencia: {typeof selectedLog.nota_nueva === 'number' && typeof selectedLog.nota_anterior === 'number' 
                              ? (selectedLog.nota_nueva - selectedLog.nota_anterior).toFixed(2) 
                              : '0.00'} puntos
                          </div>
                        </div>
                      )}
                      {selectedLog.nota_nueva && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Nota Nueva</p>
                          <div className="text-xl sm:text-2xl font-mono text-green-600 bg-green-100 px-3 sm:px-4 py-2 rounded-lg">
                            {selectedLog.nota_nueva}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Información Adicional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.motivo_cambio && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Motivo del Cambio</Label>
                      <p className="text-sm mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        "{selectedLog.motivo_cambio}"
                      </p>
                    </div>
                  )}
                  
                  {selectedLog.observaciones_anterior && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Observaciones Anteriores</Label>
                      <p className="text-sm mt-1 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        {selectedLog.observaciones_anterior}
                      </p>
                    </div>
                  )}
                  
                  {selectedLog.observaciones_nueva && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Observaciones Nuevas</Label>
                      <p className="text-sm mt-1 p-3 bg-green-50 rounded-lg border border-green-200">
                        {selectedLog.observaciones_nueva}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Timestamp Detallado */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-500">Información de Trazabilidad</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Fecha del Cambio:</span>
                        <p className="font-mono">{new Date(selectedLog.fecha_cambio).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div>
                        <span className="font-medium">Hora del Cambio:</span>
                        <p className="font-mono">{new Date(selectedLog.fecha_cambio).toLocaleTimeString('es-ES')}</p>
                      </div>
                      <div>
                        <span className="font-medium">Registro ID:</span>
                        <p className="font-mono">{selectedLog.id}</p>
                      </div>
                      <div>
                        <span className="font-medium">Evaluación ID:</span>
                        <p className="font-mono">{selectedLog.evaluacion_id}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botones de Acción */}
                <div className="border-t pt-4 flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const workbook = generarXLSXReclamos([selectedLog])
                      XLSX.writeFile(workbook, `reclamo-detallado-${selectedLog.id}-${new Date().toISOString().split('T')[0]}.xlsx`)
                      success('Reporte generado', 'Reporte detallado exportado para reclamos')
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar para Reclamo
                  </Button>
                  <Button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Revisión */}
        <Dialog open={isModalRevisionOpen} onOpenChange={setIsModalRevisionOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Revisar Cambio - Registro #{selectedCambioRevision?.id}
              </DialogTitle>
              <DialogDescription>
                Revisa los detalles del cambio y decide si aprobar, rechazar o solicitar más información
              </DialogDescription>
            </DialogHeader>
            
            {selectedCambioRevision && (
              <div className="space-y-6">
                {/* Información Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Participante</Label>
                      <p className="text-sm font-medium">{selectedCambioRevision.olimpista_nombre}</p>
                      <p className="text-xs text-gray-500">ID: {selectedCambioRevision.olimpista_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Evaluador Responsable</Label>
                      <p className="text-sm font-medium">{selectedCambioRevision.evaluador_nombre}</p>
                      <p className="text-xs text-gray-500">ID: {selectedCambioRevision.evaluador_id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Área de Competencia</Label>
                      <p className="text-sm">{selectedCambioRevision.area_nombre}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Nivel</Label>
                      <p className="text-sm">{selectedCambioRevision.nivel_nombre}</p>
                    </div>
                  </div>
                </div>
                
                {/* Cambios de Nota */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-500 mb-3 block">Cambios en la Evaluación</Label>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                      {selectedCambioRevision.nota_anterior && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Nota Anterior</p>
                          <div className="text-xl sm:text-2xl font-mono text-red-600 bg-red-100 px-3 sm:px-4 py-2 rounded-lg">
                            {selectedCambioRevision.nota_anterior}
                          </div>
                        </div>
                      )}
                      {selectedCambioRevision.nota_anterior && selectedCambioRevision.nota_nueva && (
                        <div className="text-center">
                          <div className="text-gray-400 text-xl sm:text-2xl">→</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Diferencia: {typeof selectedCambioRevision.nota_nueva === 'number' && typeof selectedCambioRevision.nota_anterior === 'number' 
                              ? (selectedCambioRevision.nota_nueva - selectedCambioRevision.nota_anterior).toFixed(2) 
                              : '0.00'} puntos
                          </div>
                        </div>
                      )}
                      {selectedCambioRevision.nota_nueva && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Nota Nueva</p>
                          <div className="text-xl sm:text-2xl font-mono text-green-600 bg-green-100 px-3 sm:px-4 py-2 rounded-lg">
                            {selectedCambioRevision.nota_nueva}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Motivo del Cambio */}
                {selectedCambioRevision.motivo_cambio && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Motivo del Cambio</Label>
                    <p className="text-sm mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      "{selectedCambioRevision.motivo_cambio}"
                    </p>
                  </div>
                )}
                
                {/* Observaciones del Evaluador */}
                {selectedCambioRevision.observaciones_nueva && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Observaciones del Evaluador</Label>
                    <p className="text-sm mt-1 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      {selectedCambioRevision.observaciones_nueva}
                    </p>
                  </div>
                )}
                
                {/* Acción a realizar */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-500 mb-3 block">Acción a Realizar</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant={accionRevision === 'aprobar' ? 'default' : 'outline'}
                      onClick={() => setAccionRevision('aprobar')}
                      className={`w-full sm:w-auto ${accionRevision === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar
                    </Button>
                    <Button
                      variant={accionRevision === 'rechazar' ? 'default' : 'outline'}
                      onClick={() => setAccionRevision('rechazar')}
                      className={`w-full sm:w-auto ${accionRevision === 'rechazar' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button
                      variant={accionRevision === 'solicitar_info' ? 'default' : 'outline'}
                      onClick={() => setAccionRevision('solicitar_info')}
                      className={`w-full sm:w-auto ${accionRevision === 'solicitar_info' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Solicitar Info
                    </Button>
                  </div>
                </div>
                
                {/* Observaciones del Coordinador */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-500 mb-2 block">
                    Observaciones {accionRevision === 'solicitar_info' ? '(Requeridas)' : '(Opcionales)'}
                  </Label>
                  <Textarea
                    value={observacionesCoordinador}
                    onChange={(e) => setObservacionesCoordinador(e.target.value)}
                    placeholder={accionRevision === 'aprobar' 
                      ? 'Agrega observaciones sobre la aprobación (opcional)...'
                      : accionRevision === 'rechazar'
                      ? 'Explica el motivo del rechazo (opcional)...'
                      : 'Describe qué información adicional necesitas (requerido)...'}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                
                {/* Advertencia para rechazo */}
                {accionRevision === 'rechazar' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Advertencia:</strong> Al rechazar este cambio, la nota será revertida automáticamente a su valor anterior ({selectedCambioRevision.nota_anterior}).
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Botones de Acción */}
                <div className="border-t pt-4 flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsModalRevisionOpen(false)
                      setSelectedCambioRevision(null)
                      setObservacionesCoordinador('')
                    }}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleProcesarCambio}
                    disabled={submitting || (accionRevision === 'solicitar_info' && !observacionesCoordinador.trim())}
                    className={`w-full sm:w-auto ${
                      accionRevision === 'aprobar' ? 'bg-green-600 hover:bg-green-700' :
                      accionRevision === 'rechazar' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        {accionRevision === 'aprobar' && <CheckCircle className="h-4 w-4 mr-2" />}
                        {accionRevision === 'rechazar' && <XCircle className="h-4 w-4 mr-2" />}
                        {accionRevision === 'solicitar_info' && <Info className="h-4 w-4 mr-2" />}
                        {accionRevision === 'aprobar' ? 'Aprobar Cambio' :
                         accionRevision === 'rechazar' ? 'Rechazar Cambio' :
                         'Solicitar Información'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  )
}
