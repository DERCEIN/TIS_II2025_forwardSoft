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
import { ApiService } from '@/lib/api'
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
  Settings
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
}

interface EstadisticasLog {
  total_cambios: number
  evaluadores_con_cambios: number
  olimpistas_afectados: number
  promedio_diferencia: number
  primer_cambio: string
  ultimo_cambio: string
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
  
  // Estados para modal de detalles
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogCambio | null>(null)

  // Estados adicionales para funcionalidad avanzada
  const [rangoFechas, setRangoFechas] = useState<string>('')
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [exportando, setExportando] = useState(false)

  // Función para actualizar rango de fechas
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

  // Verificar autenticación
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('❌ Usuario no autenticado, redirigiendo al login...')
      window.location.href = '/login'
    }
  }, [isAuthenticated, isLoading])

  // Solo cargar logs cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      fetchLogs()
      actualizarRangoFechas()
    }
  }, [user])

  // Actualizar rango de fechas cuando cambien los filtros
  useEffect(() => {
    actualizarRangoFechas()
  }, [filterFechaDesde, filterFechaHasta])

  // Mostrar loading mientras se verifica la autenticación
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

  // Si no está autenticado, no mostrar nada (se redirigirá)
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
      const csvContent = generarCSV(logsFiltrados)
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `log-auditoria-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      success('Exportación exitosa', 'Log de auditoría exportado correctamente')
    } catch (err) {
      error('Error', 'No se pudo exportar el log de auditoría')
    } finally {
      setExportando(false)
    }
  }

  const generarCSV = (logs: LogCambio[]) => {
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
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const generarCSVReclamos = (logs: LogCambio[]) => {
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
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Usar el área específica del coordinador logueado
      const areaId = user?.area_id || 1 // Fallback a área 1 si no hay usuario
      console.log('User completo:', user)
      console.log('Area ID del usuario:', areaId)
      
      if (!areaId) {
        console.error('No se encontró area_id en el usuario')
        error('Error', 'No se pudo determinar el área del coordinador')
        return
      }
      
      console.log('Fetching logs for area_id:', areaId)
      params.append('area_id', areaId.toString())
      
      if (filterFechaDesde) params.append('fecha_desde', filterFechaDesde)
      if (filterFechaHasta) params.append('fecha_hasta', filterFechaHasta)
      if (filterEvaluador !== 'todos') params.append('evaluador_id', filterEvaluador)
      
      const data = await ApiService.get(`/api/coordinador/log-cambios-notas?${params}`)
      console.log('Log response data:', data)
      setLogs(data.data?.cambios || [])
      setEstadisticas(data.data?.estadisticas || null)
      console.log('Logs set:', data.data?.cambios || [])
    } catch (err: any) {
      console.error('Error fetching logs:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'No se pudieron cargar los logs de auditoría'
      error('Error', errorMessage)
    } finally {
      setLoading(false)
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Log de Cambios</h1>
              <p className="text-sm text-gray-600">
                Sistema de trazabilidad completa para rastrear cambios de notas en caso de reclamos o actualizaciones
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setRefreshing(true)
                  fetchLogs().finally(() => setRefreshing(false))
                }}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              <Button 
                onClick={exportarLogs}
                disabled={exportando || logs.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportando ? 'Exportando...' : 'Exportar para Reclamos'}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          
          {/* Barra de selección de fechas */}
          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              {rangoFechas ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{rangoFechas}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={limpiarFiltrosFecha}
                    className="h-6 w-6 p-0 hover:bg-gray-200"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Selecciona un rango de fechas</span>
              )}
            </div>
          </div>

          {/* Sección de filtros */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700"></h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                 <span className="hidden lg:inline">Filtros</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Operación</Label>
                  <Select value={filterOperacion} onValueChange={setFilterOperacion}>
                    <SelectTrigger className="text-sm">
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
          
          {/* Filtros Avanzados */}
          {mostrarFiltrosAvanzados && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cambios</p>
                    <p className="text-2xl font-bold">{estadisticas.total_cambios}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Evaluadores con Cambios</p>
                    <p className="text-2xl font-bold text-yellow-600">{estadisticas.evaluadores_con_cambios}</p>
                  </div>
                  <Users className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Olimpistas Afectados</p>
                    <p className="text-2xl font-bold text-green-600">{estadisticas.olimpistas_afectados}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Promedio Diferencia</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {estadisticas?.promedio_diferencia && typeof estadisticas.promedio_diferencia === 'number' 
                        ? estadisticas.promedio_diferencia.toFixed(2) 
                        : '0.00'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sección de Reclamos */}
        <Card className="mb-6 border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Gestión de Reclamos
            </CardTitle>
            <CardDescription>
              Herramientas específicas para manejar reclamos sobre cambios de notas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Reporte de Reclamo</span>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  Genera un reporte detallado de cambios para casos específicos
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => {
                    const logsFiltrados = getLogsFiltrados()
                    const csvContent = generarCSVReclamos(logsFiltrados)
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                    const link = document.createElement('a')
                    const url = URL.createObjectURL(blob)
                    link.setAttribute('href', url)
                    link.setAttribute('download', `reporte-reclamos-${new Date().toISOString().split('T')[0]}.csv`)
                    link.style.visibility = 'hidden'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    success('Reporte generado', 'Reporte de reclamos exportado correctamente')
                  }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Generar Reporte
                </Button>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Cambios Pendientes</span>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  Revisa cambios que requieren aprobación del coordinador
                </p>
                <div className="text-2xl font-bold text-yellow-800">
                  {estadisticas?.evaluadores_con_cambios || 0}
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Trazabilidad</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Historial completo de modificaciones con timestamps
                </p>
                <div className="text-2xl font-bold text-blue-800">
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold text-gray-700">Evaluador</TableHead>
                      <TableHead className="font-semibold text-gray-700">Fecha/Hora</TableHead>
                      <TableHead className="font-semibold text-gray-700">Participante</TableHead>
                      <TableHead className="font-semibold text-gray-700">Área/Nivel</TableHead>
                      <TableHead className="font-semibold text-gray-700">Cambio de Nota</TableHead>
                      <TableHead className="font-semibold text-gray-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsFiltrados.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{log.evaluador_nombre}</div>
                              <div className="text-xs text-gray-500">ID: {log.evaluador_id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">
                          <div>
                            <div>{new Date(log.fecha_cambio).toLocaleDateString('es-ES')}</div>
                            <div className="text-xs text-gray-500">{new Date(log.fecha_cambio).toLocaleTimeString('es-ES')}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{log.olimpista_nombre}</div>
                            <div className="text-xs text-gray-500">ID: {log.olimpista_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {log.area_nombre}
                            </Badge>
                            <div className="text-xs text-gray-500">{log.nivel_nombre}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="flex items-center gap-2 text-sm font-mono">
                              {log.nota_anterior && (
                                <span className="text-red-600 bg-red-50 px-2 py-1 rounded">
                                  {log.nota_anterior}
                                </span>
                              )}
                              {log.nota_anterior && log.nota_nueva && (
                                <span className="text-gray-400">→</span>
                              )}
                              {log.nota_nueva && (
                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
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
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLog(log)
                                setIsModalOpen(true)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const csvContent = generarCSVReclamos([log])
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                                const link = document.createElement('a')
                                const url = URL.createObjectURL(blob)
                                link.setAttribute('href', url)
                                link.setAttribute('download', `reclamo-${log.id}-${new Date().toISOString().split('T')[0]}.csv`)
                                link.style.visibility = 'hidden'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                success('Reporte generado', `Reporte individual del cambio ${log.id} exportado`)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalles */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl">
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
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-6">
                      {selectedLog.nota_anterior && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Nota Anterior</p>
                          <div className="text-2xl font-mono text-red-600 bg-red-100 px-4 py-2 rounded-lg">
                            {selectedLog.nota_anterior}
                          </div>
                        </div>
                      )}
                      {selectedLog.nota_anterior && selectedLog.nota_nueva && (
                        <div className="text-center">
                          <div className="text-gray-400 text-2xl">→</div>
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
                          <div className="text-2xl font-mono text-green-600 bg-green-100 px-4 py-2 rounded-lg">
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
                <div className="border-t pt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const csvContent = generarCSVReclamos([selectedLog])
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                      const link = document.createElement('a')
                      const url = URL.createObjectURL(blob)
                      link.setAttribute('href', url)
                      link.setAttribute('download', `reclamo-detallado-${selectedLog.id}-${new Date().toISOString().split('T')[0]}.csv`)
                      link.style.visibility = 'hidden'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      success('Reporte generado', 'Reporte detallado exportado para reclamos')
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar para Reclamo
                  </Button>
                  <Button onClick={() => setIsModalOpen(false)}>
                    Cerrar
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
