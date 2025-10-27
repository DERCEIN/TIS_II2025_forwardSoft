"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const [areaId, setAreaId] = useState<string>("")
  const [nivelId, setNivelId] = useState<string>("")
  const [rondaId, setRondaId] = useState<string>("")
  const [numEvaluadores, setNumEvaluadores] = useState<string>("2")
  const [metodo, setMetodo] = useState<"simple" | "balanceado">("simple")
  const [evitarMismaInstitucion, setEvitarMismaInstitucion] = useState(true)
  const [evitarMismaArea, setEvitarMismaArea] = useState(true)
  
  // Resultados
  const [resultados, setResultados] = useState<AsignacionResult[]>([])
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // Cargar catálogos
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

    try {
      const params = {
        area_id: parseInt(areaId),
        nivel_id: nivelId, // Enviar directamente 'primaria' o 'secundaria'
        ronda_id: rondaId ? parseInt(rondaId) : undefined,
        fase: "clasificacion",
        num_evaluadores: parseInt(numEvaluadores),
        metodo,
        evitar_misma_institucion: evitarMismaInstitucion,
        evitar_misma_area: evitarMismaArea,
        confirmar
      }
      
      console.log('Parámetros enviados:', params)
      
      const response = await CoordinadorService.generarAsignaciones(params)
      console.log('Respuesta del servidor:', response)

      if (response.success && response.data) {
        console.log('Datos recibidos:', response.data)
        console.log('Items:', response.data.items)
        console.log('Estadísticas:', response.data.estadisticas)
        
        setResultados(response.data.items || [])
        setEstadisticas(response.data.estadisticas || null)
        
        console.log('Resultados establecidos:', response.data.items || [])
        
        if (confirmar) {
          alert("Asignación guardada exitosamente")
        }
      } else {
        console.error('Error en la respuesta:', response)
        setError(response.message || "Error en la respuesta del servidor")
      }
    } catch (err: any) {
      console.error('Error al generar asignación:', err)
      setError(err.message || "Error al generar asignación")
    } finally {
      setGenerando(false)
      setGuardando(false)
    }
  }

  // Exportar resultados
  const exportarAsignaciones = async () => {
    if (!areaId) return
    
    try {
      setError("")
      await CoordinadorService.exportarAsignaciones(
        parseInt(areaId),
        {
          nivel_id: nivelId ? parseInt(nivelId) : undefined,
          fase: "clasificacion"
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
                    El sistema asignará automáticamente 1 evaluador por cada nivel específico (1ro, 2do, 3ro, 4to, 5to, 6to)
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
                {/* Número de evaluadores */}
                <div className="space-y-2">
                  <Label htmlFor="numEvaluadores">Número de evaluadores por competidor</Label>
                  <Input
                    id="numEvaluadores"
                    type="number"
                    min="1"
                    max="5"
                    value={numEvaluadores}
                    onChange={(e) => setNumEvaluadores(e.target.value)}
                    placeholder="2"
                  />
                </div>

                {/* Método de asignación */}
                <div className="space-y-3">
                  <Label>Método de asignación</Label>
                  <RadioGroup value={metodo} onValueChange={(value: "simple" | "balanceado") => setMetodo(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="simple" id="simple" />
                      <Label htmlFor="simple">Aleatorio simple</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="balanceado" id="balanceado" />
                      <Label htmlFor="balanceado">Balanceado por área</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Restricciones */}
                <div className="space-y-3">
                  <Label>Restricciones</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="evitarInstitucion"
                        checked={evitarMismaInstitucion}
                        onCheckedChange={(checked) => setEvitarMismaInstitucion(checked as boolean)}
                      />
                      <Label htmlFor="evitarInstitucion" className="text-sm">
                        Evitar evaluador de la misma institución
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="evitarArea"
                        checked={evitarMismaArea}
                        onCheckedChange={(checked) => setEvitarMismaArea(checked as boolean)}
                      />
                      <Label htmlFor="evitarArea" className="text-sm">
                        Evitar evaluador de la misma área
                      </Label>
                    </div>
                  </div>
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
                      <div className="text-2xl font-bold text-green-600">{estadisticas.total_evaluadores}</div>
                      <div className="text-sm text-muted-foreground">Evaluadores</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{estadisticas.evaluadores_por_inscripcion}</div>
                      <div className="text-sm text-muted-foreground">Por inscripción</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{estadisticas.metodo}</div>
                      <div className="text-sm text-muted-foreground">Método</div>
                    </div>
                  </div>
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
    </div>
  )
}
