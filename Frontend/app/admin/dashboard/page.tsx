"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Users,
  FileText,
  Settings,
  BarChart3,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Bell,
  LogOut,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { AdminService, ApiService, OlimpistaService } from "@/lib/api"

// Importar la URL base para logs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [recentInscriptions, setRecentInscriptions] = useState<any[]>([])
  const [loadingInscriptions, setLoadingInscriptions] = useState(false)
  const [inscriptionStats, setInscriptionStats] = useState({
    total: 0,
    confirmadas: 0,
    pendientes: 0
  })
  const [loadingStats, setLoadingStats] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [areas, setAreas] = useState<any[]>([])
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
  const router = useRouter()
  const { toast } = useToast()
  const { logout } = useAuth()
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)

  // Función para obtener olimpistas recientes
  const fetchRecentInscriptions = async () => {
    setLoadingInscriptions(true)
    try {
      const response = await OlimpistaService.getAll()
      if (response.success && response.data) {
        // Obtener los 5 olimpistas más recientes
        const recentOlimpistas = response.data
          .sort((a: any, b: any) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime())
          .slice(0, 5)
        setRecentInscriptions(recentOlimpistas)
      } else {
        console.error('Error al obtener olimpistas:', response.message)
        setRecentInscriptions([])
      }
    } catch (error) {
      console.error('Error al obtener olimpistas:', error)
      setRecentInscriptions([])
    } finally {
      setLoadingInscriptions(false)
    }
  }

  // Función para obtener estadísticas de inscripciones
  const fetchInscriptionStats = async () => {
    setLoadingStats(true)
    try {
      const response = await OlimpistaService.getAll()
      if (response.success && response.data) {
        const olimpistas = response.data
        const stats = {
          total: olimpistas.length,
          confirmadas: olimpistas.filter((o: any) => o.estado === 'activo').length,
          pendientes: olimpistas.filter((o: any) => o.estado === 'pendiente').length
        }
        setInscriptionStats(stats)
      } else {
        console.error('Error al obtener estadísticas:', response.message)
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Función para obtener usuarios registrados
  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      console.log('=== INICIANDO FETCH USERS ===')
      const token = ApiService.getToken()
      console.log('Token actual:', token)
      console.log('Token length:', token ? token.length : 'null')
      
      if (!token) {
        console.error('No hay token de autenticación')
        setUsers([])
        return
      }
      
      // Probar primero con el endpoint de admin
      console.log('Intentando con /api/admin/users...')
      console.log('URL completa:', API_BASE_URL + '/api/admin/users')
      let response = await ApiService.get('/api/admin/users')
      console.log('Respuesta admin/users:', response)
      
      // Si falla, probar con el endpoint general
      if (!response.success) {
        console.log('Probando con /api/users...')
        console.log('URL completa:', API_BASE_URL + '/api/users')
        response = await ApiService.get('/api/users')
        console.log('Respuesta users:', response)
      }
      
      if (response.success && response.data) {
        setUsers(response.data)
        setCurrentPage(1) // Resetear a la primera página cuando se cargan nuevos usuarios
        console.log('Usuarios cargados:', response.data)
        console.log('Número de usuarios:', response.data.length)
      } else {
        console.error('Error al obtener usuarios:', response.message)
        console.error('Response completa:', response)
        setUsers([])
      }
      console.log('=== FIN FETCH USERS ===')
    } catch (error: any) {
      console.error('Error al obtener usuarios:', error)
      console.error('Tipo de error:', typeof error)
      console.error('Mensaje de error:', error.message)
      console.error('Stack trace:', error.stack)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  // Función para verificar el estado del backend
  const checkBackendHealth = async () => {
    try {
      console.log('Verificando estado del backend...')
      const response = await ApiService.get('/api/health')
      console.log('Estado del backend:', response)
    } catch (error: any) {
      console.error('Backend no disponible:', error)
      console.error('Detalles del error:', error.message)
      console.error('URL intentada:', API_BASE_URL + '/api/health')
      console.error('Error completo:', error)
    }
  }

  // Función para obtener áreas de competencia
  const fetchAreas = async () => {
    setLoadingAreas(true)
    try {
      console.log('Obteniendo áreas de competencia...')
      const response = await ApiService.get('/api/areas-competencia')
      console.log('Respuesta áreas:', response)
      if (response.success && response.data) {
        setAreas(response.data)
        console.log('Áreas cargadas:', response.data)
      } else {
        console.error('Error al obtener áreas:', response.message)
        setAreas([])
      }
    } catch (error: any) {
      console.error('Error al obtener áreas:', error)
      setAreas([])
    } finally {
      setLoadingAreas(false)
    }
  }

  // Funciones de paginación
  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage
    const endIndex = startIndex + usersPerPage
    return users.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(users.length / usersPerPage)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('Iniciando carga de datos...')
    checkBackendHealth()
    fetchRecentInscriptions()
    fetchInscriptionStats()
    fetchUsers()
    fetchAreas()
  }, [])

  
  const [userFirstName, setUserFirstName] = useState("")
  const [userLastName, setUserLastName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [userRole, setUserRole] = useState("") // admin | coordinador | evaluador
  const [userArea, setUserArea] = useState("")
  const [userInstitution, setUserInstitution] = useState("")
  const [userExperience, setUserExperience] = useState("")
  const [createdUser, setCreatedUser] = useState<{email: string, password: string} | null>(null)

  const validateNewUserForm = () => {
    if (!userFirstName.trim() || !userLastName.trim()) {
      toast({ title: "Nombre requerido", description: "Ingrese nombres y apellidos." })
      return false
    }
    if (!userEmail.trim()) {
      toast({ title: "Email requerido", description: "Ingrese un correo válido.", variant: "destructive" })
      return false
    }
    
    if (!/\S+@\S+\.\S+/.test(userEmail)) {
      toast({ title: "Email inválido", description: "Revise el formato del correo.", variant: "destructive" })
      return false
    }
    if (!userRole) {
      toast({ title: "Rol requerido", description: "Seleccione un rol.", variant: "destructive" })
      return false
    }
    return true
  }

  const handleRegisterUser = async () => {
    const token = ApiService.getToken()
    if (!token) {
      toast({ title: "Sesión requerida", description: "Inicie sesión como administrador.", variant: "destructive" })
      return
    }
    if (!validateNewUserForm()) return
    setIsSubmittingUser(true)
    try {
      
      const roleMap: Record<string, string> = {
        admin: "admin",
        coordinator: "coordinador",
        evaluador: "evaluador",
        evaluator: "evaluador",
      }
      const mappedRole = roleMap[userRole] || userRole

      const name = `${userFirstName.trim()} ${userLastName.trim()}`.trim()
      const payload: { name: string; email: string; role: string; area_id?: number; area?: string } = {
        name,
        email: userEmail.trim(),
        role: mappedRole,
      }

      
      if (mappedRole === 'evaluador' || mappedRole === 'coordinador') {
        if (userArea) {
          
          const selectedArea = areas.find(area => area.nombre === userArea)
          if (selectedArea) {
            payload.area_id = selectedArea.id
            payload.area = selectedArea.nombre
          }
        }
      }
      

      const res = await AdminService.createUser(payload)
      if (res.success) {
        const createdEmail = res.data?.user?.email || userEmail
        const credentialsSent = !!res.data?.credentials_sent
        const tempPass = res.data?.temporary_password as string | undefined


        if (tempPass) {
          setCreatedUser({ email: createdEmail, password: tempPass })
        }

        if (credentialsSent) {
          toast({
            title: "Usuario registrado",
            description: `Se creó ${createdEmail}. Se enviaron credenciales por email.`,
          })
        } else {
          toast({
            title: "Usuario creado (correo no enviado)",
            description: tempPass ? `Contraseña temporal: ${tempPass}` : `No se pudo enviar el correo.`,
            variant: "destructive",
          })
        }
        
        setUserFirstName("")
        setUserLastName("")
        setUserEmail("")
        setUserPhone("")
        setUserRole("")
        setUserArea("")
        setUserInstitution("")
        setUserExperience("")
        setCreatedUser(null)
        
       
        fetchUsers()
      } else {
        toast({ title: "No se pudo registrar", description: res.message || "Intentelo nuevamente.", variant: "destructive" })
      }
    } catch (error: any) {
      const message: string = error?.message || "Error inesperado."
      if (message.startsWith("401:")) {
        toast({ title: "No autorizado", description: "Su sesión expiró o no es admin.", variant: "destructive" })
      } else if (message.startsWith("403:")) {
        toast({ title: "Prohibido", description: "Requiere permisos de administrador.", variant: "destructive" })
      } else if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        toast({ title: "Servidor inaccesible", description: "Verifique NEXT_PUBLIC_API_URL y CORS.", variant: "destructive" })
      } else {
        toast({ title: "Error al registrar", description: message, variant: "destructive" })
      }
    } finally {
      setIsSubmittingUser(false)
    }
  }

  const stats = [
    {
      title: "Total Inscripciones",
      value: "1,247",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Áreas Activas",
      value: "6",
      change: "+1",
      trend: "up",
      icon: Trophy,
      color: "text-green-600",
    },
    {
      title: "Evaluadores",
      value: "34",
      change: "+3",
      trend: "up",
      icon: UserCheck,
      color: "text-purple-600",
    },
    {
      title: "Pendientes",
      value: "89",
      change: "-5%",
      trend: "down",
      icon: Clock,
      color: "text-orange-600",
    },
  ]

  const recentActivities = [
    {
      id: 1,
      type: "inscription",
      message: "Nueva inscripción de María González en Matemáticas",
      time: "Hace 5 min",
      status: "pending",
    },
    {
      id: 2,
      type: "evaluation",
      message: "Evaluación completada por Dr. Pérez en Física",
      time: "Hace 15 min",
      status: "completed",
    },
    {
      id: 3,
      type: "system",
      message: "Importación CSV completada: 45 nuevos registros",
      time: "Hace 1 hora",
      status: "success",
    },
    {
      id: 4,
      type: "alert",
      message: "Alerta: Capacidad máxima alcanzada en Química",
      time: "Hace 2 horas",
      status: "warning",
    },
  ]

  const competitionAreas = [
    { name: "Matemáticas", participants: 245, capacity: 300, evaluators: 8, status: "active" },
    { name: "Física", participants: 198, capacity: 250, evaluators: 6, status: "active" },
    { name: "Química", participants: 167, capacity: 200, evaluators: 5, status: "full" },
    { name: "Biología", participants: 134, capacity: 180, evaluators: 4, status: "active" },
    { name: "Informática", participants: 103, capacity: 150, evaluators: 3, status: "active" },
    { name: "Robótica", participants: 89, capacity: 120, evaluators: 2, status: "active" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "full":
        return "bg-red-100 text-red-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/sansi-logo.png" alt="SanSi Logo" className="h-8 w-auto" />
                <span className="text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
              </Link>
              <Badge variant="secondary" className="text-xs">
                Panel de Administración
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/admin/configuracion')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await logout()
                  } catch (e) {
                  } finally {
                    router.push('/login')
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Panel de Administración</h1>
              <p className="text-muted-foreground">Gestiona todos los aspectos de la Olimpiada Oh! SanSi</p>
            </div>
            <div className="flex gap-3">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Área
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
            </div>
          </div>
        </div>


        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-none border-0 h-12" style={{backgroundColor: '#1a4e78'}}>
            <TabsTrigger 
              value="overview" 
              className="text-white uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="areas" 
              className="text-white uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none"
            >
              Áreas
            </TabsTrigger>
            <TabsTrigger 
              value="participants" 
              className="text-white uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none"
            >
              Participantes
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="text-white uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none"
            >
              Usuarios
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="text-white uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent rounded-none"
            >
              Reportes
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-muted-foreground">Módulo en desarrollo - Sprint 2</h3>
              <p className="text-sm text-muted-foreground mt-2">Dashboard de resumen con métricas y KPIs del sistema</p>
            </div>
          </TabsContent>

          {/* Areas Tab */}
          <TabsContent value="areas" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-muted-foreground">Módulo en desarrollo - Sprint 2</h3>
              <p className="text-sm text-muted-foreground mt-2">CRUD de áreas de competencia con configuración de niveles y capacidades</p>
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle></CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/admin/olimpistas')}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Ver Olimpistas
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/admin/importar')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Inscriptions Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-center gap-3">
                        <Clock className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold text-blue-700">
                            {loadingStats ? '...' : inscriptionStats.pendientes}
                          </div>
                          <div className="text-sm text-blue-600">Pendientes Verificación</div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 bg-green-50 border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold text-green-700">
                            {loadingStats ? '...' : inscriptionStats.confirmadas}
                          </div>
                          <div className="text-sm text-green-600">Confirmadas</div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 bg-orange-50 border-orange-200">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-orange-600" />
                        <div>
                          <div className="text-2xl font-bold text-orange-700">
                            {loadingStats ? '...' : inscriptionStats.total}
                          </div>
                          <div className="text-sm text-orange-600">Total Inscripciones</div>
                        </div>
                      </div>
                    </Card>
                  </div>


                  {/* Recent Inscriptions */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Inscripciones Recientes</h3>
                    <div className="space-y-3">
                      {loadingInscriptions ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Cargando olimpistas recientes...</p>
                        </div>
                      ) : recentInscriptions.length > 0 ? (
                        recentInscriptions.map((olimpista, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{olimpista.nombre} {olimpista.apellido}</p>
                              <p className="text-sm text-muted-foreground">
                                {olimpista.area_competencia} • {new Date(olimpista.fecha_registro).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              className={
                                olimpista.estado === "activo"
                                  ? "bg-green-100 text-green-800"
                                  : olimpista.estado === "pendiente"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {olimpista.estado}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No hay inscripciones recientes</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle></CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Usuario
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* User Registration Form */}
                  <Card className="p-6 bg-muted/30">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Registrar Nuevo Usuario</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Nombres</label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Nombres completos"
                            value={userFirstName}
                            onChange={(e) => setUserFirstName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Apellidos</label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Apellidos completos"
                            value={userLastName}
                            onChange={(e) => setUserLastName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Email</label>
                          <input
                            type="email"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="correo@ejemplo.com"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Teléfono</label>
                          <input
                            type="tel"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="+591 XXXXXXXX"
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Rol del Usuario</label>
                          <select
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            value={userRole}
                            onChange={(e) => setUserRole(e.target.value)}
                          >
                            <option value="">Seleccionar rol</option>
                            <option value="coordinator">Coordinador de Área</option>
                            <option value="evaluator">Evaluador</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Área de Especialidad</label>
                          <select
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            value={userArea}
                            onChange={(e) => setUserArea(e.target.value)}
                            disabled={loadingAreas}
                          >
                            <option value="">Seleccionar área</option>
                            {areas.map((area) => (
                              <option key={area.id} value={area.nombre}>
                                {area.nombre}
                              </option>
                            ))}
                          </select>
                          {loadingAreas && (
                            <p className="text-xs text-muted-foreground mt-1">Cargando áreas...</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Institución</label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Universidad/Institución"
                            value={userInstitution}
                            onChange={(e) => setUserInstitution(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Nivel de Experiencia</label>
                          <select
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            value={userExperience}
                            onChange={(e) => setUserExperience(e.target.value)}
                          >
                            <option value="">Seleccionar nivel</option>
                            <option value="junior">Junior (1-3 años)</option>
                            <option value="senior">Senior (4-8 años)</option>
                            <option value="expert">Experto (8+ años)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button className="flex-1" onClick={handleRegisterUser} disabled={isSubmittingUser}>
                        <Plus className="h-4 w-4 mr-2" />
                        {isSubmittingUser ? "Registrando..." : "Registrar Usuario"}
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => {
                          setUserFirstName("")
                          setUserLastName("")
                          setUserEmail("")
                          setUserPhone("")
                          setUserRole("")
                          setUserArea("")
                          setUserInstitution("")
                          setUserExperience("")
                          setCreatedUser(null)
                        }}
                      >
                        Limpiar Formulario
                      </Button>
                    </div>
                    {createdUser && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">✅ Usuario Creado Exitosamente</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Email:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{createdUser.email}</code></div>
                          <div><strong>Contraseña temporal:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{createdUser.password}</code></div>
                          <div><strong>Rol:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{userRole === 'coordinator' ? 'Coordinador' : 'Evaluador'}</code></div>
                        </div>
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs text-yellow-700">
                            <strong>⚠️ Importante:</strong> Para iniciar sesión, el usuario debe:
                            <br />1. Ir a la página de login
                            <br />2. Seleccionar el rol: <strong>{userRole === 'coordinator' ? 'Coordinador de Área' : 'Evaluador'}</strong>
                            <br />3. Usar el email y contraseña mostrados arriba
                          </p>
                        </div>
                        <p className="text-xs text-green-600 mt-2">
                          Copia estas credenciales y entrégalas al usuario manualmente.
                        </p>
                      </div>
                    )}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Nota:</strong> Las credenciales de acceso se generarán automáticamente y se enviarán por
                        email al usuario registrado.
                      </p>
                    </div>
                  </Card>

                  {/* Current Users List */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Usuarios Registrados</h3>
                    
                    {loadingUsers ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Cargando usuarios...</p>
                      </div>
                    ) : users.length > 0 ? (
                      <div className="overflow-hidden border border-gray-200 rounded-lg">
                        {/* Header de la tabla */}
                        <div className="bg-blue-600 text-white font-semibold">
                          <div className="grid grid-cols-4 gap-4 px-4 py-3">
                            <div>NOMBRE</div>
                            <div>EMAIL</div>
                            <div>ROL</div>
                            <div>ESTADO</div>
                          </div>
                        </div>
                        
                        {/* Filas de datos */}
                        <div className="bg-white">
                          {getCurrentPageUsers().map((user, index) => (
                            <div
                              key={index}
                              className={`grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-100 ${
                                index === getCurrentPageUsers().length - 1 ? 'border-b-0' : ''
                              }`}
                            >
                              <div className="font-medium text-gray-900">
                                {user.name || user.nombre}
                              </div>
                              <div className="text-gray-700">
                                {user.email}
                              </div>
                              <div className="text-gray-700">
                                {user.role || user.rol}
                              </div>
                              <div className="text-gray-700">
                                {user.status === "active" || user.estado === "activo" ? "Activo" : "Pendiente"}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Controles de paginación */}
                        {users.length > usersPerPage && (
                          <div className="flex items-center justify-center space-x-4 py-4 bg-gray-50 border-t border-gray-200">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePreviousPage}
                              disabled={currentPage === 1}
                              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                            >
                              ANTERIOR
                            </Button>
                            
                            <span className="text-sm text-gray-600">
                              Página {currentPage} de {getTotalPages()}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextPage}
                              disabled={currentPage === getTotalPages()}
                              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                            >
                              SIGUIENTE
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No hay usuarios registrados</p>
                      </div>
                    )}
                  </Card>

                  {/* Evaluator Assignment */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Asignación de Evaluadores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-foreground mb-3">Por Área de Competencia</h4>
                        <div className="space-y-3">
                          {loadingAreas ? (
                            <div className="text-center py-4">
                              <p className="text-muted-foreground">Cargando áreas...</p>
                            </div>
                          ) : areas.length > 0 ? (
                            areas.map((area, index) => {
                              // Contar evaluadores por área
                              const evaluatorsInArea = users.filter(user => 
                                (user.role === 'evaluador' || user.rol === 'evaluador') && 
                                (user.area === area.nombre || user.area_competencia === area.nombre)
                              ).length
                              
                              return (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div>
                                    <p className="font-medium text-foreground">{area.nombre}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {evaluatorsInArea} evaluadores asignados
                                    </p>
                                  </div>
                                  <Button variant="outline" size="sm" className="bg-transparent">
                                    Asignar
                                  </Button>
                                </div>
                              )
                            })
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-muted-foreground">No hay áreas disponibles</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-3">Evaluadores Disponibles</h4>
                        <div className="space-y-3">
                          {loadingUsers ? (
                            <div className="text-center py-4">
                              <p className="text-muted-foreground">Cargando evaluadores...</p>
                            </div>
                          ) : users.filter(user => 
                            user.role === 'evaluador' || user.rol === 'evaluador'
                          ).length > 0 ? (
                            users
                              .filter(user => user.role === 'evaluador' || user.rol === 'evaluador')
                              .map((evaluator, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div>
                                    <p className="font-medium text-foreground">{evaluator.name || evaluator.nombre}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {evaluator.area || evaluator.area_competencia || 'Sin área asignada'}
                                    </p>
                                  </div>
                                  <Badge
                                    className={
                                      evaluator.is_active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {evaluator.is_active !== false ? "Disponible" : "Inactivo"}
                                  </Badge>
                                </div>
                              ))
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-muted-foreground">No hay evaluadores registrados</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-muted-foreground">Módulo en desarrollo - Sprint 3</h3>
              <p className="text-sm text-muted-foreground mt-2">Sistema de generación de reportes con exportación PDF/Excel y análisis estadísticos</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
