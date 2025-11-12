"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CoordinadorService, AuthService } from "@/lib/api"
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
  Eye,
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface Area {
  id: number
  nombre: string
  descripcion: string
}

interface Nivel {
  id: number
  nombre: string
  descripcion: string
}

interface Ronda {
  id: number
  nombre: string
  descripcion: string
  area_competencia_id: number
  nivel_competencia_id: number
  estado: string
}

interface AsignacionResult {
  inscripcion_area_id: number
  competidor: string
  area: string
  nivel: string
  institucion: string
  evaluadores: number[]
  evaluadores_info: Array<{
    id: number
    name: string
    email: string
    institucion_nombre: string
  }>
}

export default function AsignacionEvaluadoresPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [niveles, setNiveles] = useState<Nivel[]>([])
  const [rondas, setRondas] = useState<Ronda[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Parámetros del formulario
  const [fase, setFase] = useState<'clasificacion' | 'final'>('clasificacion')
  const [areaId, setAreaId] = useState<string>("")
  const [nivelId, setNivelId] = useState<string>("")
  const [rondaId, setRondaId] = useState<string>("")
  const [numEvaluadores, setNumEvaluadores] = useState<string>("2")
  const [cuotaPorEvaluador, setCuotaPorEvaluador] = useState<string>("30")
  
  // Resultados
  const [resultados, setResultados] = useState<AsignacionResult[]>([])
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensajeSinAsignaciones, setMensajeSinAsignaciones] = useState<string | null>(null)
  const [mostrarModalExcluidos, setMostrarModalExcluidos] = useState(false)
  const [datosExcluidos, setDatosExcluidos] = useState<any>(null)

 
  const cargarCatalogos = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await CoordinadorService.getCatalogos()
      if (response.success && response.data) {
        setAreas(response.data.areas || [])
        setNiveles(response.data.niveles || [])
        setRondas(response.data.rondas || [])
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar catálogos")
    } finally {
      setLoading(false)
    }
  }

  // Generar asignación (previsualizar)
  const generarAsignacion = async (confirmar = false) => {
    console.log('=== INICIANDO GENERACIÓN DE ASIGNACIÓN ===')
    console.log('Área seleccionada:', areaId)
    console.log('Nivel seleccionado:', nivelId)
    console.log('Ronda seleccionada:', rondaId)
    
    if (!areaId) {
      setError("Selecciona un área de competencia")
      return
    }
    
    if (!nivelId) {
      setError("Selecciona un nivel educativo")
      return
    }

    if (confirmar) {
      setGuardando(true)
    } else {
      setGenerando(true)
    }
    setError("")
    setMensajeSinAsignaciones(null)

    try {
      const params = {
        area_id: parseInt(areaId),
        nivel_id: nivelId, 
        ronda_id: rondaId ? parseInt(rondaId) : undefined,
        fase: fase as 'clasificacion' | 'final',
        num_evaluadores: parseInt(numEvaluadores),
        cuota_por_evaluador: parseInt(cuotaPorEvaluador),
        metodo: "simple" as const, 
        evitar_misma_institucion: true, 
        evitar_misma_area: true, 
        confirmar
      }
      
      console.log('Parámetros enviados:', params)
      
      const response = await CoordinadorService.generarAsignaciones(params)
      
      console.log('Respuesta del servidor:', response)

      if (response.success && response.data) {
        console.log('Datos recibidos:', response.data)
        console.log('Items:', response.data.items)
        console.log('Estadísticas:', response.data.estadisticas)
        
        const items = response.data.items || []
        const mensaje = response.data.mensaje || null
        
        setResultados(items)
        setEstadisticas(response.data.estadisticas || null)
        
        // Verificar si hay inscripciones o evaluadores excluidos
        const stats = response.data.estadisticas || {}
        const inscExcluidas = stats.inscripciones_excluidas
        const evalExcluidos = stats.evaluadores_excluidos
        
        if (inscExcluidas || evalExcluidos) {
          const hayExcluidos = 
            (inscExcluidas?.con_asignacion > 0) || 
            (evalExcluidos?.con_asignacion > 0)
          
          if (hayExcluidos) {
            setDatosExcluidos({
              inscripciones: inscExcluidas,
              evaluadores: evalExcluidos
            })
            setMostrarModalExcluidos(true)
          }
        }
        
        
        if (items.length === 0 && mensaje) {
          setMensajeSinAsignaciones(mensaje)
        } else {
          setMensajeSinAsignaciones(null)
        }
        
        console.log('Resultados establecidos:', items)
        
        if (confirmar && items.length > 0) {
          alert("Asignación guardada exitosamente")
        } else if (confirmar && items.length === 0) {
          alert(mensaje || "No se pudieron asignar evaluadores")
        }
      } else {
        console.error('Error en la respuesta:', response)
        const mensajeError = response.message || "Error en la respuesta del servidor"
        setError(mensajeError)
        setMensajeSinAsignaciones(mensajeError)
      }
    } catch (err: any) {
      console.error('Error al generar asignación:', err)
      const mensajeError = err.message || "Error al generar asignación"
      setError(mensajeError)
      setMensajeSinAsignaciones(mensajeError)
    } finally {
      setGenerando(false)
      setGuardando(false)
    }
  }

  
  const exportarAsignaciones = async () => {
    if (!areaId) return
    
    try {
      setError("")
      await CoordinadorService.exportarAsignaciones(
        parseInt(areaId),
        {
          nivel_id: nivelId ? parseInt(nivelId) : undefined,
          fase: fase
        }
      )
    } catch (err: any) {
      setError(err.message || "Error al exportar asignaciones")
    }
  }

  useEffect(() => {
    cargarCatalogos()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-xl font-heading font-bold text-foreground hidden sm:block">Olimpiada Oh! SanSi</span>
                <span className="text-sm font-heading font-bold text-foreground sm:hidden">SanSi</span>
              </Link>
              <Badge variant="secondary" className="text-xs hidden md:block">
                Coordinador - Asignación de Evaluadores
              </Badge>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              <Button variant="outline" size="sm" onClick={() => {
                if (typeof window !== 'undefined') {
                  if (window.history.length > 1 && document.referrer) {
                    window.history.back()
                  } else {
                    window.location.href = '/coordinador/dashboard'
                  }
                }
              }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  await AuthService.logout()
                } catch {}
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('auth_token')
                  window.location.href = '/login'
                }
              }}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
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
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
                Asignación Aleatoria de Evaluadores
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Configura y genera asignaciones automáticas de evaluadores a competidores según parámetros específicos
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Configuración */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datos Generales</CardTitle>
                <CardDescription>Configura los parámetros básicos de la asignación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selección de fase */}
                <div className="space-y-2">
                  <Label htmlFor="fase">Fase *</Label>
                  <Select value={fase} onValueChange={(value) => setFase(value as 'clasificacion' | 'final')} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la fase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clasificacion">Fase Clasificatoria</SelectItem>
                      <SelectItem value="final">Fase Final</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {fase === 'final' 
                      ? 'Asignación para la fase final (solo clasificados)' 
                      : 'Asignación para la fase clasificatoria'}
                  </p>
                </div>

                {/* Área del conocimiento */}
                <div className="space-y-2">
                  <Label htmlFor="area">Área del conocimiento *</Label>
                  <Select value={areaId} onValueChange={setAreaId} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id.toString()}>
                          {area.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selección de nivel */}
                <div className="space-y-2">
                  <Label htmlFor="nivelId">Nivel Educativo</Label>
                  <Select value={nivelId} onValueChange={setNivelId} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona nivel educativo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primaria">Primario</SelectItem>
                      <SelectItem value="secundaria">Secundario</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    El sistema asignará automáticamente evaluadores por grado de escolaridad. Si un grado supera la cuota establecida, se asignarán evaluadores adicionales automáticamente.
                  </p>
                </div>

              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Parámetros de Asignación</CardTitle>
                <CardDescription>Define cómo se realizará la asignación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cuota máxima por evaluador */}
                <div className="space-y-2">
                  <Label htmlFor="cuotaPorEvaluador">Cuota máxima de olimpistas por evaluador</Label>
                  <Input
                    id="cuotaPorEvaluador"
                    type="number"
                    min="1"
                    max="200"
                    value={cuotaPorEvaluador}
                    onChange={(e) => setCuotaPorEvaluador(e.target.value)}
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Si un grado supera esta cantidad, se asignarán evaluadores adicionales automáticamente
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => generarAsignacion(false)} 
                  disabled={!areaId || !nivelId || generando || guardando}
                  className="w-full"
                >
                  {generando ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Previsualizar Asignación Automática
                    </>
                  )}
                </Button>

                <Button 
                  onClick={() => generarAsignacion(true)} 
                  disabled={!areaId || !nivelId || generando || guardando || resultados.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Generar asignación
                    </>
                  )}
                </Button>

                <Button 
                  onClick={exportarAsignaciones} 
                  disabled={!areaId || resultados.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar asignación (Excel)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-2">
            {estadisticas && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Estadísticas de la Asignación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{estadisticas.total_inscripciones}</div>
                      <div className="text-sm text-muted-foreground">Inscripciones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{estadisticas.total_evaluadores_utilizados || estadisticas.total_evaluadores}</div>
                      <div className="text-sm text-muted-foreground">Evaluadores utilizados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{estadisticas.cuota_por_evaluador || '-'}</div>
                      <div className="text-sm text-muted-foreground">Cuota por evaluador</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{estadisticas.grados_asignados}</div>
                      <div className="text-sm text-muted-foreground">Grados asignados</div>
                    </div>
                  </div>
                  {estadisticas.distribucion_grados && estadisticas.distribucion_grados.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Distribución por grado:</h4>
                      <div className="space-y-2">
                        {estadisticas.distribucion_grados.map((grado: any, idx: number) => (
                          <div key={idx} className="text-xs border-l-2 border-primary pl-2">
                            <div className="font-medium">{grado.grado_nombre}</div>
                            <div className="text-muted-foreground">
                              {grado.total_inscripciones} inscripciones - {grado.total_evaluadores} evaluador(es)
                              {grado.evaluadores && grado.evaluadores.length > 0 && (
                                <div className="mt-1 pl-2">
                                  {grado.evaluadores.map((evaluador: any, eIdx: number) => (
                                    <div key={eIdx} className="text-muted-foreground">
                                      • {evaluador.evaluador_nombre}: {evaluador.inscripciones_asignadas} inscripciones
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {resultados.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resultado (se muestra al generar)</CardTitle>
                  <CardDescription>Asignaciones generadas según los parámetros configurados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Competidor</TableHead>
                          <TableHead>Área</TableHead>
                          <TableHead>Evaluador(es) asignado(s)</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultados.map((resultado, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{resultado.competidor}</TableCell>
                            <TableCell>{resultado.area}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {resultado.evaluadores_info.map((evaluador, idx) => (
                                  <div key={idx} className="text-sm">
                                    <div className="font-medium">{evaluador.name}</div>
                                    <div className="text-muted-foreground">{evaluador.email}</div>
                                    <div className="text-xs text-blue-600">{evaluador.institucion_nombre}</div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-green-600">
                                Sin Observación
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : mensajeSinAsignaciones ? (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center max-w-md mx-auto">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="h-12 w-12 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      No se asignaron evaluadores
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {mensajeSinAsignaciones}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-blue-900 mb-1">Posibles causas:</p>
                          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Todas las inscripciones ya tienen evaluador asignado</li>
                            <li>Todos los evaluadores ya tienen asignaciones previas</li>
                            <li>No hay evaluadores disponibles para esta área</li>
                            <li>No hay inscripciones disponibles para el nivel seleccionado</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      Sin resultados
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configura los parámetros y genera una previsualización para ver los resultados
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de información sobre excluidos */}
      <Dialog open={mostrarModalExcluidos} onOpenChange={setMostrarModalExcluidos}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Información sobre asignaciones
            </DialogTitle>
            <DialogDescription>
              Se excluyeron algunas inscripciones y evaluadores que ya tienen asignaciones previas
            </DialogDescription>
          </DialogHeader>
          
          {datosExcluidos && (
            <div className="space-y-4 mt-4">
              {/* Inscripciones excluidas */}
              {datosExcluidos.inscripciones && datosExcluidos.inscripciones.con_asignacion > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 mb-2">Inscripciones excluidas</h4>
                      <div className="space-y-1 text-sm text-amber-800">
                        <p>Total de inscripciones: <span className="font-medium">{datosExcluidos.inscripciones.total}</span></p>
                        <p>Ya tienen evaluador asignado: <span className="font-medium text-amber-900">{datosExcluidos.inscripciones.con_asignacion}</span></p>
                        <p className="text-green-700">Disponibles para asignar: <span className="font-medium">{datosExcluidos.inscripciones.disponibles}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Evaluadores excluidos */}
              {datosExcluidos.evaluadores && datosExcluidos.evaluadores.con_asignacion > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">Evaluadores excluidos</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p>Total de evaluadores: <span className="font-medium">{datosExcluidos.evaluadores.total}</span></p>
                        <p>Ya tienen asignaciones previas: <span className="font-medium text-blue-900">{datosExcluidos.evaluadores.con_asignacion}</span></p>
                        <p className="text-green-700">Disponibles para asignar: <span className="font-medium">{datosExcluidos.evaluadores.disponibles}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-green-800">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Se asignaron evaluadores solo a las inscripciones y evaluadores disponibles
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
