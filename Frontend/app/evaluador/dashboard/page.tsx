"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthService } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import {
  Trophy,
  Clock,
  CheckCircle,
  FileText,
  Star,
  LogOut,
  UserCheck,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import RegistroNotas from "@/app/evaluador/registro-notas/page"

export default function EvaluatorDashboard() {
  const router = useRouter()
  const { logout: authLogout, user } = useAuth() as any
  const avatarUrl = user?.avatar_url as string | undefined
  const toAbsolute = (p?: string) => p && /^https?:\/\//i.test(p) ? p : (p ? `${process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo/'}${p}` : undefined)
  const avatarSrc = toAbsolute(avatarUrl)
  const userName: string = user?.name || user?.nombre || ""
  const initials = userName ? userName.split(' ').map((p: string)=>p[0]).slice(0,2).join('').toUpperCase() : 'U'
  const [activeTab, setActiveTab] = useState("registro-notas")
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
    areaNames: userProfile?.areas ? userProfile.areas.map((area: any) => area.area_nombre || area.nombre) : [],
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
        
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo'}/api/evaluador/estadisticas`, {
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
                Evaluador - {evaluatorInfo.areaNames.length > 0 ? evaluatorInfo.areaNames.join(", ") : "Cargando áreas..."}
              </Badge>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <Link href="/evaluador/perfil" className="inline-flex items-center justify-center h-9 w-9 rounded-full overflow-hidden border">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold flex items-center justify-center h-full w-full bg-blue-100 text-blue-700">{initials}</span>
                )}
              </Link>
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
              <Link href="/evaluador/perfil" className="inline-flex items-center justify-center h-8 w-8 rounded-full overflow-hidden border">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-semibold flex items-center justify-center h-full w-full bg-blue-100 text-blue-700">{initials}</span>
                )}
              </Link>
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
                {evaluatorInfo.areaNames.length > 0 
                  ? `Evalúa participantes en ${evaluatorInfo.areaNames.join(" y ")}` 
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
                  Evalúa participantes en {evaluatorInfo.areaNames.length > 0 ? evaluatorInfo.areaNames.join(" y ") : "sus áreas asignadas"}
                </p>
              </div>
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
                    {evaluatorInfo.areaNames.length > 0 
                      ? `Evaluador de ${evaluatorInfo.areaNames.join(" y ")}` 
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
          <TabsList className="grid w-full grid-cols-1 rounded-none border-0 h-auto sm:h-12" style={{backgroundColor: '#1a4e78'}}>
            <TabsTrigger 
              value="registro-notas" 
              className="text-white text-xs sm:text-sm uppercase font-medium data-[state=active]:text-amber-500 data-[state=active]:bg-transparent rounded-none py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Registro de Notas</span>
              <span className="sm:hidden">Notas</span>
            </TabsTrigger>
          </TabsList>

          {/* Registro de Notas Tab */}
          <TabsContent value="registro-notas" className="space-y-4 sm:space-y-6">
            <RegistroNotas />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



