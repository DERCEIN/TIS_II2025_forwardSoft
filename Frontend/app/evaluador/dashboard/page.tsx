"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EvaluacionService, AuthService, ReporteService } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Trophy,
  Users,
  Settings,
  Clock,
  CheckCircle,
  FileText,
  Star,
  Bell,
  LogOut,
  BookOpen,
  Edit3,
  Save,
  Eye,
  Calendar,
  Award,
  Target,
  Search,
  Cog,
  UserCheck,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EvaluatorDashboard() {
  const router = useRouter()
  const { logout: authLogout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true)
  const [evaluationStats, setEvaluationStats] = useState<any>({
    totalAssigned: 0,
    completed: 0,
    pending: 0,
    averageScore: 0
  })
  const [loadingStats, setLoadingStats] = useState<boolean>(true)

  // Evaluator's assigned areas and statistics
  const evaluatorInfo = {
    name: userProfile?.name || userProfile?.nombre || "Cargando...",
    displayName: userProfile?.name || userProfile?.nombre ? `Dr. ${userProfile?.name || userProfile?.nombre}` : "Cargando...",
    areas: userProfile?.areas || [],
    totalAssigned: evaluationStats.totalAssigned,
    completed: evaluationStats.completed,
    pending: evaluationStats.pending,
    averageScore: evaluationStats.averageScore,
  }

  const stats = [
    {
      title: "Evaluaciones Asignadas",
      value: "31",
      change: "+3",
      trend: "up",
      icon: FileText,
      color: "#2563eb",
    },
    {
      title: "Evaluaciones Completadas",
      value: "28",
      change: "+5",
      trend: "up",
      icon: CheckCircle,
      color: "#ec4899",
    },
    {
      title: "Pendientes",
      value: "3",
      change: "-2",
      trend: "down",
      icon: Clock,
      color: "#3b82f6",
    },
    {
      title: "Promedio de Calificación",
      value: "78.5",
      change: "+2.3",
      trend: "up",
      icon: Star,
      color: "#db2777",
    },
  ]

  const assignedParticipants = [
    {
      id: 1,
      name: "Juan Pérez Mamani",
      institution: "Colegio San Simón",
      area: "Matemáticas",
      submissionDate: "2025-03-15",
      status: "pending",
      score: null,
      priority: "high",
    },
    {
      id: 2,
      name: "María González Quispe",
      institution: "U.E. Bolivar",
      area: "Matemáticas",
      submissionDate: "2025-03-14",
      status: "completed",
      score: 85,
      priority: "normal",
    },
    {
      id: 3,
      name: "Carlos López Vargas",
      institution: "Colegio Técnico",
      area: "Física",
      submissionDate: "2025-03-13",
      status: "in-review",
      score: null,
      priority: "normal",
    },
    {
      id: 4,
      name: "Ana Martínez Condori",
      institution: "Colegio Nacional",
      area: "Matemáticas",
      submissionDate: "2025-03-12",
      status: "completed",
      score: 92,
      priority: "normal",
    },
    {
      id: 5,
      name: "Luis Rodríguez Choque",
      institution: "U.E. Central",
      area: "Física",
      submissionDate: "2025-03-11",
      status: "pending",
      score: null,
      priority: "high",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return {backgroundColor: '#fce7f3', color: '#be185d'}
      case "in-review":
        return {backgroundColor: '#dbeafe', color: '#1e40af'}
      case "pending":
        return {backgroundColor: '#dbeafe', color: '#1e40af'}
      default:
        return {backgroundColor: '#f3f4f6', color: '#374151'}
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada"
      case "in-review":
        return "En Revisión"
      case "pending":
        return "Pendiente"
      default:
        return "Desconocido"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return {backgroundColor: '#fce7f3', color: '#be185d'}
      case "normal":
        return {backgroundColor: '#dbeafe', color: '#1e40af'}
      case "low":
        return {backgroundColor: '#f3f4f6', color: '#374151'}
      default:
        return {backgroundColor: '#f3f4f6', color: '#374151'}
    }
  }

  // Obtener perfil del usuario
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true)
        console.log('Obteniendo perfil del evaluador...')
        const response = await AuthService.getProfile()
        console.log('Perfil obtenido:', response)
        
        if (response.success && response.data) {
          const userData = response.data
          // Obtener áreas asignadas
          const areas = userData.areas || []
          setUserProfile({
            ...userData,
            areas: areas
          })
        } else {
          console.error('Error al obtener perfil:', response.message)
        }
      } catch (error: any) {
        console.error('Error al obtener perfil del evaluador:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchUserProfile()
  }, [])

  
  useEffect(() => {
    const fetchEvaluationStats = async () => {
      try {
        setLoadingStats(true)
        console.log('Obteniendo estadísticas reales de evaluaciones...')
        
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/evaluador/estadisticas`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Estadísticas reales obtenidas:', data)
          
          if (data.success && data.data) {
            setEvaluationStats({
              totalAssigned: data.data.total_asignadas || 0,
              completed: data.data.completadas || 0,
              pending: data.data.pendientes || 0,
              averageScore: data.data.promedio_calificacion || 0
            })
          } else {
            console.error('Error en respuesta del backend:', data.message)
            
            setEvaluationStats({
              totalAssigned: 0,
              completed: 0,
              pending: 0,
              averageScore: 0
            })
          }
        } else {
          console.error('Error HTTP:', response.status, response.statusText)
          
          setEvaluationStats({
            totalAssigned: 0,
            completed: 0,
            pending: 0,
            averageScore: 0
          })
        }
      } catch (error: any) {
        console.error('Error al obtener estadísticas reales:', error)
        
        setEvaluationStats({
          totalAssigned: 0,
          completed: 0,
          pending: 0,
          averageScore: 0
        })
      } finally {
        setLoadingStats(false)
      }
    }

    if (userProfile && userProfile.id) {
      fetchEvaluationStats()
    }
  }, [userProfile])

 
  const handleLogout = async () => {
    console.log('=== INICIANDO LOGOUT ===')
    console.log('handleLogout ejecutándose...')
    
    try {
      
      console.log('Llamando a authLogout del contexto...')
      await authLogout()
      
      console.log('Logout del contexto completado')
      
      
      console.log('Sesión cerrada correctamente. Redirigiendo al login...')
      
      console.log('Redirigiendo a login...')
      
      
      window.location.href = '/login'
      
    } catch (error: any) {
      console.error('Error en logout:', error)
      console.log('Error al cerrar sesión, pero limpiando datos...')
      
      
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-blue-100/95" style={{backgroundColor: '#dbeafe'}}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
                <img src="/sansi-logo.png" alt="SanSi Logo" className="h-6 sm:h-8 w-auto" />
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold" style={{color: '#2563eb'}}>SanSi</span>
                  <span className="text-xs hidden sm:block" style={{color: '#3b82f6'}}>Olimpiada de Ciencia y Tecnología</span>
                </div>
              </Link>
              <Badge variant="secondary" className="text-xs hidden md:block" style={{backgroundColor: '#bfdbfe', color: '#1e40af'}}>
                Evaluador - {evaluatorInfo.areas.length > 0 ? evaluatorInfo.areas.join(", ") : "Cargando áreas..."}
              </Badge>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <Button variant="outline" size="sm" className="hidden lg:flex" style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}>
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex" style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}>
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Configuración</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Botón Salir clickeado!')
                  handleLogout()
                }}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center space-x-2">
              <Button variant="outline" size="sm" style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}>
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Botón Salir clickeado!')
                  handleLogout()
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
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">Panel de Evaluación</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {evaluatorInfo.areas.length > 0 
                  ? `Evalúa participantes en ${evaluatorInfo.areas.join(" y ")}` 
                  : "Cargando información de áreas..."
                }
              </p>
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-purple-800">
                    Usted está registrado como <strong>Evaluador</strong>
                  </span>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Evalúa participantes en {evaluatorInfo.areas.length > 0 ? evaluatorInfo.areas.join(" y ") : "sus áreas asignadas"}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button className="w-full sm:w-auto" style={{backgroundColor: '#2563eb', color: 'white'}}>
                <Edit3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Iniciar Evaluación</span>
                <span className="sm:hidden">Evaluar</span>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" style={{backgroundColor: '#ec4899', color: 'white', borderColor: '#ec4899'}}>
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Mi Calendario</span>
                <span className="sm:hidden">Calendario</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Evaluator Overview Card */}
        <Card className="mb-6 sm:mb-8 border-blue-200" style={{background: 'linear-gradient(to right, #eff6ff, #fce7f3)', borderColor: '#bfdbfe'}}>
          <CardContent className="p-4 sm:p-6">
            {loadingProfile || loadingStats ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando información del evaluador...</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-heading font-bold mb-2" style={{color: '#1e40af'}}>{evaluatorInfo.displayName}</h2>
                  <p className="mb-4 text-sm sm:text-base" style={{color: '#2563eb'}}>
                    {evaluatorInfo.areas.length > 0 
                      ? `Evaluador de ${evaluatorInfo.areas.join(" y ")}` 
                      : "Sin áreas asignadas"
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm" style={{color: '#1d4ed8'}}>
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span>{evaluatorInfo.totalAssigned} asignadas</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{evaluatorInfo.completed} completadas</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Star className="h-4 w-4 flex-shrink-0" />
                      <span>Promedio: {evaluatorInfo.averageScore.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-2">
                  <div className="text-center lg:text-right">
                    <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" style={{color: '#2563eb'}}>
                      {evaluatorInfo.totalAssigned > 0 ? Math.round((evaluatorInfo.completed / evaluatorInfo.totalAssigned) * 100) : 0}%
                    </div>
                    <p className="text-xs sm:text-sm mb-2 sm:mb-3" style={{color: '#2563eb'}}>Progreso completado</p>
                  </div>
                  <Progress 
                    value={evaluatorInfo.totalAssigned > 0 ? (evaluatorInfo.completed / evaluatorInfo.totalAssigned) * 100 : 0} 
                    className="w-24 sm:w-32 lg:w-32" 
                    style={{backgroundColor: '#bfdbfe'}} 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-none border-0 h-auto sm:h-12" style={{backgroundColor: '#1a4e78'}}>
            <TabsTrigger 
              value="overview" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Resumen</span>
              <span className="sm:hidden">Inicio</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              Pendientes
            </TabsTrigger>
            <TabsTrigger 
              value="evaluate" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r sm:border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              Evaluar
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent rounded-none py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Completadas</span>
              <span className="sm:hidden">Hechas</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="text-center py-8 sm:py-12 px-4">
              <h3 className="text-base sm:text-lg font-semibold text-muted-foreground">Módulo en desarrollo - Sprint 3</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Sistema de resumen de evaluaciones con métricas de rendimiento y análisis estadístico</p>
            </div>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4 sm:space-y-6">
            <div className="text-center py-8 sm:py-12 px-4">
              <h3 className="text-base sm:text-lg font-semibold text-muted-foreground">Módulo en desarrollo - Sprint 3</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Sistema de gestión de evaluaciones pendientes con filtros avanzados y asignación automática</p>
            </div>
          </TabsContent>

          {/* Evaluate Tab */}
          <TabsContent value="evaluate" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Centro de Evaluación</CardTitle>
                <CardDescription className="text-sm">Evalúa el trabajo de los participantes</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {selectedParticipant ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Participant Info */}
                    <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">
                        {assignedParticipants.find((p) => p.id === selectedParticipant)?.name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                        <span>{assignedParticipants.find((p) => p.id === selectedParticipant)?.institution}</span>
                        <span>Área: {assignedParticipants.find((p) => p.id === selectedParticipant)?.area}</span>
                      </div>
                    </div>

                    {/* Evaluation Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="score" className="text-sm">Puntuación (0-100)</Label>
                          <Input id="score" type="number" min="0" max="100" placeholder="85" className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="category" className="text-sm">Categoría</Label>
                          <Input id="category" placeholder="Excelente" className="mt-1" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="feedback" className="text-sm">Retroalimentación</Label>
                        <Textarea
                          id="feedback"
                          placeholder="Proporciona comentarios detallados sobre el desempeño del participante..."
                          rows={4}
                          className="mt-1 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="recommendations" className="text-sm">Recomendaciones</Label>
                        <Textarea
                          id="recommendations"
                          placeholder="Sugerencias para mejorar o áreas de fortaleza..."
                          rows={3}
                          className="mt-1 text-sm"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="flex-1 w-full sm:w-auto" style={{backgroundColor: '#ec4899', color: 'white'}}>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Evaluación
                        </Button>
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedParticipant(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Selecciona un Participante</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Elige un participante de la lista de pendientes para comenzar la evaluación
                    </p>
                    <Button onClick={() => setActiveTab("pending")} className="w-full sm:w-auto" style={{backgroundColor: '#2563eb', color: 'white'}}>
                      <Users className="h-4 w-4 mr-2" />
                      Ver Pendientes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-4 sm:space-y-6">
            <div className="text-center py-8 sm:py-12 px-4">
              <h3 className="text-base sm:text-lg font-semibold text-muted-foreground">Módulo en desarrollo - Sprint 3</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Sistema de historial de evaluaciones con análisis de tendencias y reportes detallados</p>
            </div>
          </TabsContent>

      {/* Listado por Área y Nivel */}
      <TabsContent value="evaluate" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Competidores por Área y Nivel</CardTitle>
            <CardDescription className="text-sm">Filtra y visualiza con nombre, categoría, puntaje y estado</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <EvaluacionesPorAreaNivel />
          </CardContent>
        </Card>
      </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function EvaluacionesPorAreaNivel() {
  const [areaId, setAreaId] = useState<string | undefined>(undefined)
  const [nivelId, setNivelId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [filas, setFilas] = useState<any[]>([])
  const [search, setSearch] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("nombre")
  const [estado, setEstado] = useState<string | undefined>(undefined)

  // Datos de ejemplo para mostrar UI cuando no hay resultados aún
  const demoFilas: any[] = [
    {
      id: 1001,
      olimpista_nombre: "Ana Martínez Condori",
      olimpista_documento: "44332211",
      unidad_educativa_nombre: "Colegio Nacional",
      area_nombre: "Matemáticas",
      nivel_nombre: "Superior",
      puntuacion: 95.5,
      estado: "clasificado",
    },
    {
      id: 1002,
      olimpista_nombre: "Carlos López Vargas",
      olimpista_documento: "11223344",
      unidad_educativa_nombre: "Colegio Técnico",
      area_nombre: "Física",
      nivel_nombre: "Primario",
      puntuacion: 65.0,
      estado: "no_clasificado",
    },
    {
      id: 1003,
      olimpista_nombre: "Juan Pérez Mamani",
      olimpista_documento: "12345678",
      unidad_educativa_nombre: "Colegio San Simón",
      area_nombre: "Matemáticas",
      nivel_nombre: "Primario",
      puntuacion: 85.5,
      estado: "clasificado",
    },
  ]

  const SIMULATE = true

  const handleExportPDF = () => {
    if (!areaId) return
    window.print()
  }

  const handleExportClasificados = async () => {
    if (!areaId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    await ReporteService.exportarResultados({ area_id: parseInt(areaId, 10), nivel_id: nivelParam, fase: 'clasificacion' })
  }

  const handleExportPremiados = async () => {
    if (!areaId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    await ReporteService.exportarResultados({ area_id: parseInt(areaId, 10), nivel_id: nivelParam, fase: 'premiacion' })
  }

  const handleExportNoClasificados = async () => {
    if (!areaId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    await ReporteService.exportarResultados({ area_id: parseInt(areaId, 10), nivel_id: nivelParam, fase: 'no_clasificado' })
  }

  const handleExportDesclasificados = async () => {
    if (!areaId) return
    const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
    await ReporteService.exportarResultados({ area_id: parseInt(areaId, 10), nivel_id: nivelParam, fase: 'desclasificado' })
  }

  const fetchData = async () => {
    if (!areaId) return
    setLoading(true)
    setError("")
    try {
      const nivelParam = nivelId && nivelId !== 'all' ? parseInt(nivelId, 10) : undefined
      const res = await EvaluacionService.getEvaluacionesByArea(parseInt(areaId, 10), nivelParam)
      const data = (res && (res as any).data) ? (res as any).data : []
      setFilas(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Error al cargar evaluaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (SIMULATE) {
      setAreaId('1')
      setFilas(demoFilas)
      return
    }
    const init = async () => {
      try {
        const me = await AuthService.getProfile()
        const aId = (me as any)?.data?.area_id
        if (aId) setAreaId(String(aId))
      } catch {}
    }
    init()
  }, [])

  useEffect(() => {
    if (SIMULATE) return
    if (areaId) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, nivelId, sortBy, estado])

  return (
    <div className="space-y-4">
      {/* Toolbar superior */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 sm:justify-between">
        <div className="font-semibold text-foreground text-sm sm:text-base">Competidores por Área y Nivel</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => exportCSV('evaluaciones', applyClientFilters(filas as any[], { search, sortBy }))} disabled={loading || filas.length === 0}>
            <span className="hidden sm:inline">Exportar </span>CSV
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={handleExportPDF}>
            <span className="hidden sm:inline">Exportar </span>PDF
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm" size="sm" onClick={handleExportClasificados}>
            <span className="hidden sm:inline">Lista </span>Clasificados
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-xs sm:text-sm" size="sm" onClick={handleExportPremiados}>
            <span className="hidden sm:inline">Lista </span>Premiados
          </Button>
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
          <Select value={areaId} onValueChange={setAreaId}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Selecciona un área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Matemáticas</SelectItem>
              <SelectItem value="2">Física</SelectItem>
              <SelectItem value="3">Química</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={nivelId} onValueChange={setNivelId}>
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
          
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="clasificado">Clasificado</SelectItem>
              <SelectItem value="no_clasificado">No clasificado</SelectItem>
              <SelectItem value="desclasificado">Desclasificado</SelectItem>
              <SelectItem value="premiado">Premiado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Ordenamiento y acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Ordenar por:</span>
            <Button variant={sortBy === 'nombre' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy('nombre')}>Nombre</Button>
            <Button variant={sortBy === 'puntaje' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy('puntaje')}>Puntuación</Button>
            <Button variant={sortBy === 'area' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy('area')}>Área</Button>
            <Button variant={sortBy === 'nivel' ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy('nivel')}>Nivel</Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchData} disabled={!areaId || loading} size="sm" className="text-xs">
              {loading ? "Cargando..." : "Buscar"}
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => exportCSV('evaluaciones', applyClientFilters(filas as any[], { search, sortBy }))} disabled={loading || filas.length === 0}>
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setSearch(''); setAreaId(undefined); setNivelId(undefined); setEstado(undefined); setSortBy('nombre') }}>Limpiar</Button>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Tabla - Solo visible en pantallas medianas y grandes */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm">Nombre</TableHead>
              <TableHead className="text-xs sm:text-sm">Categoría</TableHead>
              <TableHead className="text-xs sm:text-sm">Área</TableHead>
              <TableHead className="text-xs sm:text-sm">Nivel</TableHead>
              <TableHead className="text-xs sm:text-sm">Puntaje</TableHead>
              <TableHead className="text-xs sm:text-sm">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applyClientFilters(filas.length ? filas : demoFilas, { search, sortBy }).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground text-sm">Sin datos</TableCell>
              </TableRow>
            ) : (
              applyClientFilters(filas.length ? filas : demoFilas, { search, sortBy }).map((c) => (
                <TableRow key={c.id || c.inscripcion_area_id}>
                  <TableCell className="text-xs sm:text-sm">{c.olimpista_nombre || c.nombre_completo}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{c.categoria || c.nombre_categoria || "-"}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{c.area_nombre || "-"}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{c.nivel_nombre || "-"}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{c.puntuacion || c.puntuacion_final || "-"}</TableCell>
                  <TableCell>
                    <Badge className="bg-gray-100 text-gray-800 text-xs">{c.estado || c.inscripcion_estado || "-"}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista de tarjetas para móviles - Solo visible en pantallas pequeñas */}
      <div className="md:hidden space-y-3">
        {applyClientFilters(filas.length ? filas : demoFilas, { search, sortBy }).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Sin datos</div>
        ) : (
          applyClientFilters(filas.length ? filas : demoFilas, { search, sortBy }).map((c) => (
            <div key={`mobile-card-${c.id || c.inscripcion_area_id}`} className="p-3 border rounded-md bg-background">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground text-sm mb-1 truncate">
                      {c.olimpista_nombre || c.nombre_completo}
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                      {(c.estado || c.inscripcion_estado || 'Desconocido').toString()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="text-xs px-2 py-1">Ver</Button>
                    <Button variant="outline" size="sm" className="text-xs px-2 py-1">⋯</Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Documento:</span> 
                    <span>{c.olimpista_documento || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Institución:</span> 
                    <span className="truncate ml-2">{c.unidad_educativa_nombre || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Área:</span> 
                    <span>{c.area_nombre || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Nivel:</span> 
                    <span>{c.nivel_nombre || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Puntuación:</span> 
                    <span className="font-semibold">{Number(c.puntuacion ?? c.puntuacion_final ?? 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vista de tarjetas expandida para tablets y desktop */}
      <div className="hidden md:block space-y-3">
        {applyClientFilters(filas.length ? filas : demoFilas, { search, sortBy }).map((c) => (
          <div key={`desktop-card-${c.id || c.inscripcion_area_id}`} className="p-4 border rounded-md bg-background">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="font-semibold text-foreground truncate text-sm lg:text-base">{c.olimpista_nombre || c.nombre_completo}</div>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">{(c.estado || c.inscripcion_estado || 'Desconocido').toString()}</Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-xs lg:text-sm text-muted-foreground">
                  <div><span className="font-medium text-foreground">Documento:</span> {c.olimpista_documento || '—'}</div>
                  <div><span className="font-medium text-foreground">Institución:</span> {c.unidad_educativa_nombre || '—'}</div>
                  <div className="flex flex-col lg:flex-row lg:gap-6">
                    <span><span className="font-medium text-foreground">Área:</span> {c.area_nombre || '—'}</span>
                    <span><span className="font-medium text-foreground">Nivel:</span> {c.nivel_nombre || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-2 text-xs lg:text-sm">
                  <span className="flex items-center gap-1"><span className="font-medium text-foreground">Puntuación:</span> {Number(c.puntuacion ?? c.puntuacion_final ?? 0).toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs">Ver</Button>
                <Button variant="outline" size="sm" className="text-xs">⋯</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function applyClientFilters(data: any[], opts: { search: string; sortBy: string }) {
  const text = opts.search.trim().toLowerCase()
  let rows = data
  if (text) {
    rows = rows.filter((c) => {
      const haystack = [
        c.olimpista_nombre || c.nombre_completo || "",
        c.olimpista_documento || c.documento_identidad || "",
        c.unidad_educativa_nombre || c.institucion || "",
      ].join(" ").toLowerCase()
      return haystack.includes(text)
    })
  }
  switch (opts.sortBy) {
    case "puntaje":
      rows = [...rows].sort((a, b) => (Number(b.puntuacion ?? b.puntuacion_final ?? 0) - Number(a.puntuacion ?? a.puntuacion_final ?? 0)))
      break
    case "area":
      rows = [...rows].sort((a, b) => String(a.area_nombre || "").localeCompare(String(b.area_nombre || "")))
      break
    case "nivel":
      rows = [...rows].sort((a, b) => String(a.nivel_nombre || "").localeCompare(String(b.nivel_nombre || "")))
      break
    case "estado":
      rows = [...rows].sort((a, b) => String(a.estado || a.inscripcion_estado || "").localeCompare(String(b.estado || b.inscripcion_estado || "")))
      break
    default:
      rows = [...rows].sort((a, b) => String(a.olimpista_nombre || a.nombre_completo || "").localeCompare(String(b.olimpista_nombre || b.nombre_completo || "")))
  }
  return rows
}

function exportCSV(prefix: string, data: any[]) {
  const headers = ["Nombre", "Categoría", "Área", "Nivel", "Puntaje", "Estado"]
  const rows: string[] = [headers.join(',')]
  ;(data as any[] || []).forEach((c: any) => {
    const row = [
      c.olimpista_nombre || c.nombre_completo || '',
      c.categoria || c.nombre_categoria || '-',
      c.area_nombre || '-',
      c.nivel_nombre || '-',
      String(c.puntuacion ?? c.puntuacion_final ?? ''),
      c.estado || c.inscripcion_estado || '-',
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
