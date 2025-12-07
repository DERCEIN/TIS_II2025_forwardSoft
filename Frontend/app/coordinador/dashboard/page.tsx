"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { OlimpistaService, AuthService, ReporteService, AdminService, CoordinadorService, PublicacionResultadosService, CertificadosService } from "@/lib/api"
import { Input } from "@/components/ui/input"
import {
  Trophy,
  Users,
  Settings,
  Calendar,
  UserCheck,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Bell,
  LogOut,
  Award,
  Download,
  Eye,
  Archive,
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
  BarChart3,
  Activity,
  UserX,
  CheckCircle2,
  Timer,
  Globe,
  EyeOff,
  FileSpreadsheet,
  Loader2,
  Lock,
  Share2,
  Medal,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import FirmaDigital from "@/components/FirmaDigital"
import { useToast } from "@/hooks/use-toast"
import CoordinadorCertificateModal from "@/app/certificados/components/CoordinadorCertificateModal"
import { Area } from "@/app/certificados/utils/certificateGenerator"

function ListaInscritosAreaNivel() {
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>("")
  const [departamentoFilter, setDepartamentoFilter] = useState<string>("all")
  const [nivelFilter, setNivelFilter] = useState<string>("all")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("nombre")
  const [participantes, setParticipantes] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    total: 0,
    porArea: {},
    porNivel: {},
    porEstado: {}
  })

  
  const demoParticipantes = [
    {
      id: 1,
      nombre_completo: "Ana García López",
      documento_identidad: "44332211",
      unidad_educativa_nombre: "Colegio Nacional",
      departamento_nombre: "Cochabamba",
      area_nombre: "Matemáticas",
      nivel_nombre: "Primario",
      inscripcion_estado: "confirmado",
      fecha_inscripcion: "2025-01-15",
      telefono: "78945612",
      email: "ana.garcia@email.com"
    },
    {
      id: 2,
      nombre_completo: "Carlos Mendoza Vargas",
      documento_identidad: "11223344",
      unidad_educativa_nombre: "Colegio Técnico",
      departamento_nombre: "La Paz",
      area_nombre: "Física",
      nivel_nombre: "Secundario",
      inscripcion_estado: "confirmado",
      fecha_inscripcion: "2025-01-14",
      telefono: "65432198",
      email: "carlos.mendoza@email.com"
    },
    {
      id: 3,
      nombre_completo: "María Torres Condori",
      documento_identidad: "98765432",
      unidad_educativa_nombre: "U.E. Bolivar",
      departamento_nombre: "Santa Cruz",
      area_nombre: "Química",
      nivel_nombre: "Superior",
      inscripcion_estado: "pendiente",
      fecha_inscripcion: "2025-01-16",
      telefono: "12345678",
      email: "maria.torres@email.com"
    },
    {
      id: 4,
      nombre_completo: "Luis Rodríguez Mamani",
      documento_identidad: "55667788",
      unidad_educativa_nombre: "Colegio San Simón",
      departamento_nombre: "Cochabamba",
      area_nombre: "Matemáticas",
      nivel_nombre: "Secundario",
      inscripcion_estado: "confirmado",
      fecha_inscripcion: "2025-01-13",
      telefono: "98765432",
      email: "luis.rodriguez@email.com"
    },
    {
      id: 5,
      nombre_completo: "Elena Vargas Quispe",
      documento_identidad: "33445566",
      unidad_educativa_nombre: "Colegio Central",
      departamento_nombre: "Oruro",
      area_nombre: "Física",
      nivel_nombre: "Primario",
      inscripcion_estado: "rechazado",
      fecha_inscripcion: "2025-01-12",
      telefono: "45678912",
      email: "elena.vargas@email.com"
    },
    {
      id: 6,
      nombre_completo: "Diego Morales Choque",
      documento_identidad: "77889900",
      unidad_educativa_nombre: "U.E. Central",
      departamento_nombre: "Potosí",
      area_nombre: "Química",
      nivel_nombre: "Primario",
      inscripcion_estado: "confirmado",
      fecha_inscripcion: "2025-01-17",
      telefono: "32165498",
      email: "diego.morales@email.com"
    }
  ]

  
  useEffect(() => {
    loadData()
  }, [])

  
  const filteredParticipantes = participantes.filter(p => {
    const nombre = p.nombre_completo || p.nombre || ''
    const documento = p.documento_identidad || p.documento || ''
    const institucion = p.unidad_educativa_nombre || p.institucion || ''
    
    const matchesSearch = !search || 
      nombre.toLowerCase().includes(search.toLowerCase()) ||
      documento.includes(search) ||
      institucion.toLowerCase().includes(search.toLowerCase())
    
    const area = p.area_nombre || p.area || ''
    const departamento = p.departamento_nombre || p.departamento || ''
    const nivel = p.nivel_nombre || p.nivel || ''
    const estado = p.estado_evaluacion || p.inscripcion_estado || p.estado || ''
    
    const matchesDepartamento = departamentoFilter === "all" || departamento === departamentoFilter
    const matchesNivel = nivelFilter === "all" || nivel === nivelFilter
    const matchesEstado = estadoFilter === "all" || estado === estadoFilter

    return matchesSearch && matchesDepartamento && matchesNivel && matchesEstado
  }).sort((a, b) => {
    const nombreA = a.nombre_completo || a.nombre || ''
    const nombreB = b.nombre_completo || b.nombre || ''
    const areaA = a.area_nombre || a.area || ''
    const areaB = b.area_nombre || b.area || ''
    const nivelA = a.nivel_nombre || a.nivel || ''
    const nivelB = b.nivel_nombre || b.nivel || ''
    const estadoA = a.estado_evaluacion || a.inscripcion_estado || a.estado || ''
    const estadoB = b.estado_evaluacion || b.inscripcion_estado || b.estado || ''
    const fechaA = a.fecha_evaluacion || a.fecha_inscripcion || a.fecha || ''
    const fechaB = b.fecha_evaluacion || b.fecha_inscripcion || b.fecha || ''
    
    switch (sortBy) {
      case "nombre":
        return nombreA.localeCompare(nombreB)
      case "area":
        return areaA.localeCompare(areaB)
      case "nivel":
        return nivelA.localeCompare(nivelB)
      case "estado":
        return estadoA.localeCompare(estadoB)
      case "fecha":
        return new Date(fechaB).getTime() - new Date(fechaA).getTime()
      default:
        return 0
    }
  })

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "confirmado":
        return "bg-green-100 text-green-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "rechazado":
        return "bg-red-100 text-red-800"
      case "sin_evaluar":
        return "bg-gray-100 text-gray-800"
      case "evaluado":
        return "bg-blue-100 text-blue-800"
      case "descalificado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case "confirmado":
        return "Confirmado"
      case "pendiente":
        return "Pendiente"
      case "rechazado":
        return "Rechazado"
      case "sin_evaluar":
        return "Sin Evaluar"
      case "evaluado":
        return "Evaluado"
      case "descalificado":
        return "Descalificado"
      default:
        return estado
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('Cargando participantes desde el backend...')
      
      
      const profileResponse = await AuthService.getProfile()
      let areaId = null
      
      if (profileResponse.success && profileResponse.data) {
        console.log('Perfil completo del coordinador:', profileResponse.data)
        
        
        areaId = profileResponse.data.area_id || 
                 profileResponse.data.area?.id || 
                 profileResponse.data.areas?.[0]?.id ||
                 profileResponse.data.area_competencia_id
        
        console.log('Área ID encontrada:', areaId)
        console.log('Áreas disponibles:', profileResponse.data.areas)
        console.log('Área nombre:', profileResponse.data.area_nombre)
      }
      
      
      if (!areaId) {
        console.log('No se encontró areaId, intentando obtener áreas...')
        try {
          const catalogosResponse = await CoordinadorService.getCatalogos()
          console.log('Catálogos obtenidos:', catalogosResponse)
          
          if (catalogosResponse.success && catalogosResponse.data?.areas) {
            
            const areaMatematicas = catalogosResponse.data.areas.find((area: any) => 
              area.nombre.toLowerCase().includes('matemática') || 
              area.nombre.toLowerCase().includes('matematicas')
            )
            if (areaMatematicas) {
              areaId = areaMatematicas.id
              console.log('Área de matemáticas encontrada:', areaMatematicas)
            }
          }
        } catch (error) {
          console.error('Error obteniendo catálogos:', error)
        }
      }
      
      console.log('Área ID final a usar:', areaId)
      
      
      const response = await CoordinadorService.getParticipantesConEvaluaciones({
        area_id: areaId
      })
      console.log('Participantes obtenidos del backend:', response)
      
      if (response.success && response.data) {
        const data = response.data
        const participantesData = Array.isArray(data.participantes) ? data.participantes : []
        console.log('Participantes encontrados:', participantesData.length)
        console.log('Primer participante (ejemplo):', participantesData[0])
        console.log('Campos de unidad educativa:', participantesData.map((p: any) => ({
          nombre: p.nombre_completo,
          unidad_educativa: p.unidad_educativa_nombre,
          institucion: p.institucion
        })))
        
        
        const total = participantesData.length
        const porArea = participantesData.reduce((acc: any, p: any) => {
          const area = p.area_nombre || p.area || 'Sin área'
          acc[area] = (acc[area] || 0) + 1
          return acc
        }, {})
        const porNivel = participantesData.reduce((acc: any, p: any) => {
          const nivel = p.nivel_nombre || p.nivel || 'Sin nivel'
          acc[nivel] = (acc[nivel] || 0) + 1
          return acc
        }, {})
        const porEstado = participantesData.reduce((acc: any, p: any) => {
          const estado = p.estado_evaluacion || p.inscripcion_estado || p.estado || 'Sin estado'
          acc[estado] = (acc[estado] || 0) + 1
          return acc
        }, {})

        setStats({ total, porArea, porNivel, porEstado })
        setParticipantes(participantesData)
      } else {
        console.error('Error en respuesta del backend:', response.message)
        
        setStats({ total: 0, porArea: {}, porNivel: {}, porEstado: {} })
        setParticipantes([])
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error cargando participantes:', error)
      
      setStats({ total: 0, porArea: {}, porNivel: {}, porEstado: {} })
      setParticipantes([])
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const exportToCSV = () => {
    const headers = ["Nombre", "Documento", "Unidad Educativa", "Departamento", "Área", "Nivel", "Estado", "Puntuación", "Evaluador", "Fecha Evaluación", "Observaciones"]
    const rows = [headers.join(',')]
    
    filteredParticipantes.forEach(p => {
      const row = [
        p.nombre_completo || p.nombre || '',
        p.documento_identidad || p.documento || '',
        p.unidad_educativa_nombre || p.institucion || '',
        p.departamento_nombre || p.departamento || '',
        p.area_nombre || p.area || '',
        p.nivel_nombre || p.nivel || '',
        getEstadoText(p.estado_evaluacion || p.inscripcion_estado || p.estado || ''),
        p.puntuacion || '',
        p.evaluador_nombre || '',
        p.fecha_evaluacion || '',
        p.observaciones || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`)
      rows.push(row.join(','))
    })

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `participantes_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando lista de participantes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Inscritos de Mi Área</h2>
          <p className="text-muted-foreground">
            Consulta la lista de participantes inscritos en tu área de coordinación para planificar la logística de evaluación
          </p>
          {participantes.length > 0 && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
               <strong>{participantes.length} participantes</strong> encontrados en tu área
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Inscritos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.porArea).length}</div>
              <div className="text-sm text-muted-foreground">Mi Área</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="w-full">
              <Input 
                placeholder="Buscar por nombre, documento o institución..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={departamentoFilter} onValueChange={setDepartamentoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  <SelectItem value="Cochabamba">Cochabamba</SelectItem>
                  <SelectItem value="La Paz">La Paz</SelectItem>
                  <SelectItem value="Santa Cruz">Santa Cruz</SelectItem>
                  <SelectItem value="Oruro">Oruro</SelectItem>
                  <SelectItem value="Potosí">Potosí</SelectItem>
                  <SelectItem value="Chuquisaca">Chuquisaca</SelectItem>
                  <SelectItem value="Tarija">Tarija</SelectItem>
                  <SelectItem value="Beni">Beni</SelectItem>
                  <SelectItem value="Pando">Pando</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={nivelFilter} onValueChange={setNivelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  {Object.keys(stats.porNivel).map(nivel => (
                    <SelectItem key={nivel} value={nivel}>
                      {nivel} ({stats.porNivel[nivel]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.keys(stats.porEstado).map(estado => (
                    <SelectItem key={estado} value={estado}>
                      {getEstadoText(estado)} ({stats.porEstado[estado] as number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="area">Área</SelectItem>
                  <SelectItem value="nivel">Nivel</SelectItem>
                  <SelectItem value="estado">Estado</SelectItem>
                  <SelectItem value="fecha">Fecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de participantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Participantes ({filteredParticipantes.length})</span>
            <Badge variant="outline">
              {filteredParticipantes.length} de {stats.total}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participantes.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No hay participantes registrados</p>
              <p className="text-sm text-muted-foreground">Los datos se cargan desde el backend automáticamente</p>
            </div>
          ) : filteredParticipantes.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron participantes con los filtros aplicados</p>
              <Button variant="outline" size="sm" onClick={() => {
                setSearch('')
                setDepartamentoFilter('all')
                setNivelFilter('all')
                setEstadoFilter('all')
              }} className="mt-2">
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParticipantes.map((participante) => (
                <div key={participante.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{participante.nombre_completo || participante.nombre || 'Sin nombre'}</h3>
                        <Badge className={getEstadoColor(participante.estado_evaluacion || participante.inscripcion_estado || participante.estado || '')}>
                          {getEstadoText(participante.estado_evaluacion || participante.inscripcion_estado || participante.estado || '')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div><span className="font-medium">Documento:</span> {participante.documento_identidad || participante.documento || 'N/A'}</div>
                        <div><span className="font-medium">Unidad Educativa:</span> {participante.unidad_educativa_nombre || participante.institucion || 'N/A'}</div>
                        <div><span className="font-medium">Departamento:</span> {participante.departamento_nombre || participante.departamento || 'N/A'}</div>
                        <div><span className="font-medium">Área:</span> {participante.area_nombre || participante.area || 'N/A'}</div>
                        <div><span className="font-medium">Nivel:</span> {participante.nivel_nombre || participante.nivel || 'N/A'}</div>
                        <div><span className="font-medium">Puntuación:</span> {participante.puntuacion ? `${participante.puntuacion}/100` : 'N/A'}</div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span><span className="font-medium">Evaluador:</span> {participante.evaluador_nombre || 'N/A'}</span>
                        <span><span className="font-medium">Fecha Evaluación:</span> {participante.fecha_evaluacion ? new Date(participante.fecha_evaluacion).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      
                      {participante.observaciones && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Observaciones:</span> {participante.observaciones}
                        </div>
                      )}
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planificación de logística */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planificación de Logística de Evaluación
          </CardTitle>
          <CardDescription>
            Resumen para planificar la logística de evaluación en tu área de coordinación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Distribución por Nivel</h4>
              <div className="space-y-2">
                {Object.entries(stats.porNivel).map(([nivel, count]) => (
                  <div key={nivel} className="flex justify-between items-center">
                    <span className="text-sm">{nivel}</span>
                    <Badge variant="outline">{count as number} participantes</Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Estado de Evaluaciones</h4>
              <div className="space-y-2">
                {Object.entries(stats.porEstado).map(([estado, count]) => (
                  <div key={estado} className="flex justify-between items-center">
                    <span className="text-sm">{getEstadoText(estado)}</span>
                    <Badge variant="outline">{count as number} participantes</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Recomendaciones para la Logística</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Total de participantes en tu área: <strong>{stats.total}</strong></li>
              <li>• Participantes sin evaluar: <strong>{stats.porEstado.sin_evaluar || 0}</strong></li>
              <li>• Participantes evaluados: <strong>{stats.porEstado.evaluado || 0}</strong></li>
              <li>• Se recomienda asignar evaluadores proporcionalmente por nivel</li>
              <li>• Considerar espacios físicos según la distribución por nivel</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProgresoEvaluacionClasificatoria() {
  const [loading, setLoading] = useState<boolean>(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [descargandoPDF, setDescargandoPDF] = useState<boolean>(false)
  const [descargandoExcel, setDescargandoExcel] = useState<boolean>(false)
  const [faseCerrada, setFaseCerrada] = useState<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [progressData, setProgressData] = useState<any>({
    niveles: [],
    evaluadores: { total: 0, activos: 0 },
    olimpistas_sin_evaluar: [],
    estadisticas_generales: {
      total_olimpistas: 0,
      total_evaluados: 0,
      total_pendientes: 0,
      promedio_general: 0
    }
  })

  
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await CoordinadorService.getProgresoEvaluacion()
        if (response.success) {
          setProgressData(response.data)
          setLastUpdate(new Date())
          const cerrada = response.data?.estado_fase?.cerrada || false
          const estado = response.data?.estado_fase?.estado || 'activa'
          
          
          const estaCerrada = cerrada || estado === 'cerrada'
          setFaseCerrada(estaCerrada)
          
          console.log(' [ProgresoEvaluacion] Estado fase:', {
            cerrada: cerrada,
            estado: estado,
            estaCerrada: estaCerrada,
            fecha_cierre: response.data?.estado_fase?.fecha_cierre
          })
          
          // Si la fase está cerrada, detener la actualización automática
          if (estaCerrada && intervalRef.current) {
            console.log(' [ProgresoEvaluacion] Fase cerrada, deteniendo actualización automática')
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          
          return estaCerrada
        }
      } catch (error) {
        console.error('Error cargando datos de progreso:', error)
      } finally {
        setLoading(false)
      }
      return false
    }

    
    loadData().then((estaCerrada) => {
      
      if (!estaCerrada) {
        console.log(' [ProgresoEvaluacion] Iniciando actualización automática cada 30 segundos')
        intervalRef.current = setInterval(async () => {
          const cerrada = await loadData()
          if (cerrada && intervalRef.current) {
            console.log(' [ProgresoEvaluacion] Fase cerrada detectada, deteniendo actualización')
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }, 30000)
      } else {
        console.log(' [ProgresoEvaluacion] Fase ya está cerrada, no se iniciará actualización automática')
      }
    })
    
    return () => {
      if (intervalRef.current) {
        console.log(' [ProgresoEvaluacion] Limpiando intervalo al desmontar componente')
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await CoordinadorService.getProgresoEvaluacion()
      if (response.success) {
        setProgressData(response.data)
        setLastUpdate(new Date())
        const cerrada = response.data?.estado_fase?.cerrada || false
        const estado = response.data?.estado_fase?.estado || 'activa'
        const estaCerrada = cerrada || estado === 'cerrada'
        setFaseCerrada(estaCerrada)
        
       
        if (estaCerrada && intervalRef.current) {
          console.log(' [ProgresoEvaluacion] Fase cerrada detectada en refresh, deteniendo actualización')
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch (error) {
      console.error('Error actualizando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDescargarPDF = async () => {
    setDescargandoPDF(true)
    try {
      const result = await CoordinadorService.descargarReportePDFProgreso()
      if (!result.success) {
        alert('Error al descargar el PDF: ' + (result.error || 'Error desconocido'))
      }
    } catch (error: any) {
      console.error('Error descargando PDF:', error)
      alert('Error al descargar el PDF: ' + (error.message || 'Error desconocido'))
    } finally {
      setDescargandoPDF(false)
    }
  }

  const handleDescargarExcel = async () => {
    setDescargandoExcel(true)
    try {
      const result = await CoordinadorService.descargarReporteExcelProgreso()
      if (!result.success) {
        alert('Error al descargar el Excel: ' + (result.error || 'Error desconocido'))
      }
    } catch (error: any) {
      console.error('Error descargando Excel:', error)
      alert('Error al descargar el Excel: ' + (error.message || 'Error desconocido'))
    } finally {
      setDescargandoExcel(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando progreso de evaluación...</p>
      </div>
    )
  }

  
  const nivelesAgrupados = (() => {
    const grupos: Record<string, {
      nivel_nombre: string,
      evaluados: number,
      pendientes: number,
      desclasificados: number,
      promedio_puntuacion: number,
      porcentaje: number,
      porcentaje_desclasificados: number
    }> = {}

    const source: any[] = Array.isArray(progressData.niveles) ? progressData.niveles : []

    for (const n of source) {
      const nombre: string = (n?.nivel_nombre || '').toString().toLowerCase()
      
      
      let key: string | undefined = undefined
      if (nombre.includes('primaria') || nombre.includes('primario')) {
        key = 'Primaria'
      } else if (nombre.includes('secundaria') || nombre.includes('secundario')) {
        key = 'Secundaria'
      }

      
      if (!key) continue

      
      if (!grupos[key]) {
        grupos[key] = {
          nivel_nombre: key,
          evaluados: 0,
          pendientes: 0,
          desclasificados: 0,
          promedio_puntuacion: 0,
          porcentaje: 0,
          porcentaje_desclasificados: 0,
        }
      }

      
      const evaluados = Number(n?.evaluados || 0)
      const pendientes = Number(n?.pendientes || 0)
      const desclasificados = Number(n?.desclasificados || 0)
      
      
      const promedioActual = Number(n?.promedio_puntuacion || 0)
      const totalEvaluadosPrev = grupos[key].evaluados
      const totalEvaluadosNew = totalEvaluadosPrev + evaluados
      
      grupos[key].promedio_puntuacion = totalEvaluadosNew > 0
        ? ((grupos[key].promedio_puntuacion * totalEvaluadosPrev) + (promedioActual * evaluados)) / totalEvaluadosNew
        : grupos[key].promedio_puntuacion

      grupos[key].evaluados += evaluados
      grupos[key].pendientes += pendientes
      grupos[key].desclasificados += desclasificados

      
      const total = grupos[key].evaluados + grupos[key].pendientes + grupos[key].desclasificados
      grupos[key].porcentaje = total > 0 ? Math.round((grupos[key].evaluados / total) * 100) : 0
      grupos[key].porcentaje_desclasificados = total > 0 ? Math.round((grupos[key].desclasificados / total) * 100) : 0
    }


    const ordenados = Object.values(grupos).map(g => ({
      ...g,
      promedio_puntuacion: Math.round(g.promedio_puntuacion)
    }))
    
    
    return ordenados.sort((a, b) => {
      if (a.nivel_nombre === 'Primaria') return -1
      if (b.nivel_nombre === 'Primaria') return 1
      return 0
    })
  })()

  return (
    <div className="space-y-6">
      {/* Header con actualización en tiempo real */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-foreground">Progreso de Evaluación Clasificatoria</h2>
            {(faseCerrada || progressData?.estado_fase?.cerrada || progressData?.estado_fase?.estado === 'cerrada') && (
              <Badge variant="default" className="bg-gray-600">
                <Archive className="h-3 w-3 mr-1" />
                Fase Cerrada
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Última actualización: {lastUpdate.toLocaleTimeString()}
            {(faseCerrada || progressData?.estado_fase?.cerrada || progressData?.estado_fase?.estado === 'cerrada') && progressData?.estado_fase?.fecha_cierre && (
              <span className="ml-2 text-gray-600">
                • Cerrada el {new Date(progressData.estado_fase.fecha_cierre).toLocaleDateString()}
              </span>
            )}
            {faseCerrada && (
              <span className="ml-2 text-gray-600 italic">
                (Actualización automática desactivada)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDescargarPDF}
            disabled={descargandoPDF}
            className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
          >
            <FileText className={`h-4 w-4 ${descargandoPDF ? 'animate-spin' : ''}`} />
            {descargandoPDF ? 'Generando...' : 'PDF'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDescargarExcel}
            disabled={descargandoExcel}
            className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className={`h-4 w-4 ${descargandoExcel ? 'animate-spin' : ''}`} />
            {descargandoExcel ? 'Generando...' : 'Excel'}
          </Button>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Activity className="h-4 w-4" />
            <span>Tiempo real</span>
          </div>
        </div>
      </div>

      {/* Dashboard de Alertas (deshabilitado) */}
      {false && progressData.alertas && progressData.alertas.total_alertas > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Alertas de Evaluación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-100 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {progressData.alertas.criticas}
                </div>
                <div className="text-sm text-red-700">Críticas (&gt;5 días)</div>
              </div>
              <div className="text-center p-4 bg-orange-100 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {progressData.alertas.advertencias}
                </div>
                <div className="text-sm text-orange-700">Advertencias (3-5 días)</div>
              </div>
              <div className="text-center p-4 bg-yellow-100 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {progressData.alertas.total_alertas}
                </div>
                <div className="text-sm text-yellow-700">Total Alertas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard con Progreso por Nivel y Evaluadores Activos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progreso por Nivel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Progreso por Nivel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(nivelesAgrupados.length > 0 ? nivelesAgrupados : progressData.niveles).map((nivel: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{nivel.nivel_nombre}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-semibold text-green-700">{nivel.evaluados}</div>
                        <div className="text-xs text-green-600">Evaluados</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-semibold text-orange-700">{nivel.pendientes || 0}</div>
                        <div className="text-xs text-orange-600">Pendientes</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-semibold text-red-700">{nivel.desclasificados || 0}</div>
                        <div className="text-xs text-red-600">Desclasificados</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-semibold text-blue-700">{nivel.promedio_puntuacion ? Math.round(nivel.promedio_puntuacion) : 0}</div>
                        <div className="text-xs text-blue-600">Promedio</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progreso: {nivel.porcentaje}%</span>
                        <span>Desclasificados: {nivel.porcentaje_desclasificados || 0}%</span>
                      </div>
                      <Progress value={nivel.porcentaje} className="h-2" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {nivel.porcentaje}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evaluadores Activos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Evaluadores Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {progressData.evaluadores.con_permisos || 0}/{progressData.evaluadores.total}
                </div>
                <div className="text-sm text-muted-foreground">Con Permisos Activos</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Pueden registrar notas
                </div>
              </div>
              
              {/* Lista de evaluadores */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Lista de Evaluadores</h4>
                {progressData.evaluadores_lista && progressData.evaluadores_lista.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {progressData.evaluadores_lista.map((evaluador: any) => (
                      <div key={evaluador.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{evaluador.nombre}</div>
                          <div className="text-xs text-muted-foreground">{evaluador.email}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            evaluador.estado === 'con_permisos' 
                              ? 'bg-green-100 text-green-800' 
                              : evaluador.estado === 'activo_sin_permisos'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {evaluador.estado === 'con_permisos' ? 'Con Permisos' : 
                             evaluador.estado === 'activo_sin_permisos' ? 'Sin Permisos' : 'Inactivo'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {evaluador.evaluaciones_completadas} evaluaciones
                          </div>
                          {evaluador.start_date && (
                            <div className="text-xs text-blue-600 mt-1">
                              Permiso: {new Date(evaluador.start_date).toLocaleDateString()} 
                              ({evaluador.duration_days} días)
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground text-sm">
                    No hay evaluadores registrados
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Tiempo y Descalificaciones (deshabilitado) */}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Métricas de Tiempo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Métricas de Tiempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {progressData.metricas_tiempo?.dias_promedio_evaluacion || 0}
                    </div>
                    <div className="text-xs text-blue-600">Días Promedio</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {progressData.metricas_tiempo?.tiempo_minimo || 0}
                    </div>
                    <div className="text-xs text-green-600">Tiempo Mínimo</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {progressData.metricas_tiempo?.tiempo_maximo || 0}
                    </div>
                    <div className="text-xs text-orange-600">Tiempo Máximo</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas de Desclasificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Desclasificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">
                      {progressData.desclasificaciones?.total_desclasificados || 0}
                    </div>
                    <div className="text-xs text-red-600">Total Desclasificados</div>
                  </div>
                  <div className="text-center p-3 bg-red-100 rounded-lg">
                    <div className="text-xl font-bold text-red-700">
                      {progressData.desclasificaciones?.porcentaje_desclasificados || 0}%
                    </div>
                    <div className="text-xs text-red-700">Porcentaje</div>
                  </div>
                </div>
                {progressData.desclasificaciones?.estadisticas && progressData.desclasificaciones.estadisticas.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Por Tipo:</h4>
                    {progressData.desclasificaciones.estadisticas.map((stat: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm capitalize">{stat.tipo}</span>
                        <Badge variant="destructive">{stat.cantidad_por_tipo}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de olimpistas sin evaluar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Olimpistas Sin Evaluar
          </CardTitle>
          <CardDescription>
            Lista de participantes que aún requieren evaluación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(
              (progressData.olimpistas_sin_evaluar || []).slice().sort((a: any, b: any) => {
                const ga = (a.grado_escolaridad ?? '').toString()
                const gb = (b.grado_escolaridad ?? '').toString()
                // Intentar ordenar numéricamente si es posible; si no, por texto
                const na = parseInt(ga, 10)
                const nb = parseInt(gb, 10)
                if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
                return ga.localeCompare(gb)
              })
            ).map((olimpista: any) => (
              <div key={olimpista.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                olimpista.nivel_alerta === 'critico' ? 'bg-red-50 border-red-200' :
                olimpista.nivel_alerta === 'advertencia' ? 'bg-orange-50 border-orange-200' :
                'bg-muted/30'
              }`}>
                <div className="flex-1">
                  <div className="font-medium">{olimpista.nombre}</div>
                  <div className="text-sm text-muted-foreground">
                    {olimpista.area} - {olimpista.nivel}
                    {olimpista.grado_escolaridad ? ` - ${olimpista.grado_escolaridad}` : ''}
                  </div>
                  {olimpista.evaluador_nombre && (
                    <div className="text-xs text-blue-600 mt-1">
                      Evaluador: {olimpista.evaluador_nombre}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    olimpista.nivel_alerta === 'critico' ? 'text-red-600' : 
                    olimpista.nivel_alerta === 'advertencia' ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {olimpista.dias_pendiente} días
                  </div>
                  <Badge variant={
                    olimpista.nivel_alerta === 'critico' ? 'destructive' :
                    olimpista.nivel_alerta === 'advertencia' ? 'secondary' : 'default'
                  } className="text-xs">
                    {olimpista.nivel_alerta === 'critico' ? 'Crítico' : 
                     olimpista.nivel_alerta === 'advertencia' ? 'Advertencia' : 'Normal'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" className="w-full">
              Ver todos los pendientes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumen General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {progressData.estadisticas_generales.total_olimpistas}
              </div>
              <div className="text-sm text-muted-foreground">Total Olimpistas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {progressData.estadisticas_generales.total_evaluados}
              </div>
              <div className="text-sm text-muted-foreground">Evaluados</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {progressData.estadisticas_generales.total_pendientes}
              </div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {progressData.estadisticas_generales.promedio_general}%
              </div>
              <div className="text-sm text-muted-foreground">Promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProgresoEvaluacionFinal() {
  const [loading, setLoading] = useState<boolean>(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [progressData, setProgressData] = useState<any>({
    niveles: [],
    evaluadores: { total: 0, activos: 0 },
    clasificados_sin_evaluar: [],
    estadisticas_generales: {
      total_clasificados: 0,
      total_evaluados: 0,
      total_premiados_oro: 0,
      total_premiados_plata: 0,
      total_premiados_bronce: 0,
      total_no_premiados: 0,
      total_pendientes: 0,
      promedio_general: 0
    }
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await CoordinadorService.getProgresoEvaluacionFinal()
        if (response.success) {
          setProgressData(response.data)
          setLastUpdate(new Date())
        }
      } catch (error) {
        console.error('Error cargando datos de progreso final:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await CoordinadorService.getProgresoEvaluacionFinal()
      if (response.success) {
        setProgressData(response.data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error actualizando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando progreso de evaluación final...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Progreso de Evaluación Final</h2>
          <p className="text-muted-foreground">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Progreso por Nivel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.niveles?.map((nivel: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{nivel.nivel_nombre}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="font-semibold text-yellow-700">{nivel.premiados_oro || 0}</div>
                        <div className="text-xs text-yellow-600">Oro</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-gray-700">{nivel.premiados_plata || 0}</div>
                        <div className="text-xs text-gray-600">Plata</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-semibold text-orange-700">{nivel.premiados_bronce || 0}</div>
                        <div className="text-xs text-orange-600">Bronce</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-semibold text-green-700">{nivel.evaluados || 0}</div>
                        <div className="text-xs text-green-600">Evaluados</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-semibold text-red-700">{nivel.pendientes || 0}</div>
                        <div className="text-xs text-red-600">Pendientes</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-semibold text-blue-700">{nivel.promedio_puntuacion ? Math.round(nivel.promedio_puntuacion) : 0}</div>
                        <div className="text-xs text-blue-600">Promedio</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progreso: {nivel.porcentaje_evaluados || 0}%</span>
                      </div>
                      <Progress value={nivel.porcentaje_evaluados || 0} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Evaluadores Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {progressData.evaluadores?.con_permisos || 0}/{progressData.evaluadores?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">Con Permisos Activos</div>
              </div>
              
              {progressData.evaluadores_lista && progressData.evaluadores_lista.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {progressData.evaluadores_lista.map((evaluador: any) => (
                    <div key={evaluador.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{evaluador.nombre}</div>
                        <div className="text-xs text-muted-foreground">{evaluador.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {evaluador.evaluaciones_completadas} evaluaciones
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {evaluador.asignaciones_pendientes} pendientes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground text-sm">
                  No hay evaluadores registrados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Resumen General - Fase Final
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {progressData.estadisticas_generales?.total_clasificados || 0}
              </div>
              <div className="text-sm text-muted-foreground">Clasificados</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {progressData.estadisticas_generales?.total_evaluados || 0}
              </div>
              <div className="text-sm text-muted-foreground">Evaluados</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {progressData.estadisticas_generales?.total_premiados_oro || 0}
              </div>
              <div className="text-sm text-muted-foreground">Oro</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {progressData.estadisticas_generales?.promedio_general || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CompetidoresPorAreaNivel() {
  const [departamentoId, setDepartamentoId] = useState<string | undefined>(undefined)
  const [nivelId, setNivelId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [competidores, setCompetidores] = useState<any[]>([])
  const [search, setSearch] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("nombre")
  const [estado, setEstado] = useState<string | undefined>(undefined)
  const [openView, setOpenView] = useState<boolean>(false)
  const [selected, setSelected] = useState<any | null>(null)

  // Datos de ejemplo para simulación (sin backend)
  const demoCompetidores: any[] = [
    {
      id: 2001,
      nombre_completo: "Ana Martínez Condori",
      documento_identidad: "44332211",
      unidad_educativa_nombre: "Colegio Nacional",
      departamento_nombre: "Cochabamba",
      area_nombre: "Matemáticas",
      nivel_nombre: "Superior",
      puntuacion: 95.5,
      inscripcion_estado: "clasificado",
    },
    {
      id: 2002,
      nombre_completo: "Carlos López Vargas",
      documento_identidad: "11223344",
      unidad_educativa_nombre: "Colegio Técnico",
      departamento_nombre: "La Paz",
      area_nombre: "Física",
      nivel_nombre: "Primario",
      puntuacion: 65.0,
      inscripcion_estado: "no_clasificado",
    },
    {
      id: 2003,
      nombre_completo: "Juan Pérez Mamani",
      documento_identidad: "12345678",
      unidad_educativa_nombre: "Colegio San Simón",
      departamento_nombre: "Cochabamba",
      area_nombre: "Matemáticas",
      nivel_nombre: "Primario",
      puntuacion: 85.5,
      inscripcion_estado: "clasificado",
    },
    {
      id: 2004,
      nombre_completo: "María González Quispe",
      documento_identidad: "87654321",
      unidad_educativa_nombre: "Colegio Bolivar",
      departamento_nombre: "Santa Cruz",
      area_nombre: "Matemáticas",
      nivel_nombre: "Secundario",
      puntuacion: 78.0,
      inscripcion_estado: "clasificado",
    },
    {
      id: 2005,
      nombre_completo: "Roberto Fernández Torres",
      documento_identidad: "11223344",
      unidad_educativa_nombre: "Colegio Central",
      departamento_nombre: "La Paz",
      area_nombre: "Matemáticas",
      nivel_nombre: "Superior",
      puntuacion: 92.0,
      inscripcion_estado: "clasificado",
    },
  ]

  const SIMULATE = false

  const getDepartamentoName = (id?: string) => {
    if (!id) return ''
    const map: Record<string, string> = { 
      '1': 'Cochabamba', 
      '2': 'La Paz', 
      '3': 'Santa Cruz',
      '4': 'Oruro',
      '5': 'Potosí',
      '6': 'Chuquisaca',
      '7': 'Tarija',
      '8': 'Beni',
      '9': 'Pando'
    }
    return map[id] || ''
  }

  const getNivelName = (id?: string) => {
    if (!id || id === 'all') return ''
    const map: Record<string, string> = { '1': 'Primario', '2': 'Secundario', '3': 'Superior' }
    return map[id] || ''
  }

  const handleExportPDF = () => {
    // Generar un documento imprimible SOLO con la lista filtrada (departamento/nivel)
    const data = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
    const html = generatePrintableHTML(data, getDepartamentoName(departamentoId), getNivelName(nivelId))
    const w = window.open('', '_blank')
    if (!w) {
      alert('Por favor habilita las ventanas emergentes para permitir la exportación a PDF.')
      return
    }
    try {
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
    } catch (e) {
      console.error('Print error', e)
    }
  }

  const generatePrintableHTML = (rows: any[], departamentoLabel?: string, nivelLabel?: string) => {
    const today = new Date().toLocaleDateString()
    const head = `
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; padding: 24px; }
        h1 { font-size: 18px; margin: 0 0 8px; }
        p { margin: 0 0 12px; color: #555; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f3f4f6; }
        @page { size: A4 portrait; margin: 16mm; }
        @media print { button { display: none; } }
      </style>
    `
    const header = `
      <h1>Lista de Competidores por Departamento y Nivel</h1>
      <p>Fecha: ${today}${departamentoLabel ? ' • Departamento: ' + departamentoLabel : ''}${nivelLabel ? ' • Nivel: ' + nivelLabel : ''}</p>
    `
    const tableRows = rows.map((c: any) => `
      <tr>
        <td>${escapeHtml(c.nombre_completo || c.olimpista_nombre || '')}</td>
        <td>${escapeHtml(c.departamento_nombre || '')}</td>
        <td>${escapeHtml(c.area_nombre || '')}</td>
        <td>${escapeHtml(c.nivel_nombre || '')}</td>
        <td>${escapeHtml(String(c.puntuacion ?? c.puntuacion_final ?? ''))}</td>
        <td>${escapeHtml(c.inscripcion_estado || c.estado || '')}</td>
      </tr>
    `).join('')
    const table = `
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Departamento</th>
            <th>Área</th>
            <th>Nivel</th>
            <th>Puntuación</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    `
    return `<!DOCTYPE html><html><head><meta charset="utf-8" />${head}</head><body>${header}${table}</body></html>`
  }

  const escapeHtml = (value: string) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const exportRowsToCSV = (data: any[], prefix: string) => {
    const headers = ["Nombre", "Departamento", "Área", "Nivel", "Puntaje", "Estado"]
    const rows: string[] = [headers.join(',')]
    ;(data as any[] || []).forEach((c: any) => {
      const row = [
        c.nombre_completo || c.olimpista_nombre || '',
        c.departamento_nombre || '-',
        c.area_nombre || '-',
        c.nivel_nombre || '-',
        String(c.puntuacion ?? c.puntuacion_final ?? ''),
        c.inscripcion_estado || c.estado || '-',
      ].map((v: string) => '"' + String(v).replace(/\"/g, '"') + '"')
      rows.push(row.join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prefix}_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportClasificados = async () => {
    if (!departamentoId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    try {
      // await ReporteService.exportarResultados({ departamento_id: parseInt(departamentoId, 10), nivel_id: nivelParam, fase: 'clasificacion' })
      const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
        .filter((c: any) => (c.inscripcion_estado || c.estado) === 'clasificado')
      if (rows.length === 0) {
        alert('No hay clasificados para exportar.')
        return
      }
      exportRowsToCSV(rows, 'clasificados')
    } catch (e) {
      const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
        .filter((c: any) => (c.inscripcion_estado || c.estado) === 'clasificado')
      if (rows.length === 0) {
        alert('No hay clasificados para exportar.')
        return
      }
      exportRowsToCSV(rows, 'clasificados')
    }
  }

  const handleExportPremiados = async () => {
    if (!departamentoId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    try {
      // await ReporteService.exportarResultados({ departamento_id: parseInt(departamentoId, 10), nivel_id: nivelParam, fase: 'premiacion' })
      const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
        .filter((c: any) => (c.inscripcion_estado || c.estado) === 'premiado')
      if (rows.length === 0) {
        alert('No hay premiados para exportar.')
        return
      }
      exportRowsToCSV(rows, 'premiados')
    } catch (e) {
      const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
        .filter((c: any) => (c.inscripcion_estado || c.estado) === 'premiado')
      if (rows.length === 0) {
        alert('No hay premiados para exportar.')
        return
      }
      exportRowsToCSV(rows, 'premiados')
    }
  }

  const handleExportNoClasificados = async () => {
    if (!departamentoId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    // await ReporteService.exportarResultados({ departamento_id: parseInt(departamentoId, 10), nivel_id: nivelParam, fase: 'no_clasificado' })
    const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
      .filter((c: any) => (c.inscripcion_estado || c.estado) === 'no_clasificado')
    if (rows.length === 0) {
      alert('No hay no clasificados para exportar.')
      return
    }
    exportRowsToCSV(rows, 'no_clasificados')
  }

  const handleExportDesclasificados = async () => {
    if (!departamentoId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    // await ReporteService.exportarResultados({ departamento_id: parseInt(departamentoId, 10), nivel_id: nivelParam, fase: 'desclasificado' })
    const rows = applyClientFilters((competidores.length ? competidores : demoCompetidores), { search, sortBy })
      .filter((c: any) => (c.inscripcion_estado || c.estado) === 'descalificado')
    if (rows.length === 0) {
      alert('No hay descalificados para exportar.')
      return
    }
    exportRowsToCSV(rows, 'descalificados')
  }

  const fetchData = async () => {
    console.log(' fetchData ejecutándose')
    console.log(' departamentoId:', departamentoId)
    
    if (!departamentoId) {
      console.log(' No hay departamentoId, saliendo de fetchData')
      return
    }
    
    console.log('⏳ Iniciando carga de datos...')
    setLoading(true)
    setError("")
    
    try {
      if (SIMULATE) {
       
        await new Promise(resolve => setTimeout(resolve, 1000))
        const filteredData = demoCompetidores.filter(c => {
          const departamentoLabel = getDepartamentoName(departamentoId)
          return c.departamento_nombre === departamentoLabel
        })
        setCompetidores(filteredData)
        return
      }
      
      
      const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
      
      
      const token = localStorage.getItem('auth_token')
      console.log(' Token en localStorage:', token ? 'Presente' : 'Ausente')
      console.log(' Token completo:', token)
      
      
      console.log(' Llamando a la API con parámetros:', {
        area_id: 1,
        nivel_id: nivelParam,
        fase: 'clasificacion'
      })
      
      const response = await CoordinadorService.getParticipantesConEvaluaciones({
        area_id: 1, // Por ahora usar área 1, después se puede obtener del perfil del coordinador
        nivel_id: nivelParam,
        fase: 'clasificacion'
      })
      
      console.log('📡 Respuesta de la API:', response)
      
      if (response.success && response.data) {
        // Mapear y deduplicar por documento_identidad para evitar mostrar al mismo
        // estudiante varias veces (p. ej., distintos grados dentro del mismo nivel)
        const mapeados = response.data.participantes.map((p: any) => ({
          id: p.inscripcion_area_id,
          nombre_completo: p.nombre_completo,
          documento_identidad: p.documento_identidad,
          unidad_educativa_nombre: p.unidad_educativa_nombre,
          departamento_nombre: p.departamento_nombre,
          area_nombre: p.area_nombre,
          nivel_nombre: p.nivel_nombre || 'Secundaria',
          grado_escolaridad: p.grado_escolaridad,
          puntuacion: p.puntuacion || 0,
          inscripcion_estado: p.estado_evaluacion,
          observaciones: p.observaciones,
          fecha_evaluacion: p.fecha_evaluacion,
          evaluador_nombre: p.evaluador_nombre,
          evaluador_email: p.evaluador_email
        }))
        const competidoresMapeados = Object.values(
          mapeados.reduce((acc: Record<string, any>, curr: any) => {
            acc[curr.documento_identidad] ??= curr
            return acc
          }, {})
        ) as any[]
        
        // Filtrar por departamento si está seleccionado
        const filteredData = competidoresMapeados.filter((c: any) => {
          const departamentoLabel = getDepartamentoName(departamentoId)
          return c.departamento_nombre === departamentoLabel
        })
        
        setCompetidores(filteredData)
        console.log('Datos reales cargados:', response.data.estadisticas)
      } else {
        console.error('Error al obtener participantes con evaluaciones:', response.message)
        
        const filteredData = demoCompetidores.filter(c => {
          const departamentoLabel = getDepartamentoName(departamentoId)
          return c.departamento_nombre === departamentoLabel
        })
        setCompetidores(filteredData)
      }
    } catch (err: any) {
      console.error('Error cargando datos:', err)
      setError(err.message || "Error al cargar datos")
      
      const filteredData = demoCompetidores.filter(c => {
        const departamentoLabel = getDepartamentoName(departamentoId)
        return c.departamento_nombre === departamentoLabel
      })
      setCompetidores(filteredData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log(' CompetidoresPorAreaNivel - useEffect inicial ejecutándose')
    console.log(' SIMULATE:', SIMULATE)
    
    
    if (SIMULATE) {
      console.log('Modo simulación activado')
      setDepartamentoId('1') // Cochabamba por defecto
      setCompetidores(demoCompetidores)
      return
    }
    
    console.log(' Modo real - obteniendo perfil del usuario')
    const init = async () => {
      try {
        const me = await AuthService.getProfile()
        console.log(' Perfil obtenido:', me)
        const dId = (me as any)?.data?.departamento_id
        console.log(' Departamento ID del perfil:', dId)
        if (dId) {
          setDepartamentoId(String(dId))
          console.log(' Departamento establecido:', String(dId))
        } else {
          console.log(' No se encontró departamento_id en el perfil, usando por defecto')
          setDepartamentoId('1') 
        }
      } catch (error) {
        console.error(' Error obteniendo perfil:', error)
        setDepartamentoId('1')
      }
    }
    init()
  }, [])

  useEffect(() => {
    console.log(' CompetidoresPorAreaNivel - useEffect de dependencias ejecutándose')
    console.log(' SIMULATE:', SIMULATE)
    console.log(' departamentoId:', departamentoId)
    console.log(' nivelId:', nivelId)
    
    if (SIMULATE) {
      console.log(' Modo simulación - saltando fetchData')
      return
    }
    
    if (departamentoId) {
      console.log(' Llamando a fetchData con departamentoId:', departamentoId)
      fetchData()
    } else {
      console.log(' No hay departamentoId, no se puede hacer fetchData')
    }
    
  }, [departamentoId, nivelId, sortBy, estado])

  return (
    <div className="space-y-4">
      {/* Toolbar superior */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="font-semibold text-foreground">Competidores</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportCSV(applyClientFilters(competidores, { search, sortBy }))} disabled={loading || competidores.length === 0}>
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            Exportar PDF
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleExportClasificados}>Lista Clasificados</Button>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleExportPremiados}>Lista Premiados</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleExportNoClasificados}>Lista No Clasificados</Button>
          <Button className="bg-gray-600 hover:bg-gray-700" onClick={handleExportDesclasificados}>Lista Descalificados</Button>
        </div>
      </div>

      {/* Caja informativa */}
      <div className="p-4 rounded-md border bg-muted/40">
        <div className="font-medium mb-1">Sistema de Evaluación</div>
        <div className="text-sm text-muted-foreground">Los competidores son evaluados por múltiples evaluadores para garantizar objetividad. La puntuación mostrada es el promedio.</div>
      </div>
      
      {/* Estado de Calificación */}
      <div className="p-4 rounded-md border bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div className="font-medium text-blue-800">Estado de Calificación</div>
        </div>
        <div className="text-sm text-blue-700">
          <p>• Las calificaciones son cerradas por los evaluadores cuando completan todas sus evaluaciones</p>
          <p>• Una vez cerrada la calificación, se generan automáticamente las listas de clasificación</p>
          <p>• Las listas incluyen: Clasificados, No Clasificados, Descalificados y Premiados</p>
        </div>
      </div>
      <div className="space-y-3">
        {/* Barra de búsqueda */}
        <div className="w-full">
          <Input 
            placeholder="Buscar por nombre, doc, institución..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />
        </div>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Select value={departamentoId} onValueChange={(v) => { setDepartamentoId(v); }}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Selecciona un departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Cochabamba</SelectItem>
              <SelectItem value="2">La Paz</SelectItem>
              <SelectItem value="3">Santa Cruz</SelectItem>
              <SelectItem value="4">Oruro</SelectItem>
              <SelectItem value="5">Potosí</SelectItem>
              <SelectItem value="6">Chuquisaca</SelectItem>
              <SelectItem value="7">Tarija</SelectItem>
              <SelectItem value="8">Beni</SelectItem>
              <SelectItem value="9">Pando</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={nivelId} onValueChange={(v) => { setNivelId(v); }}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Selecciona un nivel (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Primario</SelectItem>
              <SelectItem value="2">Secundario</SelectItem>
              <SelectItem value="3">Superior</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={estado ?? 'all'} onValueChange={(v) => { setEstado(v === 'all' ? undefined : v); }}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sin_evaluar">Sin evaluar</SelectItem>
              <SelectItem value="evaluado">Evaluado</SelectItem>
            <SelectItem value="descalificado">Descalificado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Estadísticas de Clasificación */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {applyClientFilters(competidores.length ? competidores : demoCompetidores, { search, sortBy, estado, departamentoId, nivelId })
              .filter((c: any) => (c.inscripcion_estado || c.estado) === 'clasificado').length}
          </div>
          <div className="text-xs text-green-700 font-medium">Clasificados</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {applyClientFilters(competidores.length ? competidores : demoCompetidores, { search, sortBy, estado, departamentoId, nivelId })
              .filter((c: any) => (c.inscripcion_estado || c.estado) === 'no_clasificado').length}
          </div>
          <div className="text-xs text-red-700 font-medium">No Clasificados</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {applyClientFilters(competidores.length ? competidores : demoCompetidores, { search, sortBy, estado, departamentoId, nivelId })
              .filter((c: any) => (c.inscripcion_estado || c.estado) === 'descalificado').length}
          </div>
          <div className="text-xs text-gray-700 font-medium">Descalificados</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">
            {applyClientFilters(competidores.length ? competidores : demoCompetidores, { search, sortBy, estado, departamentoId, nivelId })
              .filter((c: any) => (c.inscripcion_estado || c.estado) === 'premiado').length}
          </div>
          <div className="text-xs text-amber-700 font-medium">Premiados</div>
        </div>
      </div>
        
        {/* Ordenamiento y acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Ordenar por:</span>
            <Button variant={sortBy === 'nombre' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy('nombre')}>Nombre</Button>
            <Button variant={sortBy === 'puntaje' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy('puntaje')}>Puntuación</Button>
            <Button variant={sortBy === 'departamento' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy('departamento')}>Departamento</Button>
            <Button variant={sortBy === 'area' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy('area')}>Área</Button>
            <Button variant={sortBy === 'nivel' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy('nivel')}>Nivel</Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchData} disabled={!departamentoId || loading} size="sm" className="text-xs">
              {loading ? "Cargando..." : "Buscar"}
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => exportCSV(applyClientFilters(competidores, { search, sortBy, estado }))} disabled={loading || competidores.length === 0}>
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setSearch(""); setDepartamentoId(undefined); setNivelId(undefined); setEstado(undefined); setSortBy('nombre') }}>Limpiar</Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-3 mt-2">
        {applyClientFilters(competidores.length ? competidores : demoCompetidores, { search, sortBy, estado, departamentoId, nivelId }).length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6 border rounded-md">Sin datos</div>
        ) : (
          applyClientFilters(competidores.length ? competidores : demoCompetidores, { search, sortBy, estado, departamentoId, nivelId }).map((c) => (
            <div key={c.id || c.inscripcion_id} className="p-3 sm:p-4 border rounded-md bg-background">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="font-semibold text-foreground text-sm sm:text-base truncate">{c.nombre_completo || c.olimpista_nombre}</div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">{(c.inscripcion_estado || c.estado || 'Desconocido').toString()}</Badge>
                    {renderRendimientoBadge(c.puntuacion ?? c.puntuacion_final)}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div><span className="font-medium text-foreground">Documento:</span> {c.documento_identidad || '—'}</div>
                    <div><span className="font-medium text-foreground">Unidad Educativa:</span> {c.unidad_educativa_nombre || '—'}</div>
                    <div className="flex flex-col sm:flex-row sm:gap-6">
                      <span><span className="font-medium text-foreground">Departamento:</span> {c.departamento_nombre || '—'}</span>
                      <span><span className="font-medium text-foreground">Área:</span> {c.area_nombre || '—'}</span>
                      <span><span className="font-medium text-foreground">Nivel:</span> {c.nivel_nombre || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-2 text-xs sm:text-sm">
                    <span className="flex items-center gap-1"><span className="font-medium text-foreground">Puntuación:</span> {Number(c.puntuacion ?? c.puntuacion_final ?? 0).toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                  <Button variant="outline" size="sm" className="text-xs flex-1 sm:flex-none" onClick={() => { setSelected(c); setOpenView(true) }}>
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs flex-1 sm:flex-none">⋯</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.nombre_completo || selected?.olimpista_nombre || 'Competidor'}</DialogTitle>
            <DialogDescription>Información relacionada del competidor seleccionado</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Documento:</span> {selected?.documento_identidad || selected?.olimpista_documento || '—'}</div>
            <div><span className="font-medium">Unidad Educativa:</span> {selected?.unidad_educativa_nombre || '—'}</div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-medium">Departamento:</span> {selected?.departamento_nombre || '—'}</div>
              <div><span className="font-medium">Área:</span> {selected?.area_nombre || '—'}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-medium">Nivel:</span> {selected?.nivel_nombre || '—'}</div>
              <div><span className="font-medium">Puntuación:</span> {selected?.puntuacion ?? selected?.puntuacion_final ?? '—'}</div>
            </div>
            <div><span className="font-medium">Estado:</span> {selected?.inscripcion_estado || selected?.estado || '—'}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function applyClientFilters(
  data: any[],
  opts: { search: string; sortBy: string; estado?: string; departamentoId?: string; nivelId?: string }
) {
  const text = opts.search.trim().toLowerCase()
  let rows = data
  if (text) {
    rows = rows.filter((c) => {
      const haystack = [
        c.nombre_completo || c.olimpista_nombre || "",
        c.documento_identidad || c.doc || "",
        c.unidad_educativa_nombre || c.institucion || "",
      ].join(" ").toLowerCase()
      return haystack.includes(text)
    })
  }
  
  if (opts.estado) {
    const estadoSel = opts.estado
    rows = rows.filter((c) => String(c.inscripcion_estado || c.estado || '').toLowerCase() === estadoSel)
  }
  
  if (opts.departamentoId) {
    rows = rows.filter((c) => {
      const departamentoId = String(opts.departamentoId)
      const byId = c.departamento_id || c.departamentoId
      if (byId !== undefined && byId !== null && byId !== '') {
        return String(byId) === departamentoId
      }
      
      const departamentoLabel = (departamentoId === '1' ? 'Cochabamba' : departamentoId === '2' ? 'La Paz' : departamentoId === '3' ? 'Santa Cruz' : departamentoId === '4' ? 'Oruro' : departamentoId === '5' ? 'Potosí' : departamentoId === '6' ? 'Chuquisaca' : departamentoId === '7' ? 'Tarija' : departamentoId === '8' ? 'Beni' : departamentoId === '9' ? 'Pando' : '')
      return String(c.departamento_nombre || '').toLowerCase() === String(departamentoLabel).toLowerCase()
    })
  }
 
  if (opts.nivelId && opts.nivelId !== 'all') {
    rows = rows.filter((c) => {
      const nivelId = String(opts.nivelId)
      const byId = c.nivel_id || c.nivel_competencia_id || c.nivelNombreId
      if (byId !== undefined && byId !== null && byId !== '') {
        return String(byId) === nivelId
      }
      const nivelLabel = (nivelId === '1' ? 'Primario' : nivelId === '2' ? 'Secundario' : nivelId === '3' ? 'Superior' : '')
      return String(c.nivel_nombre || '').toLowerCase() === String(nivelLabel).toLowerCase()
    })
  }
  switch (opts.sortBy) {
    case "puntaje":
      rows = [...rows].sort((a, b) => (Number(b.puntuacion ?? b.puntuacion_final ?? 0) - Number(a.puntuacion ?? a.puntuacion_final ?? 0)))
      break
    case "departamento":
      rows = [...rows].sort((a, b) => String(a.departamento_nombre || "").localeCompare(String(b.departamento_nombre || "")))
      break
    case "area":
      rows = [...rows].sort((a, b) => String(a.area_nombre || "").localeCompare(String(b.area_nombre || "")))
      break
    case "nivel":
      rows = [...rows].sort((a, b) => String(a.nivel_nombre || "").localeCompare(String(b.nivel_nombre || "")))
      break
    default:
      rows = [...rows].sort((a, b) => String(a.nombre_completo || a.olimpista_nombre || "").localeCompare(String(b.nombre_completo || b.olimpista_nombre || "")))
  }
  return rows
}

function exportCSV(data: any[]) {
  const headers = ["Nombre", "Departamento", "Área", "Nivel", "Puntaje", "Estado"]
  const rows: string[] = [headers.join(',')]
  ;(data as any[] || []).forEach((c: any) => {
    const row = [
      c.nombre_completo || c.olimpista_nombre || '',
      c.departamento_nombre || '-',
      c.area_nombre || '-',
      c.nivel_nombre || '-',
      String(c.puntuacion ?? c.puntuacion_final ?? ''),
      c.inscripcion_estado || c.estado || '-',
    ].map((v: string) => '"' + String(v).replace(/\"/g, '"') + '"')
    rows.push(row.join(','))
  })
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `competidores_${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function renderRendimientoBadge(p: any) {
  const score = Number(p ?? 0)
  if (!isFinite(score) || score <= 0) return null
  if (score >= 90) return <Badge className="bg-lime-100 text-lime-800">Sobresaliente</Badge>
  if (score >= 75) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>
  if (score >= 60) return <Badge className="bg-amber-100 text-amber-800">Regular</Badge>
  return <Badge className="bg-rose-100 text-rose-800">Bajo</Badge>
}

function CierreFaseArea() {
  const [loading, setLoading] = useState<boolean>(true)
  const [cierreData, setCierreData] = useState<any>(null)
  const [showCierreModal, setShowCierreModal] = useState<boolean>(false)
  const [cerrando, setCerrando] = useState<boolean>(false)
  const [descargandoPDF, setDescargandoPDF] = useState<boolean>(false)
  const [descargandoExcel, setDescargandoExcel] = useState<boolean>(false)
  const [descargandoEstadisticas, setDescargandoEstadisticas] = useState<boolean>(false)
  const [firmaExistente, setFirmaExistente] = useState<string | null>(null)
  const [fechaFirma, setFechaFirma] = useState<string | null>(null)
  const [cargandoFirma, setCargandoFirma] = useState<boolean>(false)
  const [estadoPublicacion, setEstadoPublicacion] = useState<any>(null)
  const [publicando, setPublicando] = useState<boolean>(false)
  const [despublicando, setDespublicando] = useState<boolean>(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await CoordinadorService.getDashboardCierreFase()
      if (response.success) {
        console.log('Datos de cierre recibidos:', response.data)
        console.log('Estado cierre:', response.data?.estado_cierre)
        console.log('Vista previa clasificados:', response.data?.vista_previa_clasificados)
        console.log('Clasificados en vista previa:', response.data?.vista_previa_clasificados?.clasificados)
        console.log('No clasificados en vista previa:', response.data?.vista_previa_clasificados?.no_clasificados)
        console.log('Cantidad clasificados:', response.data?.vista_previa_clasificados?.clasificados?.length || 0)
        console.log('Cantidad no clasificados:', response.data?.vista_previa_clasificados?.no_clasificados?.length || 0)
        setCierreData(response.data)
        
        
        if (response.data?.estado_cierre === 'cerrada' && response.data?.area?.id) {
          cargarEstadoPublicacion(response.data.area.id)
        }
      }
    } catch (error: any) {
      console.error('Error cargando datos de cierre:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarEstadoPublicacion = async (areaId: number) => {
    try {
      const response = await PublicacionResultadosService.getEstadoPublicacion(areaId)
      if (response.success) {
        setEstadoPublicacion(response.data)
      }
    } catch (error) {
      console.error('Error cargando estado de publicación:', error)
    }
  }

  const handlePublicar = async () => {
    if (!cierreData?.area?.id) return
    
    if (!confirm('¿Estás seguro de publicar los resultados? Los resultados serán visibles públicamente.')) {
      return
    }
    
    setPublicando(true)
    try {
      const response = await PublicacionResultadosService.publicarResultados({
        area_competencia_id: cierreData.area.id
      })
      
      if (response.success) {
        alert('Resultados publicados exitosamente')
        await cargarEstadoPublicacion(cierreData.area.id)
      } else {
        alert('Error al publicar: ' + (response.message || 'Error desconocido'))
      }
    } catch (error: any) {
      console.error('Error publicando resultados:', error)
      alert('Error al publicar resultados: ' + (error.message || 'Error desconocido'))
    } finally {
      setPublicando(false)
    }
  }

  const handleDespublicar = async () => {
    if (!cierreData?.area?.id) return
    
    if (!confirm('¿Estás seguro de despublicar los resultados? Los resultados dejarán de ser visibles públicamente.')) {
      return
    }
    
    setDespublicando(true)
    try {
      const response = await PublicacionResultadosService.despublicarResultados({
        area_competencia_id: cierreData.area.id
      })
      
      if (response.success) {
        alert('Resultados despublicados exitosamente')
        await cargarEstadoPublicacion(cierreData.area.id)
      } else {
        alert('Error al despublicar: ' + (response.message || 'Error desconocido'))
      }
    } catch (error: any) {
      console.error('Error despublicando resultados:', error)
      alert('Error al despublicar resultados: ' + (error.message || 'Error desconocido'))
    } finally {
      setDespublicando(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  
  useEffect(() => {
    const cargarFirma = async () => {
      const porcentajeCompletitud = cierreData?.estadisticas?.porcentaje_completitud || 0
      const puedeCerrar = porcentajeCompletitud >= 99.9 && cierreData?.estado_cierre !== 'cerrada'
      
      
      if (puedeCerrar) {
        setCargandoFirma(true)
        try {
          const response = await CoordinadorService.obtenerFirma('cierre_fase')
          if (response.success && response.data?.tiene_firma) {
            setFirmaExistente(response.data.firma_imagen)
            setFechaFirma(response.data.fecha_firma)
          }
        } catch (error) {
          console.error('Error cargando firma:', error)
        } finally {
          setCargandoFirma(false)
        }
      } else {
        
        setFirmaExistente(null)
        setFechaFirma(null)
      }
    }
    cargarFirma()
  }, [cierreData?.estado_cierre, cierreData?.estadisticas?.porcentaje_completitud])

  const handleGuardarFirma = async (firmaImagen: string) => {
    try {
      const response = await CoordinadorService.guardarFirma(firmaImagen, 'cierre_fase')
      if (response.success) {
        setFirmaExistente(firmaImagen)
        setFechaFirma(new Date().toISOString())
        alert('Firma guardada exitosamente')
      } else {
        throw new Error(response.message || 'Error al guardar la firma')
      }
    } catch (error: any) {
      console.error('Error guardando firma:', error)
      throw error
    }
  }

  const handleCerrarFase = async () => {
    console.log(' [FRONTEND] handleCerrarFase llamado')
    console.log(' [FRONTEND] puede_cerrar:', cierreData?.estadisticas?.puede_cerrar)
    if (!cierreData?.estadisticas?.puede_cerrar) {
      console.log(' [FRONTEND] No se puede cerrar la fase')
      return
    }
    console.log('[FRONTEND] Abriendo modal de cierre')
    setShowCierreModal(true)
  }

  const confirmarCierre = async () => {
    console.log(' [FRONTEND] confirmarCierre llamado - Iniciando cierre de fase')
    setCerrando(true)
    try {
      console.log('[FRONTEND] Enviando petición POST a /api/coordinador/cierre-fase/cerrar')
      const response = await CoordinadorService.cerrarFaseArea()
      console.log('[FRONTEND] Respuesta recibida:', response)
      if (response.success) {
        setShowCierreModal(false)
        alert('Fase cerrada exitosamente. Los reportes PDF y Excel se están generando en segundo plano y estarán disponibles en unos momentos.')
        
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        console.log(' [FRONTEND] Recargando datos después del cierre...')
        let intentos = 0
        const maxIntentos = 15
        let estadoActualizado = false
        
        while (intentos < maxIntentos && !estadoActualizado) {
          
          await loadData()
          
         
          await new Promise(resolve => setTimeout(resolve, 800))
          
          
          try {
            const responseCheck = await CoordinadorService.getDashboardCierreFase()
            const estadoCierre = responseCheck.data?.estado_cierre
            console.log(`[FRONTEND] Intento ${intentos + 1}/${maxIntentos} - Estado cierre: ${estadoCierre}`)
            
            if (estadoCierre === 'cerrada') {
              estadoActualizado = true
              console.log('[FRONTEND] Estado actualizado a "cerrada" correctamente')
              
              await loadData()
              break
            }
          } catch (error) {
            console.error('Error verificando estado:', error)
          }
          
          
          await new Promise(resolve => setTimeout(resolve, 1000))
          intentos++
        }
        
        if (!estadoActualizado) {
          console.warn('[FRONTEND] No se pudo confirmar el estado "cerrada" después de varios intentos')
          
          await loadData()
        }
        
        
        console.log('[FRONTEND] Recargando página para actualizar todos los componentes')
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        console.error('[FRONTEND] Error en respuesta:', response)
        alert('Error al cerrar la fase: ' + (response.message || 'Error desconocido'))
        setCerrando(false)
      }
    } catch (error: any) {
      console.error('[FRONTEND] Excepción al cerrar fase:', error)
      console.error('[FRONTEND] Stack trace:', error.stack)
      alert('Error al cerrar la fase: ' + (error.message || 'Error desconocido'))
      setCerrando(false)
    }
  }

  const handleDescargarPDF = async () => {
    setDescargandoPDF(true)
    try {
      const result = await CoordinadorService.descargarReportePDF()
      if (result.success) {
        
      } else {
        const errorMsg = result.error || 'Error al descargar el PDF. Asegúrate de que la fase esté cerrada y que el PDF se haya generado correctamente.'
        alert(errorMsg)
      }
    } catch (error: any) {
      console.error('Error descargando PDF:', error)
      const errorMsg = error.message || 'Error desconocido al descargar el PDF'
      alert('Error al descargar el PDF: ' + errorMsg)
    } finally {
      setDescargandoPDF(false)
    }
  }

  const handleDescargarExcel = async () => {
    setDescargandoExcel(true)
    try {
      const result = await CoordinadorService.descargarReporteExcelClasificados()
      if (result.success) {
        
      } else {
        const errorMsg = result.error || 'Error al descargar el Excel. Asegúrate de que la fase esté cerrada y que el Excel se haya generado correctamente.'
        alert(errorMsg)
      }
    } catch (error: any) {
      console.error('Error descargando Excel:', error)
      const errorMsg = error.message || 'Error desconocido al descargar el Excel'
      alert('Error al descargar el Excel: ' + errorMsg)
    } finally {
      setDescargandoExcel(false)
    }
  }

  const handleDescargarEstadisticas = async () => {
    setDescargandoEstadisticas(true)
    try {
      const result = await CoordinadorService.descargarReportePDFEstadisticasDetalladas()
      if (result.success) {
        
      } else {
        const errorMsg = result.error || 'Error al descargar el PDF de estadísticas. Asegúrate de que la fase esté cerrada y que el reporte se haya generado correctamente.'
        alert(errorMsg)
      }
    } catch (error: any) {
      console.error('Error descargando PDF de estadísticas:', error)
      const errorMsg = error.message || 'Error desconocido al descargar el PDF de estadísticas'
      alert('Error al descargar el PDF de estadísticas: ' + errorMsg)
    } finally {
      setDescargandoEstadisticas(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando información de cierre...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!cierreData) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No se pudo cargar la información del cierre de fase
          </div>
        </CardContent>
      </Card>
    )
  }

  const { area, estadisticas, estado_cierre, fecha_cierre, vista_previa_clasificados } = cierreData
  
  const porcentajeCompletitud = estadisticas?.porcentaje_completitud || 0
  const puedeCerrar = porcentajeCompletitud >= 99.9 && estado_cierre !== 'cerrada' && estadisticas?.puede_cerrar !== false
  
  
  console.log('CierreFaseArea - Debug completo:', {
    porcentajeCompletitud,
    estado_cierre,
    puede_cerrar_backend: estadisticas?.puede_cerrar,
    puedeCerrar,
    total_participantes: estadisticas?.total_participantes,
    total_evaluados: estadisticas?.total_evaluados,
    clasificados_real: estadisticas?.clasificados_real
  })
  console.log('CierreFaseArea - vista_previa_clasificados:', vista_previa_clasificados)
  console.log('CierreFaseArea - clasificados:', vista_previa_clasificados?.clasificados)
  console.log('CierreFaseArea - no_clasificados:', vista_previa_clasificados?.no_clasificados)
  console.log('CierreFaseArea - estado_cierre:', estado_cierre)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Cierre de Fase Clasificatoria
          </CardTitle>
          <CardDescription>
            Gestión del cierre de la fase clasificatoria del área: {area?.nombre}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado de Completitud */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progreso de Evaluaciones</span>
                <span className="text-sm font-semibold">{porcentajeCompletitud.toFixed(1)}%</span>
              </div>
              <Progress value={porcentajeCompletitud} className="h-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{estadisticas?.total_participantes || 0}</div>
                <div className="text-xs text-muted-foreground">Total Participantes</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{estadisticas?.total_evaluados || 0}</div>
                <div className="text-xs text-muted-foreground">Evaluados</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{estadisticas?.clasificados_real || 0}</div>
                <div className="text-xs text-muted-foreground">Clasificados</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(estadisticas?.total_participantes || 0) - (estadisticas?.total_evaluados || 0)}
                </div>
                <div className="text-xs text-muted-foreground">Pendientes</div>
              </div>
            </div>
          </div>

          {/* Estado del Cierre */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium mb-1">Estado de la Fase</div>
                <div className="flex items-center gap-2">
                  <Badge variant={estado_cierre === 'cerrada' ? 'default' : estado_cierre === 'activa' ? 'secondary' : 'outline'}>
                    {estado_cierre === 'cerrada' ? 'Cerrada' : estado_cierre === 'activa' ? 'Activa' : 'Pendiente'}
                  </Badge>
                  {fecha_cierre && (
                    <span className="text-xs text-muted-foreground">
                      Cerrada el {new Date(fecha_cierre).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {puedeCerrar && (
                <Button onClick={handleCerrarFase} className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Cerrar Fase de {area?.nombre}
                </Button>
              )}
              {!puedeCerrar && porcentajeCompletitud >= 99.9 && estado_cierre !== 'cerrada' && (
                <div className="text-sm text-orange-600 font-medium">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Listo para cerrar (verifica los datos arriba)
                </div>
              )}
              {estado_cierre === 'cerrada' && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-sm text-green-600 font-medium">
                    ✓ Fase cerrada
                  </div>
                  {estadoPublicacion?.publicado && (
                    <Badge variant="default" className="bg-green-600">
                      <Globe className="h-3 w-3 mr-1" />
                      Publicado
                    </Badge>
                  )}
                  <Button 
                    onClick={handleDescargarPDF} 
                    disabled={descargandoPDF}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {descargandoPDF ? 'Descargando...' : 'PDF'}
                  </Button>
                  <Button 
                    onClick={handleDescargarExcel} 
                    disabled={descargandoExcel}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {descargandoExcel ? 'Descargando...' : 'Excel Clasificados'}
                  </Button>
                  <Button 
                    onClick={handleDescargarEstadisticas} 
                    disabled={descargandoEstadisticas}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {descargandoEstadisticas ? 'Descargando...' : 'Estadísticas'}
                  </Button>
                  {!estadoPublicacion?.publicado ? (
                    <Button 
                      onClick={handlePublicar} 
                      disabled={publicando}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      {publicando ? 'Publicando...' : 'Publicar Resultados'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleDespublicar} 
                      disabled={despublicando}
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      {despublicando ? 'Despublicando...' : 'Despublicar'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {!puedeCerrar && porcentajeCompletitud < 99.9 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-yellow-800">
                    No se puede cerrar la fase aún
                  </div>
                  <div className="text-xs text-yellow-700 mt-1">
                    Se requiere 100% de evaluaciones completadas. Actualmente: {porcentajeCompletitud.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
          {porcentajeCompletitud >= 99.9 && estado_cierre !== 'cerrada' && !puedeCerrar && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-800">
                    Evaluaciones completadas
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Puedes cerrar la fase ahora. Si no ves el botón, verifica que el estado no sea 'cerrada'.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección de Firma Digital - Solo antes de cerrar la fase (cuando está lista para cerrar) */}
      {puedeCerrar && estado_cierre !== 'cerrada' && (
        <div className="mt-6">
          <FirmaDigital
            onGuardar={handleGuardarFirma}
            firmaExistente={firmaExistente}
            fechaFirma={fechaFirma}
            reporteTipo="cierre_fase"
          />
        </div>
      )}

      {/* Modal de Confirmación de Cierre */}
      <Dialog open={showCierreModal} onOpenChange={setShowCierreModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirmar Cierre de Fase</DialogTitle>
            <DialogDescription>
              Estás a punto de cerrar la fase clasificatoria del área: <strong>{area?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumen de Impacto */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Resumen de Impacto</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div>• Total de participantes: <strong>{estadisticas?.total_participantes || 0}</strong></div>
                <div>• Total evaluados: <strong>{estadisticas?.total_evaluados || 0}</strong></div>
                <div>• Clasificados: <strong className="text-green-700">{vista_previa_clasificados?.clasificados?.length || 0}</strong></div>
                <div>• No clasificados: <strong className="text-orange-700">{vista_previa_clasificados?.no_clasificados?.length || 0}</strong></div>
              </div>
            </div>

            {/* Criterios de Aceptación */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-5 shadow-sm">
              <h4 className="font-bold text-lg mb-4">Después de cerrar la fase de tu área:</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Los <strong>{vista_previa_clasificados?.clasificados?.length || 0} clasificados</strong> quedarán registrados en el sistema</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Se generará un reporte PDF con los resultados de <strong>{area?.nombre}</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>No podrás modificar las evaluaciones de esta fase</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>El administrador general podrá ver que tu área completó el proceso</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>La fase final se habilitará cuando el administrador cierre la fase general</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                ⚠️ Importante
              </h4>
              <div className="space-y-2 text-sm text-yellow-800">
                <div>• Esta acción no se puede deshacer fácilmente</div>
                <div>• Asegúrate de que todas las evaluaciones estén correctas antes de continuar</div>
              </div>
            </div>

            {vista_previa_clasificados && vista_previa_clasificados.clasificados && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">Vista Previa de Clasificados ({vista_previa_clasificados.clasificados.length})</h4>
                  <div className="max-h-60 overflow-y-auto border rounded p-2 bg-green-50">
                    <div className="space-y-1">
                      {vista_previa_clasificados.clasificados.slice(0, 20).map((participante: any) => (
                        <div key={participante.id} className="flex items-center justify-between text-sm p-1 hover:bg-green-100 rounded">
                          <span>{participante.nombre_completo}</span>
                          <span className="font-semibold text-green-700">{participante.puntuacion}</span>
                        </div>
                      ))}
                      {vista_previa_clasificados.clasificados.length > 20 && (
                        <div className="text-xs text-muted-foreground text-center mt-2">
                          Y {vista_previa_clasificados.clasificados.length - 20} más...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {vista_previa_clasificados.no_clasificados && vista_previa_clasificados.no_clasificados.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-700">No Clasificados ({vista_previa_clasificados.no_clasificados.length})</h4>
                    <div className="max-h-60 overflow-y-auto border rounded p-2 bg-red-50">
                      <div className="space-y-1">
                        {vista_previa_clasificados.no_clasificados.slice(0, 20).map((participante: any) => (
                          <div key={participante.id} className="flex items-center justify-between text-sm p-1 hover:bg-red-100 rounded">
                            <span>{participante.nombre_completo}</span>
                            <span className="font-semibold text-red-700">{participante.puntuacion}</span>
                          </div>
                        ))}
                        {vista_previa_clasificados.no_clasificados.length > 20 && (
                          <div className="text-xs text-muted-foreground text-center mt-2">
                            Y {vista_previa_clasificados.no_clasificados.length - 20} más...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowCierreModal(false)} disabled={cerrando}>
              Cancelar
            </Button>
            <Button onClick={confirmarCierre} disabled={cerrando} className="bg-blue-600 hover:bg-blue-700">
              {cerrando ? 'Cerrando...' : 'Confirmar Cierre'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CierreFaseFinal() {
  const [loading, setLoading] = useState<boolean>(true)
  const [faseCerrada, setFaseCerrada] = useState<boolean>(false)
  const [showCierreModal, setShowCierreModal] = useState<boolean>(false)
  const [cerrando, setCerrando] = useState<boolean>(false)
  const [descargandoPDF, setDescargandoPDF] = useState<boolean>(false)
  const [descargandoExcel, setDescargandoExcel] = useState<boolean>(false)
  const [descargandoEstadisticas, setDescargandoEstadisticas] = useState<boolean>(false)
  const [faseData, setFaseData] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const verificarEstado = async () => {
      try {
        const response = await CoordinadorService.getProgresoEvaluacionFinal()
        if (response.success) {
         
          const cerrada = response.data?.estado_fase?.cerrada || false
          const estado = response.data?.estado_fase?.estado || 'activa'
          
        
          const estaCerrada = cerrada || estado === 'cerrada'
          
          console.log(' [CierreFaseFinal] Estado fase final:', {
            cerrada: cerrada,
            estado: estado,
            estaCerrada: estaCerrada,
            fecha_cierre: response.data?.estado_fase?.fecha_cierre
          })
          
          setFaseCerrada(estaCerrada)
          setFaseData(response.data)
        }
      } catch (error) {
        console.error('Error verificando estado de fase final:', error)
      } finally {
        setLoading(false)
      }
    }
    verificarEstado()
    const interval = setInterval(verificarEstado, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleCerrarFase = async () => {
    setCerrando(true)
    try {
      const response = await CoordinadorService.cerrarFaseFinal()
      if (response.success) {
        toast({
          title: "Fase final cerrada",
          description: "La fase final ha sido cerrada exitosamente. Los reportes se están generando en segundo plano.",
        })
        setFaseCerrada(true)
        setShowCierreModal(false)
        // Recargar datos
        const refreshResponse = await CoordinadorService.getProgresoEvaluacionFinal()
        if (refreshResponse.success) {
          setFaseData(refreshResponse.data)
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "No se pudo cerrar la fase final",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cerrar la fase final",
        variant: "destructive",
      })
    } finally {
      setCerrando(false)
    }
  }

  const handleRegenerar = async () => {
   
    setLoading(true)
    try {
      const response = await CoordinadorService.getProgresoEvaluacionFinal()
      if (response.success) {
        setFaseData(response.data)
        toast({
          title: "Datos actualizados",
          description: "La información ha sido regenerada exitosamente.",
        })
      }
    } catch (error) {
      console.error('Error regenerando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompartir = () => {
    
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "URL copiada",
      description: "El enlace ha sido copiado al portapapeles.",
    })
  }

  const handleDescargarPDF = async () => {
    setDescargandoPDF(true)
    try {
      const result = await CoordinadorService.descargarReportePDFCierreFaseFinal()
      if (result.success) {
        toast({
          title: "Descarga exitosa",
          description: "El reporte PDF se está descargando",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo descargar el reporte PDF",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al descargar el reporte PDF",
        variant: "destructive",
      })
    } finally {
      setDescargandoPDF(false)
    }
  }

  const handleDescargarExcel = async () => {
    setDescargandoExcel(true)
    try {
      const result = await CoordinadorService.descargarReporteExcelParticipantesFaseFinal()
      if (result.success) {
        toast({
          title: "Descarga exitosa",
          description: "El reporte Excel se está descargando",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo descargar el reporte Excel",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al descargar el reporte Excel",
        variant: "destructive",
      })
    } finally {
      setDescargandoExcel(false)
    }
  }

  const handleDescargarEstadisticas = async () => {
    setDescargandoEstadisticas(true)
    try {
      const result = await CoordinadorService.descargarReportePDFEstadisticasFaseFinal()
      if (result.success) {
        toast({
          title: "Descarga exitosa",
          description: "El reporte de estadísticas se está descargando",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo descargar el reporte de estadísticas",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al descargar el reporte de estadísticas",
        variant: "destructive",
      })
    } finally {
      setDescargandoEstadisticas(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando información de cierre de fase final...</p>
      </div>
    )
  }

  if (loading && !faseData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando información de cierre de fase final...</p>
      </div>
    )
  }

  const medallas = faseData?.medallas || { oro: 0, plata: 0, bronce: 0, mencion_honor: 0, sin_medalla: 0 }
  const totalEvaluados = faseData?.estadisticas_generales?.total_evaluados || 0
  const totalClasificados = faseData?.estadisticas_generales?.total_clasificados || 0
 
  const totalPremiados = medallas.oro + medallas.plata + medallas.bronce
 
  const totalSinMedalla = medallas.mencion_honor + (medallas.sin_medalla || 0)
  const porcentajePremiados = totalEvaluados > 0 ? ((totalPremiados / totalEvaluados) * 100).toFixed(1) : '0'
  const porcentajeSinMedalla = totalEvaluados > 0 ? ((totalSinMedalla / totalEvaluados) * 100).toFixed(1) : '0'
  const topParticipantes = faseData?.top_participantes || []
  const configMedallero = faseData?.config_medallero
  const fechaCierre = faseData?.estado_fase?.fecha_cierre
    ? new Date(faseData.estado_fase.fecha_cierre).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null

  const getMedallaIcon = (tipo: string) => {
    switch(tipo) {
      case 'oro': return <Medal className="h-6 w-6 text-yellow-500" />
      case 'plata': return <Medal className="h-6 w-6 text-gray-400" />
      case 'bronce': return <Medal className="h-6 w-6 text-orange-500" />
      case 'mencion_honor': return <Award className="h-6 w-6 text-blue-500" />
      default: return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
    }
  }

  const getMedallaColor = (tipo: string) => {
    switch(tipo) {
      case 'oro': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', progress: 'bg-yellow-500' }
      case 'plata': return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', progress: 'bg-gray-400' }
      case 'bronce': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', progress: 'bg-orange-500' }
      case 'mencion_honor': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', progress: 'bg-blue-500' }
      default: return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-700', progress: 'bg-gray-300' }
    }
  }

  const getRangoMedalla = (tipo: string) => {
    if (!configMedallero) {
      return 'N/A'
    }
    
    switch(tipo) {
      case 'oro': 
        const oroMin = configMedallero.oro_min
        const oroMax = configMedallero.oro_max
       
        if (oroMin !== null && oroMin !== undefined && oroMin > 0 && 
            oroMax !== null && oroMax !== undefined && oroMax > 0) {
          return `${oroMin}-${oroMax}`
        }
       
        return 'N/A'
      case 'plata': 
        const plataMin = configMedallero.plata_min
        const plataMax = configMedallero.plata_max
       
        if (plataMin !== null && plataMin !== undefined && plataMin > 0 && 
            plataMax !== null && plataMax !== undefined && plataMax > 0) {
          return `${plataMin}-${plataMax}`
        }
        return 'N/A'
      case 'bronce': 
        const bronceMin = configMedallero.bronce_min
        const bronceMax = configMedallero.bronce_max
        
        if (bronceMin !== null && bronceMin !== undefined && bronceMin > 0 && 
            bronceMax !== null && bronceMax !== undefined && bronceMax > 0) {
          return `${bronceMin}-${bronceMax}`
        }
        return 'N/A'
      case 'mencion_honor': 
        
        return 'N/A'
      default: return 'N/A'
    }
  }

  const getMaxMedalla = (tipo: string) => {
    if (!configMedallero) return 0
    switch(tipo) {
      case 'oro': return configMedallero.oro || 0
      case 'plata': return configMedallero.plata || 0
      case 'bronce': return configMedallero.bronce || 0
      case 'mencion_honor': return configMedallero.mencion_honor || 0
      default: return 0
    }
  }

  return (
    <>
      {faseCerrada ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Fase Final Cerrada</h2>
              {fechaCierre && (
                <p className="text-sm text-muted-foreground">al {fechaCierre}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRegenerar} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Regenerar
              </Button>
              <Button variant="outline" size="sm" onClick={handleCompartir}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
            </div>
          </div>

          {/* Resumen General */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{totalEvaluados}</div>
                  <div className="text-sm text-muted-foreground">Total Evaluados</div>
                  <div className="text-xs text-muted-foreground mt-1">de {totalClasificados} participantes</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{totalPremiados}</div>
                  <div className="text-sm text-muted-foreground">Participantes Premiados</div>
                  <div className="text-xs text-muted-foreground mt-1">{porcentajePremiados}% del total</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600">{totalSinMedalla}</div>
                  <div className="text-sm text-muted-foreground">Sin Medalla</div>
                  <div className="text-xs text-muted-foreground mt-1">{porcentajeSinMedalla}% del total</div>
                  <div className="text-xs text-muted-foreground mt-1">(Mención de Honor)</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm font-semibold text-purple-700 mb-2">Distribución Rápida</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Oro:</span>
                      <span className="font-bold">{medallas.oro}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Plata:</span>
                      <span className="font-bold">{medallas.plata}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bronce:</span>
                      <span className="font-bold">{medallas.bronce}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mención:</span>
                      <span className="font-bold">
                        {(medallas.mencion_honor || 0) + (medallas.sin_medalla || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjetas de Medallas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['oro', 'plata', 'bronce', 'mencion_honor'].map((tipo) => {
                  let cantidad = medallas[tipo as keyof typeof medallas] || 0
                  
                  if (tipo === 'mencion_honor') {
                    cantidad = cantidad + (medallas.sin_medalla || 0)
                  }
                  const max = tipo !== 'mencion_honor' ? getMaxMedalla(tipo) : 0
                  const porcentaje = max > 0 ? ((cantidad / max) * 100) : 0
                  const colors = getMedallaColor(tipo)
                  const nombre = tipo === 'oro' ? 'Oro' : tipo === 'plata' ? 'Plata' : tipo === 'bronce' ? 'Bronce' : 'Mención de Honor'
                  
                  return (
                    <Card key={tipo} className={`${colors.bg} ${colors.border} border-2`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-center mb-2">
                          {getMedallaIcon(tipo)}
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold mb-1">{cantidad}</div>
                          <div className="text-sm font-semibold mb-2">{nombre}</div>
                          {tipo === 'mencion_honor' ? (
                            <div className="text-xs text-muted-foreground">
                              No recibieron medalla porque no cumplen con ningún criterio de configuración de medallero
                            </div>
                          ) : (
                            <>
                              <div className="text-xs text-muted-foreground mb-2">Rango: {getRangoMedalla(tipo)}</div>
                              {max > 0 && (
                                <>
                                  <Progress value={porcentaje} className="h-2 mb-1" />
                                  <div className="text-xs text-muted-foreground">
                                    {Math.round(porcentaje)}% de {max} máx.
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Clasificados */}
          {topParticipantes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top 5 Clasificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-center font-semibold">Posición</TableHead>
                        <TableHead className="font-semibold">Nombre</TableHead>
                        <TableHead className="font-semibold">Institución</TableHead>
                        <TableHead className="font-semibold">Nivel</TableHead>
                        <TableHead className="text-center font-semibold">Nota</TableHead>
                        <TableHead className="text-center font-semibold">Medalla</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topParticipantes.map((participante: any, index: number) => {
                        const nota = parseFloat(participante.nota_promedio || 0)
                        const medalla = participante.medalla
                        const esMedallaMetal = medalla === 'oro' || medalla === 'plata' || medalla === 'bronce'
                        const esMencionHonor =
                          !medalla ||
                          medalla === 'sin_medalla' ||
                          medalla === 'mencion_honor'

                        return (
                          <TableRow 
                            key={index}
                            className={index < 3 ? "bg-muted/20" : ""}
                          >
                            <TableCell className="text-center font-bold text-lg">
                              <div className="flex items-center justify-center">
                                {index === 0 && <Trophy className="h-4 w-4 text-yellow-500 mr-1" />}
                                {index === 1 && <Trophy className="h-4 w-4 text-gray-400 mr-1" />}
                                {index === 2 && <Trophy className="h-4 w-4 text-orange-500 mr-1" />}
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{participante.nombre_completo}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {participante.unidad_educativa || 'N/A'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {participante.nivel_nombre || participante.grado_escolaridad || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-bold text-lg text-primary">
                                {nota.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {esMedallaMetal ? (
                                <div className="flex items-center justify-center gap-2">
                                  {getMedallaIcon(medalla)}
                                  <span className="text-sm capitalize font-medium">
                                    {medalla === 'oro'
                                      ? 'Oro'
                                      : medalla === 'plata'
                                      ? 'Plata'
                                      : 'Bronce'}
                                  </span>
                                </div>
                              ) : esMencionHonor ? (
                                <div className="flex items-center justify-center gap-2">
                                  {getMedallaIcon('mencion_honor')}
                                  <span className="text-sm font-medium">Mención de Honor</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Sin medalla</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Mostrando {topParticipantes.length} de {totalEvaluados} participantes evaluados
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de Descarga */}
          <Card>
            <CardHeader>
              <CardTitle>Reportes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleDescargarPDF}
                  disabled={descargandoPDF}
                  className="w-full"
                  variant="outline"
                >
                  {descargandoPDF ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Reporte PDF
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleDescargarExcel}
                  disabled={descargandoExcel}
                  className="w-full"
                  variant="outline"
                >
                  {descargandoExcel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Reporte Excel
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleDescargarEstadisticas}
                  disabled={descargandoEstadisticas}
                  className="w-full"
                  variant="outline"
                >
                  {descargandoEstadisticas ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Estadísticas
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Cierre de Fase Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Fase final activa</span>
                </div>
                <p className="text-sm text-yellow-600 mt-2">
                  Una vez que todos los participantes clasificados hayan sido evaluados, podrás cerrar la fase final manualmente usando el botón de abajo. Esta acción calculará las medallas según la configuración de medallero y generará los reportes oficiales.
                </p>
              </div>
              
              <Button
                onClick={() => setShowCierreModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Lock className="mr-2 h-4 w-4" />
                Cerrar Fase Final
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                La fase final solo se cierra cuando presionas este botón. No se cierra automáticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCierreModal} onOpenChange={setShowCierreModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cierre de Fase Final</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cerrar la fase final? Esta acción calculará las medallas según la configuración de medallero y generará los reportes oficiales.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCierreModal(false)}
              disabled={cerrando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCerrarFase}
              disabled={cerrando}
            >
              {cerrando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Confirmar Cierre
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AsignacionUI({ realEvaluators, areaName }: { realEvaluators: any[]; areaName: string }) {
  const [fase, setFase] = useState<'clasificacion'|'final'>('clasificacion')
  const [numEval, setNumEval] = useState<string>('2')
  const [metodo, setMetodo] = useState<'simple'|'balanceado'>('simple')
  const [evitarIE, setEvitarIE] = useState(true)
  const [evitarArea, setEvitarArea] = useState(true)
  const [nivelId, setNivelId] = useState<string|undefined>(undefined)
  const [areaId, setAreaId] = useState<string|undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<any[]>([])

  const generar = async (confirmar: boolean) => {
    if (!areaId || !nivelId) {
      console.error('Debe seleccionar un área y un nivel educativo')
      return
    }
    setLoading(true)
    try {
      const res = await CoordinadorService.generarAsignaciones({
        area_id: parseInt(areaId, 10),
        nivel_id: nivelId, 
        fase,
        num_evaluadores: Math.max(1, Math.min(5, parseInt(numEval || '1', 10))),
        metodo,
        evitar_misma_institucion: evitarIE,
        evitar_misma_area: evitarArea,
        confirmar,
      })
      setRows((res as any)?.data?.items || [])
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!rows.length) return
    const headers = ['Inscripción', 'Evaluadores']
    const lines = [headers.join(',')]
    rows.forEach(r => lines.push([r.inscripcion_area_id, (r.evaluadores||[]).join(' | ')].join(',')))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asignacion_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-medium mb-1">Área</div>
          <Select value={areaId} onValueChange={setAreaId}>
            <SelectTrigger><SelectValue placeholder="Selecciona un área" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Matemáticas</SelectItem>
              <SelectItem value="2">Física</SelectItem>
              <SelectItem value="3">Química</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Nivel Educativo</div>
          <Select value={nivelId} onValueChange={setNivelId}>
            <SelectTrigger><SelectValue placeholder="Selecciona nivel educativo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="primaria">Primario</SelectItem>
              <SelectItem value="secundaria">Secundario</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            El sistema asignará automáticamente 1 evaluador por cada nivel específico (1ro, 2do, 3ro, 4to, 5to, 6to)
          </p>
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Fase</div>
          <Select value={fase} onValueChange={(v)=>setFase(v as any)}>
            <SelectTrigger><SelectValue placeholder="Fase" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="clasificacion">Clasificación</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm mb-1">N.º evaluadores por competidor</div>
          <Input type="number" min={1} max={5} value={numEval} onChange={e=>setNumEval(e.target.value)} />
        </div>
        <div className="col-span-2">
          <div className="text-sm mb-1">Método</div>
          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={metodo==='simple'} onChange={()=>setMetodo('simple')} /> Aleatorio simple</label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={metodo==='balanceado'} onChange={()=>setMetodo('balanceado')} /> Balanceado por área</label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={evitarIE} onChange={e=>setEvitarIE(e.target.checked)} /> Evitar evaluador de la misma institución</label>
        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={evitarArea} onChange={e=>setEvitarArea(e.target.checked)} /> Evitar evaluador de la misma área</label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={loading || !areaId} onClick={()=>generar(false)}>{loading ? 'Generando...' : 'Previsualizar'}</Button>
        <Button variant="outline" disabled={!rows.length} onClick={()=>generar(true)}>Guardar asignación</Button>
        <Button variant="outline" disabled={!rows.length} onClick={exportCSV}>Exportar (Excel)</Button>
      </div>

      {/* Estadísticas por nivel */}
      {rows.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Asignación Automática: 1 Evaluador por Nivel</h3>
          <p className="text-sm text-muted-foreground mb-4">
            El sistema ha asignado automáticamente un evaluador específico para cada nivel educativo encontrado
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.reduce((acc: any[], row: any) => {
              const nivel = row.nivel;
              const evaluadorInfo = (row.evaluadores_info || [])[0];
              if (!acc.find(item => item.nivel === nivel)) {
                acc.push({
                  nivel,
                  evaluador: evaluadorInfo?.name || evaluadorInfo?.nombre || 'Sin asignar',
                  total: 0
                });
              }
              const item = acc.find(item => item.nivel === nivel);
              if (item) item.total++;
              return acc;
            }, []).map((item, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800">{item.nivel}</h4>
                <p className="text-blue-600">Evaluador: {item.evaluador}</p>
                <p className="text-blue-600">Inscripciones: {item.total}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de resultados */}
      {rows.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inscripción</TableHead>
                <TableHead>Competidor</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Institución</TableHead>
                <TableHead>Evaluador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={`row-${i}`}>
                  <TableCell className="font-medium">{r.inscripcion_area_id}</TableCell>
                  <TableCell>{r.competidor}</TableCell>
                  <TableCell>{r.area}</TableCell>
                  <TableCell>{r.nivel}</TableCell>
                  <TableCell>{r.institucion}</TableCell>
                  <TableCell>
                    {(r.evaluadores_info || []).map((evaluador: any, idx: number) => (
                      <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {evaluador?.name || evaluador?.nombre || 'Sin asignar'}
                      </span>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
export default function CoordinatorDashboard() {
  const { user } = useAuth() as any
  const { toast } = useToast()
  const avatarUrl = user?.avatar_url as string | undefined
  const toAbsolute = (p?: string) => {
    if (!p) return undefined
    if (/^https?:\/\//i.test(p)) return p
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo'
    return `${baseUrl}${p.startsWith('/') ? '' : '/'}${p}`
  }
  const avatarSrc = toAbsolute(avatarUrl)
  const userName: string = user?.name || user?.nombre || ""
  const initials = userName ? userName.split(' ').map((p: string)=>p[0]).slice(0,2).join('').toUpperCase() : 'U'
  const [activeTab, setActiveTab] = useState("progress")
  const [areaName, setAreaName] = useState<string>("Matemáticas")
  const [realEvaluators, setRealEvaluators] = useState<any[]>([])
  const [loadingEvaluators, setLoadingEvaluators] = useState<boolean>(false)
  const [myArea, setMyArea] = useState<any>(null)
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
  const [availableEvaluators, setAvailableEvaluators] = useState<any[]>([])
  const [loadingAvailableEvaluators, setLoadingAvailableEvaluators] = useState<boolean>(false)
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("")
  const [assigning, setAssigning] = useState<boolean>(false)
  const [asigLoading, setAsigLoading] = useState(false)
  const [asigPreview, setAsigPreview] = useState<any[]>([])
  const [cambiosPendientes, setCambiosPendientes] = useState<number>(0)
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false)
  const [certificateArea, setCertificateArea] = useState<Area | null>(null)

  
  useEffect(() => {
    const fetchCambiosPendientes = async () => {
      try {
        const data = await CoordinadorService.getCambiosPendientes()
        setCambiosPendientes(data.data?.total_pendientes || 0)
      } catch (err) {
        console.error('Error fetching cambios pendientes:', err)
      }
    }
    if (user) {
      fetchCambiosPendientes()
    }
  }, [user])

  
  const defaultArea = {
    name: areaName,
    participants: 245,
    capacity: 300,
    evaluators: 8,
    pendingEvaluations: 23,
    completedEvaluations: 167,
  }

  const stats = [
    {
      title: "Participantes en mi Área",
      value: String(myArea?.participants || 0),
      change: "+0",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Evaluaciones Pendientes",
      value: String(myArea?.pendingEvaluations || 0),
      change: "-0",
      trend: "down",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Evaluadores Asignados",
      value: String(realEvaluators.length),
      change: "+0",
      trend: "up",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Evaluaciones Completadas",
      value: String(myArea?.completedEvaluations || 0),
      change: "+0",
      trend: "up",
      icon: CheckCircle,
      color: "text-purple-600",
    },
  ]

  const recentParticipants = [
    {
      id: 1,
      name: "Juan Pérez Mamani",
      institution: "Colegio San Simón",
      registrationDate: "2025-03-15",
      status: "approved",
      score: null,
    },
    {
      id: 2,
      name: "María González Quispe",
      institution: "U.E. Bolivar",
      registrationDate: "2025-03-14",
      status: "evaluated",
      score: 85,
    },
    {
      id: 3,
      name: "Carlos López Vargas",
      institution: "Colegio Técnico",
      registrationDate: "2025-03-13",
      status: "pending",
      score: null,
    },
    {
      id: 4,
      name: "Ana Martínez Condori",
      institution: "Colegio Nacional",
      registrationDate: "2025-03-12",
      status: "evaluated",
      score: 92,
    },
  ]

  const evaluators = [
    {
      id: 1,
      name: "Dr. Roberto Fernández",
      email: "r.fernandez@umss.edu.bo",
      assignedParticipants: 31,
      completedEvaluations: 28,
      status: "active",
    },
    {
      id: 2,
      name: "Lic. Carmen Rojas",
      email: "c.rojas@umss.edu.bo",
      assignedParticipants: 29,
      completedEvaluations: 25,
      status: "active",
    },
    {
      id: 3,
      name: "Ing. Miguel Torres",
      email: "m.torres@umss.edu.bo",
      assignedParticipants: 32,
      completedEvaluations: 30,
      status: "active",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "evaluated":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobado"
      case "evaluated":
        return "Evaluado"
      case "pending":
        return "Pendiente"
      case "rejected":
        return "Rechazado"
      default:
        return "Desconocido"
    }
  }

  
  const fetchEvaluators = async () => {
    setLoadingEvaluators(true)
    try {
      console.log('Obteniendo evaluadores reales...')
      const response = await AdminService.getUsers()
      console.log('Respuesta de usuarios:', response)
      
      if (response.success && response.data) {
       
        const evaluators = response.data.filter((user: any) => 
          (user.role === 'evaluador' || user.rol === 'evaluador')
        )
        console.log('Evaluadores encontrados:', evaluators)
        setRealEvaluators(evaluators)
      } else {
        console.error('Error al obtener usuarios:', response.message)
        setRealEvaluators([])
      }
    } catch (error: any) {
      console.error('Error al obtener evaluadores:', error)
      setRealEvaluators([])
    } finally {
      setLoadingEvaluators(false)
    }
  }

  
  const fetchMyArea = async () => {
    try {
      const profile = await AuthService.getProfile()
      console.log('Perfil del coordinador:', profile)
      console.log('Áreas del coordinador:', profile?.data?.areas)
      console.log('Área específica:', profile?.data?.area_nombre || profile?.data?.area)
      
      if (profile && profile.data) {
        const userData = profile.data
        const areaName = userData.area_nombre || userData.area || 'Matemáticas'
        setAreaName(areaName)
        
        
        const areaData = {
          name: areaName,
          participants: 0, 
          capacity: 300,
          evaluators: realEvaluators.length,
          pendingEvaluations: 0,
          completedEvaluations: 0,
        }
        setMyArea(areaData)
      }
    } catch (error: any) {
      console.error('Error al obtener perfil:', error)
      setMyArea(defaultArea)
    }
  }

  
  useEffect(() => {
    fetchEvaluators()
    fetchMyArea()
  }, [])

  
  useEffect(() => {
    if (realEvaluators.length > 0 && myArea) {
      setMyArea((prev: any) => ({
        ...prev,
        evaluators: realEvaluators.length
      }))
    }
  }, [realEvaluators])

  
  const fetchAvailableEvaluators = async () => {
    setLoadingAvailableEvaluators(true)
    try {
      console.log('Obteniendo evaluadores disponibles...')
      console.log('Evaluadores actualmente asignados:', realEvaluators)
      
      const response = await AdminService.getUsers()
      console.log('Respuesta de usuarios:', response)
      
      if (response.success && response.data) {
        
        const allEvaluators = response.data.filter((user: any) => 
          (user.role === 'evaluador' || user.rol === 'evaluador')
        )
        
        console.log('Todos los evaluadores:', allEvaluators)
        
        
        let available = allEvaluators
        
        
        if (realEvaluators.length > 0) {
          available = allEvaluators.filter((evaluator: any) => {
            const isAlreadyAssigned = realEvaluators.some(assigned => 
              String(assigned.id) === String(evaluator.id)
            )
            console.log(`Evaluador ${evaluator.name} (ID: ${evaluator.id}) - Ya asignado: ${isAlreadyAssigned}`)
            return !isAlreadyAssigned
          })
        } else {
          console.log('No hay evaluadores asignados, mostrando todos los evaluadores')
        }
        
        console.log('Evaluadores disponibles:', available)
        setAvailableEvaluators(available)
      } else {
        console.error('Error al obtener usuarios:', response.message)
        setAvailableEvaluators([])
      }
    } catch (error: any) {
      console.error('Error al obtener evaluadores disponibles:', error)
      setAvailableEvaluators([])
    } finally {
      setLoadingAvailableEvaluators(false)
    }
  }

 
  const handleOpenAssignModal = async () => {
    console.log('Abriendo modal de asignación...')
    console.log('Evaluadores asignados actualmente:', realEvaluators.length)
    setShowAssignModal(true)
    await fetchAvailableEvaluators()
  }

 
  const handleAssignEvaluator = async () => {
    if (!selectedEvaluator) {
      alert('Por favor selecciona un evaluador')
      return
    }

    setAssigning(true)
    try {
      console.log('Asignando evaluador:', selectedEvaluator)
      
     
      const evaluatorToAssign = availableEvaluators.find(e => e.id.toString() === selectedEvaluator)
      
      if (evaluatorToAssign) {
        
        setRealEvaluators(prev => [...prev, evaluatorToAssign])
        
        
        setAvailableEvaluators(prev => prev.filter(e => e.id.toString() !== selectedEvaluator))
        
       
        setShowAssignModal(false)
        setSelectedEvaluator("")
        
        alert(`Evaluador ${evaluatorToAssign.name || evaluatorToAssign.nombre} asignado exitosamente`)
      }
    } catch (error: any) {
      console.error('Error al asignar evaluador:', error)
      alert('Error al asignar evaluador. Inténtalo de nuevo.')
    } finally {
      setAssigning(false)
    }
  }

  
  const handleCloseAssignModal = () => {
    setShowAssignModal(false)
    setSelectedEvaluator("")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/sansi-logo.png" alt="SanSi Logo" className="h-6 sm:h-8 w-auto" />
                <span className="text-sm sm:text-xl font-heading font-bold text-foreground hidden sm:block">Olimpiada Oh! SanSi</span>
                <span className="text-sm font-heading font-bold text-foreground sm:hidden">SanSi</span>
              </Link>
              <Badge variant="secondary" className="text-xs hidden md:block">
                Coordinador - {myArea?.name || areaName}
              </Badge>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Configuración</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="hidden md:flex"
                onClick={async () => {
                  try {
                    
                    const response = await CertificadosService.getParticipantesPremiados();
                    if (response.success && response.data) {
                      const data = response.data;
                      const area: Area = {
                        id: data.area.id.toString(),
                        nombre: data.area.nombre,
                        approved: data.aprobado || false,
                        competitors: data.participantes.map((p: any) => ({
                          id: p.olimpista_id,
                          nombre: p.nombre,
                          unidad: p.unidad,
                          area: data.area.nombre,
                          nivel: p.nivel,
                          puntaje: p.puntaje || 0,
                          estado: p.medalla_asignada || 'mencion_honor',
                          puesto: p.puesto
                        }))
                      };
                      setCertificateArea(area);
                      setShowCertificateModal(true);
                    } else {
                      toast({
                        title: "Error",
                        description: response.message || "No se pudieron cargar los participantes premiados",
                        variant: "destructive"
                      });
                    }
                  } catch (error: any) {
                    console.error('Error cargando participantes premiados:', error);
                    toast({
                      title: "Error",
                      description: error.message || "Error al cargar los datos",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Aprobar Certificados</span>
              </Button>
              <Link href="/coordinador/perfil" className="inline-flex items-center justify-center h-9 w-9 rounded-full overflow-hidden border">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold flex items-center justify-center h-full w-full bg-blue-100 text-blue-700">{initials}</span>
                )}
              </Link>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  await AuthService.logout()
                } catch {}
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_token')
                  window.location.href = '/login'
                }
              }}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center space-x-1 sm:space-x-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}>
                <Bell className="h-4 w-4" />
              </Button>
              <Link href="/coordinador/perfil" className="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border-2 border-white shadow-sm hover:shadow-md transition-shadow">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs sm:text-sm font-semibold flex items-center justify-center h-full w-full bg-blue-100 text-blue-700">{initials}</span>
                )}
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}
                onClick={async () => {
                  try {
                    await AuthService.logout()
                  } catch {}
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token')
                    window.location.href = '/login'
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">Competidores de {myArea?.name || areaName}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Lista completa de competidores registrados en el área de {myArea?.name || areaName}, clasificados por nivel y estado de evaluación</p>
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-medium text-green-800">
                      Usted está registrado como <strong>Coordinador de Área</strong>
                    </span>
                    <p className="text-xs text-green-600 mt-1">
                      Coordina el área de {myArea?.name || areaName} y gestiona evaluadores
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-none border-0 h-auto sm:h-12" style={{backgroundColor: '#1a4e78'}}>
            <TabsTrigger 
              value="progress" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Progreso</span>
              <span className="sm:hidden">Prog.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="participants" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Participantes</span>
              <span className="sm:hidden">Olimpistas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="evaluators" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              Evaluadores
            </TabsTrigger>
            <TabsTrigger 
              value="control" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent rounded-none py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Control</span>
              <span className="sm:hidden">Ctrl</span>
            </TabsTrigger>
          </TabsList>


          {/* Progress Tab - Dashboard de Progreso de Evaluación Clasificatoria */}
          <TabsContent value="progress" className="space-y-4 sm:space-y-6">
            <Tabs defaultValue="clasificacion" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="clasificacion">Fase Clasificatoria</TabsTrigger>
                <TabsTrigger value="final">Fase Final</TabsTrigger>
              </TabsList>
              <TabsContent value="clasificacion" className="space-y-6">
                <ProgresoEvaluacionClasificatoria />
                <CierreFaseArea />
              </TabsContent>
              <TabsContent value="final" className="space-y-6">
                <ProgresoEvaluacionFinal />
                <CierreFaseFinal />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <ListaInscritosAreaNivel />
          </TabsContent>

          {/* Evaluators Tab */}
          <TabsContent value="evaluators" className="space-y-6">
            {/* Asignación Aleatoria de Evaluadores */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Asignación Aleatoria de Evaluadores
                </CardTitle>
                <CardDescription className="text-sm">
                  Genera asignaciones automáticas de evaluadores para tu área de competencia
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center py-6 px-4">
                  <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sistema de Asignación Automática
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Genera asignaciones aleatorias y balanceadas de evaluadores para todos los participantes de tu área, 
                    con opciones de configuración avanzadas y exportación a Excel.
                  </p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => window.open('/coordinador/asignacion-evaluadores', '_blank')}
                      className="flex items-center gap-2 w-full sm:w-auto"
                      size="lg"
                    >
                      <Users className="h-4 w-4" />
                      Ir a Asignación Aleatoria
                    </Button>
                    <Button
                    onClick={() => window.open('/coordinador/tiempos-evaluadores', '_blank')}
                    className="flex items-center gap-2 w-full sm:w-auto"
                    size="lg"
                    >
                    <Clock className="h-4 w-4" />
                    Gestionar Tiempos de Evaluación
                    </Button>
                    
                    <div className="text-xs text-muted-foreground">
                      💡 Configura el número de evaluadores, método de asignación y restricciones
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evaluations Tab */}
          {/* Control Tab - Solo Auditoría */}
          <TabsContent value="control" className="space-y-6">
            {/* Cambios Pendientes */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Cambios Pendientes de Revisión
                </CardTitle>
                <CardDescription className="text-sm">
                  Cambios de notas que requieren tu aprobación o rechazo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center py-6 px-4">
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    {cambiosPendientes || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {cambiosPendientes === 0 
                      ? 'No hay cambios pendientes de revisión'
                      : cambiosPendientes === 1
                      ? 'cambio pendiente de revisión'
                      : 'cambios pendientes de revisión'}
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/coordinador/log-auditoria'}
                    className="flex items-center gap-2 w-full bg-orange-600 hover:bg-orange-700"
                    disabled={cambiosPendientes === 0}
                  >
                    <FileText className="h-4 w-4" />
                    {cambiosPendientes > 0 ? 'Revisar Cambios' : 'Ir a Log de Auditoría'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Solo Log de Auditoría */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Log de Auditoría
                </CardTitle>
                <CardDescription className="text-sm">
                  Historial completo de cambios en evaluaciones de tu área
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center py-6 px-4">
                  <TrendingUp className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                    Sistema de Auditoría
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Accede al log completo de cambios para rastrear modificaciones y mantener trazabilidad.
                  </p>
                  <Button 
                    onClick={() => window.open('/coordinador/log-auditoria', '_blank')}
                    className="flex items-center gap-2 w-full"
                  >
                    <FileText className="h-4 w-4" />
                    Ir a Log de Auditoría
                  </Button>
                </div>
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Asignación de Evaluador */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Evaluador</DialogTitle>
            <DialogDescription>
              Selecciona un evaluador para asignar a tu área: {myArea?.name || areaName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingAvailableEvaluators ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Cargando evaluadores disponibles...</p>
              </div>
            ) : availableEvaluators.length > 0 ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">Evaluadores Disponibles:</label>
                <Select value={selectedEvaluator} onValueChange={setSelectedEvaluator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un evaluador" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvaluators.map((evaluator) => (
                      <SelectItem key={evaluator.id} value={evaluator.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{evaluator.name || evaluator.nombre}</span>
                          <span className="text-xs text-muted-foreground">{evaluator.email}</span>
                          {evaluator.area && (
                            <span className="text-xs text-blue-600">Área: {evaluator.area}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No hay evaluadores disponibles para asignar</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos los evaluadores ya están asignados a áreas
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCloseAssignModal}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignEvaluator}
              disabled={!selectedEvaluator || assigning || availableEvaluators.length === 0}
            >
              {assigning ? "Asignando..." : "Asignar Evaluador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Certificados para Coordinador */}
      <CoordinadorCertificateModal
        open={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        area={certificateArea}
        onToggleApproved={async (areaId, approved) => {
          try {
            
            const response = await CertificadosService.aprobarCertificados(approved);
            if (response.success) {
            
              if (certificateArea) {
                setCertificateArea({ ...certificateArea, approved });
              }
              toast({
                title: approved ? "Área aprobada" : "Aprobación cancelada",
                description: approved 
                  ? "El administrador ahora puede generar los certificados de esta área."
                  : "La aprobación ha sido cancelada.",
              });
            } else {
              toast({
                title: "Error",
                description: response.message || "No se pudo guardar la aprobación",
                variant: "destructive"
              });
            }
          } catch (error: any) {
            console.error('Error aprobando certificados:', error);
            toast({
              title: "Error",
              description: error.message || "Error al guardar la aprobación",
              variant: "destructive"
            });
          }
        }}
      />

    </div>
  )
}

