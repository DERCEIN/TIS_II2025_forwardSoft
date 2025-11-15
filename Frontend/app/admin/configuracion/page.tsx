"use client"

import { useState, useEffect } from "react"
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
  Users,
  Trophy,
  ArrowLeft,
  Save,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ConfiguracionService } from "@/lib/api"

export default function ConfiguracionPage() {
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
    
   
    evaluacion: {
      puntuacionMaxima: 100,
      puntuacionMinimaClasificacion: 51,
      tiempoEvaluacion: 120, 
    },
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
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
          </Tabs>
        </div>
      </div>
    </div>
  )
}
