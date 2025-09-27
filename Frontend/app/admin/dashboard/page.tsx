"use client"

import { useState } from "react"
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

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
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </Link>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p
                      className={`text-xs ${stat.trend === "up" ? "text-green-600" : "text-red-600"} flex items-center`}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="areas">Áreas</TabsTrigger>
            <TabsTrigger value="participants">Participantes</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Actividad Reciente
                  </CardTitle>
                  <CardDescription>Últimas acciones en el sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                        {getStatusIcon(activity.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Ver todas las actividades
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Acciones Rápidas
                  </CardTitle>
                  <CardDescription>Tareas frecuentes de administración</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Upload className="h-6 w-6 mb-2" />
                      <span className="text-xs">Importar CSV</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Download className="h-6 w-6 mb-2" />
                      <span className="text-xs">Exportar Datos</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Plus className="h-6 w-6 mb-2" />
                      <span className="text-xs">Nueva Área</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span className="text-xs">Ver Reportes</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Areas Tab */}
          <TabsContent value="areas" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Áreas de Competencia</CardTitle>
                    <CardDescription>Gestiona las áreas y su capacidad</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Área
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitionAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{area.name}</h3>
                          <Badge className={getStatusColor(area.status)}>{area.status}</Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>{area.participants} participantes</span>
                          <span>{area.evaluators} evaluadores</span>
                          <span>Capacidad: {area.capacity}</span>
                        </div>
                        <div className="mt-2">
                          <Progress value={(area.participants / area.capacity) * 100} className="h-2" />
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestión de Participantes</CardTitle>
                    <CardDescription>Administra inscripciones y participantes</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button variant="outline" size="sm">
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
                          <div className="text-2xl font-bold text-blue-700">89</div>
                          <div className="text-sm text-blue-600">Pendientes Verificación</div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 bg-green-50 border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold text-green-700">1,158</div>
                          <div className="text-sm text-green-600">Confirmadas</div>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 bg-orange-50 border-orange-200">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-orange-600" />
                        <div>
                          <div className="text-2xl font-bold text-orange-700">1,247</div>
                          <div className="text-sm text-orange-600">Total Inscripciones</div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Export Options */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Exportar Inscripciones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Por Estado</h4>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar Pendientes (89)
                          </Button>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar Confirmadas (1,158)
                          </Button>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar Todas (1,247)
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Por Área de Competencia</h4>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <Download className="h-4 w-4 mr-2" />
                            Matemáticas (245)
                          </Button>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <Download className="h-4 w-4 mr-2" />
                            Física (198)
                          </Button>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <Download className="h-4 w-4 mr-2" />
                            Química (167)
                          </Button>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <Download className="h-4 w-4 mr-2" />
                            Ver todas las áreas
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Recent Inscriptions */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Inscripciones Recientes</h3>
                    <div className="space-y-3">
                      {[
                        { name: "Juan Pérez Mamani", area: "Matemáticas", status: "pending", date: "2025-03-15" },
                        { name: "María González Quispe", area: "Física", status: "confirmed", date: "2025-03-14" },
                        { name: "Carlos López Vargas", area: "Química", status: "pending", date: "2025-03-13" },
                        { name: "Ana Martínez Condori", area: "Biología", status: "confirmed", date: "2025-03-12" },
                      ].map((inscription, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{inscription.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {inscription.area} • {inscription.date}
                            </p>
                          </div>
                          <Badge
                            className={
                              inscription.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {inscription.status === "confirmed" ? "Confirmada" : "Pendiente"}
                          </Badge>
                        </div>
                      ))}
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
                    <CardTitle>Gestión de Usuarios del Sistema</CardTitle>
                    <CardDescription>
                      Registra y administra usuarios internos (coordinadores, evaluadores)
                    </CardDescription>
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
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Apellidos</label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Apellidos completos"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Email</label>
                          <input
                            type="email"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="correo@ejemplo.com"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Teléfono</label>
                          <input
                            type="tel"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="+591 XXXXXXXX"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Rol del Usuario</label>
                          <select className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background">
                            <option value="">Seleccionar rol</option>
                            <option value="coordinator">Coordinador de Área</option>
                            <option value="evaluator">Evaluador</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Área de Especialidad</label>
                          <select className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background">
                            <option value="">Seleccionar área</option>
                            <option value="mathematics">Matemáticas</option>
                            <option value="physics">Física</option>
                            <option value="chemistry">Química</option>
                            <option value="biology">Biología</option>
                            <option value="informatics">Informática</option>
                            <option value="robotics">Robótica</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Institución</label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Universidad/Institución"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Nivel de Experiencia</label>
                          <select className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background">
                            <option value="">Seleccionar nivel</option>
                            <option value="junior">Junior (1-3 años)</option>
                            <option value="senior">Senior (4-8 años)</option>
                            <option value="expert">Experto (8+ años)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Usuario
                      </Button>
                      <Button variant="outline" className="bg-transparent">
                        Limpiar Formulario
                      </Button>
                    </div>
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
                    <div className="space-y-3">
                      {[
                        {
                          name: "Dr. Roberto Pérez",
                          email: "r.perez@umss.edu.bo",
                          role: "Coordinador",
                          area: "Matemáticas",
                          status: "active",
                          experience: "Expert",
                        },
                        {
                          name: "Lic. María González",
                          email: "m.gonzalez@umss.edu.bo",
                          role: "Evaluador",
                          area: "Física",
                          status: "active",
                          experience: "Senior",
                        },
                        {
                          name: "Ing. Carlos Mamani",
                          email: "c.mamani@umss.edu.bo",
                          role: "Evaluador",
                          area: "Informática",
                          status: "pending",
                          experience: "Junior",
                        },
                        {
                          name: "Dra. Ana Quispe",
                          email: "a.quispe@umss.edu.bo",
                          role: "Coordinador",
                          area: "Química",
                          status: "active",
                          experience: "Expert",
                        },
                      ].map((user, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold text-foreground">{user.name}</h4>
                              <Badge
                                className={
                                  user.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                                }
                              >
                                {user.status === "active" ? "Activo" : "Pendiente"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {user.experience}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{user.email}</span>
                              <span>•</span>
                              <span>{user.role}</span>
                              <span>•</span>
                              <span>{user.area}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="bg-transparent">
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" className="bg-transparent">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Evaluator Assignment */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Asignación de Evaluadores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-foreground mb-3">Por Área de Competencia</h4>
                        <div className="space-y-3">
                          {[
                            { area: "Matemáticas", evaluators: 8, needed: 2 },
                            { area: "Física", evaluators: 6, needed: 1 },
                            { area: "Química", evaluators: 5, needed: 3 },
                            { area: "Biología", evaluators: 4, needed: 2 },
                            { area: "Informática", evaluators: 3, needed: 4 },
                            { area: "Robótica", evaluators: 2, needed: 3 },
                          ].map((area, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">{area.area}</p>
                                <p className="text-sm text-muted-foreground">
                                  {area.evaluators} asignados • {area.needed} necesarios
                                </p>
                              </div>
                              <Button variant="outline" size="sm" className="bg-transparent">
                                Asignar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-3">Evaluadores Disponibles</h4>
                        <div className="space-y-3">
                          {[
                            { name: "Dr. Luis Vargas", area: "Matemáticas", available: true },
                            { name: "Lic. Carmen Flores", area: "Física", available: true },
                            { name: "Ing. Pedro Condori", area: "Informática", available: false },
                            { name: "Dra. Sofia Mendoza", area: "Química", available: true },
                          ].map((evaluator, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">{evaluator.name}</p>
                                <p className="text-sm text-muted-foreground">{evaluator.area}</p>
                              </div>
                              <Badge
                                className={
                                  evaluator.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }
                              >
                                {evaluator.available ? "Disponible" : "Ocupado"}
                              </Badge>
                            </div>
                          ))}
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reportes y Estadísticas</CardTitle>
                    <CardDescription>Genera reportes detallados del sistema</CardDescription>
                  </div>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Reporte
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Reporte de Inscripciones</h3>
                        <p className="text-xs text-muted-foreground">Por área y fecha</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Generar
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold">Reporte de Evaluadores</h3>
                        <p className="text-xs text-muted-foreground">Actividad y asignaciones</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Generar
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold">Reporte de Resultados</h3>
                        <p className="text-xs text-muted-foreground">Puntuaciones y rankings</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Generar
                    </Button>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
