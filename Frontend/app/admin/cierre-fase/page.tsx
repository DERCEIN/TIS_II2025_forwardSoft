"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Users,
  FileText,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Home,
} from "lucide-react"
import { AdminService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"

interface Area {
  id: number
  area_nombre: string
  estado: 'pendiente' | 'activa' | 'cerrada'
  porcentaje_completitud: number
  cantidad_clasificados: number
  fecha_cierre?: string
  coordinador_nombre?: string
  total_participantes: number
  total_evaluados: number
  clasificados_real: number
}

interface FaseGeneral {
  estado: string
  fecha_inicio?: string
  fecha_fin_original?: string
  fecha_fin_extendida?: string
  fecha_fin_efectiva?: string
  fecha_cierre?: string
  areas_cerradas: number
  areas_pendientes: number
  areas_activas: number
  total_areas: number
  puede_cerrar: boolean
}

export default function CierreFasePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [faseGeneral, setFaseGeneral] = useState<FaseGeneral | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [resumen, setResumen] = useState<any>(null)
  
  // Modales
  const [showExtenderFecha, setShowExtenderFecha] = useState(false)
  const [showCerrarFase, setShowCerrarFase] = useState(false)
  const [showRevertirCierre, setShowRevertirCierre] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [justificacion, setJustificacion] = useState("")
  const [justificacionRevertir, setJustificacionRevertir] = useState("")
  const [confirmado, setConfirmado] = useState(false)
  const [confirmadoRevertir, setConfirmadoRevertir] = useState(false)
  const [extendiendo, setExtendiendo] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [revirtiendo, setRevirtiendo] = useState(false)
  const [generandoReporte, setGenerandoReporte] = useState(false)

  useEffect(() => {
    cargarDashboard()
  }, [])

  const cargarDashboard = async () => {
    setLoading(true)
    try {
      const response = await AdminService.getDashboardCierreFase()
      if (response.success && response.data) {
        setFaseGeneral(response.data.fase_general)
        
        // Filtrar áreas duplicadas por ID
        const areasData = response.data.areas || []
        const areasUnicas = areasData.filter((area: Area, index: number, self: Area[]) => 
          index === self.findIndex((a: Area) => a.id === area.id)
        )
        setAreas(areasUnicas)
        setResumen(response.data.resumen)
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al cargar el dashboard",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error cargando dashboard:", error)
      toast({
        title: "Error",
        description: "Error al cargar el dashboard de cierre de fase",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExtenderFecha = async () => {
    if (!nuevaFecha || !justificacion.trim()) {
      toast({
        title: "Error",
        description: "Debe completar todos los campos",
        variant: "destructive",
      })
      return
    }

    const fechaActual = faseGeneral?.fecha_fin_efectiva
    if (fechaActual && new Date(nuevaFecha) <= new Date(fechaActual)) {
      toast({
        title: "Error",
        description: "La nueva fecha debe ser posterior a la fecha actual",
        variant: "destructive",
      })
      return
    }

    setExtendiendo(true)
    try {
      const response = await AdminService.extenderFechaCierre({
        nueva_fecha: nuevaFecha,
        justificacion: justificacion.trim(),
      })

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Fecha de cierre extendida exitosamente",
        })
        setShowExtenderFecha(false)
        setNuevaFecha("")
        setJustificacion("")
        cargarDashboard()
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al extender fecha",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error extendiendo fecha:", error)
      toast({
        title: "Error",
        description: "Error al extender fecha de cierre",
        variant: "destructive",
      })
    } finally {
      setExtendiendo(false)
    }
  }

  const handleCerrarFase = async () => {
    if (!confirmado) {
      toast({
        title: "Error",
        description: "Debe confirmar que ha revisado todos los datos",
        variant: "destructive",
      })
      return
    }

    setCerrando(true)
    try {
      
      const response = await AdminService.cerrarFaseGeneral({
        confirmado: true,
      })

      

      if (response && response.success) {
        toast({
          title: "Éxito",
          description: "Fase clasificatoria cerrada exitosamente",
        })
        setShowCerrarFase(false)
        setConfirmado(false)
       
        setTimeout(() => {
          cargarDashboard()
        }, 500)
      } else {
        toast({
          title: "Error",
          description: response?.message || "Error al cerrar fase",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error cerrando fase:", error)
      
     
      let errorMessage = "Error al cerrar fase general"
      
      if (error?.message) {
        
        const messageParts = error.message.split(':')
        if (messageParts.length > 1) {
         
          errorMessage = messageParts.slice(1).join(':').trim()
        } else {
          errorMessage = error.message.trim()
        }
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Si el mensaje está vacío o es solo el código de estado, usar mensaje por defecto
      if (!errorMessage || /^\d{3}$/.test(errorMessage)) {
        errorMessage = "Error al cerrar fase general. Por favor, intente nuevamente."
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setCerrando(false)
    }
  }

  const handleRevertirCierre = async () => {
    if (!confirmadoRevertir || !justificacionRevertir.trim()) {
      toast({
        title: "Error",
        description: "Debe confirmar y proporcionar una justificación",
        variant: "destructive",
      })
      return
    }

    setRevirtiendo(true)
    try {
      const response = await AdminService.revertirCierreFase({
        confirmado: confirmadoRevertir,
        justificacion: justificacionRevertir
      })

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Cierre de fase revertido exitosamente",
        })
        setShowRevertirCierre(false)
        setJustificacionRevertir("")
        setConfirmadoRevertir(false)
        cargarDashboard()
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al revertir cierre",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error revirtiendo cierre:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al revertir cierre de fase",
        variant: "destructive",
      })
    } finally {
      setRevirtiendo(false)
    }
  }

  const handleGenerarReporte = async () => {
    setGenerandoReporte(true)
    try {
     
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://forwardsoft.tis.cs.umss.edu.bo'}/api/admin/cierre-fase/reporte-consolidado`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      
      const contentType = response.headers.get('content-type') || ''
      
      
      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'Error al generar el reporte'
        throw new Error(errorMessage)
      }

      if (!response.ok) {
        
        try {
          const errorText = await response.text()
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.message || 'Error al generar reporte')
        } catch {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
      }

      
      if (!contentType.includes('text/csv') && !contentType.includes('application/octet-stream')) {
        const text = await response.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || 'Error al generar el reporte')
        } catch {
          throw new Error('La respuesta no es un archivo CSV válido')
        }
      }

      const blob = await response.blob()
      
      
      if (blob.size < 10) {
        const text = await blob.text()
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.message || 'Error al generar el reporte')
        } catch {
          throw new Error('El archivo CSV está vacío')
        }
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_cierre_fase_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Éxito",
        description: "Reporte generado y descargado exitosamente",
      })
    } catch (error: any) {
      console.error("Error generando reporte:", error)
      const errorMessage = error?.message || "Error al generar reporte consolidado"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setGenerandoReporte(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'cerrada':
        return <Badge className="bg-green-500">Cerrada</Badge>
      case 'activa':
        return <Badge className="bg-blue-500">Activa</Badge>
      case 'pendiente':
        return <Badge className="bg-gray-500">Pendiente</Badge>
      case 'cerrada_general':
        return <Badge className="bg-green-600">Cerrada General</Badge>
      case 'cerrada_automatica':
        return <Badge className="bg-purple-500">Cerrada Automática</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/sansi-logo.png" alt="SanSi Logo" className="h-6 sm:h-8 w-auto" />
                <span className="text-sm sm:text-xl font-heading font-bold text-foreground hidden sm:block">Olimpiada Oh! SanSi</span>
                <span className="text-sm font-heading font-bold text-foreground sm:hidden">SanSi</span>
              </Link>
              <Badge variant="secondary" className="text-xs hidden md:block">
                Cierre de Fase
              </Badge>
            </div>

            {/* Navigation */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
              >
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Dashboard</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="hidden md:flex"
                onClick={() => router.push('/admin/configuracion')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Configuración</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await logout()
                  } catch (e) {
                  } finally {
                    router.push('/login')
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cerrar Fase Clasificatoria General</h1>
          <p className="text-gray-600 mt-1">
            Gestiona el cierre de la fase clasificatoria de todo el sistema
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={cargarDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          {(faseGeneral?.estado === 'cerrada_general' || faseGeneral?.estado === 'cerrada_automatica') && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowRevertirCierre(true)}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Revertir Cierre
              </Button>
              <Button 
                variant="outline"
                onClick={handleGenerarReporte}
                disabled={generandoReporte}
              >
                <FileText className="h-4 w-4 mr-2" />
                {generandoReporte ? "Generando..." : "Generar Reporte"}
              </Button>
            </>
          )}
          {faseGeneral?.puede_cerrar && (
            <Button onClick={() => setShowCerrarFase(true)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Cerrar Fase General
            </Button>
          )}
        </div>
      </div>

      {/* Información de Fechas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fechas de la Fase Clasificatoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Fecha de inicio</Label>
              <p className="text-lg font-semibold">
                {faseGeneral?.fecha_inicio
                  ? format(new Date(faseGeneral.fecha_inicio), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
                  : "No definida"}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Fecha de fin programada</Label>
              <p className="text-lg font-semibold">
                {faseGeneral?.fecha_fin_efectiva
                  ? format(new Date(faseGeneral.fecha_fin_efectiva), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
                  : "No definida"}
              </p>
              {faseGeneral?.fecha_fin_extendida && (
                <p className="text-sm text-orange-600 mt-1">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Fecha extendida desde {faseGeneral.fecha_fin_original && format(new Date(faseGeneral.fecha_fin_original), "dd/MM/yyyy")}
                </p>
              )}
            </div>
          </div>
          {faseGeneral?.estado !== 'cerrada_general' && faseGeneral?.estado !== 'cerrada_automatica' && (
            <Button variant="outline" onClick={() => setShowExtenderFecha(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Extender Fecha de Cierre
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Estado General */}
      <Card>
        <CardHeader>
          <CardTitle>Estado General</CardTitle>
          <CardDescription>
            Resumen del estado de cierre de todas las áreas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{faseGeneral?.areas_activas || 0}</div>
              <div className="text-sm text-gray-600">Áreas Activas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">{faseGeneral?.areas_cerradas || 0}</div>
              <div className="text-sm text-gray-600">Áreas Cerradas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{faseGeneral?.areas_pendientes || 0}</div>
              <div className="text-sm text-gray-600">Áreas Pendientes</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{faseGeneral?.total_areas || 0}</div>
              <div className="text-sm text-gray-600">Total de Áreas</div>
            </div>
          </div>
          {!faseGeneral?.puede_cerrar && faseGeneral?.areas_pendientes && faseGeneral.areas_pendientes > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">
                {faseGeneral.areas_pendientes} área(s) aún no han cerrado su fase
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Áreas */}
      <Card>
        <CardHeader>
          <CardTitle>Estado por Área</CardTitle>
          <CardDescription>
            Detalle del estado de cada área de competencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {areas.map((area) => (
              <div key={area.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{area.area_nombre}</h3>
                    {getEstadoBadge(area.estado)}
                  </div>
                  {area.fecha_cierre && (
                    <div className="text-sm text-gray-600">
                      Cerrada: {format(new Date(area.fecha_cierre), "dd/MM/yyyy HH:mm")}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label className="text-sm text-gray-600">Porcentaje de completitud</Label>
                    <div className="mt-2">
                      <Progress value={area.porcentaje_completitud} className="h-2" />
                      <p className="text-sm font-semibold mt-1">{area.porcentaje_completitud.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Cantidad de clasificados</Label>
                    <p className="text-lg font-semibold mt-1">{area.cantidad_clasificados}</p>
                    <p className="text-xs text-gray-500">de {area.total_participantes} participantes</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Coordinador responsable</Label>
                    <p className="text-sm mt-1">{area.coordinador_nombre || "No asignado"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal Extender Fecha */}
      <Dialog open={showExtenderFecha} onOpenChange={setShowExtenderFecha}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Extender Fecha de Cierre</DialogTitle>
            <DialogDescription>
              Seleccione una nueva fecha de fin para la fase clasificatoria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nueva_fecha">Nueva Fecha de Fin</Label>
              <Input
                id="nueva_fecha"
                type="datetime-local"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                min={faseGeneral?.fecha_fin_efectiva || undefined}
              />
            </div>
            <div>
              <Label htmlFor="justificacion">Justificación</Label>
              <Textarea
                id="justificacion"
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Explique el motivo de la extensión..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtenderFecha(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExtenderFecha} disabled={extendiendo}>
              {extendiendo ? "Extendiendo..." : "Extender Fecha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cerrar Fase */}
      <Dialog open={showCerrarFase} onOpenChange={setShowCerrarFase}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Confirmar Cierre de Fase General
            </DialogTitle>
            <DialogDescription>
              Esta acción cerrará la fase clasificatoria de todo el sistema. Revise el resumen antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold mb-2">Resumen del Impacto:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Se cerrarán <strong>{faseGeneral?.areas_cerradas || 0}</strong> áreas
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Se migrarán <strong>{resumen?.total_clasificados || 0}</strong> clasificados a fase final
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Se excluirán <strong>{resumen?.no_clasificados_excluidos || 0}</strong> no clasificados
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Se excluirán <strong>{resumen?.desclasificados_excluidos || 0}</strong> desclasificados
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Se generará reporte consolidado (PDF)
                </li>
              </ul>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmar"
                checked={confirmado}
                onCheckedChange={(checked) => setConfirmado(checked as boolean)}
              />
              <Label htmlFor="confirmar" className="cursor-pointer">
                Confirmo que he revisado todos los datos
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCerrarFase(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCerrarFase} disabled={!confirmado || cerrando}>
              {cerrando ? "Cerrando..." : "Cerrar Fase General"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Revertir Cierre */}
      <Dialog open={showRevertirCierre} onOpenChange={setShowRevertirCierre}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Revertir Cierre de Fase General
            </DialogTitle>
            <DialogDescription>
              Esta acción revertirá el cierre de la fase clasificatoria. Solo se puede revertir dentro de las primeras 24 horas después del cierre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold mb-2 text-orange-800">Advertencia:</h4>
              <ul className="space-y-2 text-sm text-orange-700">
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Se eliminarán las asignaciones de fase final creadas durante el cierre
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  El estado de la fase volverá a "activa"
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Esta acción se registra en el log de auditoría
                </li>
              </ul>
            </div>
            <div>
              <Label htmlFor="justificacion-revertir">Justificación *</Label>
              <Textarea
                id="justificacion-revertir"
                placeholder="Explique el motivo de la reversión del cierre..."
                value={justificacionRevertir}
                onChange={(e) => setJustificacionRevertir(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmar-revertir"
                checked={confirmadoRevertir}
                onCheckedChange={(checked) => setConfirmadoRevertir(checked as boolean)}
              />
              <Label htmlFor="confirmar-revertir" className="cursor-pointer">
                Confirmo que deseo revertir el cierre de fase
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRevertirCierre(false)
              setJustificacionRevertir("")
              setConfirmadoRevertir(false)
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRevertirCierre} 
              disabled={!confirmadoRevertir || !justificacionRevertir.trim() || revirtiendo}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {revirtiendo ? "Revirtiendo..." : "Revertir Cierre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

