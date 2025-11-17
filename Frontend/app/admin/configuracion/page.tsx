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
  AlertTriangle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ConfiguracionService } from "@/lib/api"

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const router = useRouter()

  
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
  const [tieneFechaExtendida, setTieneFechaExtendida] = useState(false)
  const [infoFechaExtendida, setInfoFechaExtendida] = useState<any>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const response = await ConfiguracionService.getConfiguracion()
        if (response.success && response.data) {
          const data = response.data
          
          
          const convertirFechaParaInput = (fecha: string) => {
            if (!fecha) return ''
            
            let fechaLimpia = fecha.trim()
            
            fechaLimpia = fechaLimpia.replace(' ', 'T')
           
            if (fechaLimpia.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
              fechaLimpia = fechaLimpia.substring(0, 16)
            }
            return fechaLimpia
          }
          
         
          const tieneExtendida = data.tiene_fecha_extendida || false
          setTieneFechaExtendida(tieneExtendida)
          
          if (tieneExtendida) {
            setInfoFechaExtendida({
              fecha_extendida: data.fecha_fin_extendida,
              fecha_original: data.fecha_fin_original,
              fecha_extension: data.fecha_extension,
              justificacion: data.justificacion_extension
            })
            
            const fechaFinClasificacion = convertirFechaParaInput(data.fecha_fin_extendida || data.clasificacion_fecha_fin || '')
            setConfig(prev => ({
              ...prev,
              olimpiada: {
                nombre: data.nombre || prev.olimpiada.nombre,
                descripcion: data.descripcion || prev.olimpiada.descripcion,
                estado: data.estado !== undefined ? data.estado : prev.olimpiada.estado,
                fechaInicio: data.fecha_inicio || prev.olimpiada.fechaInicio,
                fechaFin: data.fecha_fin || prev.olimpiada.fechaFin,
                clasificacion_fecha_inicio: convertirFechaParaInput(data.clasificacion_fecha_inicio || ''),
                clasificacion_fecha_fin: fechaFinClasificacion,
                final_fecha_inicio: convertirFechaParaInput(data.final_fecha_inicio || ''),
                final_fecha_fin: convertirFechaParaInput(data.final_fecha_fin || ''),
              },
              evaluacion: {
                ...prev.evaluacion,
                tiempoEvaluacion: data.tiempo_evaluacion || prev.evaluacion.tiempoEvaluacion,
                puntuacionMinimaClasificacion: data.clasificacion_puntuacion_minima || prev.evaluacion.puntuacionMinimaClasificacion,
              }
            }))
          } else {
            setInfoFechaExtendida(null)
            setConfig(prev => ({
              ...prev,
              olimpiada: {
                nombre: data.nombre || prev.olimpiada.nombre,
                descripcion: data.descripcion || prev.olimpiada.descripcion,
                estado: data.estado !== undefined ? data.estado : prev.olimpiada.estado,
                fechaInicio: data.fecha_inicio || prev.olimpiada.fechaInicio,
                fechaFin: data.fecha_fin || prev.olimpiada.fechaFin,
                clasificacion_fecha_inicio: convertirFechaParaInput(data.clasificacion_fecha_inicio || ''),
                clasificacion_fecha_fin: convertirFechaParaInput(data.clasificacion_fecha_fin || ''),
                final_fecha_inicio: convertirFechaParaInput(data.final_fecha_inicio || ''),
                final_fecha_fin: convertirFechaParaInput(data.final_fecha_fin || ''),
              },
              evaluacion: {
                ...prev.evaluacion,
                tiempoEvaluacion: data.tiempo_evaluacion || prev.evaluacion.tiempoEvaluacion,
                puntuacionMinimaClasificacion: data.clasificacion_puntuacion_minima || prev.evaluacion.puntuacionMinimaClasificacion,
              }
            }))
          }
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error)
      }
    }
    cargarConfiguracion()
  }, [])

  const handleSave = async (section: string) => {
   
    setErrores({})
    setErrorGeneral(null)
    
    setIsSaving(true)
    try {
      if (section === "General") {
        
        let fechaInicioGeneral: Date | null = null
        let fechaFinGeneral: Date | null = null
        const nuevosErrores: Record<string, string> = {}

        if (config.olimpiada.fechaInicio && config.olimpiada.fechaFin) {
          fechaInicioGeneral = new Date(config.olimpiada.fechaInicio)
          fechaFinGeneral = new Date(config.olimpiada.fechaFin)
          if (fechaInicioGeneral >= fechaFinGeneral) {
            nuevosErrores.fechaFin = "La fecha de fin debe ser posterior a la fecha de inicio"
            setErrores(nuevosErrores)
            toast({
              title: " Error de validación",
              description: "La fecha de fin debe ser posterior a la fecha de inicio",
              variant: "destructive",
            })
            setIsSaving(false)
            return
          }
        }

        if (config.olimpiada.clasificacion_fecha_inicio && config.olimpiada.clasificacion_fecha_fin) {
          const clasifInicio = new Date(config.olimpiada.clasificacion_fecha_inicio)
          const clasifFin = new Date(config.olimpiada.clasificacion_fecha_fin)
          if (clasifInicio >= clasifFin) {
            nuevosErrores.clasificacion_fecha_fin = "La fecha de fin debe ser posterior a la fecha de inicio"
            setErrores(nuevosErrores)
            toast({
              title: " Error de validación",
              description: "La fecha de fin de clasificación debe ser posterior a la fecha de inicio",
              variant: "destructive",
            })
            setIsSaving(false)
            return
          }

          
          if (fechaInicioGeneral && fechaFinGeneral) {
            if (clasifInicio < fechaInicioGeneral) {
              nuevosErrores.clasificacion_fecha_inicio = "La fecha de inicio debe estar dentro del periodo general de la olimpiada"
              setErrores(nuevosErrores)
              toast({
                title: " Error de validación",
                description: "La fecha de inicio de clasificación debe estar dentro del periodo general de la olimpiada",
                variant: "destructive",
              })
              setIsSaving(false)
              return
            }
            if (clasifFin > fechaFinGeneral) {
              nuevosErrores.clasificacion_fecha_fin = "La fecha de fin debe estar dentro del periodo general de la olimpiada"
              setErrores(nuevosErrores)
              toast({
                title: " Error de validación",
                description: "La fecha de fin de clasificación debe estar dentro del periodo general de la olimpiada",
                variant: "destructive",
              })
              setIsSaving(false)
              return
            }
          }
        }

        if (config.olimpiada.final_fecha_inicio && config.olimpiada.final_fecha_fin) {
          const finalInicio = new Date(config.olimpiada.final_fecha_inicio)
          const finalFin = new Date(config.olimpiada.final_fecha_fin)
          if (finalInicio >= finalFin) {
            nuevosErrores.final_fecha_fin = "La fecha de fin debe ser posterior a la fecha de inicio"
            setErrores(nuevosErrores)
            toast({
              title: "Error de validación",
              description: "La fecha de fin de la fase final debe ser posterior a la fecha de inicio",
              variant: "destructive",
            })
            setIsSaving(false)
            return
          }

          
          if (fechaInicioGeneral && fechaFinGeneral) {
            if (finalInicio < fechaInicioGeneral) {
              nuevosErrores.final_fecha_inicio = "La fecha de inicio debe estar dentro del periodo general de la olimpiada"
              setErrores(nuevosErrores)
              toast({
                title: "Error de validación",
                description: "La fecha de inicio de la fase final debe estar dentro del periodo general de la olimpiada",
                variant: "destructive",
              })
              setIsSaving(false)
              return
            }
            if (finalFin > fechaFinGeneral) {
              nuevosErrores.final_fecha_fin = "La fecha de fin debe estar dentro del periodo general de la olimpiada"
              setErrores(nuevosErrores)
              toast({
                title: "Error de validación",
                description: "La fecha de fin de la fase final debe estar dentro del periodo general de la olimpiada",
                variant: "destructive",
              })
              setIsSaving(false)
              return
            }
          }
        }

        // Convertir formato datetime-local a TIMESTAMP para PostgreSQL
        const convertirFecha = (fechaLocal: string) => {
          if (!fechaLocal) return null
          // Formato datetime-local: "YYYY-MM-DDTHH:mm"
          // PostgreSQL necesita: "YYYY-MM-DD HH:mm:ss"
          const fechaFormateada = fechaLocal.replace('T', ' ')
          // Asegurar que tenga segundos
          if (fechaFormateada.split(':').length === 2) {
            return fechaFormateada + ':00'
          }
          return fechaFormateada
        }

        await ConfiguracionService.updateConfiguracionGeneral({
          nombre: config.olimpiada.nombre,
          descripcion: config.olimpiada.descripcion,
          estado: config.olimpiada.estado,
          fecha_inicio: config.olimpiada.fechaInicio,
          fecha_fin: config.olimpiada.fechaFin,
          clasificacion_fecha_inicio: convertirFecha(config.olimpiada.clasificacion_fecha_inicio),
          clasificacion_fecha_fin: convertirFecha(config.olimpiada.clasificacion_fecha_fin),
          clasificacion_puntuacion_minima: config.evaluacion.puntuacionMinimaClasificacion,
          final_fecha_inicio: convertirFecha(config.olimpiada.final_fecha_inicio),
          final_fecha_fin: convertirFecha(config.olimpiada.final_fecha_fin),
          tiempo_evaluacion: config.evaluacion.tiempoEvaluacion,
        })
      } else if (section === "Evaluación") {
        await ConfiguracionService.updateConfiguracionGeneral({
          clasificacion_puntuacion_minima: config.evaluacion.puntuacionMinimaClasificacion,
          tiempo_evaluacion: config.evaluacion.tiempoEvaluacion,
        })
      }
      
      
      setErrores({})
      setErrorGeneral(null)
      
      toast({
        title: " Configuración guardada",
        description: `La configuración de ${section} se ha guardado exitosamente.`,
      })
    } catch (error: any) {
      console.error("Error al guardar configuración:", error)
      
      
      let errorMessage = "No se pudo guardar la configuración. Inténtalo de nuevo."
      const nuevosErrores: Record<string, string> = {}
      
      if (error?.message) {
        errorMessage = error.message
        setErrorGeneral(errorMessage)
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
        setErrorGeneral(errorMessage)
      } else if (error?.response?.data?.errors) {
        
        Object.entries(error.response.data.errors).forEach(([campo, mensajes]: [string, any]) => {
          const msgs = Array.isArray(mensajes) ? mensajes : [mensajes]
          nuevosErrores[campo] = msgs.join(', ')
        })
        setErrores(nuevosErrores)
        
        
        const mensajeGeneral = Object.entries(nuevosErrores)
          .map(([campo, msg]) => `${campo}: ${msg}`)
          .join('; ')
        errorMessage = mensajeGeneral || errorMessage
        setErrorGeneral(errorMessage)
      } else {
        setErrorGeneral(errorMessage)
      }
      
      toast({
        title: " Error al guardar",
        description: errorMessage,
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
          {/* Alerta de error general */}
          {errorGeneral && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-md animate-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-1">Error al guardar configuración</h3>
                  <p className="text-sm text-red-700">{errorGeneral}</p>
                </div>
                <button
                  onClick={() => setErrorGeneral(null)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  aria-label="Cerrar"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
              <TabsTrigger value="medallero">Medallero</TabsTrigger>
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
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            olimpiada: { ...prev.olimpiada, fechaInicio: e.target.value }
                          }))
                          // Limpiar error al cambiar
                          if (errores.fechaInicio) {
                            setErrores(prev => {
                              const newErrores = { ...prev }
                              delete newErrores.fechaInicio
                              return newErrores
                            })
                          }
                        }}
                        className={errores.fechaInicio ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                      />
                      {errores.fechaInicio && (
                        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errores.fechaInicio}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fechaFin">Fecha de Fin</Label>
                      <Input
                        id="fechaFin"
                        type="date"
                        value={config.olimpiada.fechaFin}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            olimpiada: { ...prev.olimpiada, fechaFin: e.target.value }
                          }))
                          // Limpiar error al cambiar
                          if (errores.fechaFin) {
                            setErrores(prev => {
                              const newErrores = { ...prev }
                              delete newErrores.fechaFin
                              return newErrores
                            })
                          }
                        }}
                        className={errores.fechaFin ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                      />
                      {errores.fechaFin && (
                        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errores.fechaFin}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Fase de Clasificación</h3>
                    {tieneFechaExtendida && infoFechaExtendida && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800">
                              Fecha de fin extendida
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              La fecha de fin fue extendida desde {infoFechaExtendida.fecha_original ? new Date(infoFechaExtendida.fecha_original).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'la fecha original'} 
                              hasta {infoFechaExtendida.fecha_extendida ? new Date(infoFechaExtendida.fecha_extendida).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}.
                              {infoFechaExtendida.justificacion && (
                                <span className="block mt-1">Justificación: {infoFechaExtendida.justificacion}</span>
                              )}
                            </p>
                            <p className="text-xs text-amber-700 mt-1 font-medium">
                              Para modificar esta fecha, use la opción "Extender Fecha de Cierre" en la página de Cierre de Fase.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="clasifFechaInicio">Fecha de Inicio Clasificación</Label>
                        <Input
                          id="clasifFechaInicio"
                          type="datetime-local"
                          value={config.olimpiada.clasificacion_fecha_inicio}
                          onChange={(e) => {
                            setConfig(prev => ({
                              ...prev,
                              olimpiada: { ...prev.olimpiada, clasificacion_fecha_inicio: e.target.value }
                            }))
                            
                            if (errores.clasificacion_fecha_inicio) {
                              setErrores(prev => {
                                const newErrores = { ...prev }
                                delete newErrores.clasificacion_fecha_inicio
                                return newErrores
                              })
                            }
                          }}
                          className={errores.clasificacion_fecha_inicio ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
                        {errores.clasificacion_fecha_inicio && (
                          <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errores.clasificacion_fecha_inicio}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clasifFechaFin">Fecha de Fin Clasificación</Label>
                        <Input
                          id="clasifFechaFin"
                          type="datetime-local"
                          value={config.olimpiada.clasificacion_fecha_fin}
                          onChange={(e) => {
                            setConfig(prev => ({
                              ...prev,
                              olimpiada: { ...prev.olimpiada, clasificacion_fecha_fin: e.target.value }
                            }))
                            // Limpiar error al cambiar
                            if (errores.clasificacion_fecha_fin) {
                              setErrores(prev => {
                                const newErrores = { ...prev }
                                delete newErrores.clasificacion_fecha_fin
                                return newErrores
                              })
                            }
                          }}
                          disabled={tieneFechaExtendida}
                          className={tieneFechaExtendida ? "bg-gray-100 cursor-not-allowed" : errores.clasificacion_fecha_fin ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
                        {errores.clasificacion_fecha_fin && (
                          <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errores.clasificacion_fecha_fin}</span>
                          </div>
                        )}
                        {tieneFechaExtendida && !errores.clasificacion_fecha_fin && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Este campo está deshabilitado porque existe una fecha extendida. Use la página de Cierre de Fase para modificarla.
                          </p>
                        )}
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
                          onChange={(e) => {
                            setConfig(prev => ({
                              ...prev,
                              olimpiada: { ...prev.olimpiada, final_fecha_inicio: e.target.value }
                            }))
                            
                            if (errores.final_fecha_inicio) {
                              setErrores(prev => {
                                const newErrores = { ...prev }
                                delete newErrores.final_fecha_inicio
                                return newErrores
                              })
                            }
                          }}
                          className={errores.final_fecha_inicio ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
                        {errores.final_fecha_inicio && (
                          <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errores.final_fecha_inicio}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="finalFechaFin">Fecha de Fin Final</Label>
                        <Input
                          id="finalFechaFin"
                          type="datetime-local"
                          value={config.olimpiada.final_fecha_fin}
                          onChange={(e) => {
                            setConfig(prev => ({
                              ...prev,
                              olimpiada: { ...prev.olimpiada, final_fecha_fin: e.target.value }
                            }))
                            
                            if (errores.final_fecha_fin) {
                              setErrores(prev => {
                                const newErrores = { ...prev }
                                delete newErrores.final_fecha_fin
                                return newErrores
                              })
                            }
                          }}
                          className={errores.final_fecha_fin ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        />
                        {errores.final_fecha_fin && (
                          <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errores.final_fecha_fin}</span>
                          </div>
                        )}
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

            <TabsContent value="medallero" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Configuración de Medallero
                  </CardTitle>
                  <CardDescription>
                    Configura las medallas (oro, plata, bronce) para cada área y nivel de competencia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-3">
                      <strong>Configuración de Medallero</strong>
                    </p>
                    <p className="text-sm text-blue-700 mb-4">
                      Gestiona la distribución de medallas (oro, plata y bronce) para cada área de competencia y nivel (Primaria/Secundaria).
                      Define los rangos de puntuación y la cantidad de medallas para cada categoría.
                    </p>
                    <Button
                      onClick={() => router.push('/admin/medallero')}
                      className="w-full sm:w-auto"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Ir a Configuración de Medallero
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
