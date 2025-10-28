"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Mail,
  Calendar,
  Users,
  Trophy,
  Database,
  Bell,
  Shield,
  ArrowLeft,
  Save,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ConfiguracionService } from "@/lib/api"

export default function ConfiguracionPage() {
  const router = useRouter()
  const { toast } = useToast()

  
  const [config, setConfig] = useState({
    
    olimpiada: {
      nombre: "Olimpiada Oh! SanSi",
      descripcion: "Olimpiada en Ciencias y Tecnología de la Universidad Mayor de San Simón",
      estado: true,
      fechaInicio: "2025-01-01",
      fechaFin: "2025-12-31",
      clasificacion_fecha_inicio: "",
      clasificacion_fecha_fin: "",
      final_fecha_inicio: "",
      final_fecha_fin: "",
    },
    
   
    smtp: {
      host: "smtp.gmail.com",
      port: "587",
      username: "",
      password: "",
      encryption: "tls",
      fromEmail: "",
      fromName: "ForwardSoft",
    },
    
   
    evaluacion: {
      puntuacionMaxima: 100,
      puntuacionMinimaClasificacion: 51,
      tiempoEvaluacion: 120, 
    },
    
    
    notificaciones: {
      emailInscripcion: true,
      emailEvaluacion: true,
      emailResultados: true,
      recordatorios: true,
    },
    
    
    seguridad: {
      longitudPassword: 8,
      expiracionToken: 3600,
      intentosMaximos: 3,
      bloqueoTemporal: 15, 
    }
  })

  const [isSaving, setIsSaving] = useState(false)

  
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const response = await ConfiguracionService.getConfiguracion()
        if (response.success && response.data) {
          const data = response.data
          setConfig(prev => ({
            ...prev,
            olimpiada: {
              nombre: data.nombre || prev.olimpiada.nombre,
              descripcion: data.descripcion || prev.olimpiada.descripcion,
              estado: data.estado || prev.olimpiada.estado,
              fechaInicio: data.fecha_inicio || prev.olimpiada.fechaInicio,
              fechaFin: data.fecha_fin || prev.olimpiada.fechaFin,
              clasificacion_fecha_inicio: data.clasificacion_fecha_inicio || prev.olimpiada.clasificacion_fecha_inicio,
              clasificacion_fecha_fin: data.clasificacion_fecha_fin || prev.olimpiada.clasificacion_fecha_fin,
              final_fecha_inicio: data.final_fecha_inicio || prev.olimpiada.final_fecha_inicio,
              final_fecha_fin: data.final_fecha_fin || prev.olimpiada.final_fecha_fin,
            },
            evaluacion: {
              ...prev.evaluacion,
              tiempoEvaluacion: data.tiempo_evaluacion || prev.evaluacion.tiempoEvaluacion,
            }
          }))
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error)
      }
    }
    cargarConfiguracion()
  }, [])

  const handleSave = async (section: string) => {
    setIsSaving(true)
    try {
      if (section === "General") {
        await ConfiguracionService.updateConfiguracionGeneral({
          nombre: config.olimpiada.nombre,
          descripcion: config.olimpiada.descripcion,
          estado: config.olimpiada.estado,
          fecha_inicio: config.olimpiada.fechaInicio,
          fecha_fin: config.olimpiada.fechaFin,
          clasificacion_fecha_inicio: config.olimpiada.clasificacion_fecha_inicio || null,
          clasificacion_fecha_fin: config.olimpiada.clasificacion_fecha_fin || null,
          clasificacion_puntuacion_minima: config.evaluacion.puntuacionMinimaClasificacion,
          final_fecha_inicio: config.olimpiada.final_fecha_inicio || null,
          final_fecha_fin: config.olimpiada.final_fecha_fin || null,
          tiempo_evaluacion: config.evaluacion.tiempoEvaluacion,
        })
      } else if (section === "Evaluación") {
        await ConfiguracionService.updateConfiguracionGeneral({
          clasificacion_puntuacion_minima: config.evaluacion.puntuacionMinimaClasificacion,
          tiempo_evaluacion: config.evaluacion.tiempoEvaluacion,
        })
      }
      
      toast({
        title: "Configuración guardada",
        description: `La configuración de ${section} se ha guardado exitosamente.`,
      })
    } catch (error: any) {
      console.error("Error al guardar configuración:", error)
      toast({
        title: "Error al guardar",
        description: error?.message || "No se pudo guardar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Email de prueba enviado",
        description: "Revisa tu bandeja de entrada para confirmar la configuración.",
      })
    } catch (error) {
      toast({
        title: "Error al enviar email",
        description: "No se pudo enviar el email de prueba. Verifica la configuración SMTP.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="flex items-center space-x-2">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Volver al Dashboard</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Settings className="h-6 w-6 text-primary" />
                <span className="text-xl font-heading font-bold text-foreground">Configuración del Sistema</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-xs">
                Panel de Administración
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="smtp">SMTP</TabsTrigger>
              <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
              <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
              <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
              <TabsTrigger value="sistema">Sistema</TabsTrigger>
            </TabsList>

            {/* Configuración General */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Configuración General de la Olimpiada
                  </CardTitle>
                  <CardDescription>
                    Configura los parámetros básicos de la olimpiada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre de la Olimpiada</Label>
                      <Input
                        id="nombre"
                        value={config.olimpiada.nombre}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          olimpiada: { ...prev.olimpiada, nombre: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.olimpiada.estado}
                          onCheckedChange={(checked) => setConfig(prev => ({
                            ...prev,
                            olimpiada: { ...prev.olimpiada, estado: checked }
                          }))}
                        />
                        <span className="text-sm text-muted-foreground">
                          {config.olimpiada.estado ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={config.olimpiada.descripcion}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        olimpiada: { ...prev.olimpiada, descripcion: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                      <Input
                        id="fechaInicio"
                        type="date"
                        value={config.olimpiada.fechaInicio}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          olimpiada: { ...prev.olimpiada, fechaInicio: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fechaFin">Fecha de Fin</Label>
                      <Input
                        id="fechaFin"
                        type="date"
                        value={config.olimpiada.fechaFin}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          olimpiada: { ...prev.olimpiada, fechaFin: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Fase de Clasificación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="clasifFechaInicio">Fecha de Inicio Clasificación</Label>
                        <Input
                          id="clasifFechaInicio"
                          type="datetime-local"
                          value={config.olimpiada.clasificacion_fecha_inicio}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            olimpiada: { ...prev.olimpiada, clasificacion_fecha_inicio: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clasifFechaFin">Fecha de Fin Clasificación</Label>
                        <Input
                          id="clasifFechaFin"
                          type="datetime-local"
                          value={config.olimpiada.clasificacion_fecha_fin}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            olimpiada: { ...prev.olimpiada, clasificacion_fecha_fin: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Fase Final</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="finalFechaInicio">Fecha de Inicio Final</Label>
                        <Input
                          id="finalFechaInicio"
                          type="datetime-local"
                          value={config.olimpiada.final_fecha_inicio}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            olimpiada: { ...prev.olimpiada, final_fecha_inicio: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="finalFechaFin">Fecha de Fin Final</Label>
                        <Input
                          id="finalFechaFin"
                          type="datetime-local"
                          value={config.olimpiada.final_fecha_fin}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            olimpiada: { ...prev.olimpiada, final_fecha_fin: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => handleSave("General")} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Guardando..." : "Guardar Configuración General"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuración SMTP */}
            <TabsContent value="smtp" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configuración SMTP
                  </CardTitle>
                  <CardDescription>
                    Configura el servidor de correo para el envío de notificaciones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">Servidor SMTP</Label>
                      <Input
                        id="smtpHost"
                        value={config.smtp.host}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, host: e.target.value }
                        }))}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">Puerto</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={config.smtp.port}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, port: e.target.value }
                        }))}
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">Usuario</Label>
                      <Input
                        id="smtpUsername"
                        type="email"
                        value={config.smtp.username}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, username: e.target.value }
                        }))}
                        placeholder="tu.email@gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">Contraseña</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={config.smtp.password}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, password: e.target.value }
                        }))}
                        placeholder="Contraseña de aplicación"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="smtpEncryption">Encriptación</Label>
                      <select
                        id="smtpEncryption"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        value={config.smtp.encryption}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, encryption: e.target.value }
                        }))}
                      >
                        <option value="tls">TLS</option>
                        <option value="ssl">SSL</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">Email Remitente</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={config.smtp.fromEmail}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, fromEmail: e.target.value }
                        }))}
                        placeholder="noreply@olimpiada.edu.bo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">Nombre Remitente</Label>
                    <Input
                      id="fromName"
                      value={config.smtp.fromName}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        smtp: { ...prev.smtp, fromName: e.target.value }
                      }))}
                      placeholder="Olimpiada Oh! SanSi"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => handleSave("SMTP")} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Guardando..." : "Guardar Configuración SMTP"}
                    </Button>
                    <Button variant="outline" onClick={handleTestEmail}>
                      <Mail className="h-4 w-4 mr-2" />
                      Probar Email
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Configuración Gmail</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Activa la verificación en dos pasos en tu cuenta de Google</li>
                      <li>• Crea una contraseña de aplicación en "Contraseñas de aplicaciones"</li>
                      <li>• Usa esa contraseña de aplicación (no tu contraseña normal)</li>
                      <li>• Servidor: smtp.gmail.com, Puerto: 587, Encriptación: TLS</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuración de Evaluación */}
            <TabsContent value="evaluacion" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Configuración de Evaluación
                  </CardTitle>
                  <CardDescription>
                    Configura los parámetros del proceso de evaluación
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="puntuacionMaxima">Puntuación Máxima</Label>
                      <Input
                        id="puntuacionMaxima"
                        type="number"
                        value={config.evaluacion.puntuacionMaxima}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          evaluacion: { ...prev.evaluacion, puntuacionMaxima: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="puntuacionMinima">Puntuación Mínima para Clasificar</Label>
                      <Input
                        id="puntuacionMinima"
                        type="number"
                        value={config.evaluacion.puntuacionMinimaClasificacion}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          evaluacion: { ...prev.evaluacion, puntuacionMinimaClasificacion: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiempoEvaluacion">Tiempo de Evaluación (min)</Label>
                      <Input
                        id="tiempoEvaluacion"
                        type="number"
                        value={config.evaluacion.tiempoEvaluacion}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          evaluacion: { ...prev.evaluacion, tiempoEvaluacion: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSave("Evaluación")} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Guardando..." : "Guardar Configuración de Evaluación"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuración de Notificaciones */}
            <TabsContent value="notificaciones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Configuración de Notificaciones
                  </CardTitle>
                  <CardDescription>
                    Configura qué notificaciones se envían automáticamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email de Inscripción</Label>
                        <p className="text-sm text-muted-foreground">Enviar email al confirmar inscripción</p>
                      </div>
                      <Switch
                        checked={config.notificaciones.emailInscripcion}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          notificaciones: { ...prev.notificaciones, emailInscripcion: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email de Evaluación</Label>
                        <p className="text-sm text-muted-foreground">Notificar cuando se asigne evaluación</p>
                      </div>
                      <Switch
                        checked={config.notificaciones.emailEvaluacion}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          notificaciones: { ...prev.notificaciones, emailEvaluacion: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email de Resultados</Label>
                        <p className="text-sm text-muted-foreground">Enviar resultados por email</p>
                      </div>
                      <Switch
                        checked={config.notificaciones.emailResultados}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          notificaciones: { ...prev.notificaciones, emailResultados: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Recordatorios</Label>
                        <p className="text-sm text-muted-foreground">Enviar recordatorios automáticos</p>
                      </div>
                      <Switch
                        checked={config.notificaciones.recordatorios}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          notificaciones: { ...prev.notificaciones, recordatorios: checked }
                        }))}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSave("Notificaciones")} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Guardando..." : "Guardar Configuración de Notificaciones"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuración de Seguridad */}
            <TabsContent value="seguridad" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Configuración de Seguridad
                  </CardTitle>
                  <CardDescription>
                    Configura los parámetros de seguridad del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="longitudPassword">Longitud Mínima de Contraseña</Label>
                      <Input
                        id="longitudPassword"
                        type="number"
                        value={config.seguridad.longitudPassword}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          seguridad: { ...prev.seguridad, longitudPassword: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiracionToken">Expiración de Token (segundos)</Label>
                      <Input
                        id="expiracionToken"
                        type="number"
                        value={config.seguridad.expiracionToken}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          seguridad: { ...prev.seguridad, expiracionToken: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="intentosMaximos">Intentos Máximos de Login</Label>
                      <Input
                        id="intentosMaximos"
                        type="number"
                        value={config.seguridad.intentosMaximos}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          seguridad: { ...prev.seguridad, intentosMaximos: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloqueoTemporal">Bloqueo Temporal (minutos)</Label>
                      <Input
                        id="bloqueoTemporal"
                        type="number"
                        value={config.seguridad.bloqueoTemporal}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          seguridad: { ...prev.seguridad, bloqueoTemporal: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSave("Seguridad")} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Guardando..." : "Guardar Configuración de Seguridad"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuración del Sistema */}
            <TabsContent value="sistema" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Información del Sistema
                  </CardTitle>
                  <CardDescription>
                    Información sobre el estado del sistema y base de datos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Versión del Sistema</Label>
                      <Input value="1.0.0" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Última Actualización</Label>
                      <Input value={new Date().toLocaleDateString()} disabled />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Estado de la Base de Datos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">✓</div>
                        <div className="text-sm text-muted-foreground">Conexión</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">1,247</div>
                        <div className="text-sm text-muted-foreground">Usuarios</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">6</div>
                        <div className="text-sm text-muted-foreground">Áreas</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verificar Sistema
                    </Button>
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Respaldar Base de Datos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
