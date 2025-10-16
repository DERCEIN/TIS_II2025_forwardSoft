"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/NotificationProvider'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Download,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface SolicitudCambio {
  id: number
  evaluacion_id: number
  tipo_evaluacion: 'clasificacion' | 'final'
  evaluador_id: number
  evaluador_nombre: string
  evaluador_email: string
  participante_nombre: string
  area_competencia: string
  nivel_competencia: string
  valor_anterior: number
  valor_nuevo: number
  motivo_cambio: string
  observaciones_evaluador?: string
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  fecha_solicitud: string
  fecha_revision?: string
  observaciones_coordinador?: string
}

interface EstadisticasArea {
  total_solicitudes: number
  pendientes: number
  aprobadas: number
  rechazadas: number
  tasa_aprobacion: number
  cambios_por_evaluador: Array<{
    evaluador_nombre: string
    total_cambios: number
    aprobados: number
    rechazados: number
  }>
}

export default function AprobacionesPage() {
  const { user } = useAuth()
  const { success, error, warning } = useNotifications()
  
  const [solicitudes, setSolicitudes] = useState<SolicitudCambio[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasArea | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [filterEvaluador, setFilterEvaluador] = useState<string>('todos')
  
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudCambio | null>(null)
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | 'solicitar_info'>('aprobar')
  const [observacionesCoordinador, setObservacionesCoordinador] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSolicitudes()
    fetchEstadisticas()
  }, [])

  const fetchSolicitudes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/coordinador/solicitudes-pendientes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSolicitudes(data.data || [])
      }
    } catch (err) {
      error('Error', 'No se pudieron cargar las solicitudes')
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      const response = await fetch('/api/coordinador/estadisticas-aprobaciones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data.data)
      }
    } catch (err) {
      console.error('Error fetching estadísticas:', err)
    }
  }

  const handleRevisarSolicitud = (solicitud: SolicitudCambio) => {
    setSelectedSolicitud(solicitud)
    setAccion('aprobar')
    setObservacionesCoordinador('')
    setIsModalOpen(true)
  }

  const handleProcesarSolicitud = async () => {
    if (!selectedSolicitud) return

    if (accion === 'solicitar_info' && !observacionesCoordinador.trim()) {
      warning('Observaciones requeridas', 'Debes agregar observaciones para solicitar más información')
      return
    }

    setSubmitting(true)
    
    try {
      const response = await fetch(`/api/coordinador/solicitudes-cambio/${selectedSolicitud.id}/procesar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          accion,
          observaciones: observacionesCoordinador
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        
        setSolicitudes(prev => prev.map(s => 
          s.id === selectedSolicitud.id 
            ? { ...s, estado: accion === 'aprobar' ? 'aprobado' : 'rechazado', observaciones_coordinador: observacionesCoordinador }
            : s
        ))

        const mensaje = accion === 'aprobar' ? 'Solicitud aprobada exitosamente' : 
                       accion === 'rechazar' ? 'Solicitud rechazada' : 
                       'Solicitud de información enviada'
        
        success('Procesado', mensaje)
        
        // Refresh estadísticas
        fetchEstadisticas()
        
        setIsModalOpen(false)
        setSelectedSolicitud(null)
      }
    } catch (err) {
      error('Error', 'No se pudo procesar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>
      case 'aprobado':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Aprobado</Badge>
      case 'rechazado':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rechazado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getTipoEvaluacionBadge = (tipo: string) => {
    return tipo === 'clasificacion' 
      ? <Badge variant="outline">Clasificación</Badge>
      : <Badge variant="outline">Final</Badge>
  }

  const filteredSolicitudes = solicitudes.filter(solicitud => {
    const matchesSearch = solicitud.participante_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         solicitud.evaluador_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         solicitud.area_competencia.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = filterEstado === 'todos' || solicitud.estado === filterEstado
    const matchesEvaluador = filterEvaluador === 'todos' || solicitud.evaluador_id.toString() === filterEvaluador
    return matchesSearch && matchesEstado && matchesEvaluador
  })

  const evaluadoresUnicos = Array.from(new Set(solicitudes.map(s => s.evaluador_id)))
    .map(id => solicitudes.find(s => s.evaluador_id === id))
    .filter(Boolean)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Aprobaciones de Cambios</h1>
          <p className="text-muted-foreground">Revisa y aprueba solicitudes de modificación de notas</p>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Solicitudes</p>
                  <p className="text-2xl font-bold">{estadisticas.total_solicitudes}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-orange-600">{estadisticas.pendientes}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprobadas</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.aprobadas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasa Aprobación</p>
                  <p className="text-2xl font-bold text-blue-600">{estadisticas.tasa_aprobacion}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Solicitudes Pendientes</CardTitle>
              <CardDescription>
                Revisa las solicitudes de cambio de notas de tu área
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por participante o evaluador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="aprobado">Aprobados</SelectItem>
                  <SelectItem value="rechazado">Rechazados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEvaluador} onValueChange={setFilterEvaluador}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los evaluadores</SelectItem>
                  {evaluadoresUnicos.map((evaluador) => (
                    <SelectItem key={evaluador!.evaluador_id} value={evaluador!.evaluador_id.toString()}>
                      {evaluador!.evaluador_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Cargando solicitudes...</p>
            </div>
          ) : filteredSolicitudes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hay solicitudes</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterEstado !== 'todos' || filterEvaluador !== 'todos'
                  ? 'No se encontraron solicitudes con los filtros aplicados'
                  : 'No hay solicitudes pendientes de revisión'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSolicitudes.map((solicitud) => (
                <Card key={solicitud.id} className={`border-l-4 ${
                  solicitud.estado === 'pendiente' ? 'border-l-orange-500' :
                  solicitud.estado === 'aprobado' ? 'border-l-green-500' :
                  'border-l-red-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <h3 className="font-semibold text-foreground">
                            {solicitud.participante_nombre}
                          </h3>
                          {getEstadoBadge(solicitud.estado)}
                          {getTipoEvaluacionBadge(solicitud.tipo_evaluacion)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Evaluador:</span>
                            <p className="font-medium">{solicitud.evaluador_nombre}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Área:</span>
                            <p className="font-medium">{solicitud.area_competencia}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cambio:</span>
                            <p className="font-medium">
                              {solicitud.valor_anterior} → {solicitud.valor_nuevo}
                              <span className={`ml-2 ${solicitud.valor_nuevo > solicitud.valor_anterior ? 'text-green-600' : 'text-red-600'}`}>
                                ({solicitud.valor_nuevo > solicitud.valor_anterior ? '+' : ''}{solicitud.valor_nuevo - solicitud.valor_anterior})
                              </span>
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fecha:</span>
                            <p className="font-medium">
                              {new Date(solicitud.fecha_solicitud).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Motivo:</span>
                          <p className="text-sm mt-1">{solicitud.motivo_cambio}</p>
                        </div>
                        
                        {solicitud.observaciones_evaluador && (
                          <div>
                            <span className="text-muted-foreground">Observaciones del Evaluador:</span>
                            <p className="text-sm mt-1">{solicitud.observaciones_evaluador}</p>
                          </div>
                        )}
                        
                        {solicitud.observaciones_coordinador && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Observaciones del Coordinador:</strong> {solicitud.observaciones_coordinador}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {solicitud.estado === 'pendiente' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleRevisarSolicitud(solicitud)}
                          >
                            Revisar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Revisión */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Solicitud de Cambio</DialogTitle>
            <DialogDescription>
              Revisa la solicitud y decide si aprobar o rechazar el cambio
            </DialogDescription>
          </DialogHeader>
          
          {selectedSolicitud && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Participante</Label>
                  <p className="font-medium">{selectedSolicitud.participante_nombre}</p>
                </div>
                <div>
                  <Label>Evaluador</Label>
                  <p className="font-medium">{selectedSolicitud.evaluador_nombre}</p>
                </div>
                <div>
                  <Label>Área de Competencia</Label>
                  <p className="font-medium">{selectedSolicitud.area_competencia}</p>
                </div>
                <div>
                  <Label>Tipo de Evaluación</Label>
                  <p className="font-medium capitalize">{selectedSolicitud.tipo_evaluacion}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Puntuación Actual</Label>
                  <p className="text-2xl font-bold">{selectedSolicitud.valor_anterior}</p>
                </div>
                <div>
                  <Label>Nueva Puntuación</Label>
                  <p className="text-2xl font-bold">{selectedSolicitud.valor_nuevo}</p>
                </div>
              </div>

              <div>
                <Label>Motivo del Cambio</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedSolicitud.motivo_cambio}</p>
              </div>

              {selectedSolicitud.observaciones_evaluador && (
                <div>
                  <Label>Observaciones del Evaluador</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedSolicitud.observaciones_evaluador}</p>
                </div>
              )}

              <div>
                <Label htmlFor="accion">Acción a tomar</Label>
                <Select value={accion} onValueChange={(value: any) => setAccion(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobar">✅ Aprobar Cambio</SelectItem>
                    <SelectItem value="rechazar">❌ Rechazar Cambio</SelectItem>
                    <SelectItem value="solicitar_info">💬 Solicitar Más Información</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones del Coordinador</Label>
                <Textarea 
                  id="observaciones" 
                  placeholder="Agrega observaciones sobre tu decisión..."
                  value={observacionesCoordinador}
                  onChange={(e) => setObservacionesCoordinador(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleProcesarSolicitud} disabled={submitting}>
              {submitting ? 'Procesando...' : 
               accion === 'aprobar' ? 'Aprobar Cambio' :
               accion === 'rechazar' ? 'Rechazar Cambio' :
               'Solicitar Información'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
