"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { OlimpistaService, AuthService, ReporteService, AdminService, CoordinadorService } from "@/lib/api"
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
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

function ListaInscritosAreaNivel() {
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>("")
  const [areaFilter, setAreaFilter] = useState<string>("all")
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

  // Datos de ejemplo para demostración
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

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  // Filtrar y ordenar participantes
  const filteredParticipantes = participantes.filter(p => {
    const nombre = p.nombre_completo || p.nombre || ''
    const documento = p.documento_identidad || p.documento || ''
    const institucion = p.unidad_educativa_nombre || p.institucion || ''
    
    const matchesSearch = !search || 
      nombre.toLowerCase().includes(search.toLowerCase()) ||
      documento.includes(search) ||
      institucion.toLowerCase().includes(search.toLowerCase())
    
    const area = p.area_nombre || p.area || ''
    const nivel = p.nivel_nombre || p.nivel || ''
    const estado = p.estado_evaluacion || p.inscripcion_estado || p.estado || ''
    
    const matchesArea = areaFilter === "all" || area === areaFilter
    const matchesNivel = nivelFilter === "all" || nivel === nivelFilter
    const matchesEstado = estadoFilter === "all" || estado === estadoFilter

    return matchesSearch && matchesArea && matchesNivel && matchesEstado
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
      
      // Obtener el área del coordinador desde el perfil
      const profileResponse = await AuthService.getProfile()
      let areaId = null
      
      if (profileResponse.success && profileResponse.data) {
        console.log('Perfil completo del coordinador:', profileResponse.data)
        
        // El coordinador tiene un área asignada - buscar en diferentes campos
        areaId = profileResponse.data.area_id || 
                 profileResponse.data.area?.id || 
                 profileResponse.data.areas?.[0]?.id ||
                 profileResponse.data.area_competencia_id
        
        console.log('Área ID encontrada:', areaId)
        console.log('Áreas disponibles:', profileResponse.data.areas)
        console.log('Área nombre:', profileResponse.data.area_nombre)
      }
      
      // Si no tenemos areaId, intentar obtenerlo de otra manera
      if (!areaId) {
        console.log('No se encontró areaId, intentando obtener áreas...')
        try {
          const catalogosResponse = await CoordinadorService.getCatalogos()
          console.log('Catálogos obtenidos:', catalogosResponse)
          
          if (catalogosResponse.success && catalogosResponse.data?.areas) {
            // Buscar el área de matemáticas
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
      
      // Usar el servicio CoordinadorService para obtener participantes con evaluaciones filtrados por área
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
        
        // Calcular estadísticas desde datos reales
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
        // Fallback a datos vacíos si hay error
        setStats({ total: 0, porArea: {}, porNivel: {}, porEstado: {} })
        setParticipantes([])
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error cargando participantes:', error)
      // Fallback a datos vacíos si hay error
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
              ✅ <strong>{participantes.length} participantes</strong> encontrados en tu área
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="text-2xl font-bold text-green-600">{stats.porEstado.confirmado || 0}</div>
              <div className="text-sm text-muted-foreground">Confirmados</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.porEstado.pendiente || 0}</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.porArea).length}</div>
              <div className="text-sm text-muted-foreground">Áreas</div>
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
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {Object.keys(stats.porArea).map(area => (
                    <SelectItem key={area} value={area}>
                      {area} ({stats.porArea[area]})
                    </SelectItem>
                  ))}
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
                setAreaFilter('all')
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
  const [progressData, setProgressData] = useState<any>({
    niveles: [
      { nombre: "Primario", total: 150, evaluados: 120, porcentaje: 80 },
      { nombre: "Secundario", total: 200, evaluados: 160, porcentaje: 80 },
      { nombre: "Superior", total: 100, evaluados: 75, porcentaje: 75 }
    ],
    evaluadoresActivos: 12,
    totalEvaluadores: 15,
    olimpistasSinEvaluar: [
      { id: 1, nombre: "Ana García López", area: "Matemáticas", nivel: "Primario", diasPendiente: 3 },
      { id: 2, nombre: "Carlos Mendoza", area: "Física", nivel: "Secundario", diasPendiente: 5 },
      { id: 3, nombre: "María Torres", area: "Química", nivel: "Superior", diasPendiente: 2 },
      { id: 4, nombre: "Luis Rodríguez", area: "Matemáticas", nivel: "Primario", diasPendiente: 7 },
      { id: 5, nombre: "Elena Vargas", area: "Física", nivel: "Secundario", diasPendiente: 1 }
    ]
  })

  // Simular actualización en tiempo real cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      // Aquí se haría la llamada real al API para obtener datos actualizados
      console.log('Actualizando datos de progreso...')
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Simular llamada al API
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLoading(false)
      } catch (error) {
        console.error('Error cargando datos de progreso:', error)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // Simular actualización manual
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Error actualizando datos:', error)
      setLoading(false)
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

  return (
    <div className="space-y-6">
      {/* Header con actualización en tiempo real */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Progreso de Evaluación Clasificatoria</h2>
          <p className="text-muted-foreground">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
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
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Activity className="h-4 w-4" />
            <span>Tiempo real</span>
          </div>
        </div>
      </div>

      {/* Dashboard con porcentaje de completitud por nivel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progreso por Nivel
          </CardTitle>
          <CardDescription>
            Porcentaje de completitud de evaluaciones por nivel educativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {progressData.niveles.map((nivel: any, index: number) => (
              <div key={index} className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{nivel.nombre}</h3>
                  <div className="text-3xl font-bold text-blue-600 mt-2">
                    {nivel.porcentaje}%
                  </div>
                </div>
                <Progress value={nivel.porcentaje} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{nivel.evaluados} evaluados</span>
                  <span>{nivel.total - nivel.evaluados} pendientes</span>
                </div>
                <div className="text-center text-sm">
                  <span className="font-medium">{nivel.total} total</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Indicador visual de evaluadores activos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Evaluadores Activos
          </CardTitle>
          <CardDescription>
            Estado actual de los evaluadores en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {progressData.evaluadoresActivos}
                </div>
                <div className="text-sm text-muted-foreground">Activos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400">
                  {progressData.totalEvaluadores - progressData.evaluadoresActivos}
                </div>
                <div className="text-sm text-muted-foreground">Inactivos</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">
                {Math.round((progressData.evaluadoresActivos / progressData.totalEvaluadores) * 100)}% activos
              </span>
            </div>
          </div>
          <Progress 
            value={(progressData.evaluadoresActivos / progressData.totalEvaluadores) * 100} 
            className="mt-4 h-2" 
          />
        </CardContent>
      </Card>

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
            {progressData.olimpistasSinEvaluar.map((olimpista: any) => (
              <div key={olimpista.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex-1">
                  <div className="font-medium">{olimpista.nombre}</div>
                  <div className="text-sm text-muted-foreground">
                    {olimpista.area} - {olimpista.nivel}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {olimpista.diasPendiente} días
                    </div>
                    <div className={`text-xs ${
                      olimpista.diasPendiente > 5 ? 'text-red-600' : 
                      olimpista.diasPendiente > 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {olimpista.diasPendiente > 5 ? 'Urgente' : 
                       olimpista.diasPendiente > 3 ? 'Prioritario' : 'Normal'}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    Evaluar
                  </Button>
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
                {progressData.niveles.reduce((acc: number, nivel: any) => acc + nivel.total, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Olimpistas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {progressData.niveles.reduce((acc: number, nivel: any) => acc + nivel.evaluados, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Evaluados</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {progressData.niveles.reduce((acc: number, nivel: any) => acc + (nivel.total - nivel.evaluados), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(progressData.niveles.reduce((acc: number, nivel: any) => acc + nivel.porcentaje, 0) / progressData.niveles.length)}%
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
    console.log('🎯 fetchData ejecutándose')
    console.log('🎯 departamentoId:', departamentoId)
    
    if (!departamentoId) {
      console.log('❌ No hay departamentoId, saliendo de fetchData')
      return
    }
    
    console.log('⏳ Iniciando carga de datos...')
    setLoading(true)
    setError("")
    
    try {
      if (SIMULATE) {
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 1000))
        const filteredData = demoCompetidores.filter(c => {
          const departamentoLabel = getDepartamentoName(departamentoId)
          return c.departamento_nombre === departamentoLabel
        })
        setCompetidores(filteredData)
        return
      }
      
      // Obtener datos reales del backend - participantes con evaluaciones
      const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
      
      // Verificar token antes de hacer la petición
      const token = localStorage.getItem('auth_token')
      console.log('🔑 Token en localStorage:', token ? 'Presente' : 'Ausente')
      console.log('🔑 Token completo:', token)
      
      // Obtener participantes con evaluaciones reales del backend
      console.log('🔍 Llamando a la API con parámetros:', {
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
        // Mapear los datos para que coincidan con el formato esperado
        const competidoresMapeados = response.data.participantes.map((participante: any) => ({
          id: participante.inscripcion_area_id,
          nombre_completo: participante.nombre_completo,
          documento_identidad: participante.documento_identidad,
          unidad_educativa_nombre: participante.unidad_educativa_nombre,
          departamento_nombre: participante.departamento_nombre,
          area_nombre: participante.area_nombre,
          nivel_nombre: participante.nivel_nombre,
          puntuacion: participante.puntuacion || 0,
          inscripcion_estado: participante.estado_evaluacion, // Usar estado real de evaluación
          observaciones: participante.observaciones,
          fecha_evaluacion: participante.fecha_evaluacion,
          evaluador_nombre: participante.evaluador_nombre,
          evaluador_email: participante.evaluador_email
        }))
        
        // Filtrar por departamento si está seleccionado
        const filteredData = competidoresMapeados.filter((c: any) => {
          const departamentoLabel = getDepartamentoName(departamentoId)
          return c.departamento_nombre === departamentoLabel
        })
        
        setCompetidores(filteredData)
        console.log('Datos reales cargados:', response.data.estadisticas)
      } else {
        console.error('Error al obtener participantes con evaluaciones:', response.message)
        // Fallback a datos demo filtrados
        const filteredData = demoCompetidores.filter(c => {
          const departamentoLabel = getDepartamentoName(departamentoId)
          return c.departamento_nombre === departamentoLabel
        })
        setCompetidores(filteredData)
      }
    } catch (err: any) {
      console.error('Error cargando datos:', err)
      setError(err.message || "Error al cargar datos")
      // Fallback a datos demo filtrados
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
    console.log('🚀 CompetidoresPorAreaNivel - useEffect inicial ejecutándose')
    console.log('🚀 SIMULATE:', SIMULATE)
    
    // Cargar departamento por defecto; en simulación llena datos demo
    if (SIMULATE) {
      console.log('🎭 Modo simulación activado')
      setDepartamentoId('1') // Cochabamba por defecto
      setCompetidores(demoCompetidores)
      return
    }
    
    console.log('🌐 Modo real - obteniendo perfil del usuario')
    const init = async () => {
      try {
        const me = await AuthService.getProfile()
        console.log('👤 Perfil obtenido:', me)
        const dId = (me as any)?.data?.departamento_id
        console.log('🏢 Departamento ID del perfil:', dId)
        if (dId) {
          setDepartamentoId(String(dId))
          console.log('✅ Departamento establecido:', String(dId))
        } else {
          console.log('⚠️ No se encontró departamento_id en el perfil, usando por defecto')
          setDepartamentoId('1') // Usar Cochabamba por defecto
        }
      } catch (error) {
        console.error('❌ Error obteniendo perfil:', error)
        setDepartamentoId('1') // Usar Cochabamba por defecto
      }
    }
    init()
  }, [])

  useEffect(() => {
    console.log('🔄 CompetidoresPorAreaNivel - useEffect de dependencias ejecutándose')
    console.log('🔄 SIMULATE:', SIMULATE)
    console.log('🔄 departamentoId:', departamentoId)
    console.log('🔄 nivelId:', nivelId)
    
    if (SIMULATE) {
      console.log('🎭 Modo simulación - saltando fetchData')
      return
    }
    
    if (departamentoId) {
      console.log('📡 Llamando a fetchData con departamentoId:', departamentoId)
      fetchData()
    } else {
      console.log('⚠️ No hay departamentoId, no se puede hacer fetchData')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // Filtro por estado si se seleccionó (clasificado, no_clasificado, desclasificado, premiado)
  if (opts.estado) {
    const estadoSel = opts.estado
    rows = rows.filter((c) => String(c.inscripcion_estado || c.estado || '').toLowerCase() === estadoSel)
  }
  // Filtro por departamento si está seleccionado (usa id si existe, si no, compara por nombre)
  if (opts.departamentoId) {
    rows = rows.filter((c) => {
      const departamentoId = String(opts.departamentoId)
      const byId = c.departamento_id || c.departamentoId
      if (byId !== undefined && byId !== null && byId !== '') {
        return String(byId) === departamentoId
      }
      // Fallback por nombre (modo simulación)
      const departamentoLabel = (departamentoId === '1' ? 'Cochabamba' : departamentoId === '2' ? 'La Paz' : departamentoId === '3' ? 'Santa Cruz' : departamentoId === '4' ? 'Oruro' : departamentoId === '5' ? 'Potosí' : departamentoId === '6' ? 'Chuquisaca' : departamentoId === '7' ? 'Tarija' : departamentoId === '8' ? 'Beni' : departamentoId === '9' ? 'Pando' : '')
      return String(c.departamento_nombre || '').toLowerCase() === String(departamentoLabel).toLowerCase()
    })
  }
  // Filtro por nivel si está seleccionado (y distinto de 'all'); usa id si existe, o nombre como fallback
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
function AsignacionUI({ realEvaluators, areaName }: { realEvaluators: any[]; areaName: string }) {
  const [fase, setFase] = useState<'clasificacion'|'premiacion'>('clasificacion')
  const [numEval, setNumEval] = useState<string>('2')
  const [metodo, setMetodo] = useState<'simple'|'balanceado'>('simple')
  const [evitarIE, setEvitarIE] = useState(true)
  const [evitarArea, setEvitarArea] = useState(true)
  const [nivelId, setNivelId] = useState<string|undefined>(undefined)
  const [areaId, setAreaId] = useState<string|undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<any[]>([])

  const generar = async (confirmar: boolean) => {
    if (!areaId) return
    setLoading(true)
    try {
      const res = await CoordinadorService.generarAsignaciones({
        area_id: parseInt(areaId, 10),
        nivel_id: nivelId ? parseInt(nivelId, 10) : undefined,
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
          <div className="text-sm font-medium mb-1">Nivel</div>
          <Select value={nivelId} onValueChange={setNivelId}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Primario</SelectItem>
              <SelectItem value="2">Secundario</SelectItem>
              <SelectItem value="3">Superior</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Fase</div>
          <Select value={fase} onValueChange={(v)=>setFase(v as any)}>
            <SelectTrigger><SelectValue placeholder="Fase" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="clasificacion">Clasificación</SelectItem>
              <SelectItem value="premiacion">Premiación</SelectItem>
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

      {rows.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inscripción</TableHead>
                <TableHead>Evaluadores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={`row-${i}`}>
                  <TableCell className="font-medium">{r.inscripcion_area_id}</TableCell>
                  <TableCell>
                    {(r.evaluadores||[]).map((id: any) => {
                      const ev = realEvaluators.find((e:any) => String(e.id) === String(id))
                      return ev ? (ev.name || ev.nombre) : id
                    }).join(', ')}
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
  const avatarUrl = user?.avatar_url as string | undefined
  const toAbsolute = (p?: string) => p && /^https?:\/\//i.test(p) ? p : (p ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${p}` : undefined)
  const avatarSrc = toAbsolute(avatarUrl)
  const userName: string = user?.name || user?.nombre || ""
  const initials = userName ? userName.split(' ').map((p: string)=>p[0]).slice(0,2).join('').toUpperCase() : 'U'
  const [activeTab, setActiveTab] = useState("overview")
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

  // Coordinator is responsible for "Matemáticas" area
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
            <div className="flex sm:hidden items-center space-x-2">
              <Link href="/coordinador/perfil" className="inline-flex items-center justify-center h-8 w-8 rounded-full overflow-hidden border">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-semibold flex items-center justify-center h-full w-full bg-blue-100 text-blue-700">{initials}</span>
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
                  <span className="text-xs sm:text-sm font-medium text-green-800">
                    Usted está registrado como <strong>Coordinador de Área</strong>
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Coordina el área de {myArea?.name || areaName} y gestiona evaluadores
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 rounded-none border-0 h-auto sm:h-12" style={{backgroundColor: '#1a4e78'}}>
            <TabsTrigger 
              value="overview" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Resumen</span>
              <span className="sm:hidden">Inicio</span>
            </TabsTrigger>
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
              value="evaluations" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              Evaluaciones
            </TabsTrigger>
            <TabsTrigger 
              value="control" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent rounded-none py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Control</span>
              <span className="sm:hidden">Ctrl</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-center py-12 sm:py-16">
              <div className="text-center space-y-4">
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Mensaje Técnico</h3>
                  <p className="text-sm text-gray-600">
                    Sistema operativo • Base de datos conectada • API funcionando correctamente
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Progress Tab - Dashboard de Progreso de Evaluación Clasificatoria */}
          <TabsContent value="progress" className="space-y-4 sm:space-y-6">
            <ProgresoEvaluacionClasificatoria />
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
                    
                    <div className="text-xs text-muted-foreground">
                      💡 Configura el número de evaluadores, método de asignación y restricciones
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-muted-foreground">Módulo en desarrollo - Sprint 3</h3>
              <p className="text-sm text-muted-foreground mt-2">Sistema de gestión de evaluaciones con calificación automática, seguimiento de progreso y generación de reportes de resultados</p>
            </div>
          </TabsContent>

          {/* Control Tab - Solo Auditoría */}
          <TabsContent value="control" className="space-y-6">
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

    </div>
  )
}

