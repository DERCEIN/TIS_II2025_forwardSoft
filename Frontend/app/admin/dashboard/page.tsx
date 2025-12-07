"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
  MoreHorizontal,
  LogOut,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Save,
  RefreshCw,
  Globe,
  EyeOff,
  Copy,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { AdminService, ApiService, OlimpistaService, ConfiguracionService, CatalogoService, PublicacionResultadosService } from "@/lib/api"


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("areas")
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
  const [configuracionesAreas, setConfiguracionesAreas] = useState<Record<number, any>>({})
  const [configGeneral, setConfigGeneral] = useState<any>(null)
  const [isSavingArea, setIsSavingArea] = useState(false)
  const [selectedArea, setSelectedArea] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempConfig, setTempConfig] = useState<any>({})
  const [selectedFase, setSelectedFase] = useState<'clasificatoria' | 'final'>('clasificatoria')
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
  const router = useRouter()
  const { toast } = useToast()
  const { logout } = useAuth()
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)
  const [estadosPublicacion, setEstadosPublicacion] = useState<Record<number, any>>({})
  const [publicando, setPublicando] = useState<Record<number, boolean>>({})
  const [importingUsers, setImportingUsers] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  
  const cargarEstadosPublicacion = async () => {
    try {
      const estados: Record<number, any> = {}
      for (const area of areas) {
        try {
          const response = await PublicacionResultadosService.getEstadoPublicacion(area.id)
          if (response.success) {
            estados[area.id] = response.data
          }
        } catch (error) {
          console.error(`Error cargando estado de publicación para área ${area.id}:`, error)
        }
      }
      setEstadosPublicacion(estados)
    } catch (error) {
      console.error('Error cargando estados de publicación:', error)
    }
  }

  const handlePublicar = async (areaId: number) => {
    if (!confirm('¿Estás seguro de publicar los resultados de esta área? Los resultados serán visibles públicamente.')) {
      return
    }
    
    setPublicando({ ...publicando, [areaId]: true })
    try {
      const response = await PublicacionResultadosService.publicarResultados({
        area_competencia_id: areaId
      })
      
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Resultados publicados exitosamente",
        })
        await cargarEstadosPublicacion()
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al publicar resultados",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Error publicando resultados:', error)
      toast({
        title: "Error",
        description: error.message || "Error al publicar resultados",
        variant: "destructive"
      })
    } finally {
      setPublicando({ ...publicando, [areaId]: false })
    }
  }

  const handleDespublicar = async (areaId: number) => {
    if (!confirm('¿Estás seguro de despublicar los resultados de esta área? Los resultados dejarán de ser visibles públicamente.')) {
      return
    }
    
    setPublicando({ ...publicando, [areaId]: true })
    try {
      const response = await PublicacionResultadosService.despublicarResultados({
        area_competencia_id: areaId
      })
      
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Resultados despublicados exitosamente",
        })
        await cargarEstadosPublicacion()
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al despublicar resultados",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Error despublicando resultados:', error)
      toast({
        title: "Error",
        description: error.message || "Error al despublicar resultados",
        variant: "destructive"
      })
    } finally {
      setPublicando({ ...publicando, [areaId]: false })
    }
  }

  
  const fetchRecentInscriptions = async () => {
    setLoadingInscriptions(true)
    try {
      const response = await OlimpistaService.getAll()
      if (response.success && response.data) {

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
      
      
      console.log('Intentando con /api/admin/users...')
      console.log('URL completa:', API_BASE_URL + '/api/admin/users')
      let response = await ApiService.get('/api/admin/users')
      console.log('Respuesta admin/users:', response)
      
      
      if (!response.success) {
        console.log('Probando con /api/users...')
        console.log('URL completa:', API_BASE_URL + '/api/users')
        response = await ApiService.get('/api/users')
        console.log('Respuesta users:', response)
      }
      
      if (response.success && response.data) {
        setUsers(response.data)
        setCurrentPage(1) 
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

 
  const fetchAreas = async () => {
    setLoadingAreas(true)
    try {
      console.log('Obteniendo áreas de competencia con estadísticas...')
      
      
      const areasRes = await CatalogoService.areasCompetenciaConEstadisticas()
      if (areasRes.success && areasRes.data) {
        setAreas(areasRes.data || [])
        console.log('Áreas con estadísticas cargadas:', areasRes.data)
      } else {
        
        const areasBasicasRes = await CatalogoService.areasCompetencia()
        if (areasBasicasRes.success && areasBasicasRes.data) {
          setAreas(areasBasicasRes.data || [])
          console.log('Áreas básicas cargadas (fallback):', areasBasicasRes.data)
        }
      }
      
      
      const configRes = await ConfiguracionService.getConfiguracion()
      if (configRes.success && configRes.data) {
        setConfigGeneral(configRes.data)
      }
      
      
      const configAreasRes = await ConfiguracionService.getConfiguracionesPorArea()
      if (configAreasRes.success && configAreasRes.data) {
        const configMap: Record<number, any> = {}
        configAreasRes.data.forEach((config: any) => {
          configMap[config.area_competencia_id] = config
        })
        setConfiguracionesAreas(configMap)
      }
      
    } catch (error: any) {
      console.error('Error al obtener áreas:', error)
      setAreas([])
    } finally {
      setLoadingAreas(false)
    }
  }

  
  useEffect(() => {
    if (areas.length > 0) {
      const cargar = async () => {
        const estados: Record<number, any> = {}
        for (const area of areas) {
          try {
            const response = await PublicacionResultadosService.getEstadoPublicacion(area.id)
            if (response.success) {
              estados[area.id] = response.data
            }
          } catch (error) {
            console.error(`Error cargando estado de publicación para área ${area.id}:`, error)
          }
        }
        setEstadosPublicacion(estados)
      }
      cargar()
    }
  }, [areas])

  
  const handleExportParticipantsCSV = async () => {
    try {
      const res = await OlimpistaService.getAll()
      const participantes: any[] = (res && (res as any).data) ? (res as any).data : []

      if (!participantes.length) {
        toast({ title: "Sin datos", description: "No hay participantes para exportar.", variant: "destructive" })
        return
      }

      const headers = [
        "Nombre",
        "Apellido",
        "Documento",
        "Unidad Educativa",
        "Departamento",
        "Área",
        "Nivel",
        "Estado",
        "Fecha Registro"
      ]
      const rows: string[] = [headers.join(',')]
      participantes.forEach((p: any) => {
        const row = [
          p.nombre || '',
          p.apellido || '',
          p.documento_identidad || p.documento || '',
          p.unidad_educativa_nombre || p.institucion || '',
          p.departamento_nombre || p.departamento || '',
          p.area_competencia || p.area_nombre || '',
          p.nivel_nombre || p.nivel || '',
          p.estado || '',
          p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString() : ''
        ].map((v: string) => '"' + String(v).replace(/\"/g, '"') + '"')
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

      toast({ title: "CSV exportado", description: `Se exportaron ${participantes.length} participantes.` })
    } catch (error: any) {
      toast({ title: "Error al exportar", description: error?.message || 'No se pudo generar el CSV.', variant: "destructive" })
    }
  }

  
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
  const [createdUser, setCreatedUser] = useState<{email: string, password: string, credentialsSent?: boolean, emailError?: string} | null>(null)

  const validateNewUserForm = () => {
    if (!userFirstName.trim() || !userLastName.trim()) {
      toast({ title: "Nombre requerido", description: "Ingrese nombres y apellidos." })
      return false
    }
    
    
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/
    if (!nombreRegex.test(userFirstName.trim())) {
      toast({ 
        title: "Nombres inválidos", 
        description: "Los nombres solo pueden contener letras, espacios, guiones y apostrofes.", 
        variant: "destructive" 
      })
      return false
    }
    
    if (!nombreRegex.test(userLastName.trim())) {
      toast({ 
        title: "Apellidos inválidos", 
        description: "Los apellidos solo pueden contener letras, espacios, guiones y apostrofes.", 
        variant: "destructive" 
      })
      return false
    }
    
    
    if (userInstitution.trim()) {
      const institucionRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.,-]+$/
      if (!institucionRegex.test(userInstitution.trim())) {
        toast({ 
          title: "Institución inválida", 
          description: "La institución solo puede contener letras, espacios, puntos, comas y guiones. No se permiten números.", 
          variant: "destructive" 
        })
        return false
      }
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
          const selectedArea = areas.find(area => area.id.toString() === userArea)
          console.log(' Debug - Área seleccionada (ID):', userArea)
          console.log(' Debug - Áreas disponibles:', areas)
          console.log(' Debug - Área encontrada:', selectedArea)
          if (selectedArea) {
            payload.area_id = selectedArea.id
            payload.area = selectedArea.nombre
            console.log(' Debug - Payload final:', payload)
          } else {
            console.error('Error - No se encontró el área con ID:', userArea)
          }
        }
      }
      

      const res = await AdminService.createUser(payload)
      if (res.success) {
        const createdEmail = res.data?.user?.email || userEmail
        const credentialsSent = !!res.data?.credentials_sent
        const tempPass = res.data?.temporary_password as string | undefined
        const emailError = res.data?.email_error as string | undefined

        if (tempPass) {
          setCreatedUser({ 
            email: createdEmail, 
            password: tempPass,
            credentialsSent: credentialsSent,
            emailError: emailError
          })
        }

       
        if (credentialsSent) {
        setUserFirstName("")
        setUserLastName("")
        setUserEmail("")
        setUserPhone("")
        setUserRole("")
        setUserArea("")
        setUserInstitution("")
        setUserExperience("")
          
          toast({
            title: "Usuario registrado",
            description: `Se creó ${createdEmail}. Las credenciales se enviaron por email.`,
          })
        } else {
          toast({
            title: "Usuario creado",
            description: `El usuario se creó pero no se pudo enviar el email. Las credenciales se muestran abajo.`,
            variant: "destructive",
          })
        }
       
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

  const handleImportUsers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({ 
        title: "Archivo inválido", 
        description: "Por favor, seleccione un archivo CSV válido.", 
        variant: "destructive" 
      })
      return
    }

    setImportingUsers(true)
    setImportResult(null)

    try {
      const res = await AdminService.importUsers(file)
      
      if (res.success && res.data) {
        setImportResult(res.data)
        toast({
          title: "Importación completada",
          description: `Se importaron ${res.data.successful_imports} de ${res.data.total_rows} usuarios. ${res.data.emails_sent} emails enviados.`,
        })
        
       
        fetchUsers()
      } else {
        toast({
          title: "Error en importación",
          description: res.message || "Error al importar usuarios",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      const message: string = error?.message || "Error inesperado."
      toast({
        title: "Error al importar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setImportingUsers(false)
     
      event.target.value = ''
    }
  }

  const handleDownloadTemplate = () => {
    
    const areasEjemplo = areas.length > 0 
      ? areas.slice(0, 2).map(a => a.nombre).join(',')
      : 'Matemáticas,Física'
    
    const csvContent = `nombre,apellido,email,rol,area,institucion,telefono
Juan,Pérez,juan.perez@gmail.com,evaluador,${areas.length > 0 ? areas[0].nombre : 'Matemáticas'},Universidad Nacional,12345678
María,García,maria.garcia@gmail.com,coordinador,${areas.length > 1 ? areas[1].nombre : 'Física'},Universidad Nacional,87654321`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'plantilla_usuarios.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: " Plantilla descargada",
      description: "Se descargó la plantilla CSV. Completa los datos y vuelve a importar.",
    })
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
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/sansi-logo.png" alt="SanSi Logo" className="h-6 sm:h-8 w-auto" />
                <span className="text-sm sm:text-xl font-heading font-bold text-foreground hidden sm:block">Olimpiada Oh! SanSi</span>
                <span className="text-sm font-heading font-bold text-foreground sm:hidden">SanSi</span>
              </Link>
              <Badge variant="secondary" className="text-xs hidden md:block">
                Panel de Administración
              </Badge>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                className="hidden lg:flex"
                onClick={() => router.push('/admin/cierre-fase')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Cerrar Fase</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="hidden md:flex"
                onClick={() => router.push('/premiacion')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Premiación</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="hidden md:flex"
                onClick={() => router.push('/certificados')}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Certificados</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={() => router.push('/admin/configuracion')}
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Configuración</span>
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
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex sm:hidden items-center space-x-2">
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
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">Panel de Administración</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Gestiona todos los aspectos de la Olimpiada Oh! SanSi</p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-blue-800">
                    Usted está registrado como <strong>Administrador</strong>
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Tiene acceso completo a todas las funcionalidades del sistema
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-none border-0 h-auto sm:h-12" style={{backgroundColor: '#1a4e78'}}>
            <TabsTrigger 
              value="areas" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              Áreas
            </TabsTrigger>
            <TabsTrigger 
              value="participants" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Participantes</span>
              <span className="sm:hidden">Olimpistas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent border-r border-white/20 rounded-none py-2 sm:py-3"
            >
              Usuarios
            </TabsTrigger>
            <TabsTrigger 
              value="calendario" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent rounded-none py-2 sm:py-3"
            >
              <Calendar className="h-4 w-4 sm:mr-2 inline" />
              <span className="hidden sm:inline">Calendario</span>
            </TabsTrigger>
          </TabsList>

          {/* Areas Tab - Configuración de Tiempos y Periodos */}
          <TabsContent value="areas" className="space-y-4 sm:space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">Áreas de Competencia</h2>
              <p className="text-muted-foreground">Gestiona las áreas y su capacidad</p>
            </div>
            
            {loadingAreas ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Cargando áreas...</p>
              </div>
            ) : areas.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay áreas disponibles</p>
              </div>
            ) : (
              <div className="space-y-4">
                {areas.map((area) => {
                  const configArea = configuracionesAreas[area.id] || {}
                  const tieneConfiguracion = configArea.periodo_evaluacion_inicio && 
                                             configArea.periodo_evaluacion_fin &&
                                             configArea.periodo_publicacion_inicio && 
                                             configArea.periodo_publicacion_fin
                  
                  
                  const participantes = parseInt(area.participantes_count) || 0
                  const evaluadores = parseInt(area.evaluadores_count) || 0
                  const capacidad = parseInt(area.capacidad) || 300
                  const porcentaje = Math.min((participantes / capacidad) * 100, 100)
                  const estaLlena = participantes >= capacidad
                  
                  return (
                    <Card key={area.id} className="hover:shadow-md transition-shadow border-slate-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <h3 className="text-xl font-semibold text-slate-800">{area.nombre}</h3>
                              <Badge 
                                variant="outline" 
                                className={estaLlena 
                                  ? "bg-slate-100 text-slate-600 border-slate-300" 
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                                }
                              >
                                {estaLlena ? "Lleno" : "Activo"}
                              </Badge>
                              {estadosPublicacion[area.id]?.publicado && (
                                <Badge variant="default" className="bg-green-600">
                                  <Globe className="h-3 w-3 mr-1" />
                                  Publicado
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-6 mb-4">
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Participantes</p>
                                <p className="text-lg font-semibold text-slate-800">{participantes}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Evaluadores</p>
                                <p className="text-lg font-semibold text-slate-800">{evaluadores}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500 mb-1">Capacidad</p>
                                <p className="text-lg font-semibold text-slate-800">{capacidad}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Capacidad: {capacidad}</span>
                                <span className="font-medium text-slate-700">{Math.round(porcentaje)}%</span>
                              </div>
                              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all"
                                  style={{ width: `${porcentaje}%` }}
                                />
                                <div 
                                  className="absolute inset-y-0 right-0 bg-slate-300 rounded-full transition-all"
                                  style={{ width: `${100 - porcentaje}%`, left: `${porcentaje}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 flex flex-col gap-2">
                            <div className="flex gap-2">
                              {!estadosPublicacion[area.id]?.publicado ? (
                                <Button
                                  onClick={() => handlePublicar(area.id)}
                                  disabled={publicando[area.id]}
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  <Globe className="h-4 w-4 mr-1" />
                                  {publicando[area.id] ? 'Publicando...' : 'Publicar'}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleDespublicar(area.id)}
                                  disabled={publicando[area.id]}
                                  size="sm"
                                  variant="outline"
                                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                                >
                                  <EyeOff className="h-4 w-4 mr-1" />
                                  {publicando[area.id] ? 'Despublicando...' : 'Despublicar'}
                                </Button>
                              )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedArea(area)
                                setSelectedFase('clasificatoria')
                                setTempConfig(configArea || {
                                  area_competencia_id: area.id,
                                  tiempo_evaluacion_minutos: configGeneral?.tiempo_evaluacion || 120,
                                  periodo_evaluacion_inicio: '',
                                  periodo_evaluacion_fin: '',
                                  periodo_publicacion_inicio: '',
                                  periodo_publicacion_fin: '',
                                  tiempo_evaluacion_final_minutos: configGeneral?.tiempo_evaluacion || 120,
                                  periodo_evaluacion_final_inicio: '',
                                  periodo_evaluacion_final_fin: '',
                                  periodo_publicacion_final_inicio: '',
                                  periodo_publicacion_final_fin: '',
                                })
                                setIsModalOpen(true)
                              }}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Modal de Configuración */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-3">
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-4 w-4" />
                    Configuración: {selectedArea?.nombre}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Configura tiempos de evaluación y periodos de evaluación/publicación para esta área
                  </DialogDescription>
                </DialogHeader>
                
                {selectedArea && (
                  <div className="space-y-4 py-2">
                    {/* Selector de Fase */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <Label className="text-sm font-semibold text-slate-800 mb-2 block">Fase</Label>
                      <Select value={selectedFase} onValueChange={(value: 'clasificatoria' | 'final') => setSelectedFase(value)}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clasificatoria">Fase Clasificatoria</SelectItem>
                          <SelectItem value="final">Fase Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tiempo de Evaluación */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-slate-600" />
                        <Label className="text-sm font-semibold text-slate-800">Tiempo de Evaluación</Label>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="tiempo-modal" className="text-xs text-slate-600">
                            Duración (minutos)
                          </Label>
                          <Input
                            id="tiempo-modal"
                            type="number"
                            min="1"
                            placeholder="120"
                            value={selectedFase === 'clasificatoria' 
                              ? (tempConfig.tiempo_evaluacion_minutos || configGeneral?.tiempo_evaluacion || 120)
                              : (tempConfig.tiempo_evaluacion_final_minutos || configGeneral?.tiempo_evaluacion || 120)}
                            onChange={(e) => {
                              setTempConfig((prev: any) => ({
                                ...prev,
                                [selectedFase === 'clasificatoria' ? 'tiempo_evaluacion_minutos' : 'tiempo_evaluacion_final_minutos']: parseInt(e.target.value) || 120
                              }))
                            }}
                            className="bg-white border-slate-200 h-9 text-sm"
                          />
                          <p className="text-xs text-slate-500">
                            Tiempo máximo que un evaluador puede usar para evaluar
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Periodo de Evaluación */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-slate-600" />
                        <Label className="text-sm font-semibold text-slate-800">Periodo de Evaluación</Label>
                      </div>
                      {selectedFase === 'clasificatoria' ? (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-2">
                          <p className="text-xs text-amber-800">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            Los períodos de evaluación y publicación de la fase clasificatoria no se pueden editar desde aquí.
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 mb-2">
                          Define cuándo los evaluadores pueden realizar las evaluaciones para esta área
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="eval-inicio-modal" className="text-xs font-medium text-slate-600">
                            Fecha y Hora de Inicio
                          </Label>
                          <Input
                            id="eval-inicio-modal"
                            type="datetime-local"
                            value={selectedFase === 'clasificatoria'
                              ? (tempConfig.periodo_evaluacion_inicio ? 
                                  new Date(tempConfig.periodo_evaluacion_inicio).toISOString().slice(0, 16) : '')
                              : (tempConfig.periodo_evaluacion_final_inicio ? 
                                  new Date(tempConfig.periodo_evaluacion_final_inicio).toISOString().slice(0, 16) : '')}
                            onChange={(e) => {
                              setTempConfig((prev: any) => ({
                                ...prev,
                                [selectedFase === 'clasificatoria' ? 'periodo_evaluacion_inicio' : 'periodo_evaluacion_final_inicio']: e.target.value
                              }))
                            }}
                            disabled={selectedFase === 'clasificatoria'}
                            className="bg-white border-slate-200 h-8 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="eval-fin-modal" className="text-xs font-medium text-slate-600">
                            Fecha y Hora de Fin
                          </Label>
                          <Input
                            id="eval-fin-modal"
                            type="datetime-local"
                            value={selectedFase === 'clasificatoria'
                              ? (tempConfig.periodo_evaluacion_fin ? 
                                  new Date(tempConfig.periodo_evaluacion_fin).toISOString().slice(0, 16) : '')
                              : (tempConfig.periodo_evaluacion_final_fin ? 
                                  new Date(tempConfig.periodo_evaluacion_final_fin).toISOString().slice(0, 16) : '')}
                            onChange={(e) => {
                              setTempConfig((prev: any) => ({
                                ...prev,
                                [selectedFase === 'clasificatoria' ? 'periodo_evaluacion_fin' : 'periodo_evaluacion_final_fin']: e.target.value
                              }))
                            }}
                            disabled={selectedFase === 'clasificatoria'}
                            className="bg-white border-slate-200 h-8 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Periodo de Publicación */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-slate-600" />
                        <Label className="text-sm font-semibold text-slate-800">Periodo de Publicación</Label>
                      </div>
                      {selectedFase === 'clasificatoria' ? (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-2">
                          <p className="text-xs text-amber-800">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            Los períodos de evaluación y publicación de la fase clasificatoria no se pueden editar desde aquí.
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 mb-2">
                          Define cuándo se publicarán los resultados de esta área. Debe comenzar después del periodo de evaluación.
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="pub-inicio-modal" className="text-xs font-medium text-slate-600">
                            Fecha y Hora de Inicio
                          </Label>
                          <Input
                            id="pub-inicio-modal"
                            type="datetime-local"
                            value={selectedFase === 'clasificatoria'
                              ? (tempConfig.periodo_publicacion_inicio ? 
                                  new Date(tempConfig.periodo_publicacion_inicio).toISOString().slice(0, 16) : '')
                              : (tempConfig.periodo_publicacion_final_inicio ? 
                                  new Date(tempConfig.periodo_publicacion_final_inicio).toISOString().slice(0, 16) : '')}
                            onChange={(e) => {
                              setTempConfig((prev: any) => ({
                                ...prev,
                                [selectedFase === 'clasificatoria' ? 'periodo_publicacion_inicio' : 'periodo_publicacion_final_inicio']: e.target.value
                              }))
                            }}
                            disabled={selectedFase === 'clasificatoria'}
                            className="bg-white border-slate-200 h-8 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="pub-fin-modal" className="text-xs font-medium text-slate-600">
                            Fecha y Hora de Fin
                          </Label>
                          <Input
                            id="pub-fin-modal"
                            type="datetime-local"
                            value={selectedFase === 'clasificatoria'
                              ? (tempConfig.periodo_publicacion_fin ? 
                                  new Date(tempConfig.periodo_publicacion_fin).toISOString().slice(0, 16) : '')
                              : (tempConfig.periodo_publicacion_final_fin ? 
                                  new Date(tempConfig.periodo_publicacion_final_fin).toISOString().slice(0, 16) : '')}
                            onChange={(e) => {
                              setTempConfig((prev: any) => ({
                                ...prev,
                                [selectedFase === 'clasificatoria' ? 'periodo_publicacion_fin' : 'periodo_publicacion_final_fin']: e.target.value
                              }))
                            }}
                            disabled={selectedFase === 'clasificatoria'}
                            className="bg-white border-slate-200 h-8 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
                        <div className="text-xs text-slate-600">
                          <p className="font-medium mb-1 text-slate-700">Importante:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600">
                            <li>El periodo de evaluación debe terminar antes del periodo de publicación</li>
                            <li>Los coordinadores solo podrán asignar permisos dentro del periodo de evaluación configurado</li>
                            <li>Si un participante está inscrito en múltiples áreas, se validará que no haya choques de horarios</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        setIsSavingArea(true)
                        
                       
                        const convertirFecha = (fechaLocal: string) => {
                          if (!fechaLocal) return ''
                        
                          const fechaFormateada = fechaLocal.replace('T', ' ')
                         
                          if (fechaFormateada.split(':').length === 2) {
                            return fechaFormateada + ':00'
                          }
                          return fechaFormateada
                        }

                        
                        const datosEnvio: any = {
                          area_competencia_id: selectedArea.id,
                        }

                       
                        if (selectedFase === 'clasificatoria') {
                          datosEnvio.tiempo_evaluacion_minutos = tempConfig.tiempo_evaluacion_minutos || configGeneral?.tiempo_evaluacion || 120
                        }

                       
                        if (selectedFase === 'final' && tempConfig.periodo_evaluacion_final_inicio && tempConfig.periodo_evaluacion_final_fin && 
                            tempConfig.periodo_publicacion_final_inicio && tempConfig.periodo_publicacion_final_fin) {
                        
                          const evalFinalInicio = new Date(tempConfig.periodo_evaluacion_final_inicio)
                          const evalFinalFin = new Date(tempConfig.periodo_evaluacion_final_fin)
                          const pubFinalInicio = new Date(tempConfig.periodo_publicacion_final_inicio)
                          const pubFinalFin = new Date(tempConfig.periodo_publicacion_final_fin)

                          if (evalFinalInicio >= evalFinalFin) {
                            toast({
                              title: "Error de validación",
                              description: "La fecha de fin de evaluación (final) debe ser posterior a la fecha de inicio",
                              variant: "destructive",
                            })
                            setIsSavingArea(false)
                            return
                          }

                          if (pubFinalInicio >= pubFinalFin) {
                            toast({
                              title: "Error de validación",
                              description: "La fecha de fin de publicación (final) debe ser posterior a la fecha de inicio",
                              variant: "destructive",
                            })
                            setIsSavingArea(false)
                            return
                          }

                          if (evalFinalFin > pubFinalInicio) {
                            toast({
                              title: "Error de validación",
                              description: "El periodo de evaluación (final) debe terminar antes del periodo de publicación",
                              variant: "destructive",
                            })
                            setIsSavingArea(false)
                            return
                          }

                          datosEnvio.tiempo_evaluacion_final_minutos = tempConfig.tiempo_evaluacion_final_minutos || configGeneral?.tiempo_evaluacion || 120
                          datosEnvio.periodo_evaluacion_final_inicio = convertirFecha(tempConfig.periodo_evaluacion_final_inicio)
                          datosEnvio.periodo_evaluacion_final_fin = convertirFecha(tempConfig.periodo_evaluacion_final_fin)
                          datosEnvio.periodo_publicacion_final_inicio = convertirFecha(tempConfig.periodo_publicacion_final_inicio)
                          datosEnvio.periodo_publicacion_final_fin = convertirFecha(tempConfig.periodo_publicacion_final_fin)
                        }
                        
                        await ConfiguracionService.updateConfiguracionPorArea(datosEnvio)
                        
                        // Recargar configuraciones después de guardar
                        const configAreasRes = await ConfiguracionService.getConfiguracionesPorArea()
                        if (configAreasRes.success && configAreasRes.data) {
                          const configMap: Record<number, any> = {}
                          configAreasRes.data.forEach((config: any) => {
                            configMap[config.area_competencia_id] = config
                          })
                          setConfiguracionesAreas(configMap)
                        }
                        
                        toast({
                          title: "✓ Configuración guardada",
                          description: `La configuración para ${selectedArea.nombre} se ha guardado exitosamente.`,
                        })
                        
                        setIsModalOpen(false)
                      } catch (error: any) {
                        console.error("Error al guardar configuración:", error)
                        
                        
                        let mensajeError = "No se pudo guardar la configuración. Inténtalo de nuevo."
                        
                        if (error?.message) {
                         
                          const match = error.message.match(/^\d+:(.+)$/)
                          mensajeError = match ? match[1].trim() : error.message
                        } else if (error?.response?.data?.message) {
                          mensajeError = error.response.data.message
                        } else if (error?.response?.data?.errors) {
                        
                          const errores = Object.entries(error.response.data.errors)
                            .map(([campo, mensajes]: [string, any]) => {
                              const msgs = Array.isArray(mensajes) ? mensajes : [mensajes]
                              return msgs.join(', ')
                            })
                            .join('; ')
                          mensajeError = errores || mensajeError
                        }
                        
                        toast({
                          title: "Error de validación",
                          description: mensajeError,
                          variant: "destructive",
                        })
                      } finally {
                        setIsSavingArea(false)
                      }
                    }}
                    disabled={isSavingArea}
                    className="bg-slate-700 hover:bg-slate-800 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingArea ? "Guardando..." : "Guardar Configuración"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                    <Button variant="outline" size="sm" onClick={handleExportParticipantsCSV}>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <Card className="p-4 sm:p-6 bg-muted/30">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Registrar Nuevo Usuario</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Nombres</label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Nombres completos"
                            value={userFirstName}
                            onChange={(e) => {
                              // Solo permitir letras, espacios, guiones y apostrofes
                              const value = e.target.value
                              const validValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '')
                              setUserFirstName(validValue)
                            }}
                            onBlur={(e) => {
                              // Limpiar espacios múltiples
                              const cleaned = e.target.value.trim().replace(/\s+/g, ' ')
                              setUserFirstName(cleaned)
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Solo letras, espacios, guiones y apostrofes</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Apellidos</label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Apellidos completos"
                            value={userLastName}
                            onChange={(e) => {
                              // Solo permitir letras, espacios, guiones y apostrofes
                              const value = e.target.value
                              const validValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '')
                              setUserLastName(validValue)
                            }}
                            onBlur={(e) => {
                             
                              const cleaned = e.target.value.trim().replace(/\s+/g, ' ')
                              setUserLastName(cleaned)
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Solo letras, espacios, guiones y apostrofes</p>
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
                            <option value="evaluador">Evaluador</option>
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
                              <option key={area.id} value={area.id}>
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
                            onChange={(e) => {
                              // Solo permitir letras, espacios, puntos, comas y guiones (NO números)
                              const value = e.target.value
                              const validValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.,-]/g, '')
                              setUserInstitution(validValue)
                            }}
                            onBlur={(e) => {
                              // Limpiar espacios múltiples
                              const cleaned = e.target.value.trim().replace(/\s+/g, ' ')
                              setUserInstitution(cleaned)
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Solo letras, espacios, puntos, comas y guiones. No se permiten números.</p>
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadTemplate}
                          title="Descargar plantilla CSV"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <label>
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleImportUsers}
                            disabled={importingUsers}
                            className="hidden"
                            id="csv-import-input"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={importingUsers}
                            onClick={() => document.getElementById('csv-import-input')?.click()}
                            title="Importar usuarios desde CSV"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </label>
                      </div>
                    </div>
                    {createdUser && (
                      <div className="mt-6 fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-4 duration-300">
                          {/* Header con checkmark animado */}
                          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 px-6 pt-8 pb-6 rounded-t-2xl">
                            <button
                              onClick={() => setCreatedUser(null)}
                              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label="Cerrar"
                            >
                              <X className="h-5 w-5" />
                            </button>
                            
                            {/* Checkmark animado */}
                            <div className="flex justify-center mb-4">
                              <div className="relative">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                                  <CheckCircle2 className="h-10 w-10 text-white" />
                        </div>
                                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                              </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
                              ¡Usuario creado exitosamente!
                            </h3>
                            <div className="flex justify-center mb-2">
                              {createdUser.credentialsSent ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Credenciales enviadas por email
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Email no enviado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-center text-gray-600">
                              {createdUser.credentialsSent 
                                ? "Las credenciales se han enviado al correo del usuario"
                                : "No se pudo enviar el email. Usa las credenciales mostradas abajo."}
                          </p>
                        </div>

                          {/* Contenido */}
                          <div className="px-6 py-6 space-y-4">
                            {/* Credenciales */}
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                                  Email
                                </label>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-900">
                                    {createdUser.email}
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(createdUser.email)
                                      toast({ title: "Copiado", description: "Email copiado al portapapeles" })
                                    }}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Copiar email"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Instrucciones */}
                            {!createdUser.credentialsSent && (
                              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-900 mb-2">
                                      ⚠️ Email no enviado
                                    </p>
                                    <p className="text-xs text-red-800 mb-2">
                                      El usuario fue creado exitosamente, pero no se pudo enviar el email con las credenciales. 
                                      Por favor, comparte manualmente las credenciales mostradas arriba con el usuario.
                                    </p>
                                    <p className="text-xs font-medium text-red-900 mt-2">
                                      Posibles causas:
                                    </p>
                                    <ul className="text-xs text-red-800 space-y-1 list-disc list-inside mt-1">
                                      <li>Configuración de email incorrecta en el servidor</li>
                                      <li>Problemas de conectividad del servidor</li>
                                      <li>El email del usuario podría ser inválido</li>
                                    </ul>
                                    {createdUser.emailError && (
                                      <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs">
                                        <p className="font-semibold text-red-900 mb-1">Detalle del error:</p>
                                        <p className="text-red-800 font-mono break-all">{createdUser.emailError}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex gap-3 pt-2">
                              <Button
                                onClick={() => {
                                  navigator.clipboard.writeText(createdUser.email)
                                  toast({ title: "Copiado", description: "Email copiado al portapapeles" })
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Email
                              </Button>
                              <Button
                                onClick={() => setCreatedUser(null)}
                                variant="outline"
                                className="flex-1"
                              >
                                Cerrar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Nota:</strong> Las credenciales de acceso se generarán automáticamente y se enviarán por
                        email al usuario registrado.
                      </p>
                    </div>
                  </Card>

                  {/* Import Results Modal */}
                  {importResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Resultados de la importación</h3>
                            <button
                              onClick={() => setImportResult(null)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label="Cerrar"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground">Total filas</p>
                              <p className="text-lg font-semibold">{importResult.total_rows}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground">Importados</p>
                              <p className="text-lg font-semibold text-green-600">{importResult.successful_imports}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground">Emails enviados</p>
                              <p className="text-lg font-semibold text-blue-600">{importResult.emails_sent}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground">Emails fallidos</p>
                              <p className="text-lg font-semibold text-red-600">{importResult.emails_failed}</p>
                            </div>
                          </div>

                          {importResult.errors && importResult.errors.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold text-red-600 mb-2">Errores ({importResult.errors.length}):</p>
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {importResult.errors.map((error: any, idx: number) => (
                                  <div key={idx} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                                    <strong>Fila {error.row}:</strong> {error.error}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {importResult.warnings && importResult.warnings.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold text-amber-600 mb-2">Advertencias ({importResult.warnings.length}):</p>
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {importResult.warnings.map((warning: any, idx: number) => (
                                  <div key={idx} className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                                    <strong>Fila {warning.row}:</strong> {warning.warning}
                                    {warning.password && (
                                      <div className="mt-1 font-mono text-xs">
                                        Contraseña temporal: <strong>{warning.password}</strong>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            className="mt-4 w-full"
                            onClick={() => setImportResult(null)}
                          >
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current Users List */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Usuarios Registrados</h3>
                    
                    {loadingUsers ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Cargando usuarios...</p>
                      </div>
                    ) : users.length > 0 ? (
                      <>
                      {/* Tabla para desktop */}
                      <div className="hidden md:block overflow-hidden border border-gray-200 rounded-lg">
                        {/* Header de la tabla */}
                        <div className="bg-blue-600 text-white font-semibold">
                          <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm">
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

                      {/* Vista de tarjetas para móviles */}
                      <div className="md:hidden space-y-3">
                        {getCurrentPageUsers().map((user, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-foreground text-sm">
                                    {user.name || user.nombre}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {user.email}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {user.status === "active" || user.estado === "activo" ? "Activo" : "Pendiente"}
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Rol:</span>
                                <span className="font-medium">{user.role || user.rol}</span>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        {/* Controles de paginación móvil */}
                        {users.length > usersPerPage && (
                          <div className="flex items-center justify-center space-x-4 py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePreviousPage}
                              disabled={currentPage === 1}
                              className="text-xs"
                            >
                              ANTERIOR
                            </Button>
                            
                            <span className="text-xs text-muted-foreground">
                              {currentPage} de {getTotalPages()}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextPage}
                              disabled={currentPage === getTotalPages()}
                              className="text-xs"
                            >
                              SIGUIENTE
                            </Button>
                          </div>
                        )}
                      </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No hay usuarios registrados</p>
                      </div>
                    )}
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendario Tab - Vista de Períodos de Evaluación y Publicación */}
          <TabsContent value="calendario" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">Calendario General de Períodos</h2>
              <p className="text-muted-foreground">Visualiza todos los períodos de evaluación y publicación de todas las áreas</p>
                            </div>

            {loadingAreas ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Cargando calendario...</p>
                                  </div>
            ) : areas.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay áreas disponibles</p>
                                </div>
            ) : (
              <div className="space-y-6">
                {/* Leyenda */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-blue-500"></div>
                          <span className="text-sm font-medium">Período de Evaluación</span>
                            </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-green-500"></div>
                          <span className="text-sm font-medium">Período de Publicación</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-green-400"></div>
                          <span className="text-sm font-medium">Ambos períodos</span>
                      </div>
                            </div>
                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-blue-200">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border-2 border-blue-600 bg-blue-100"></div>
                          <span className="text-sm font-medium">Fase Clasificatoria</span>
                                  </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border-2 border-purple-600 bg-purple-100"></div>
                          <span className="text-sm font-medium">Fase Final</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calendario General */}
                {(() => {
                 
                  const todosLosPeriodos: Array<{
                    area: string
                    fase: 'clasificatoria' | 'final'
                    evalInicio: Date | null
                    evalFin: Date | null
                    pubInicio: Date | null
                    pubFin: Date | null
                  }> = []

                  areas.forEach((area) => {
                    const configArea = configuracionesAreas[area.id] || {}
                    
                    // Fase clasificatoria
                    if (configArea.periodo_evaluacion_inicio && configArea.periodo_evaluacion_fin &&
                        configArea.periodo_publicacion_inicio && configArea.periodo_publicacion_fin) {
                      todosLosPeriodos.push({
                        area: area.nombre,
                        fase: 'clasificatoria',
                        evalInicio: new Date(configArea.periodo_evaluacion_inicio),
                        evalFin: new Date(configArea.periodo_evaluacion_fin),
                        pubInicio: new Date(configArea.periodo_publicacion_inicio),
                        pubFin: new Date(configArea.periodo_publicacion_fin)
                      })
                    }
                    
                   
                    if (configArea.periodo_evaluacion_final_inicio && configArea.periodo_evaluacion_final_fin &&
                        configArea.periodo_publicacion_final_inicio && configArea.periodo_publicacion_final_fin) {
                      todosLosPeriodos.push({
                        area: area.nombre,
                        fase: 'final',
                        evalInicio: new Date(configArea.periodo_evaluacion_final_inicio),
                        evalFin: new Date(configArea.periodo_evaluacion_final_fin),
                        pubInicio: new Date(configArea.periodo_publicacion_final_inicio),
                        pubFin: new Date(configArea.periodo_publicacion_final_fin)
                      })
                    }
                  })

                  
                  const estaEnEvaluacion = (fecha: Date) => {
                    return todosLosPeriodos.some(p => {
                      if (!p.evalInicio || !p.evalFin) return false
                      const fechaStr = fecha.toISOString().split('T')[0]
                      const inicioStr = p.evalInicio.toISOString().split('T')[0]
                      const finStr = p.evalFin.toISOString().split('T')[0]
                      return fechaStr >= inicioStr && fechaStr <= finStr
                    })
                  }

                 
                  const estaEnPublicacion = (fecha: Date) => {
                    return todosLosPeriodos.some(p => {
                      if (!p.pubInicio || !p.pubFin) return false
                      const fechaStr = fecha.toISOString().split('T')[0]
                      const inicioStr = p.pubInicio.toISOString().split('T')[0]
                      const finStr = p.pubFin.toISOString().split('T')[0]
                      return fechaStr >= inicioStr && fechaStr <= finStr
                    })
                  }

                 
                  const obtenerTipoFecha = (fecha: Date) => {
                    const fechaStr = fecha.toISOString().split('T')[0]
                    const periodosEnFecha = todosLosPeriodos.filter(p => {
                      const enEval = p.evalInicio && p.evalFin && 
                        fechaStr >= p.evalInicio.toISOString().split('T')[0] && 
                        fechaStr <= p.evalFin.toISOString().split('T')[0]
                      const enPub = p.pubInicio && p.pubFin && 
                        fechaStr >= p.pubInicio.toISOString().split('T')[0] && 
                        fechaStr <= p.pubFin.toISOString().split('T')[0]
                      return enEval || enPub
                    })
                    
                    if (periodosEnFecha.length === 0) return { tipo: 'ninguno', fase: null }
                    
                    const tieneClasificatoria = periodosEnFecha.some(p => p.fase === 'clasificatoria')
                    const tieneFinal = periodosEnFecha.some(p => p.fase === 'final')
                    const tieneEvaluacion = periodosEnFecha.some(p => {
                      const enEval = p.evalInicio && p.evalFin && 
                        fechaStr >= p.evalInicio.toISOString().split('T')[0] && 
                        fechaStr <= p.evalFin.toISOString().split('T')[0]
                      return enEval
                    })
                    const tienePublicacion = periodosEnFecha.some(p => {
                      const enPub = p.pubInicio && p.pubFin && 
                        fechaStr >= p.pubInicio.toISOString().split('T')[0] && 
                        fechaStr <= p.pubFin.toISOString().split('T')[0]
                      return enPub
                    })
                    
                    let tipo = 'ninguno'
                    if (tieneEvaluacion && tienePublicacion) tipo = 'ambos'
                    else if (tieneEvaluacion) tipo = 'evaluacion'
                    else if (tienePublicacion) tipo = 'publicacion'
                    
                    let fase: 'clasificatoria' | 'final' | 'ambas' | null = null
                    if (tieneClasificatoria && tieneFinal) fase = 'ambas'
                    else if (tieneClasificatoria) fase = 'clasificatoria'
                    else if (tieneFinal) fase = 'final'
                    
                    return { tipo, fase }
                  }

                 
                  const todasLasFechas: Date[] = []
                  todosLosPeriodos.forEach(p => {
                    if (p.evalInicio) todasLasFechas.push(p.evalInicio)
                    if (p.evalFin) todasLasFechas.push(p.evalFin)
                    if (p.pubInicio) todasLasFechas.push(p.pubInicio)
                    if (p.pubFin) todasLasFechas.push(p.pubFin)
                  })

                  if (todasLasFechas.length === 0) {
                    return (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center py-8">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">No hay períodos configurados en ninguna área</p>
                                  </div>
                        </CardContent>
                      </Card>
                    )
                  }

                  const fechaMin = new Date(Math.min(...todasLasFechas.map(d => d.getTime())))
                  const fechaMax = new Date(Math.max(...todasLasFechas.map(d => d.getTime())))

                  
                  const generarCalendarioMes = (año: number, mes: number) => {
                    const primerDia = new Date(año, mes, 1)
                    const ultimoDia = new Date(año, mes + 1, 0)
                    const diasEnMes = ultimoDia.getDate()
                    const diaInicioSemana = primerDia.getDay()
                    
                    const dias: Array<{ dia: number; tipo: string; fase: string | null }> = []
                    
                   
                    for (let i = diaInicioSemana - 1; i >= 0; i--) {
                      dias.push({ dia: 0, tipo: 'fuera', fase: null })
                    }
                    
                   
                    for (let dia = 1; dia <= diasEnMes; dia++) {
                      const fecha = new Date(año, mes, dia)
                      const infoFecha = obtenerTipoFecha(fecha)
                      dias.push({ dia, tipo: infoFecha.tipo, fase: infoFecha.fase })
                    }
                    
                   
                    const diasRestantes = 42 - dias.length // 6 semanas * 7 días
                    for (let dia = 1; dia <= diasRestantes; dia++) {
                      dias.push({ dia: 0, tipo: 'fuera', fase: null })
                    }
                    
                    return dias
                  }

                 
                  const meses: Array<{ año: number; mes: number }> = []
                  const fechaActual = new Date(fechaMin.getFullYear(), fechaMin.getMonth(), 1)
                  
                  while (fechaActual <= fechaMax) {
                    meses.push({
                      año: fechaActual.getFullYear(),
                      mes: fechaActual.getMonth()
                    })
                    fechaActual.setMonth(fechaActual.getMonth() + 1)
                  }

                  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle>Calendario Consolidado</CardTitle>
                        <CardDescription>
                          Períodos del {fechaMin.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })} al {fechaMax.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {meses.map(({ año, mes }) => {
                            const calendario = generarCalendarioMes(año, mes)
                            return (
                              <div key={`${año}-${mes}`} className="bg-white border rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-center mb-3 text-base text-gray-800">
                                  {nombresMeses[mes]} {año}
                                </h4>
                                <div className="grid grid-cols-7 gap-1 text-xs">
                                  {/* Días de la semana */}
                                  {nombresDias.map(dia => (
                                    <div key={dia} className="text-center font-medium text-gray-600 py-1.5 text-[11px]">
                                      {dia}
                                    </div>
                                  ))}
                                  {/* Días del mes */}
                                  {calendario.map((item, index) => {
                                    if (item.dia === 0) {
                                      return <div key={index} className="aspect-square"></div>
                                    }
                                    
                                    let bgColor = 'bg-gray-100'
                                    let textColor = 'text-gray-600'
                                    let borderClass = ''
                                    
                                    if (item.tipo === 'evaluacion') {
                                      if (item.fase === 'final' || item.fase === 'ambas') {
                                        bgColor = 'bg-purple-500'
                                      } else {
                                        bgColor = 'bg-blue-500'
                                      }
                                      textColor = 'text-white'
                                    } else if (item.tipo === 'publicacion') {
                                      if (item.fase === 'final' || item.fase === 'ambas') {
                                        bgColor = 'bg-purple-600'
                                      } else {
                                        bgColor = 'bg-green-500'
                                      }
                                      textColor = 'text-white'
                                    } else if (item.tipo === 'ambos') {
                                      if (item.fase === 'final') {
                                        bgColor = 'bg-gradient-to-br from-purple-500 to-purple-600'
                                      } else if (item.fase === 'ambas') {
                                        bgColor = 'bg-gradient-to-br from-blue-400 via-purple-500 to-green-400'
                                      } else {
                                        bgColor = 'bg-gradient-to-br from-blue-400 to-green-400'
                                      }
                                      textColor = 'text-white'
                                    }
                                    
                                    
                                    if (item.fase === 'clasificatoria' && item.tipo !== 'ninguno') {
                                      borderClass = 'border-2 border-blue-600'
                                    } else if (item.fase === 'final' && item.tipo !== 'ninguno') {
                                      borderClass = 'border-2 border-purple-600'
                                    } else if (item.fase === 'ambas' && item.tipo !== 'ninguno') {
                                      borderClass = 'border-2 border-purple-500'
                                    }
                                    
                                    return (
                                      <div
                                        key={index}
                                        className={`aspect-square flex items-center justify-center rounded text-xs font-medium ${bgColor} ${textColor} ${borderClass} ${
                                          item.tipo !== 'ninguno' && item.tipo !== 'fuera' ? 'shadow-sm' : ''
                                        }`}
                                      >
                                        {item.dia}
                                </div>
                                    )
                                  })}
                            </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Lista de áreas con períodos configurados */}
                <Card>
                  <CardHeader>
                    <CardTitle>Áreas Configuradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {areas.map((area) => {
                        const configArea = configuracionesAreas[area.id] || {}
                        const tieneConfiguracionClasificatoria = configArea.periodo_evaluacion_inicio && 
                                                                 configArea.periodo_evaluacion_fin &&
                                                                 configArea.periodo_publicacion_inicio && 
                                                                 configArea.periodo_publicacion_fin
                        const tieneConfiguracionFinal = configArea.periodo_evaluacion_final_inicio && 
                                                        configArea.periodo_evaluacion_final_fin &&
                                                        configArea.periodo_publicacion_final_inicio && 
                                                        configArea.periodo_publicacion_final_fin
                        const tieneConfiguracion = tieneConfiguracionClasificatoria || tieneConfiguracionFinal

                        const formatearFecha = (fecha: Date | null) => {
                          if (!fecha) return 'No definida'
                          return fecha.toLocaleDateString('es-BO', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric'
                          })
                        }

                        const evalInicio = configArea.periodo_evaluacion_inicio ? new Date(configArea.periodo_evaluacion_inicio) : null
                        const evalFin = configArea.periodo_evaluacion_fin ? new Date(configArea.periodo_evaluacion_fin) : null
                        const pubInicio = configArea.periodo_publicacion_inicio ? new Date(configArea.periodo_publicacion_inicio) : null
                        const pubFin = configArea.periodo_publicacion_fin ? new Date(configArea.periodo_publicacion_fin) : null

                        const evalFinalInicio = configArea.periodo_evaluacion_final_inicio ? new Date(configArea.periodo_evaluacion_final_inicio) : null
                        const evalFinalFin = configArea.periodo_evaluacion_final_fin ? new Date(configArea.periodo_evaluacion_final_fin) : null
                        const pubFinalInicio = configArea.periodo_publicacion_final_inicio ? new Date(configArea.periodo_publicacion_final_inicio) : null
                        const pubFinalFin = configArea.periodo_publicacion_final_fin ? new Date(configArea.periodo_publicacion_final_fin) : null

                        return (
                          <Card 
                            key={area.id} 
                            className={`cursor-pointer hover:shadow-md transition-shadow ${tieneConfiguracion ? 'border-blue-200' : 'border-gray-200'}`}
                            onClick={() => {
                              setSelectedArea(area)
                              setTempConfig(configArea)
                              setIsModalOpen(true)
                            }}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center justify-between">
                                <span>{area.nombre}</span>
                                {!tieneConfiguracion && (
                                  <Badge variant="outline" className="text-xs">Sin config</Badge>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {tieneConfiguracion ? (
                                <div className="space-y-3 text-sm">
                                  {tieneConfiguracionClasificatoria && (
                                    <div className="space-y-2">
                                      <div className="font-semibold text-xs text-blue-600 uppercase">Fase Clasificatoria</div>
                                      <div>
                                        <span className="text-gray-600 text-xs">Evaluación: </span>
                                        <span className="font-medium">{formatearFecha(evalInicio)} - {formatearFecha(evalFin)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 text-xs">Publicación: </span>
                                        <span className="font-medium">{formatearFecha(pubInicio)} - {formatearFecha(pubFin)}</span>
                                      </div>
                                    </div>
                                  )}
                                  {tieneConfiguracionFinal && (
                                    <div className="space-y-2">
                                      {tieneConfiguracionClasificatoria && <Separator />}
                                      <div className="font-semibold text-xs text-purple-600 uppercase">Fase Final</div>
                                      <div>
                                        <span className="text-gray-600 text-xs">Evaluación: </span>
                                        <span className="font-medium">{formatearFecha(evalFinalInicio)} - {formatearFecha(evalFinalFin)}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 text-xs">Publicación: </span>
                                        <span className="font-medium">{formatearFecha(pubFinalInicio)} - {formatearFecha(pubFinalFin)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Sin períodos configurados</p>
                              )}
                            </CardContent>
                  </Card>
                        )
                      })}
                </div>
              </CardContent>
            </Card>
            </div>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
