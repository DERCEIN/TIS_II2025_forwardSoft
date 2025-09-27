"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import Link from "next/link"

export default function EvaluatorDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null)

  // Evaluator's assigned areas and statistics
  const evaluatorInfo = {
    name: "Dr. Roberto Fernández",
    areas: ["Matemáticas", "Física"],
    totalAssigned: 31,
    completed: 28,
    pending: 3,
    averageScore: 78.5,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-blue-100/95" style={{backgroundColor: '#dbeafe'}}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <img src="/sansi-logo.png" alt="SanSi Logo" className="h-8 w-auto" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{color: '#2563eb'}}>SanSi</span>
                  <span className="text-xs" style={{color: '#3b82f6'}}>Olimpiada de Ciencia y Tecnología</span>
                </div>
              </Link>
              <Badge variant="secondary" className="text-xs" style={{backgroundColor: '#bfdbfe', color: '#1e40af'}}>
                Evaluador - {evaluatorInfo.areas.join(", ")}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}>
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Button>
              <Button variant="outline" size="sm" style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}>
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Link href="/login">
                <Button variant="outline" size="sm" style={{backgroundColor: 'white', color: '#2563eb', borderColor: '#93c5fd'}}>
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
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Panel de Evaluación</h1>
              <p className="text-muted-foreground">Evalúa participantes en {evaluatorInfo.areas.join(" y ")}</p>
            </div>
            <div className="flex gap-3">
              <Button style={{backgroundColor: '#2563eb', color: 'white'}}>
                <Edit3 className="h-4 w-4 mr-2" />
                Iniciar Evaluación
              </Button>
              <Button variant="outline" style={{backgroundColor: '#ec4899', color: 'white', borderColor: '#ec4899'}}>
                <Calendar className="h-4 w-4 mr-2" />
                Mi Calendario
              </Button>
            </div>
          </div>
        </div>

        {/* Evaluator Overview Card */}
        <Card className="mb-8 border-blue-200" style={{background: 'linear-gradient(to right, #eff6ff, #fce7f3)', borderColor: '#bfdbfe'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-bold mb-2" style={{color: '#1e40af'}}>{evaluatorInfo.name}</h2>
                <p className="mb-4" style={{color: '#2563eb'}}>Evaluador de {evaluatorInfo.areas.join(" y ")}</p>
                <div className="flex items-center gap-6 text-sm" style={{color: '#1d4ed8'}}>
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {evaluatorInfo.totalAssigned} asignadas
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {evaluatorInfo.completed} completadas
                  </span>
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Promedio: {evaluatorInfo.averageScore}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold mb-2" style={{color: '#2563eb'}}>
                  {Math.round((evaluatorInfo.completed / evaluatorInfo.totalAssigned) * 100)}%
                </div>
                <p className="text-sm mb-3" style={{color: '#2563eb'}}>Progreso completado</p>
                <Progress value={(evaluatorInfo.completed / evaluatorInfo.totalAssigned) * 100} className="w-32" style={{backgroundColor: '#bfdbfe'}} />
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
                  <div className="p-3 rounded-lg bg-muted">
                    <stat.icon className="h-6 w-6" style={{color: stat.color}} />
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
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="evaluate">Evaluar</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Evaluations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Evaluaciones Prioritarias
                  </CardTitle>
                  <CardDescription>Evaluaciones que requieren atención inmediata</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedParticipants
                      .filter((p) => p.priority === "high" && p.status === "pending")
                      .map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{participant.name}</p>
                            <p className="text-sm text-muted-foreground">{participant.institution}</p>
                            <p className="text-xs text-muted-foreground">Área: {participant.area}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge style={getPriorityColor(participant.priority)}>Alta</Badge>
                            <Button size="sm" style={{backgroundColor: '#2563eb', color: 'white'}}>
                              <Edit3 className="h-4 w-4 mr-1" />
                              Evaluar
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Ver todas las pendientes
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Completed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Evaluaciones Recientes
                  </CardTitle>
                  <CardDescription>Últimas evaluaciones completadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedParticipants
                      .filter((p) => p.status === "completed")
                      .slice(0, 3)
                      .map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{participant.name}</p>
                            <p className="text-sm text-muted-foreground">{participant.institution}</p>
                            <p className="text-xs text-muted-foreground">Área: {participant.area}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600">
                              {participant.score} pts
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Ver todas las completadas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Evaluaciones Pendientes</CardTitle>
                <CardDescription>Participantes asignados que requieren evaluación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignedParticipants
                    .filter((p) => p.status === "pending")
                    .map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{participant.name}</h3>
                            <Badge style={getPriorityColor(participant.priority)}>
                              {participant.priority === "high" ? "Alta" : "Normal"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span>{participant.institution}</span>
                            <span>Área: {participant.area}</span>
                            <span>Enviado: {participant.submissionDate}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" onClick={() => setSelectedParticipant(participant.id)} style={{backgroundColor: '#2563eb', color: 'white'}}>
                            <Edit3 className="h-4 w-4 mr-1" />
                            Evaluar
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evaluate Tab */}
          <TabsContent value="evaluate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Centro de Evaluación</CardTitle>
                <CardDescription>Evalúa el trabajo de los participantes</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedParticipant ? (
                  <div className="space-y-6">
                    {/* Participant Info */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-semibold text-foreground mb-2">
                        {assignedParticipants.find((p) => p.id === selectedParticipant)?.name}
                      </h3>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>{assignedParticipants.find((p) => p.id === selectedParticipant)?.institution}</span>
                        <span>Área: {assignedParticipants.find((p) => p.id === selectedParticipant)?.area}</span>
                      </div>
                    </div>

                    {/* Evaluation Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="score">Puntuación (0-100)</Label>
                          <Input id="score" type="number" min="0" max="100" placeholder="85" />
                        </div>
                        <div>
                          <Label htmlFor="category">Categoría</Label>
                          <Input id="category" placeholder="Excelente" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="feedback">Retroalimentación</Label>
                        <Textarea
                          id="feedback"
                          placeholder="Proporciona comentarios detallados sobre el desempeño del participante..."
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label htmlFor="recommendations">Recomendaciones</Label>
                        <Textarea
                          id="recommendations"
                          placeholder="Sugerencias para mejorar o áreas de fortaleza..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1" style={{backgroundColor: '#ec4899', color: 'white'}}>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Evaluación
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedParticipant(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Selecciona un Participante</h3>
                    <p className="text-muted-foreground mb-4">
                      Elige un participante de la lista de pendientes para comenzar la evaluación
                    </p>
                    <Button onClick={() => setActiveTab("pending")} style={{backgroundColor: '#2563eb', color: 'white'}}>
                      <Users className="h-4 w-4 mr-2" />
                      Ver Pendientes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Evaluaciones Completadas</CardTitle>
                <CardDescription>Historial de evaluaciones realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignedParticipants
                    .filter((p) => p.status === "completed")
                    .map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{participant.name}</h3>
                            <Badge style={getStatusColor(participant.status)}>
                              {getStatusText(participant.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span>{participant.institution}</span>
                            <span>Área: {participant.area}</span>
                            <span>Puntuación: {participant.score}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
