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
  Target,
  Award,
  Download,
} from "lucide-react"
import Link from "next/link"

export default function CoordinatorDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // Coordinator is responsible for "Matemáticas" area
  const myArea = {
    name: "Matemáticas",
    participants: 245,
    capacity: 300,
    evaluators: 8,
    pendingEvaluations: 23,
    completedEvaluations: 167,
  }

  const stats = [
    {
      title: "Participantes en mi Área",
      value: "245",
      change: "+8",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Evaluaciones Pendientes",
      value: "23",
      change: "-5",
      trend: "down",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Evaluadores Asignados",
      value: "8",
      change: "+1",
      trend: "up",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Evaluaciones Completadas",
      value: "167",
      change: "+12",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-heading font-bold text-foreground">Olimpiada Oh! SanSi</span>
              </Link>
              <Badge variant="secondary" className="text-xs">
                Coordinador - {myArea.name}
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
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Coordinación de {myArea.name}</h1>
              <p className="text-muted-foreground">Gestiona participantes y evaluadores de tu área</p>
            </div>
            <div className="flex gap-3">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Asignar Evaluador
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Programar Evaluación
              </Button>
            </div>
          </div>
        </div>

        {/* Area Overview Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">{myArea.name}</h2>
                <p className="text-muted-foreground mb-4">Tu área de coordinación</p>
                <div className="flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {myArea.participants} participantes
                  </span>
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {myArea.evaluators} evaluadores
                  </span>
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Capacidad: {myArea.capacity}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-2">
                  {Math.round((myArea.participants / myArea.capacity) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground mb-3">Capacidad utilizada</p>
                <Progress value={(myArea.participants / myArea.capacity) * 100} className="w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

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
                      <span>{stat.change}</span>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="participants">Participantes</TabsTrigger>
            <TabsTrigger value="evaluators">Evaluadores</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Participants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participantes Recientes
                  </CardTitle>
                  <CardDescription>Últimas inscripciones en {myArea.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{participant.name}</p>
                          <p className="text-sm text-muted-foreground">{participant.institution}</p>
                          <p className="text-xs text-muted-foreground">{participant.registrationDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.score && (
                            <Badge variant="outline" className="text-xs">
                              {participant.score} pts
                            </Badge>
                          )}
                          <Badge className={getStatusColor(participant.status)}>
                            {getStatusText(participant.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Ver todos los participantes
                  </Button>
                </CardContent>
              </Card>

              {/* Evaluation Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Progreso de Evaluaciones
                  </CardTitle>
                  <CardDescription>Estado actual de las evaluaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Evaluaciones Completadas</span>
                        <span className="text-sm text-muted-foreground">
                          {myArea.completedEvaluations} de {myArea.participants}
                        </span>
                      </div>
                      <Progress value={(myArea.completedEvaluations / myArea.participants) * 100} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-700">{myArea.completedEvaluations}</div>
                        <div className="text-sm text-green-600">Completadas</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-700">{myArea.pendingEvaluations}</div>
                        <div className="text-sm text-orange-600">Pendientes</div>
                      </div>
                    </div>

                    <Button className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Programar Evaluaciones
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Participantes de {myArea.name}</CardTitle>
                    <CardDescription>Gestiona los participantes de tu área</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Export Options for Area */}
                  <Card className="p-6 bg-blue-50 border-blue-200">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Exportar Inscripciones de {myArea.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700 mb-1">23</div>
                        <div className="text-sm text-blue-600 mb-3">Pendientes Verificación</div>
                        <Button variant="outline" size="sm" className="w-full bg-white">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700 mb-1">222</div>
                        <div className="text-sm text-green-600 mb-3">Confirmadas</div>
                        <Button variant="outline" size="sm" className="w-full bg-white">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-700 mb-1">245</div>
                        <div className="text-sm text-purple-600 mb-3">Total del Área</div>
                        <Button size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar Todo
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Participants List */}
                  <div className="space-y-4">
                    {recentParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{participant.name}</h3>
                            <Badge className={getStatusColor(participant.status)}>
                              {getStatusText(participant.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span>{participant.institution}</span>
                            <span>Inscrito: {participant.registrationDate}</span>
                            {participant.score && <span>Puntuación: {participant.score}</span>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center mt-6">
                  <Button variant="outline" className="bg-transparent">
                    Cargar más participantes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evaluators Tab */}
          <TabsContent value="evaluators" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Evaluadores Asignados</CardTitle>
                    <CardDescription>Gestiona los evaluadores de {myArea.name}</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Asignar Evaluador
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluators.map((evaluator) => (
                    <div key={evaluator.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{evaluator.name}</h3>
                          <Badge variant="outline" className="text-green-600">
                            Activo
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>{evaluator.email}</span>
                          <span>Asignados: {evaluator.assignedParticipants}</span>
                          <span>Completados: {evaluator.completedEvaluations}</span>
                        </div>
                        <div className="mt-2">
                          <Progress
                            value={(evaluator.completedEvaluations / evaluator.assignedParticipants) * 100}
                            className="h-2"
                          />
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

          {/* Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestión de Evaluaciones</CardTitle>
                    <CardDescription>Supervisa el proceso de evaluación</CardDescription>
                  </div>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Programar Evaluación
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Classification and Lists Section */}
                  <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Listas de Competidores y Clasificaciones
                    </h3>

                    {/* Level Classification */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-blue-700 mb-1">89</div>
                        <div className="text-sm text-blue-600 mb-3">Nivel Primario</div>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Download className="h-4 w-4 mr-2" />
                          Lista Primario
                        </Button>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-green-700 mb-1">98</div>
                        <div className="text-sm text-green-600 mb-3">Nivel Secundario</div>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Download className="h-4 w-4 mr-2" />
                          Lista Secundario
                        </Button>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-purple-700 mb-1">58</div>
                        <div className="text-sm text-purple-600 mb-3">Nivel Superior</div>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Download className="h-4 w-4 mr-2" />
                          Lista Superior
                        </Button>
                      </div>
                    </div>

                    {/* Classification Actions */}
                    <div className="flex gap-3 justify-center">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Award className="h-4 w-4 mr-2" />
                        Generar Clasificación General
                      </Button>
                      <Button variant="outline" className="bg-white">
                        <Trophy className="h-4 w-4 mr-2" />
                        Lista de Clasificados
                      </Button>
                    </div>
                  </Card>

                  {/* Top Performers by Level */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Primary Level Top 5 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Award className="h-4 w-4 text-blue-600" />
                          Top 5 - Primario
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { name: "Ana Quispe", score: 95, institution: "Col. San Simón" },
                            { name: "Carlos Mamani", score: 92, institution: "U.E. Bolívar" },
                            { name: "María López", score: 89, institution: "Col. Nacional" },
                            { name: "Juan Pérez", score: 87, institution: "Col. Técnico" },
                            { name: "Sofia Vargas", score: 85, institution: "U.E. Central" },
                          ].map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    index === 0
                                      ? "bg-yellow-100 text-yellow-800"
                                      : index === 1
                                        ? "bg-gray-100 text-gray-800"
                                        : index === 2
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{student.name}</div>
                                  <div className="text-xs text-muted-foreground">{student.institution}</div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {student.score}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Secondary Level Top 5 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Award className="h-4 w-4 text-green-600" />
                          Top 5 - Secundario
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { name: "Roberto Condori", score: 98, institution: "Col. San Simón" },
                            { name: "Elena Torrez", score: 96, institution: "U.E. Bolívar" },
                            { name: "Diego Rojas", score: 94, institution: "Col. Técnico" },
                            { name: "Carmen Silva", score: 91, institution: "U.E. Central" },
                            { name: "Luis Mendoza", score: 89, institution: "Col. Nacional" },
                          ].map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    index === 0
                                      ? "bg-yellow-100 text-yellow-800"
                                      : index === 1
                                        ? "bg-gray-100 text-gray-800"
                                        : index === 2
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{student.name}</div>
                                  <div className="text-xs text-muted-foreground">{student.institution}</div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {student.score}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Superior Level Top 5 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Award className="h-4 w-4 text-purple-600" />
                          Top 5 - Superior
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { name: "Andrea Fernández", score: 97, institution: "UMSS" },
                            { name: "Miguel Santos", score: 95, institution: "UCB" },
                            { name: "Patricia Vega", score: 93, institution: "UMSS" },
                            { name: "Rodrigo Paz", score: 90, institution: "UTO" },
                            { name: "Valeria Cruz", score: 88, institution: "UCB" },
                          ].map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    index === 0
                                      ? "bg-yellow-100 text-yellow-800"
                                      : index === 1
                                        ? "bg-gray-100 text-gray-800"
                                        : index === 2
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{student.name}</div>
                                  <div className="text-xs text-muted-foreground">{student.institution}</div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {student.score}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Classification Summary */}
                  <Card className="p-6 bg-yellow-50 border-yellow-200">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      Resumen de Clasificados - {myArea.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-yellow-700 mb-1">15</div>
                        <div className="text-sm text-yellow-600">Medallas de Oro</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-gray-700 mb-1">25</div>
                        <div className="text-sm text-gray-600">Medallas de Plata</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-orange-700 mb-1">35</div>
                        <div className="text-sm text-orange-600">Medallas de Bronce</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-blue-700 mb-1">45</div>
                        <div className="text-sm text-blue-600">Menciones Honoríficas</div>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-center mt-4">
                      <Button className="bg-yellow-600 hover:bg-yellow-700">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Lista Completa
                      </Button>
                      <Button variant="outline" className="bg-white">
                        <Award className="h-4 w-4 mr-2" />
                        Generar Certificados
                      </Button>
                    </div>
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
