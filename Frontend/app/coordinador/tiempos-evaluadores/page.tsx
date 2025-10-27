"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  LogOut,
  Trophy,
} from "lucide-react"
import { AuthService, CoordinadorService, CoordinadorAccionService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { create } from "domain"

type EvaluatorStatus = "sin-permiso" | "permiso-otorgado" | "activo" | "finalizado"
interface NuevoTiempoEvaluador {
  coordinador_id: number
  evaluador_id: number
  start_date: string  // YYYY-MM-DD
  start_time: string   // HH:mm
  duration_days: number
  status: string
}
interface Evaluator {
  id: number
  name: string
  email: string
  area: string
  status: EvaluatorStatus
  levels: string[]
  start_date?: string
  start_time?: string
  duration_days?: number
}

const statusConfig: Record<
  EvaluatorStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; bgColor: string; textColor: string }
> = {
  "sin-permiso": { label: "Sin Permiso", variant: "secondary", bgColor: "bg-gray-100", textColor: "text-gray-600" },
  "permiso-otorgado": {
    label: "Permiso Otorgado",
    variant: "outline",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  activo: { label: "Activo", variant: "default", bgColor: "bg-pink-100", textColor: "text-pink-700" },
  finalizado: { label: "Finalizado", variant: "secondary", bgColor: "bg-gray-100", textColor: "text-gray-500" },
}

const calculateEndDate = (startDate: string, durationDays: number): string => {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + durationDays)
  return end.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

interface EvaluadorTiempo {
  id: number
  nombre: string
  email: string
  area_nombre: string
  estado: EvaluatorStatus
  niveles: string[]
  fecha_inicio?: string
  start_time?: string
  duration_days?: number
}

const transformEvaluadorToEvaluator = (evaluador: EvaluadorTiempo): Evaluator => {
  return {
    id: evaluador.id,
    name: evaluador.nombre,
    email: evaluador.email,
    area: evaluador.area_nombre,
    status: evaluador.estado,
    levels: evaluador.niveles,
    start_date: evaluador.fecha_inicio,
    start_time: evaluador.start_time,
    duration_days: evaluador.duration_days,
  }
}

export default function CoordinatorDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [evaluadores, setEvaluadores] = useState<Evaluator[]>([])
  const [selectedEvaluator, setSelectedEvaluator] = useState<Evaluator | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [coordinadorAreaId, setCoordinadorAreaId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    startDate: "",
    startTime: "",
    durationDays: "",
  })

  const filteredEvaluators = evaluadores.filter((evaluator) =>
    evaluator.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectEvaluator = (evaluator: Evaluator) => {
  setSelectedEvaluator(evaluator)
 /* setIsEditing(false)*/

  setFormData({
    startDate: evaluator.start_date || "",
    startTime: evaluator.start_time || "",
    durationDays: evaluator.duration_days?.toString() || "",
  })
}



  const handleGrantPermission = async () => {
    if (!formData.startDate || !formData.startTime || !formData.durationDays) {
      alert("Por favor selecciona fecha y hora");
      return;
    }
    const profileResponse = await AuthService.getProfile()
    const data:NuevoTiempoEvaluador = {
      coordinador_id: profileResponse.data.id,
      evaluador_id: Number(selectedEvaluator?.id) || 0,
      start_date: formData.startDate,
      start_time: formData.startTime,
      duration_days: Number(formData.durationDays),
      status: "permiso-otorgado",
    };

    try {
      setLoading(true);
      const response = await CoordinadorAccionService.postTiemposEvaluadores(data);
      console.log("✅ Tiempo asignado correctamente:", response.data);
      alert("Tiempo asignado con éxito");

            if (response.success) {
                  // ✅ Actualiza localmente solo al evaluador afectado
                  setEvaluadores(prev =>
                    prev.map(e =>
                      e.id === selectedEvaluator?.id
                        ? {
                            ...e,
                            startDate: selectedEvaluator.start_date,
                            startTime: selectedEvaluator.start_time,
                            durationDays: selectedEvaluator.duration_days,
                            status: "permiso-otorgado",
                          }
                        : e
                    )
                  );
                }
        console.log("✅ Tiempo asignado:", response.data);
    } catch (error) {
      console.error("❌ Error asignando tiempo:", error);
      alert("Error al asignar el tiempo");
        console.error("❌ Error asignando tiempo:", data );
    } finally {
      setLoading(false);
    }

  };

  const handleModifyDates = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (selectedEvaluator?.start_date) {
      setFormData({
        startDate: selectedEvaluator.start_date,
        startTime: selectedEvaluator.start_time || "",
        durationDays: selectedEvaluator.duration_days?.toString() || "",
      })
    } else {
      setFormData({
        startDate: "",
        startTime: "",
        durationDays: "",
      })
    }
  }

  /*const handleConfirm = async () => {
    if (!selectedEvaluator) return

    // Validate form data
    if (!formData.startDate || !formData.startTime || !formData.durationDays) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const dataToSend = {
        evaluador_id: selectedEvaluator.id,
        fecha_inicio: formData.startDate,
        hora_inicio: formData.startTime,
        duracion_dias: Number.parseInt(formData.durationDays),
      }

      let response
      if (selectedEvaluator.startDate) {
        // Modify existing time
        response = await CoordinadorAccionService.modificarTiempoEvaluador(selectedEvaluator.id, {
          fecha_inicio: dataToSend.fecha_inicio,
          hora_inicio: dataToSend.hora_inicio,
          duracion_dias: dataToSend.duracion_dias,
        })
      } else {
        // Assign new time
        response = await CoordinadorAccionService.asignarTiempoEvaluador(dataToSend)
      }

      if (response.success && response.data) {
        toast({
          title: "Éxito",
          description: selectedEvaluator.startDate
            ? "Fechas modificadas correctamente"
            : "Tiempo asignado correctamente",
        })

        // Update local state
        const updatedEvaluator = transformEvaluadorToEvaluator(response.data)
        setEvaluadores((prev) => prev.map((ev) => (ev.id === updatedEvaluator.id ? updatedEvaluator : ev)))
        setSelectedEvaluator(updatedEvaluator)
        setIsEditing(false)
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudo guardar la información",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error guardando fechas:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la información",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }*/

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log("Cargando evaluadores desde el backend...")

      // Obtener el área del coordinador desde el perfil
      const profileResponse = await AuthService.getProfile()
      let areaId = null

      if (profileResponse.success && profileResponse.data) {
        console.log("Perfil completo del coordinador:", profileResponse.data)

        // El coordinador tiene un área asignada - buscar en diferentes campos
        areaId =
          profileResponse.data.area_id ||
          profileResponse.data.area?.id ||
          profileResponse.data.areas?.[0]?.id ||
          profileResponse.data.area_competencia_id

        console.log("Área ID encontrada:", areaId)
      }

      // Si no tenemos areaId, intentar obtenerlo de catálogos
      if (!areaId) {
        console.log("No se encontró areaId, intentando obtener áreas...")
        try {
          const catalogosResponse = await CoordinadorService.getCatalogos()
          console.log("Catálogos obtenidos:", catalogosResponse)

          if (catalogosResponse.success && catalogosResponse.data?.areas) {
            // Buscar el área de matemáticas o usar la primera disponible
            const areaMatematicas = catalogosResponse.data.areas.find(
              (area: any) =>
                area.nombre.toLowerCase().includes("matemática") || area.nombre.toLowerCase().includes("matematicas"),
            )
            if (areaMatematicas) {
              areaId = areaMatematicas.id
              console.log("Área de matemáticas encontrada:", areaMatematicas)
            } else if (catalogosResponse.data.areas.length > 0) {
              // Usar la primera área disponible
              areaId = catalogosResponse.data.areas[0].id
              console.log("Usando primera área disponible:", catalogosResponse.data.areas[0])
            }
          }
        } catch (error) {
          console.error("Error obteniendo catálogos:", error)
          toast({
            title: "Error",
            description: "No se pudieron cargar los catálogos",
            variant: "destructive",
          })
        }
      }

      // Obtener evaluadores del área
      if (areaId) {
        setCoordinadorAreaId(areaId)
        console.log("Obteniendo evaluadores para área:", areaId)
        const response = await CoordinadorAccionService.getTiemposEvaluadoresPorArea(areaId)

        if (areaId) {
        setCoordinadorAreaId(areaId)
        console.log("[v0] Obteniendo evaluadores para área:", areaId)
        const evaluadoresData = await CoordinadorAccionService.getTiemposEvaluadoresPorArea(areaId)

        console.log("[v0] Evaluadores obtenidos:", evaluadoresData)
        setEvaluadores(evaluadoresData)

        toast({
          title: "Datos cargados",
          description: `Se encontraron ${evaluadoresData.length} evaluadores`,
        })
      } else {
        console.log("[v0] No se pudo determinar el área del coordinador")
        setEvaluadores([])
        toast({
          title: "Error",
          description: "No se pudo determinar el área del coordinador",
          variant: "destructive",
        })
      }
      }
    } catch (error) {
      console.error("Error cargando evaluadores:", error)
      setEvaluadores([])
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los evaluadores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-xl font-heading font-bold text-foreground hidden sm:block">
                  Olimpiada Oh! SanSi
                </span>
                <span className="text-sm font-heading font-bold text-foreground sm:hidden">SanSi</span>
              </Link>
              <Badge variant="secondary" className="text-xs hidden md:block">
                Coordinador - Asignar Tiempos Evaluadores
              </Badge>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    if (window.history.length > 1 && document.referrer) {
                      window.history.back()
                    } else {
                      window.location.href = "/coordinador/dashboard"
                    }
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await AuthService.logout()
                  } catch {}
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("auth_token")
                    window.location.href = "/login"
                  }
                }}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold tracking-tight text-blue-900">
            Dashboard - Coordinador de Área
          </h1>
          <p className="text-gray-600">Gestión de Permisos de Evaluación</p>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* Left Panel - Evaluators List */}
          <Card className="flex flex-col border-blue-200 bg-blue-50 p-6">
            <div className="mb-4 space-y-4">
              <h2 className="text-lg font-heading font-semibold text-blue-900">Lista de Evaluadores</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Buscar evaluador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-blue-200"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
                    <p className="text-sm text-gray-600">Cargando evaluadores...</p>
                  </div>
                </div>
              ) : filteredEvaluators.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-sm font-medium text-gray-600">No hay evaluadores</p>
                    <p className="text-xs text-gray-500">
                      {searchQuery
                        ? "No se encontraron resultados para tu búsqueda"
                        : "No hay evaluadores asignados a esta área"}
                    </p>
                  </div>
                </div>
              ) : (
                filteredEvaluators.map((evaluator) => (
                  <button
                    key={evaluator.id}
                    onClick={() => handleSelectEvaluator(evaluator)}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      selectedEvaluator?.id === evaluator.id
                        ? "border-blue-500 bg-white shadow-sm"
                        : "border-blue-200 bg-white hover:bg-blue-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-gray-900">{evaluator.name}</p>
                        <Badge
                          className={`text-xs ${statusConfig[evaluator.status].bgColor} ${statusConfig[evaluator.status].textColor} border-0`}
                        >
                          {statusConfig[evaluator.status].label}
                        </Badge>
                      </div>
                      {selectedEvaluator?.id === evaluator.id && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pagination - Only show if there are evaluators */}
            {!loading && filteredEvaluators.length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 border-t border-blue-200 pt-4">
                <Button variant="outline" size="icon" disabled className="border-blue-200 bg-transparent">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1">
                  <Button size="sm" className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white">
                    1
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 text-gray-600 hover:text-blue-600">
                    2
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 text-gray-600 hover:text-blue-600">
                    3
                  </Button>
                </div>
                <Button variant="outline" size="icon" className="border-blue-200 bg-transparent">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>

          {/* Right Panel - Evaluator Details */}
          <Card className="border-pink-200 bg-pink-50 p-6">
            {selectedEvaluator ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-heading font-semibold text-blue-900">Detalles del Evaluador</h2>
                  <div className="grid gap-3 rounded-lg border border-pink-200 bg-white p-4">
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-sm text-gray-600">Nombre:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedEvaluator.name}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{selectedEvaluator.email}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-sm text-gray-600">Área:</span>
                      <span className="text-sm text-gray-900">{selectedEvaluator.area}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-sm text-gray-600">ID:</span>
                      <span className="text-sm font-mono text-gray-900">{selectedEvaluator.id}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-sm text-gray-600">Niveles:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedEvaluator.levels.map((level) => (
                          <Badge key={level} variant="outline" className="text-xs border-blue-300 text-blue-700">
                            {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-pink-200" />

                {/* Status and Dates */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Estado Actual:</span>
                    <Badge
                      className={`${statusConfig[selectedEvaluator.status].bgColor} ${statusConfig[selectedEvaluator.status].textColor} border-0`}
                    >
                      {statusConfig[selectedEvaluator.status].label}
                    </Badge>
                  </div>

                  {/* Show existing dates or form */}
                  {selectedEvaluator.start_date && !isEditing ? (
                    <div className="space-y-4 rounded-lg border border-pink-200 bg-white p-4">
                      <h3 className="text-sm font-heading font-semibold text-blue-900">
                        Periodo de Evaluación Asignado
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Inicio</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(selectedEvaluator.start_date).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}{" "}
                              - {selectedEvaluator.start_time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-pink-600" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Fin (calculado)</p>
                            <p className="text-sm font-medium text-gray-900">
                              {calculateEndDate(selectedEvaluator.start_date, selectedEvaluator.duration_days || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Duración</p>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedEvaluator.duration_days} {selectedEvaluator.duration_days === 1 ? "día" : "días"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleModifyDates} className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                        Modificar Fechas
                      </Button>
                      <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600" />
                        <p className="text-xs text-blue-700">
                          El evaluador podrá acceder al sistema de calificación durante este periodo
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-lg border border-pink-200 bg-white p-4">
                      <h3 className="text-sm font-heading font-semibold text-blue-900">
                        {selectedEvaluator.start_date
                          ? "Modificar Periodo de Evaluación"
                          : "Asignar Periodo de Evaluación"}
                      </h3>
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-xs text-gray-700">
                              Fecha de Inicio
                            </Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                              <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 border-blue-200"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="startTime" className="text-xs text-gray-700">
                              Hora de Inicio
                            </Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                              <Input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="pl-9 border-blue-200"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="durationDays" className="text-xs text-gray-700">
                            Duración (días)
                          </Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <Input
                              id="durationDays"
                              type="number"
                              min="1"
                              placeholder="Ej: 7"
                              value={formData.durationDays}
                              onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                              className="pl-9 border-pink-200"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Número de días que el evaluador tendrá acceso al sistema
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="flex-1 bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                            disabled={saving}
                          >
                            Cancelar
                          </Button>

                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-md bg-pink-50 p-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 text-pink-600" />
                        <p className="text-xs text-pink-700">Verifica los datos del evaluador antes de confirmar</p>
                      </div>
                    </div>
                  )}

                  {/* Grant Permission Button for evaluators without dates */}
                  {!selectedEvaluator.start_date && !isEditing && (
                    <Button
                      onClick={()=> handleGrantPermission()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      Otorgar Permiso
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                <p>Selecciona un evaluador para ver sus detalles</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
